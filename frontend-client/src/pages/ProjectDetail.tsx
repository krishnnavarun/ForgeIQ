import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, GitBranch, Loader2 } from "lucide-react";
import { useOrganization } from "@/context/organization-context";
import { getProject } from "@/services/projects";

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentOrg } = useOrganization();
  const navigate = useNavigate();
  const organizationId = currentOrg?.id;

  const projectQuery = useQuery({
    queryKey: ["project", organizationId, projectId],
    queryFn: () => getProject(organizationId as string, projectId as string),
    enabled: Boolean(organizationId && projectId),
  });

  if (projectQuery.isLoading || !currentOrg) {
    return <div className="panel"><div className="empty-state"><Loader2 className="animate-spin" size={22} /><h3>Loading project…</h3></div></div>;
  }

  const project = projectQuery.data;
  if (!project) {
    return <div className="panel"><div className="empty-state"><h3>Project not found</h3></div></div>;
  }

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">{currentOrg.name} · Project</span>
          <h1>{project.name}</h1>
          <p>{project.description || "No description yet."}</p>
        </div>
        <div className="page-head-actions">
          <button type="button" className="btn-primary" onClick={() => navigate(`/analytics?projectId=${project.id}`)}>
            <BarChart3 size={15} /> View analytics
          </button>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2>Repositories</h2>
            <p>Repositories linked to this project.</p>
          </div>
          <Link to="/repositories" className="btn-outline btn-sm">Manage repositories</Link>
        </div>
        <div className="panel-body">
          {project.repositories.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon"><GitBranch size={22} /></span>
              <h3>No repositories linked yet</h3>
              <p>Track a repository under this project from the Repositories page.</p>
            </div>
          ) : (
            <div className="row-list">
              {project.repositories.map((repo) => (
                <Link to={`/repositories/${repo.id}`} className="row-item" key={repo.id} style={{ textDecoration: "none" }}>
                  <span className="row-item-avatar"><GitBranch size={14} /></span>
                  <div className="row-item-main">
                    <div className="row-item-title">{repo.name}</div>
                    <div className="row-item-sub">{repo.fullName}</div>
                  </div>
                  {repo.isSelected && <span className="pill pill-visibility-PUBLIC">Tracked</span>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
