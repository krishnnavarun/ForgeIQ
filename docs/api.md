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

## Planned Student Endpoints

These endpoints are planned for the student-first implementation and are not
yet available.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/me/profile` | Read the authenticated student's profile. |
| `PUT` | `/me/profile` | Update profile details. |
| `GET` | `/me/projects` | List the student's projects. |
| `POST` | `/me/projects` | Create a student-owned project. |
| `PATCH` | `/me/projects/:id` | Update an owned project. |
| `DELETE` | `/me/projects/:id` | Delete an owned project. |
| `GET` | `/me/privacy` | Read visibility and consent settings. |
| `PUT` | `/me/privacy` | Update visibility and consent settings. |
| `GET` | `/me/integrations` | List the student's integration status. |
| `POST` | `/integrations/github/connect` | Start GitHub OAuth. |
| `GET` | `/integrations/github/callback` | Complete GitHub OAuth. |
| `DELETE` | `/integrations/github` | Disconnect GitHub. |
| `GET` | `/me/activity` | Read persisted normalized activity and metrics. |

Student-owned endpoints derive the user from authentication and must scope
database queries to that user. Private profile fields, projects, and activity
must not be returned to recruiters or organizations without explicit consent.

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
