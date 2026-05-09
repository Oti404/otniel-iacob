# Probleme Întâmpinate și Soluții

## Format
Fiecare problemă are:
- **Simptom** — ce ai văzut
- **Cauza** — de ce s-a întâmplat
- **Soluție** — ce am făcut
- **Lecție** — ce să reții pentru viitor

---

## 1. Chat-ul AI returnează răspuns gol `{"data":{"reply":""}}`

**Simptom:** Angular primea `{"data":{"reply":""}}` de la backend. Nimic afișat în UI.

**Cauza (multiplă — rezolvată în etape):**

**a) Workflow n8n inactiv (Draft):**
n8n are două stări separate: "Published" (versiunea e salvată) și "Active" (webhookurile sunt înregistrate). Workflow-ul era în Draft — webhookul nu era înregistrat → 404.

**b) `Respond to Webhook` incompatibil cu Chat Trigger:**
Nodul `Respond to Webhook` e proiectat pentru triggere Webhook normale, nu pentru Chat Trigger. Când e conectat la un Chat Trigger, n8n returnează body gol. Soluție: șters Respond to Webhook, Chat Trigger returnează automat outputul ultimului nod.

**c) URL greșit în `.env`:**
`N8N_CHAT_WEBHOOK_URL` conținea `http://localhost:5678/...` în loc de `http://n8n:5678/...`. Backend-ul rulează în container Docker — nu poate ajunge la `localhost:5678`, trebuie să folosească numele serviciului Docker (`n8n`).

**d) Container nerecreeat după schimbarea `.env`:**
`docker restart` NU reîncarcă `env_file`. Variabilele de mediu sunt injectate la **crearea** containerului. Corect: `docker compose up -d --force-recreate backend`.

**Soluție finală:**
1. Publicat și activat workflow-ul în n8n
2. Șters `Respond to Webhook` 
3. Corectat URL-ul la `http://n8n:5678/...`
4. Recreat containerul cu `--force-recreate`

**Lecție:** Când schimbi variabile în `.env` și containerul folosește `env_file`, trebuie recreat containerul, nu doar restartat.

---

## 2. IF node trimite pe ramura greșită (CONFIRM detectat greșit)

**Simptom:** Mesajul de summary (care conținea "Type CONFIRM to publish") era trimis pe ramura True a IF-ului. Code node-ul încerca să parseze textul ca JSON → eroare `Unexpected token '┌'`.

**Cauza:** Condiția IF verifica dacă outputul AI **conține** cuvântul "CONFIRM". Dar mesajul de summary conținea literal textul "Type CONFIRM to publish" — deci condiția era adevărată și pentru mesaje normale.

**Soluție:** Schimbat condiția din `contains "CONFIRM"` în `contains "status":`. Stringul `"status":` (cu ghilimele și două puncte) apare **doar** în JSON-ul generat la confirmare, nu în niciun alt mesaj.

**Tentative anterioare care nu au funcționat:**
- `starts with {` — AI-ul învelea JSON-ul în ` ```json ``` `, deci outputul nu începea cu `{`
- Expresie booleană cu backtick-uri în IF — n8n a returnat eroare de tip

**Lecție:** Când alegi o condiție de ramificare, gândește-te la toate cazurile în care condiția ar putea fi adevărată accidental. Alege ceva **unic și specific** pentru cazul dorit.

---

## 3. Angular nu afișa răspunsul AI (loading rămânea blocat)

**Simptom:** Mesajul utilizatorului apărea în chat, răspunsul AI era vizibil în Network Tab (200 OK, body corect), dar nu apărea în UI. Butonul de trimitere rămânea blocat.

**Cauza:** Problemă de Change Detection în Angular. Callback-ul HTTP (`next: (res) => {...}`) se executa în afara zonei Angular (NgZone), deci Angular nu "vedea" modificarea array-ului de mesaje și nu re-renderea interfața.

