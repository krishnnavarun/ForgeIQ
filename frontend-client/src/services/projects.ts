import { apiRequest } from "./api";
import { getAccessToken } from "./auth";

export type ProjectSummary = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { repositories: number };
};

export type RepositorySummary = {
  id: string;
  name: string;
  fullName: string;
  url: string;
  isSelected: boolean;
};

export type ProjectDetail = ProjectSummary & { repositories: RepositorySummary[] };

function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listProjects(organizationId: string) {
  const response = await apiRequest<{ projects: ProjectSummary[] }>(`/organizations/${organizationId}/projects`, {
    headers: authHeaders(),
  });
  return response.projects;
}

export async function createProject(organizationId: string, input: { name: string; description?: string }) {
  const response = await apiRequest<{ project: ProjectSummary }>(`/organizations/${organizationId}/projects`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  return response.project;
}

export async function getProject(organizationId: string, projectId: string) {
  const response = await apiRequest<{ project: ProjectDetail }>(`/organizations/${organizationId}/projects/${projectId}`, {
    headers: authHeaders(),
  });
  return response.project;
}

export async function updateProject(organizationId: string, projectId: string, input: { name?: string; description?: string }) {
  const response = await apiRequest<{ project: ProjectSummary }>(`/organizations/${organizationId}/projects/${projectId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  return response.project;
}

export async function deleteProject(organizationId: string, projectId: string) {
  await apiRequest(`/organizations/${organizationId}/projects/${projectId}`, { method: "DELETE", headers: authHeaders() });
}
