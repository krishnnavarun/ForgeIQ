import { apiRequest } from "./api";
import { getAccessToken } from "./auth";

export type Repository = {
  id: string;
  organizationId: string;
  projectId: string | null;
  provider: "GITHUB";
  externalId: string;
  name: string;
  fullName: string;
  url: string;
  isSelected: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { issues: number; pullRequests: number; commits: number };
  project: { id: string; name: string } | null;
};

export type DiscoveredRepository = {
  externalId: string;
  name: string;
  fullName: string;
  url: string;
  private: boolean;
  updatedAt: string;
  alreadyTracked: boolean;
};

export type RepositoryActivity = {
  recentCommits: Array<{ id: string; message: string; authoredAt: string }>;
  recentIssues: Array<{ id: string; number: number; title: string; state: "OPEN" | "CLOSED"; openedAt: string; closedAt: string | null }>;
  recentPullRequests: Array<{
    id: string;
    number: number;
    title: string;
    state: "OPEN" | "CLOSED" | "MERGED";
    openedAt: string;
    reviews: Array<{ id: string; state: string }>;
  }>;
};

function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listRepositories(organizationId: string) {
  const response = await apiRequest<{ repositories: Repository[] }>(`/organizations/${organizationId}/repositories`, {
    headers: authHeaders(),
  });
  return response.repositories;
}

export async function discoverRepositories(organizationId: string) {
  const response = await apiRequest<{ repositories: DiscoveredRepository[] }>(
    `/organizations/${organizationId}/repositories/discover`,
    { headers: authHeaders() },
  );
  return response.repositories;
}

export async function trackRepository(
  organizationId: string,
  input: { externalId: string; name: string; fullName: string; url: string; projectId?: string },
) {
  const response = await apiRequest<{ repository: Repository }>(`/organizations/${organizationId}/repositories`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  return response.repository;
}

export async function getRepository(organizationId: string, repositoryId: string) {
  const response = await apiRequest<{ repository: Repository }>(`/organizations/${organizationId}/repositories/${repositoryId}`, {
    headers: authHeaders(),
  });
  return response.repository;
}

export async function getRepositoryActivity(organizationId: string, repositoryId: string) {
  return apiRequest<RepositoryActivity>(`/organizations/${organizationId}/repositories/${repositoryId}/activity`, {
    headers: authHeaders(),
  });
}

export async function syncRepository(organizationId: string, repositoryId: string) {
  return apiRequest<{ result: { issuesSynced: number; pullRequestsSynced: number; reviewsSynced: number; commitsSynced: number } }>(
    `/organizations/${organizationId}/repositories/${repositoryId}/sync`,
    { method: "POST", headers: authHeaders() },
  );
}

export async function untrackRepository(organizationId: string, repositoryId: string) {
  await apiRequest(`/organizations/${organizationId}/repositories/${repositoryId}`, { method: "DELETE", headers: authHeaders() });
}

export type IntegrationStatus = {
  integrations: Array<{ id: string; provider: "GITHUB"; status: "CONNECTED" | "DISCONNECTED" | "ERROR"; externalAccountId: string | null }>;
  githubConfigured: boolean;
};

export async function getIntegrations(organizationId: string) {
  return apiRequest<IntegrationStatus>(`/organizations/${organizationId}/integrations`, { headers: authHeaders() });
}

export async function startGithubConnect(organizationId: string) {
  const response = await apiRequest<{ url: string }>(`/organizations/${organizationId}/integrations/github/start`, {
    headers: authHeaders(),
  });
  return response.url;
}

export async function disconnectGithub(organizationId: string) {
  await apiRequest(`/organizations/${organizationId}/integrations/github`, { method: "DELETE", headers: authHeaders() });
}
