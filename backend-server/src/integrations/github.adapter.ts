import { AppError } from "../utils/AppError.js";

const GITHUB_API = "https://api.github.com";
const PER_PAGE = 100;
const MAX_PAGES = 3; // MVP cap to keep synchronous sync fast and stay well under rate limits.

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function githubGet<T>(token: string, path: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, { headers: headers(token) });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("GitHub API request failed:", path, response.status, body);
    if (response.status === 401) throw new AppError(401, "GITHUB_AUTH_FAILED", "The GitHub connection is no longer authorized.");
    if (response.status === 403) throw new AppError(429, "GITHUB_RATE_LIMITED", "GitHub API rate limit reached. Try again later.");
    throw new AppError(502, "GITHUB_REQUEST_FAILED", "GitHub did not return the requested data.");
  }
  return response.json() as Promise<T>;
}

async function githubGetPaged<T>(token: string, path: string, params: Record<string, string> = {}): Promise<T[]> {
  const results: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const query = new URLSearchParams({ per_page: String(PER_PAGE), page: String(page), ...params });
    const batch = await githubGet<T[]>(token, `${path}?${query.toString()}`);
    results.push(...batch);
    if (batch.length < PER_PAGE) break;
  }
  return results;
}

export type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  updated_at: string;
};

export async function fetchAuthorizedRepositories(token: string) {
  return githubGetPaged<GithubRepo>(token, "/user/repos", { sort: "updated", affiliation: "owner,collaborator,organization_member" });
}

export type GithubIssue = {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  created_at: string;
  closed_at: string | null;
  pull_request?: unknown;
};

/** GitHub's /issues endpoint also returns pull requests — this adapter filters those out. */
export async function fetchIssues(token: string, owner: string, repo: string) {
  const all = await githubGetPaged<GithubIssue>(token, `/repos/${owner}/${repo}/issues`, { state: "all" });
  return all.filter((issue) => !issue.pull_request);
}

export type GithubPullRequest = {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  merged_at: string | null;
  created_at: string;
  closed_at: string | null;
};

export async function fetchPullRequests(token: string, owner: string, repo: string) {
  return githubGetPaged<GithubPullRequest>(token, `/repos/${owner}/${repo}/pulls`, { state: "all" });
}

export type GithubReview = {
  id: number;
  state: string;
  submitted_at: string | null;
};

export async function fetchReviews(token: string, owner: string, repo: string, pullNumber: number) {
  return githubGetPaged<GithubReview>(token, `/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`);
}

export type GithubCommit = {
  sha: string;
  commit: { message: string; author: { date: string } | null };
};

export async function fetchCommits(token: string, owner: string, repo: string) {
  return githubGetPaged<GithubCommit>(token, `/repos/${owner}/${repo}/commits`);
}
