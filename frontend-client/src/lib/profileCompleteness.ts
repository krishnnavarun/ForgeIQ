import type { DeveloperProfile } from "@/services/profile";

export function computeCompleteness(profile: DeveloperProfile) {
  const items = [
    { label: "Display name set", done: Boolean(profile.displayName?.trim()) },
    { label: "Headline added", done: Boolean(profile.headline?.trim()) },
    { label: "Bio written", done: Boolean(profile.bio?.trim()) },
    { label: "At least 3 skills listed", done: profile.skills.length >= 3 },
    { label: "A link (GitHub, site, or LinkedIn) added", done: Boolean(profile.githubUsername || profile.websiteUrl || profile.linkedinUrl) },
    { label: "At least one project added", done: profile.projects.length > 0 },
  ];
  const done = items.filter((item) => item.done).length;
  return { items, percent: Math.round((done / items.length) * 100) };
}
