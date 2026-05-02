# SPRINT-03: Admin Panel UI — Full CRUD + File Upload

**Goal:** Build a fully functional admin panel with cyberpunk styling, CRUD interfaces for all content entities, real file upload for profile assets, and ↑↓ order controls.

**Architect Reference:** ADR-001 (all API endpoints already built in SPRINT-02)
**Prerequisite:** SPRINT-02 completed. Backend running. DB seeded.

---

## 1. Pre-Flight Check

- **Feasibility:** High. All API endpoints exist. Auth scaffold exists (login page, guard, interceptor, dashboard stub).
- **New backend packages:** `multer`, `@types/multer`
- **New frontend packages:** None — uses native `FormData` + Angular `HttpClient`
- **Docker:** Add `uploads` named volume to `docker-compose.yml` and `docker-compose.prod.yml`. Mount at `/app/uploads` in backend container.
- **Dependency Chain (strict):**
  1. Backend file upload endpoint + static serving
  2. Docker volume config updated
  3. Admin layout + shared styles
  4. Login page styled
  5. Dashboard with navigation
  6. Profile editor with file upload
  7. Projects CRUD
  8. Experience CRUD
  9. Hobbies CRUD
  10. Semesters & Subjects CRUD

---

## 2. Architecture Blueprint

```
/admin (lazy-loaded Angular module)
│
├── /admin/login          → LoginComponent (already exists, needs styling)
│
└── /admin/dashboard      → AdminLayoutComponent (shell with sidebar nav)
      ├── /admin/profile      → ProfileEditorComponent
      ├── /admin/projects     → ProjectsListComponent + ProjectFormComponent
      ├── /admin/experience   → ExperienceListComponent + ExperienceFormComponent
      ├── /admin/hobbies      → HobbiesListComponent + HobbyFormComponent
      └── /admin/semesters    → SemestersListComponent + SubjectsListComponent

File Upload Flow:
  [User selects file] → FormData POST /api/admin/upload
    → multer saves to backend/uploads/<uuid>.<ext>
    → returns { url: "/uploads/<uuid>.<ext>" }
  [Component sets field value to returned URL]
  [Form submit] → PUT /api/admin/profile with updated URL string
```

**Docker Volume:**
```yaml
volumes:
  uploads_data:

services:
  backend:
    volumes:
      - uploads_data:/app/uploads
```

