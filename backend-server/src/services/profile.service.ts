import { Prisma } from "@prisma/client";
import { database } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import type { ProjectInput, ProjectUpdateInput, UpdateProfileInput } from "../validators/profile.validators.js";

const profileSelect = {
  id: true,
  email: true,
  displayName: true,
  headline: true,
  bio: true,
  location: true,
  githubUsername: true,
  websiteUrl: true,
  linkedinUrl: true,
  skills: true,
  openToOpportunities: true,
  profileVisibility: true,
  createdAt: true,
  memberships: {
    select: { organizationId: true, role: true },
  },
  projects: {
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.UserSelect;

export async function getProfile(userId: string) {
  const profile = await database.user.findUnique({ where: { id: userId }, select: profileSelect });
  if (!profile) throw new AppError(404, "NOT_FOUND", "Profile not found.");
  return profile;
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  return database.user.update({
    where: { id: userId },
    data: input,
    select: profileSelect,
  });
}

export async function createProject(userId: string, input: ProjectInput) {
  return database.developerProject.create({
    data: { ...input, userId },
  });
}

export async function updateProject(userId: string, projectId: string, input: ProjectUpdateInput) {
  const project = await database.developerProject.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== userId) {
    throw new AppError(404, "NOT_FOUND", "Project not found.");
  }
  return database.developerProject.update({ where: { id: projectId }, data: input });
}

export async function deleteProject(userId: string, projectId: string) {
  const project = await database.developerProject.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== userId) {
    throw new AppError(404, "NOT_FOUND", "Project not found.");
  }
  await database.developerProject.delete({ where: { id: projectId } });
}
