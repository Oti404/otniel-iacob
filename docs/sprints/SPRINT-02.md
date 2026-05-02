# SPRINT-02: Dynamic Data Layer & Admin Authentication

**Goal:** Replace all hardcoded frontend data with a PostgreSQL database served through a typed REST API. Implement JWT-based admin authentication with a secure middleware layer protecting all `/api/admin/*` routes.

**Architect Reference:** `ADR-001` (Database Schema & API Contract Design)
**Prerequisite:** SPRINT-01 completed. Local docker-compose with PostgreSQL running.

---

## 1. Pre-Flight Check

- **Feasibility:** High. Prisma, Express, and Angular already in place. New packages: `bcrypt`, `jsonwebtoken`, `zod`, `cookie-parser`, `express-rate-limit`.
- **Auth Requirements:** Single admin user. JWT access token (15min) + refresh token (7 days, httpOnly cookie).
- **Dependency Chain (strict — do not reorder):**
  1. `/shared` interfaces updated first
  2. Zod schemas added to `/shared`
  3. Prisma schema updated + migration run
  4. Seed script created and executed
  5. Public API endpoints implemented
  6. Auth endpoints + middleware implemented
  7. Admin API endpoints implemented (behind middleware)
  8. Frontend services refactored to consume API
  9. Admin panel Angular module scaffolded

---

## 2. Architecture Blueprint

```
┌─────────────────────────────────────────────────────┐
│                   ANGULAR FRONTEND                  │
│  Public Pages          │      Admin Panel (lazy)    │
│  /home /projects etc.  │      /admin/*              │
└────────────┬───────────┴──────────┬─────────────────┘
             │ HTTP (public)        │ HTTP + JWT cookie
             ▼                      ▼
┌─────────────────────────────────────────────────────┐
│                  EXPRESS BACKEND                    │
│                                                     │
│  /api/health          (public)                      │
│  /api/profile         (public)                      │
│  /api/projects        (public)                      │
│  /api/experience      (public)                      │
│  /api/semesters       (public)                      │
│  /api/hobbies         (public)                      │
│                                                     │
│  /api/auth/login      (public - rate limited)       │
│  /api/auth/refresh    (public - rate limited)       │
│  /api/auth/logout     (public)                      │
│                                                     │
│  /api/admin/*         (JWT middleware required)     │
└────────────────────────┬────────────────────────────┘
                         │ Prisma ORM
                         ▼
              ┌─────────────────────┐
              │    PostgreSQL DB     │
              │  (docker-compose)   │
              └─────────────────────┘
```

**Auth Flow:**
```
POST /api/auth/login
  → validate credentials (bcrypt compare)
  → issue accessToken (JWT, 15min, in response body)
  → issue refreshToken (JWT, 7 days, httpOnly cookie)

POST /api/auth/refresh
  → read refreshToken from httpOnly cookie
  → issue new accessToken

POST /api/auth/logout
  → clear httpOnly cookie

GET /api/admin/*
  → authMiddleware reads Authorization: Bearer <accessToken>
  → verifies JWT signature + expiry
  → proceeds or returns 401
```

---

## 3. Time-Blocked Execution

---

### PHASE 1 — SHARED CONTRACTS

#### Task 1.1 — Update `/shared/index.ts` with all TypeScript interfaces
- **Description:** Replace the existing `HealthStatus`-only file with the full interface set defined by the Architect: `Profile`, `Project`, `Experience`, `Semester`, `Subject`, `Hobby`, `LoginRequest`, `AuthTokens`, `ApiResponse<T>`, enums `ProjectStatus` and `ExperienceType`, and retain `HealthStatus`.
- **Time Estimate:** 20 min
- **Definition of Done:** `/shared/index.ts` exports all interfaces and enums. No TypeScript errors (`tsc --noEmit` passes).

#### Task 1.2 — Add Zod validation schemas to `/shared`
- **Description:** Create `/shared/schemas.ts`. Add Zod schemas for: `loginSchema`, `profileSchema`, `projectSchema`, `experienceSchema`, `semesterSchema`, `subjectSchema`, `hobbySchema`. Each schema must match its TypeScript interface exactly. Export all from `/shared/index.ts`.
- **Time Estimate:** 30 min
- **Definition of Done:** All schemas exported. Backend can import and use `.parse()` / `.safeParse()` on incoming request bodies.

---

### PHASE 2 — DATABASE

#### Task 2.1 — Update Prisma schema
- **Description:** Replace the current `schema.prisma` (which only has `HealthCheck`) with the full schema from ADR-001: `AdminUser`, `Profile`, `Project`, `Experience`, `Semester`, `Subject`, `Hobby`, and the two enums `ProjectStatus` / `ExperienceType`. Keep the existing `HealthCheck` model.
- **Time Estimate:** 15 min
- **Definition of Done:** `npx prisma validate` passes with zero errors.

