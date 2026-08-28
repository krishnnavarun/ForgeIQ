import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { validate } from "../middleware/validate.js";

const healthQuerySchema = z.object({
  details: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
});

export const healthRouter = Router();

healthRouter.get("/health", validate({ query: healthQuerySchema }), (request, response) => {
  const { details } = healthQuerySchema.parse(request.query);
  const payload = {
    status: "ok",
    service: "forgeiq-backend",
    timestamp: new Date().toISOString(),
  };

  response.json(details ? { ...payload, environment: env.NODE_ENV, version: "v1" } : payload);
});