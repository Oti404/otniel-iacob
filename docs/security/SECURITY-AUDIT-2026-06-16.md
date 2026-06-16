# Security Audit — otniel-iacob.com

**Date:** 2026-06-16
**Scope:** Full stack — backend (Express/Prisma), frontend (Angular 21), infra (nginx/Docker/EC2), CI/CD (GitHub Actions), dependencies, OAuth, Web Push, n8n.
**Method:** Manual source review of every route, middleware, service, config, Dockerfile, and deploy script + `npm audit`.
**Threat model:** Single-admin portfolio. Public visitors can read content and (via Google OAuth) become "subscribers". Only one trusted admin writes content. Goal is *pragmatic* hardening, not enterprise.

---

## Severity legend

| Level | Meaning |
|-------|---------|
| 🔴 CRITICAL | Remote, unauthenticated, leads to full compromise or admin access |
| 🟠 HIGH | Serious — exploitable with low effort, or known CVE with a fix |
| 🟡 MEDIUM | Real weakness, but constrained by preconditions or limited impact |
| 🔵 LOW | Minor / defense-in-depth / hardening |
| 🟢 INFO | Not a vulnerability; improvement or observation |

---

## Summary table

| ID | Severity | Title | Status |
|----|----------|-------|--------|
| C1 | 🔴 CRITICAL | Admin auth bypass — subscriber token replayable as admin | ✅ FIXED (`d7ca104`) |
| H1 | 🟠 HIGH | Dependency vulnerabilities (7 high / 3 moderate) | ✅ FIXED (`2c6a935`) |
| H2 | 🟠 HIGH | Google OAuth login-CSRF — no `state` parameter | ✅ FIXED (`c834e43`) |
| M1 | 🟡 MEDIUM | AI-chat proxy has no rate limit (cost/DoS on n8n) | ✅ FIXED (`af2d845`) |
| M2 | 🟡 MEDIUM | Subscriber-auth routes not rate-limited | ✅ FIXED (`62096e7`) |
| M3 | 🟡 MEDIUM | SVG uploads allowed (stored XSS if opened directly) | ✅ FIXED (`1f676f6`) |
| M4 | 🟡 MEDIUM | Shared rate-limit budget for login + refresh | ✅ FIXED (`d7ad4c9`) |
| L1 | 🔵 LOW | `/api/health` discloses DB connectivity state | Open (accepted) |
| L2 | 🔵 LOW | `subscriptions` DELETE doesn't guard `NaN` id | ✅ FIXED |
| L3 | 🔵 LOW | YouTube embed via `bypassSecurityTrustResourceUrl` + weak regex | ✅ FIXED |
| L4 | 🔵 LOW | No Subresource Integrity (SRI) on external CDN CSS | Open |
| L5 | 🔵 LOW | Subscriber JWT lives 30 days, no rotation/revocation | Open (accepted) |
| L6 | 🔵 LOW | Auth error messages differ (`User not found` vs `Invalid token`) | ✅ FIXED |
| I1–I6 | 🟢 INFO | Hardening & process improvements | Open |

> **Update 2026-06-16:** All CRITICAL, HIGH, and MEDIUM findings fixed and deployed,
> plus lows L2/L3/L6. Remaining open: L4 (SRI), L1/L5 (accepted as low-risk for a
> single-admin portfolio), and the I1–I6 process improvements.

---

## 🔴 C1 — Admin auth bypass via shared JWT secret  *(FIXED)*

**Where:** `backend/middleware/auth.ts`, `backend/routes/subscriber-auth.ts`

**What it was:** Subscriber (Google OAuth) tokens and admin tokens were both signed with `JWT_SECRET`, and `authMiddleware` only verified the signature — it never checked *who* issued the token. Any visitor who logged in with Google on `/adventures` received a valid token that could be replayed as `Authorization: Bearer <token>` against any `/api/admin/*` route, granting full CRUD over profile, projects, experience, chronicles, media upload, and the AI-chat proxy.

