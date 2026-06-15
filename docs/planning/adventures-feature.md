# Adventures Feature — Plan Complet

## Vocabular

| Concept | Nume | Descriere |
|---------|------|-----------|
| Container | **Chronicle** | Grupează mai multe Passages. Poate fi o drumeție, o perioadă, un trip. |
| Moment | **Passage** | O intrare dintr-un Chronicle. Poate fi o zi, o etapă (urcare, cascadă), un eveniment. |
| Media | **PassageMedia** | Imagini sau video-uri atașate unui Passage. Multiple per Passage. |
| Abonat | **GoogleSubscriber** | Utilizator logat cu Google care poate subscrie la Chronicle-uri. |
| Abonament | **Subscription** | GLOBAL (Chronicle noi) sau CHRONICLE (Passages noi într-un Chronicle specific). |
| Push | **PushSubscription** | Obiectul de browser push al unui subscriber (endpoint + chei). |

---

## Schema Prisma (finală)

```prisma
model Chronicle {
  id          Int       @id @default(autoincrement())
  title       String
  description String?
  coverImage  String?
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  passages      Passage[]
  subscriptions Subscription[]
}

model Passage {
  id          Int       @id @default(autoincrement())
  chronicleId Int
  title       String
  content     String?
  order       Int       @default(0)
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  chronicle Chronicle      @relation(fields: [chronicleId], references: [id], onDelete: Cascade)
  media     PassageMedia[]
}

model PassageMedia {
  id        Int       @id @default(autoincrement())
  passageId Int
  url       String
  type      MediaType
  order     Int       @default(0)
  caption   String?

  passage Passage @relation(fields: [passageId], references: [id], onDelete: Cascade)
}

model GoogleSubscriber {
  id        Int      @id @default(autoincrement())
  googleId  String   @unique
  email     String   @unique
  name      String
  picture   String?
  createdAt DateTime @default(now())

  subscriptions     Subscription[]
  pushSubscriptions PushSubscription[]
}

model Subscription {
  id           Int              @id @default(autoincrement())
  subscriberId Int
  type         SubscriptionType
  chronicleId  Int?
  createdAt    DateTime         @default(now())

  subscriber GoogleSubscriber @relation(fields: [subscriberId], references: [id], onDelete: Cascade)
  chronicle  Chronicle?       @relation(fields: [chronicleId], references: [id], onDelete: Cascade)

  @@unique([subscriberId, type, chronicleId])
}

model PushSubscription {
  id           Int      @id @default(autoincrement())
  subscriberId Int
  endpoint     String   @unique
  p256dh       String
  auth         String
  createdAt    DateTime @default(now())

  subscriber GoogleSubscriber @relation(fields: [subscriberId], references: [id], onDelete: Cascade)
}

enum MediaType {
  IMAGE
  VIDEO
  YOUTUBE
}

enum SubscriptionType {
  GLOBAL
  CHRONICLE
}
```

---

## Servicii Externe

### Cloudinary (imagini & video)
- Cont necesar pe cloudinary.com (free tier: 25GB storage, 25GB bandwidth)
- Secrets necesare în GitHub + `.env`:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- Workflow: backend primește fișier → îl trimite la Cloudinary → salvează URL-ul în DB

### Google OAuth (autentificare subscriberi)
- Proiect Google Cloud + OAuth 2.0 credentials
- Secrets necesare:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_CALLBACK_URL` (ex: `https://domeniu.ro/api/auth/google/callback`)
- Adminul rămâne cu email/password existent — Google OAuth e doar pentru subscriberi

### Web Push (notificări Chrome)
- VAPID keys generate o singură dată pe server (`npx web-push generate-vapid-keys`)
- Secrets necesare:
  - `VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
  - `VAPID_SUBJECT` (ex: `mailto:otnieliacob@gmail.com`)
- Service worker în Angular pentru a primi push-uri

---

## Backend — Rute Noi

### Public (`/api/chronicles`)
```
GET  /api/chronicles              — lista Chronicles publicate
GET  /api/chronicles/:id          — un Chronicle cu Passages publicate
```

### Google OAuth (`/api/auth`)
```
GET  /api/auth/google             — redirect la Google
GET  /api/auth/google/callback    — callback, creează subscriber, returnează JWT
GET  /api/auth/subscriber/me      — profil subscriber curent
POST /api/auth/subscriber/logout  — logout subscriber
```

### Subscriptions (`/api/subscriptions`)
```
POST   /api/subscriptions         — abonare (GLOBAL sau CHRONICLE)
DELETE /api/subscriptions/:id     — dezabonare
GET    /api/subscriptions/mine    — abonamentele mele
```

### Web Push (`/api/push`)
```
POST   /api/push/subscribe        — salvează PushSubscription din browser
DELETE /api/push/unsubscribe      — șterge PushSubscription
GET    /api/push/vapid-public-key — returnează VAPID public key pentru frontend
```

### Admin (`/api/admin`)
```
GET    /api/admin/chronicles              — toate Chronicles (draft + publicate)
POST   /api/admin/chronicles              — creare Chronicle
PUT    /api/admin/chronicles/:id          — editare Chronicle
DELETE /api/admin/chronicles/:id          — ștergere Chronicle
POST   /api/admin/chronicles/:id/publish  — publicare (setează publishedAt, trimite push GLOBAL)

