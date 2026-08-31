import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import * as candidateService from "../services/candidate.service.js";
import type { CandidateSearchQuery } from "../validators/organization.validators.js";

function requireAuth(request: Request) {
  if (!request.auth) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
  return request.auth;
}

export async function searchCandidates(request: Request, response: Response) {
  const result = await candidateService.searchCandidates(
    request.params.organizationId as string,
    request.validated?.query as unknown as CandidateSearchQuery,
  );
  response.json(result);
}

export async function expressInterest(request: Request, response: Response) {
  const { userId } = requireAuth(request);
  await candidateService.setCandidateInterest(request.params.organizationId as string, userId, true);
  response.status(204).send();
}

export async function withdrawInterest(request: Request, response: Response) {
  const { userId } = requireAuth(request);
  await candidateService.setCandidateInterest(request.params.organizationId as string, userId, false);
  response.status(204).send();
}

export async function listMyInterests(request: Request, response: Response) {
  const { userId } = requireAuth(request);
  const organizations = await candidateService.listMyInterests(userId);
  response.json({ organizations });
}

export async function addToShortlist(request: Request, response: Response) {
  const { userId } = requireAuth(request);
  const entry = await candidateService.addToShortlist(
    request.params.organizationId as string,
    userId,
    request.params.userId as string,
    request.body?.note,
  );
  response.status(201).json({ entry });
}

export async function removeFromShortlist(request: Request, response: Response) {
  const { userId } = requireAuth(request);
  await candidateService.removeFromShortlist(request.params.organizationId as string, userId, request.params.userId as string);
  response.status(204).send();
}

export async function listShortlist(request: Request, response: Response) {
  const entries = await candidateService.listShortlist(request.params.organizationId as string);
  response.json({ entries });
}
