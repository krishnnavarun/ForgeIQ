import { z } from "zod";

const blankToNull = (value: unknown) => (typeof value === "string" && value.trim() === "" ? null : value);

const optionalUrl = z.preprocess(blankToNull, z.string().trim().url().max(300).nullable().optional());

const optionalText = (max: number) => z.preprocess(blankToNull, z.string().trim().max(max).nullable().optional());

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  headline: optionalText(140),
  bio: optionalText(600),
  location: optionalText(100),
  githubUsername: optionalText(60),
  websiteUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  skills: z.array(z.string().trim().min(1).max(30)).max(24).optional(),
  openToOpportunities: z.boolean().optional(),
  profileVisibility: z.enum(["PRIVATE", "ORGANIZATION", "PUBLIC"]).optional(),
});

export const projectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: optionalText(500),
  projectUrl: optionalUrl,
  repoUrl: optionalUrl,
  tags: z.array(z.string().trim().min(1).max(24)).max(12).optional(),
});

export const projectUpdateSchema = projectSchema.partial();

export const projectIdParamsSchema = z.object({
  projectId: z.string().min(1),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
