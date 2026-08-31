# ForgeIQ API

## API Conventions

Base URL:

```text
http://localhost:5000/api/v1
```

Production clients must use HTTPS. The API returns JSON for both successful and
error responses.

Authenticated endpoints use a bearer access token:

```http
Authorization: Bearer <access-token>
```

The backend derives the authenticated user and organization scope from the
token. Clients must not select an organization by sending an untrusted
`organizationId` for authorization.

## Response Format

Successful responses return the resource directly unless an endpoint documents
another shape.

Errors use this format:

```json
{
	"error": {
		"code": "VALIDATION_ERROR",
		"message": "The request failed validation.",
		"details": []
	}
}
```

Common error codes:

| HTTP status | Code | Meaning |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Request input is invalid. |
| 401 | `UNAUTHENTICATED` | Authentication is missing or invalid. |
| 403 | `FORBIDDEN` | The user lacks permission. |
| 404 | `ROUTE_NOT_FOUND` or `RESOURCE_NOT_FOUND` | The route or resource does not exist. |
| 409 | `CONFLICT` | The operation conflicts with existing data. |
| 500 | `INTERNAL_SERVER_ERROR` | An unexpected server error occurred. |

## Implemented Endpoints

### Health

#### `GET /health`

Returns the API health status. This endpoint does not require authentication.

Example response:

```json
{
	"status": "ok",
	"service": "forgeiq-backend",
	"timestamp": "2026-08-28T00:00:00.000Z"
}
```

#### `GET /health?details=true`

Returns additional non-secret runtime information for local diagnostics.

```json
{
	"status": "ok",
	"service": "forgeiq-backend",
	"timestamp": "2026-08-28T00:00:00.000Z",
	"environment": "development",
	"version": "v1"
}
```

The `details` query parameter accepts only `true` or `false`. Invalid values
return `400 VALIDATION_ERROR`.

## Authentication Endpoints

These endpoints are implemented in the backend.

### `POST /auth/register`

Request:

```json
{
	"email": "student@example.com",
	"password": "a-strong-password",
	"displayName": "Alex Student"
}
```

The backend will normalize the email, validate password requirements, hash the
password, and never return or log the password.

Returns `201` with an access token and safe user information.

### `POST /auth/login`

Request:

```json
{
	"email": "student@example.com",
	"password": "a-strong-password"
}
```

Successful responses contain an access token and safe user information.
Invalid credentials will return the same safe error regardless of whether the
email exists.

### `POST /auth/logout`

Invalidates the authenticated session and requires a bearer token. Returns
`204` with no response body.

### `GET /auth/me`

Returns the authenticated user and memberships without password or token
material. Requires a bearer token.

## Developer Profile Endpoints

Student/developer-owned endpoints derive the user from authentication and
scope all queries to that user. Implemented under `/users/me/*` (not the
originally sketched top-level `/me/*`) to stay consistent with the
resource-scoped naming used everywhere else in this API — see the note in
the root `README.md`'s API section for the full rationale.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/users/me/profile` | Read the authenticated developer's profile. |
| `PATCH` | `/users/me/profile` | Update headline, bio, location, links, skills, visibility, open-to-opportunities. |
| `POST` | `/users/me/projects` | Create a developer-owned project entry. |
| `PATCH` | `/users/me/projects/:projectId` | Update an owned project entry. |
| `DELETE` | `/users/me/projects/:projectId` | Delete an owned project entry. |

Profile visibility (`PRIVATE` / `ORGANIZATION` / `PUBLIC`) *is* the privacy/consent
setting — there is no separate `/me/privacy` endpoint. Private profile fields
are never returned to recruiters or organizations without that explicit,
per-profile consent (see "Candidate Discovery" below).

## Organization Endpoints

Every `:organizationId`-scoped route below requires the caller to have a
verified `OrganizationMember` row for that id (never inferred from the request
body) — see `src/middleware/requireOrgRole.ts`. Roles: `ADMIN`, `MANAGER`,
`DEVELOPER`, `VIEWER`, `RECRUITER`.

