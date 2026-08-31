import { apiRequest } from "./api";
import { getAccessToken } from "./auth";

export type CandidateSearchResult = {
  id: string;
  displayName: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  githubUsername: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  skills: string[];
  openToOpportunities: boolean;
  profileVisibility: "PRIVATE" | "ORGANIZATION" | "PUBLIC";
  projects: Array<{ id: string; title: string; description: string | null; projectUrl: string | null; repoUrl: string | null; tags: string[] }>;
};

export type ShortlistEntry = { id: string; note: string | null; createdAt: string; candidate: CandidateSearchResult };

function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function searchCandidates(organizationId: string, params: { skill?: string; search?: string } = {}) {
  const query = new URLSearchParams();
  if (params.skill) query.set("skill", params.skill);
  if (params.search) query.set("search", params.search);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<{ total: number; candidates: CandidateSearchResult[] }>(
    `/organizations/${organizationId}/candidates${suffix}`,
    { headers: authHeaders() },
  );
}

export async function shortlistCandidate(organizationId: string, userId: string, note?: string) {
  await apiRequest(`/organizations/${organizationId}/candidates/${userId}/shortlist`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ note }),
  });
}

export async function unshortlistCandidate(organizationId: string, userId: string) {
  await apiRequest(`/organizations/${organizationId}/candidates/${userId}/shortlist`, { method: "DELETE", headers: authHeaders() });
}

export async function listShortlist(organizationId: string) {
  const response = await apiRequest<{ entries: ShortlistEntry[] }>(`/organizations/${organizationId}/shortlist`, {
    headers: authHeaders(),
  });
  return response.entries;
}

export async function expressInterest(organizationId: string) {
  await apiRequest(`/organizations/${organizationId}/interest`, { method: "POST", headers: authHeaders() });
}

export async function withdrawInterest(organizationId: string) {
  await apiRequest(`/organizations/${organizationId}/interest`, { method: "DELETE", headers: authHeaders() });
}

export async function listMyInterests() {
  const response = await apiRequest<{ organizations: Array<{ id: string; name: string; slug: string }> }>(
    "/organizations/my-interests",
    { headers: authHeaders() },
  );
  return response.organizations;
}
