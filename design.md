# Intervue — Design Document

## 1. Overview

Intervue is an AI-powered mock interview platform. Candidates practice technical and behavioral interviews against AI interviewers, get scored feedback, and track progress. Admins manage users, content, job roles, and platform metrics.

## 2. Goals

- Realistic, role-specific mock interview experience powered by LLMs.
- Structured feedback: scores, strengths, weaknesses, improvement suggestions.
- Resume-driven personalization (parse uploaded PDF → tailor questions).
- DSA practice with code editor and evaluation.
- Admin visibility into usage, users, and content.

## 3. Architecture

```
┌──────────────────────┐         HTTPS / WSS         ┌──────────────────────────┐
│  Next.js 16 (Vercel) │ ──────────────────────────► │  Spring Boot 3.2 backend │
│  React 19 + Tailwind │ ◄────────────────────────── │  Java 21, Maven          │
└──────────────────────┘     JSON REST + WebSocket   └──────────┬───────────────┘
                                                                │ JDBC
                                                                ▼
                                                    ┌────────────────────────┐
                                                    │  Postgres (Supabase)   │
                                                    └────────────────────────┘
                              ▲                                 ▲
                              │ Gemini, Groq                    │ Brevo, Gmail SMTP
                              │ (LLM inference)                 │ (transactional mail)
                              └─────────────────────────────────┘
```

### 3.1 Frontend (`frontend/`)

- Next.js 16 App Router, React 19, TypeScript 5, Tailwind v4, shadcn/ui.
- Animation: framer-motion / motion / gsap.
- Code editor: `@monaco-editor/react` for DSA challenges.
- Theming: `next-themes` (dark/light).
- Auth tokens stored client-side; attached as `Authorization: Bearer …` to backend calls.
- Route groups: marketing landing, `dashboard/` (candidate), `admin/` (admin).

### 3.2 Backend (`backend/`)

Spring Boot, layered per domain. Each package owns its controller, service, repository, entity, DTO.

| Package | Responsibility |
|---|---|
| `auth` | Signup, login, password reset, OAuth2, JWT issue/verify |
| `user` | Profile, settings, account lifecycle |
| `interview` | Mock interview sessions, transcript, evaluation |
| `ai` | Adapters for Gemini + Groq; prompt orchestration |
| `resume` | PDF upload, parse (pdfbox), extract structured data |
| `jobrole` | Role catalog used to scope interview questions |
| `dsa` | Coding problems, submissions, judging |
| `dashboard` | Candidate-facing aggregates (history, progress) |
| `admin` | User management, platform metrics, site visits |
| `notification` | Brevo + SMTP email senders, templates |
| `websocket` | STOMP endpoints for real-time interview signaling |
| `config` | SecurityConfig, CORS, JWT filter, web config |
| `exception` | `@ControllerAdvice` global error handlers |
| `health` | `/health` liveness/readiness |

### 3.3 Data layer

- Postgres via Supabase pooler (`aws-1-ap-northeast-1.pooler.supabase.com:5432`).
- Spring Data JPA, `ddl-auto=update` (schema auto-evolved in dev — **migrate to Flyway/Liquibase before scale**).
- Connection pool: HikariCP defaults.

### 3.4 AI integration

- **Gemini** (`gemini-flash-latest`): primary interviewer (question generation, follow-ups, scoring rubric).
- **Groq**: low-latency path for fast turn-taking or short evaluations.
- Routing decision lives in `ai/` package — task complexity dictates model.
- Prompts assembled from: job role, candidate resume excerpt, prior turns, rubric.

## 4. Authentication & Authorization

- JWT access token (24h, `JWT_EXPIRATION=86400000`) + refresh token (7d).
- HMAC signing via `JWT_SECRET_KEY` (256-bit).
- Spring Security filter chain: stateless, JWT filter before `UsernamePasswordAuthenticationFilter`.
- OAuth2 client starter present (Google) — federated signup path.
- Password reset via Brevo email with one-time token.

## 5. Key user flows

### 5.1 Candidate mock interview

1. User selects job role + uploads resume (PDF).
2. Backend parses resume → key skills, projects.
3. AI service builds opening question from role + resume.
4. WebSocket session opens; user answers turn-by-turn.
5. After N turns or user-end, AI produces structured evaluation (scores per dimension, narrative feedback).
6. Persist transcript + evaluation; surface in dashboard history.

### 5.2 DSA practice

1. User picks problem from `dsa/` catalog.
2. Monaco editor in browser; submit code to backend.
3. Backend runs evaluation (planned: sandboxed runner) and returns verdict.

### 5.3 Admin

1. Admin login (role-gated).
2. Dashboard: site visits (`VisitTracker.tsx` posts pings), user counts, usage stats.
3. CRUD over job roles, problems, users.

## 6. Configuration & secrets

- `application.properties` declares every env-driven setting as `${KEY:default}`.
- Local dev: `application-local.properties` (gitignored), activated via `-Dspring-boot.run.profiles=local`.
- Production: env vars set on host (Render). No secrets in repo.
- Frontend secrets in `frontend/.env.local` (browser-exposed values prefixed `NEXT_PUBLIC_`).

## 7. Deployment

- **Frontend:** Vercel — `https://intervue-sepia.vercel.app/`.
- **Backend:** Dockerfile in `backend/`; deploys to Render (or any container host). Binds `0.0.0.0:${PORT:10000}`.
- **Database:** Supabase managed Postgres.
- CORS: `ALLOWED_ORIGINS` whitelist (Vercel domain + localhost).

## 8. Non-functional concerns

| Area | Current state | Next step |
|---|---|---|
| DB migrations | `ddl-auto=update` | Adopt Flyway, freeze schema |
| Observability | Spring default logs | Structured JSON logs + request IDs |
| Rate limiting | None | Bucket4j or gateway-level limits, esp. on AI endpoints |
| Secret rotation | Manual | Move to a vault (Doppler / AWS Secrets Manager) |
| Tests | Spring + Security test starters wired | Add controller + service tests, frontend Playwright |
| File storage | Local `uploads/` | Move to S3/R2 for horizontal scale |
| AI cost | Unbounded | Per-user quota + caching on identical prompts |

## 9. Risks

- **Single Postgres connection**: pooler URL but no explicit Hikari sizing — verify under load.
- **`ddl-auto=update` in prod** silently mutates schema; risky if entities drift. Migrate before scale.
- **Local `uploads/` directory** is ephemeral on Render — uploads disappear on redeploy.
- **JWT secret in plain env var**: rotate regularly; consider asymmetric keys (RS256) if backend splits.
- **AI vendor lock**: Gemini/Groq adapters should stay behind a port interface to allow swapping.

## 10. Glossary

- **Mock interview session** — a single round with one role, one resume, N turns, one evaluation.
- **Evaluation** — structured JSON: per-dimension scores + narrative.
- **Job role** — interview scope (e.g., "Backend SWE — Java"). Drives prompt and rubric.
