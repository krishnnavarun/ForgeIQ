import { Prisma } from "@prisma/client";
import { database } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import type { CreateProjectInput, UpdateProjectInput } from "../validators/project.validators.js";

export async function listProjects(organizationId: string) {
  return database.project.findMany({
    where: { organizationId },
    include: { _count: { select: { repositories: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProject(organizationId: string, input: CreateProjectInput) {
  try {
    return await database.project.create({ data: { organizationId, ...input } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "CONFLICT", "A project with that name already exists in this organization.");
    }
    throw error;
  }
}

async function findOwnedProject(organizationId: string, projectId: string) {
  const project = await database.project.findUnique({ where: { id: projectId } });
  if (!project || project.organizationId !== organizationId) {
    throw new AppError(404, "RESOURCE_NOT_FOUND", "Project not found.");
  }
  return project;
}

export async function getProject(organizationId: string, projectId: string) {
  await findOwnedProject(organizationId, projectId);
  return database.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { repositories: { orderBy: { createdAt: "desc" } } },
  });
}

export async function updateProject(organizationId: string, projectId: string, input: UpdateProjectInput) {
  await findOwnedProject(organizationId, projectId);
  return database.project.update({ where: { id: projectId }, data: input });
}

export async function deleteProject(organizationId: string, projectId: string) {
  await findOwnedProject(organizationId, projectId);
  await database.project.delete({ where: { id: projectId } });
}