GET    /api/admin/chronicles/:id/passages              — toate Passages
POST   /api/admin/chronicles/:id/passages              — creare Passage
PUT    /api/admin/chronicles/:id/passages/:pid         — editare Passage
DELETE /api/admin/chronicles/:id/passages/:pid         — ștergere Passage
POST   /api/admin/chronicles/:id/passages/:pid/publish — publicare (trimite push CHRONICLE)

POST   /api/admin/passages/:pid/media     — upload media (→ Cloudinary)
DELETE /api/admin/media/:mid              — ștergere media (din Cloudinary + DB)
PUT    /api/admin/media/:mid/order        — reordonare media
```

---

## Frontend — Pagini & Componente

### Public (`/adventures`)
```
/adventures           — AdventuresPage
                        └── ChronicleCard (listă Chronicles)

/adventures/:id       — ChroniclePage
                        ├── Chronicle header (titlu, descriere, cover)
                        ├── PassageList
                        │     └── PassageCard (titlu, content, MediaGallery)
                        └── SubscribePanel
                              ├── [nelogat] → "Login with Google"
                              └── [logat]   → toggle GLOBAL / CHRONICLE
```

### Admin (`/admin`)
```
/admin/chronicles                       — ChroniclesListPage
/admin/chronicles/new                   — ChronicleFormPage
/admin/chronicles/:id                   — ChronicleFormPage (edit + publish)
/admin/chronicles/:id/passages          — PassagesListPage
/admin/chronicles/:id/passages/new      — PassageFormPage
/admin/chronicles/:id/passages/:pid     — PassageFormPage (edit + media upload + publish)
```

### Shared types noi (în `/shared/index.ts`)
```typescript
Chronicle, Passage, PassageMedia,
GoogleSubscriber, Subscription, PushSubscription,
SubscriptionType, MediaType
```

---

## Flux Notificări Push

### La publicarea unui Chronicle nou:
1. Admin apasă "Publish" pe Chronicle
2. Backend setează `publishedAt = now()`
3. Backend caută toți subscriberii cu `type: GLOBAL`
4. Trimite Web Push la fiecare `PushSubscription` al lor
5. Chrome afișează notificarea (chiar dacă tab-ul e închis)

### La publicarea unui Passage nou:
1. Admin apasă "Publish" pe Passage
2. Backend setează `publishedAt = now()`
3. Backend caută toți subscriberii cu `type: CHRONICLE` și `chronicleId` potrivit
4. Trimite Web Push la fiecare `PushSubscription` al lor

---

## Faze de Implementare

### Faza 1 — Fundație DB ✅ (2026-06-13)
- [x] Adaugă modelele în `schema.prisma`
- [x] Aplicat via SQL direct (nu `prisma migrate dev` — n8n împarte același DB și cauzează drift)
- [x] Adaugă tipurile și Zod schemas în `/shared`
- [x] `cloudinaryId String?` adăugat la `PassageMedia` (necesar pentru delete din Cloudinary)

### Faza 2 — Backend Chronicles & Passages ✅ (2026-06-13)
- [x] Rute publice (`/api/chronicles`, `/api/chronicles/:id`) — `routes/chronicles.ts`
- [x] Rute admin CRUD complet — `routes/admin-chronicles.ts`
- [x] Integrare Cloudinary — `services/cloudinary.ts` (activ când `CLOUDINARY_*` env vars sunt setate)
- [x] Admin media routes: YouTube link, file upload → Cloudinary, delete, reorder
- [x] `notifySubscribers()` stub la publish (se conectează în Faza 7)

### Faza 3 — Frontend public `/adventures` ✅ (2026-06-14)
- [x] Rută `/adventures` în `app.routes.ts` (înainte de wildcard)
- [x] `AdventuresPage` — lista Chronicles cu grid de carduri
- [x] `ChroniclePage` — detaliu cu Passages, text și media gallery (IMAGE/VIDEO/YOUTUBE)
- [x] `ChroniclesService` — `/api/chronicles` și `/api/chronicles/:id`
- [x] Link "ADVENTURES" în navbar cu RouterLink
- [x] Design cyberpunk consistent cu restul site-ului

### Faza 4 — Admin panel Chronicles & Passages ✅ (2026-06-14)
- [x] `ChroniclesListComponent` — tabel cu status, passage count, delete
- [x] `ChronicleFormComponent` — creare/editare + publish + preview cover
- [x] `PassagesListComponent` — tabel passages per chronicle
- [x] `PassageFormComponent` — creare/editare + publish + media (YouTube + upload Cloudinary + reorder + delete)
- [x] `AdminDataService` extins cu toate metodele CRUD pentru chronicles/passages/media
- [x] Routes adăugate în `admin.routes.ts`
- [x] CHRONICLES adăugat în sidebar

### Faza 5 — Google OAuth (subscriberi) ✅ (2026-06-14)
- [x] Google Cloud project configurat (gen-lang-client-0008919697)
- [x] Backend: OAuth2 manual (fără passport), rute `/api/auth/google`, `/api/auth/google/callback`
- [x] `GET /api/auth/subscriber/me` + `POST /api/auth/subscriber/logout`
- [x] JWT subscriber în cookie httpOnly (30d), domain: 'localhost' în dev pentru cross-port
- [x] `FRONTEND_URL` env var pentru redirect după OAuth
- [x] `SubscriberAuthService` Angular cu signals
- [x] Auth widget pe `/adventures` — Login with Google / avatar + logout

### Faza 6 — Subscriptions ✅ (2026-06-14)
- [x] Backend rute `/api/subscriptions` — GET /mine, POST, DELETE /:id
- [x] `SubscriptionsService` Angular — getMine, subscribe, unsubscribe
- [x] `SubscribePanelComponent` — toggle GLOBAL / CHRONICLE pe `/adventures/:id`
- [x] findFirst + create pattern (nu upsert) — NULL safe pentru GLOBAL subscriptions

### Faza 7 — Web Push ✅ (2026-06-15)
- [x] Generare VAPID keys, adăugare în secrets
- [x] Service worker manual în Angular (`/public/sw.js`) — push + notificationclick
- [x] Backend: `web-push` package, `services/push.ts`, rute `/api/push`
- [x] Frontend: `PushService` Angular — register SW, request permission, subscribe, send to backend
- [x] Trigger push la publish — `notifySubscribers` din `services/push.ts` conectat în `admin-chronicles.ts`
- [x] `SubscribePanelComponent` apelează `pushService.enable()` la fiecare subscribe

---

## GitHub Secrets de adăugat

```
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
```

---

## Notițe de arhitectură

- Subscriberii au JWT propriu, separat de JWT-ul adminului
- Draft = `publishedAt: null`, Published = `publishedAt: DateTime`
- Notificările se trimit o singură dată la publish — nu există "unpublish"
- Cloudinary gestionează optimizarea imaginilor (WebP automat)
- Service worker-ul Angular nu necesită `@angular/pwa` — îl scriem manual pentru control complet
- Upload media merge prin backend (nu direct frontend → Cloudinary) — evită CSP issues

---

## Verificare compatibilitate — probleme identificate

### ⚠ CRITIC — Frontend wildcard route
`frontend/src/app/app.routes.ts` are `{ path: '**', redirectTo: '' }` înainte de `/adventures`.
Orice rută necunoscută merge la HOME. `/adventures` trebuie adăugat **înainte** de wildcard.

```typescript
// Ordinea corectă:
{ path: '', component: PortfolioComponent },
{ path: 'home', redirectTo: '', pathMatch: 'full' },
{ path: 'adventures', loadChildren: () => import('./adventures/adventures.routes').then(...) },
{ path: 'admin', loadChildren: () => import('./admin/admin.routes').then(...) },
{ path: '**', redirectTo: '' },  // ← MEREU ultimul
```

### ℹ Pachete lipsă — backend
```bash
npm install passport passport-google-oauth20 web-push cloudinary
npm install -D @types/passport @types/passport-google-oauth20 @types/web-push
```

### ℹ Body size limit
`express.json({ limit: '10kb' })` în `backend/index.ts`.
Nu e problemă — upload-ul merge direct la Cloudinary prin backend stream, nu prin JSON body.
Metadata Chronicles/Passages (titlu, descriere) se încadrează în 10KB.

### ℹ Startup secret validator
`backend/index.ts` validează doar `JWT_SECRET`, `JWT_REFRESH_SECRET`, `INTERNAL_API_KEY`.
La Faza 5-7 adaugă și secretele noi în lista `required`.
