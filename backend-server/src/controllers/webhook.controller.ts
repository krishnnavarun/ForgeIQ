import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { processGithubWebhook, verifyGithubSignature } from "../services/webhook.service.js";

export async function githubWebhook(request: Request, response: Response) {
  const signature = request.header("x-hub-signature-256");
  if (!request.rawBody || !verifyGithubSignature(request.rawBody, signature)) {
    throw new AppError(401, "INVALID_WEBHOOK_SIGNATURE", "Webhook signature verification failed.");
  }

  const deliveryId = request.header("x-github-delivery");
  const eventType = request.header("x-github-event");
  if (!deliveryId || !eventType) {
    throw new AppError(400, "VALIDATION_ERROR", "Missing GitHub webhook headers.");
  }

  const result = await processGithubWebhook(deliveryId, eventType, request.body);
  response.status(202).json(result);
}
