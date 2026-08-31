import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { database } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { recordAuditLog } from "./audit.service.js";
import {
  slugify,
  type CreateInviteInput,
  type CreateOrganizationInput,
  type UpdateMemberRoleInput,
  type UpdateOrganizationInput,
} from "../validators/organization.validators.js";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function uniqueSlug(name: string) {
  const base = slugify(name) || "org";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${randomBytes(3).toString("hex")}`;
    const existing = await database.organization.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
  }
  return `${base}-${randomBytes(4).toString("hex")}`;
}

export async function createOrganization(userId: string, input: CreateOrganizationInput) {
  const slug = await uniqueSlug(input.name);
  return database.organization.create({
    data: {
      name: input.name,
      description: input.description,
      slug,
      members: { create: { userId, role: "ADMIN" } },
    },
    include: { members: { select: { userId: true, role: true } } },
  });
}

export async function listMyOrganizations(userId: string) {
  const memberships = await database.organizationMember.findMany({
    where: { userId },
    select: {
      role: true,
      organization: {
        select: { id: true, name: true, slug: true, description: true, createdAt: true, _count: { select: { members: true, projects: true } } },
      },
    },
  });
  return memberships.map((membership) => ({ ...membership.organization, myRole: membership.role }));
}

export async function listOrganizationDirectory() {
  return database.organization.findMany({
    select: { id: true, name: true, slug: true, description: true },
    orderBy: { name: "asc" },
    take: 200,
  });
}

export async function getOrganization(organizationId: string) {
  const organization = await database.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: {
        select: { userId: true, role: true, createdAt: true, user: { select: { id: true, email: true, displayName: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { projects: true, repositories: true } },
    },
  });
  if (!organization) throw new AppError(404, "RESOURCE_NOT_FOUND", "Organization not found.");
  return organization;
}

export async function updateOrganization(organizationId: string, actorUserId: string, input: UpdateOrganizationInput) {
  const organization = await database.organization.update({ where: { id: organizationId }, data: input });
  await recordAuditLog({
    organizationId,
    actorUserId,
    action: "ORGANIZATION_UPDATED",
    resourceType: "Organization",
    resourceId: organizationId,
    metadata: input as Prisma.InputJsonValue,
  });
  return organization;
}

export async function createInvite(organizationId: string, actorUserId: string, input: CreateInviteInput) {
  const existingMember = await database.organizationMember.findFirst({
    where: { organizationId, user: { email: input.email } },
  });
  if (existingMember) throw new AppError(409, "CONFLICT", "This person is already a member of the organization.");

  const invite = await database.organizationInvite.create({
    data: {
      organizationId,
      email: input.email,
      role: input.role,
      token: randomBytes(24).toString("hex"),
      invitedByUserId: actorUserId,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });
  await recordAuditLog({
    organizationId,
    actorUserId,
    action: "MEMBER_INVITED",
    resourceType: "OrganizationInvite",
    resourceId: invite.id,
    metadata: { email: input.email, role: input.role },
  });
  return invite;
}

export async function listInvites(organizationId: string) {
  return database.organizationInvite.findMany({
    where: { organizationId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeInvite(organizationId: string, actorUserId: string, inviteId: string) {
  const invite = await database.organizationInvite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.organizationId !== organizationId) {
    throw new AppError(404, "RESOURCE_NOT_FOUND", "Invite not found.");
  }
  await database.organizationInvite.update({ where: { id: inviteId }, data: { status: "REVOKED" } });
  await recordAuditLog({
    organizationId,
    actorUserId,
    action: "INVITE_REVOKED",
    resourceType: "OrganizationInvite",
    resourceId: inviteId,
  });
}

export async function acceptInvite(token: string, userId: string, userEmail: string) {
  const invite = await database.organizationInvite.findUnique({ where: { token } });
  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    throw new AppError(410, "INVITE_EXPIRED", "This invite is no longer valid.");
  }
  if (invite.email !== userEmail.toLowerCase()) {
    throw new AppError(403, "FORBIDDEN", "This invite was issued to a different email address.");
  }

  const membership = await database.$transaction(async (tx) => {
    const created = await tx.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: invite.organizationId, userId } },
      create: { organizationId: invite.organizationId, userId, role: invite.role },
      update: { role: invite.role },
    });
    await tx.organizationInvite.update({ where: { id: invite.id }, data: { status: "ACCEPTED", acceptedAt: new Date() } });
    return created;
  });

  await recordAuditLog({
    organizationId: invite.organizationId,
    actorUserId: userId,
    action: "MEMBER_JOINED",
    resourceType: "OrganizationMember",
    resourceId: membership.id,
    metadata: { role: invite.role },
  });

  return database.organization.findUniqueOrThrow({ where: { id: invite.organizationId } });
}

async function assertNotLastAdmin(organizationId: string, userId: string) {
  const admins = await database.organizationMember.count({ where: { organizationId, role: "ADMIN" } });
  const target = await database.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });
  if (target?.role === "ADMIN" && admins <= 1) {
    throw new AppError(409, "CONFLICT", "An organization must keep at least one admin.");
  }
}

export async function updateMemberRole(organizationId: string, actorUserId: string, targetUserId: string, input: UpdateMemberRoleInput) {
  await assertNotLastAdmin(organizationId, targetUserId);
  const membership = await database.organizationMember.update({
    where: { organizationId_userId: { organizationId, userId: targetUserId } },
    data: { role: input.role },
  });
  await recordAuditLog({
    organizationId,
    actorUserId,
    action: "MEMBER_ROLE_CHANGED",
    resourceType: "OrganizationMember",
    resourceId: membership.id,
    metadata: { targetUserId, role: input.role },
  });
  return membership;
}

export async function removeMember(organizationId: string, actorUserId: string, targetUserId: string) {
  await assertNotLastAdmin(organizationId, targetUserId);
  await database.organizationMember.delete({ where: { organizationId_userId: { organizationId, userId: targetUserId } } });
  await recordAuditLog({
    organizationId,
    actorUserId,
    action: "MEMBER_REMOVED",
    resourceType: "OrganizationMember",
    metadata: { targetUserId },
  });
}

export async function listAuditLogs(organizationId: string) {
  return database.auditLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { id: true, displayName: true, email: true } } },
  });
}
