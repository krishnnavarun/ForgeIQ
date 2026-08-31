import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireOrgMember, requireOrgRole } from "../middleware/requireOrgRole.js";
import { validate } from "../middleware/validate.js";
import * as projectController from "../controllers/project.controller.js";
import { createProjectSchema, projectParamsSchema, updateProjectSchema } from "../validators/project.validators.js";
import { organizationIdParamsSchema } from "../validators/organization.validators.js";

export const projectRouter = Router({ mergeParams: true });

projectRouter.use(authenticate);

projectRouter.get(
  "/",
  validate({ params: organizationIdParamsSchema }),
  requireOrgMember(),
  projectController.listProjects,
);
projectRouter.post(
  "/",
  validate({ params: organizationIdParamsSchema, body: createProjectSchema }),
  requireOrgRole("ADMIN", "MANAGER"),
  projectController.createProject,
);
projectRouter.get(
  "/:projectId",
  validate({ params: projectParamsSchema }),
  requireOrgMember(),
  projectController.getProject,
);
projectRouter.patch(
  "/:projectId",
  validate({ params: projectParamsSchema, body: updateProjectSchema }),
  requireOrgRole("ADMIN", "MANAGER"),
  projectController.updateProject,
);
projectRouter.delete(
  "/:projectId",
  validate({ params: projectParamsSchema }),
  requireOrgRole("ADMIN", "MANAGER"),
  projectController.deleteProject,
);
