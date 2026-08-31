import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireOrgMember, requireOrgRole } from "../middleware/requireOrgRole.js";
import { validate } from "../middleware/validate.js";
import * as repositoryController from "../controllers/repository.controller.js";
import { organizationIdParamsSchema } from "../validators/organization.validators.js";
import { repositoryParamsSchema, trackRepositorySchema } from "../validators/repository.validators.js";

export const repositoryRouter = Router({ mergeParams: true });

repositoryRouter.use(authenticate);

repositoryRouter.get(
  "/",
  validate({ params: organizationIdParamsSchema }),
  requireOrgMember(),
  repositoryController.list,
);
repositoryRouter.get(
  "/discover",
  validate({ params: organizationIdParamsSchema }),
  requireOrgRole("ADMIN", "MANAGER"),
  repositoryController.discover,
);
repositoryRouter.post(
  "/",
  validate({ params: organizationIdParamsSchema, body: trackRepositorySchema }),
  requireOrgRole("ADMIN", "MANAGER"),
  repositoryController.track,
);
repositoryRouter.get(
  "/:repositoryId",
  validate({ params: repositoryParamsSchema }),
  requireOrgMember(),
  repositoryController.get,
);
repositoryRouter.get(
  "/:repositoryId/activity",
  validate({ params: repositoryParamsSchema }),
  requireOrgMember(),
  repositoryController.activity,
);
repositoryRouter.post(
  "/:repositoryId/sync",
  validate({ params: repositoryParamsSchema }),
  requireOrgRole("ADMIN", "MANAGER"),
  repositoryController.sync,
);
repositoryRouter.delete(
  "/:repositoryId",
  validate({ params: repositoryParamsSchema }),
  requireOrgRole("ADMIN", "MANAGER"),
  repositoryController.untrack,
);
