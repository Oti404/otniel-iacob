# Arhitectura Proiectului — Portfolio Personal

## Ce este acest proiect?

Un site de portofoliu personal cu două părți:
- **Site public** — ce vede orice vizitator
- **Panou de administrare** — unde tu gestionezi conținutul (proiecte, experiență, etc.)

---

## Structura Monorepo

Proiectul este organizat ca un **monorepo** — un singur repository Git care conține mai multe aplicații separate care lucrează împreună.

```
portofoliu-personal-website/
├── frontend/        → aplicația Angular (site public + admin)
├── backend/         → serverul Express (API)
├── database/        → schema Prisma + seed
├── shared/          → tipuri TypeScript comune între frontend și backend
├── docs/            → documentație
├── docker-compose.yml          → pentru dezvoltare locală
└── docker-compose.prod.yml     → pentru producție (AWS EC2)
```

**De ce monorepo?** Ca să poți partaja tipuri TypeScript între frontend și backend fără să le duplici. De exemplu, dacă schimbi structura unui proiect în backend, TypeScript îți va arăta eroare și în frontend dacă nu actualizezi și acolo.

---

## Stiva Tehnologică

### Frontend — Angular 21
- Framework JavaScript pentru interfețe web
- Componentele sunt standalone (fără NgModule)
- Lazy loading pentru paginile de admin — se încarcă doar când e nevoie
- HttpClient pentru comunicarea cu backend-ul
- Rutare cu guards (pagina de admin e protejată cu JWT)

### Backend — Express (Node.js)
- Server HTTP care expune un API REST
- Autentificare prin JWT (JSON Web Tokens)
- Middleware de autentificare pe rutele de admin
- Proxy spre n8n pentru chat-ul AI

### Baza de date — PostgreSQL + Prisma
- **PostgreSQL** = baza de date relațională
- **Prisma** = ORM (Object-Relational Mapper) — îți permite să scrii cod TypeScript în loc de SQL
- Schema e definită în `database/prisma/schema.prisma`
- `prisma db push` — sincronizează schema cu baza de date
- `prisma db seed` — populează baza de date cu date inițiale

### n8n
- Platformă de automatizare vizuală (ca IFTTT dar mult mai puternică)
- Rulează ca un container Docker separat
- Gestionează conversația AI pentru intake-ul proiectelor
- Conectată la baza de date PostgreSQL pentru memorie conversațională

### Docker
- Fiecare aplicație rulează într-un **container** izolat
- Containerele comunică printr-o rețea internă Docker (`monorepo-net`)
- Datele persistente (baza de date, fișiere n8n) sunt stocate în **volume**

---

## Fluxul de Date

### Vizitator accesează site-ul
```
Browser → nginx (port 80) → fișiere Angular statice
Browser → nginx → /api/* → Backend Express (port 3000) → PostgreSQL
```

### Admin trimite un mesaj în chat-ul AI
```
Angular → POST /api/admin/ai-chat (cu JWT)
  → Backend Express (validează JWT)
    → POST http://n8n:5678/webhook/.../chat
      → n8n: Chat Trigger → AI Agent (Gemini) → IF → răspuns
    ← Backend primește răspunsul
  ← Angular afișează răspunsul
```

### n8n publică un proiect (pe CONFIRM)
```
n8n → POST http://backend:3000/api/internal/projects (cu x-internal-key)
  → Backend Express (validează internal key)
    → Prisma → PostgreSQL (inserează proiectul)
```

---

## Autentificare — Două Sisteme

### 1. JWT (pentru Angular → Backend)
- La login, backend-ul generează un **access token** (scurt, 15 min) și un **refresh token** (lung, 7 zile)
- Angular trimite access token-ul în header la fiecare request: `Authorization: Bearer <token>`
- Dacă token-ul expiră, Angular face automat refresh prin interceptor

### 2. Internal API Key (pentru n8n → Backend)
- n8n nu poate folosi JWT (nu are sesiune de browser)
- În schimb, backend-ul are un endpoint `/api/internal/` protejat cu un header secret: `x-internal-key: <cheie>`
- Cheia e stocată în `.env` și nu e niciodată expusă în browser

---

## De ce Backend-ul Proxiază n8n?

Angular rulează în browser. Dacă Angular ar apela direct n8n, URL-ul webhook-ului ar fi vizibil în rețea (oricine ar putea trimite mesaje AI fără autentificare).

Soluția: Angular → Backend (JWT) → n8n (internal key)

Browser-ul nu vede niciodată URL-ul n8n.

---

## Environments

| Variabilă | Local | Producție (AWS) |
|---|---|---|
| Backend URL | `http://localhost:3000` | `http://backend:3000` (intern Docker) |
| n8n URL | `http://localhost:5678` | `http://n8n:5678` (intern Docker) |
| n8n webhook URL | `http://n8n:5678/webhook/...` | `http://n8n:5678/webhook/...` |
| Site public | `http://localhost:80` | `http://13.60.216.226` |

Pe producție, portul 5678 (n8n) e legat doar la `127.0.0.1` — nu e accesibil public. Îl accesezi prin SSH tunnel.
