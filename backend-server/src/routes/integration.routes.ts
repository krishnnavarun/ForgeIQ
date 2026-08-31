import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireOrgMember, requireOrgRole } from "../middleware/requireOrgRole.js";
import { validate } from "../middleware/validate.js";
import * as integrationController from "../controllers/integration.controller.js";
import { organizationIdParamsSchema } from "../validators/organization.validators.js";

// Mounted at /organizations/:organizationId/integrations. The GitHub OAuth
// callback itself is a fixed, unauthenticated path registered separately in
// organization.routes.ts, since GitHub redirects the browser directly to it.
export const integrationRouter = Router({ mergeParams: true });

integrationRouter.use(authenticate);

integrationRouter.get(
  "/",
  validate({ params: organizationIdParamsSchema }),
  requireOrgMember(),
  integrationController.listIntegrations,
);
integrationRouter.get(
  "/github/start",
  validate({ params: organizationIdParamsSchema }),
  requireOrgRole("ADMIN", "MANAGER"),
  integrationController.githubStart,
);
integrationRouter.delete(
  "/github",
  validate({ params: organizationIdParamsSchema }),
  requireOrgRole("ADMIN", "MANAGER"),
  integrationController.disconnectGithub,
);
