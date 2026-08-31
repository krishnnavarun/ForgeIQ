import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireOrgRole } from "../middleware/requireOrgRole.js";
import { validate } from "../middleware/validate.js";
import * as aiController from "../controllers/ai.controller.js";
import { organizationIdParamsSchema } from "../validators/organization.validators.js";
import { generateInsightSchema } from "../validators/ai.validators.js";

// AI insights are gated to ADMIN/MANAGER/DEVELOPER — VIEWER is excluded per
// docs/specs.md §11 ("AI insights: Viewer Optional"), simplified here to "not
// included in the MVP" rather than a separate opt-in toggle.
export const aiRouter = Router({ mergeParams: true });

aiRouter.use(authenticate);

aiRouter.get(
  "/",
  validate({ params: organizationIdParamsSchema }),
  requireOrgRole("ADMIN", "MANAGER", "DEVELOPER"),
  aiController.listInsights,
);
aiRouter.post(
  "/",
  validate({ params: organizationIdParamsSchema, body: generateInsightSchema }),
  requireOrgRole("ADMIN", "MANAGER", "DEVELOPER"),
  aiController.generateInsight,
);
