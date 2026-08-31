import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderGit2, Loader2, Plus, Trash2 } from "lucide-react";
import { useOrganization } from "@/context/organization-context";
import { createProject, deleteProject, listProjects } from "@/services/projects";
import { ApiError } from "@/services/api";

export function Projects() {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const organizationId = currentOrg?.id;
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const canManage = currentOrg?.myRole === "ADMIN" || currentOrg?.myRole === "MANAGER";

  const projectsQuery = useQuery({
    queryKey: ["projects", organizationId],
    queryFn: () => listProjects(organizationId as string),
    enabled: Boolean(organizationId),
  });

  const createMutation = useMutation({
    mutationFn: () => createProject(organizationId as string, { name: name.trim(), description: description.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", organizationId] });
      setAdding(false);
      setName("");
      setDescription("");
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Could not create the project."),
  });

  const deleteMutation = useMutation({
    mutationFn: (projectId: string) => deleteProject(organizationId as string, projectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", organizationId] }),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) return;
    setError("");
    createMutation.mutate();
  }

  if (!currentOrg) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon"><FolderGit2 size={22} /></span>
        <h3>No organization selected</h3>
        <p>Create or select an organization first.</p>
        <Link to="/organization" className="btn-primary">Go to Organization</Link>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">{currentOrg.name}</span>
          <h1>Projects</h1>
          <p>Group repositories under a project to see combined health, PRs, issues, and activity.</p>
        </div>
        {canManage && !adding && (
          <div className="page-head-actions">
            <button type="button" className="btn-primary" onClick={() => setAdding(true)}>
              <Plus size={15} /> New project
            </button>
          </div>
        )}
      </div>

      {adding && (
        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="app-field">
            <label className="app-label">Project name</label>
            <input className="app-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Finance Platform" />
          </div>
          <div className="app-field">
            <label className="app-label">Description (optional)</label>
            <textarea className="app-textarea" style={{ minHeight: 56 }} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {error && <p className="field-error">{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn-outline btn-sm" onClick={() => setAdding(false)}>Cancel</button>
            <button type="submit" className="btn-primary btn-sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />} Create
            </button>
          </div>
        </form>
      )}

      {projectsQuery.isLoading ? (
        <div className="panel"><div className="empty-state"><Loader2 className="animate-spin" size={22} /><h3>Loading projects…</h3></div></div>
      ) : projectsQuery.data?.length === 0 ? (
        <div className="panel">
          <div className="empty-state">
            <span className="empty-state-icon"><FolderGit2 size={22} /></span>
            <h3>No projects yet</h3>
            <p>Create a project to start grouping repositories and tracking delivery health.</p>
          </div>
        </div>
      ) : (
        <div className="project-grid">
          {projectsQuery.data?.map((project) => (
            <Link to={`/projects/${project.id}`} className="project-card" key={project.id} style={{ textDecoration: "none" }}>
              <div className="project-card-head">
                <h3>{project.name}</h3>
                {canManage && (
                  <button
                    type="button"
                    className="btn-danger-ghost btn-icon"
                    onClick={(e) => { e.preventDefault(); deleteMutation.mutate(project.id); }}
                    aria-label="Delete project"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {project.description && <p className="desc">{project.description}</p>}
              <div className="project-card-tags">
                <span className="project-tag">{project._count.repositories} repositor{project._count.repositories === 1 ? "y" : "ies"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