**Nginx** (frontend container) proxies `/uploads/*` → backend:3000/uploads/*

---

## 3. Time-Blocked Execution

---

### PHASE 1 — BACKEND FILE UPLOAD

#### Task 1.1 — Install multer + configure upload endpoint
- **Description:** Install `multer @types/multer uuid @types/uuid` in backend. Create `/backend/routes/upload.ts` with `POST /api/admin/upload`. Accept single file (field name `file`). Save to `process.env.UPLOADS_DIR ?? './uploads'` with UUID filename preserving extension. Return `{ data: { url: '/uploads/<filename>' } }`. Protect with `authMiddleware`. Add size limit (10MB) and mime type filter (images + PDF only). Serve uploads folder as static in `backend/index.ts`: `app.use('/uploads', express.static(uploadsDir))`. Create `uploads/` directory with `.gitkeep`.
- **Time Estimate:** 40 min
- **Definition of Done:** `POST /api/admin/upload` with a JPG returns `{ data: { url: '/uploads/uuid.jpg' } }`. File exists on disk. Unauthenticated request returns 401.

#### Task 1.2 — Update Docker configs for uploads volume
- **Description:** Add `uploads_data` named volume to `docker-compose.yml` and `docker-compose.prod.yml`. Mount to backend service at `/app/uploads`. Add `UPLOADS_DIR=/app/uploads` env var to backend service. Add `location /uploads/` block to `frontend/nginx.conf` to proxy to `backend:3000`. Add `UPLOADS_DIR` to `.env.example`.
- **Time Estimate:** 20 min
- **Definition of Done:** `docker compose up` mounts volume. Nginx proxies `/uploads/*` to backend.

---

### PHASE 2 — ADMIN SHARED INFRASTRUCTURE

#### Task 2.1 — Admin CSS design tokens + global styles
- **Description:** Create `frontend/src/app/admin/admin.scss` with cyberpunk-consistent design tokens scoped to `.admin-*` namespace: dark background (`#0a0a0f`), neon accent (`#00ffcc`), secondary accent (`#ff00aa`), monospace font, neon border style, input/button/card styles. These tokens mirror the public site but adapted for a data-dense admin interface (smaller spacing, compact cards).
- **Time Estimate:** 30 min
- **Definition of Done:** Tokens defined and importable by all admin components.

#### Task 2.2 — Admin Layout component (shell with sidebar)
- **Description:** Create `AdminLayoutComponent` as the parent shell for all authenticated admin routes. Contains: left sidebar with nav links (Profile, Projects, Experience, Hobbies, Semesters), top bar with "ADMIN PANEL" title + logged-in email + logout button. Uses `<router-outlet>` for child routes. Apply cyberpunk styling.
- **Time Estimate:** 45 min
- **Definition of Done:** Sidebar renders. Navigation between sections works. Logout calls `AuthService.logout()`.

#### Task 2.3 — Update admin routes to use layout shell
- **Description:** Restructure `admin.routes.ts` so that all authenticated routes are children of `AdminLayoutComponent` (which provides the sidebar). Route structure: `/admin/login` (no shell), `/admin/dashboard` → redirect to `/admin/profile`, `/admin/profile`, `/admin/projects`, `/admin/experience`, `/admin/hobbies`, `/admin/semesters`. All non-login routes behind `authGuard`.
- **Time Estimate:** 20 min
- **Definition of Done:** Navigating to `/admin/profile` shows layout with sidebar. `/admin/login` shows only the login form with no sidebar.

#### Task 2.4 — Style login page (cyberpunk)
- **Description:** Style existing `LoginComponent` with cyberpunk aesthetic: centered card with neon border, glowing input fields, neon "LOGIN" button with scan-line animation, "ADMIN PANEL" header with terminal-style prefix `> `.
- **Time Estimate:** 30 min
- **Definition of Done:** Login page visually consistent with public site style.

---

### PHASE 3 — FILE UPLOAD ANGULAR SERVICE

#### Task 3.1 — UploadService in Angular
- **Description:** Create `frontend/src/app/admin/services/upload.service.ts`. Single method `upload(file: File): Observable<string>` — POSTs `FormData` to `/api/admin/upload`, returns the `url` string from response. The Authorization header is automatically injected by the auth interceptor.
- **Time Estimate:** 15 min
- **Definition of Done:** Service injectable. Upload returns URL string. Auth interceptor sends token automatically.

#### Task 3.2 — FileUploadComponent (reusable)
- **Description:** Create `frontend/src/app/admin/components/file-upload/file-upload.component.ts`. Inputs: `label: string`, `accept: string` (e.g. `"image/*"` or `".pdf"`), `currentUrl: string | null`. Outputs: `uploaded: EventEmitter<string>`. Shows current file preview (image thumbnail or PDF icon). Has "Choose file" button → triggers hidden file input → on change calls `UploadService.upload()` → emits new URL. Shows upload progress state. Cyberpunk styled.
- **Time Estimate:** 40 min
- **Definition of Done:** Component renders preview. Upload emits URL. Can be used in any admin form.

---

### PHASE 4 — PROFILE EDITOR

#### Task 4.1 — ProfileEditorComponent
- **Description:** Create `ProfileEditorComponent`. On init, loads current profile via `ContentService.getProfile()`. Form fields: name, role, description (textarea), location, email, linkedin, github. Three `FileUploadComponent` instances for: photo (image/*), avatar (image/*), cvPdf (.pdf). On form submit, calls `PUT /api/admin/profile` with all fields including updated file URLs. Show success/error toast notification.
- **Time Estimate:** 60 min
- **Definition of Done:** Profile loads on open. Changing a field and saving updates DB. Uploading new photo updates the public site after save. Error on invalid data shows message.

---

### PHASE 5 — PROJECTS CRUD

#### Task 5.1 — ProjectsListComponent
- **Description:** List all projects (including `display: false`). Each row shows: name, status badge, date, display toggle, ↑↓ buttons, Edit button, Delete button. ↑↓ calls `PUT /api/admin/projects/:id` with updated `order`. Delete shows inline confirmation before `DELETE /api/admin/projects/:id`. "Add Project" button navigates to form.
- **Time Estimate:** 50 min
- **Definition of Done:** List renders from API. Delete removes item from list. ↑↓ reorders visually and persists.

#### Task 5.2 — ProjectFormComponent (Add/Edit)
- **Description:** Shared form for create and edit. Fields: name, description (textarea), tech, link (optional), liveLink (optional), awards (optional), date (date picker), endDate (optional), status (select: wip/completed/archived), display (checkbox), order (number), contributors (dynamic list — add/remove rows, each row is either a plain string or a [name, url] pair). On submit: POST for new, PUT for edit. Cancel navigates back to list.
- **Time Estimate:** 70 min
- **Definition of Done:** Create adds new project visible on public site. Edit updates existing. Contributors dynamic list works correctly.

---

### PHASE 6 — EXPERIENCE CRUD

#### Task 6.1 — ExperienceListComponent
- **Description:** Same pattern as ProjectsListComponent. Shows: company, role, type badge (job/education/event), period (formatted). ↑↓ order, Edit, Delete with confirmation.
- **Time Estimate:** 40 min
- **Definition of Done:** List renders. Delete/reorder persist.

#### Task 6.2 — ExperienceFormComponent
- **Description:** Fields: company, role, startDate (date), endDate (optional date), type (select: job/education/event), tech, description (dynamic bullet list — add/remove lines), order.
- **Time Estimate:** 50 min
- **Definition of Done:** Add/edit work. Description bullet list adds/removes rows correctly.

---

### PHASE 7 — HOBBIES CRUD

#### Task 7.1 — HobbiesListComponent + HobbyFormComponent
- **Description:** List with ↑↓, Edit, Delete. Form fields: name, description, link, order, icon (`FileUploadComponent` with `image/*`). Icon shows current image preview.
- **Time Estimate:** 50 min
- **Definition of Done:** Full CRUD. Icon upload updates hobby icon on public site.

---

### PHASE 8 — SEMESTERS & SUBJECTS CRUD

#### Task 8.1 — SemestersListComponent
- **Description:** List semesters with subject count. Edit name/order. Delete (with warning: deletes all subjects). "Manage Subjects" button expands inline subject list for that semester.
- **Time Estimate:** 40 min
- **Definition of Done:** Semesters list renders. Edit/delete work.

#### Task 8.2 — SubjectsListComponent (inline per semester)
- **Description:** Inline within semester row. Lists subjects with: code, name, credits, passed toggle (checkbox, auto-saves on click), docPath (file upload for PDF). Add new subject form inline. Delete subject.
- **Time Estimate:** 50 min
- **Definition of Done:** Passed toggle saves immediately. PDF upload works. Add/delete subjects persist.

---

## 4. Retrospective Protocol

| Metric | Value |
|---|---|
| **Estimated Total Time** | ~9 ore |
| **Phase 1 (File Upload Backend)** | 60 min |
| **Phase 2 (Admin Infrastructure)** | 125 min |
| **Phase 3 (Upload Angular)** | 55 min |
| **Phase 4 (Profile)** | 60 min |
| **Phase 5 (Projects)** | 120 min |
| **Phase 6 (Experience)** | 90 min |
| **Phase 7 (Hobbies)** | 50 min |
| **Phase 8 (Semesters)** | 90 min |
| **Actual Time** | [To be filled] |
| **Velocity Delta** | [Actual - Estimated] |

---

## 5. Definition of Done — Sprint Level

- [ ] File upload works: photo/avatar/cvPdf se pot schimba din admin fără deployment
- [ ] Toate entitățile au CRUD complet (list + add + edit + delete)
- [ ] ↑↓ reordonare persistă în DB și se reflectă pe site-ul public
- [ ] Admin panel are styling cyberpunk consistent cu site-ul public
- [ ] Login page styled
- [ ] Sidebar navigation funcțional
- [ ] Uploads persistă după restart Docker (volum montat)
- [ ] Fișierele uploadate sunt accesibile public via `/uploads/<filename>`

---

*SPRINT-03 | Owner: Design Engineer → Coder | Unblocked after: SPRINT-02 complete*
*Previous sprint: SPRINT-02 (Dynamic Data Layer & Admin Auth)*
