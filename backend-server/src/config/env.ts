import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(32).default("forgeiq-development-secret-change-me-now"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(7),
});

export const env = environmentSchema.parse(process.env);