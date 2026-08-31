import type { Request, Response } from "express";
import * as repositoryService from "../services/repository.service.js";
import { syncRepository } from "../services/sync.service.js";

export async function discover(request: Request, response: Response) {
  const repositories = await repositoryService.discoverGithubRepositories(request.params.organizationId as string);
  response.json({ repositories });
}

export async function track(request: Request, response: Response) {
  const repository = await repositoryService.trackRepository(request.params.organizationId as string, request.body);
  response.status(201).json({ repository });
}

export async function list(request: Request, response: Response) {
  const repositories = await repositoryService.listRepositories(request.params.organizationId as string);
  response.json({ repositories });
}

export async function get(request: Request, response: Response) {
  const repository = await repositoryService.getRepository(request.params.organizationId as string, request.params.repositoryId as string);
  response.json({ repository });
}

export async function activity(request: Request, response: Response) {
  const data = await repositoryService.getRepositoryActivity(
    request.params.organizationId as string,
    request.params.repositoryId as string,
  );
  response.json(data);
}

export async function untrack(request: Request, response: Response) {
  await repositoryService.untrackRepository(request.params.organizationId as string, request.params.repositoryId as string);
  response.status(204).send();
}

export async function sync(request: Request, response: Response) {
  const result = await syncRepository(request.params.organizationId as string, request.params.repositoryId as string);
  response.json({ result });
}
