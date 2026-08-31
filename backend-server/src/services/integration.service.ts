import { database } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { decryptToken, encryptToken } from "../utils/tokenCipher.js";
import { recordAuditLog } from "./audit.service.js";

export async function listIntegrations(organizationId: string) {
  // Never return token material to the client, encrypted or not — select excludes it entirely.
  return database.integration.findMany({
    where: { organizationId },
    select: {
      id: true,
      organizationId: true,
      connectedByUserId: true,
      provider: true,
      status: true,
      externalAccountId: true,
      tokenExpiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function upsertGithubIntegration(
  organizationId: string,
  connectedByUserId: string,
  data: { externalAccountId: string; accessToken: string },
) {
  const integration = await database.integration.upsert({
    where: { organizationId_provider: { organizationId, provider: "GITHUB" } },
    create: {
      organizationId,
      connectedByUserId,
      provider: "GITHUB",
      status: "CONNECTED",
      externalAccountId: data.externalAccountId,
      accessTokenCiphertext: encryptToken(data.accessToken),
    },
    update: {
      connectedByUserId,
      status: "CONNECTED",
      externalAccountId: data.externalAccountId,
      accessTokenCiphertext: encryptToken(data.accessToken),
    },
  });
  await recordAuditLog({
    organizationId,
    actorUserId: connectedByUserId,
    action: "INTEGRATION_CONNECTED",
    resourceType: "Integration",
    resourceId: integration.id,
    metadata: { provider: "GITHUB" },
  });
  return integration;
}

export async function disconnectGithubIntegration(organizationId: string, actorUserId: string) {
  const integration = await database.integration.findUnique({
    where: { organizationId_provider: { organizationId, provider: "GITHUB" } },
  });
  if (!integration) throw new AppError(404, "RESOURCE_NOT_FOUND", "GitHub is not connected for this organization.");

  await database.integration.update({
    where: { id: integration.id },
    data: { status: "DISCONNECTED", accessTokenCiphertext: null },
  });
  await recordAuditLog({
    organizationId,
    actorUserId,
    action: "INTEGRATION_DISCONNECTED",
    resourceType: "Integration",
    resourceId: integration.id,
    metadata: { provider: "GITHUB" },
  });
}

/** Returns the decrypted GitHub token for an organization, or throws if not connected. */
export async function getGithubAccessToken(organizationId: string) {
  const integration = await database.integration.findUnique({
    where: { organizationId_provider: { organizationId, provider: "GITHUB" } },
  });
  if (!integration || integration.status !== "CONNECTED" || !integration.accessTokenCiphertext) {
    throw new AppError(409, "GITHUB_NOT_CONNECTED", "Connect GitHub for this organization first.");
  }
  try {
    return decryptToken(integration.accessTokenCiphertext);
  } catch {
    throw new AppError(409, "GITHUB_NOT_CONNECTED", "The stored GitHub connection could not be read. Reconnect GitHub.");
  }
}
