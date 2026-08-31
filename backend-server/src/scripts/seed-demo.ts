/**
 * Dev/demo-only seed script (docs/development.md Phase 28: "Seed data may be
 * used only for development/testing"). Never imported by application code —
 * run manually with `npm run seed:demo`. Creates one clearly-labeled demo
 * organization with realistic synthetic PR/issue/commit history so the
 * analytics, health, and bottleneck-detection pipeline can be demonstrated
 * end-to-end without a live GitHub connection.
 *
 * Safe to re-run: it upserts by fixed slugs/emails and only ever touches rows
 * scoped to the "forgeiq-demo" organization.
 */
import { database } from "../config/database.js";
import { hashPassword } from "../utils/password.js";

const DEMO_EMAIL = "demo@forgeiq.dev";
const DEMO_PASSWORD = "ForgeIQDemo123!";
const DEMO_SLUG = "forgeiq-demo";

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function main() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const user = await database.user.upsert({
    where: { email: DEMO_EMAIL },
    create: {
      email: DEMO_EMAIL,
      displayName: "Demo Admin",
      credential: { create: { passwordHash } },
    },
    update: {},
  });

  const organization = await database.organization.upsert({
    where: { slug: DEMO_SLUG },
    create: {
      name: "ForgeIQ Demo Org",
      slug: DEMO_SLUG,
      description: "Seeded demo organization for showcasing the analytics/health/bottleneck pipeline. Safe to delete.",
      members: { create: { userId: user.id, role: "ADMIN" } },
    },
    update: {},
  });
  await database.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
    create: { organizationId: organization.id, userId: user.id, role: "ADMIN" },
    update: {},
  });

  const project = await database.project.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: "Demo Platform" } },
    create: { organizationId: organization.id, name: "Demo Platform", description: "Seeded project with realistic activity history." },
    update: {},
  });

  const repository = await database.repository.upsert({
    where: { provider_externalId: { provider: "GITHUB", externalId: "demo-repo-1" } },
    create: {
      organizationId: organization.id,
      projectId: project.id,
      provider: "GITHUB",
      externalId: "demo-repo-1",
      name: "demo-platform",
      fullName: "forgeiq-demo/demo-platform",
      url: "https://github.com/forgeiq-demo/demo-platform",
      isSelected: true,
    },
    update: {},
  });

  // Clear and reseed activity so re-running produces a consistent picture.
  await database.review.deleteMany({ where: { repositoryId: repository.id } });
  await database.pullRequest.deleteMany({ where: { repositoryId: repository.id } });
  await database.issue.deleteMany({ where: { repositoryId: repository.id } });
  await database.commit.deleteMany({ where: { repositoryId: repository.id } });

  // Pull requests: a healthy merged history, two stale, one waiting for review.
  const prSeeds = [
    { number: 101, title: "Add JWT refresh handling", state: "MERGED" as const, openedAt: daysAgo(6), closedAt: daysAgo(5), mergedAt: daysAgo(5), reviewed: daysAgo(5.5) },
    { number: 102, title: "Fix flaky pagination test", state: "MERGED" as const, openedAt: daysAgo(4), closedAt: daysAgo(3), mergedAt: daysAgo(3), reviewed: daysAgo(3.5) },
    { number: 103, title: "Add repository sync retry", state: "MERGED" as const, openedAt: daysAgo(3), closedAt: daysAgo(2), mergedAt: daysAgo(2), reviewed: daysAgo(2.2) },
    { number: 104, title: "Rework analytics caching", state: "OPEN" as const, openedAt: daysAgo(6), closedAt: null, mergedAt: null, reviewed: null },
    { number: 105, title: "Bump dependency versions", state: "OPEN" as const, openedAt: daysAgo(5), closedAt: null, mergedAt: null, reviewed: null },
    { number: 106, title: "Add candidate search filters", state: "OPEN" as const, openedAt: daysAgo(1), closedAt: null, mergedAt: null, reviewed: daysAgo(0.5) },
  ];
  for (const pr of prSeeds) {
    const saved = await database.pullRequest.create({
      data: {
        organizationId: organization.id,
        repositoryId: repository.id,
        externalId: `demo-pr-${pr.number}`,
        number: pr.number,
        title: pr.title,
        state: pr.state,
        openedAt: pr.openedAt,
        closedAt: pr.closedAt,
        mergedAt: pr.mergedAt,
      },
    });
    if (pr.reviewed) {
      await database.review.create({
        data: {
          organizationId: organization.id,
          repositoryId: repository.id,
          pullRequestId: saved.id,
          externalId: `demo-review-${pr.number}`,
          state: "APPROVED",
          submittedAt: pr.reviewed,
        },
      });
    }
  }

  // Issues: a growing backlog with a couple overdue.
  const issueSeeds = [
    { number: 201, title: "Login form loses focus on error", state: "CLOSED" as const, openedAt: daysAgo(20), closedAt: daysAgo(18) },
    { number: 202, title: "Dashboard chart mislabels axis", state: "CLOSED" as const, openedAt: daysAgo(15), closedAt: daysAgo(12) },
    { number: 203, title: "GitHub sync misses draft PRs", state: "OPEN" as const, openedAt: daysAgo(20), closedAt: null },
    { number: 204, title: "Slow query on large org member list", state: "OPEN" as const, openedAt: daysAgo(16), closedAt: null },
    { number: 205, title: "Webhook retries not de-duplicated", state: "OPEN" as const, openedAt: daysAgo(5), closedAt: null },
    { number: 206, title: "Candidate search pagination off by one", state: "OPEN" as const, openedAt: daysAgo(2), closedAt: null },
  ];
  for (const issue of issueSeeds) {
    await database.issue.create({
      data: {
        organizationId: organization.id,
        repositoryId: repository.id,
        externalId: `demo-issue-${issue.number}`,
        number: issue.number,
        title: issue.title,
        state: issue.state,
        openedAt: issue.openedAt,
        closedAt: issue.closedAt,
      },
    });
  }

  // Commits: steady daily activity over the last two weeks.
  for (let day = 0; day < 14; day++) {
    const commitsThatDay = day % 3 === 0 ? 0 : 1 + (day % 4);
    for (let i = 0; i < commitsThatDay; i++) {
      await database.commit.create({
        data: {
          organizationId: organization.id,
          repositoryId: repository.id,
          externalId: `demo-commit-${day}-${i}`,
          message: `Demo commit ${day}-${i}: incremental work on the platform`,
          authoredAt: daysAgo(day + i / 10),
        },
      });
    }
  }

  console.log("Seeded demo organization:", organization.slug);
  console.log("Sign in with:", DEMO_EMAIL, "/", DEMO_PASSWORD);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.$disconnect();
  });
