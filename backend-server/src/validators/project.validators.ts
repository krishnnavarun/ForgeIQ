import { z } from "zod";
import { organizationIdParamsSchema } from "./organization.validators.js";

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectParamsSchema = organizationIdParamsSchema.extend({
  projectId: z.string().min(1),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