**Soluție:** Înfășurat callback-ul în `NgZone.run()` și adăugat `ChangeDetectorRef.detectChanges()`:
```typescript
next: (res) => {
  this.zone.run(() => {
    this.messages.push({ role: 'ai', text: res.data.reply });
    this.loading = false;
    this.cdr.detectChanges();
  });
}
```

**Lecție:** Când Angular nu actualizează UI-ul deși datele s-au schimbat, verifică dacă operația e în NgZone. HttpClient ar trebui să fie în zonă, dar în anumite configurații (standalone components, lazy loading) poate apărea această problemă. `ChangeDetectorRef.detectChanges()` forțează re-renderarea.

---

## 4. 502 Bad Gateway după deploy pe EC2

**Simptom:** Site-ul returna "502 Bad Gateway" după deploy pe AWS.

**Cauza:** `database/seed.ts` conținea câmpul `contributors` în datele proiectelor. Schema Prisma a fost actualizată (contributors sunt acum o entitate separată cu relație), deci tipul nu mai era compatibil. TypeScript a aruncat eroare la compilare și backend-ul nu a pornit.

**Soluție:** Modificat buclă de seed ca să extragă câmpul `contributors` înainte de a trimite datele la Prisma:
```typescript
const { contributors, ...projectData } = project as any;
await prisma.project.upsert({ create: projectData, ... });
```

**Lecție:** Orice schimbare de schemă Prisma trebuie reflectată și în seed.ts. Testează seed-ul local înainte de deploy (`npx ts-node database/seed.ts`).

---

## 5. Login-ul nu funcționa pe AWS (user admin inexistent)

**Simptom:** Pagina de login returna "invalid credentials" pe producție, deși funcționa local.

**Cauza:** `Dockerfile.prod` rula `prisma db push` (schema) dar NU și `seed.ts`. Utilizatorul admin (cu email și parolă hash) nu era niciodată creat în baza de date de pe EC2.

**Soluție:** Adăugat seed-ul în CMD-ul Dockerfile.prod:
```dockerfile
CMD ["sh", "-c", "cd /app/database && npx prisma db push ... && npx ts-node seed.ts && cd /app && npm run dev:backend"]
```

**Lecție:** Seed-ul nu e opțional — fără el, utilizatorul admin nu există. Seed-ul cu `upsert` e idempotent (sigur să rulezi de mai multe ori), deci e ok să-l pui în startup.

---

## 6. JWT_SECRET lipsă pe EC2

**Simptom:** Backend-ul pornea dar arunca `Error: secretOrPrivateKey must have a value` la primul request de autentificare.

**Cauza:** GitHub Secrets `JWT_SECRET` și `JWT_REFRESH_SECRET` nu erau configurate. Deploy workflow-ul le scria ca string gol în `.env`-ul de pe EC2.

**Soluție:** Adăugat `JWT_SECRET` și `JWT_REFRESH_SECRET` în GitHub Settings → Secrets → Actions.

**Lecție:** Verifică întotdeauna că **toate** variabilele din `.env`-ul local sunt și în GitHub Secrets înainte de primul deploy.

---

## 7. n8n workflow 404 la webhook

**Simptom:** `curl` la webhook URL returna 404, deși n8n rula.

**Cauza (multiplă):**

**a) Workflow Draft:** Webhookurile se înregistrează doar când workflow-ul e Published + Active. Simpla salvare lasă workflow-ul în Draft.

**b) URL greșit:** Am testat cu workflow ID (`Z1FhuTqHTphEqcqS`) în loc de webhook ID (`b036d94a-...`). Sunt două ID-uri diferite. URL-ul corect folosește webhook ID-ul din nodul Chat Trigger.

**Soluție:**
1. Publish → butonul din editor
2. Active → toggle-ul din dreapta sus
3. URL corect: `http://n8n:5678/webhook/{webhookId}/chat` unde `webhookId` e din configurația nodului Chat Trigger

