import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { getAuthenticatedUser, loginUser, loginWithGoogleProfile, registerUser, revokeSession } from "../services/auth.service.js";
import { buildGoogleAuthUrl, consumeOAuthState, createOAuthState, exchangeGoogleCode, isGoogleAuthConfigured } from "../services/google.service.js";

export async function register(request: Request, response: Response) {
  const result = await registerUser(request.body);
  response.status(201).json(result);
}

export async function login(request: Request, response: Response) {
  const result = await loginUser(request.body);
  response.json(result);
}

export async function logout(request: Request, response: Response) {
  if (!request.auth) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
  await revokeSession(request.auth.sessionId, request.auth.userId);
  response.status(204).send();
}

export async function me(request: Request, response: Response) {
  if (!request.auth) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
  const user = await getAuthenticatedUser(request.auth.userId);
  if (!user) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
  response.json({ user });
}

export function googleStart(_request: Request, response: Response) {
  if (!isGoogleAuthConfigured()) {
    throw new AppError(503, "GOOGLE_AUTH_NOT_CONFIGURED", "Google sign-in is not configured on this server.");
  }
  const state = createOAuthState();
  response.redirect(buildGoogleAuthUrl(state));
}

export async function googleCallback(request: Request, response: Response) {
  const { code, state, error } = request.query;
  const stateIsValid = consumeOAuthState(state);

  if (error || typeof code !== "string" || !stateIsValid) {
    console.warn("Google OAuth callback rejected before exchange:", { error, hasCode: typeof code === "string", stateIsValid });
    response.redirect(`${env.FRONTEND_URL}/login?oauth_error=1`);
    return;
  }

  try {
    const profile = await exchangeGoogleCode(code);
    const result = await loginWithGoogleProfile(profile);
    console.info("Google OAuth succeeded, redirecting with token for:", profile.email);
    response.redirect(`${env.FRONTEND_URL}/oauth/callback#token=${encodeURIComponent(result.accessToken)}`);
  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    response.redirect(`${env.FRONTEND_URL}/login?oauth_error=1`);
  }
}