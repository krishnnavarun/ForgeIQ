# ForgeIQ — Complete System Workflow

# 1. Overall System Workflow

User
  ↓
Frontend Client
  ↓
HTTPS / REST API
  ↓
Backend Server
  ↓
Authentication & Authorization
  ↓
Application Services
  ↓
┌───────────────────────┬───────────────────────┐
│                       │                       │
▼                       ▼                       ▼
Database Server    External Integrations    AI Services
PostgreSQL         GitHub API/Webhooks      LLM Provider
│                       │                       │
└───────────────┬───────┴───────────────────────┘
                ↓
        Analytics Engine
                ↓
        Engineering Metrics
                ↓
        Backend API Response
                ↓
        Frontend Client
                ↓
           Dashboard


# 2. User Authentication Workflow

User
 ↓
Frontend Client
 ↓
Login / Register
 ↓
Backend Server
 ↓
Validate Request
 ↓
Authenticate User
 ↓
Create Authenticated Session / JWT
 ↓
Frontend Stores Authentication State
 ↓
Protected Application

# 3. Organization Workflow

Authenticated User
        ↓
Organization
        ↓
Organization Membership
        ↓
User Role
        ↓
Permission Check
        ↓
Requested Resource


Supported roles:


ADMIN
MANAGER
DEVELOPER
VIEWER

The backend must verify both:

User permission
Resource belongs to the user's organization





# 4. Multi-Tenant Data Isolation

Request
  ↓
JWT Validation
  ↓
Identify User
  ↓
Identify Organization
  ↓
Check Role
  ↓
Check Resource Organization
  ↓
Allow / Reject Request


example 

Organization A User
        ↓
Request Project A
        ↓
Project A belongs to Organization A
        ↓
ALLOW


Organization A User
        ↓
Request Project B
        ↓
Project B belongs to Organization B
        ↓
REJECT




# 5. Project Creation Workflow


User
 ↓
Frontend Client
 ↓
Create Project
 ↓
Backend Server
 ↓
Authentication Check
 ↓
RBAC Check
 ↓
Validate Input
 ↓
Create Project
 ↓
PostgreSQL
 ↓
Return Project
 ↓
Frontend Client
 ↓
Project Dashboard



# 6. GitHub Integration Workflow

User
 ↓
Frontend Client
 ↓
Connect GitHub
 ↓
Backend Server
 ↓
GitHub Authorization
 ↓
User Grants Required Permissions
 ↓
GitHub Callback
 ↓
Backend Validates Callback
 ↓
Store Integration Information Securely
 ↓
Integration Connected

ForgeIQ must never request or store the user's GitHub password.


# 7. Repository Discovery Workflow

Connected GitHub Integration
          ↓
Backend Server
          ↓
GitHub Integration Adapter
          ↓
GitHub API
          ↓
Permitted Repositories
          ↓
Backend Validation
          ↓
Frontend Client
          ↓
Repository Selection
          ↓
PostgreSQL

# 8. GitHub Data Synchronization Workflow

GitHub
  ↓
GitHub API
  ↓
GitHub Adapter
  ↓
Data Validation
  ↓
Data Normalization
  ↓
Deduplication
  ↓
PostgreSQL

Data that may be synchronized:

Repositories
     │
     ├── Commits
     ├── Pull Requests
     ├── Reviews
     ├── Issues
     └── Releases

# 9. GitHub Webhook Workflow

GitHub
  ↓
Webhook Event
  ↓
Backend Server
  ↓
Verify Webhook Signature
  ↓
Identify Organization / Integration
  ↓
Validate Event
  ↓
Store Event
  ↓
Process Event
  ↓
Update Database
  ↓
Recalculate Required Metrics
  ↓
Dashboard Shows Updated Data

Webhook events must be handled safely and duplicate events must not create duplicate records.

# 10. Data Normalization Workflow

External providers may have different data structures.

ForgeIQ converts provider-specific data into internal models.

GitHub Pull Request
        ↓
GitHub Adapter
        ↓
Normalized PullRequest
        ↓
PostgreSQL


Future providers:

GitHub
   ↓
GitHub Adapter
   ↓
           ┐
GitLab     │
   ↓       │
GitLab Adapter
   ↓       │
           ├──→ Normalized Engineering Data
Jira       │
   ↓       │
Jira Adapter
           ┘

The analytics engine should operate on normalized internal data rather than directly on provider-specific API responses.



# 11. Analytics Workflow

PostgreSQL
    ↓
Normalized Engineering Data
    ↓
Analytics Engine
    ↓
Calculate Metrics
    ↓
Store / Return Metrics
    ↓
Backend API
    ↓
Frontend Client
    ↓
Dashboard

Initial metrics:

Pull Requests
    ├── Open PRs
    ├── Merged PRs
    ├── PR Age
    ├── Review Time
    └── Merge Time

Issues
    ├── Open Issues
    ├── Closed Issues
    ├── Resolution Time
    └── Backlog

