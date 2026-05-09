# Security Remediation TODOs

---

## [x] 1. Extragerea Secretelor Hardcodate (DevOps)
Secrete hardcodate în `docker-compose.yml` extrase în GitHub Secrets. Pipeline-ul de deploy scrie `.env` pe EC2 exclusiv din secrets.

## [x] 2. Fixarea Versiunii Angular CLI (Coder)
Versiunea Angular CLI fixată în `.devcontainer/devcontainer.json`.

## [x] 3. Protecție startup la secrete lipsă (2026-05-09)
Backend crashează la boot dacă `JWT_SECRET`, `JWT_REFRESH_SECRET` sau `INTERNAL_API_KEY` lipsesc sau au sub 16 caractere.  
**Fișier:** `backend/index.ts`

## [x] 4. Timing-safe comparison pentru Internal API Key (2026-05-09)
Înlocuit comparare directă (`===`) cu `crypto.timingSafeEqual` — previne timing attacks pe secretul intern.  
**Fișier:** `backend/routes/internal.ts`

## [x] 5. Validare Zod pe toate rutele (2026-05-09)
Adăugată validare Zod pe `/api/internal/*` și `/api/admin/ai-chat` — anterior acceptau input arbitrar.  
**Fișiere:** `backend/routes/internal.ts`, `backend/routes/ai-chat.ts`

## [x] 6. Upload: extension whitelist + rate limiting (2026-05-09)
- Whitelist extensii (`.jpg`, `.png`, `.pdf` etc.) aplicată împreună cu MIME type check — fișier `.exe` cu MIME `image/png` nu mai trece
- Rate limiter: max 30 upload-uri/oră per IP  
**Fișier:** `backend/routes/upload.ts`

## [x] 7. Prisma: protecție NaN în id() (2026-05-09)
`parseInt('abc')` returna NaN și ajungea în query Prisma. Acum aruncă eroare și returnează 400.  
**Fișier:** `backend/routes/admin.ts`

## [x] 8. Global error handler (2026-05-09)
Excepții neprins aruncau stack trace complet la client. Handler global adăugat la finalul `index.ts`.  
**Fișier:** `backend/index.ts`

## [x] 9. db push --accept-data-loss eliminat (2026-05-09)
Înlocuit cu `prisma migrate deploy` în `Dockerfile.prod` — nu mai poate șterge date la restart.  
**Fișier:** `backend/Dockerfile.prod`

## [x] 10. nginx security headers (2026-05-09)
`server_tokens off`, `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `HSTS` (pe HTTPS).  
**Fișiere:** `scripts/nginx-prod.conf`, `scripts/nginx-prod-ssl.conf`

---

## [ ] 11. Rotire credențiale (acțiune manuală necesară)
Credențialele din `.env`-ul local trebuie rotate dacă au circulat în afara mașinii locale:
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — `openssl rand -hex 32`
- `ADMIN_PASSWORD`
- `INTERNAL_API_KEY` — `openssl rand -hex 32`
- `PORTFOLIO_N8N_PROJECT_INTAKE` (Google API key) — regenerare din Google Cloud Console

## [ ] 12. Migrare la AWS Secrets Manager (viitor)
Secretele sunt acum în GitHub Secrets (acceptabil). La migrare pe ECS Fargate, trebuie mutate în AWS Secrets Manager.

## [ ] 13. E2E tests pentru fluxuri critice (viitor)
Login, creare proiect, upload fișier — niciun test automat nu acoperă aceste fluxuri.
