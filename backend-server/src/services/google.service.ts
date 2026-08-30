import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

const STATE_TTL_MS = 5 * 60 * 1000;
const pendingStates = new Map<string, number>();

function pruneExpiredStates() {
  const now = Date.now();
  for (const [state, expiresAt] of pendingStates) {
    if (expiresAt <= now) pendingStates.delete(state);
  }
}

export function isGoogleAuthConfigured() {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

export function createOAuthState() {
  pruneExpiredStates();
  const state = randomUUID();
  pendingStates.set(state, Date.now() + STATE_TTL_MS);
  return state;
}

export function consumeOAuthState(state: unknown) {
  if (typeof state !== "string" || !state) return false;
  const expiresAt = pendingStates.get(state);
  pendingStates.delete(state);
  return typeof expiresAt === "number" && expiresAt > Date.now();
}

export function buildGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

type GoogleProfile = {
  email?: string;
  email_verified?: boolean;
  name?: string;
};

export async function exchangeGoogleCode(code: string) {
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID ?? "",
      client_secret: env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    console.error("Google token exchange failed:", tokenResponse.status, await tokenResponse.text());
    throw new AppError(401, "GOOGLE_AUTH_FAILED", "Google did not accept the authorization code.");
  }

  const tokenPayload = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenPayload.access_token) {
    console.error("Google token response had no access_token:", tokenPayload);
    throw new AppError(401, "GOOGLE_AUTH_FAILED", "Google did not return an access token.");
  }

  const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
  });

  if (!profileResponse.ok) {
    console.error("Google userinfo fetch failed:", profileResponse.status, await profileResponse.text());
    throw new AppError(401, "GOOGLE_AUTH_FAILED", "Could not retrieve your Google profile.");
  }

  const profile = (await profileResponse.json()) as GoogleProfile;
  if (!profile.email || !profile.email_verified) {
    throw new AppError(401, "GOOGLE_AUTH_FAILED", "Your Google account email is not verified.");
  }

  return { email: profile.email, displayName: profile.name };
}
