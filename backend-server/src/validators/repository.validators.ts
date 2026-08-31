import { z } from "zod";
import { organizationIdParamsSchema } from "./organization.validators.js";

export const trackRepositorySchema = z.object({
  externalId: z.string().min(1),
  name: z.string().min(1),
  fullName: z.string().min(1),
  url: z.string().url(),
  projectId: z.string().min(1).optional(),
});

export const repositoryParamsSchema = organizationIdParamsSchema.extend({
  repositoryId: z.string().min(1),
});

export type TrackRepositoryInput = z.infer<typeof trackRepositorySchema>;
