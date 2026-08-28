# ForgeIQ — Development Roadmap

## Development Rule

Do not implement the entire application at once.

Complete one phase, test it, understand it, and then move to the next phase.

The developer must understand every generated file and architectural decision.

AI coding tools may assist implementation but must not silently redesign the architecture.

---

# Phase 0 — Project Setup

## Goal

Create a clean monorepo structure.

```text
forgeiq/
├── frontend/
├── backend/
├── docs/
├── specs.md
├── REQUIREMENTS.md
├── development.md
├── ARCHITECTURE.md
├── API.md
├── DATABASE.md
├── README.md
└── .env.example
```

## Tasks

* initialize Git
* create GitHub repository
* create frontend
* create backend
* configure TypeScript
* configure ESLint
* configure formatting
* create environment templates
* create initial README

## Completion

* frontend starts
* backend starts
* repository is clean
* no secrets committed

---

# Phase 1 — Frontend Foundation

## Goal

Create the application shell.

## Tasks

* React + Vite
* routing
* layout
* navigation
* responsive design
* loading states
* error states
* reusable UI components

Do not build business functionality yet.

---

# Phase 2 — Backend Foundation

## Goal

Create a maintainable Express architecture.

```text
src/
├── config/
├── routes/
├── controllers/
├── services/
├── repositories/
├── middleware/
├── validators/
├── integrations/
├── analytics/
├── ai/
├── utils/
└── app.ts
```

## Tasks

* Express setup
* TypeScript
* error handling
* request logging
* validation
* API versioning
* health endpoint

---

# Phase 3 — Supabase PostgreSQL + Prisma

## Goal

Establish the database.

## Tasks

* create Supabase project
* configure PostgreSQL connection
* initialize Prisma
* create initial schema
* configure migrations
* test database connection

Initial entities:

```text
User
Organization
OrganizationMember
Project
Repository
Integration
Issue
PullRequest
Review
Commit
AuditLog
WebhookEvent
EngineeringMetric
AIInsight
```

---

# Phase 4 — Authentication

## Goal

Implement secure application authentication.

## Tasks

* registration
* login
* JWT/session strategy
* password hashing if using application-managed credentials
* protected middleware
* logout
* authentication tests

## Security

Never store plaintext passwords.

Never commit secrets.

---

# Phase 5 — Organizations

## Goal

Implement multi-tenancy.

## Tasks

* create organization
* organization membership
* organization retrieval
* organization settings
* organization middleware
* organization isolation tests

## Critical Test

User from Organization A must not access Organization B.

---

# Phase 6 — RBAC

## Goal

Implement:

```text
ADMIN
MANAGER
DEVELOPER
VIEWER
```

## Tasks

* role model
* permission middleware
* role checks
* frontend route protection
* backend authorization
* security tests

Never trust frontend role information for authorization.

---

# Phase 7 — Projects

## Goal

Create the core project model.

## Tasks

* project CRUD
* organization ownership
* project routes
* project authorization
* project dashboard skeleton
* tests

---

# Phase 8 — GitHub OAuth/Integration

## Goal

Connect ForgeIQ to GitHub using permitted authorization.

## Tasks

* GitHub OAuth/application configuration
* callback handling
* token handling
* secure token storage strategy
* integration model
* disconnect integration

Never request or store GitHub passwords.

---

# Phase 9 — Repository Discovery

## Goal

Allow authorized users to discover permitted repositories.

## Tasks

* GitHub integration service
* repository API
* repository selection
* repository persistence
* project-repository relationship

---

# Phase 10 — GitHub Synchronization

## Goal

Bring real GitHub data into ForgeIQ.

## Synchronize

* repositories
* commits
* issues
* pull requests
* reviews
* releases where useful

Architecture:

```text
GitHub API
   ↓
GitHub Adapter
   ↓
Validation
   ↓
Normalization
   ↓
Persistence
```

---

# Phase 11 — Webhooks

## Goal

Support near-real-time updates.

## Tasks

* webhook endpoint
* signature validation
* event persistence
* event processing
* duplicate-event handling
* tests

Start with:

* pull request events
* issue events
* push events

---

# Phase 12 — Normalized Engineering Data

## Goal

Separate provider-specific data from application-level analytics.

Create normalized models for:

* PullRequest
* Issue
* Commit
* Review
* Release

Do not let analytics depend directly on GitHub response structures.

---

# Phase 13 — Analytics Engine

## Goal

Calculate real engineering metrics.

Implement:

### PR

* open count
* merged count
* PR age
* review time
* merge time
* stale PRs

### Issues

* open count
* closed count
* resolution time
* backlog

### Commits

* activity
* repository activity
* contribution trends

### Reviews

* pending reviews
* review turnaround

Every metric must be reproducible from stored data.

---

# Phase 14 — Engineering Health

## Goal

Create transparent project health indicators.

Implement:

* delivery health
* PR flow
* issue flow
* review health
* activity

Show the underlying signals.

Do not create arbitrary developer productivity scores.

---

# Phase 15 — Dashboard

## Goal

Build the main dashboard using real data.

Pages:

```text
/dashboard
/projects
/projects/:id
/repositories
/repositories/:id
/analytics
```

