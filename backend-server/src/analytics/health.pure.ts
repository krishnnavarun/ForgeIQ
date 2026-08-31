import type { computeIssueMetrics, computePullRequestMetrics, computeReviewMetrics } from "./analytics.pure.js";

type PrMetrics = ReturnType<typeof computePullRequestMetrics>;
type IssueMetrics = ReturnType<typeof computeIssueMetrics>;
type ReviewMetrics = ReturnType<typeof computeReviewMetrics>;

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Engineering health is expressed as transparent 0-100 *process signals*
 * (never as a score attributed to an individual developer — see
 * docs/specs.md §21 "Engineering Health" and §48 "What ForgeIQ must not
 * become"). Every number here is derived from, and always shown next to,
 * the underlying counts in `metrics`.
 */
export function computeEngineeringHealth(pr: PrMetrics, issue: IssueMetrics, review: ReviewMetrics) {
  const totalOpenPrs = pr.openCount || 1;
  const prFlow = clamp(100 - (pr.staleCount / totalOpenPrs) * 100);

  const totalOpenIssues = issue.openCount || 1;
  const backlogPenalty = issue.backlogDeltaPercent && issue.backlogDeltaPercent > 0 ? Math.min(50, issue.backlogDeltaPercent) : 0;
  const issueFlow = clamp(100 - (issue.overdueCount / totalOpenIssues) * 60 - backlogPenalty);

  const reviews = clamp(100 - (review.pendingReviewCount / totalOpenPrs) * 100);

  // Merge throughput as a simple, monotonic activity signal, capped at 10 merges = 100.
  const activity = clamp(pr.mergedCount * 10);

  const delivery = clamp((prFlow + issueFlow + reviews + activity) / 4);

  return {
    delivery,
    prFlow,
    issueFlow,
    reviews,
    activity,
    signals: {
      prFlow: `${pr.staleCount} of ${pr.openCount} open pull requests are stale.`,
      issueFlow: `${issue.overdueCount} of ${issue.openCount} open issues are overdue.`,
      reviews: `${review.pendingReviewCount} open pull requests have no reviews yet.`,
      activity: `${pr.mergedCount} pull requests merged in the tracked window.`,
    },
  };
}
