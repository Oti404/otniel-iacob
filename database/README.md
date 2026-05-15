# Database

Prisma ORM + PostgreSQL. Exports the `prisma` singleton used by the backend.

## Structure
```
index.ts              Exports prisma singleton + all @prisma/client types
prisma/
  schema.prisma       Data model (source of truth)
  migrations/         Auto-generated migration history
seed.ts               Seeds admin user, profile, hobbies, projects, experience, semesters/subjects
```

## Models
| Model | Key fields | Notes |
|-------|-----------|-------|
| `AdminUser` | email (unique), passwordHash | Single admin; bcrypt hash at cost 12 |
| `Profile` | name, role, description, photo, avatar, cvPdf, linkedin, github | Always id=1, upsert pattern |
| `Project` | name, tech, status, display, order, date | `display:false` = hidden from public API |
| `Contributor` | name, link? | M:M with Project via ProjectContributor |
| `ProjectContributor` | projectId, contributorId | Join table, cascade delete both sides |
| `Experience` | company, role, type, startDate, description (JSON array) | type: job/education/event |
| `Semester` | id (string e.g. "sem1"), name, order | String PK (not autoincrement) |
| `Subject` | code (unique), name, credits, passed, docPath?, semesterId | Belongs to Semester |
| `Hobby` | name, description, icon, link, order | — |

## Commands
```bash
npx prisma migrate dev --name <migration-name>   # create + apply migration (dev)
npx prisma migrate deploy                         # apply migrations in prod
npx prisma generate                               # regenerate Prisma client after schema changes
npx prisma db seed                                # run seed.ts
npx prisma studio                                 # visual DB browser (local only)
```

## Env vars
| Var | Example |
|-----|---------|
| `DATABASE_URL` | `postgresql://admin:<pass>@localhost:5433/portfoliodb` (dev) |
| `DATABASE_URL` | `postgresql://admin:<pass>@postgres:5432/monorepodb` (prod, via docker network) |
| `ADMIN_PASSWORD` | Required by seed.ts |

## Notes
- Never use `prisma db push` in prod — always `prisma migrate deploy` (safe, tracks history)
- `Semester.id` is a string (e.g. `sem1`, `sem2`) — not autoincrement
- `Experience.description` is stored as JSON array of strings
- Deleting a Semester cascades to all its Subjects

## Dev vs Prod database separation
In dev, n8n and the portfolio backend share the same PostgreSQL container but use **different databases**:
- `monorepodb` — used by n8n (all n8n internal tables)
- `portfoliodb` — used by the portfolio backend (Prisma-managed tables only)

This separation is required because Prisma detects n8n tables as "drift" and blocks migrations if both apps share the same database.

In prod, the backend container uses `monorepodb` via the internal docker network (`postgres:5432`). n8n in prod uses its own data directory and doesn't conflict.
