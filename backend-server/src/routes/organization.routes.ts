import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireOrgMember, requireOrgRole } from "../middleware/requireOrgRole.js";
import { validate } from "../middleware/validate.js";
import * as organizationController from "../controllers/organization.controller.js";
import * as candidateController from "../controllers/candidate.controller.js";
import { githubCallback } from "../controllers/integration.controller.js";
import { projectRouter } from "./project.routes.js";
import { repositoryRouter } from "./repository.routes.js";
import { integrationRouter } from "./integration.routes.js";
import { analyticsRouter } from "./analytics.routes.js";
import { aiRouter } from "./ai.routes.js";
import {
  acceptInviteParamsSchema,
  candidateParamsSchema,
  candidateSearchQuerySchema,
  createInviteSchema,
  createOrganizationSchema,
  inviteParamsSchema,
  memberParamsSchema,
  organizationIdParamsSchema,
  shortlistNoteSchema,
  updateMemberRoleSchema,
  updateOrganizationSchema,
} from "../validators/organization.validators.js";

export const organizationRouter = Router();

// GitHub redirects the browser here directly after authorization — it carries
// no bearer token, so this must be registered before the authenticate() gate
// below and must not depend on req.auth (identity comes from the OAuth state).
organizationRouter.get("/integrations/github/callback", githubCallback);

organizationRouter.use(authenticate);

// Routes with a fixed literal segment must be declared before ":organizationId" below.
organizationRouter.get("/directory", organizationController.listDirectory);
organizationRouter.get("/my-interests", candidateController.listMyInterests);
organizationRouter.post(
  "/invites/:token/accept",
  validate({ params: acceptInviteParamsSchema }),
  organizationController.acceptInvite,
);

organizationRouter.post("/", validate({ body: createOrganizationSchema }), organizationController.createOrganization);
organizationRouter.get("/", organizationController.listMyOrganizations);

organizationRouter.use("/:organizationId/projects", projectRouter);
organizationRouter.use("/:organizationId/repositories", repositoryRouter);
organizationRouter.use("/:organizationId/integrations", integrationRouter);
organizationRouter.use("/:organizationId/analytics", analyticsRouter);
organizationRouter.use("/:organizationId/ai", aiRouter);

organizationRouter.get(
  "/:organizationId",
  validate({ params: organizationIdParamsSchema }),
  requireOrgMember(),
  organizationController.getOrganization,
);
organizationRouter.patch(
  "/:organizationId",
  validate({ params: organizationIdParamsSchema, body: updateOrganizationSchema }),
  requireOrgRole("ADMIN"),
  organizationController.updateOrganization,
);

organizationRouter.post(
  "/:organizationId/invites",
  validate({ params: organizationIdParamsSchema, body: createInviteSchema }),
  requireOrgRole("ADMIN"),
  organizationController.createInvite,
);
organizationRouter.get(
  "/:organizationId/invites",
  validate({ params: organizationIdParamsSchema }),
  requireOrgRole("ADMIN"),
  organizationController.listInvites,
);
organizationRouter.delete(
  "/:organizationId/invites/:inviteId",
  validate({ params: inviteParamsSchema }),
  requireOrgRole("ADMIN"),
  organizationController.revokeInvite,
);

organizationRouter.patch(
  "/:organizationId/members/:userId",
  validate({ params: memberParamsSchema, body: updateMemberRoleSchema }),
  requireOrgRole("ADMIN"),
  organizationController.updateMemberRole,
);
organizationRouter.delete(
  "/:organizationId/members/:userId",
  validate({ params: memberParamsSchema }),
  requireOrgRole("ADMIN"),
  organizationController.removeMember,
);

organizationRouter.get(
  "/:organizationId/audit-logs",
  validate({ params: organizationIdParamsSchema }),
  requireOrgRole("ADMIN", "MANAGER"),
  organizationController.listAuditLogs,
);

// Candidate interest: any authenticated developer may express/withdraw interest
// in an org they are not a member of — deliberately not gated by requireOrgRole.
organizationRouter.post(
  "/:organizationId/interest",
  validate({ params: organizationIdParamsSchema }),
  candidateController.expressInterest,
);
organizationRouter.delete(
  "/:organizationId/interest",
  validate({ params: organizationIdParamsSchema }),
  candidateController.withdrawInterest,
);

organizationRouter.get(
  "/:organizationId/candidates",
  validate({ params: organizationIdParamsSchema, query: candidateSearchQuerySchema }),
  requireOrgRole("ADMIN", "MANAGER", "RECRUITER"),
  candidateController.searchCandidates,
);
organizationRouter.get(
  "/:organizationId/shortlist",
  validate({ params: organizationIdParamsSchema }),
  requireOrgRole("ADMIN", "MANAGER", "RECRUITER"),
  candidateController.listShortlist,
);
organizationRouter.post(
  "/:organizationId/candidates/:userId/shortlist",
  validate({ params: candidateParamsSchema, body: shortlistNoteSchema }),
  requireOrgRole("ADMIN", "MANAGER", "RECRUITER"),
  candidateController.addToShortlist,
);
organizationRouter.delete(
  "/:organizationId/candidates/:userId/shortlist",
  validate({ params: candidateParamsSchema }),
  requireOrgRole("ADMIN", "MANAGER", "RECRUITER"),
  candidateController.removeFromShortlist,
);
