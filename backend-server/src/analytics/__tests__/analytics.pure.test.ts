import { describe, expect, it } from "vitest";
import {
  computeCommitMetrics,
  computeIssueMetrics,
  computePullRequestMetrics,
  computeReviewMetrics,
} from "../analytics.pure.js";

const NOW = new Date("2026-06-15T00:00:00.000Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

describe("computePullRequestMetrics", () => {
  it("counts open, merged, and stale pull requests", () => {
    const prs = [
      { state: "OPEN" as const, openedAt: daysAgo(1), closedAt: null, mergedAt: null, reviews: [] },
      { state: "OPEN" as const, openedAt: daysAgo(10), closedAt: null, mergedAt: null, reviews: [] },
      { state: "MERGED" as const, openedAt: daysAgo(5), closedAt: daysAgo(2), mergedAt: daysAgo(2), reviews: [] },
      { state: "CLOSED" as const, openedAt: daysAgo(5), closedAt: daysAgo(2), mergedAt: null, reviews: [] },
    ];
    const result = computePullRequestMetrics(prs, NOW, 3);
    expect(result.openCount).toBe(2);
    expect(result.mergedCount).toBe(1);
    expect(result.closedWithoutMergeCount).toBe(1);
    expect(result.staleCount).toBe(1);
    expect(result.averageMergeTimeHours).toBeCloseTo(72, 0);
  });

  it("returns null averages when there is nothing to average", () => {
    const result = computePullRequestMetrics([], NOW);
    expect(result.averageOpenAgeHours).toBeNull();
    expect(result.averageMergeTimeHours).toBeNull();
  });
});

describe("computeIssueMetrics", () => {
  it("flags overdue issues and computes resolution time", () => {
    const issues = [
      { state: "OPEN" as const, openedAt: daysAgo(20), closedAt: null },
      { state: "OPEN" as const, openedAt: daysAgo(1), closedAt: null },
      { state: "CLOSED" as const, openedAt: daysAgo(10), closedAt: daysAgo(5) },
    ];
    const result = computeIssueMetrics(issues, NOW, 14);
    expect(result.openCount).toBe(2);
    expect(result.overdueCount).toBe(1);
    expect(result.averageResolutionHours).toBeCloseTo(120, 0);
  });

  it("computes backlog delta percent against the previous period", () => {
    const issues = [
      { state: "OPEN" as const, openedAt: daysAgo(1), closedAt: null },
      { state: "OPEN" as const, openedAt: daysAgo(1), closedAt: null },
    ];
    const result = computeIssueMetrics(issues, NOW, 14, 1);
    expect(result.backlogDeltaPercent).toBe(100);
  });

  it("does not compute a delta when there is no previous-period baseline", () => {
    const result = computeIssueMetrics([], NOW, 14, 0);
    expect(result.backlogDeltaPercent).toBeNull();
  });
});

describe("computeCommitMetrics", () => {
  it("only counts commits inside the trailing window", () => {
    const commits = [{ authoredAt: daysAgo(2) }, { authoredAt: daysAgo(2) }, { authoredAt: daysAgo(60) }];
    const result = computeCommitMetrics(commits, NOW, 30);
    expect(result.totalCount).toBe(2);
    expect(result.activeDays).toBe(1);
  });
});

describe("computeReviewMetrics", () => {
  it("identifies open pull requests with zero reviews as pending", () => {
    const prs = [
      { state: "OPEN" as const, openedAt: daysAgo(1), closedAt: null, mergedAt: null, reviews: [] },
      {
        state: "OPEN" as const,
        openedAt: daysAgo(2),
        closedAt: null,
        mergedAt: null,
        reviews: [{ submittedAt: daysAgo(1) }],
      },
    ];
    const result = computeReviewMetrics(prs);
    expect(result.pendingReviewCount).toBe(1);
    expect(result.averageTurnaroundHours).toBeCloseTo(24, 0);
  });
});
