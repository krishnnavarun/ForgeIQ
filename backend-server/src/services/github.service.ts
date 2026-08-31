import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { createOAuthStateStore } from "./oauthState.service.js";

const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";

type GithubOAuthState = { organizationId: string; userId: string };

const stateStore = createOAuthStateStore<GithubOAuthState>();

export function isGithubAuthConfigured() {
  return Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
}

export function createGithubOAuthState(payload: GithubOAuthState) {
  return stateStore.create(payload);
}

export function consumeGithubOAuthState(state: unknown) {
  return stateStore.consume(state);
}

export function buildGithubAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID ?? "",
    redirect_uri: env.GITHUB_REDIRECT_URI,
    scope: "repo read:org read:user user:email",
    state,
    allow_signup: "false",
  });
  return `${GITHUB_AUTH_URL}?${params.toString()}`;
}

type GithubTokenResponse = { access_token?: string; error?: string; error_description?: string };
type GithubUser = { id: number; login: string };

export async function exchangeGithubCode(code: string) {
  const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env.GITHUB_REDIRECT_URI,
    }),
  });

  const tokenPayload = (await tokenResponse.json()) as GithubTokenResponse;
  if (!tokenResponse.ok || tokenPayload.error || !tokenPayload.access_token) {
    console.error("GitHub token exchange failed:", tokenResponse.status, tokenPayload.error, tokenPayload.error_description);
    throw new AppError(401, "GITHUB_AUTH_FAILED", "GitHub did not accept the authorization code.");
  }

  const userResponse = await fetch(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!userResponse.ok) {
    console.error("GitHub user fetch failed:", userResponse.status, await userResponse.text());
    throw new AppError(401, "GITHUB_AUTH_FAILED", "Could not retrieve the authorized GitHub account.");
  }
  const user = (await userResponse.json()) as GithubUser;

  return { accessToken: tokenPayload.access_token, externalAccountId: String(user.id), login: user.login };
}
