# ForgeIQ

Engineering intelligence and operations platform. Multi-tenant, GitHub-integrated,
analytics-first, AI-assisted — and honest about what it doesn't yet do.

Full product spec, requirements, architecture, and workflow diagrams live in
`docs/`. This file is the practical entry point: what the system is, how it's
built, how to run it, and what's real versus what's scaffolded pending
credentials you supply.

---

## 1. Problem

Engineering teams spread their signal across GitHub, project trackers, CI/CD,
and chat. Understanding delivery health — what's at risk, where reviews are
stalling, what actually shipped this week — means manually piecing together
several tools. ForgeIQ collects permitted engineering activity, normalizes it,
and turns it into transparent metrics and explainable insights, so that
question doesn't require a spreadsheet.

## 2. Solution

ForgeIQ connects to GitHub (OAuth, never passwords), synchronizes commits,
pull requests, issues, and reviews into normalized internal models, computes
engineering metrics and rule-based bottleneck findings, and layers an
optional, tightly-grounded AI assistant on top — one that only ever sees the
verified metrics already computed, never raw provider data, and never
attributes a score to an individual developer. Organizations are isolated
tenants; roles are enforced server-side; developers separately control an
evidence-led profile that authorized recruiters can discover under
developer-controlled visibility rules.

## 3. Architecture

```text
React (Vite, TS, Tailwind, TanStack Query, Recharts)
        │  HTTPS / REST (bearer JWT)
        ▼
Express (TS) — Routes → Middleware (auth, RBAC) → Controllers → Services
        │                    │                          │
        ▼                    ▼                          ▼
  Prisma / PostgreSQL   GitHub Adapter            AI Service (Anthropic)
     (Supabase)          (OAuth + REST +               │
                           webhooks)              Context Builder
                                                  (reads only the org's
                                                   already-verified,
                                                   already-computed
                                                   analytics)
```

A modular monolith by design (see `docs/architecture.md` §9) — no
microservices until scale actually demands them. Every organization-scoped
route resolves its scope from a verified `OrganizationMember` row for the
authenticated user, never from a client-supplied id alone
(`src/middleware/requireOrgRole.ts`).

## 4. Technology

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, React Router,
  TanStack Query, Recharts, shadcn-style components on Base UI.
