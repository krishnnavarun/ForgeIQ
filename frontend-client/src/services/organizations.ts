import { apiRequest } from "./api";
import { getAccessToken } from "./auth";

export type OrgRole = "ADMIN" | "MANAGER" | "DEVELOPER" | "VIEWER" | "RECRUITER";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  _count: { members: number; projects: number };
  myRole: OrgRole;
};

export type OrganizationMember = {
  userId: string;
  role: OrgRole;
  createdAt: string;
  user: { id: string; email: string; displayName: string | null };
};

export type OrganizationDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  members: OrganizationMember[];
  _count: { projects: number; repositories: number };
};

export type OrganizationInvite = {
  id: string;
  email: string;
  role: OrgRole;
  token: string;
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  expiresAt: string;
  createdAt: string;
};

export type AuditLogEntry = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: unknown;
  createdAt: string;
  actor: { id: string; displayName: string | null; email: string };
};

function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listMyOrganizations() {
  const response = await apiRequest<{ organizations: OrganizationSummary[] }>("/organizations", { headers: authHeaders() });
  return response.organizations;
}

export async function listOrganizationDirectory() {
  const response = await apiRequest<{ organizations: Array<{ id: string; name: string; slug: string; description: string | null }> }>(
    "/organizations/directory",
    { headers: authHeaders() },
  );
  return response.organizations;
}

export async function createOrganization(input: { name: string; description?: string }) {
  const response = await apiRequest<{ organization: OrganizationSummary }>("/organizations", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  return response.organization;
}

export async function getOrganization(organizationId: string) {
  const response = await apiRequest<{ organization: OrganizationDetail; myRole: OrgRole }>(`/organizations/${organizationId}`, {
    headers: authHeaders(),
  });
  return response;
}

export async function updateOrganization(organizationId: string, input: { name?: string; description?: string }) {
  const response = await apiRequest<{ organization: OrganizationDetail }>(`/organizations/${organizationId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  return response.organization;
}

export async function listInvites(organizationId: string) {
  const response = await apiRequest<{ invites: OrganizationInvite[] }>(`/organizations/${organizationId}/invites`, {
    headers: authHeaders(),
  });
  return response.invites;
}

export async function createInvite(organizationId: string, input: { email: string; role: OrgRole }) {
  const response = await apiRequest<{ invite: OrganizationInvite }>(`/organizations/${organizationId}/invites`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  return response.invite;
}

export async function revokeInvite(organizationId: string, inviteId: string) {
  await apiRequest(`/organizations/${organizationId}/invites/${inviteId}`, { method: "DELETE", headers: authHeaders() });
}

export async function acceptInvite(token: string) {
  const response = await apiRequest<{ organization: OrganizationDetail }>(`/organizations/invites/${token}/accept`, {
    method: "POST",
    headers: authHeaders(),
  });
  return response.organization;
}

export async function updateMemberRole(organizationId: string, userId: string, role: OrgRole) {
  await apiRequest(`/organizations/${organizationId}/members/${userId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ role }),
  });
}

export async function removeMember(organizationId: string, userId: string) {
  await apiRequest(`/organizations/${organizationId}/members/${userId}`, { method: "DELETE", headers: authHeaders() });
}

export async function listAuditLogs(organizationId: string) {
  const response = await apiRequest<{ auditLogs: AuditLogEntry[] }>(`/organizations/${organizationId}/audit-logs`, {
    headers: authHeaders(),
  });
  return response.auditLogs;
}
