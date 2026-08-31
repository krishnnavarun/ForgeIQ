import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import * as organizationService from "../services/organization.service.js";
import { getAuthenticatedUser } from "../services/auth.service.js";

function requireAuth(request: Request) {
  if (!request.auth) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
  return request.auth;
}

export async function createOrganization(request: Request, response: Response) {
  const { userId } = requireAuth(request);
  const organization = await organizationService.createOrganization(userId, request.body);
  response.status(201).json({ organization });
}

export async function listMyOrganizations(request: Request, response: Response) {
  const { userId } = requireAuth(request);
  const organizations = await organizationService.listMyOrganizations(userId);
  response.json({ organizations });
}

export async function listDirectory(_request: Request, response: Response) {
  const organizations = await organizationService.listOrganizationDirectory();
  response.json({ organizations });
}

export async function getOrganization(request: Request, response: Response) {
  const organization = await organizationService.getOrganization(request.params.organizationId as string);
  response.json({ organization, myRole: request.membership?.role });
}

export async function updateOrganization(request: Request, response: Response) {
  const { userId } = requireAuth(request);
  const organization = await organizationService.updateOrganization(request.params.organizationId as string, userId, request.body);
  response.json({ organization });
}

export async function createInvite(request: Request, response: Response) {
  const { userId } = requireAuth(request);
  const invite = await organizationService.createInvite(request.params.organizationId as string, userId, request.body);
  response.status(201).json({ invite });
}

export async function listInvites(request: Request, response: Response) {
  const invites = await organizationService.listInvites(request.params.organizationId as string);
  response.json({ invites });
}

export async function revokeInvite(request: Request, response: Response) {
  const { userId } = requireAuth(request);
  await organizationService.revokeInvite(request.params.organizationId as string, userId, request.params.inviteId as string);
  response.status(204).send();
}

export async function acceptInvite(request: Request, response: Response) {
  const { userId } = requireAuth(request);
  const user = await getAuthenticatedUser(userId);
  if (!user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
  const organization = await organizationService.acceptInvite(request.params.token as string, userId, user.email);
  response.json({ organization });
}

export async function updateMemberRole(request: Request, response: Response) {
  const { userId } = requireAuth(request);
  const membership = await organizationService.updateMemberRole(
    request.params.organizationId as string,
    userId,
    request.params.userId as string,
    request.body,
  );
  response.json({ membership });
}

export async function removeMember(request: Request, response: Response) {
  const { userId } = requireAuth(request);
  await organizationService.removeMember(request.params.organizationId as string, userId, request.params.userId as string);
  response.status(204).send();
}

export async function listAuditLogs(request: Request, response: Response) {
  const auditLogs = await organizationService.listAuditLogs(request.params.organizationId as string);
  response.json({ auditLogs });
}
