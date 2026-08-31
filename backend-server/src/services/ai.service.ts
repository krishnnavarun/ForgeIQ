import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { database } from "../config/database.js";
import { getAnalytics } from "./analytics.service.js";
import { recordAuditLog } from "./audit.service.js";

export type AIMode = "weekly_summary" | "project_summary" | "bottleneck_explanation" | "question";

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const requestLog = new Map<string, number[]>();

export function isAIConfigured() {
  return Boolean(env.ANTHROPIC_API_KEY);
}

function checkRateLimit(userId: string) {
  const now = Date.now();
  const history = (requestLog.get(userId) ?? []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (history.length >= RATE_LIMIT_MAX) {
    throw new AppError(429, "AI_RATE_LIMITED", "AI insight limit reached. Try again later.");
  }
  history.push(now);
  requestLog.set(userId, history);
}

/**
 * Context builder: the ONLY authorized, verified engineering data the model
 * ever sees. It is built strictly from the requesting user's already-verified
 * organization scope (see requireOrgRole) — the AI layer never queries the
 * database directly, so it cannot reach data outside that scope.
 */
async function buildContext(organizationId: string, projectId?: string) {
  const [analytics, organization] = await Promise.all([
    getAnalytics(organizationId, projectId),
    database.organization.findUniqueOrThrow({ where: { id: organizationId }, select: { name: true } }),
  ]);
  return { organizationName: organization.name, analytics };
}

const SYSTEM_PROMPT = `You are ForgeIQ's grounded engineering-insight assistant.

Rules you must follow:
- Use ONLY the JSON data provided in the user message. Never invent metrics, counts, or dates.
- If the data does not contain enough information to answer, say so explicitly instead of guessing.
- Clearly separate measured facts (numbers from the data) from your own inference or interpretation.
- Never rank, score, or evaluate individual developers. This data is aggregated at the project/organization level only and contains no per-person information.
- Never make or imply an employment, hiring, or firing decision.
- Keep the response concise: a short summary paragraph, then a few bullet points citing specific numbers from the data.`;

function buildUserPrompt(mode: AIMode, context: Awaited<ReturnType<typeof buildContext>>, question?: string) {
  const dataBlock = JSON.stringify(context, null, 2);
  const asks: Record<AIMode, string> = {
    weekly_summary: "Write a short weekly engineering summary for this organization.",
    project_summary: "Summarize the current state of this project in a few sentences.",
    bottleneck_explanation: "Explain the detected bottlenecks below and their likely delivery impact.",
    question: question ? `Answer this question using only the data provided: "${question}"` : "Answer the question using only the data provided.",
  };
  return `${asks[mode]}\n\nOrganization engineering data (verified, from the database):\n${dataBlock}`;
}

export async function generateInsight(
  organizationId: string,
  actorUserId: string,
  mode: AIMode,
  options: { projectId?: string; question?: string } = {},
) {
  if (!isAIConfigured()) {
    throw new AppError(503, "AI_NOT_CONFIGURED", "AI insights are not configured on this server.");
  }
  checkRateLimit(actorUserId);

  const context = await buildContext(organizationId, options.projectId);
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 700,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(mode, context, options.question) }],
  });

  const summary = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!summary) {
    throw new AppError(502, "AI_EMPTY_RESPONSE", "The AI provider returned an empty response.");
  }

  const insight = await database.aIInsight.create({
    data: {
      organizationId,
      createdByUserId: actorUserId,
      title: mode === "question" ? (options.question ?? "Question").slice(0, 120) : mode.replace(/_/g, " "),
      summary,
      evidence: context.analytics as unknown as object,
    },
  });

  await recordAuditLog({
    organizationId,
    actorUserId,
    action: "AI_INSIGHT_GENERATED",
    resourceType: "AIInsight",
    resourceId: insight.id,
    metadata: { mode },
  });

  return insight;
}

export async function listInsights(organizationId: string) {
  return database.aIInsight.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 20 });
}
