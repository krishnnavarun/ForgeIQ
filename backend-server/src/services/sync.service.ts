import { database } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { getGithubAccessToken } from "./integration.service.js";
import * as githubAdapter from "../integrations/github.adapter.js";

function splitFullName(fullName: string) {
  const [owner, repo] = fullName.split("/");
  if (!owner || !repo) throw new AppError(422, "INVALID_REPOSITORY", "Repository full name is malformed.");
  return { owner, repo };
}

/**
 * Pulls commits, issues, pull requests, and reviews for one repository from
 * GitHub and upserts them into ForgeIQ's normalized tables. This is the only
 * place that bridges the GitHub adapter's shapes into our domain models —
 * analytics never touches GitHub's raw response shapes directly.
 */
export async function syncRepository(organizationId: string, repositoryId: string) {
  const repository = await database.repository.findUnique({ where: { id: repositoryId } });
  if (!repository || repository.organizationId !== organizationId) {
    throw new AppError(404, "RESOURCE_NOT_FOUND", "Repository not found.");
  }
  if (repository.provider !== "GITHUB") {
    throw new AppError(422, "UNSUPPORTED_PROVIDER", "Only GitHub repositories can be synchronized.");
  }

  const token = await getGithubAccessToken(organizationId);
  const { owner, repo } = splitFullName(repository.fullName);

  const [issues, pullRequests, commits] = await Promise.all([
    githubAdapter.fetchIssues(token, owner, repo),
    githubAdapter.fetchPullRequests(token, owner, repo),
    githubAdapter.fetchCommits(token, owner, repo),
  ]);

  let issuesSynced = 0;
  for (const issue of issues) {
    await database.issue.upsert({
      where: { repositoryId_externalId: { repositoryId, externalId: String(issue.id) } },
      create: {
        organizationId,
        repositoryId,
        externalId: String(issue.id),
        number: issue.number,
        title: issue.title,
        state: issue.state === "closed" ? "CLOSED" : "OPEN",
        openedAt: new Date(issue.created_at),
        closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
      },
      update: {
        title: issue.title,
        state: issue.state === "closed" ? "CLOSED" : "OPEN",
        closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
      },
    });
    issuesSynced++;
  }

  let pullRequestsSynced = 0;
  let reviewsSynced = 0;
  for (const pr of pullRequests) {
    const state = pr.merged_at ? "MERGED" : pr.state === "closed" ? "CLOSED" : "OPEN";
    const savedPr = await database.pullRequest.upsert({
      where: { repositoryId_externalId: { repositoryId, externalId: String(pr.id) } },
      create: {
        organizationId,
        repositoryId,
        externalId: String(pr.id),
        number: pr.number,
        title: pr.title,
        state,
        openedAt: new Date(pr.created_at),
        closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
        mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
      },
      update: {
        title: pr.title,
        state,
        closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
        mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
      },
    });
    pullRequestsSynced++;

    const reviews = await githubAdapter.fetchReviews(token, owner, repo, pr.number);
    for (const review of reviews) {
      await database.review.upsert({
        where: { repositoryId_externalId: { repositoryId, externalId: String(review.id) } },
        create: {
          organizationId,
          repositoryId,
          pullRequestId: savedPr.id,
          externalId: String(review.id),
          state: review.state,
          submittedAt: review.submitted_at ? new Date(review.submitted_at) : null,
        },
        update: { state: review.state, submittedAt: review.submitted_at ? new Date(review.submitted_at) : null },
      });
      reviewsSynced++;
    }
  }

  let commitsSynced = 0;
  for (const commit of commits) {
    if (!commit.commit.author) continue;
    await database.commit.upsert({
      where: { repositoryId_externalId: { repositoryId, externalId: commit.sha } },
      create: {
        organizationId,
        repositoryId,
        externalId: commit.sha,
        message: commit.commit.message.slice(0, 500),
        authoredAt: new Date(commit.commit.author.date),
      },
      update: {},
    });
    commitsSynced++;
  }

  await database.repository.update({ where: { id: repositoryId }, data: { updatedAt: new Date() } });

  return { issuesSynced, pullRequestsSynced, reviewsSynced, commitsSynced };
}
