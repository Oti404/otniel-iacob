# Docker — Ghid de Concepte

## Ce este Docker?

Docker este o platformă care îți permite să rulezi aplicații în **containere** — medii izolate, portabile, care conțin tot ce are nevoie aplicația să funcționeze (cod, runtime, librării, configurație).

**Analogie:** Un container Docker e ca o cutie sigilată. Indiferent pe ce calculator deschizi cutia, conținutul ei e identic și funcționează la fel.

---

## Concepte de Bază

### Image (Imagine)
Un **template** read-only din care se creează containere. E ca un "snapshot" al unei aplicații.

- Se construiește cu `docker build` pe baza unui `Dockerfile`
- Se descarcă din Docker Hub (`docker pull`)
- Exemplu: `node:20-alpine`, `postgres:15-alpine`, `nginx:alpine`

### Container
O instanță **rulabilă** a unei imagini. Poți crea mai multe containere din aceeași imagine.

- Pornit cu `docker run` sau `docker compose up`
- Are propriul sistem de fișiere, rețea, procese
- **Starea nu se păstrează** la restart — dacă ștergi un container, datele din el dispar (de aceea avem volume)

### Dockerfile
Fișier cu instrucțiuni pentru a construi o imagine personalizată.

**Exemplu (backend-ul nostru):**
```dockerfile
FROM node:20-alpine          # pornești de la o imagine de bază
WORKDIR /app                 # directorul de lucru în container
COPY package*.json ./        # copiezi doar package.json mai întâi (cache)
RUN npm install              # instalezi dependențele
COPY . .                     # copiezi restul codului
EXPOSE 3000                  # documentezi portul (nu îl deschide efectiv)
CMD ["node", "index.js"]     # comanda care pornește aplicația
```

### Volume
Mecanismul prin care **persistezi date** în afara containerului. Un volume e un director montat între host și container.

```yaml
volumes:
  - db_data:/var/lib/postgresql/data   # date PostgreSQL → persisted
  - uploads_data:/app/uploads          # fișiere uploadate → persisted
  - n8n_data:/home/node/.n8n           # configurație n8n → persisted
```

Fără volume: când ștergi/recrți containerul PostgreSQL, baza de date dispare.
Cu volume: datele supraviețuiesc oricând recreezi containerul.

### Network (Rețea)
Rețeaua internă Docker prin care containerele comunică între ele.

În proiectul nostru, toate containerele sunt pe `monorepo-net`:
- Backend-ul apelează PostgreSQL la `postgres:5432` (nu `localhost`)
- Backend-ul apelează n8n la `n8n:5678` (nu `localhost`)
- Din exterior, `localhost` nu funcționează între containere

**Regulă importantă:** Containerele se "văd" între ele prin **numele serviciului** din docker-compose, nu prin `localhost`.

---

## docker-compose

`docker-compose` orchestrează mai multe containere simultan. Configurația e în `docker-compose.yml`.

### Structura unui serviciu
```yaml
services:
  backend:
    build:
      context: .                        # de unde construiești
      dockerfile: backend/Dockerfile   # ce Dockerfile folosești
    restart: always                     # repornește automat la crash
    ports:
      - "3000:3000"                     # host:container
    environment:
      - NODE_ENV=production             # variabile de mediu hardcodate
    env_file:
      - .env                            # variabile din fișier
    networks:
      - monorepo-net                    # rețeaua internă
    volumes:
      - uploads_data:/app/uploads       # volume persistente
    depends_on:
      - postgres                        # pornește după postgres
```

### Comenzi esențiale
```bash
docker compose up -d              # pornești toate containerele în background
docker compose up -d --build      # reconstruiești imaginile și pornești
docker compose down               # oprești și ștergi containerele
docker compose logs backend       # vezi logurile unui serviciu
docker compose logs -f backend    # urmărești logurile live (follow)
docker compose restart backend    # repornești un serviciu
docker compose exec backend sh    # deschizi un shell în container
```

---

