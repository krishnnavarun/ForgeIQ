import { Prisma } from "@prisma/client";
import { database } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { recordAuditLog } from "./audit.service.js";
import type { CandidateSearchQuery } from "../validators/organization.validators.js";

const candidateSelect = {
  id: true,
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
  projects: { select: { id: true, title: true, description: true, projectUrl: true, repoUrl: true, tags: true } },
} satisfies Prisma.UserSelect;

/**
 * Privacy boundary for candidate discovery (roadmap Phase 16/20):
 * - PRIVATE profiles are never returned here.
 * - PUBLIC profiles are discoverable by any organization.
 * - ORGANIZATION profiles are only discoverable by orgs the candidate has
 *   explicitly expressed interest in via OrganizationCandidateInterest.
 * Organizations never get automatic access to all candidate data.
 */
export async function searchCandidates(organizationId: string, query: CandidateSearchQuery) {
  const interestedUserIds = await database.organizationCandidateInterest.findMany({
    where: { organizationId },
    select: { userId: true },
  });
  const interestedIds = interestedUserIds.map((row) => row.userId);

  const visibilityFilter: Prisma.UserWhereInput = {
    OR: [{ profileVisibility: "PUBLIC" }, { profileVisibility: "ORGANIZATION", id: { in: interestedIds } }],
  };

  const textFilters: Prisma.UserWhereInput[] = [];
  if (query.skill) textFilters.push({ skills: { has: query.skill } });
  if (query.search) {
    textFilters.push({
      OR: [
        { displayName: { contains: query.search, mode: "insensitive" } },
        { headline: { contains: query.search, mode: "insensitive" } },
      ],
    });
  }

  const where: Prisma.UserWhereInput = { AND: [visibilityFilter, ...textFilters] };

  const [total, candidates] = await Promise.all([
    database.user.count({ where }),
    database.user.findMany({
      where,
      select: candidateSelect,
      orderBy: { updatedAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { total, page: query.page, pageSize: query.pageSize, candidates };
}

export async function setCandidateInterest(organizationId: string, userId: string, interested: boolean) {
  const organization = await database.organization.findUnique({ where: { id: organizationId }, select: { id: true } });
  if (!organization) throw new AppError(404, "RESOURCE_NOT_FOUND", "Organization not found.");

  if (interested) {
    await database.organizationCandidateInterest.upsert({
      where: { organizationId_userId: { organizationId, userId } },
      create: { organizationId, userId },
      update: {},
    });
  } else {
    await database.organizationCandidateInterest.deleteMany({ where: { organizationId, userId } });
  }
}

export async function listMyInterests(userId: string) {
  const interests = await database.organizationCandidateInterest.findMany({
    where: { userId },
    select: { organization: { select: { id: true, name: true, slug: true } } },
  });
  return interests.map((row) => row.organization);
}

export async function addToShortlist(organizationId: string, addedByUserId: string, candidateUserId: string, note?: string) {
  const candidate = await database.user.findUnique({ where: { id: candidateUserId }, select: { profileVisibility: true } });
  if (!candidate || candidate.profileVisibility === "PRIVATE") {
    throw new AppError(404, "RESOURCE_NOT_FOUND", "Candidate not found.");
  }
  const entry = await database.candidateShortlist.upsert({
    where: { organizationId_candidateUserId: { organizationId, candidateUserId } },
    create: { organizationId, candidateUserId, addedByUserId, note },
    update: { note },
  });
  await recordAuditLog({
    organizationId,
    actorUserId: addedByUserId,
    action: "CANDIDATE_SHORTLISTED",
    resourceType: "CandidateShortlist",
    resourceId: entry.id,
    metadata: { candidateUserId },
  });
  return entry;
}

export async function removeFromShortlist(organizationId: string, actorUserId: string, candidateUserId: string) {
  await database.candidateShortlist.deleteMany({ where: { organizationId, candidateUserId } });
  await recordAuditLog({
    organizationId,
    actorUserId,
    action: "CANDIDATE_UNSHORTLISTED",
    resourceType: "CandidateShortlist",
    metadata: { candidateUserId },
  });
}

export async function listShortlist(organizationId: string) {
  return database.candidateShortlist.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: { candidate: { select: candidateSelect } },
  });
}
