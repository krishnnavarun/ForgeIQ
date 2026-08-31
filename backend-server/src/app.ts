import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { v1Router } from "./routes/v1.routes.js";

const generalLimiter = rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_URL }));
  // Captures the raw request body alongside the parsed one so webhook routes
  // can verify HMAC signatures against the exact bytes GitHub signed.
  app.use(
    express.json({
      verify: (request, _response, buffer) => {
        (request as express.Request).rawBody = buffer;
      },
    }),
  );
  app.use(requestLogger);
  app.use("/api/v1/auth", authLimiter);
  app.use("/api/v1", generalLimiter, v1Router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}