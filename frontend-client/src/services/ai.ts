import { apiRequest } from "./api";
import { getAccessToken } from "./auth";

export type AIMode = "weekly_summary" | "project_summary" | "bottleneck_explanation" | "question";

export type AIInsight = {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
};

function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listInsights(organizationId: string) {
  const response = await apiRequest<{ insights: AIInsight[]; configured: boolean }>(`/organizations/${organizationId}/ai`, {
    headers: authHeaders(),
  });
  return response;
}

export async function generateInsight(organizationId: string, mode: AIMode, options: { projectId?: string; question?: string } = {}) {
  const response = await apiRequest<{ insight: AIInsight }>(`/organizations/${organizationId}/ai`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ mode, ...options }),
  });
  return response.insight;
}
