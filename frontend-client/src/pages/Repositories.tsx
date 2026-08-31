import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, GitBranch, Loader2, RefreshCw, Search, Trash2 } from "lucide-react";
import { useOrganization } from "@/context/organization-context";
import { ApiError } from "@/services/api";
import {
  discoverRepositories,
  listRepositories,
  syncRepository,
  trackRepository,
  untrackRepository,
  type DiscoveredRepository,
} from "@/services/repositories";

export function Repositories() {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const organizationId = currentOrg?.id;
  const canManage = currentOrg?.myRole === "ADMIN" || currentOrg?.myRole === "MANAGER";
  const [discovered, setDiscovered] = useState<DiscoveredRepository[] | null>(null);
  const [discoverError, setDiscoverError] = useState("");
  const [syncMessage, setSyncMessage] = useState<Record<string, string>>({});

  const repositoriesQuery = useQuery({
    queryKey: ["repositories", organizationId],
    queryFn: () => listRepositories(organizationId as string),
    enabled: Boolean(organizationId),
  });

  const discoverMutation = useMutation({
    mutationFn: () => discoverRepositories(organizationId as string),
    onSuccess: (repos) => {
      setDiscoverError("");
      setDiscovered(repos);
    },
    onError: (err) => setDiscoverError(err instanceof ApiError ? err.message : "Could not reach GitHub."),
  });

  const trackMutation = useMutation({
    mutationFn: (repo: DiscoveredRepository) =>
      trackRepository(organizationId as string, { externalId: repo.externalId, name: repo.name, fullName: repo.fullName, url: repo.url }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["repositories", organizationId] }),
  });

  const untrackMutation = useMutation({
    mutationFn: (repositoryId: string) => untrackRepository(organizationId as string, repositoryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["repositories", organizationId] }),
  });

  const syncMutation = useMutation({
    mutationFn: (repositoryId: string) => syncRepository(organizationId as string, repositoryId),
    onSuccess: (result, repositoryId) => {
      setSyncMessage((prev) => ({
        ...prev,
        [repositoryId]: `Synced ${result.result.commitsSynced} commits, ${result.result.pullRequestsSynced} PRs, ${result.result.issuesSynced} issues.`,
      }));
      queryClient.invalidateQueries({ queryKey: ["repositories", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["analytics", organizationId] });
    },
    onError: (err, repositoryId) =>
      setSyncMessage((prev) => ({ ...prev, [repositoryId]: err instanceof ApiError ? err.message : "Sync failed." })),
  });

  if (!currentOrg) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon"><GitBranch size={22} /></span>
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
          <h1>Repositories</h1>
          <p>Discover permitted GitHub repositories, track the ones you care about, and sync their activity.</p>
        </div>
        {canManage && (
          <div className="page-head-actions">
            <button type="button" className="btn-primary" onClick={() => discoverMutation.mutate()} disabled={discoverMutation.isPending}>
              {discoverMutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <Search size={15} />}
              Discover from GitHub
            </button>
          </div>
        )}
      </div>

      {discoverError && (
        <p className="auth-error" role="alert">
          {discoverError}{" "}
          {discoverError.toLowerCase().includes("connect") && <Link to="/organization">Connect GitHub in Organization settings.</Link>}
        </p>
      )}

      {discovered && (
        <section className="panel">
          <div className="panel-head">
            <div className="panel-head-text">
              <h2>Discovered repositories</h2>
              <p>Permitted repositories from your connected GitHub account.</p>
            </div>
          </div>
          <div className="panel-body">
            {discovered.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: ".86rem" }}>No repositories found for this GitHub account.</p>
            ) : (
              <div className="row-list">
                {discovered.map((repo) => (
                  <div className="row-item" key={repo.externalId}>
                    <span className="row-item-avatar"><GitBranch size={14} /></span>
                    <div className="row-item-main">
                      <div className="row-item-title">{repo.fullName}</div>
                      <div className="row-item-sub">{repo.private ? "Private" : "Public"}</div>
                    </div>
                    {repo.alreadyTracked ? (
                      <span className="pill pill-visibility-PUBLIC"><Check size={12} /> Tracked</span>
                    ) : (
                      <button type="button" className="btn-outline btn-sm" onClick={() => trackMutation.mutate(repo)} disabled={trackMutation.isPending}>
                        Track
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2>Tracked repositories</h2>
            <p>{repositoriesQuery.data?.length ?? 0} repositories synchronized into ForgeIQ.</p>
          </div>
        </div>
        <div className="panel-body">
          {repositoriesQuery.isLoading ? (
            <div className="empty-state"><Loader2 className="animate-spin" size={20} /></div>
          ) : repositoriesQuery.data?.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon"><GitBranch size={22} /></span>
              <h3>No repositories tracked yet</h3>
              <p>Connect GitHub and discover repositories to start synchronizing engineering data.</p>
            </div>
          ) : (
            <div className="row-list">
              {repositoriesQuery.data?.map((repo) => (
                <div className="row-item" key={repo.id}>
                  <span className="row-item-avatar"><GitBranch size={14} /></span>
                  <div className="row-item-main">
                    <Link to={`/repositories/${repo.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                      <div className="row-item-title">{repo.fullName}</div>
                    </Link>
                    <div className="row-item-sub">
                      {repo._count.commits} commits · {repo._count.pullRequests} PRs · {repo._count.issues} issues
                      {repo.project ? ` · ${repo.project.name}` : ""}
                    </div>
                    {syncMessage[repo.id] && <div className="row-item-sub" style={{ color: "var(--accent-dark)" }}>{syncMessage[repo.id]}</div>}
                  </div>
                  {canManage && (
                    <div className="row-item-actions">
                      <button type="button" className="btn-outline btn-sm" onClick={() => syncMutation.mutate(repo.id)} disabled={syncMutation.isPending}>
                        <RefreshCw size={13} /> Sync
                      </button>
                      <button type="button" className="btn-danger-ghost btn-icon" onClick={() => untrackMutation.mutate(repo.id)} aria-label="Untrack">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