Features:

* charts
* metrics
* trends
* bottleneck cards
* recent activity

No mock data should remain in production screens.

---

# Phase 16 — Recruiter-Like / Manager Candidate Discovery Is NOT Used

ForgeIQ is an engineering operations platform.

Do not import the previous DevIntel recruiter/student workflow.

There is no:

* student preference
* recruiter candidate discovery
* placement workflow
* candidate ranking

The user model is:

```text
Organization
 ↓
Engineering Team
 ↓
Projects
 ↓
Engineering Activity
```

---

# Phase 17 — Bottleneck Detection

## Goal

Identify actionable engineering workflow problems.

Initial rules:

```text
PR age > threshold
Review waiting > threshold
Issue overdue
Backlog increasing
Repeated failed workflow
```

The rules must be explainable.

Example:

```text
7 PRs are waiting for review for more than 48 hours.
```

---

# Phase 18 — AI Service

## Goal

Introduce AI only after analytics are reliable.

Architecture:

```text
Analytics
   ↓
Context Builder
   ↓
AI Service
   ↓
LLM Provider
```

## Initial features

* weekly engineering summary
* project summary
* PR summary
* bottleneck explanation
* natural-language analytics questions

---

# Phase 19 — AI Guardrails

Implement:

* authorization-aware context
* structured metrics
* response validation
* hallucination-resistant prompts
* provider abstraction
* rate limiting
* logging

AI cannot access unauthorized organization data.

---

# Phase 20 — Candidate/Employee Privacy

ForgeIQ must not become employee surveillance software.

Do not expose simplistic:

```text
Developer A = 94
Developer B = 72
```

as a productivity ranking.

Prefer:

```text
Project Delivery
PR Review Flow
Issue Resolution
Team Bottlenecks
```

The platform should help teams improve processes.

---

# Phase 21 — Automated Testing

Implement:

## Unit

* services
* analytics
* validation

## Integration

* database
* GitHub adapter
* webhook processing

## API

* authentication
* RBAC
* organization isolation
* project authorization

## E2E

* login
* connect GitHub
* synchronize repository
* view dashboard
* generate AI summary

---

# Phase 22 — Performance

After functionality is stable:

* database indexes
* query optimization
* pagination
* caching where justified
* API response optimization
* connection pooling

Do not prematurely optimize.

---

# Phase 23 — Background Jobs

Only after synchronization volume requires it.

Potential stack:

```text
Redis
+
BullMQ
```

Architecture:

```text
API
 ↓
Queue
 ↓
Worker
 ↓
GitHub API
 ↓
Database
```

---

# Phase 24 — Power BI

Optional advanced analytics layer.

Connect Power BI to a controlled analytics dataset.

Never use Power BI as an authorization bypass.

---

# Phase 25 — Additional Integrations

After GitHub is stable:

Potential integrations:

1. Jira
2. Linear
3. GitLab
4. CI/CD providers
5. Slack

Each must use the adapter architecture.

---

# Phase 26 — Production Hardening

Implement:

* rate limiting
* security headers
* CORS
* secret management
* audit logs
* error tracking
* structured logs
* monitoring
* backups
* database migration strategy

---

# Phase 27 — Deployment

## Frontend

Deploy to Vercel or equivalent.

## Backend

Deploy to Render/Railway or equivalent.

## Database

Supabase PostgreSQL.

## Verify

* environment variables
* CORS
* OAuth callbacks
* webhook URLs
* database migrations
* production logging

---

# Phase 28 — Final Product Validation

Demonstrate this complete workflow:

```text
Register
 ↓
Create/Join Organization
 ↓
Assign Role
 ↓
Connect GitHub
 ↓
Select Repository
 ↓
Synchronize Data
 ↓
Calculate Metrics
 ↓
View Dashboard
 ↓
Detect Bottleneck
 ↓
Ask AI
 ↓
Receive Grounded Insight
```

All data must be real.

Seed data may be used only for development/testing.

---

# Phase 29 — Portfolio Preparation

Prepare:

* production URL
* GitHub repository
* architecture diagram
* database diagram
* API documentation
* screenshots
* demo video
* README
* technical case study

The README must explain:

1. Problem
2. Solution
3. Architecture
4. Technology
5. Data flow
6. Security
7. AI
8. Scalability
9. Deployment
10. Future roadmap

---

# Phase 30 — Interview Preparation

Be able to explain:

### Backend

* Express architecture
* middleware
* authentication
* RBAC
* REST APIs
* validation

### Database

* PostgreSQL
* Prisma
* indexes
* relationships
* transactions

### Integration

* OAuth
* GitHub API
* webhooks
* synchronization
* rate limits

### Architecture

* multi-tenancy
* organization isolation
* adapters
* background jobs

### AI

* context construction
* grounding
* hallucination handling
* authorization
* provider abstraction

### Scalability

* queues
* caching
* database optimization
* horizontal scaling

---

# Development Rule

Never move to the next major phase without:

1. Understanding the previous phase
2. Testing the previous phase
3. Committing working code
4. Updating documentation
5. Verifying security implications

The objective is not to generate code quickly.

The objective is to build a system that the developer can explain completely.
