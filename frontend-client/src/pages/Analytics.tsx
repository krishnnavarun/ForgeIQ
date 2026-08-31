import { type FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BarChart3, Loader2, Sparkles } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useOrganization } from "@/context/organization-context";
import { getAnalytics } from "@/services/analytics";
import { generateInsight, listInsights, type AIMode } from "@/services/ai";
import { ApiError } from "@/services/api";

const HEALTH_SIGNALS: Array<{ key: "delivery" | "prFlow" | "issueFlow" | "reviews" | "activity"; label: string }> = [
  { key: "delivery", label: "Delivery" },
  { key: "prFlow", label: "PR Flow" },
  { key: "issueFlow", label: "Issue Flow" },
  { key: "reviews", label: "Reviews" },
  { key: "activity", label: "Activity" },
];

function AIPanel({ organizationId, projectId }: { organizationId: string; projectId?: string }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AIMode>("weekly_summary");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");

  const insightsQuery = useQuery({
    queryKey: ["ai-insights", organizationId],
    queryFn: () => listInsights(organizationId),
  });

  const generateMutation = useMutation({
    mutationFn: () => generateInsight(organizationId, mode, { projectId, question: mode === "question" ? question : undefined }),
    onSuccess: () => {
      setError("");
      queryClient.invalidateQueries({ queryKey: ["ai-insights", organizationId] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Could not generate an insight."),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    generateMutation.mutate();
  }

  return (
    <section className="ai-panel-app">
      <div className="panel-head-text" style={{ marginBottom: 14 }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}><Sparkles size={17} className="ai-panel-app-icon" /> AI engineering insights</h2>
        <p>Grounded in the exact metrics above — never invented, never a per-developer score.</p>
      </div>

      {insightsQuery.data?.configured === false && (
        <div className="empty-state" style={{ padding: "24px 0" }}>
          <h3>AI insights aren't configured on this server</h3>
          <p>Set ANTHROPIC_API_KEY in the backend environment to enable this.</p>
        </div>
      )}

      {insightsQuery.data?.configured && (
        <>
          <form className="search-row" onSubmit={handleSubmit} style={{ marginBottom: 14, alignItems: "flex-start" }}>
            <select className="role-select" value={mode} onChange={(e) => setMode(e.target.value as AIMode)}>
              <option value="weekly_summary">Weekly summary</option>
              <option value="project_summary">Project summary</option>
              <option value="bottleneck_explanation">Explain bottlenecks</option>
              <option value="question">Ask a question</option>
            </select>
            {mode === "question" && (
              <input
                className="app-input"
                style={{ flex: 1, minWidth: 220 }}
                placeholder="Why is delivery slowing down?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            )}
            <button type="submit" className="btn-primary btn-sm" disabled={generateMutation.isPending || (mode === "question" && question.trim().length < 3)}>
              {generateMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
              Generate
            </button>
          </form>
          {error && <p className="field-error">{error}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {insightsQuery.data.insights.map((insight) => (
              <div className="ai-insight-card" key={insight.id}>
                <div className="ai-insight-title">{insight.title}</div>
                <div className="ai-insight-summary">{insight.summary}</div>
                <div className="ai-insight-time">{new Date(insight.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {insightsQuery.data.insights.length === 0 && <p style={{ color: "var(--muted)", fontSize: ".86rem" }}>No insights generated yet.</p>}
          </div>
        </>
      )}
    </section>
  );
}

export function Analytics() {
  const { currentOrg } = useOrganization();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") ?? undefined;
  const organizationId = currentOrg?.id;

  const analyticsQuery = useQuery({
    queryKey: ["analytics", organizationId, projectId],
    queryFn: () => getAnalytics(organizationId as string, projectId),
    enabled: Boolean(organizationId),
  });

  if (!currentOrg) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon"><BarChart3 size={22} /></span>
        <h3>No organization selected</h3>
        <p>Create or select an organization first.</p>
        <Link to="/organization" className="btn-primary">Go to Organization</Link>
      </div>
    );
  }

  if (analyticsQuery.isLoading || !analyticsQuery.data) {
    return <div className="panel"><div className="empty-state"><Loader2 className="animate-spin" size={22} /><h3>Calculating engineering metrics…</h3></div></div>;
  }

  const analytics = analyticsQuery.data;

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">{currentOrg.name}{projectId ? " · Project scoped" : ""}</span>
          <h1>Analytics</h1>
          <p>Every number here is calculated live from synchronized pull requests, issues, reviews, and commits — no mock data.</p>
        </div>
      </div>

      {analytics.repositoryCount === 0 ? (
        <div className="panel">
          <div className="empty-state">
            <span className="empty-state-icon"><BarChart3 size={22} /></span>
            <h3>No repositories tracked yet</h3>
            <p>Connect GitHub and track a repository to populate real analytics here.</p>
            <Link to="/repositories" className="btn-primary">Go to Repositories</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div><div className="stat-card-value">{analytics.pullRequests.openCount}</div><div className="stat-card-label">Open pull requests</div><p className="stat-card-hint">{analytics.pullRequests.staleCount} stale</p></div>
            </div>
            <div className="stat-card">
              <div><div className="stat-card-value">{analytics.pullRequests.mergedCount}</div><div className="stat-card-label">Merged pull requests</div></div>
            </div>
            <div className="stat-card">
              <div><div className="stat-card-value">{analytics.issues.openCount}</div><div className="stat-card-label">Open issues</div><p className="stat-card-hint">{analytics.issues.overdueCount} overdue</p></div>
            </div>
            <div className="stat-card">
              <div><div className="stat-card-value">{analytics.reviews.pendingReviewCount}</div><div className="stat-card-label">Pending reviews</div></div>
            </div>
          </div>

          <section className="panel">
            <div className="panel-head"><div className="panel-head-text"><h2>Engineering health</h2><p>Transparent process signals — never a per-developer productivity score.</p></div></div>
            <div className="panel-body">
              <div className="health-grid">
                {HEALTH_SIGNALS.map((signal) => (
                  <div className="health-signal" key={signal.key}>
                    <div className="health-signal-value">{analytics.health[signal.key]}</div>
                    <div className="health-signal-label">{signal.label}</div>
                    {signal.key !== "delivery" && <div className="health-signal-hint">{analytics.health.signals[signal.key]}</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><div className="panel-head-text"><h2>Commit activity</h2><p>Last 30 days.</p></div></div>
            <div className="panel-body chart-card">
              {analytics.commits.byDay.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: ".86rem" }}>No commit activity in this window yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.commits.byDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9aa3b8" }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9aa3b8" }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={{ borderRadius: 10, borderColor: "var(--border)", fontSize: 12 }} />
                    <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><div className="panel-head-text"><h2>Bottlenecks</h2><p>Rule-based, explainable — every finding cites its evidence.</p></div></div>
            <div className="panel-body">
              {analytics.bottlenecks.length === 0 ? (
                <div className="empty-state" style={{ padding: "20px 0" }}>
                  <h3>No bottlenecks detected</h3>
                  <p>Nothing has crossed a defined threshold right now.</p>
                </div>
              ) : (
                <div className="bottleneck-list">
                  {analytics.bottlenecks.map((bottleneck) => (
                    <div className={`bottleneck-card sev-${bottleneck.severity}`} key={bottleneck.rule}>
                      <AlertTriangle size={17} className="bottleneck-icon" />
                      <div>
                        <div className="bottleneck-message">{bottleneck.message}</div>
                        {bottleneck.evidence.length > 0 && (
                          <div className="bottleneck-evidence">
                            {bottleneck.evidence.map((item) => <span key={item.number}>#{item.number} {item.title}</span>)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <AIPanel organizationId={currentOrg.id} projectId={projectId} />
        </>
      )}
    </>
  );
}
