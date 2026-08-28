import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { v1Router } from "./routes/v1.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: env.FRONTEND_URL }));
  app.use(express.json());
  app.use(requestLogger);
  app.use("/api/v1", v1Router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}