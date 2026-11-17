# Development Guide

---

## 1. Project structure

```
/
├── frontend/         Angular 21 — SPA + admin panel + adventures
├── backend/          Express + TypeScript — REST API
├── shared/           TypeScript types + Zod schemas (source of truth)
├── database/         Prisma schema, migrations, seed script
├── n8n/workflows/    n8n workflow JSON export (backup/reference)
├── scripts/          setup-ec2.sh, setup-nginx.sh, nginx configs
├── docs/             Documentation, sprints, security
└── .github/          GitHub Actions (auto deploy)
```

---

## 2. Prerequisites

- **Node.js 20+**
- **Docker Desktop** (running)
- **npm** (comes with Node)

---

## 3. Local setup

```bash
# 1. Clone repo
git clone https://github.com/Oti404/otniel-iacob.git
cd otniel-iacob

# 2. Copy and fill in env vars
cp .env.example .env
# Edit .env — minimum required:
#   POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
#   JWT_SECRET (min 16 chars), JWT_REFRESH_SECRET, JWT_SUBSCRIBER_SECRET
#   ADMIN_PASSWORD, INTERNAL_API_KEY (min 16 chars)
#   ALLOWED_ORIGINS=http://localhost:4200

# 3. Install dependencies
npm install

# 4. Start
run.bat   # Windows — select mode from menu
```

### Run modes (run.bat)

| Option | What starts | When to use |
|--------|------------|-------------|
| `[1]` Full Docker | Everything in Docker (no live reload) | Test identical to production |
| `[2]` Hybrid | DB in Docker, frontend+backend via npm (live reload) | Active development |

### Manual (without run.bat)

```bash
# Hybrid — DB in Docker, apps local with live reload
docker compose up -d postgres
npm run dev

# Full Docker
docker compose up -d --build
```

**Note:** n8n does NOT run locally — it runs on the server only. The AI chat admin module requires a connection to the production server (or a manually configured local n8n).

---

## 4. Local ports

| Service | URL |
|---------|-----|
| Frontend (dev) | http://localhost:4200 |
| Frontend (Docker) | http://localhost:80 |
| Backend API | http://localhost:3000 |
| Admin Panel | http://localhost:4200/admin |
| Adventures | http://localhost:4200/#/adventures |
| PostgreSQL | localhost:5433 |

---

## 5. NPM Workspaces

Root `package.json` connects all packages as workspaces:

```bash
npm run dev              # Frontend + backend concurrently (with live reload)
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only
npm run build:frontend   # Production frontend build
npm run build:all        # shared → backend → frontend
```

---

## 6. Database

```bash
# Apply migrations
cd database && npx prisma migrate dev

# Run seed (creates admin user + sample data)
cd database && npx ts-node --transpile-only seed.ts

# Prisma Studio (visual interface)
cd database && npx prisma studio
```

Admin credentials are set from the `ADMIN_PASSWORD` variable in `.env`.

**Important:** n8n and portfolio share the same DB. `prisma migrate dev` detects drift from n8n tables. For schema changes in production, apply SQL directly and then run `prisma generate` — do not use `migrate dev` against the production DB.

---

## 7. Code conventions

### Backend
- Validate all input with **Zod** on every POST/PUT route
- **Never** use `req.body` directly without `safeParse`
- IDs validated with the `id()` helper from `admin.ts` — NaN protection
- All types from `@monorepo/shared` or defined locally in the route
- Auth tokens carry an explicit `type` claim (`'admin'` / `'subscriber'`) — always check it

### Frontend
- **Standalone** components (no NgModule)
- HTTP calls exclusively through **services** — never directly in components
- Admin panel: CSS design-system variables (`--admin-*`) — no hardcoded hex
- Adventures module: lazy-loaded, separate from admin

### General
- No keys or secrets in source code
- Any new Prisma field = new migration (`prisma migrate dev`)
- Commits in English or Romanian — descriptive message

---

## 8. Adventures feature

All 7 phases complete. See [planning/adventures-feature.md](planning/adventures-feature.md) for the full plan.

### Required env vars (add to `.env` for local dev)

```bash
# Cloudinary — image/video uploads (optional; feature gracefully skips if absent)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Google OAuth — subscriber login (returns 503 if absent)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
FRONTEND_URL=http://localhost:4200

# Web Push — push notifications (optional; feature gracefully skips if absent)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:otnieliacob@gmail.com
```

### Generate VAPID keys (one-time)

```bash
npx web-push generate-vapid-keys
```

### Subscriber auth vs admin auth

| | Admin | Subscriber |
|--|-------|-----------|
| Login method | Email/password | Google OAuth |
| Token secret | `JWT_SECRET` | `JWT_SUBSCRIBER_SECRET` |
| Cookie | `refresh_token` | `subscriber_token` |
| Token type claim | `'admin'` | `'subscriber'` |
| Scope | All `/api/admin/*` routes | Subscriptions + push only |

---

## 9. n8n (AI Project Intake)

n8n runs **only on the server**, not locally. The workflow is exported in `n8n/workflows/program.json` as backup.

**Access n8n on server (via SSH tunnel):**
```bash
ssh -i key.pem -N -L 5678:127.0.0.1:5678 ubuntu@13.60.216.226
# Then open http://localhost:5678
```

**On first deploy or after reinstall:**
1. Import `n8n/workflows/program.json` into n8n
2. Configure credentials: Google Gemini API + PostgreSQL
3. Publish the workflow (not just Save)

---

## 10. Key files reference

| File | Role |
|------|------|
| `backend/index.ts` | Backend entry point — middleware, routes, startup validation |
| `backend/middleware/auth.ts` | JWT verification (admin tokens only) |
| `backend/routes/admin.ts` | CRUD for all portfolio entities |
| `backend/routes/admin-chronicles.ts` | CRUD for chronicles, passages, media + publish triggers |
| `backend/routes/auth.ts` | Admin login, refresh, logout |
| `backend/routes/subscriber-auth.ts` | Google OAuth flow + subscriber session |
| `backend/routes/subscriptions.ts` | Subscriber subscription management |
| `backend/routes/push.ts` | Web Push subscribe/unsubscribe + VAPID key endpoint |
| `backend/routes/internal.ts` | Internal endpoints for n8n (protected by INTERNAL_API_KEY) |
| `backend/services/cloudinary.ts` | Cloudinary upload/delete helpers |
| `backend/services/push.ts` | `notifySubscribers()` — sends Web Push on chronicle/passage publish |
| `database/prisma/schema.prisma` | Database schema |
| `database/seed.ts` | Admin user + initial data |
| `scripts/setup-nginx.sh` | Idempotent nginx install/configure |
| `scripts/nginx-prod.conf` | nginx HTTP config |
| `scripts/nginx-prod-ssl.conf` | nginx HTTPS config (with domain) |
| `.github/workflows/deploy-aws.yml` | Automatic CI/CD pipeline |
