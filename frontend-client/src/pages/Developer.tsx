import { type FormEvent, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Building2,
  Check,
  Eye,
  FolderGit2,
  GitBranch,
  Globe,
  Contact2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { AppOutletContext } from "@/layouts/AppLayout";
import { initialsOf } from "@/lib/initials";
import { computeCompleteness } from "@/lib/profileCompleteness";
import { ApiError } from "@/services/api";
import {
  createProject,
  deleteProject,
  updateMyProfile,
  updateProject,
  type DeveloperProject,
  type ProfilePatch,
  type ProfileVisibility,
  type ProjectPatch,
} from "@/services/profile";
import { expressInterest, listMyInterests, withdrawInterest } from "@/services/candidates";
import { listOrganizationDirectory } from "@/services/organizations";

type ProfileForm = {
  displayName: string;
  headline: string;
  bio: string;
  location: string;
  githubUsername: string;
  websiteUrl: string;
  linkedinUrl: string;
  skills: string[];
  openToOpportunities: boolean;
  profileVisibility: ProfileVisibility;
};

const VISIBILITY_OPTIONS: Array<{ value: ProfileVisibility; label: string; description: string }> = [
  { value: "PRIVATE", label: "Private", description: "Only visible to you." },
  { value: "ORGANIZATION", label: "Organizations", description: "Visible to orgs you interact with." },
  { value: "PUBLIC", label: "Public", description: "Discoverable by authorized recruiters." },
];

type ProjectDraft = { title: string; description: string; projectUrl: string; repoUrl: string; tags: string };

const EMPTY_DRAFT: ProjectDraft = { title: "", description: "", projectUrl: "", repoUrl: "", tags: "" };

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function Developer() {
  const { profile, loadingProfile, refreshProfile } = useOutletContext<AppOutletContext>();
  const queryClient = useQueryClient();
  const [orgSearch, setOrgSearch] = useState("");

  const directoryQuery = useQuery({ queryKey: ["organization-directory"], queryFn: listOrganizationDirectory });
  const interestsQuery = useQuery({ queryKey: ["my-interests"], queryFn: listMyInterests });
  const interestedIds = new Set((interestsQuery.data ?? []).map((org) => org.id));

  const interestMutation = useMutation({
    mutationFn: (input: { organizationId: string; interested: boolean }) =>
      input.interested ? withdrawInterest(input.organizationId) : expressInterest(input.organizationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-interests"] }),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [skillDraft, setSkillDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState("");

  const [addingProject, setAddingProject] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(EMPTY_DRAFT);
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectError, setProjectError] = useState("");

  if (loadingProfile || !profile) {
    return (
      <div className="panel">
        <div className="empty-state">
          <Loader2 className="animate-spin" size={22} />
          <h3>Loading your profile…</h3>
        </div>
      </div>
    );
  }

  const completeness = computeCompleteness(profile);
  const initials = initialsOf(profile.displayName, profile.email);
  const memberSince = new Date(profile.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  function enterEditMode() {
    if (!profile) return;
    setForm({
      displayName: profile.displayName ?? "",
      headline: profile.headline ?? "",
      bio: profile.bio ?? "",
      location: profile.location ?? "",
      githubUsername: profile.githubUsername ?? "",
      websiteUrl: profile.websiteUrl ?? "",
      linkedinUrl: profile.linkedinUrl ?? "",
      skills: profile.skills,
      openToOpportunities: profile.openToOpportunities,
      profileVisibility: profile.profileVisibility,
    });
    setSkillDraft("");
    setSaveState("idle");
    setSaveError("");
    setIsEditing(true);
  }

  function cancelEditMode() {
    setIsEditing(false);
    setForm(null);
  }

  function addSkill() {
    const value = skillDraft.trim();
    if (!value || !form) return;
    if (form.skills.some((skill) => skill.toLowerCase() === value.toLowerCase())) {
      setSkillDraft("");
      return;
    }
    if (form.skills.length >= 24) return;
    setForm({ ...form, skills: [...form.skills, value] });
    setSkillDraft("");
  }

  function removeSkill(skill: string) {
    if (!form) return;
    setForm({ ...form, skills: form.skills.filter((entry) => entry !== skill) });
  }

  async function handleSaveProfile() {
    if (!form) return;
    setSaving(true);
    setSaveError("");
    const patch: ProfilePatch = {
      displayName: form.displayName.trim() || undefined,
      headline: form.headline,
      bio: form.bio,
      location: form.location,
      githubUsername: form.githubUsername,
      websiteUrl: form.websiteUrl,
      linkedinUrl: form.linkedinUrl,
      skills: form.skills,
      openToOpportunities: form.openToOpportunities,
      profileVisibility: form.profileVisibility,
    };
    try {
      await updateMyProfile(patch);
      await refreshProfile();
      setIsEditing(false);
      setForm(null);
      setSaveState("success");
      window.setTimeout(() => setSaveState("idle"), 2500);
    } catch (error) {
      setSaveState("error");
      setSaveError(errorMessage(error, "Could not save your profile. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  function startAddProject() {
    setEditingProjectId(null);
    setProjectDraft(EMPTY_DRAFT);
    setProjectError("");
    setAddingProject(true);
  }

  function startEditProject(project: DeveloperProject) {
    setAddingProject(false);
    setProjectError("");
    setEditingProjectId(project.id);
    setProjectDraft({
      title: project.title,
      description: project.description ?? "",
      projectUrl: project.projectUrl ?? "",
      repoUrl: project.repoUrl ?? "",
      tags: project.tags.join(", "),
    });
  }

  function cancelProjectForm() {
    setAddingProject(false);
    setEditingProjectId(null);
    setProjectDraft(EMPTY_DRAFT);
    setProjectError("");
  }

  function draftToPatch(draft: ProjectDraft): ProjectPatch {
    return {
      title: draft.title.trim(),
      description: draft.description.trim(),
      projectUrl: draft.projectUrl.trim(),
      repoUrl: draft.repoUrl.trim(),
      tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    };
  }

  async function handleSubmitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectDraft.title.trim()) {
      setProjectError("Give the project a title.");
      return;
    }
    setProjectSaving(true);
    setProjectError("");
    try {
      if (editingProjectId) {
        await updateProject(editingProjectId, draftToPatch(projectDraft));
      } else {
        await createProject(draftToPatch(projectDraft));
      }
      await refreshProfile();
      cancelProjectForm();
    } catch (error) {
      setProjectError(errorMessage(error, "Could not save this project. Please try again."));
    } finally {
      setProjectSaving(false);
    }
  }

  async function handleDeleteProject(project: DeveloperProject) {
    if (!window.confirm(`Remove "${project.title}" from your profile?`)) return;
    await deleteProject(project.id);
    await refreshProfile();
  }

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Developer profile</span>
          <h1>Your evidence-led profile</h1>
          <p>What you fill in here is what recruiters and organizations will eventually be able to discover — under your visibility rules.</p>
        </div>
        <div className="page-head-actions">
          {saveState === "success" && (
            <span className="save-status"><Check size={15} /> Saved</span>
          )}
          {isEditing ? (
            <>
              <button type="button" className="btn-outline" onClick={cancelEditMode} disabled={saving}>
                <X size={15} /> Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
                {saving ? <Loader2 className="animate-spin" size={15} /> : <Check size={15} />}
                Save changes
              </button>
            </>
          ) : (
            <button type="button" className="btn-primary" onClick={enterEditMode}>
              <Pencil size={15} /> Edit profile
            </button>
          )}
        </div>
      </div>

      {saveState === "error" && <p className="auth-error" role="alert">{saveError}</p>}

      <section className="panel">
        <div className="profile-banner" />
        <div className="profile-header">
          <span className="profile-avatar">{initials}</span>
          <div className="profile-header-row">
            <div>
              {isEditing && form ? (
                <input
                  className="app-input"
                  style={{ fontFamily: "var(--heading)", fontSize: "1.15rem", fontWeight: 600, maxWidth: 320 }}
                  value={form.displayName}
                  onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                  placeholder="Your name"
                />
              ) : (
                <h2 className="profile-name">{profile.displayName || profile.email.split("@")[0]}</h2>
              )}
              {isEditing && form ? (
                <input
                  className="app-input"
                  style={{ marginTop: 8, maxWidth: 420 }}
                  value={form.headline}
                  onChange={(event) => setForm({ ...form, headline: event.target.value })}
                  placeholder="Headline — e.g. Backend engineer, distributed systems"
                  maxLength={140}
                />
              ) : (
                profile.headline && <p className="profile-headline">{profile.headline}</p>
              )}
            </div>
            <div className="profile-links">
              {profile.profileVisibility && (
                <span className={`pill pill-visibility-${profile.profileVisibility}`}>
                  <Eye size={12} /> {VISIBILITY_OPTIONS.find((option) => option.value === profile.profileVisibility)?.label}
                </span>
              )}
              {profile.openToOpportunities && (
                <span className="pill pill-open"><Briefcase size={12} /> Open to opportunities</span>
              )}
            </div>
          </div>

          <div className="profile-meta-row">
            <span><MapPin size={14} /> {isEditing && form ? (
              <input
                className="app-input"
                style={{ height: 30, padding: "2px 8px", fontSize: ".8rem" }}
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
                placeholder="Location (optional)"
              />
            ) : (profile.location || "Location not set")}</span>
            <span>Member since {memberSince}</span>
          </div>

          {isEditing && form ? (
            <div className="app-field-row" style={{ marginTop: 16 }}>
              <div className="app-field">
                <label className="app-label"><GitBranch size={14} /> GitHub username</label>
                <input
                  className="app-input"
                  value={form.githubUsername}
                  onChange={(event) => setForm({ ...form, githubUsername: event.target.value.replace(/^@/, "") })}
                  placeholder="octocat"
                />
              </div>
              <div className="app-field">
                <label className="app-label"><Globe size={14} /> Website</label>
                <input
                  className="app-input"
                  value={form.websiteUrl}
                  onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })}
                  onBlur={(event) => setForm({ ...form, websiteUrl: normalizeUrl(event.target.value) })}
                  placeholder="yourdomain.dev"
                />
              </div>
              <div className="app-field">
                <label className="app-label"><Contact2 size={14} /> LinkedIn</label>
                <input
                  className="app-input"
                  value={form.linkedinUrl}
                  onChange={(event) => setForm({ ...form, linkedinUrl: event.target.value })}
                  onBlur={(event) => setForm({ ...form, linkedinUrl: normalizeUrl(event.target.value) })}
                  placeholder="linkedin.com/in/you"
                />
              </div>
            </div>
          ) : (
            (profile.githubUsername || profile.websiteUrl || profile.linkedinUrl) && (
              <div className="profile-links">
                {profile.githubUsername && (
                  <a className="profile-link-chip" href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noreferrer">
                    <GitBranch size={14} /> {profile.githubUsername}
                  </a>
                )}
                {profile.websiteUrl && (
                  <a className="profile-link-chip" href={profile.websiteUrl} target="_blank" rel="noreferrer">
                    <Globe size={14} /> Website
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a className="profile-link-chip" href={profile.linkedinUrl} target="_blank" rel="noreferrer">
                    <Contact2 size={14} /> LinkedIn
                  </a>
                )}
              </div>
            )
          )}
        </div>
      </section>

      <div className="section-split" style={{ gap: 20, alignItems: "start" }}>
        <section className="panel">
          <div className="panel-head">
            <div className="panel-head-text">
              <h2>About</h2>
              <p>A short bio recruiters and teammates will see.</p>
            </div>
          </div>
          <div className="panel-body">
            {isEditing && form ? (
              <textarea
                className="app-textarea"
                value={form.bio}
                onChange={(event) => setForm({ ...form, bio: event.target.value })}
                placeholder="Tell people what you build and care about."
                maxLength={600}
              />
            ) : profile.bio ? (
              <p style={{ color: "var(--text)", fontSize: ".9rem", lineHeight: 1.6 }}>{profile.bio}</p>
            ) : (
              <p style={{ color: "var(--muted)", fontSize: ".86rem" }}>No bio yet. Click "Edit profile" to add one.</p>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="panel-head-text">
              <h2>Profile completeness</h2>
              <p>{completeness.percent}% complete</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="completeness-row">
              <div className="completeness-track">
                <div className="completeness-fill" style={{ width: `${completeness.percent}%` }} />
              </div>
              <span className="completeness-value">{completeness.percent}%</span>
            </div>
            <div className="completeness-checklist">
              {completeness.items.map((item) => (
                <div key={item.label} className={`completeness-item${item.done ? " is-done" : ""}`}>
                  {item.done ? <Check size={15} /> : <span style={{ width: 15, display: "inline-block" }} />}
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2>Skills</h2>
            <p>What you'd want a filter or a teammate to find you by.</p>
          </div>
        </div>
        <div className="panel-body">
          <div className="skill-chip-list">
            {(isEditing && form ? form.skills : profile.skills).length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: ".86rem" }}>No skills added yet.</p>
            )}
            {(isEditing && form ? form.skills : profile.skills).map((skill) => (
              <span className="skill-chip" key={skill}>
                {skill}
                {isEditing && (
                  <button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>
                    <X size={11} />
                  </button>
                )}
              </span>
            ))}
          </div>
          {isEditing && (
            <div className="skill-input-row">
              <input
                className="app-input"
                value={skillDraft}
                onChange={(event) => setSkillDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Add a skill and press Enter — e.g. TypeScript"
              />
              <button type="button" className="btn-outline" onClick={addSkill}>
                <Plus size={15} /> Add
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2>Visibility &amp; opportunities</h2>
            <p>Organizations never get automatic access — this is what controls it.</p>
          </div>
        </div>
        <div className="panel-body" style={{ gap: 18, display: "flex", flexDirection: "column" }}>
          <div className="visibility-grid">
            {VISIBILITY_OPTIONS.map((option) => {
              const selected = (isEditing && form ? form.profileVisibility : profile.profileVisibility) === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`visibility-option${selected ? " is-selected" : ""}`}
                  disabled={!isEditing}
                  onClick={() => form && setForm({ ...form, profileVisibility: option.value })}
                >
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </button>
              );
            })}
          </div>
          <div className="switch-row">
            <div className="switch-row-text">
              <strong>Open to opportunities</strong>
              <span>Signals to authorized recruiters that you're interested in hearing from them.</span>
            </div>
            <button
              type="button"
              className={`switch${(isEditing && form ? form.openToOpportunities : profile.openToOpportunities) ? " is-on" : ""}`}
              disabled={!isEditing}
              onClick={() => form && setForm({ ...form, openToOpportunities: !form.openToOpportunities })}
              aria-pressed={isEditing && form ? form.openToOpportunities : profile.openToOpportunities}
              aria-label="Toggle open to opportunities"
            />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2><Building2 size={16} style={{ display: "inline", verticalAlign: -2, marginRight: 6 }} />Organizations you're interested in</h2>
            <p>Only orgs you mark here can see your profile if it's set to "Organizations" visibility.</p>
          </div>
        </div>
        <div className="panel-body">
          <input
            className="app-input"
            style={{ maxWidth: 280, marginBottom: 12 }}
            placeholder="Search organizations…"
            value={orgSearch}
            onChange={(event) => setOrgSearch(event.target.value)}
          />
          <div className="row-list">
            {(directoryQuery.data ?? [])
              .filter((org) => org.name.toLowerCase().includes(orgSearch.toLowerCase()))
              .slice(0, 12)
              .map((org) => {
                const interested = interestedIds.has(org.id);
                return (
                  <div className="row-item" key={org.id}>
                    <span className="row-item-avatar">{org.name.slice(0, 1).toUpperCase()}</span>
                    <div className="row-item-main">
                      <div className="row-item-title">{org.name}</div>
                      {org.description && <div className="row-item-sub">{org.description}</div>}
                    </div>
                    <button
                      type="button"
                      className={interested ? "btn-primary btn-sm" : "btn-outline btn-sm"}
                      onClick={() => interestMutation.mutate({ organizationId: org.id, interested })}
                    >
                      {interested ? <Check size={13} /> : <Plus size={13} />}
                      {interested ? "Interested" : "Show interest"}
                    </button>
                  </div>
                );
              })}
            {directoryQuery.data?.length === 0 && <p style={{ color: "var(--muted)", fontSize: ".86rem" }}>No organizations exist yet.</p>}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div className="panel-head-text">
            <h2>Projects</h2>
            <p>Manual entries for now — these carry over once repositories sync automatically.</p>
          </div>
          {!addingProject && !editingProjectId && (
            <button type="button" className="btn-outline btn-sm" onClick={startAddProject}>
              <Plus size={14} /> Add project
            </button>
          )}
        </div>
        <div className="panel-body">
          {profile.projects.length === 0 && !addingProject ? (
            <div className="empty-state">
              <span className="empty-state-icon"><FolderGit2 size={22} /></span>
              <h3>No projects yet</h3>
              <p>Add the work you're proud of — a repo link, a live URL, and a few tags is plenty.</p>
              <button type="button" className="btn-primary" onClick={startAddProject}>
                <Plus size={15} /> Add your first project
              </button>
            </div>
          ) : (
            <div className="project-grid">
              {profile.projects.map((project) =>
                editingProjectId === project.id ? (
                  <ProjectForm
                    key={project.id}
                    draft={projectDraft}
                    setDraft={setProjectDraft}
                    onSubmit={handleSubmitProject}
                    onCancel={cancelProjectForm}
                    saving={projectSaving}
                    error={projectError}
                    submitLabel="Save changes"
                  />
                ) : (
                  <article className="project-card" key={project.id}>
                    <div className="project-card-head">
                      <h3>{project.title}</h3>
                      <div className="project-card-actions">
                        <button type="button" className="btn-ghost btn-icon" onClick={() => startEditProject(project)} aria-label="Edit project">
                          <Pencil size={14} />
                        </button>
                        <button type="button" className="btn-danger-ghost btn-icon" onClick={() => handleDeleteProject(project)} aria-label="Delete project">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {project.description && <p className="desc">{project.description}</p>}
                    {project.tags.length > 0 && (
                      <div className="project-card-tags">
                        {project.tags.map((tag) => (
                          <span className="project-tag" key={tag}>{tag}</span>
                        ))}
                      </div>
                    )}
                    {(project.projectUrl || project.repoUrl) && (
                      <div className="project-card-links">
                        {project.projectUrl && (
                          <a href={project.projectUrl} target="_blank" rel="noreferrer"><Globe size={13} /> Live</a>
                        )}
                        {project.repoUrl && (
                          <a href={project.repoUrl} target="_blank" rel="noreferrer"><GitBranch size={13} /> Repo</a>
                        )}
                      </div>
                    )}
                  </article>
                ),
              )}
              {addingProject && (
                <ProjectForm
                  draft={projectDraft}
                  setDraft={setProjectDraft}
                  onSubmit={handleSubmitProject}
                  onCancel={cancelProjectForm}
                  saving={projectSaving}
                  error={projectError}
                  submitLabel="Add project"
                />
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function ProjectForm({
  draft,
  setDraft,
  onSubmit,
  onCancel,
  saving,
  error,
  submitLabel,
}: {
  draft: ProjectDraft;
  setDraft: (draft: ProjectDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
  submitLabel: string;
}) {
  return (
    <form className="project-card" onSubmit={onSubmit} style={{ gridColumn: "1 / -1", maxWidth: 480 }}>
      <div className="app-field">
        <label className="app-label" htmlFor="project-title">Title</label>
        <input
          id="project-title"
          className="app-input"
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          placeholder="ForgeIQ"
          autoFocus
        />
      </div>
      <div className="app-field">
        <label className="app-label" htmlFor="project-description">Description</label>
        <textarea
          id="project-description"
          className="app-textarea"
          style={{ minHeight: 64 }}
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          placeholder="What it does, and your role in it."
        />
      </div>
      <div className="app-field-row">
        <div className="app-field">
          <label className="app-label" htmlFor="project-live">Live URL</label>
          <input
            id="project-live"
            className="app-input"
            value={draft.projectUrl}
            onChange={(event) => setDraft({ ...draft, projectUrl: event.target.value })}
            onBlur={(event) => setDraft({ ...draft, projectUrl: normalizeUrl(event.target.value) })}
            placeholder="yourproject.com"
          />
        </div>
        <div className="app-field">
          <label className="app-label" htmlFor="project-repo">Repository URL</label>
          <input
            id="project-repo"
            className="app-input"
            value={draft.repoUrl}
            onChange={(event) => setDraft({ ...draft, repoUrl: event.target.value })}
            onBlur={(event) => setDraft({ ...draft, repoUrl: normalizeUrl(event.target.value) })}
            placeholder="github.com/you/project"
          />
        </div>
      </div>
      <div className="app-field">
        <label className="app-label" htmlFor="project-tags">Tags</label>
        <input
          id="project-tags"
          className="app-input"
          value={draft.tags}
          onChange={(event) => setDraft({ ...draft, tags: event.target.value })}
          placeholder="React, Node.js, Postgres"
        />
        <span className="app-hint">Comma-separated.</span>
      </div>
      {error && <p className="field-error">{error}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button type="button" className="btn-outline btn-sm" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn-primary btn-sm" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
