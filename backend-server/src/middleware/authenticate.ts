import type { NextFunction, Request, Response } from "express";
import { database } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/token.js";

export async function authenticate(request: Request, _response: Response, next: NextFunction) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "UNAUTHENTICATED", "Authentication is required."));
    return;
  }

  try {
    const claims = verifyAccessToken(header.slice("Bearer ".length));
    if (!claims.sub || !claims.sid) throw new Error("Token claims are incomplete");

    const session = await database.authSession.findFirst({
      where: { id: claims.sid, userId: claims.sub, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true },
    });
    if (!session) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");

    request.auth = { userId: claims.sub, sessionId: claims.sid };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, "UNAUTHENTICATED", "Authentication is required."));
  }
}