**Exploit (pre-fix):**
1. Log in with any Google account at `/adventures`.
2. Read the `subscriber_token` cookie (visible to its own owner in DevTools).
3. `curl -H "Authorization: Bearer <token>" https://otniel-iacob.com/api/admin/chronicles` → accepted.

**Fix applied (`d7ca104`):**
- Subscriber tokens now signed/verified with a separate `JWT_SUBSCRIBER_SECRET`.
- Both token types carry an explicit `type` claim (`'admin'` / `'subscriber'`) that is checked on verify — two independent gates.
- Startup crashes if `JWT_SUBSCRIBER_SECRET` is missing, too short, or equal to `JWT_SECRET`.

**Residual:** None. All existing subscriber sessions were invalidated (expected) — subscribers re-login via Google.

---

## 🟠 H1 — Dependency vulnerabilities

**Where:** `npm audit` (production deps) → **7 high, 3 moderate**, all with fixes available.

| Package | Severity | Issue |
|---------|----------|-------|
| `@angular/core`, `@angular/compiler` | high | XSS via i18n attribute bindings; two-way binding sanitization bypass; namespace sanitization bypass; DoS via number/date formatting |
| `@angular/common` | high | Information leak via default caching of credentialed requests in `HttpTransferCache`; weak 32-bit cache-key hashing → cross-request data leakage; DoS via OOM |
| `express-rate-limit` → `ip-address` | moderate | XSS in `Address6` HTML-emitting methods |
| `qs` | moderate | Remotely triggerable DoS on malformed comma-format arrays |

**Impact here:** The Angular XSS advisories matter most because the app renders admin-controlled (and, for subscribers, profile name/picture) data into templates. The `ip-address`/`qs` ones are lower because the backend doesn't use the affected code paths directly, but they ship in the bundle.

**Fix:** Run `npm audit fix` (these are patch/minor bumps, not majors). Because the project pins Angular 21 pre-release versions, verify the bump resolves cleanly and rebuild the frontend before deploy:
```bash
npm audit fix
npm run build:all
```
If `audit fix` tries to pull an incompatible Angular line, pin the specific patched 21.x versions instead.

**Prevent recurrence:** add `npm audit --omit=dev --audit-level=high` as a non-blocking CI step and enable Dependabot/Renovate (see I3).

---

## 🟠 H2 — Google OAuth login-CSRF (missing `state`)

**Where:** `backend/routes/subscriber-auth.ts` — `GET /google` and `GET /google/callback`.

**What:** The authorization request never generates an OAuth `state` parameter, and the callback never validates one. This is the standard CSRF defense for OAuth. Without it, an attacker can initiate a flow, capture their own `code`, and trick a victim's browser into hitting the callback — binding the victim's session to the attacker's identity (or vice-versa).

**Impact here:** Lower than a typical OAuth CSRF because the resulting identity is only a *subscriber* (can manage their own push/email subscriptions), not the admin. But it's a missing standard control and trivially abusable to, e.g., subscribe a victim or pollute their subscription list.

**Fix:** Generate a random `state`, store it in a short-lived `httpOnly` cookie before redirecting, and require it to match in the callback:
```ts
// GET /google
const state = crypto.randomBytes(16).toString('hex');
res.cookie('oauth_state', state, { httpOnly: true, secure: req.secure, sameSite: 'lax', maxAge: 600000 });
params.set('state', state);

// GET /google/callback
const { code, state, error } = req.query;
if (!state || state !== req.cookies?.oauth_state) {
  res.redirect(`${frontendUrl()}/#/adventures?auth=error`);
  return;
}
res.clearCookie('oauth_state');
```
Note: `sameSite: 'lax'` (not `strict`) is required on the state cookie so it survives the cross-site redirect back from Google.

---

## 🟡 M1 — AI-chat proxy has no rate limit

**Where:** `backend/routes/ai-chat.ts` (mounted at `/api/admin/ai-chat`).

**What:** Unlike `/api/auth` (10/15min) and uploads (30/hr), the AI-chat route has no throttle. Each call proxies to the n8n chat webhook, which in turn calls a paid LLM (Google Gemini). It *is* behind `authMiddleware`, so only the admin can call it — but a leaked/stolen admin access token (15-min window) or a compromised admin browser could rack up cost or DoS the n8n workflow.

**Fix:** Add a dedicated limiter, e.g. 20 messages / 5 min:
```ts
import rateLimit from 'express-rate-limit';
const chatLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 20,
  message: { message: 'Too many messages, slow down.' } });
