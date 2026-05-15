# Shared

Single source of truth for TypeScript types and Zod validators. Used by both `backend` and `frontend`.

> **Rule:** All new types go here first. Never define entity interfaces inline in backend routes or Angular components.

## Exports

### `index.ts` — Interfaces
| Export | Description |
|--------|-------------|
| `HealthStatus` | API health check response shape |
| `LoginRequest` | `{ email, password }` |
| `AuthTokens` | `{ accessToken }` |
| `Profile` | Full profile entity |
| `Project` | Project entity (includes `contributors`, `status`, `display`) |
| `Contributor` | `{ id, name, link? }` |
| `ProjectStatus` | `'completed' \| 'wip' \| 'archived'` |
| `Experience` | Experience entity (`type`: job/education/event) |
| `ExperienceType` | `'job' \| 'education' \| 'event'` |
| `Semester` | Semester with nested `subjects[]` |
| `Subject` | Academic subject with `code`, `credits`, `passed`, `docPath?` |
| `Hobby` | Hobby entity |
| `ApiResponse<T>` | Standard envelope: `{ data: T, message?: string }` |

### `schemas.ts` — Zod validators
| Export | Validates |
|--------|-----------|
| `loginSchema` | email + password min 8 |
| `profileSchema` | Full profile upsert |
| `projectSchema` | Project create/update |
| `contributorEntitySchema` | `{ name, link? }` |
| `experienceSchema` | Experience create/update |
| `semesterSchema` | `{ id, name, order }` |
| `subjectSchema` | Subject create/update |
| `hobbySchema` | Hobby create/update |

## Build
```bash
npm run build:shared   # compiles to dist/, required before backend/frontend builds
```
