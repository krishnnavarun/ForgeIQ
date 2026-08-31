/**
 * Pure engineering-metric calculations. No database access here on purpose —
 * these functions take already-fetched rows and return numbers, which is what
 * lets them be unit-tested without touching Postgres (see
 * src/analytics/__tests__/analytics.pure.test.ts).
 */

export type IssueLike = { state: "OPEN" | "CLOSED"; openedAt: Date; closedAt: Date | null };
export type PullRequestLike = {
  state: "OPEN" | "CLOSED" | "MERGED";
  openedAt: Date;
  closedAt: Date | null;
  mergedAt: Date | null;
  reviews: Array<{ submittedAt: Date | null }>;
};
export type CommitLike = { authoredAt: Date };

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function hoursBetween(from: Date, to: Date) {
  return (to.getTime() - from.getTime()) / HOUR_MS;
}

export function computePullRequestMetrics(pullRequests: PullRequestLike[], now: Date, staleAfterDays = 3) {
  const open = pullRequests.filter((pr) => pr.state === "OPEN");
  const merged = pullRequests.filter((pr) => pr.state === "MERGED");
  const closedWithoutMerge = pullRequests.filter((pr) => pr.state === "CLOSED");

  const ages = open.map((pr) => hoursBetween(pr.openedAt, now));
  const mergeTimes = merged
    .filter((pr) => pr.mergedAt)
    .map((pr) => hoursBetween(pr.openedAt, pr.mergedAt as Date));

  const stale = open.filter((pr) => hoursBetween(pr.openedAt, now) > staleAfterDays * 24);

  return {
    openCount: open.length,
    mergedCount: merged.length,
    closedWithoutMergeCount: closedWithoutMerge.length,
    averageOpenAgeHours: average(ages),
    averageMergeTimeHours: average(mergeTimes),
    staleCount: stale.length,
    stalePullRequests: stale,
  };
}

export function computeIssueMetrics(issues: IssueLike[], now: Date, overdueAfterDays = 14, previousOpenCount?: number) {
  const open = issues.filter((issue) => issue.state === "OPEN");
  const closed = issues.filter((issue) => issue.state === "CLOSED" && issue.closedAt);

  const resolutionTimes = closed.map((issue) => hoursBetween(issue.openedAt, issue.closedAt as Date));
  const overdue = open.filter((issue) => hoursBetween(issue.openedAt, now) > overdueAfterDays * 24);

  const backlogDeltaPercent =
    typeof previousOpenCount === "number" && previousOpenCount > 0
      ? ((open.length - previousOpenCount) / previousOpenCount) * 100
      : null;

  return {
    openCount: open.length,
    closedCount: closed.length,
    averageResolutionHours: average(resolutionTimes),
    overdueCount: overdue.length,
    overdueIssues: overdue,
    backlogDeltaPercent,
  };
}

export function computeCommitMetrics(commits: CommitLike[], now: Date, windowDays = 30) {
  const windowStart = new Date(now.getTime() - windowDays * DAY_MS);
  const inWindow = commits.filter((commit) => commit.authoredAt >= windowStart && commit.authoredAt <= now);

  const byDay = new Map<string, number>();
  for (const commit of inWindow) {
    const key = commit.authoredAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }

  return {
    totalCount: inWindow.length,
    activeDays: byDay.size,
    byDay: Array.from(byDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export function computeReviewMetrics(pullRequests: PullRequestLike[]) {
  const open = pullRequests.filter((pr) => pr.state === "OPEN");
  const pending = open.filter((pr) => pr.reviews.length === 0);

  const turnaroundHours = pullRequests
    .map((pr) => {
      const submitted = pr.reviews
        .map((review) => review.submittedAt)
        .filter((date): date is Date => date !== null)
        .sort((a, b) => a.getTime() - b.getTime())[0];
      return submitted ? hoursBetween(pr.openedAt, submitted) : null;
    })
    .filter((value): value is number => value !== null);

  return {
    pendingReviewCount: pending.length,
    pendingReviews: pending,
    averageTurnaroundHours: average(turnaroundHours),
  };
}