## env_file vs environment vs dotenv

Sunt trei moduri de a pasa variabile de mediu și se comportă diferit:

### 1. `environment` în docker-compose
```yaml
environment:
  - PORT=3000
  - NODE_ENV=production
```
- Valorile sunt hardcodate în docker-compose.yml
- Pot folosi variabile din `.env` de pe host: `- JWT_SECRET=${JWT_SECRET}`

### 2. `env_file` în docker-compose
```yaml
env_file:
  - .env
```
- Citeste fișierul `.env` și injectează **toate** variabilele în container
- Se citesc la **crearea containerului** (`docker compose up`), nu la restart
- **Important:** `docker restart` NU reîncarcă env_file. Trebuie `docker compose up -d --force-recreate`.

### 3. `dotenv.config()` în cod (Node.js)
```typescript
dotenv.config({ path: path.resolve(__dirname, '../.env') });
```
- Citește fișierul `.env` direct din cod
- Dar **nu suprascrie** variabilele deja setate în mediu (env_file are prioritate)
- Util în development când nu folosești docker-compose

**Prioritate:** `environment` > `env_file` > `dotenv.config()`

---

## Port Binding

```yaml
ports:
  - "80:80"                    # public — accesibil de oriunde
  - "3000:3000"                # public — accesibil de oriunde
  - "127.0.0.1:5678:5678"     # doar localhost — nu e accesibil din internet
  - "5433:5432"                # mapezi portul extern 5433 la intern 5432
```

**De ce n8n e pe `127.0.0.1:5678`?**
Pe producție, nu vrei ca oricine să acceseze interfața n8n din internet. Legând la `127.0.0.1`, portul e disponibil doar de pe serverul însuși. Îl accesezi prin SSH tunnel:
```bash
ssh -L 5678:localhost:5678 ubuntu@13.60.216.226
# Acum deschizi http://localhost:5678 pe calculatorul tău
```

---

## Cache-ul Docker

Când construiești o imagine, Docker **cacheaza** fiecare pas din Dockerfile. Dacă un pas nu s-a schimbat față de build-ul anterior, îl sare.

**Avantaj:** Build-uri mult mai rapide.

**Dezavantaj:** Uneori cache-ul "mintă" — folosești o versiune veche fără să știi.

**Regulă de aur în Dockerfile:**
```dockerfile
COPY package*.json ./    # ← copiezi DOAR package.json mai întâi
RUN npm install          # ← npm install se face din cache dacă package.json n-a schimbat

COPY . .                 # ← copiezi restul codului DUPĂ install
                         # dacă codul se schimbă, doar ultimii pași sunt reexecutați
```

Dacă `COPY . .` ar fi înainte de `RUN npm install`, orice schimbare de cod ar invalida cache-ul și ai reinstala toate dependențele de la zero la fiecare build.

---

## Diferența local vs prod

| | `docker-compose.yml` (local) | `docker-compose.prod.yml` (AWS) |
|---|---|---|
| Porturi publice | 3000, 5678, 5433, 80 | doar 80 (+ 127.0.0.1:5678) |
| Backend Dockerfile | `backend/Dockerfile` | `backend/Dockerfile.prod` |
| Frontend Dockerfile | `frontend/Dockerfile` | `frontend/Dockerfile.prod` |
| PostgreSQL port | 5433 expus | nu e expus extern |
| n8n port | 5678 public | 127.0.0.1:5678 (local only) |

Pe producție, securitatea contează — minimizezi suprafața de atac expunând cât mai puține porturi.

---

## Ce Mai Trebuie Să Înveți despre Docker

- **Multi-stage builds** — imagini mai mici prin construire în etape (frontend-ul nostru deja folosește asta)
- **Docker networks** — tipuri de rețele (bridge, host, overlay)
- **Health checks** — cum Docker verifică dacă un container e sănătos
- **Docker secrets** — alternativă mai sigură la env_file pentru producție
- **Registry privat** — stocarea imaginilor tale pe un server privat