router.post('/', chatLimiter, async (req, res) => { /* ... */ });
```

---

## 🟡 M2 — Subscriber-auth routes not rate-limited

**Where:** `backend/index.ts` — `app.use('/api/auth', subscriberAuthRouter)` is mounted *before* and *separately from* the `authLimiter`. So `/api/auth/google`, `/google/callback`, `/subscriber/me`, `/subscriber/logout` have no rate limit.

**What:** `/subscriber/me` runs a JWT verify + DB lookup on every unauthenticated request — cheap to spam. `/google` issues redirects. No direct compromise, but an unauthenticated visitor can generate load and DB queries at will.

**Fix:** Apply a moderate limiter to the subscriber-auth router (separate, more generous budget than admin login since legit subscribers poll `/subscriber/me`):
```ts
const subscriberLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/auth', subscriberLimiter, subscriberAuthRouter);
```

---

## 🟡 M3 — SVG uploads allowed (stored XSS if opened directly)

**Where:** `backend/routes/upload.ts` — `allowedMimes` includes `image/svg+xml`, `allowedExtensions` includes `.svg`.

**What:** SVG files can embed `<script>`. They're served from `/uploads/` on the same origin. Rendered via `<img src>` the script won't run, but if the file URL is opened directly in a browser tab (or embedded via `<object>`/`<iframe>`), the script executes in the site's origin → stored XSS, potentially stealing the admin's in-memory access token.

Mitigating factors: only the admin can upload (JWT required), and the nginx CSP (`script-src 'self'`) blocks inline scripts even on same-origin documents. But CSP on a directly-opened SVG depends on the response carrying the header, and relying on CSP alone is fragile.

**Fix (pick one):**
- **Simplest:** drop SVG from the allow-list if you don't actually need user-uploaded SVGs (profile photo/CV are PDFs/images).
- **If SVG is needed:** serve `/uploads/` with `Content-Disposition: attachment` and/or `Content-Security-Policy: default-src 'none'` specifically for that location, so SVGs download instead of render.

---

## 🟡 M4 — Shared rate-limit budget for login + refresh

**Where:** `backend/index.ts` — `authLimiter` (10 requests / 15 min) covers the whole `authRouter`, i.e. `/login`, `/refresh`, and `/logout` together.

**What:** The frontend interceptor calls `/refresh` automatically on 401s. A normal admin session can legitimately consume several `/refresh` calls, eating into the same 10-request budget as `/login`. Worst case the admin locks *themselves* out for 15 minutes. It's an availability/UX issue, not an attacker win (limit is per-IP).

**Fix:** Split the budgets — strict on `/login` (brute-force defense), looser on `/refresh`:
```ts
const loginLimiter = rateLimit({ windowMs: 15*60*1000, max: 10 });
const refreshLimiter = rateLimit({ windowMs: 15*60*1000, max: 60 });
router.post('/login', loginLimiter, ...);
router.post('/refresh', refreshLimiter, ...);
```
(Remove the blanket `authLimiter` from the `app.use` mount and apply per-route.)

---

## 🔵 Low severity

**L1 — `/api/health` discloses DB connectivity.** `backend/index.ts` returns `database: connected|disconnected|error`. Minor reconnaissance aid. Consider returning a flat `ok` publicly and keeping detail behind the internal key, or accept it (common for health probes).

**L2 — `subscriptions` DELETE doesn't guard `NaN`.** `backend/routes/subscriptions.ts` uses `Number(req.params.id)`; a non-numeric id yields `NaN`, which `findFirst` won't match → harmless 404, but inconsistent with the `id()` guards elsewhere. Add the same `isNaN`/`< 1` check for consistency.

**L3 — YouTube embed trust bypass.** `frontend/.../chronicle-page.component.ts` `toEmbedUrl()` extracts a video id with `/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/` then `bypassSecurityTrustResourceUrl`. Admin-only input, and a non-match yields an empty id, so risk is low. Harden by validating the id against `^[A-Za-z0-9_-]{11}$` before trusting, and rejecting otherwise.

**L4 — No SRI on external CDN CSS.** `frontend/src/index.html` loads Font Awesome from `cdnjs.cloudflare.com` and fonts from Google with no `integrity=` hash. A CDN compromise could inject CSS. Either add SRI hashes or self-host (see I2) — self-hosting also lets you tighten CSP back to `'self'`.

**L5 — Subscriber JWT is 30 days, no rotation/revocation.** A stolen `subscriber_token` is valid for a month. Low impact (subscriber scope only). Acceptable, but consider 7 days + silent re-auth, or a server-side `tokenVersion` to allow revocation.

**L6 — Divergent auth error messages.** `backend/routes/auth.ts` `/refresh` returns `User not found` vs `Invalid or expired refresh token`. Minor oracle. Login itself correctly uses a single `Invalid credentials` (good — no user enumeration). Normalize the refresh messages.

---

## 🟢 Informational / improvements

**I1 — What's already solid (keep it):**
- All DB access via Prisma parameterized queries — no SQL injection surface.
- bcrypt (cost 12) for the admin password; timing-safe comparison for the internal API key.
- Admin access token kept **in memory** on the frontend (not `localStorage`) — good XSS posture.
- Cookies: `httpOnly`, `sameSite: strict`, `secure: req.secure` (correct after the trust-proxy fix).
- `/api/internal/` blocked at nginx **and** key-protected at the app.
- Prod containers bind to `127.0.0.1` only (postgres has no host port at all); nginx is the sole public surface. n8n reachable only via SSH tunnel.
- `.dockerignore` excludes `.env` — secrets are **not** baked into image layers.
- No secrets in git history; `.env`/`*.pem`/`*.key` gitignored.
- nginx security headers present (HSTS, X-Frame-Options, nosniff, Referrer-Policy, CSP, Permissions-Policy).

**I2 — Self-host fonts & Font Awesome.** Removes two external origins from CSP (`style-src`/`font-src` could return to `'self'`), eliminates the SRI gap (L4), and improves load reliability/privacy.

**I3 — Automate dependency hygiene.** Add `npm audit --audit-level=high` to CI and enable Dependabot or Renovate so H1-class issues surface automatically instead of during manual audits.

**I4 — Consider Cloudinary signed uploads / restricted API key.** The `CLOUDINARY_API_SECRET` is full-access. If it leaks, an attacker can manipulate the whole media library. Cloudinary supports scoped/signed upload presets — worth it if you rotate keys rarely.

**I5 — Rotate the secrets that have been on disk in plaintext `.env`.** Now that a separate subscriber secret exists, consider a one-time rotation of `JWT_SECRET`, `JWT_REFRESH_SECRET`, `INTERNAL_API_KEY`, DB password, Cloudinary secret, and Google client secret — purely hygienic, since they've lived in a local `.env` and CI. Update GitHub Secrets + EC2 in lockstep.

**I6 — Add a `state`-style nonce + PKCE to OAuth (extends H2).** Once `state` is in, PKCE (`code_challenge`) is a small additional step that fully closes auth-code interception.

---

## Recommended fix order

1. **H1** — `npm audit fix` + rebuild (fastest risk reduction, known CVEs). 🟠
2. **H2** — OAuth `state` parameter. 🟠
3. **M3** — drop/neutralize SVG uploads. 🟡
4. **M1 + M2 + M4** — rate-limit AI-chat, subscriber-auth, and split login/refresh budgets. 🟡
5. **L2, L3, L6** — small correctness/hardening tweaks. 🔵
6. **I2, I3** — self-host CDN assets, automate audits. 🟢

---

*Generated during a manual security review. C1 was fixed and deployed during the same session (commit `d7ca104`).*
