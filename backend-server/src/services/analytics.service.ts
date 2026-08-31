import { database } from "../config/database.js";
import {
  computeCommitMetrics,
  computeIssueMetrics,
  computePullRequestMetrics,
  computeReviewMetrics,
} from "../analytics/analytics.pure.js";
import { computeEngineeringHealth } from "../analytics/health.pure.js";
import { evaluateBottlenecks } from "../analytics/bottleneck.pure.js";

const analyticsCache = new Map<string, { expiresAt: number; value: Awaited<ReturnType<typeof computeAnalytics>> }>();
const CACHE_TTL_MS = 60 * 1000;

async function loadOrgData(organizationId: string, projectId?: string) {
  const repositoryWhere = projectId ? { organizationId, projectId } : { organizationId };
  const repositoryIds = (await database.repository.findMany({ where: repositoryWhere, select: { id: true } })).map((r) => r.id);

  const [issues, pullRequests, commits] = await Promise.all([
    database.issue.findMany({ where: { repositoryId: { in: repositoryIds } } }),
    database.pullRequest.findMany({ where: { repositoryId: { in: repositoryIds } }, include: { reviews: true } }),
    database.commit.findMany({ where: { repositoryId: { in: repositoryIds } } }),
  ]);
  return { issues, pullRequests, commits, repositoryCount: repositoryIds.length };
}

async function previousPeriodOpenIssueCount(organizationId: string, projectId: string | undefined, periodStart: Date) {
  const repositoryWhere = projectId ? { organizationId, projectId } : { organizationId };
  const repositoryIds = (await database.repository.findMany({ where: repositoryWhere, select: { id: true } })).map((r) => r.id);
  return database.issue.count({
    where: {
      repositoryId: { in: repositoryIds },
      openedAt: { lte: periodStart },
      OR: [{ closedAt: null }, { closedAt: { gt: periodStart } }],
    },
  });
}

async function computeAnalytics(organizationId: string, projectId?: string) {
  const now = new Date();
  const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [{ issues, pullRequests, commits, repositoryCount }, previousOpenCount] = await Promise.all([
    loadOrgData(organizationId, projectId),
    previousPeriodOpenIssueCount(organizationId, projectId, periodStart),
  ]);

  const prMetrics = computePullRequestMetrics(pullRequests, now);
  const issueMetrics = computeIssueMetrics(issues, now, 14, previousOpenCount);
  const commitMetrics = computeCommitMetrics(commits, now);
  const reviewMetrics = computeReviewMetrics(pullRequests);
  const health = computeEngineeringHealth(prMetrics, issueMetrics, reviewMetrics);
  const bottlenecks = evaluateBottlenecks(pullRequests, issueMetrics, now);

  return {
    repositoryCount,
    generatedAt: now.toISOString(),
    pullRequests: prMetrics,
    issues: issueMetrics,
    commits: commitMetrics,
    reviews: reviewMetrics,
    health,
    bottlenecks,
  };
}

export async function getAnalytics(organizationId: string, projectId?: string) {
  const cacheKey = `${organizationId}:${projectId ?? "*"}`;
  const cached = analyticsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const value = await computeAnalytics(organizationId, projectId);
  analyticsCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, value });
  return value;
}
