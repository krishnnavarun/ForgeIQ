import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import * as aiService from "../services/ai.service.js";

export async function generateInsight(request: Request, response: Response) {
  if (!request.auth) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
  const { mode, projectId, question } = request.body;
  const insight = await aiService.generateInsight(request.params.organizationId as string, request.auth.userId, mode, {
    projectId,
    question,
  });
  response.status(201).json({ insight });
}

export async function listInsights(request: Request, response: Response) {
  const insights = await aiService.listInsights(request.params.organizationId as string);
  response.json({ insights, configured: aiService.isAIConfigured() });
}
