# Deploy pe AWS EC2 — Ghid Complet

## Infrastructura

- **Server:** AWS EC2 (Ubuntu)
- **IP public:** `13.60.216.226`
- **Deploy:** GitHub Actions (CI/CD automat)
- **Web server:** nginx (proxy invers + servire fișiere statice)

---

## Cum Funcționează Deploy-ul

### Fluxul complet
```
1. Faci push pe branch main
2. Mergi manual la GitHub Actions → "Deploy to AWS EC2" → "Run workflow"
3. GitHub Actions:
   a. Checkout cod
   b. Instalează dependențe Node.js
   c. Buildează frontend-ul Angular
   d. Configurează SSH cu cheia privată
   e. Copiază scripturi pe EC2
   f. Rulează setup (instalare Docker, nginx etc.) pe EC2
   g. Scrie fișierul .env pe EC2 (din GitHub Secrets)
   h. Sincronizează fișierele cu rsync (excluzând node_modules, .git, .env)
   i. Pe EC2: docker compose up -d --build --remove-orphans
```

### De ce `workflow_dispatch` (manual)?
Deploy-ul e configurat să ruleze **manual** (nu automat la fiecare push). Asta e o decizie deliberată — nu vrei ca fiecare commit mic să trigghereze un deploy complet pe producție.

---

## GitHub Secrets

Secretele sunt variabile sensibile stocate criptat în GitHub. Nu apar niciodată în cod sau loguri.

**Toate secretele necesare:**

| Secret | Descriere |
|---|---|
| `EC2_HOST` | IP-ul serverului (`13.60.216.226`) |
| `EC2_USERNAME` | Userul SSH (`ubuntu`) |
| `EC2_SSH_KEY` | Cheia privată SSH completă (inclusiv `-----BEGIN...-----`) |
| `POSTGRES_USER` | Userul PostgreSQL |
| `POSTGRES_PASSWORD` | Parola PostgreSQL |
| `POSTGRES_DB` | Numele bazei de date |
| `JWT_SECRET` | Cheia pentru semnarea token-urilor JWT |
| `JWT_REFRESH_SECRET` | Cheia pentru refresh token-uri JWT |
| `ADMIN_PASSWORD` | Parola pentru loginul în panoul de admin |
| `INTERNAL_API_KEY` | Cheia pentru comunicarea n8n → Backend |
| `N8N_WEBHOOK_ID` | Webhook ID-ul din nodul Chat Trigger al n8n |

---

## Fișierul .env pe EC2

GitHub Actions generează automat `.env`-ul pe server la fiecare deploy. **Nu copiezi manual `.env`-ul local pe server** — ar fi un risc de securitate (dacă `.env`-ul local ar ajunge în repo).

Ce conține `.env`-ul generat pe EC2 (din workflow):
```env
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_DB=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
ADMIN_PASSWORD=...
ALLOWED_ORIGINS=http://13.60.216.226
INTERNAL_API_KEY=...
N8N_CHAT_WEBHOOK_URL=http://n8n:5678/webhook/{N8N_WEBHOOK_ID}/chat
N8N_HOST=13.60.216.226
N8N_WEBHOOK_URL=http://13.60.216.226:5678/
```

**Observație importantă:** `N8N_CHAT_WEBHOOK_URL` folosește `n8n:5678` (numele serviciului Docker), nu `localhost`. Backend-ul rulează în container și nu poate folosi `localhost` pentru a ajunge la n8n — trebuie numele serviciului din rețeaua Docker.

---

## rsync — Sincronizarea Fișierelor

```bash
rsync -az --delete --exclude 'node_modules' --exclude '.git' \
      --exclude 'database/data' --exclude '.env' \
      ./ ubuntu@13.60.216.226:~/app/
```

- `--delete` — șterge fișierele de pe server care nu mai există local
- `--exclude '.env'` — **CRITIC** — nu suprascrie `.env`-ul de pe server cu cel local
- `--exclude 'node_modules'` — nu sincronizezi cele zeci de mii de fișiere node_modules

---

## Startup-ul Backend-ului pe Producție

La fiecare pornire a containerului backend (`CMD` din `Dockerfile.prod`):
```sh
cd /app/database && npx prisma db push --schema prisma/schema.prisma --accept-data-loss
npx ts-node seed.ts
cd /app && npm run dev:backend
```

1. **`prisma db push`** — sincronizează schema bazei de date (adaugă tabele noi, coloane noi)
2. **`ts-node seed.ts`** — rulează seed-ul (upsert — nu suprascrie date existente, doar creează ce lipsește)
3. **pornire backend** — serverul Express

**De ce seed la fiecare pornire?** Seed-ul folosește `upsert` (insert sau update dacă există). E sigur să-l rulezi de oricâte ori — nu duplică date. Avantajul: dacă schimbi parola admin în GitHub Secrets și faci redeploy, parola se actualizează automat.

---

## Accesul la n8n pe EC2

Pe producție, portul 5678 al n8n nu e accesibil public (legat la `127.0.0.1`). Pentru a accesa interfața n8n de pe calculatorul tău:

```bash
ssh -L 5678:localhost:5678 ubuntu@13.60.216.226
```

Acum deschizi `http://localhost:5678` în browser — traficul e tunelat prin SSH la serverul EC2.

---

## Prima Configurare a n8n pe EC2

Aceasta se face o singură dată după primul deploy:

1. **Conectează-te la n8n** prin SSH tunnel (vezi mai sus)
2. **Creează cont** în interfața n8n (primul utilizator devine admin)
3. **Importă workflow-ul:**
   - În n8n local: meniu `⋮` → "Download" → salvezi JSON-ul
   - Pe n8n EC2: meniu `⋮` → "Import from file" → selectezi JSON-ul
4. **Adaugă credențialele:**
   - Settings → Credentials → New
   - Google Gemini API: adaugi cheia API
   - PostgreSQL: adaugi conexiunea la baza de date
5. **Activează workflow-ul:** butonul Publish + toggle Active

**Workflow-ul nu se deployează automat** — e stocat în baza de date n8n (volumul `n8n_data`) și trebuie configurat manual o singură dată.

---

## Troubleshooting pe EC2

### 502 Bad Gateway
Backend-ul nu răspunde. Verifică:
```bash
cd ~/app && docker compose -f docker-compose.prod.yml logs backend --tail 50
```

### Schimbat parola admin sau un secret
1. Actualizezi secretul în GitHub Settings → Secrets
2. Rulezi din nou deploy-ul din GitHub Actions
3. La restart, seed-ul actualizează parola automat

### Recriat containerul manual
```bash
cd ~/app
docker compose -f docker-compose.prod.yml up -d --force-recreate backend
```

### Văzut toate containerele
```bash
docker compose -f docker-compose.prod.yml ps
```

### Intrat în containerul backend
```bash
docker compose -f docker-compose.prod.yml exec backend sh
```