| Method | Endpoint | Role required |
| --- | --- | --- |
| `POST` | `/organizations` | Any authenticated user (becomes ADMIN) |
| `GET` | `/organizations` | Any authenticated user (lists their own memberships) |
| `GET` | `/organizations/directory` | Any authenticated user (name/slug/description only) |
| `GET` | `/organizations/:organizationId` | Member |
| `PATCH` | `/organizations/:organizationId` | ADMIN |
| `POST` \| `GET` `/organizations/:organizationId/invites` | ADMIN |
| `DELETE` | `/organizations/:organizationId/invites/:inviteId` | ADMIN |
| `POST` | `/organizations/invites/:token/accept` | Any authenticated user whose email matches the invite |
| `PATCH` \| `DELETE` `/organizations/:organizationId/members/:userId` | ADMIN (blocked if it would remove the last admin) |
| `GET` | `/organizations/:organizationId/audit-logs` | ADMIN, MANAGER |
| `POST` \| `DELETE` `/organizations/:organizationId/interest` | Any authenticated user (candidate opting in/out for that org) |
| `GET` | `/organizations/:organizationId/candidates` | ADMIN, MANAGER, RECRUITER |
| `POST` \| `DELETE` `/organizations/:organizationId/candidates/:userId/shortlist` | ADMIN, MANAGER, RECRUITER |
| `GET` | `/organizations/:organizationId/shortlist` | ADMIN, MANAGER, RECRUITER |
| `GET` | `/organizations/my-interests` | Any authenticated user |

## Project Endpoints (`/organizations/:organizationId/projects`)

| Method | Endpoint | Role required |
| --- | --- | --- |
| `GET` | `/` , `/:projectId` | Member |
| `POST` , `PATCH /:projectId` , `DELETE /:projectId` | ADMIN, MANAGER |

## Repository & GitHub Integration Endpoints

| Method | Endpoint | Role required |
| --- | --- | --- |
| `GET` | `/organizations/:organizationId/integrations` | Member |
| `GET` | `/organizations/:organizationId/integrations/github/start` | ADMIN, MANAGER — returns `{ url }` to navigate the browser to (never redirects directly; a bearer token cannot ride a full-page navigation) |
| `GET` | `/organizations/integrations/github/callback` | Public — GitHub redirects the browser here; identity comes from the signed OAuth state, not a bearer token |
| `DELETE` | `/organizations/:organizationId/integrations/github` | ADMIN, MANAGER |
| `GET` | `/organizations/:organizationId/repositories` | Member |
| `GET` | `/organizations/:organizationId/repositories/discover` | ADMIN, MANAGER — lists permitted GitHub repos not yet tracked |
| `POST` | `/organizations/:organizationId/repositories` | ADMIN, MANAGER — track a discovered repository |
| `GET` | `/organizations/:organizationId/repositories/:repositoryId` | Member |
| `GET` | `/organizations/:organizationId/repositories/:repositoryId/activity` | Member — recent commits/issues/PRs |
| `POST` | `/organizations/:organizationId/repositories/:repositoryId/sync` | ADMIN, MANAGER — pulls commits/issues/PRs/reviews from GitHub and upserts them |
| `DELETE` | `/organizations/:organizationId/repositories/:repositoryId` | ADMIN, MANAGER |

## Analytics & AI Endpoints

| Method | Endpoint | Role required |
| --- | --- | --- |
| `GET` | `/organizations/:organizationId/analytics?projectId=` | Member — PR/issue/commit/review metrics, engineering health signals, and bottleneck findings, all computed live from stored data (60s in-memory cache per org/project) |
| `GET` | `/organizations/:organizationId/ai` | ADMIN, MANAGER, DEVELOPER — lists past AI insights and whether AI is configured |
| `POST` | `/organizations/:organizationId/ai` | ADMIN, MANAGER, DEVELOPER — generates a grounded insight (`weekly_summary`, `project_summary`, `bottleneck_explanation`, or `question`); rate-limited to 10/hour per user |

## Webhook Endpoint

| Method | Endpoint | Auth |
| --- | --- | --- |
| `POST` | `/webhooks/github` | HMAC-SHA256 signature verification via `x-hub-signature-256` against `GITHUB_WEBHOOK_SECRET` — no bearer token |

Handles `push`, `issues`, and `pull_request` events. Every delivery is stored
in `WebhookEvent` (keyed by GitHub's delivery id) before being applied, so
retried deliveries are safely ignored rather than double-applied.

## Integration Rules

- External data must pass through a provider adapter.
- OAuth tokens must be encrypted before persistence.
- GitHub passwords must never be requested or stored.
- Provider responses must be validated and normalized before persistence.
- Webhook signatures must be verified before events are accepted.
- Duplicate external events must be rejected or safely upserted.
- API errors must not expose secrets, database credentials, stack traces, or raw
	provider tokens.

## Versioning

All application endpoints are mounted under `/api/v1`. Breaking changes require
a new version such as `/api/v2`; additive changes may remain in the current
version when backward compatible.
