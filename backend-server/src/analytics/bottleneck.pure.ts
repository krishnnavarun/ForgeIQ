import type { computeIssueMetrics } from "./analytics.pure.js";

type IssueMetrics = ReturnType<typeof computeIssueMetrics>;

export type PullRequestWithMeta = {
  number: number;
  title: string;
  state: "OPEN" | "CLOSED" | "MERGED";
  openedAt: Date;
  reviews: Array<{ submittedAt: Date | null }>;
};

export type Bottleneck = {
  rule: string;
  severity: "info" | "warning" | "critical";
  message: string;
  evidence: Array<{ number: number; title: string }>;
};

const HOUR_MS = 60 * 60 * 1000;

/**
 * Explainable, threshold-based bottleneck rules (docs/development.md Phase 17,
 * docs/workflow.md §13). Each finding states the rule that fired and the exact
 * evidence behind it — never a bare "risk" claim with nothing to back it up.
 * A "repeated failed workflow" rule is intentionally not implemented: it needs
 * CI/CD run data, which is Phase 25 (additional integrations) scope.
 */
export function evaluateBottlenecks(
  pullRequests: PullRequestWithMeta[],
  issue: IssueMetrics,
  now: Date,
  staleAfterDays = 3,
  reviewWaitAfterHours = 48,
): Bottleneck[] {
  const findings: Bottleneck[] = [];
  const open = pullRequests.filter((pr) => pr.state === "OPEN");
  const ageHours = (pr: PullRequestWithMeta) => (now.getTime() - pr.openedAt.getTime()) / HOUR_MS;

  const waitingForReview = open.filter((pr) => pr.reviews.length === 0 && ageHours(pr) > reviewWaitAfterHours);
  if (waitingForReview.length > 0) {
    findings.push({
      rule: "REVIEW_WAITING",
      severity: waitingForReview.length >= 5 ? "critical" : "warning",
      message: `${waitingForReview.length} pull request${waitingForReview.length === 1 ? " has" : "s have"} waited more than ${reviewWaitAfterHours} hours for a first review.`,
      evidence: waitingForReview.map((pr) => ({ number: pr.number, title: pr.title })),
    });
  }

  const stale = open.filter((pr) => ageHours(pr) > staleAfterDays * 24);
  if (stale.length > 0) {
    findings.push({
      rule: "STALE_PULL_REQUEST",
      severity: stale.length >= 5 ? "critical" : "warning",
      message: `${stale.length} pull request${stale.length === 1 ? " has" : "s have"} been open for more than ${staleAfterDays} days without merging.`,
      evidence: stale.map((pr) => ({ number: pr.number, title: pr.title })),
    });
  }

  if (issue.overdueCount > 0) {
    findings.push({
      rule: "ISSUE_OVERDUE",
      severity: issue.overdueCount >= 10 ? "critical" : "warning",
      message: `${issue.overdueCount} issue${issue.overdueCount === 1 ? " has" : "s have"} been open for more than 14 days.`,
      evidence: [],
    });
  }

  if (issue.backlogDeltaPercent !== null && issue.backlogDeltaPercent > 10) {
    findings.push({
      rule: "BACKLOG_INCREASING",
      severity: issue.backlogDeltaPercent > 30 ? "critical" : "warning",
      message: `The open-issue backlog increased by ${Math.round(issue.backlogDeltaPercent)}% compared to the previous period.`,
      evidence: [],
    });
  }

  return findings;
}
