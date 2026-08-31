import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GitCommitHorizontal, GitPullRequest, Loader2, MessageSquare } from "lucide-react";
import { useOrganization } from "@/context/organization-context";
import { getRepository, getRepositoryActivity } from "@/services/repositories";

export function RepositoryDetail() {
  const { repositoryId } = useParams<{ repositoryId: string }>();
  const { currentOrg } = useOrganization();
  const organizationId = currentOrg?.id;

  const repoQuery = useQuery({
    queryKey: ["repository", organizationId, repositoryId],
    queryFn: () => getRepository(organizationId as string, repositoryId as string),
    enabled: Boolean(organizationId && repositoryId),
  });
  const activityQuery = useQuery({
    queryKey: ["repository-activity", organizationId, repositoryId],
    queryFn: () => getRepositoryActivity(organizationId as string, repositoryId as string),
    enabled: Boolean(organizationId && repositoryId),
  });

  if (repoQuery.isLoading || !currentOrg) {
    return <div className="panel"><div className="empty-state"><Loader2 className="animate-spin" size={22} /><h3>Loading repository…</h3></div></div>;
  }

  const repository = repoQuery.data;
  if (!repository) return <div className="panel"><div className="empty-state"><h3>Repository not found</h3></div></div>;

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">{currentOrg.name} · Repository</span>
          <h1>{repository.fullName}</h1>
          <p><a href={repository.url} target="_blank" rel="noreferrer">{repository.url}</a></p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-card-icon"><GitCommitHorizontal size={19} /></span>
          <div><div className="stat-card-value">{repository._count.commits}</div><div className="stat-card-label">Commits synced</div></div>
        </div>
        <div className="stat-card">
          <span className="stat-card-icon"><GitPullRequest size={19} /></span>
          <div><div className="stat-card-value">{repository._count.pullRequests}</div><div className="stat-card-label">Pull requests</div></div>
        </div>
        <div className="stat-card">
          <span className="stat-card-icon"><MessageSquare size={19} /></span>
          <div><div className="stat-card-value">{repository._count.issues}</div><div className="stat-card-label">Issues</div></div>
        </div>
      </div>

      <div className="section-split" style={{ gap: 20, alignItems: "start" }}>
        <section className="panel">
          <div className="panel-head"><div className="panel-head-text"><h2>Recent pull requests</h2></div></div>
          <div className="panel-body">
            {activityQuery.data?.recentPullRequests.length === 0 && <p style={{ color: "var(--muted)", fontSize: ".86rem" }}>No pull requests synced yet.</p>}
            <div className="row-list">
              {activityQuery.data?.recentPullRequests.map((pr) => (
                <div className="row-item" key={pr.id}>
                  <div className="row-item-main">
                    <div className="row-item-title">#{pr.number} {pr.title}</div>
                    <div className="row-item-sub">{pr.reviews.length} review{pr.reviews.length === 1 ? "" : "s"} · opened {new Date(pr.openedAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`pill ${pr.state === "MERGED" ? "pill-visibility-PUBLIC" : pr.state === "OPEN" ? "pill-visibility-ORGANIZATION" : "pill-visibility-PRIVATE"}`}>{pr.state}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><div className="panel-head-text"><h2>Recent issues</h2></div></div>
          <div className="panel-body">
            {activityQuery.data?.recentIssues.length === 0 && <p style={{ color: "var(--muted)", fontSize: ".86rem" }}>No issues synced yet.</p>}
            <div className="row-list">
              {activityQuery.data?.recentIssues.map((issue) => (
                <div className="row-item" key={issue.id}>
                  <div className="row-item-main">
                    <div className="row-item-title">#{issue.number} {issue.title}</div>
                    <div className="row-item-sub">opened {new Date(issue.openedAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`pill ${issue.state === "OPEN" ? "pill-visibility-ORGANIZATION" : "pill-visibility-PUBLIC"}`}>{issue.state}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><div className="panel-head-text"><h2>Recent commits</h2></div></div>
        <div className="panel-body">
          {activityQuery.data?.recentCommits.length === 0 && <p style={{ color: "var(--muted)", fontSize: ".86rem" }}>No commits synced yet.</p>}
          <div className="row-list">
            {activityQuery.data?.recentCommits.map((commit) => (
              <div className="row-item" key={commit.id}>
                <span className="row-item-avatar"><GitCommitHorizontal size={14} /></span>
                <div className="row-item-main">
                  <div className="row-item-title">{commit.message.split("\n")[0]}</div>
                  <div className="row-item-sub">{new Date(commit.authoredAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