Commits
    ├── Commit Activity
    └── Repository Activity

Reviews
    ├── Pending Reviews
    └── Review Turnaround


#  12. Engineering Health Workflow
Engineering Data
      ↓
Analytics Engine
      ↓
Multiple Engineering Signals
      ↓
Health Calculation
      ↓
Project Health

Example:

Project Health

PR Flow       → 74
Issue Flow    → 88
Reviews       → 61
Activity      → 79
Delivery      → 82

The system must show the signals behind the health indicator.

It must not represent the score as an objective measurement of a developer's personal worth or productivity.


#  13. Bottleneck Detection Workflow
Engineering Data
      ↓
Analytics Engine
      ↓
Rule Evaluation
      ↓
Potential Bottleneck
      ↓
Dashboard

Examples:

PR waiting > defined threshold
        ↓
Potential Review Bottleneck
Issue overdue
        ↓
Potential Delivery Bottleneck
Backlog continuously increasing
        ↓
Potential Project Risk

The detected bottleneck must explain why it was detected.


#  14. AI Workflow

AI should be introduced only after reliable analytics are available.

User Question
      ↓
Frontend Client
      ↓
Backend Server
      ↓
Authentication
      ↓
Authorization
      ↓
Understand Request
      ↓
Analytics / Database Query
      ↓
Verified Engineering Data
      ↓
Context Builder
      ↓
AI Service
      ↓
LLM Provider
      ↓
Response Validation
      ↓
Backend Server
      ↓
Frontend Client
      ↓
AI Response


#  15. AI Engineering Questions

Example:

User:
"Why is Project Alpha at risk?"

Workflow:

User Question
      ↓
Authorization
      ↓
Identify Project Alpha
      ↓
Retrieve Authorized Project Data
      ↓
Calculate Relevant Metrics
      ↓
Build AI Context
      ↓
LLM
      ↓
Generate Explanation
      ↓
Validate Response
      ↓
Display Insight

The LLM is not the source of truth.

The database and analytics engine are the source of truth.


# 16. AI Weekly Summary Workflow
Engineering Data
      ↓
Weekly Metrics
      ↓
Project Activity
      ↓
PR Activity
      ↓
Issue Activity
      ↓
Review Activity
      ↓
Context Builder
      ↓
AI Service
      ↓
Weekly Engineering Summary

Example output:

Weekly Engineering Summary

• 24 PRs were merged.
• 7 PRs are currently waiting for review.
• Issue backlog decreased by 12%.
• Two projects show potential delivery risk.

Main bottleneck:
Review turnaround increased compared with the previous week.


#  17. Dashboard Workflow
User
 ↓
Frontend Client
 ↓
Dashboard Request
 ↓
Backend Server
 ↓
Authentication
 ↓
Organization Authorization
 ↓
Analytics Service
 ↓
PostgreSQL
 ↓
Metrics
 ↓
Backend Response
 ↓
Frontend Client
 ↓
Charts / Tables / Cards

Dashboard sections:

Organization Overview
       ↓
Project Health
       ↓
Repository Activity
       ↓
Pull Requests
       ↓
Issues
       ↓
Reviews
       ↓
Engineering Trends
       ↓
AI Insights


#  18. Audit Logging Workflow

Sensitive actions:

User Action
    ↓
Backend Server
    ↓
Authorization
    ↓
Perform Action
    ↓
Create Audit Record
    ↓
PostgreSQL

Examples:

Role Changed
Integration Connected
Integration Disconnected
Member Added
Member Removed
Organization Setting Changed

Audit record:

Actor
Organization
Action
Resource
Timestamp
Metadata


#  19. Error Handling Workflow
Request
 ↓
Validation
 ↓
Authentication
 ↓
Authorization
 ↓
Business Logic
 ↓
Database / External API
 ↓
Success

If an error occurs:

Error
 ↓
Central Error Handler
 ↓
Log Technical Details
 ↓
Return Safe API Error
 ↓
Frontend Error State

Never expose:

Database credentials
JWT secrets
API keys
Internal stack traces
Sensitive provider information

to the client.

#  20. Background Processing Workflow

Initial version:

API Request
 ↓
Process Operation
 ↓
Database

When synchronization becomes large:

API Request
 ↓
Create Job
 ↓
Queue
 ↓
Worker
 ↓
External API
 ↓
Normalize Data
 ↓
PostgreSQL

Potential technologies:

Redis
BullMQ

Do not introduce them until background processing is actually required.

#  21. Complete GitHub-to-Dashboard Flow