**Lecție:** Verifică logurile n8n (`docker logs n8n`) — îți arată exact ce webhook e sau nu e înregistrat. Diferența dintre Published și Active e non-intuitivă și cel mai frecvent motiv de 404.

---

## 8. AI-ul confuz cu datele (credea că e în 2024)

**Simptom:** AI-ul spunea că "November 2024 este în viitor" când de fapt e mai 2026.

**Cauza:** Modelul Gemini nu știe data curentă din context. Data lui de antrenament e trecută, și nu i-am furnizat data curentă în system prompt.

**Soluție:** Adăugat la începutul system prompt-ului:
```
Today's date: {{ $now.format('MMMM D, YYYY') }}.
```

**Lecție:** Modelele AI nu știu data curentă dacă nu le-o spui explicit. Pentru orice aplicație care lucrează cu date, adaugă data curentă în system prompt.

---

---

## 9. nginx `systemctl reload` pica la primul deploy

**Simptom:** GitHub Actions arunca eroare la pasul de nginx: `Failed to reload nginx: Unit nginx.service not found`.

**Cauza:** `systemctl reload` funcționează doar dacă nginx e deja pornit. La primul deploy, nginx nu era instalat/activ, deci reload-ul eșua cu "Unit not found".

**Soluție:** Creat funcția `nginx_apply()` în `scripts/setup-nginx.sh`:
```bash
nginx_apply() {
  nginx -t && (systemctl is-active --quiet nginx && systemctl reload nginx || systemctl start nginx)
}
```
Verifică dacă nginx e activ — dacă da, reload; dacă nu, start.

**Lecție:** Nu presupune că un serviciu e deja pornit în scripts de setup. Verifică starea și acționează în funcție de ea.

---

## 10. Conflict port 80 — Docker vs nginx

**Simptom:** Docker compose nu pornea: `Bind for 0.0.0.0:80 failed: port already in use`.

**Cauza:** Deploy workflow-ul pornea mai întâi nginx (care lua portul 80), apoi Docker care încerca să bind-eze pe același port.

**Soluție:**
1. Mutat Docker compose UP **înaintea** pasului de nginx setup în workflow
2. Schimbat portul frontend în `docker-compose.prod.yml` din `0.0.0.0:80:80` în `127.0.0.1:8080:80` — nginx este cel care ascultă pe portul 80 public și proxy-iază spre 8080

**Lecție:** nginx trebuie să fie singurul proces care ascultă pe portul 80. Toate containerele Docker trebuie bind-uite pe `127.0.0.1` și porturi diferite.

---

## 11. Certbot pica pe IP bare (fără domeniu)

**Simptom:** `setup-nginx.sh` arunca eroare: `Error: Let's Encrypt cannot issue certificates for IP addresses`.

**Cauza:** Let's Encrypt nu emite certificate SSL pentru adrese IP — doar pentru domenii DNS.

**Soluție:** Adăugat detecție de IP în `setup-nginx.sh`:
```bash
if [[ "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  DOMAIN=""
fi
```
Dacă `DOMAIN` e un IP, se ignoră și se folosește config HTTP-only. Certbot nu e apelat.

**Lecție:** SSL e legat de domenii, nu de IP-uri. Dacă nu ai domeniu, nginx rulează HTTP-only — certificatul se adaugă după ce atașezi un domeniu.

---

## 12. Health check timeout (deploy pica după 15s)

**Simptom:** GitHub Actions raporta "Health check failed" după deploy, deși backend-ul funcționa.

**Cauza:** `sleep 15` era insuficient — build-ul Docker (compilare TypeScript, prisma generate, migrate deploy, seed) durează 45-90 secunde pe un t3.micro.

**Soluție:** Mărit `sleep 15` la `sleep 45` și adăugat fallback în caz de eșec:
```bash
sleep 45
curl -f http://localhost:3000/api/health || (docker compose -f docker-compose.prod.yml logs backend --tail=30 && exit 1)
```

