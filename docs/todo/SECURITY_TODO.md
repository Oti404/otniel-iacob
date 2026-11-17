# Security Remediation TODOs

Audit efectuat: **2026-05-09** — scanare completă cod sursă, git history, nginx, Docker, n8n.

---

## COMPLETATE

### [x] 1. Extragerea Secretelor Hardcodate (DevOps)
Secrete hardcodate în `docker-compose.yml` extrase în GitHub Secrets. Pipeline-ul de deploy scrie `.env` pe EC2 exclusiv din secrets.

### [x] 2. Fixarea Versiunii Angular CLI (Coder)
Versiunea Angular CLI fixată în `.devcontainer/devcontainer.json`.

### [x] 3. Protecție startup la secrete lipsă (2026-05-09)
Backend crashează la boot dacă `JWT_SECRET`, `JWT_REFRESH_SECRET` sau `INTERNAL_API_KEY` lipsesc sau au sub 16 caractere.
**Fișier:** `backend/index.ts`

### [x] 4. Timing-safe comparison pentru Internal API Key (2026-05-09)
Înlocuit comparare directă (`===`) cu `crypto.timingSafeEqual` — previne timing attacks pe secretul intern.
**Fișier:** `backend/routes/internal.ts`

### [x] 5. Validare Zod pe toate rutele (2026-05-09)
Adăugată validare Zod pe `/api/internal/*` și `/api/admin/ai-chat` — anterior acceptau input arbitrar.
**Fișiere:** `backend/routes/internal.ts`, `backend/routes/ai-chat.ts`

### [x] 6. Upload: extension whitelist + rate limiting (2026-05-09)
- Whitelist extensii (`.jpg`, `.png`, `.pdf` etc.) aplicată împreună cu MIME type check
- Rate limiter: max 30 upload-uri/oră per IP
**Fișier:** `backend/routes/upload.ts`

### [x] 7. Prisma: protecție NaN în id() (2026-05-09)
`parseInt('abc')` returna NaN și ajungea în query Prisma. Aruncă eroare și returnează 400.
**Fișier:** `backend/routes/admin.ts`

### [x] 8. Global error handler (2026-05-09)
Excepții neprinse aruncau stack trace complet la client. Handler global adăugat la finalul `index.ts`.
**Fișier:** `backend/index.ts`

### [x] 9. db push --accept-data-loss eliminat (2026-05-09)
Înlocuit cu `prisma migrate deploy` în `Dockerfile.prod` — nu mai poate șterge date la restart.
**Fișier:** `backend/Dockerfile.prod`

