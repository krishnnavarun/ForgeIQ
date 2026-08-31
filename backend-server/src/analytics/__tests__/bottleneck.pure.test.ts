import { describe, expect, it } from "vitest";
import { evaluateBottlenecks } from "../bottleneck.pure.js";
import { computeIssueMetrics } from "../analytics.pure.js";

const NOW = new Date("2026-06-15T00:00:00.000Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
const emptyIssueMetrics = computeIssueMetrics([], NOW);

describe("evaluateBottlenecks", () => {
  it("flags pull requests waiting more than the review threshold with zero reviews", () => {
    const prs = [
      { number: 1, title: "Add feature", state: "OPEN" as const, openedAt: daysAgo(3), reviews: [] },
      { number: 2, title: "Fix bug", state: "OPEN" as const, openedAt: daysAgo(1), reviews: [] },
    ];
    const findings = evaluateBottlenecks(prs, emptyIssueMetrics, NOW);
    const reviewWaiting = findings.find((f) => f.rule === "REVIEW_WAITING");
    expect(reviewWaiting?.evidence).toEqual([{ number: 1, title: "Add feature" }]);
  });

  it("does not flag a pull request that already has a review", () => {
    const prs = [
      { number: 1, title: "Add feature", state: "OPEN" as const, openedAt: daysAgo(3), reviews: [{ submittedAt: daysAgo(1) }] },
    ];
    const findings = evaluateBottlenecks(prs, emptyIssueMetrics, NOW);
    expect(findings.find((f) => f.rule === "REVIEW_WAITING")).toBeUndefined();
  });

  it("flags a growing issue backlog above the 10% threshold", () => {
    const issueMetrics = computeIssueMetrics(
      [
        { state: "OPEN", openedAt: daysAgo(1), closedAt: null },
        { state: "OPEN", openedAt: daysAgo(1), closedAt: null },
      ],
      NOW,
      14,
      1,
    );
    const findings = evaluateBottlenecks([], issueMetrics, NOW);
    const backlog = findings.find((f) => f.rule === "BACKLOG_INCREASING");
    expect(backlog).toBeDefined();
    expect(backlog?.severity).toBe("critical");
  });

  it("reports no findings when nothing crosses a threshold", () => {
    const findings = evaluateBottlenecks(
      [{ number: 1, title: "Quick fix", state: "OPEN" as const, openedAt: daysAgo(1), reviews: [{ submittedAt: daysAgo(0.5) }] }],
      emptyIssueMetrics,
      NOW,
    );
    expect(findings).toHaveLength(0);
  });
});