**Lecție:** Health check timeout-ul trebuie calibrat la timpul real de startup, nu la o valoare arbitrară. Adaugă `docker logs` în caz de eșec ca să diagnostichezi rapid.

---

## 13. Prisma P3005 — DB creată fără istoric de migrări

**Simptom:** `prisma migrate deploy` eșua cu `P3005: The database schema is not empty`.

**Cauza:** Baza de date fusese creată cu `prisma db push` (care aplică schema direct, fără a crea tabelul `_prisma_migrations`). Când am trecut la `migrate deploy`, Prisma a detectat că schema există dar nu are istoric de migrări și a refuzat să continue.

**Soluție:** Adăugat baseline în CMD-ul Dockerfile.prod:
```bash
npx prisma migrate deploy || (
  npx prisma migrate resolve --applied '20260502103912_add_content_schema' && 
  npx prisma migrate deploy
)
```
Dacă deploy-ul pică, se marchează prima migrare ca deja aplicată (baseline), apoi se face deploy din nou.

**Lecție:** `db push` și `migrate` nu sunt interschimbabile. Dacă pornești cu `db push`, trebuie să faci baseline înainte de a trece la `migrate deploy`.

---

## 14. TS5011 — ts-node nu pornea în monorepo

**Simptom:** `npx ts-node --transpile-only index.ts` arunca `TS5011: rootDir is expected to contain all source files`.

**Cauza:** Backend-ul importa din `@monorepo/database` (pachet workspace din `../database/`). TypeScript vedea fișiere din afara directorului `backend/` și nu putea determina layout-ul de output fără `rootDir` și `outDir` explicit.

**Notă importantă:** `--transpile-only` sare peste type checking, dar NU și peste erorile de configurare. TS5011 e o eroare de config, nu de tip — apare indiferent de modul de transpilare.

**Soluție:** Adăugat în `backend/tsconfig.json`:
```json
"rootDir": "..",
"outDir": "./dist"
```
`rootDir: ".."` = rădăcina monorepo-ului, care cuprinde atât `backend/` cât și `database/`.

**Lecție:** Când backend-ul importă din pachete workspace sibling, `rootDir` trebuie setat la directorul comun (monorepo root), nu la directorul backend-ului.

---

## 15. Erori TypeScript în CI — `exactOptionalPropertyTypes`

**Simptom:** Build-ul GitHub Actions pica cu erori TypeScript în `routes/auth.ts` și `routes/internal.ts`.

**Cauza:** `tsconfig.json` are `"exactOptionalPropertyTypes": true`. Aceasta înseamnă că un câmp opțional `field?: string` acceptă `string | undefined`, dar nu acceptă `null`. Două probleme concrete:
1. JWT cast: `jwt.verify()` returnează `string | JwtPayload` — nu putea fi cast direct la `{ sub: number }`
2. Spread de obiecte cu câmpuri opționale: valorile `undefined` nu pot fi asignate unde se așteaptă `null`

**Soluție:**
```typescript
// auth.ts
const payload = jwt.verify(token, secret) as unknown as { sub: number };

// internal.ts — explicit mapping cu ?? null în loc de spread
const data = {
  field: source.field ?? null,
};
```

**Lecție:** `exactOptionalPropertyTypes` este strict — `undefined` și `null` nu sunt interschimbabile. Folosește `?? null` când trebuie să convertești `undefined` în `null`.

---

## 16. 400 Bad Request pe `/api/admin/ai-chat`

**Simptom:** Frontend-ul primea 400 la trimiterea unui mesaj în AI chat.

**Cauza:** Frontend-ul genera session ID cu `Math.random().toString(36)` care producea stringuri de forma `0.abc123` — nu UUID. Backend-ul valida cu `z.string().uuid()` → validare pica.

**Soluție:**
- Backend: relaxat validarea la `z.string().min(1).max(100)` — session ID poate fi orice string valid
- Frontend: schimbat la `crypto.randomUUID()` pentru ID-uri proper UUID