#### Task 2.2 — Generate and run Prisma migration
- **Description:** Run `npx prisma migrate dev --name add_content_schema` from the `/database` directory. Verify migration file is generated in `/database/prisma/migrations/`. Run `npx prisma generate` to regenerate the client.
- **Time Estimate:** 10 min
- **Definition of Done:** Migration runs without errors. All tables visible in PostgreSQL. Prisma client regenerated.

#### Task 2.3 — Create seed script
- **Description:** Create `/database/seed.ts`. Migrate all hardcoded data from `/frontend/src/app/services/data.ts`, `projects.ts`, `experience.ts`, and `/frontend/src/data/academicData.ts` into the seed script. Use `prisma.upsert()` for all records so the script is idempotent. Include one `AdminUser` record with a bcrypt-hashed password (read from `ADMIN_PASSWORD` env variable — never hardcoded). Add `"seed": "ts-node seed.ts"` to `/database/package.json`.
- **Time Estimate:** 45 min
- **Definition of Done:** `npm run seed` from `/database` populates all tables. Running it twice produces no duplicates. AdminUser exists with correct bcrypt hash.

---

### PHASE 3 — BACKEND PUBLIC API

#### Task 3.1 — Install backend dependencies
- **Description:** From `/backend`, install: `bcrypt @types/bcrypt jsonwebtoken @types/jsonwebtoken zod cookie-parser @types/cookie-parser express-rate-limit`.
- **Time Estimate:** 5 min
- **Definition of Done:** All packages in `/backend/package.json`. No peer dependency warnings.

#### Task 3.2 — Refactor `backend/index.ts` — middleware setup
- **Description:** Add `cookie-parser` middleware. Add rate limiter instance for auth routes (max 10 requests / 15 min per IP). Ensure CORS is configured to allow credentials (`credentials: true`, specific `origin` from env). Add `express.json()` if not already present.
- **Time Estimate:** 20 min
- **Definition of Done:** Server starts. CORS headers present on responses. Cookie-parser active.

#### Task 3.3 — Implement public content routes
- **Description:** Create `/backend/routes/content.ts`. Implement GET handlers for: `/api/profile` (first record), `/api/projects` (filtered by `display: true`, ordered by `order ASC`), `/api/experience` (ordered by `order ASC`), `/api/semesters` (with nested subjects, ordered by `order ASC`), `/api/hobbies` (ordered by `order ASC`). Wrap all responses in `ApiResponse<T>`. Handle DB errors with 500 + error log.
- **Time Estimate:** 40 min
- **Definition of Done:** All 5 endpoints return correct JSON. Tested with curl or Postman. Empty DB returns `{ data: null }` or `{ data: [] }` — never throws.

---

### PHASE 4 — AUTH

#### Task 4.1 — Implement auth routes
- **Description:** Create `/backend/routes/auth.ts`. Implement:
  - `POST /api/auth/login`: validate body with `loginSchema` (Zod), find AdminUser by email, bcrypt compare, issue accessToken (JWT 15min) + refreshToken (JWT 7d as httpOnly cookie). Return `{ data: { accessToken } }`.
  - `POST /api/auth/refresh`: read `refreshToken` cookie, verify JWT, issue new accessToken.
  - `POST /api/auth/logout`: clear `refreshToken` cookie, return 200.
  - Apply rate limiter (from Task 3.2) to login and refresh routes.
- **Time Estimate:** 45 min
- **Definition of Done:** Login with correct credentials returns accessToken + sets cookie. Login with wrong credentials returns 401. Refresh returns new accessToken. Logout clears cookie.

#### Task 4.2 — Implement JWT auth middleware
- **Description:** Create `/backend/middleware/auth.ts`. Read `Authorization: Bearer <token>` header. Verify JWT signature using `JWT_SECRET` from env. On failure: return 401 with `{ error: 'Unauthorized' }`. On success: attach decoded payload to `req.user` and call `next()`. Never log the token itself.
- **Time Estimate:** 20 min
- **Definition of Done:** Protected route returns 401 without token. Returns 200 with valid token. Returns 401 with expired token.

---

### PHASE 5 — BACKEND ADMIN API

#### Task 5.1 — Implement admin profile route
- **Description:** Create `/backend/routes/admin.ts`. Implement `PUT /api/admin/profile`: validate body with `profileSchema` (Zod), upsert the single Profile record. Apply auth middleware to all routes in this file.
- **Time Estimate:** 20 min
- **Definition of Done:** PUT updates Profile. Missing fields return 400 with Zod error details. No auth token returns 401.

