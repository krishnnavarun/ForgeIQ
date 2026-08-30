import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(32).default("forgeiq-development-secret-change-me-now"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(7),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().default("http://localhost:5000/api/v1/auth/google/callback"),
});

export const env = environmentSchema.parse(process.env);