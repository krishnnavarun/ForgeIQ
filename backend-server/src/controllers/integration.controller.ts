import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import * as integrationService from "../services/integration.service.js";
import {
  buildGithubAuthUrl,
  consumeGithubOAuthState,
  createGithubOAuthState,
  exchangeGithubCode,
  isGithubAuthConfigured,
} from "../services/github.service.js";

export async function listIntegrations(request: Request, response: Response) {
  const integrations = await integrationService.listIntegrations(request.params.organizationId as string);
  response.json({ integrations, githubConfigured: isGithubAuthConfigured() });
}

export function githubStart(request: Request, response: Response) {
  // Returns the authorization URL as JSON rather than redirecting directly:
  // this endpoint is called with our normal Bearer-token fetch (a full-page
  // redirect from a plain <a>/window.location navigation could not carry
  // that header, and a bearer token must never be put in a URL).  The
  // frontend navigates the browser to the returned url itself.
  if (!request.auth) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
  if (!isGithubAuthConfigured()) {
    throw new AppError(503, "GITHUB_AUTH_NOT_CONFIGURED", "GitHub integration is not configured on this server.");
  }
  const organizationId = request.params.organizationId as string;
  const state = createGithubOAuthState({ organizationId, userId: request.auth.userId });
  response.json({ url: buildGithubAuthUrl(state) });
}

export async function githubCallback(request: Request, response: Response) {
  const { code, state, error } = request.query;
  const statePayload = consumeGithubOAuthState(state);

  if (error || typeof code !== "string" || !statePayload) {
    console.warn("GitHub OAuth callback rejected before exchange:", { error, hasCode: typeof code === "string", hasState: Boolean(statePayload) });
    response.redirect(`${env.FRONTEND_URL}/organization?github_error=1`);
    return;
  }

  try {
    const { accessToken, externalAccountId } = await exchangeGithubCode(code);
    await integrationService.upsertGithubIntegration(statePayload.organizationId, statePayload.userId, {
      externalAccountId,
      accessToken,
    });
    response.redirect(`${env.FRONTEND_URL}/organization?github_connected=1`);
  } catch (githubError) {
    console.error("GitHub OAuth callback failed:", githubError);
    response.redirect(`${env.FRONTEND_URL}/organization?github_error=1`);
  }
}

export async function disconnectGithub(request: Request, response: Response) {
  if (!request.auth) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
  await integrationService.disconnectGithubIntegration(request.params.organizationId as string, request.auth.userId);
  response.status(204).send();
}
