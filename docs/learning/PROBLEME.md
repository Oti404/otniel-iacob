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

## Checklist Pre-Deploy

Înainte de orice deploy pe EC2, verifică:

- [ ] Toate secretele GitHub sunt setate (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_PASSWORD`, etc.)
- [ ] `N8N_WEBHOOK_ID` e ID-ul corect din nodul Chat Trigger (nu workflow ID)
- [ ] Workflow-ul n8n e Published + Active pe instanța locală
- [ ] `seed.ts` nu are erori TypeScript (testează local)
- [ ] Nu ai `.env`-ul local în `.gitignore`-ul cu excepții ciudate
