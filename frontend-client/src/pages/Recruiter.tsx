import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, ExternalLink, GitBranch, Globe, Search, Star, Users } from "lucide-react";
import { useOrganization } from "@/context/organization-context";
import {
  listShortlist,
  searchCandidates,
  shortlistCandidate,
  unshortlistCandidate,
  type CandidateSearchResult,
} from "@/services/candidates";

function CandidateCard({
  candidate,
  isShortlisted,
  onToggleShortlist,
}: {
  candidate: CandidateSearchResult;
  isShortlisted: boolean;
  onToggleShortlist: () => void;
}) {
  return (
    <article className="candidate-card">
      <div className="candidate-card-head">
        <span className="row-item-avatar">{(candidate.displayName ?? "?").slice(0, 1).toUpperCase()}</span>
        <div>
          <div className="candidate-card-name">{candidate.displayName ?? "Anonymous developer"}</div>
          {candidate.headline && <div className="candidate-card-headline">{candidate.headline}</div>}
        </div>
      </div>
      {candidate.bio && <p className="candidate-card-bio">{candidate.bio}</p>}
      {candidate.skills.length > 0 && (
        <div className="project-card-tags">
          {candidate.skills.slice(0, 6).map((skill) => <span className="project-tag" key={skill}>{skill}</span>)}
        </div>
      )}
      <div className="project-card-links">
        {candidate.githubUsername && (
          <a href={`https://github.com/${candidate.githubUsername}`} target="_blank" rel="noreferrer"><GitBranch size={13} /> GitHub</a>
        )}
        {candidate.websiteUrl && <a href={candidate.websiteUrl} target="_blank" rel="noreferrer"><Globe size={13} /> Website</a>}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 8 }}>
        {candidate.openToOpportunities ? <span className="pill pill-open"><Briefcase size={12} /> Open</span> : <span />}
        <button type="button" className={isShortlisted ? "btn-primary btn-sm" : "btn-outline btn-sm"} onClick={onToggleShortlist}>
          <Star size={13} /> {isShortlisted ? "Shortlisted" : "Shortlist"}
        </button>
      </div>
    </article>
  );
}

export function Recruiter() {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const organizationId = currentOrg?.id;
  const canRecruit = currentOrg && ["ADMIN", "MANAGER", "RECRUITER"].includes(currentOrg.myRole);
  const [skill, setSkill] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<{ skill?: string; search?: string }>({});

  const searchQuery = useQuery({
    queryKey: ["candidate-search", organizationId, activeFilters],
    queryFn: () => searchCandidates(organizationId as string, activeFilters),
    enabled: Boolean(organizationId && canRecruit),
  });

  const shortlistQuery = useQuery({
    queryKey: ["shortlist", organizationId],
    queryFn: () => listShortlist(organizationId as string),
    enabled: Boolean(organizationId && canRecruit),
  });

  const shortlistedIds = new Set((shortlistQuery.data ?? []).map((entry) => entry.candidate.id));

  const shortlistMutation = useMutation({
    mutationFn: (userId: string) =>
      shortlistedIds.has(userId) ? unshortlistCandidate(organizationId as string, userId) : shortlistCandidate(organizationId as string, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shortlist", organizationId] });
    },
  });

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    setActiveFilters({ skill: skill.trim() || undefined, search: search.trim() || undefined });
  }

  if (!currentOrg) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon"><Users size={22} /></span>
        <h3>No organization selected</h3>
        <p>Create or select an organization first.</p>
        <Link to="/organization" className="btn-primary">Go to Organization</Link>
      </div>
    );
  }

  if (!canRecruit) {
    return (
      <div className="panel">
        <div className="empty-state">
          <span className="empty-state-icon"><Users size={22} /></span>
          <h3>Recruiter access required</h3>
          <p>Your role ({currentOrg.myRole}) doesn't include candidate discovery. An admin can grant the RECRUITER role.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">{currentOrg.name}</span>
          <h1>Candidate discovery</h1>
          <p>Only candidates with a public profile, or who've explicitly opted into visibility for this organization, appear here.</p>
        </div>
      </div>

      <form className="search-row" onSubmit={handleSearch}>
        <input className="app-input" placeholder="Filter by skill (e.g. TypeScript)" value={skill} onChange={(e) => setSkill(e.target.value)} />
        <input className="app-input" placeholder="Search name or headline" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="submit" className="btn-primary btn-sm"><Search size={14} /> Search</button>
      </form>

      <section className="panel">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2>Results</h2>
            <p>{searchQuery.data?.total ?? 0} candidates match.</p>
          </div>
        </div>
        <div className="panel-body">
          {searchQuery.data?.candidates.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon"><Users size={22} /></span>
              <h3>No candidates match yet</h3>
              <p>Try a broader skill or clear the filters. Visibility is opt-in — most developers won't appear until they choose to.</p>
            </div>
          ) : (
            <div className="candidate-grid">
              {searchQuery.data?.candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  isShortlisted={shortlistedIds.has(candidate.id)}
                  onToggleShortlist={() => shortlistMutation.mutate(candidate.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><div className="panel-head-text"><h2><Star size={16} style={{ display: "inline", verticalAlign: -2, marginRight: 6 }} />Shortlist</h2><p>Candidates you've saved for this organization.</p></div></div>
        <div className="panel-body">
          {(shortlistQuery.data?.length ?? 0) === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: ".86rem" }}>Nobody shortlisted yet.</p>
          ) : (
            <div className="row-list">
              {shortlistQuery.data?.map((entry) => (
                <div className="row-item" key={entry.id}>
                  <span className="row-item-avatar">{(entry.candidate.displayName ?? "?").slice(0, 1).toUpperCase()}</span>
                  <div className="row-item-main">
                    <div className="row-item-title">{entry.candidate.displayName}</div>
                    <div className="row-item-sub">{entry.note || entry.candidate.headline || "No note added."}</div>
                  </div>
                  {entry.candidate.websiteUrl && (
                    <a href={entry.candidate.websiteUrl} target="_blank" rel="noreferrer" className="btn-outline btn-icon" aria-label="Open website">
                      <ExternalLink size={14} />
                    </a>
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
