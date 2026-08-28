import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { getAuthenticatedUser, loginUser, registerUser, revokeSession } from "../services/auth.service.js";

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