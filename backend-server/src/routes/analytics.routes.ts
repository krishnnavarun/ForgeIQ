import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireOrgMember } from "../middleware/requireOrgRole.js";
import { validate } from "../middleware/validate.js";
import { getOrganizationAnalytics } from "../controllers/analytics.controller.js";
import { organizationIdParamsSchema } from "../validators/organization.validators.js";

export const analyticsRouter = Router({ mergeParams: true });

analyticsRouter.use(authenticate);

analyticsRouter.get(
  "/",
  validate({ params: organizationIdParamsSchema }),
  requireOrgMember(),
  getOrganizationAnalytics,
);
