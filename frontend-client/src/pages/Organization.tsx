import { type FormEvent, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  GitBranch,
  Loader2,
  Mail,
  Plus,
  Shield,
  Trash2,
  Unplug,
  X,
} from "lucide-react";
import { useOrganization } from "@/context/organization-context";
import { ApiError } from "@/services/api";
import {
  createInvite,
  createOrganization,
  getOrganization,
  listAuditLogs,
  listInvites,
  removeMember,
  revokeInvite,
  updateMemberRole,
  type OrgRole,
} from "@/services/organizations";
import { disconnectGithub, getIntegrations, startGithubConnect } from "@/services/repositories";

const ROLES: OrgRole[] = ["ADMIN", "MANAGER", "DEVELOPER", "VIEWER", "RECRUITER"];

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function CreateOrganizationCard() {
  const queryClient = useQueryClient();
  const { refetch, setCurrentOrgId } = useOrganization();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => createOrganization({ name: name.trim(), description: description.trim() || undefined }),
    onSuccess: async (organization) => {
      await queryClient.invalidateQueries({ queryKey: ["organizations"] });
      await refetch();
      setCurrentOrgId(organization.id);
      setName("");
      setDescription("");
    },
    onError: (err) => setError(errorMessage(err, "Could not create the organization.")),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) return;
    setError("");
    mutation.mutate();
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div className="panel-head-text">
          <h2>Create an organization</h2>
          <p>You'll become its admin. Invite teammates once it's created.</p>
        </div>
      </div>
      <div className="panel-body">
        <form className="inline-form" onSubmit={handleSubmit} style={{ background: "transparent", border: "none", padding: 0 }}>
          <div className="app-field">
            <label className="app-label">Organization name</label>
            <input className="app-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Engineering" />
          </div>
          <div className="app-field">
            <label className="app-label">Description (optional)</label>
            <textarea className="app-textarea" style={{ minHeight: 60 }} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {error && <p className="field-error">{error}</p>}
          <div>
            <button type="submit" className="btn-primary" disabled={mutation.isPending || name.trim().length < 2}>
              {mutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />}
              Create organization
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export function Organization() {
  const { currentOrg, isLoading: loadingOrgs } = useOrganization();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgRole>("DEVELOPER");
  const [inviteError, setInviteError] = useState("");

  const githubConnected = searchParams.get("github_connected") === "1";
  const githubError = searchParams.get("github_error") === "1";

  const organizationId = currentOrg?.id;

  const orgQuery = useQuery({
    queryKey: ["organization", organizationId],
    queryFn: () => getOrganization(organizationId as string),
    enabled: Boolean(organizationId),
  });

  const invitesQuery = useQuery({
    queryKey: ["invites", organizationId],
    queryFn: () => listInvites(organizationId as string),
    enabled: Boolean(organizationId) && orgQuery.data?.myRole === "ADMIN",
  });

  const auditQuery = useQuery({
    queryKey: ["audit-logs", organizationId],
    queryFn: () => listAuditLogs(organizationId as string),
    enabled: Boolean(organizationId) && (orgQuery.data?.myRole === "ADMIN" || orgQuery.data?.myRole === "MANAGER"),
  });

  const integrationsQuery = useQuery({
    queryKey: ["integrations", organizationId],
    queryFn: () => getIntegrations(organizationId as string),
    enabled: Boolean(organizationId),
  });

  const isAdmin = orgQuery.data?.myRole === "ADMIN";
  const canManageIntegrations = isAdmin || orgQuery.data?.myRole === "MANAGER";

  const inviteMutation = useMutation({
    mutationFn: () => createInvite(organizationId as string, { email: inviteEmail.trim(), role: inviteRole }),
    onSuccess: () => {
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["invites", organizationId] });
    },
    onError: (err) => setInviteError(errorMessage(err, "Could not send the invite.")),
  });

  const revokeMutation = useMutation({
    mutationFn: (inviteId: string) => revokeInvite(organizationId as string, inviteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invites", organizationId] }),
  });

  const roleMutation = useMutation({
    mutationFn: (input: { userId: string; role: OrgRole }) => updateMemberRole(organizationId as string, input.userId, input.role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organization", organizationId] }),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeMember(organizationId as string, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organization", organizationId] }),
  });

  const connectGithubMutation = useMutation({
    mutationFn: () => startGithubConnect(organizationId as string),
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  const disconnectGithubMutation = useMutation({
    mutationFn: () => disconnectGithub(organizationId as string),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["integrations", organizationId] }),
  });

  function handleInvite(event: FormEvent) {
    event.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteError("");
    inviteMutation.mutate();
  }

  function dismissBanner() {
    searchParams.delete("github_connected");
    searchParams.delete("github_error");
    setSearchParams(searchParams, { replace: true });
  }

  if (loadingOrgs) {
    return (
      <div className="panel"><div className="empty-state"><Loader2 className="animate-spin" size={22} /><h3>Loading organizations…</h3></div></div>
    );
  }

  if (!currentOrg) {
    return (
      <>
        <div className="page-head">
          <div>
            <span className="eyebrow">Organization</span>
            <h1>Set up your organization</h1>
            <p>Organizations are how ForgeIQ scopes projects, repositories, roles, and candidate discovery.</p>
          </div>
        </div>
        <CreateOrganizationCard />
      </>
    );
  }

  const githubIntegration = integrationsQuery.data?.integrations.find((i) => i.provider === "GITHUB");

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Organization</span>
          <h1>{currentOrg.name}</h1>
          <p>{orgQuery.data?.organization.description || "No description yet."}</p>
        </div>
      </div>

      {(githubConnected || githubError) && (
        <div className={`auth-error`} style={githubConnected ? { color: "var(--success)", background: "var(--success-soft)", borderColor: "#bfe6d3" } : undefined} role="alert">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            {githubConnected ? "GitHub connected successfully." : "GitHub sign-in didn't go through. Please try again."}
            <button type="button" className="btn-ghost btn-icon" onClick={dismissBanner}><X size={14} /></button>
          </div>
        </div>
      )}

      <div className="section-split" style={{ gap: 20, alignItems: "start" }}>
        <section className="panel">
          <div className="panel-head">
            <div className="panel-head-text">
              <h2>Members</h2>
              <p>{orgQuery.data?.organization.members.length ?? 0} people in this organization.</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="row-list">
              {orgQuery.data?.organization.members.map((member) => (
                <div className="row-item" key={member.userId}>
                  <span className="row-item-avatar">{(member.user.displayName || member.user.email).slice(0, 1).toUpperCase()}</span>
                  <div className="row-item-main">
                    <div className="row-item-title">{member.user.displayName || member.user.email}</div>
                    <div className="row-item-sub">{member.user.email}</div>
                  </div>
                  {isAdmin ? (
                    <div className="row-item-actions">
                      <select
                        className="role-select"
                        value={member.role}
                        onChange={(e) => roleMutation.mutate({ userId: member.userId, role: e.target.value as OrgRole })}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <button type="button" className="btn-danger-ghost btn-icon" onClick={() => removeMutation.mutate(member.userId)} aria-label="Remove member">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="pill pill-visibility-ORGANIZATION">{member.role}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="panel-head-text">
              <h2><GitBranch size={16} style={{ display: "inline", verticalAlign: -2, marginRight: 6 }} />GitHub integration</h2>
              <p>Connect an authorized GitHub account to sync repositories.</p>
            </div>
          </div>
          <div className="panel-body">
            {!integrationsQuery.data?.githubConfigured ? (
              <div className="empty-state">
                <span className="empty-state-icon"><Unplug size={20} /></span>
                <h3>GitHub isn't configured on this server</h3>
                <p>Set GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET in the backend environment to enable this.</p>
              </div>
            ) : githubIntegration?.status === "CONNECTED" ? (
              <div className="row-item" style={{ borderBottom: "none", padding: 0 }}>
                <span className="row-item-avatar"><Check size={16} /></span>
                <div className="row-item-main">
                  <div className="row-item-title">Connected</div>
                  <div className="row-item-sub">Account id: {githubIntegration.externalAccountId}</div>
                </div>
                {canManageIntegrations && (
                  <button type="button" className="btn-outline btn-sm" onClick={() => disconnectGithubMutation.mutate()} disabled={disconnectGithubMutation.isPending}>
                    Disconnect
                  </button>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-state-icon"><GitBranch size={20} /></span>
                <h3>Not connected yet</h3>
                <p>Connect GitHub to discover and synchronize repositories for this organization.</p>
                {canManageIntegrations && (
                  <button type="button" className="btn-primary" onClick={() => connectGithubMutation.mutate()} disabled={connectGithubMutation.isPending}>
                    {connectGithubMutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <GitBranch size={15} />}
                    Connect GitHub
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {isAdmin && (
        <section className="panel">
          <div className="panel-head">
            <div className="panel-head-text">
              <h2><Mail size={16} style={{ display: "inline", verticalAlign: -2, marginRight: 6 }} />Invitations</h2>
              <p>Invite teammates by email. They'll accept once signed in to ForgeIQ.</p>
            </div>
          </div>
          <div className="panel-body">
            <form className="search-row" onSubmit={handleInvite} style={{ marginBottom: 16 }}>
              <input className="app-input" style={{ maxWidth: 280 }} type="email" placeholder="teammate@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
              <select className="role-select" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as OrgRole)}>
                {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
              <button type="submit" className="btn-primary btn-sm" disabled={inviteMutation.isPending}>
                <Plus size={14} /> Send invite
              </button>
            </form>
            {inviteError && <p className="field-error">{inviteError}</p>}
            <div className="row-list">
              {invitesQuery.data?.length === 0 && <p style={{ color: "var(--muted)", fontSize: ".86rem" }}>No pending invites.</p>}
              {invitesQuery.data?.map((invite) => (
                <div className="row-item" key={invite.id}>
                  <span className="row-item-avatar"><Mail size={14} /></span>
                  <div className="row-item-main">
                    <div className="row-item-title">{invite.email}</div>
                    <div className="row-item-sub">Invited as {invite.role} · expires {new Date(invite.expiresAt).toLocaleDateString()}</div>
                  </div>
                  <button type="button" className="btn-danger-ghost btn-sm" onClick={() => revokeMutation.mutate(invite.id)}>Revoke</button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {(isAdmin || orgQuery.data?.myRole === "MANAGER") && (
        <section className="panel">
          <div className="panel-head">
            <div className="panel-head-text">
              <h2><Shield size={16} style={{ display: "inline", verticalAlign: -2, marginRight: 6 }} />Audit log</h2>
              <p>Sensitive actions taken in this organization.</p>
            </div>
          </div>
          <div className="panel-body">
            {auditQuery.data?.length === 0 && <p style={{ color: "var(--muted)", fontSize: ".86rem" }}>No audit events yet.</p>}
            <div className="row-list">
              {auditQuery.data?.map((entry) => (
                <div className="row-item" key={entry.id}>
                  <span className="row-item-avatar"><AlertTriangle size={14} /></span>
                  <div className="row-item-main">
                    <div className="row-item-title">{entry.action.replace(/_/g, " ").toLowerCase()}</div>
                    <div className="row-item-sub">{entry.actor.displayName || entry.actor.email} · {new Date(entry.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {isAdmin && <CreateOrganizationCard />}
    </>
  );
}