This is the most important product workflow.

                    USER
                      │
                      ▼
              Frontend Client
                      │
                      ▼
              Backend Server
                      │
                      ▼
             GitHub Integration
                      │
                      ▼
                 GitHub API
                      │
                      ▼
             Repository Data
                      │
                      ▼
              Data Validation
                      │
                      ▼
              Data Normalization
                      │
                      ▼
                PostgreSQL
                      │
                      ▼
              Analytics Engine
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
   Engineering Metrics       Bottlenecks
          │                       │
          └───────────┬───────────┘
                      ▼
                AI Service
                      │
                      ▼
              Engineering Insight
                      │
                      ▼
              Backend Server
                      │
                      ▼
              Frontend Client
                      │
                      ▼
                 Dashboard

# 22. Complete User Journey
Register
   ↓
Login
   ↓
Create / Join Organization
   ↓
Receive Role
   ↓
Open Dashboard
   ↓
Connect GitHub
   ↓
Authorize Integration
   ↓
Discover Repositories
   ↓
Select Repository
   ↓
Synchronize Data
   ↓
Normalize Data
   ↓
Calculate Engineering Metrics
   ↓
View Project Dashboard
   ↓
Identify Bottlenecks
   ↓
Ask AI
   ↓
Receive Grounded Insight
   ↓
Take Engineering Action

# 23. Complete Technical Architecture
┌───────────────────────────────────────────────────────────┐
│                    FRONTEND CLIENT                        │
│                  React + TypeScript                       │
│                                                           │
│ Dashboard | Projects | Repositories | Analytics | AI     │
└──────────────────────────┬────────────────────────────────┘
                           │
                       HTTPS / REST
                           │
                           ▼
┌───────────────────────────────────────────────────────────┐
│                    BACKEND SERVER                         │
│                Node.js + Express + TypeScript             │
│                                                           │
│ Routes → Middleware → Controllers → Services → Repos      │
└─────────────┬─────────────────┬─────────────────┬─────────┘
              │                 │                 │
              ▼                 ▼                 ▼
      ┌──────────────┐  ┌───────────────┐  ┌──────────────┐
      │ Integration  │  │  Analytics    │  │ AI Service   │
      │    Layer     │  │    Engine     │  │              │
      └──────┬───────┘  └───────┬───────┘  └──────┬───────┘
             │                  │                 │
             ▼                  │                 ▼
       ┌───────────┐            │          ┌─────────────┐
       │  GitHub   │            │          │ LLM Provider│
       │    API    │            │          └─────────────┘
       └───────────┘            │
                                │
                                ▼
                     ┌────────────────────┐
                     │   Prisma ORM       │
                     └─────────┬──────────┘
                               │
                               ▼
                     ┌────────────────────┐
                     │ Database Server    │
                     │ PostgreSQL         │
                     │ Supabase           │
                     └────────────────────┘
# 24. Future Scalable Architecture

When the system grows:

                         FRONTEND CLIENT
                               │
                               ▼
                         Load Balancer
                               │
                  ┌────────────┼────────────┐
                  ▼            ▼            ▼
               API #1       API #2       API #3
                  │            │            │
                  └────────────┼────────────┘
                               │
                     ┌─────────┴─────────┐
                     ▼                   ▼
                   Redis              PostgreSQL
                     │
                     ▼
                   Queue
                     │
             ┌───────┼────────┐
             ▼       ▼        ▼
          Worker  Worker   Worker
             │       │        │
             └───────┼────────┘
                     ▼
              External APIs

The initial system should remain a modular monolith.

Microservices should only be introduced when scale and operational requirements justify them.

# 25. Development Sequence

Build the system in this order:

1. Project Setup
       ↓
2. Frontend Client
       ↓
3. Backend Server
       ↓
4. Database Server
       ↓
5. Authentication
       ↓
6. Organizations
       ↓
7. RBAC
       ↓
8. Projects
       ↓
9. GitHub Integration
       ↓
10. Repository Synchronization
       ↓
11. Data Normalization
       ↓
12. Analytics Engine
       ↓
13. Dashboard
       ↓
14. Bottleneck Detection
       ↓
15. AI Service
       ↓
16. Testing
       ↓
17. Security Hardening
       ↓
18. Deployment
       ↓
19. Performance Optimization
       ↓
20. Additional Integrations
26. Core Principle

ForgeIQ follows:

CONNECT
   ↓
COLLECT
   ↓
VALIDATE
   ↓
NORMALIZE
   ↓
STORE
   ↓
ANALYZE
   ↓
IDENTIFY
   ↓
EXPLAIN
   ↓
IMPROVE

The platform should always prioritize:

real data
secure authorization
organization isolation
explainable analytics
grounded AI
maintainable architecture
scalability
developer understanding

### Where to put it

Your project should look like:

```text
ForgeIQ/
│
├── WORKFLOW.md       ← create this now
├── specs.md
├── REQUIREMENTS.md
├── development.md
├── ARCHITECTURE.md
├── README.md
├── .env.example
│
├── frontend/
└── backend/

Keep WORKFLOW.md as the single source of truth for how data moves through the system. When you later use Claude/Antigravity, tell it to read specs.md, REQUIREMENTS.md, development.md, ARCHITECTURE.md, and WORKFLOW.md before modifying code.