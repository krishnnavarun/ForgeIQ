import type { NextFunction, Request, Response } from "express";
import type { OrganizationMemberRole } from "@prisma/client";
import { database } from "../config/database.js";
import { AppError } from "../utils/AppError.js";

/**
 * Loads the caller's membership for the :organizationId route param and
 * enforces that its role is one of `allowedRoles`. Organization scope is
 * ALWAYS derived from a verified membership row, never trusted from the
 * client beyond "which org id are you asking about" — see docs/specs.md §33.
 */
export function requireOrgRole(...allowedRoles: OrganizationMemberRole[]) {
  return async (request: Request, _response: Response, next: NextFunction) => {
    try {
      if (!request.auth) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");

      const organizationId = request.params.organizationId as string | undefined;
      if (!organizationId) throw new AppError(400, "VALIDATION_ERROR", "An organization id is required.");

      const membership = await database.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId, userId: request.auth.userId } },
        select: { organizationId: true, role: true },
      });

      if (!membership) {
        throw new AppError(403, "FORBIDDEN", "You are not a member of this organization.");
      }
      if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
        throw new AppError(403, "FORBIDDEN", "Your role does not permit this action.");
      }

      request.membership = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/** Any active member may proceed; used when the action just needs org membership, no specific role. */
export function requireOrgMember() {
  return requireOrgRole();
}