**Lecție:** Dacă schimbi formatul unui câmp, actualizează și validarea de pe server sau invers. Cel mai bine: definește formatul într-un singur loc (shared schema).

---

## 17. `crypto.randomUUID is not a function` pe HTTP

**Simptom:** `TypeError: crypto.randomUUID is not a function` în browser la accesarea paginii AI chat.

**Cauza:** `crypto.randomUUID()` face parte din Web Crypto API și e disponibil **doar în secure contexts** (HTTPS sau localhost). Site-ul rula pe `http://13.60.216.226` (IP bare, HTTP) — context nesigur, funcția lipsea.

**Soluție:** Fallback la UUID v4 bazat pe `Math.random()` când `crypto.randomUUID` nu e disponibil:
```typescript
private generateSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

**Lecție:** Orice API din categoria "secure context" (crypto, clipboard, geolocation) pică pe HTTP. Adaugă fallback sau pune SSL.

---

## 18. n8n webhook returnează 404 — workflow în Draft

**Simptom:** `curl` la webhook URL returna 404. n8n rula, workflow-ul era "salvat".

**Cauza:** n8n face diferența între **Draft** și **Published**. Webhookurile de producție (`/webhook/...`) sunt înregistrate **doar** pentru workflow-uri Published. Draft-urile răspund doar la endpoint-ul de test (`/webhook-test/...`).

Logul care confirmă: `Processed 1 draft workflows, 0 published workflows.`

**Soluție:** În editorul n8n → butonul **Publish** (nu Save) → workflow-ul devine Published și webhook-ul se înregistrează.

**Lecție:** "Salvat" ≠ "Published" în n8n. Verifică logul de startup: `0 published workflows` = webhook-urile nu sunt active.

---

## 19. n8n workflow 500 — credențiale lipsă pe server

**Simptom:** Webhook-ul răspundea 500: `{"message":"Error in workflow"}`. Workflow-ul era Published și activ.

**Cauza:** Workflow-ul JSON conține ID-uri de credențiale hardcodate (`PFHjessTxN6jIW6c` pentru Google Gemini, `3Q6qqQoXEDY7a3MY` pentru Postgres). Aceste ID-uri aparțineau instanței n8n locale — pe serverul de producție, credențialele nu existau.

**Soluție:** În editorul n8n de pe server:
1. Deschis nodul **Google Gemini Chat Model** → dropdown credențiale → **Create new** → introdus API key-ul Gemini
2. Deschis nodul **Postgres Chat Memory** → **Create new** → introdus: Host: `postgres`, Port: `5432`, DB/User/Pass din `.env`
3. Save + Publish din nou

**Lecție:** Credențialele n8n nu se exportă cu workflow-ul — sunt stocate criptat în DB-ul n8n și legate de instanță. La orice instanță nouă (server nou, reinstalare), credențialele trebuie recreate manual.

---

## Checklist Pre-Deploy

Înainte de orice deploy pe EC2, verifică:

- [ ] Toate secretele GitHub sunt setate (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_PASSWORD`, `INTERNAL_API_KEY`, etc.)
- [ ] `N8N_CHAT_WEBHOOK_URL` folosește `http://n8n:5678/webhook/{webhookId}/chat` (nu `localhost`, nu workflow ID)
- [ ] Workflow-ul n8n e **Published** (nu doar salvat) pe instanța de producție
- [ ] Credențialele n8n (Google Gemini, Postgres) sunt configurate pe instanța de producție
- [ ] `seed.ts` nu are erori TypeScript (testează local)
- [ ] Nu ai `.env`-ul local în `.gitignore`-ul cu excepții ciudate
- [ ] Frontend-ul nu folosește API-uri care necesită secure context (HTTPS) fără fallback
- [ ] Health check timeout e calibrat la timpul real de startup al backend-ului
