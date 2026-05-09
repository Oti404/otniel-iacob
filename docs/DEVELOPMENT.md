# Development Guide

---

## 1. Structura proiectului

```
/
├── frontend/         Angular 21 — SPA + admin panel
├── backend/          Express + TypeScript — REST API
├── shared/           Tipuri TypeScript + scheme Zod (sursa de adevăr)
├── database/         Prisma schema, migrări, seed script
├── n8n/workflows/    Export JSON workflow n8n (backup/referință)
├── scripts/          setup-ec2.sh, setup-nginx.sh, nginx configs
├── docs/             Documentație, sprints, securitate
└── .github/          GitHub Actions (deploy automat)
```

---

## 2. Prerequisite locale

- **Node.js 20+**
- **Docker Desktop** (pornit)
- **npm** (vine cu Node)

---

## 3. Setup local

```bash
# 1. Clonează repo
git clone https://github.com/Oti404/otniel-iacob.git
cd otniel-iacob

# 2. Copiază și completează variabilele de mediu
cp .env.example .env
# Editează .env: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB,
#               JWT_SECRET (min 32 chars), JWT_REFRESH_SECRET, ADMIN_PASSWORD

# 3. Instalează dependențe
npm install

# 4. Pornește
run.bat   # Windows — selectează modul din meniu
```

### Moduri de rulare (run.bat)

| Opțiune | Ce pornește | Când să folosești |
|---------|------------|-------------------|
| `[1]` Full Docker | Tot în Docker (fără live reload) | Test identic cu producția |
| `[2]` Hybrid | DB în Docker, frontend+backend cu npm (live reload) | Development activ |

### Manual (fără run.bat)

```bash
# Hybrid — DB în Docker, aplicații local cu live reload
docker compose up -d postgres
npm run dev

# Full Docker
docker compose up -d --build
```

**Notă:** n8n NU rulează local — rulează doar pe server. Modulul AI chat din admin panel necesită conexiunea la serverul de producție (sau un n8n local configurat manual).

---

## 4. Porturi locale

| Serviciu | URL |
|---------|-----|
| Frontend (dev) | http://localhost:4200 |
| Frontend (Docker) | http://localhost:80 |
| Backend API | http://localhost:3000 |
| Admin Panel | http://localhost:4200/admin sau http://localhost:80/admin |
| PostgreSQL | localhost:5433 |

---

## 5. NPM Workspaces

Root `package.json` conectează toate pachetele ca workspaces:

```bash
npm run dev              # Frontend + backend concurent (cu live reload)
npm run dev:frontend     # Doar frontend
npm run dev:backend      # Doar backend
npm run build:frontend   # Build producție frontend
```

---

## 6. Baza de date

```bash
# Aplică migrări
cd database && npx prisma migrate dev

# Rulează seed (crează admin user + date exemplu)
cd database && npx ts-node --transpile-only seed.ts

# Prisma Studio (interfață vizuală)
cd database && npx prisma studio
```

Credențialele admin sunt setate din variabila `ADMIN_PASSWORD` în `.env`.

---

## 7. Convenții de cod

### Backend
- Validare input cu **Zod** pe toate rutele POST/PUT
- **Niciodată** `req.body` direct fără `safeParse`
- IDs validate cu funcția `id()` din `admin.ts` — protecție NaN
- Tipuri din `@monorepo/shared` sau definite local în rută

### Frontend
- Componente **standalone** (fără NgModule)
- HTTP calls exclusiv prin **servicii** — niciodată direct în componente
- Admin panel: design system variabile CSS (`--admin-*`) — fără hex hardcodat

### General
- Nicio cheie sau secret în cod sursă
- Orice câmp nou în Prisma = migrare nouă (`prisma migrate dev`)
- Commits în română sau engleză — mesaj descriptiv

---

## 8. n8n (AI Project Intake)

n8n rulează **doar pe server**, nu local. Workflow-ul este exportat în `n8n/workflows/program.json` ca backup.

**Acces n8n pe server (via SSH tunnel):**
```bash
ssh -i key.pem -N -L 5678:127.0.0.1:5678 ubuntu@13.60.216.226
# Apoi deschide http://localhost:5678
```

**La primul deploy sau după reinstalare:**
1. Importă `n8n/workflows/program.json` în n8n
2. Configurează credențialele: Google Gemini API + PostgreSQL
3. Publish workflow-ul (nu doar Save)

---

## 9. Fișiere importante

| Fișier | Rol |
|--------|-----|
| `backend/index.ts` | Entry point backend — middleware, rute, validare startup |
| `backend/middleware/auth.ts` | JWT verification |
| `backend/routes/admin.ts` | CRUD pentru toate entitățile |
| `backend/routes/auth.ts` | Login, refresh, logout |
| `backend/routes/internal.ts` | Endpoint-uri pentru n8n (protejate cu INTERNAL_API_KEY) |
| `database/prisma/schema.prisma` | Schema bazei de date |
| `database/seed.ts` | Creare admin user + date inițiale |
| `scripts/setup-nginx.sh` | Instalare/configurare nginx idempotentă |
| `scripts/nginx-prod.conf` | Config nginx HTTP |
| `scripts/nginx-prod-ssl.conf` | Config nginx HTTPS (cu domeniu) |
| `.github/workflows/deploy-aws.yml` | Pipeline CI/CD automat |
