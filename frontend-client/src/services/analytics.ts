import { apiRequest } from "./api";
import { getAccessToken } from "./auth";

export type Bottleneck = {
  rule: string;
  severity: "info" | "warning" | "critical";
  message: string;
  evidence: Array<{ number: number; title: string }>;
};

export type Analytics = {
  repositoryCount: number;
  generatedAt: string;
  pullRequests: {
    openCount: number;
    mergedCount: number;
    closedWithoutMergeCount: number;
    averageOpenAgeHours: number | null;
    averageMergeTimeHours: number | null;
    staleCount: number;
  };
  issues: {
    openCount: number;
    closedCount: number;
    averageResolutionHours: number | null;
    overdueCount: number;
    backlogDeltaPercent: number | null;
  };
  commits: { totalCount: number; activeDays: number; byDay: Array<{ date: string; count: number }> };
  reviews: { pendingReviewCount: number; averageTurnaroundHours: number | null };
  health: {
    delivery: number;
    prFlow: number;
    issueFlow: number;
    reviews: number;
    activity: number;
    signals: { prFlow: string; issueFlow: string; reviews: string; activity: string };
  };
  bottlenecks: Bottleneck[];
};

function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getAnalytics(organizationId: string, projectId?: string) {
  const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
  const response = await apiRequest<{ analytics: Analytics }>(`/organizations/${organizationId}/analytics${query}`, {
    headers: authHeaders(),
  });
  return response.analytics;
}
