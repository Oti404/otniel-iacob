# Personal Portfolio — Monorepo

Angular 21 + Node.js/Express + Prisma + PostgreSQL + n8n, deployed on AWS EC2.

Built as both a personal portfolio and a technical sandbox for AI-assisted development workflows, DevSecOps practices, and automation.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21, SCSS, Nginx |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 15, Prisma ORM |
| Automation | n8n (self-hosted) |
| Auth | JWT (access token in memory + httpOnly refresh cookie) |
| Infrastructure | Docker Compose (local), AWS EC2 (prod) |

---

## Project Structure

```
/
├── frontend/     Angular application
├── backend/      Express API + file upload
├── shared/       TypeScript interfaces + Zod schemas (source of truth for types)
├── database/     Prisma schema, migrations, seed script
├── n8n/          Workflow exports
├── e2e/          End-to-end tests
├── scripts/      Dev/build/deploy automation
└── docs/         Architecture decisions, sprints, agent wardrobe
```

---

## Local Development

### Prerequisites

- Docker Desktop (running)
- Node.js 20+

### 1. Environment

```bash
cp .env.example .env
# Fill in: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, JWT_SECRET, JWT_REFRESH_SECRET, ADMIN_PASSWORD
```

### 2. Run

**Option A — Windows (recommended)**

```bat
run.bat
```

Choose `[1]` for full Docker (no live reload) or `[2]` for hybrid mode (Docker for DB/n8n, npm for apps with live reload).

**Option B — Manual**

```bash
# Hybrid mode: DB + n8n in Docker, apps locally
docker-compose up -d postgres n8n
npm install
npm run dev
```

```bash
# Full Docker
docker-compose up -d --build
```

### Ports

| Service | URL |
|---|---|
| Frontend | http://localhost:80 (Docker) / http://localhost:4200 (dev) |
| Backend API | http://localhost:3000 |
| Admin Panel | http://localhost:80/admin |
| n8n | http://localhost:5678 |
| PostgreSQL | localhost:5433 |

### Seed the database

```bash
cd database
npm run seed
```

---

## NPM Workspaces

Root `package.json` wires `frontend`, `backend`, `shared`, and `database` as workspaces.

```bash
npm run dev            # Start frontend + backend concurrently
npm run dev:frontend   # Frontend only
npm run dev:backend    # Backend only
npm run build:all      # Build shared → backend → frontend
```

---

## Documentation

- [`docs/AGENTS.md`](./docs/AGENTS.md) — AI agent chain of command (Architect → Planner → Coder → Reviewer → Security Officer → DevOps)
- [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) — Directory structure and conventions
- [`docs/OPERATIONS.md`](./docs/OPERATIONS.md) — Deployment and sync guide
- [`docs/sprints/`](./docs/sprints/) — Sprint plans (SPRINT-01 through SPRINT-03)
- [`docs/infrastructure/`](./docs/infrastructure/) — AWS architecture and EC2 setup
