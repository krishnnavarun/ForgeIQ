import { z } from "zod";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional().or(z.literal("").transform(() => null)),
});

export const organizationIdParamsSchema = z.object({
  organizationId: z.string().min(1),
});

export const memberParamsSchema = organizationIdParamsSchema.extend({
  userId: z.string().min(1),
});

export const inviteParamsSchema = organizationIdParamsSchema.extend({
  inviteId: z.string().min(1),
});

const ASSIGNABLE_ROLES = ["ADMIN", "MANAGER", "DEVELOPER", "VIEWER", "RECRUITER"] as const;

export const createInviteSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  role: z.enum(ASSIGNABLE_ROLES).default("DEVELOPER"),
});

export const acceptInviteParamsSchema = z.object({
  token: z.string().min(1),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(ASSIGNABLE_ROLES),
});

export const candidateSearchQuerySchema = z.object({
  skill: z.string().trim().max(30).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const candidateParamsSchema = organizationIdParamsSchema.extend({
  userId: z.string().min(1),
});

export const shortlistNoteSchema = z.object({
  note: z.string().trim().max(300).optional(),
});

export { slugify };
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type CandidateSearchQuery = z.infer<typeof candidateSearchQuerySchema>;
