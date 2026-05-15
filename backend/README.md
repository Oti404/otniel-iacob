# Backend

Express + TypeScript API. Runs via `ts-node --transpile-only` in prod.

## Stack
- Express 4, TypeScript, ts-node
- Prisma ORM (via `@monorepo/database`)
- Shared types + validators (via `@monorepo/shared`)
- bcrypt, jsonwebtoken, multer, zod, express-rate-limit

## Structure
```
index.ts              App entry, middleware setup, router mounting
middleware/
  auth.ts             JWT authMiddleware → req.user
routes/
  content.ts          Public GET endpoints (no auth)
  auth.ts             Login / refresh / logout
  admin.ts            JWT-protected CRUD for all entities
  upload.ts           File upload (JWT + rate limited)
  internal.ts         n8n internal API (x-internal-key)
  ai-chat.ts          n8n chat proxy (JWT)
```

## Routes overview
| Prefix | Auth | Purpose |
|--------|------|---------|
| `GET /api/health` | None | DB connectivity check |
| `GET /api/*` | None | Public portfolio content |
| `POST /api/auth/*` | None (rate limited) | Login, refresh, logout |
| `/api/admin/*` | JWT Bearer | Admin CRUD + upload + AI chat |
| `/api/internal/*` | x-internal-key | n8n automation API |
| `GET /uploads/*` | None | Static uploaded files |

## Dev
```bash
npm run dev:backend        # ts-node with watch
npx prisma migrate dev     # create + apply migration
npx prisma generate        # regenerate Prisma client
npx prisma db seed         # seed admin user + content
```

## Required env vars
| Var | Notes |
|-----|-------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Min 16 chars — crashes on startup if missing |
| `JWT_REFRESH_SECRET` | Min 16 chars — crashes on startup if missing |
| `INTERNAL_API_KEY` | Min 16 chars — crashes on startup if missing |
| `ADMIN_PASSWORD` | Used by seed script |
| `ALLOWED_ORIGINS` | Comma-separated, e.g. `http://localhost:4200` |
| `N8N_CHAT_WEBHOOK_URL` | Full URL to n8n chat webhook |
| `PORT` | Default: 3000 |
| `UPLOADS_DIR` | Default: ./uploads |

## Auth model
- Access token: JWT, 15min, sent in `Authorization: Bearer` header
- Refresh token: JWT, 7 days, httpOnly cookie (`sameSite: strict`, `secure` in prod)
- On 401: Angular interceptor calls `/api/auth/refresh` automatically
- `/api/auth/refresh` re-fetches user from DB — detects deleted accounts

## Security notes
- Body limit: 10kb
- `x-powered-by` disabled
- Global error handler — no stack traces to client
- `id()` helper throws on NaN/negative IDs before they reach Prisma
- Upload: MIME + extension whitelist together (not just one)
- Internal API key: `crypto.timingSafeEqual` prevents timing attacks
