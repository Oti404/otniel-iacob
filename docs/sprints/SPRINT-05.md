# SPRINT-05 — n8n AI Chat Fix + Security Audit & Hardening

**Status:** Completat  
**Data:** 2026-05-09  
**Scop:** Debugging modul AI chat, audit securitate complet, remediere vulnerabilități critice

---

## Obiective

1. Debuggare și fixare modul AI chat (n8n integration)
2. Audit de securitate complet (cod, git, nginx, Docker, n8n)
3. Remediere vulnerabilități critice și înaltă prioritate
4. Actualizare documentație la starea reală a proiectului

---

## Probleme rezolvate

### AI Chat (n8n)

| Problemă | Cauza | Fix |
|---|---|---|
| 400 Bad Request pe `/api/admin/ai-chat` | Frontend genera session ID cu `Math.random()`, backend cerea UUID strict | Backend relaxat la `z.string().min(1).max(100)`, frontend schimbat la `crypto.randomUUID()` |
| `crypto.randomUUID is not a function` | Funcția necesită secure context (HTTPS) — site-ul e pe HTTP | Adăugat fallback Math.random UUID v4 când `crypto.randomUUID` nu e disponibil |
| 502 Bad Gateway pe ai-chat | Workflow n8n în stare Draft — webhook-ul de producție nu era înregistrat | Publicat workflow-ul în n8n UI (Publish, nu Save) |
| 500 Error in workflow | Credențialele n8n (Google Gemini, Postgres) nu existau pe server — ID-urile erau din instanța locală | Recreate credențialele manual în n8n UI pe server |

### Securitate

| Vulnerabilitate | Severitate | Fix |
|---|---|---|
| `INTERNAL_API_KEY` hardcodat în `program.json` (public pe GitHub) | CRITICAL | Cheie rotită, actualizată în GitHub Secrets + server + n8n UI |
| `/api/internal/` expus public prin nginx | CRITICAL | Blocat cu `deny all; return 403;` în ambele nginx configs |
| Lipsă Content-Security-Policy | HIGH | Adăugat CSP + Permissions-Policy în ambele nginx configs |
| Headere security fără `always` | MEDIUM | Adăugat `always` — se aplică și pe răspunsuri de eroare |
| HSTS fără `preload` | LOW | Adăugat `preload` la Strict-Transport-Security |

---

## Fișiere modificate

| Fișier | Modificare |
|---|---|
| `frontend/src/app/admin/pages/ai-assistant/ai-assistant.component.ts` | Fallback UUID v4 pentru HTTP |
| `scripts/nginx-prod.conf` | Bloc `/api/internal/` + CSP + Permissions-Policy + `always` pe headere |
| `scripts/nginx-prod-ssl.conf` | Idem + HSTS preload |
| `n8n/workflows/program.json` | Cheie internă rotită |
| `docker-compose.prod.yml` | Eliminat câmpul `version` obsolet |
| `docs/learning/PROBLEME.md` | Adăugate probleme 9-19 din această sesiune |
| `docs/todo/SECURITY_TODO.md` | Audit complet + marcare itemi rezolvați |
| `docs/DEVELOPMENT.md` | Rescris complet |
| `docs/learning/DEPLOY_AWS.md` | Corectat CMD Dockerfile, trigger automat |
| `docs/infrastructure/AWS_DEPLOYMENT.md` | Actualizat la arhitectura reală |
| `docs/OPERATIONS.md` | Corectat ordinea pașilor în deploy |

---

## Starea la finalul sprintului

- AI chat funcțional end-to-end (frontend → backend → n8n → Gemini → răspuns)
- `/api/internal/` blocat public — accesibil doar din rețeaua Docker
- CSP și Permissions-Policy active pe toate răspunsurile nginx
- INTERNAL_API_KEY rotită — cheia veche din git history nu mai e validă
- Documentație actualizată la starea reală a proiectului
- 15 din 28 itemi de securitate rezolvați

---

## Itemi de securitate rămași (vezi SECURITY_TODO.md)

- `[ ] 15` Rate limiting pe admin DELETE/PUT/POST
- `[ ] 16` JWT secret minim 32 chars
- `[ ] 17` SVG upload XSS
- `[ ] 18` Refresh token rotation
- `[ ] 19` JWT verifică existența userului în DB
