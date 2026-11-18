# SPRINT-06 — Adventures Feature + Security Audit 2026-06-16

**Status:** Completat  
**Data:** 2026-06-13 → 2026-06-18  
**Scop:** Implementare completă a feature-ului Adventures (Chronicle/Passage/Media + Google OAuth + Web Push) + security audit complet (C1-M4 fixate)

---

## Obiective

1. Implementare Adventures feature — toate cele 7 faze
2. Security audit complet al stack-ului extins (inclusiv Google OAuth, Web Push, Cloudinary)
3. Remediere vulnerabilități critice și înalte din audit
4. UI polish — carousel swipe, polaroid neon, cover parallax, fix dată/ordine pasaje

---

## Adventures Feature — Faze implementate

### Faza 1 — DB Foundation ✅ (2026-06-13)
- Modele Prisma: `Chronicle`, `Passage`, `PassageMedia`, `GoogleSubscriber`, `Subscription`, `PushSubscription`
- Aplicate via SQL direct (prisma migrate dev cauzează drift din cauza tabelelor n8n)
- Tipuri și Zod schemas adăugate în `/shared`
- `cloudinaryId String?` adăugat la `PassageMedia`

### Faza 2 — Backend Chronicles & Passages ✅ (2026-06-13)
- Rute publice: `routes/chronicles.ts`
- Rute admin CRUD: `routes/admin-chronicles.ts`
- Integrare Cloudinary: `services/cloudinary.ts`
- Media routes: YouTube link, file upload → Cloudinary, delete, reorder

### Faza 3 — Frontend public `/adventures` ✅ (2026-06-14)
- Rută `/adventures` în `app.routes.ts` (înainte de wildcard)
- `AdventuresPage` — grid Chronicles
- `ChroniclePage` — detaliu cu Passages + media gallery
- `ChroniclesService` — HTTP calls publice
- Link "ADVENTURES" în navbar

### Faza 4 — Admin panel Chronicles & Passages ✅ (2026-06-14)
- `ChroniclesListComponent`, `ChronicleFormComponent`, `PassagesListComponent`, `PassageFormComponent`
- `AdminDataService` extins cu toate metodele CRUD
- Routes adăugate în `admin.routes.ts`, CHRONICLES în sidebar

### Faza 5 — Google OAuth (subscriberi) ✅ (2026-06-14)
- OAuth2 manual (fără passport): `routes/subscriber-auth.ts`
- JWT subscriber separat (`JWT_SUBSCRIBER_SECRET`) — nu poate fi replayat ca admin
- `FRONTEND_URL` env var pentru redirect după OAuth
- `SubscriberAuthService` Angular cu signals
- Auth widget pe `/adventures`

### Faza 6 — Subscriptions ✅ (2026-06-14)
- Backend: `routes/subscriptions.ts` — GET /mine, POST, DELETE /:id
- `SubscriptionsService` Angular
- `SubscribePanelComponent` — toggle GLOBAL/CHRONICLE
- findFirst + create (nu upsert) — NULL safe pentru GLOBAL subscriptions

### Faza 7 — Web Push ✅ (2026-06-15)
- Service worker manual în Angular (`/public/sw.js`)
- Backend: `services/push.ts`, `routes/push.ts`
- `PushService` Angular — register SW, request permission, subscribe, send to backend
- `notifySubscribers()` conectat în `admin-chronicles.ts` la publish
- Auto-cleanup endpoint-uri expirate (HTTP 410/404)

---

## UI Polish ✅ (2026-06-17 → 2026-06-18)

| Problemă | Fix |
|----------|-----|
| Fotografii landscape overflow în alte slide-uri | `object-fit: cover` + overflow hidden pe carousel |
| Swipe mobile lipsă | Touch events pe ChroniclePage carousel |
| Cover chronicle fără efect | Neon polaroid frame + parallax pe scroll |
| Data passage off-by-one | Timezone fix — date locale fără UTC shift |
| Ordine pasaje incorectă | Passages ordered by `order` desc în `routes/chronicles.ts` |

---

## Security Audit 2026-06-16

| ID | Severity | Fix |
|----|----------|-----|
| C1 | CRITICAL | Subscriber tokens folosesc `JWT_SUBSCRIBER_SECRET` separat; claim `type` verificat pe fiecare request admin |
| H1 | HIGH | `npm audit fix` — Angular 21 patched, qs, ip-address |
| H2 | HIGH | OAuth CSRF state nonce în cookie `httpOnly sameSite:lax` |
| M1 | MEDIUM | Rate limit 20/5min pe AI chat route |
| M2 | MEDIUM | Rate limit 100/15min pe subscriber-auth router |
| M3 | MEDIUM | SVG eliminat din whitelist upload |
| M4 | MEDIUM | Login/refresh budgets separate |
| L2/L3/L6 | LOW | NaN guard, YouTube regex hardened, error messages normalized |

---

## Fișiere noi/modificate majore

| Fișier | Acțiune |
|--------|---------|
| `backend/routes/subscriber-auth.ts` | Nou — Google OAuth flow |
| `backend/routes/subscriptions.ts` | Nou — subscription management |
| `backend/routes/push.ts` | Nou — Web Push subscribe/unsubscribe |
| `backend/routes/chronicles.ts` | Nou — public chronicles API |
| `backend/routes/admin-chronicles.ts` | Nou — admin CRUD chronicles/passages/media |
| `backend/services/cloudinary.ts` | Nou — Cloudinary helpers |
| `backend/services/push.ts` | Nou — notifySubscribers |
| `frontend/src/app/adventures/` | Nou — tot modulul adventures |
| `frontend/src/app/services/chronicles.service.ts` | Nou |
| `frontend/src/app/services/subscriber-auth.service.ts` | Nou |
| `frontend/src/app/services/subscriptions.service.ts` | Nou |
| `frontend/src/app/services/push.service.ts` | Nou |
| `frontend/src/app/shared/cloudinary-image.pipe.ts` | Nou |
| `frontend/public/sw.js` | Nou — service worker push |
| `frontend/src/app/admin/pages/chronicles/` | Nou — 4 componente admin |
| `backend/middleware/auth.ts` | Modificat — verificare `type: 'admin'` |
| `backend/routes/upload.ts` | Modificat — SVG eliminat, rate limit |
| `backend/routes/ai-chat.ts` | Modificat — rate limit 20/5min |

---

## Starea la finalul sprintului

- Adventures feature complet funcțional (Chronicle, Passage, Media, Subscribe, Push)
- Security audit 2026-06-16: toate finding-urile CRITICAL/HIGH/MEDIUM fixate
- UI polish: swipe carousel, polaroid neon, parallax cover, fix date și ordine
- Tot live pe EC2 `13.60.216.226`
