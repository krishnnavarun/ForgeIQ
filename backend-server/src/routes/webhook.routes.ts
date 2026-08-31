import { Router } from "express";
import { githubWebhook } from "../controllers/webhook.controller.js";

export const webhookRouter = Router();

webhookRouter.post("/github", githubWebhook);
