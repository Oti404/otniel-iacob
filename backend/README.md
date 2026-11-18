# Backend

Express 5 + TypeScript API. Runs via `ts-node --transpile-only` in prod.

## Stack
- Express 5, TypeScript, ts-node
- Prisma ORM (via `@monorepo/database`)
- Shared types + validators (via `@monorepo/shared`)
- bcrypt, jsonwebtoken, multer, zod, express-rate-limit, cloudinary, web-push

## Structure
```
index.ts                  Entry: secret checks, middleware, router mounting, error handler
lib/
  http-error.ts           HttpError + badRequest / notFound / serviceUnavailable
  request.ts              parseBody(schema, body), parseId(req, param)
middleware/
  auth.ts                 JWT authMiddleware → req.user
  subscriber.ts           getSubscriber(req) from the subscriber_token cookie
  error-handler.ts        The one place errors become HTTP responses
  media-upload.ts         Multer (memory) for Cloudinary uploads, 15 MB
services/
  adventures.ts           DTO mappers, date helper, best-effort Cloudinary cleanup
  cloudinary.ts           Upload / delete
  push.ts                 Web Push to subscribers
routes/
  content.ts              Public portfolio content
  chronicles.ts           Public adventures
  auth.ts                 Admin login / refresh / logout
  subscriber-auth.ts      Google OAuth for subscribers
  subscriptions.ts        Subscriber notification preferences
  push.ts                 Browser push registration
  admin/
    index.ts              JWT gate for everything below
    content.ts            CRUD: profile, projects, contributors, experience, hobbies, semesters, subjects
    chronicles.ts         Chronicles + cover upload + publish
    passages.ts           Passages + publish
    media.ts              Passage media (YouTube links, Cloudinary uploads)
    upload.ts             Local file upload (rate limited)
```

Express 5 forwards errors from async handlers to the global handler, so routes `throw` (`notFound('Chronicle')`, `parseBody` failures) instead of wrapping everything in try/catch.

## Routes overview
| Prefix | Auth | Purpose |
|--------|------|---------|
| `GET /api/health` | None | DB connectivity check |
| `GET /api/*` | None | Public portfolio content + published chronicles |
| `POST /api/auth/*` | None (rate limited) | Admin login, refresh, logout; Google OAuth |
| `/api/subscriptions/*`, `/api/push/*` | Subscriber cookie (rate limited) | Notification preferences |
| `/api/admin/*` | JWT Bearer | Admin CRUD + uploads |
| `GET /uploads/*` | None | Static uploaded files |

## Dev
```bash
npm run dev:backend        # ts-node
npm run typecheck --workspace=backend
npx prisma migrate dev     # create + apply migration
npx prisma generate        # regenerate Prisma client
npx prisma db seed         # admin user + content (content only into an empty DB)
```

## Required env vars
| Var | Notes |
|-----|-------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Min 32 chars — crashes on startup otherwise |
| `JWT_REFRESH_SECRET` | Min 32 chars — crashes on startup otherwise |
| `JWT_SUBSCRIBER_SECRET` | Min 32 chars, must differ from `JWT_SECRET` |
| `ADMIN_PASSWORD` | Used by the seed script |
| `ALLOWED_ORIGINS` | Comma-separated, e.g. `http://localhost:4200` |
| `PORT` | Default: 3000 |
| `UPLOADS_DIR` | Default: ./uploads |

Optional: `CLOUDINARY_*` (adventure media), `VAPID_*` (web push), `GOOGLE_*` (subscriber sign-in).

## Auth model
- Access token: JWT, 15 min, `Authorization: Bearer` header
- Refresh token: JWT, 7 days, httpOnly cookie (`sameSite: strict`, `secure` in prod), rotated on every refresh
- `AdminUser.tokenVersion` is embedded in the refresh token; logout increments it, revoking every outstanding refresh token
- Login compares against a dummy hash for unknown emails, so timing doesn't reveal which emails exist

## Security notes
- Body limit 10kb (200kb under `/api/admin` for long passages)
- `x-powered-by` disabled; global error handler, no stack traces
- Upload: MIME + extension whitelist together
- Push endpoints restricted to browser push services (no SSRF into the Docker network)
