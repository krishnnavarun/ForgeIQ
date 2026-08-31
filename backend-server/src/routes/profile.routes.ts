import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  createMyProject,
  deleteMyProject,
  getMyProfile,
  updateMyProfile,
  updateMyProject,
} from "../controllers/profile.controller.js";
import {
  projectIdParamsSchema,
  projectSchema,
  projectUpdateSchema,
  updateProfileSchema,
} from "../validators/profile.validators.js";

export const profileRouter = Router();

profileRouter.use(authenticate);

profileRouter.get("/me/profile", getMyProfile);
profileRouter.patch("/me/profile", validate({ body: updateProfileSchema }), updateMyProfile);
profileRouter.post("/me/projects", validate({ body: projectSchema }), createMyProject);
profileRouter.patch(
  "/me/projects/:projectId",
  validate({ params: projectIdParamsSchema, body: projectUpdateSchema }),
  updateMyProject,
);
profileRouter.delete(
  "/me/projects/:projectId",
  validate({ params: projectIdParamsSchema }),
  deleteMyProject,
);
