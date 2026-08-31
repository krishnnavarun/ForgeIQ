import type { Request, Response } from "express";
import * as projectService from "../services/project.service.js";

export async function listProjects(request: Request, response: Response) {
  const projects = await projectService.listProjects(request.params.organizationId as string);
  response.json({ projects });
}

export async function createProject(request: Request, response: Response) {
  const project = await projectService.createProject(request.params.organizationId as string, request.body);
  response.status(201).json({ project });
}

export async function getProject(request: Request, response: Response) {
  const project = await projectService.getProject(request.params.organizationId as string, request.params.projectId as string);
  response.json({ project });
}

export async function updateProject(request: Request, response: Response) {
  const project = await projectService.updateProject(
    request.params.organizationId as string,
    request.params.projectId as string,
    request.body,
  );
  response.json({ project });
}

export async function deleteProject(request: Request, response: Response) {
  await projectService.deleteProject(request.params.organizationId as string, request.params.projectId as string);
  response.status(204).send();
}