### [x] 10. nginx security headers (2026-05-09)
`server_tokens off`, `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `HSTS` (pe HTTPS).
**Fișiere:** `scripts/nginx-prod.conf`, `scripts/nginx-prod-ssl.conf`

---

---

## AUDIT 2026-06-16 — COMPLETATE

See full report: `docs/security/SECURITY-AUDIT-2026-06-16.md`

### [x] C1. Admin auth bypass via shared JWT secret — FIXED 2026-06-16
Subscriber (Google OAuth) tokens signed with a separate `JWT_SUBSCRIBER_SECRET`. Both token types carry an explicit `type` claim (`'admin'`/`'subscriber'`) checked on verify. Startup crashes if `JWT_SUBSCRIBER_SECRET` is missing, short, or equal to `JWT_SECRET`.

### [x] H1. Dependency vulnerabilities (7 high / 3 moderate) — FIXED 2026-06-16
`npm audit fix` run; Angular 21 patched packages, `qs`, `express-rate-limit` → `ip-address` all updated.

### [x] H2. Google OAuth login-CSRF — no `state` parameter — FIXED 2026-06-16
CSRF state nonce now generated at `/api/auth/google`, stored in `httpOnly` cookie (`sameSite: lax`), validated in callback before processing code exchange.

### [x] M1. AI-chat proxy no rate limit — FIXED 2026-06-16
Rate limiter added: 20 requests / 5 min on `/api/admin/ai-chat`.

### [x] M2. Subscriber-auth routes not rate-limited — FIXED 2026-06-16
Separate `subscriberLimiter` (100 req / 15 min) applied to subscriber-auth router.

### [x] M3. SVG uploads allowed (stored XSS) — FIXED 2026-06-16
SVG removed from MIME and extension whitelist in `backend/routes/upload.ts`.

### [x] M4. Shared rate-limit budget for login + refresh — FIXED 2026-06-16
Budgets split: `loginLimiter` (10 / 15 min) on `/login`, `refreshLimiter` (60 / 15 min) on `/refresh`.

### [x] L2. subscriptions DELETE NaN guard — FIXED 2026-06-16
`Number.isInteger(id) && id >= 1` check added in `routes/subscriptions.ts`.

### [x] L3. YouTube embed trust bypass — FIXED 2026-06-16
Video ID validated against `^[A-Za-z0-9_-]{11}$` before `bypassSecurityTrustResourceUrl`.

### [x] L6. Divergent auth error messages — FIXED 2026-06-16
`/api/auth/refresh` error messages normalized (no user enumeration).

---

## CRITICE — DE REZOLVAT IMEDIAT

### [x] 11. INTERNAL_API_KEY hardcodat în workflow n8n (CRITICAL) — rezolvat 2026-05-09
**Fișier:** `n8n/workflows/program.json` — liniile 26-28 și 106-108
**Problema:** Cheia internă `a94791dc64...` este hardcodată în JSON-ul workflow-ului, care e comis public pe GitHub. nginx expune `/api/internal/` publicului prin blocul `location /api/`, deci oricine poate citi cheia din GitHub și o poate folosi direct.

**Soluție:**
1. Rotește `INTERNAL_API_KEY` — generează una nouă cu `openssl rand -hex 64`
2. Actualizează GitHub Secrets și `.env` pe server
3. În n8n workflow, înlocuiește cheia hardcodată cu o variabilă de mediu n8n (`{{ $env.INTERNAL_API_KEY }}`)
4. Adaugă `N8N_CUSTOM_EXTENSIONS_URL` și variabilele de mediu n8n în `docker-compose.prod.yml`
5. **SAU** blochează `/api/internal/` în nginx (recomandat — nu trebuie să fie accesibil public):
```nginx
location /api/internal/ {
    deny all;
    return 403;
}
```

### [x] 12. Rotire credențiale (acțiune manuală) — rezolvat 2026-05-09
`INTERNAL_API_KEY` rotită cu `openssl rand -hex 64`. Actualizată în GitHub Secrets, `.env` pe server (prin deploy automat), workflow n8n (manual în UI + în `program.json`).

---

## ÎNALTĂ PRIORITATE

### [x] 13. Blochează `/api/internal/` în nginx — rezolvat 2026-05-09
**Fișier:** `scripts/nginx-prod.conf` și `scripts/nginx-prod-ssl.conf`
**Problema:** Blocul `location /api/` proxy-iază tot, inclusiv `/api/internal/`. Rutele interne sunt destinate exclusiv rețelei Docker (n8n → backend), nu internetului public.

**Soluție:** Adaugă înaintea blocului `/api/`:
```nginx
location /api/internal/ {
    deny all;
    return 403;
}
```

### [x] 14. Content-Security-Policy header lipsă — rezolvat 2026-05-09
**Fișier:** `scripts/nginx-prod.conf` și `scripts/nginx-prod-ssl.conf`
**Problema:** Fără CSP, un XSS ar putea încărca JavaScript extern și exfiltra token-ul JWT din admin panel.

**Soluție:**
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

### [ ] 15. Rate limiting lipsă pe rutele admin (DELETE/PUT/POST)
**Fișier:** `backend/routes/admin.ts`
**Problema:** Un atacator cu JWT valid poate șterge tot conținutul (8 proiecte cu 8 requesturi) fără nicio limitare.

**Soluție:** Adaugă rate limiter pe router-ul admin:
```typescript
import rateLimit from 'express-rate-limit';
const adminMutateLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
router.use(['POST', 'PUT', 'DELETE'], adminMutateLimiter);
```

### [ ] 16. Mărește minimul JWT secret la 32 de caractere
**Fișier:** `backend/index.ts` linia 22
**Problema:** Validarea actuală acceptă secrete de minim 16 caractere — sub standardul de industrie.

**Soluție:** Schimbă `< 16` în `< 32`:
```typescript
if (!process.env[key] || process.env[key]!.length < 32) {
```

### [ ] 17. SVG upload poate conține JavaScript (XSS stored)
**Fișier:** `backend/routes/upload.ts`
**Problema:** `.svg` e în whitelist, dar SVG-urile pot conține `<script>` tags. Dacă un SVG malițios e servit direct din `/uploads/`, browser-ul îl execută.

**Soluție (variante):**
- Elimină `.svg` din whitelist
- SAU adaugă header `Content-Disposition: attachment` pentru SVG în nginx
- SAU sanitizează SVG-ul cu `DOMPurify` la upload

### [ ] 18. Refresh token rotation lipsă
**Fișier:** `backend/routes/auth.ts`
**Problema:** Același refresh token e valid 7 zile fără a fi reînnoit. Dacă e furat, atacatorul are acces 7 zile.

**Soluție:** La fiecare `/api/auth/refresh`, emite un nou refresh token și invalidează-l pe cel vechi (simplu: scurtează expiry-ul la 1 zi și emite unul nou la fiecare call).

### [ ] 19. JWT middleware nu verifică dacă userul mai există în DB
**Fișier:** `backend/middleware/auth.ts` linia 26
**Problema:** Token-ul e verificat criptografic, dar nu se verifică dacă userul mai există în baza de date. Dacă adminul e șters, token-ul lui mai e valid 15 minute.

**Soluție** (simplu, pentru un singur admin): Adaugă lookup rapid în middleware:
```typescript
const user = await prisma.adminUser.findUnique({ where: { id: payload.sub }, select: { id: true } });
if (!user) { res.status(401).json({ message: 'Unauthorized' }); return; }
```

### [ ] 20. Audit logging pentru operații admin
**Fișier:** `backend/routes/admin.ts`
**Problema:** Nicio înregistrare a cine a șters/modificat ce și când. Nu există posibilitate de investigare sau restaurare.

**Soluție minimă:** `console.log('[ADMIN]', req.user?.email, req.method, req.path)` pe toate mutațiile. Soluție completă: tabelă `AuditLog` în Prisma.

---

## MEDIE PRIORITATE

### [x] 21. HSTS preload directive — rezolvat 2026-05-09
**Fișier:** `scripts/nginx-prod-ssl.conf`
**Problema:** Header-ul HSTS există dar fără `preload`.

**Soluție:**
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```
Necesită și înregistrare la https://hstspreload.org după ce domeniul e confirmat.

### [ ] 22. robots.txt lipsă
**Problema:** Motoarele de căutare pot indexa `/admin`, `/api/`, `/uploads/`.

**Soluție:** Adaugă `frontend/src/robots.txt`:
```
User-agent: *
Disallow: /admin
Disallow: /api/
Disallow: /uploads/
Allow: /
```
Și referință în `angular.json` la assets.

### [ ] 23. Rotire credențiale n8n după adăugare domeniu
Când site-ul va primi un domeniu și HTTPS, re-exportă workflow-ul din n8n și actualizează `n8n/workflows/program.json` cu versiunea publicată (fără chei hardcodate).

### [ ] 24. Migrare la AWS Secrets Manager (viitor)
Secretele sunt acum în GitHub Secrets (acceptabil pentru single-admin portfolio). La orice migrare pe ECS Fargate, trebuie mutate în AWS Secrets Manager.

### [ ] 25. E2E tests pentru fluxuri critice (viitor)
Login, creare proiect, upload fișier — niciun test automat nu acoperă aceste fluxuri.

---

## SCĂZUTĂ PRIORITATE

### [ ] 26. Request ID tracing
Fiecare request ar trebui să aibă un UUID unic care să apară în toate log-urile — util pentru debugging în producție.

### [ ] 27. Structured logging
Înlocuiește `console.log/error` cu un logger structurat (ex: `pino`) care emite JSON — mai ușor de parserizat și monitorizat.

### [ ] 28. Soft deletes
Operațiile de DELETE șterg permanent. Adaugă câmp `deletedAt` pe modele critice (Project, Experience) pentru posibilitate de restaurare.

---

## REZUMAT AUDIT 2026-05-09

| Severitate | Număr | Rezolvate | Rămase |
|------------|-------|-----------|--------|
| CRITICAL | 2 | 2 ✓ | 0 |
| HIGH | 7 | 2 ✓ (CSP + /internal/ blocat) | 5 |
| Medium | 5 | 1 ✓ (HSTS preload) | 4 |
| Low | 3 | 0 | 3 |
| **Total completate** | — | **15** | — |

**Rezolvate în sesiunea 2026-05-09:**
- INTERNAL_API_KEY rotită + actualizată peste tot (GitHub Secrets, server, n8n UI, program.json)
- `/api/internal/` blocat în nginx — 403 pentru orice request public
- CSP + Permissions-Policy adăugate în ambele configs nginx
- `always` adăugat la toate headerele de securitate nginx (se aplică și pe răspunsuri de eroare)
- HSTS upgradat cu directiva `preload`

**Nota:** `.env`-ul local NU este comis în git — `.gitignore` funcționează corect. Secretele de producție sunt exclusiv în GitHub Secrets și pe server.

---

## REZUMAT AUDIT 2026-06-16

See full report: `docs/security/SECURITY-AUDIT-2026-06-16.md`

| ID | Severity | Title | Status |
|----|----------|-------|--------|
| C1 | CRITICAL | Admin auth bypass — subscriber token replayable as admin | ✅ FIXED |
| H1 | HIGH | Dependency vulnerabilities (7 high / 3 moderate) | ✅ FIXED |
| H2 | HIGH | Google OAuth login-CSRF — no `state` parameter | ✅ FIXED |
| M1 | MEDIUM | AI-chat proxy has no rate limit | ✅ FIXED |
| M2 | MEDIUM | Subscriber-auth routes not rate-limited | ✅ FIXED |
| M3 | MEDIUM | SVG uploads allowed (stored XSS) | ✅ FIXED |
| M4 | MEDIUM | Shared rate-limit budget for login + refresh | ✅ FIXED |
| L1 | LOW | `/api/health` discloses DB connectivity state | Open (accepted) |
| L2 | LOW | `subscriptions` DELETE doesn't guard NaN id | ✅ FIXED |
| L3 | LOW | YouTube embed via `bypassSecurityTrustResourceUrl` + weak regex | ✅ FIXED |
| L4 | LOW | No SRI on external CDN CSS | Open |
| L5 | LOW | Subscriber JWT lives 30 days, no rotation/revocation | Open (accepted) |
| L6 | LOW | Auth error messages differ | ✅ FIXED |
