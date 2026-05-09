# SPRINT-04 — Security Hardening & Production Deployment

**Status:** Completed  
**Data:** 2026-05-09  
**Scop:** Audit de securitate complet + fixarea problemelor critice + infrastructură de deployment automatizat cu nginx

---

## Obiective

1. Inspecție completă a proiectului (cod, infra, securitate, CI/CD)
2. Remediere toate problemele critice identificate
3. Nginx always-on cu upgrade automat la HTTPS când domeniu e disponibil
4. Deployment automat la fiecare push pe `main`

---

## Probleme identificate și rezolvate

### Deployment / Infra

| Problemă | Fix | Fișier |
|---|---|---|
| `db push --accept-data-loss` în prod | `migrate deploy` | `backend/Dockerfile.prod` |
| `npm run dev:backend` în prod | `ts-node --transpile-only` | `backend/Dockerfile.prod` |
| nginx fără proxy pentru `/api/` | Adăugat blocuri `/api/` și `/uploads/` | `scripts/nginx-prod.conf` |
| nginx nu era instalat automat | `scripts/setup-nginx.sh` creat | nou fișier |
| Deploy manual (workflow_dispatch) | Trigger pe `push: main` | `.github/workflows/deploy-aws.yml` |
| Niciun health check după deploy | `curl localhost:3000/api/health` la final | `.github/workflows/deploy-aws.yml` |
| `.env.example` incomplet (lipseau 7 variabile) | Actualizat cu toate variabilele + descripții | `.env.example` |

### Backend Security

| Problemă | Fix | Fișier |
|---|---|---|
| Nicio validare la startup dacă JWT_SECRET lipsește | Crash la boot dacă secrete lipsesc sau < 16 chars | `backend/index.ts` |
| `express.json()` fără limită | `{ limit: '10kb' }` | `backend/index.ts` |
| `x-powered-by: Express` expus | `app.disable('x-powered-by')` | `backend/index.ts` |
| Fără global error handler | Handler adăugat — nu mai ajung stack traces la client | `backend/index.ts` |
| Comparare API key vulnerabilă la timing attack | `crypto.timingSafeEqual` | `backend/routes/internal.ts` |
| POST /internal/* fără Zod | Scheme Zod adăugate pentru contributors și projects | `backend/routes/internal.ts` |
| `/admin/ai-chat` fără validare input | Zod: message max 5000 chars, sessionId UUID | `backend/routes/ai-chat.ts` |
| `parseInt` în `id()` poate returna NaN → Prisma crash | Aruncă eroare dacă NaN sau < 1 | `backend/routes/admin.ts` |
| Upload: doar MIME check (spoofabil) | Whitelist extensii + MIME împreună | `backend/routes/upload.ts` |
| Upload: fără rate limiting | 30 upload/oră per IP | `backend/routes/upload.ts` |
| `/refresh` nu includea email în noul access token | Fetch user din DB la refresh, detectează useri șterși | `backend/routes/auth.ts` |

---

## Infrastructură nginx

### Fișiere noi
- `scripts/setup-nginx.sh` — instalare idempotentă nginx + certbot
- `scripts/nginx-prod-ssl.conf` — config HTTPS complet (HTTP→HTTPS redirect, HSTS, proxies)

### Logica de upgrade automată

```
setup-nginx.sh '' ''          → HTTP-only (fără domeniu, pe IP direct)
setup-nginx.sh 'portofoliu.ro' 'email@gmail.com'  → certbot → HTTPS automat
```

Upgrade la HTTPS se face adăugând două GitHub Secrets (`EC2_DOMAIN`, `CERTBOT_EMAIL`) — la next push totul se configurează singur.

### Security headers în nginx (HTTP + HTTPS)
- `server_tokens off`
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` (doar pe HTTPS)
- Gzip activat

---

## Ce NU s-a fixat (intenționat)

| Item | Motiv skip |
|---|---|
| Role-based authorization | Un singur admin; `authMiddleware` e suficient |
| CSRF tokens | `sameSite: strict` + Bearer token acoperă scenariile relevante |
| File magic bytes verification | Extension + MIME whitelist e suficient pentru un portfolio personal |
| Helmet.js | nginx setează deja toate headerele de securitate |
| Audit logging | Nu e necesar la această scală |

---

## GitHub Secrets necesare

| Secret | Descriere |
|---|---|
| `EC2_SSH_KEY` | Cheia privată `.pem` pentru SSH |
| `EC2_USERNAME` | ex: `ubuntu` |
| `EC2_HOST` | IP-ul EC2, ex: `13.60.216.226` |
| `POSTGRES_USER` | User PostgreSQL |
| `POSTGRES_PASSWORD` | Parolă PostgreSQL |
| `POSTGRES_DB` | Nume bază de date |
| `JWT_SECRET` | Min 16 chars (recomandat 64) |
| `JWT_REFRESH_SECRET` | Min 16 chars (recomandat 64) |
| `ADMIN_PASSWORD` | Parola adminului |
| `ALLOWED_ORIGINS` | ex: `http://13.60.216.226` |
| `INTERNAL_API_KEY` | Min 16 chars — pentru n8n |
| `N8N_WEBHOOK_ID` | UUID-ul webhook-ului n8n chat |
| `EC2_DOMAIN` *(opțional)* | Declanșează SSL când e setat |
| `CERTBOT_EMAIL` *(opțional)* | Necesar împreună cu `EC2_DOMAIN` |

---

## Starea la finalul sprintului

- Site live la `http://13.60.216.226`
- nginx rulează, proxy activ pentru `/api/` și `/uploads/`
- Deploy automat la fiecare push pe `main`
- Backend securizat contra principalelor vectori de atac
- SSL ready — se activează automat când se adaugă domeniu
