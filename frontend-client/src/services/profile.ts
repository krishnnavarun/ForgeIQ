import { apiRequest } from "./api";
import { getAccessToken } from "./auth";

export type ProfileVisibility = "PRIVATE" | "ORGANIZATION" | "PUBLIC";

export type DeveloperProject = {
  id: string;
  title: string;
  description: string | null;
  projectUrl: string | null;
  repoUrl: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type DeveloperProfile = {
  id: string;
  email: string;
  displayName: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  githubUsername: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  skills: string[];
  openToOpportunities: boolean;
  profileVisibility: ProfileVisibility;
  createdAt: string;
  memberships: Array<{ organizationId: string; role: string }>;
  projects: DeveloperProject[];
};

export type ProfilePatch = Partial<{
  displayName: string;
  headline: string;
  bio: string;
  location: string;
  githubUsername: string;
  websiteUrl: string;
  linkedinUrl: string;
  skills: string[];
  openToOpportunities: boolean;
  profileVisibility: ProfileVisibility;
}>;

export type ProjectPatch = Partial<{
  title: string;
  description: string;
  projectUrl: string;
  repoUrl: string;
  tags: string[];
}>;

function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getMyProfile() {
  const response = await apiRequest<{ profile: DeveloperProfile }>("/users/me/profile", {
    headers: authHeaders(),
  });
  return response.profile;
}

export async function updateMyProfile(patch: ProfilePatch) {
  const response = await apiRequest<{ profile: DeveloperProfile }>("/users/me/profile", {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  return response.profile;
}

export async function createProject(input: ProjectPatch) {
  const response = await apiRequest<{ project: DeveloperProject }>("/users/me/projects", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  return response.project;
}

export async function updateProject(projectId: string, patch: ProjectPatch) {
  const response = await apiRequest<{ project: DeveloperProject }>(`/users/me/projects/${projectId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  return response.project;
}

export async function deleteProject(projectId: string) {
  await apiRequest<undefined>(`/users/me/projects/${projectId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}
