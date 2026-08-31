import { describe, expect, it } from "vitest";
import { computeEngineeringHealth } from "../health.pure.js";
import { computeIssueMetrics, computePullRequestMetrics, computeReviewMetrics } from "../analytics.pure.js";

const NOW = new Date("2026-06-15T00:00:00.000Z");

describe("computeEngineeringHealth", () => {
  it("scores a clean project near 100 across signals", () => {
    const prMetrics = computePullRequestMetrics(
      [
        { state: "MERGED", openedAt: NOW, closedAt: NOW, mergedAt: NOW, reviews: [{ submittedAt: NOW }] },
        { state: "OPEN", openedAt: NOW, closedAt: null, mergedAt: null, reviews: [{ submittedAt: NOW }] },
      ],
      NOW,
    );
    const issueMetrics = computeIssueMetrics([], NOW);
    const reviewMetrics = computeReviewMetrics([
      { state: "OPEN", openedAt: NOW, closedAt: null, mergedAt: null, reviews: [{ submittedAt: NOW }] },
    ]);

    const health = computeEngineeringHealth(prMetrics, issueMetrics, reviewMetrics);
    expect(health.prFlow).toBe(100);
    expect(health.reviews).toBe(100);
    expect(health.delivery).toBeGreaterThan(50);
  });

  it("stays within 0-100 bounds even under an unhealthy project", () => {
    const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
    const prMetrics = computePullRequestMetrics(
      Array.from({ length: 6 }, () => ({ state: "OPEN" as const, openedAt: daysAgo(20), closedAt: null, mergedAt: null, reviews: [] })),
      NOW,
    );
    const issueMetrics = computeIssueMetrics(
      Array.from({ length: 12 }, () => ({ state: "OPEN" as const, openedAt: daysAgo(30), closedAt: null })),
      NOW,
    );
    const reviewMetrics = computeReviewMetrics(
      Array.from({ length: 6 }, () => ({ state: "OPEN" as const, openedAt: daysAgo(20), closedAt: null, mergedAt: null, reviews: [] })),
    );

    const health = computeEngineeringHealth(prMetrics, issueMetrics, reviewMetrics);
    for (const value of [health.delivery, health.prFlow, health.issueFlow, health.reviews, health.activity]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });
});