#### Task 5.2 — Implement admin CRUD for Projects
- **Description:** In `/backend/routes/admin.ts`, add: `POST /api/admin/projects`, `PUT /api/admin/projects/:id`, `DELETE /api/admin/projects/:id`. Validate with `projectSchema`. Return updated record on PUT/POST. Return `{ data: { id } }` on DELETE.
- **Time Estimate:** 30 min
- **Definition of Done:** Full CRUD tested. Invalid body returns 400. Non-existent ID on PUT/DELETE returns 404.

#### Task 5.3 — Implement admin CRUD for Experience, Hobbies
- **Description:** Same pattern as Task 5.2 for `/api/admin/experience` and `/api/admin/hobbies`.
- **Time Estimate:** 30 min
- **Definition of Done:** Same criteria as Task 5.2, applied to both entities.

#### Task 5.4 — Implement admin CRUD for Semesters & Subjects
- **Description:** Same pattern for `/api/admin/semesters` and `/api/admin/subjects`. On Subject creation, validate that `semesterId` exists before insert. On Semester delete, cascade to subjects (Prisma handles via schema relation).
- **Time Estimate:** 30 min
- **Definition of Done:** Creating a subject with invalid semesterId returns 400. Deleting a semester deletes its subjects.

---

### PHASE 6 — FRONTEND REFACTOR

#### Task 6.1 — Add `ADMIN_PASSWORD` and `JWT_SECRET` to `.env` and `.env.example`
- **Description:** Add `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `ADMIN_PASSWORD` to both `.env` and `.env.example`. `.env.example` gets placeholder values. `.env` gets real values (never committed). Verify `.gitignore` excludes `.env`.
- **Time Estimate:** 10 min
- **Definition of Done:** Both files updated. `git status` shows `.env` as untracked/ignored.

#### Task 6.2 — Refactor Angular services to consume API
- **Description:** Replace `DataService`, `ProjectsService`, `ExperienceService` hardcoded arrays with `HttpClient` GET calls to the public API endpoints. Use `ApiResponse<T>` type for response mapping. Remove all hardcoded data from `/frontend/src/app/services/` and `/frontend/src/data/academicData.ts`. Add loading state and error state handling in each service.
- **Time Estimate:** 60 min
- **Definition of Done:** Site displays same content as before but sourced from API. No hardcoded content arrays remain in frontend. Network tab shows API calls. Removed files: `data.ts`, `projects.ts`, `experience.ts` (services replaced, not deleted if they contain non-data logic).

#### Task 6.3 — Scaffold Admin Panel Angular module
- **Description:** Generate a lazy-loaded `AdminModule` at route `/admin`. Create `LoginComponent` with email/password form. On login, call `POST /api/auth/login`, store `accessToken` in memory (never localStorage), create `AuthService` with `isLoggedIn$` observable. Add `AuthGuard` redirecting unauthenticated users to `/admin/login`. Dashboard stub page showing "Admin Panel — Connected".
- **Time Estimate:** 60 min
- **Definition of Done:** `/admin/login` renders form. Correct credentials navigate to `/admin/dashboard`. Incorrect credentials show error message. Navigating to `/admin/dashboard` without login redirects to `/admin/login`. accessToken stored in memory only.

---

## 4. Retrospective Protocol

| Metric | Value |
|---|---|
| **Estimated Total Time** | ~7.5 hours |
| **Phase 1 (Shared)** | 50 min |
| **Phase 2 (Database)** | 70 min |
| **Phase 3 (Public API)** | 65 min |
| **Phase 4 (Auth)** | 65 min |
| **Phase 5 (Admin API)** | 110 min |
| **Phase 6 (Frontend)** | 130 min |
| **Actual Time** | [To be filled post-sprint] |
| **Velocity Delta** | [Actual - Estimated] |
| **Blockers** | [To be filled post-sprint] |

---

## 5. Definition of Done — Sprint Level

- [ ] All tables exist in PostgreSQL and are populated via seed script
- [ ] All public GET endpoints return correct data
- [ ] Login returns accessToken + sets httpOnly refresh cookie
- [ ] All `/api/admin/*` routes return 401 without valid JWT
- [ ] Frontend displays data from API (not hardcoded)
- [ ] `/admin/login` functional with AuthGuard protecting dashboard
- [ ] No secrets committed to git
- [ ] `npx prisma migrate dev` runs clean from scratch

---

*SPRINT-02 | Owner: Coder | Unblocked after: Architect ADR-001 approval*
*Previous sprint: SPRINT-01 (DevContainer & Workspaces)*
