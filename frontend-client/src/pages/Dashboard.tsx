import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Circle,
  FolderGit2,
  GitBranch,
  Tags,
  User,
} from "lucide-react";
import type { AppOutletContext } from "@/layouts/AppLayout";
import { computeCompleteness } from "@/lib/profileCompleteness";
import { useOrganization } from "@/context/organization-context";
import { getIntegrations, listRepositories } from "@/services/repositories";

export function Dashboard() {
  const { profile, loadingProfile } = useOutletContext<AppOutletContext>();
  const { currentOrg } = useOrganization();
  const completeness = useMemo(() => (profile ? computeCompleteness(profile) : null), [profile]);
  const firstName = (profile?.displayName?.trim() || profile?.email.split("@")[0] || "there").split(" ")[0];

  const integrationsQuery = useQuery({
    queryKey: ["integrations", currentOrg?.id],
    queryFn: () => getIntegrations(currentOrg?.id as string),
    enabled: Boolean(currentOrg),
  });
  const repositoriesQuery = useQuery({
    queryKey: ["repositories", currentOrg?.id],
    queryFn: () => listRepositories(currentOrg?.id as string),
    enabled: Boolean(currentOrg),
  });
  const githubIntegration = integrationsQuery.data?.integrations.find((i) => i.provider === "GITHUB");
  const githubConnected = githubIntegration?.status === "CONNECTED";

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Developer workspace</span>
          <h1>Welcome back, {firstName}</h1>
          <p>
            This is your evidence-led developer intelligence hub. Build out your profile now — repository
            activity, metrics, and AI insights layer in automatically once GitHub sync is enabled.
          </p>
        </div>
        <div className="page-head-actions">
          <Link to="/developer" className="btn-outline">
            <User size={15} /> Edit profile
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-card-icon"><Tags size={19} /></span>
          <div>
            <div className="stat-card-value">{profile?.skills.length ?? (loadingProfile ? "—" : 0)}</div>
            <div className="stat-card-label">Skills listed</div>
            <p className="stat-card-hint">Recruiters filter on these first.</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-card-icon"><FolderGit2 size={19} /></span>
          <div>
            <div className="stat-card-value">{profile?.projects.length ?? (loadingProfile ? "—" : 0)}</div>
            <div className="stat-card-label">Projects added</div>
            <p className="stat-card-hint">Manual entries until GitHub sync lands.</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-card-icon"><GitBranch size={19} /></span>
          <div>
            <div className="stat-card-value">{currentOrg ? (repositoriesQuery.data?.length ?? "—") : 0}</div>
            <div className="stat-card-label">Repositories connected</div>
            <p className="stat-card-hint">{currentOrg ? "In your current organization." : "Create an organization to connect GitHub."}</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-card-icon"><Briefcase size={19} /></span>
          <div>
            <div className="stat-card-value">{profile?.openToOpportunities ? "Open" : "Not listed"}</div>
            <div className="stat-card-label">Opportunity status</div>
            <p className="stat-card-hint">Controls whether orgs can discover you.</p>
          </div>
        </div>
      </div>

      <div className="section-split" style={{ gap: 20, alignItems: "stretch" }}>
        <section className="panel">
          <div className="panel-head">
            <div className="panel-head-text">
              <h2>Profile completeness</h2>
              <p>A fuller profile is what makes candidate discovery meaningful later.</p>
            </div>
          </div>
          <div className="panel-body">
            {completeness ? (
              <>
                <div className="completeness-row">
                  <div className="completeness-track">
                    <div className="completeness-fill" style={{ width: `${completeness.percent}%` }} />
                  </div>
                  <span className="completeness-value">{completeness.percent}%</span>
                </div>
                <div className="completeness-checklist">
                  {completeness.items.map((item) => (
                    <div key={item.label} className={`completeness-item${item.done ? " is-done" : ""}`}>
                      {item.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      {item.label}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ color: "var(--muted)", fontSize: ".86rem" }}>Loading your profile…</p>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="panel-head-text">
              <h2>GitHub</h2>
              <p>Bring real commits, PRs, and reviews into ForgeIQ.</p>
            </div>
            {!integrationsQuery.data?.githubConfigured && <span className="coming-soon">Not configured</span>}
          </div>
          {!currentOrg ? (
            <div className="empty-state">
              <span className="empty-state-icon"><Building2 size={22} /></span>
              <h3>No organization yet</h3>
              <p>GitHub connects at the organization level. Create one to get started.</p>
              <Link to="/organization" className="btn-primary">Go to Organization</Link>
            </div>
          ) : githubConnected ? (
            <div className="empty-state">
              <span className="empty-state-icon"><GitBranch size={22} /></span>
              <h3>Connected</h3>
              <p>{repositoriesQuery.data?.length ?? 0} repositories tracked for {currentOrg.name}.</p>
              <Link to="/repositories" className="btn-outline">Manage repositories</Link>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-state-icon"><GitBranch size={22} /></span>
              <h3>Not connected yet</h3>
              <p>
                {integrationsQuery.data?.githubConfigured
                  ? "Connect an authorized GitHub account to start synchronizing engineering data."
                  : "GitHub isn't configured on this server yet — set GITHUB_CLIENT_ID/SECRET to enable it."}
              </p>
              <Link to="/organization" className="btn-outline">Go to Organization</Link>
            </div>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2>Recent activity</h2>
            <p>Engineering signals will populate this feed once a repository is connected.</p>
          </div>
        </div>
        <div className="empty-state">
          <span className="empty-state-icon"><ArrowRight size={20} /></span>
          <h3>Nothing to show yet</h3>
          <p>No mock data here — this feed only ever reflects real, synchronized activity.</p>
        </div>
      </section>
    </>
  );
}
