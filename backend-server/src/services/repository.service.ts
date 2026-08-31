import { Prisma } from "@prisma/client";
import { database } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { getGithubAccessToken } from "./integration.service.js";
import { fetchAuthorizedRepositories } from "../integrations/github.adapter.js";

export async function discoverGithubRepositories(organizationId: string) {
  const token = await getGithubAccessToken(organizationId);
  const repos = await fetchAuthorizedRepositories(token);
  const tracked = await database.repository.findMany({
    where: { organizationId, provider: "GITHUB" },
    select: { externalId: true },
  });
  const trackedIds = new Set(tracked.map((row) => row.externalId));

  return repos.map((repo) => ({
    externalId: String(repo.id),
    name: repo.name,
    fullName: repo.full_name,
    url: repo.html_url,
    private: repo.private,
    updatedAt: repo.updated_at,
    alreadyTracked: trackedIds.has(String(repo.id)),
  }));
}

export async function trackRepository(
  organizationId: string,
  input: { externalId: string; name: string; fullName: string; url: string; projectId?: string },
) {
  try {
    return await database.repository.create({
      data: {
        organizationId,
        provider: "GITHUB",
        externalId: input.externalId,
        name: input.name,
        fullName: input.fullName,
        url: input.url,
        projectId: input.projectId,
        isSelected: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "CONFLICT", "This repository is already tracked.");
    }
    throw error;
  }
}

export async function listRepositories(organizationId: string) {
  return database.repository.findMany({
    where: { organizationId },
    include: {
      _count: { select: { issues: true, pullRequests: true, commits: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

async function findOwnedRepository(organizationId: string, repositoryId: string) {
  const repository = await database.repository.findUnique({ where: { id: repositoryId } });
  if (!repository || repository.organizationId !== organizationId) {
    throw new AppError(404, "RESOURCE_NOT_FOUND", "Repository not found.");
  }
  return repository;
}

export async function getRepository(organizationId: string, repositoryId: string) {
  await findOwnedRepository(organizationId, repositoryId);
  return database.repository.findUniqueOrThrow({
    where: { id: repositoryId },
    include: {
      _count: { select: { issues: true, pullRequests: true, commits: true, reviews: true } },
    },
  });
}

export async function untrackRepository(organizationId: string, repositoryId: string) {
  await findOwnedRepository(organizationId, repositoryId);
  await database.repository.delete({ where: { id: repositoryId } });
}

export async function getRepositoryActivity(organizationId: string, repositoryId: string) {
  await findOwnedRepository(organizationId, repositoryId);
  const [recentCommits, recentIssues, recentPullRequests] = await Promise.all([
    database.commit.findMany({ where: { repositoryId }, orderBy: { authoredAt: "desc" }, take: 20 }),
    database.issue.findMany({ where: { repositoryId }, orderBy: { openedAt: "desc" }, take: 20 }),
    database.pullRequest.findMany({ where: { repositoryId }, orderBy: { openedAt: "desc" }, take: 20, include: { reviews: true } }),
  ]);
  return { recentCommits, recentIssues, recentPullRequests };
}
