# ForgeIQ — Architecture

## 1. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │       React         │
                         │      Frontend       │
                         └──────────┬──────────┘
                                    │
                                  HTTPS
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Node + Express    │
                         │      REST API       │
                         └──────────┬──────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
       Authorization           Analytics                AI Service
             │                      │                      │
             │                      │                      ▼
             │                      │                 LLM Provider
             │                      │
             └──────────────┬───────┘
                            ▼
                    Prisma ORM
                            │
                            ▼
                 Supabase PostgreSQL
                            ▲
                            │
                  Data Synchronization
                            │
                            ▼
                       GitHub API
```

---

# 2. Backend Layers

```text
Routes
  ↓
Controllers
  ↓
Middleware
  ↓
Services
  ↓
Repositories
  ↓
Prisma
  ↓
PostgreSQL
```

Responsibilities must remain separated.

---

# 3. Integration Architecture

```text
IntegrationManager
       │
       ├── GitHubAdapter
       ├── JiraAdapter      (future)
       ├── GitLabAdapter    (future)
       └── LinearAdapter    (future)
```

---

# 4. Data Flow

```text
External Provider
       ↓
API / Webhook
       ↓
Provider Adapter
       ↓
Validation
       ↓
Normalization
       ↓
Deduplication
       ↓
PostgreSQL
       ↓
Analytics Engine
       ↓
Dashboard / AI
```

---

# 5. Authorization Flow

```text
Request
 ↓
JWT validation
 ↓
User identification
 ↓
Organization identification
 ↓
Role check
 ↓
Resource ownership check
 ↓
Business authorization
 ↓
Controller/Service
```

Organization scope must never be determined from an untrusted client parameter.

---

# 6. AI Architecture

```text
User Question
     ↓
Authorization
     ↓
Intent
     ↓
Analytics Query
     ↓
Verified Data
     ↓
Context Builder
     ↓
LLM
     ↓
Response Validation
     ↓
User
```

The LLM is not the source of truth.

The database and analytics engine are the source of truth.

---

# 7. Scaling Strategy

Initial:

```text
React
 +
Express
 +
PostgreSQL
```

Later:

```text
React
 ↓
Load Balancer
 ↓
Multiple API Instances
 ↓
Redis
 ↓
Background Workers
 ↓
PostgreSQL
```

Scaling components should be introduced only when justified.

---

# 8. Security Principles

* Least privilege
* Organization isolation
* Server-side authorization
* Secure secrets
* Input validation
* Webhook verification
* Rate limiting
* Audit logging
* Secure external integrations
* No credential scraping

---

# 9. Architectural Principle

ForgeIQ should remain a modular monolith during the initial development.

Do not introduce microservices simply to make the architecture look complex.

The architecture should evolve based on actual scale and operational requirements.
