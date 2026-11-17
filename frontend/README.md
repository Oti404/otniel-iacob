# Frontend

Angular 21 SPA. Public portfolio at `/`, admin panel at `/admin` (lazy-loaded).

## Stack
- Angular 21, standalone components, TypeScript
- RxJS, Angular Router (hash location), HttpClient
- SCSS with design tokens in `src/styles/_tokens.scss` (`#0a0a0f` bg, `#00ffcc` accent, `#ff00aa` secondary); JetBrains Mono + Orbitron, self-hosted
- Shared types + validators (via `@monorepo/shared`)

## Structure
```
src/app/
  app.ts                Root component (subscriber session, RouterOutlet)
  app.config.ts         Providers: router + HttpClient + authInterceptor
  app.routes.ts         / → Portfolio; /adventures, /admin → lazy; ** → /

  core/services/        Public API services (content, chronicles, subscriber auth, subscriptions, push)
  shared/
    pipes/              cloudinary-image.pipe (cldImg)
    ui/                 icon.component (inline SVG icons)

  features/portfolio/   Public page
    portfolio.component Shell — navbar, sections, footer
    sections/           navbar, home, about, projects, experience, footer (+ hobbies, academic-journey: not rendered)

  features/adventures/  Lazy — chronicle list + chronicle page, carousel, subscribe panel

  features/admin/       Lazy-loaded admin module
    admin.routes.ts     Routes (all behind authGuard except /login)
    guards/
      auth.guard.ts     Blocks /admin/* if no in-memory token
    interceptors/
      auth.interceptor.ts  Attaches Bearer; auto-refresh on 401
    services/
      auth.service.ts       Signal-based token store
      admin-data.service.ts CRUD HTTP for all entities
      upload.service.ts     File upload wrapper
    layout/             AdminLayoutComponent (sidebar + router-outlet)
    pages/
      login/            Login form
      profile/          Profile editor
      projects/         List + form
      experience/       List + form
      hobbies/          List + form
      semesters/        Semesters + subjects manager
```

## Dev
```bash
npm run dev:frontend    # ng serve on port 4200
npm run build:frontend  # production build
```

## Auth flow
1. Login → access token stored in memory (Angular signal)
2. Every request: `authInterceptor` attaches `Authorization: Bearer <token>`
3. On 401: interceptor calls `/api/auth/refresh` (uses httpOnly cookie) → retries request
4. On refresh failure: clears token, redirects to `/admin/login`
5. `authGuard` checks in-memory token — redirects to login if absent

> **Note:** Token is in-memory only. On page refresh, the guard attempts a silent token refresh using the httpOnly cookie before redirecting to login. If the cookie is still valid, the session is restored transparently.

## Router
Uses `withHashLocation()` — URLs look like `/#/admin/profile`. Required for nginx single-page-app serving without `try_files` configuration per route.
