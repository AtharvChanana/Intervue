# Intervue — Claude Code Guide

AI-powered mock interview platform. Two services in one repo.

## Repo layout

```
Intervue/
├── backend/      Spring Boot 3.2 + Java 21 (REST API, WebSocket, Postgres, JWT auth)
└── frontend/     Next.js 16 + React 19 + Tailwind v4 + shadcn (App Router)
```

## Frontend

- **IMPORTANT:** Next.js 16 / React 19 are newer than your training data. APIs and conventions differ. Before writing frontend code, read the relevant guide in `frontend/node_modules/next/dist/docs/` and heed deprecation notices. (See `frontend/AGENTS.md`.)
- Package manager: npm. Scripts: `npm run dev`, `npm run build`, `npm run lint`.
- UI: shadcn components in `frontend/components/ui`, animations via framer-motion / motion / gsap.
- Routes live under `frontend/app/` (App Router). Admin and dashboard are separate route groups.

## Backend

- Spring Boot 3.2.3, Java 21, Maven (`./mvnw`).
- Domain packages under `backend/src/main/java/com/mockinterview/`: `admin`, `ai`, `auth`, `config`, `dashboard`, `dsa`, `exception`, `health`, `interview`, `jobrole`, `notification`, `resume`, `user`, `websocket`.
- Postgres via Supabase pooler. JPA `ddl-auto=update` in dev — schema is auto-evolved, no migration tool yet.
- Auth: JWT (jjwt 0.11.5) + Spring Security + OAuth2 client.
- AI integrations: Gemini (`gemini-flash-latest`) and Groq.
- Email: Brevo + Gmail SMTP (port 465 SSL).
- PDF parsing: pdfbox + itextpdf (resume flows).
- WebSocket starter included for real-time interview features.

### Running backend locally

Secrets live in `backend/src/main/resources/application-local.properties` (gitignored). Activate the profile:

```
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

In production, env vars are set on the host (Render etc.) — `application.properties` reads them via `${VAR:default}`.

### Env var keys (canonical names)

`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `SPRING_JPA_DDL_AUTO`, `JWT_SECRET_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `BREVO_API_KEY`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `ALLOWED_ORIGINS`, `PORT`.

## Conventions

- Never commit `application-local.properties`, `.env`, `.env.*`, or `uploads/` (covered by `backend/.gitignore`).
- New backend secrets: add `${KEY:default}` placeholder in `application.properties`, set the real value only in `application-local.properties` (local) or host env (prod).
- New frontend env: `frontend/.env.local`. Browser-exposed values must be prefixed `NEXT_PUBLIC_`.
- CORS allowed origins are a comma-separated list in `ALLOWED_ORIGINS`.

## Common tasks

- **Add a backend endpoint:** create controller under the matching domain package; DTOs in same package; wire security in `config/`.
- **Add a frontend route:** new folder under `frontend/app/`. Server components by default; add `"use client"` only when needed.
- **Run frontend + backend together:** two terminals — `cd frontend && npm run dev` (3000) and the mvnw command above (10000 by default).

## Deployment

- Frontend: Vercel (`https://intervue-sepia.vercel.app/`).
- Backend: containerized via `backend/Dockerfile`; binds `0.0.0.0:${PORT:10000}`.
