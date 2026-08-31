import type { Request, Response } from "express";
import { getAnalytics } from "../services/analytics.service.js";

export async function getOrganizationAnalytics(request: Request, response: Response) {
  const projectId = typeof request.query.projectId === "string" ? request.query.projectId : undefined;
  const analytics = await getAnalytics(request.params.organizationId as string, projectId);
  response.json({ analytics });
}
