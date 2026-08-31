import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import {
  createProject,
  deleteProject,
  getProfile,
  updateProfile,
  updateProject,
} from "../services/profile.service.js";

function requireAuth(request: Request) {
  if (!request.auth) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");
  return request.auth;
}

export async function getMyProfile(request: Request, response: Response) {
  const { userId } = requireAuth(request);
  const profile = await getProfile(userId);
  response.json({ profile });
}

export async function updateMyProfile(request: Request, response: Response) {
  const { userId } = requireAuth(request);
  const profile = await updateProfile(userId, request.body);
  response.json({ profile });
}

export async function createMyProject(request: Request, response: Response) {
  const { userId } = requireAuth(request);
  const project = await createProject(userId, request.body);
  response.status(201).json({ project });
}

export async function updateMyProject(request: Request, response: Response) {
  const { userId } = requireAuth(request);
  const project = await updateProject(userId, request.params.projectId as string, request.body);
  response.json({ project });
}

export async function deleteMyProject(request: Request, response: Response) {
  const { userId } = requireAuth(request);
  await deleteProject(userId, request.params.projectId as string);
  response.status(204).send();
}
