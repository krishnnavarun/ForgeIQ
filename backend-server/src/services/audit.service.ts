import { database } from "../config/database.js";
import type { Prisma } from "@prisma/client";

type AuditInput = {
  organizationId: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
};

/** Fire-and-record audit trail for sensitive actions (role changes, integration connect/disconnect, member changes). */
export async function recordAuditLog(input: AuditInput) {
  await database.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata,
    },
  });
}
