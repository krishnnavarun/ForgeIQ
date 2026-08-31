import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { healthRouter } from "./health.routes.js";
import { profileRouter } from "./profile.routes.js";
import { organizationRouter } from "./organization.routes.js";
import { webhookRouter } from "./webhook.routes.js";

export const v1Router = Router();

v1Router.use(healthRouter);
v1Router.use("/auth", authRouter);
v1Router.use("/users", profileRouter);
v1Router.use("/organizations", organizationRouter);
v1Router.use("/webhooks", webhookRouter);