- **Backend**: Node.js, Express 5, TypeScript, Zod validation, Prisma ORM.
- **Database**: Supabase PostgreSQL (PgBouncer transaction pooling).
- **Auth**: Application JWT + DB-backed revocable sessions; Google and GitHub
  OAuth as *identity*/*integration* providers respectively (kept distinct —
  see `docs/workflow.md` §6).
- **AI**: Anthropic Claude via `@anthropic-ai/sdk`, behind a provider
  abstraction (`src/services/ai.service.ts`) so swapping providers doesn't
  touch calling code.
- **Testing**: Vitest (unit, real and run — see §9 below).
- **Hardening**: Helmet, `express-rate-limit`, HMAC-verified webhooks,
  AES-256-GCM-encrypted OAuth tokens at rest.

## 5. Data Flow

```text
GitHub API / Webhook
       ↓
GitHub Adapter (src/integrations/github.adapter.ts — the only module
                that knows GitHub's response shapes)
       ↓
Validation + Normalization (mapped into Issue / PullRequest / Review / Commit)
       ↓
Deduplication (upsert on [repositoryId, externalId]; webhook deliveries
                deduplicated on their GitHub delivery id)
       ↓
PostgreSQL
       ↓
Analytics Engine (src/analytics/*.pure.ts — pure functions, DB-free,
                   unit tested; src/services/analytics.service.ts fetches
                   and feeds them, with a 60s in-memory cache per org/project)
       ↓
Engineering Health signals + Bottleneck findings
       ↓
Dashboard / AI context
```

Analytics never touch GitHub's raw shapes directly — only the adapter does
that translation, exactly as `docs/workflow.md` §10 requires.

## 6. Security

- **Organization isolation**: every `:organizationId` route requires a
  verified membership row; cross-tenant access returns `403 FORBIDDEN`
  (verified live — see the completion report's smoke-test log).
- **RBAC**: `ADMIN / MANAGER / DEVELOPER / VIEWER / RECRUITER`, enforced in
  middleware, never inferred from client input. A user cannot elevate their
  own role; an organization can never be left with zero admins.
- **Passwords**: bcrypt-hashed, never logged, never returned.
- **OAuth tokens**: AES-256-GCM-encrypted at rest (`src/utils/tokenCipher.ts`);
  never returned to any client, encrypted or not.
- **Webhooks**: HMAC-SHA256 signature verification against the raw request
  body before anything is persisted.
- **Rate limiting**: global (300 req/min) and a stricter auth-specific limit
  (20 req/15min) via `express-rate-limit`; AI generation additionally capped
  at 10/hour per user.
- **Headers**: Helmet defaults on every response.
- **Errors**: the central error handler never leaks stack traces, DB
  credentials, or provider tokens to the client.
- **Audit log**: role changes, member add/remove, integration connect/
  disconnect, and AI generation are all recorded with actor, action,
  resource, and timestamp.

## 7. AI

AI is a read-only layer on top of already-computed, already-authorized
analytics — it is never the source of truth and never queries the database
directly:

```text
Verified analytics (already scoped to the caller's organization)
        ↓
Context Builder (src/services/ai.service.ts)
        ↓
Anthropic Claude, with a system prompt that requires: use only the provided
data; never invent metrics; separate fact from inference; never rank or
score individual developers; never make an employment decision
        ↓
Persisted AIInsight (audited)
```

If `ANTHROPIC_API_KEY` isn't set, every AI endpoint returns a clear
`AI_NOT_CONFIGURED` error rather than a fake answer — the same pattern used
for GitHub and Google OAuth when their credentials are absent.

## 8. Scalability

Current form is intentionally simple: synchronous on-demand GitHub sync, an
in-memory OAuth-state store and analytics cache (fine for one backend
instance). The documented upgrade path when it's actually needed:

```text
Sync-on-request  →  Queue (Redis + BullMQ) + worker
In-memory cache  →  Redis-backed cache
Single instance  →  Load balancer + N stateless API instances
```

None of this is built preemptively — `docs/architecture.md` §7 and §9 are
explicit that scaling infrastructure should wait for a real scale signal, and
this project follows that.

## 9. Testing

Real, currently-passing tests, not aspirational ones:

```bash
cd backend-server && npm test   # 21 tests, 4 files — all pure analytics/health/
                                 # bottleneck math and validator edge cases
```

Cross-organization isolation, RBAC gating, candidate-visibility rules, invite
flows, and the full sync→analytics→bottleneck pipeline were verified via
live smoke tests against the dev database during this build (see the
completion report). A full Supertest/Playwright suite is intentionally not
included here — this project has no isolated test database provisioned, and
running destructive integration tests against the only Supabase instance in
use is the wrong tradeoff. Provisioning a disposable Postgres (docker-compose)
for real Supertest coverage is the natural next step.

## 10. Deployment

Not deployed from this session — no cloud accounts or DNS were available —
but every piece is deploy-ready:

- **Frontend** (`frontend-client/`): static Vite build, deployable to Vercel
  or any static host. `vite.config.ts` needs no changes; set `VITE_API_URL`.
- **Backend** (`backend-server/`): standard Node process
  (`npm run build && npm start`), deployable to Render/Railway/Fly. Requires
  the environment variables documented in `backend-server/.env.example`.
- **Database**: already Supabase Postgres; run `npx prisma migrate deploy`
  against production.
- Before going live: rotate `JWT_SECRET` and `TOKEN_ENCRYPTION_KEY` to real
  random values (the checked-in defaults are dev-only fallbacks), set
  `GOOGLE_REDIRECT_URI` / `GITHUB_REDIRECT_URI` to production URLs, and
  register the production GitHub webhook URL with `GITHUB_WEBHOOK_SECRET`.

## Future Roadmap

Deliberately not built in this pass, with the reason:

- **GitHub App / installation-based auth** instead of a personal OAuth token
  per org — better scoping, no dependency on one connecting user's access.
- **Redis + BullMQ background sync** — once repository/org volume makes
  synchronous on-demand sync too slow.
- **Additional integrations** (Jira, GitLab, Linear, CI/CD, Slack) — the
  `IntegrationProvider` enum and adapter pattern are already the extension
  point; each is genuinely new scope, not a missing piece of this pass.
- **Power BI / advanced BI export** — optional per spec, no obvious near-term
  need.
- **Playwright E2E** — needs a real browser automation environment this
  session didn't have access to.
- **Enterprise SSO, billing, notifications** — explicitly future scope in
  `docs/specs.md`.

## Quickstart

```bash
# Backend
cd backend-server
cp .env.example .env        # fill in DATABASE_URL/DIRECT_URL at minimum
npm install
npx prisma migrate dev
npm run dev                 # http://localhost:5000

# optional: seed a demo organization with realistic activity history
npm run seed:demo           # demo@forgeiq.dev / ForgeIQDemo123!

# Frontend
cd frontend-client
npm install
npm run dev                 # http://localhost:5173
```

GitHub integration and AI insights are fully implemented but inert until you
provide `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` and `ANTHROPIC_API_KEY`
respectively — see `backend-server/.env.example` for every variable and what
it unlocks.
