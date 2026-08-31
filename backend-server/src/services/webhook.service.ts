import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { database } from "../config/database.js";

export function isWebhookConfigured() {
  return Boolean(env.GITHUB_WEBHOOK_SECRET);
}

export function verifyGithubSignature(rawBody: Buffer, signatureHeader: string | undefined) {
  if (!env.GITHUB_WEBHOOK_SECRET || !signatureHeader?.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", env.GITHUB_WEBHOOK_SECRET).update(rawBody).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && timingSafeEqual(a, b);
}

type GithubWebhookPayload = {
  repository?: { id: number };
  action?: string;
  pull_request?: { id: number; number: number; title: string; state: string; merged_at: string | null; created_at: string; closed_at: string | null };
  issue?: { id: number; number: number; title: string; state: string; created_at: string; closed_at: string | null; pull_request?: unknown };
  head_commit?: { id: string; message: string; timestamp: string };
};

/**
 * Persists every webhook delivery for traceability (docs/specs.md §35), then
 * applies a minimal normalized update for events on a tracked repository.
 * Duplicate deliveries are safe: WebhookEvent has a unique [provider, externalId]
 * constraint on the GitHub delivery id, and the normalized upserts below are
 * idempotent on [repositoryId, externalId] just like the sync service.
 */
export async function processGithubWebhook(deliveryId: string, eventType: string, payload: GithubWebhookPayload) {
  const externalRepoId = payload.repository ? String(payload.repository.id) : null;
  const repository = externalRepoId
    ? await database.repository.findUnique({ where: { provider_externalId: { provider: "GITHUB", externalId: externalRepoId } } })
    : null;

  if (!repository) {
    // Event for a repository ForgeIQ doesn't track — acknowledge without storing.
    return { stored: false, processed: false };
  }

  const existing = await database.webhookEvent.findUnique({ where: { provider_externalId: { provider: "GITHUB", externalId: deliveryId } } });
  if (existing) return { stored: true, processed: Boolean(existing.processedAt) };

  const event = await database.webhookEvent.create({
    data: {
      organizationId: repository.organizationId,
      repositoryId: repository.id,
      provider: "GITHUB",
      externalId: deliveryId,
      eventType,
      payload: payload as unknown as object,
    },
  });

  if (eventType === "pull_request" && payload.pull_request) {
    const pr = payload.pull_request;
    const state = pr.merged_at ? "MERGED" : pr.state === "closed" ? "CLOSED" : "OPEN";
    await database.pullRequest.upsert({
      where: { repositoryId_externalId: { repositoryId: repository.id, externalId: String(pr.id) } },
      create: {
        organizationId: repository.organizationId,
        repositoryId: repository.id,
        externalId: String(pr.id),
        number: pr.number,
        title: pr.title,
        state,
        openedAt: new Date(pr.created_at),
        closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
        mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
      },
      update: { title: pr.title, state, closedAt: pr.closed_at ? new Date(pr.closed_at) : null, mergedAt: pr.merged_at ? new Date(pr.merged_at) : null },
    });
  } else if (eventType === "issues" && payload.issue && !payload.issue.pull_request) {
    const issue = payload.issue;
    await database.issue.upsert({
      where: { repositoryId_externalId: { repositoryId: repository.id, externalId: String(issue.id) } },
      create: {
        organizationId: repository.organizationId,
        repositoryId: repository.id,
        externalId: String(issue.id),
        number: issue.number,
        title: issue.title,
        state: issue.state === "closed" ? "CLOSED" : "OPEN",
        openedAt: new Date(issue.created_at),
        closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
      },
      update: { title: issue.title, state: issue.state === "closed" ? "CLOSED" : "OPEN", closedAt: issue.closed_at ? new Date(issue.closed_at) : null },
    });
  } else if (eventType === "push" && payload.head_commit) {
    const commit = payload.head_commit;
    await database.commit.upsert({
      where: { repositoryId_externalId: { repositoryId: repository.id, externalId: commit.id } },
      create: {
        organizationId: repository.organizationId,
        repositoryId: repository.id,
        externalId: commit.id,
        message: commit.message.slice(0, 500),
        authoredAt: new Date(commit.timestamp),
      },
      update: {},
    });
  }

  await database.webhookEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } });
  return { stored: true, processed: true };
}
