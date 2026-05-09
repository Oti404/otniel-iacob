# Operations & Deployment Guide

Ghid operațional real pentru proiectul portfolio — cum se deployează, cum se accesează, ce trebuie configurat.

---

## 1. Deployment automat (GitHub Actions)

Orice push pe `main` declanșează automat pipeline-ul de deploy:

```
push → main
  ├── npm ci + build frontend (CI check)
  ├── SSH la EC2
  ├── setup-ec2.sh    — instalare Docker (skip dacă există)
  ├── scrie .env din GitHub Secrets
  ├── rsync fișiere la ~/app/
  ├── docker compose -f docker-compose.prod.yml up -d --build   ← Docker ÎNAINTE de nginx
  ├── setup-nginx.sh  — instalare nginx + SSL (idempotent)       ← nginx DUPĂ Docker
  └── curl localhost:3000/api/health  (health check, sleep 45s)
```

**Notă ordine:** Docker compose pornește înainte de nginx — nginx proxy-iază spre containerele deja pornite. Inversul cauzează conflict pe portul 80.

**Workflow:** `.github/workflows/deploy-aws.yml`

---

## 2. Infrastructură curentă (EC2)

| Componentă | Locație | Port |
|---|---|---|
| nginx (host) | EC2 Ubuntu | 80 (public), 443 când SSL activ |
| Frontend (Docker) | 127.0.0.1:8080 | intern |
| Backend Express (Docker) | 127.0.0.1:3000 | intern |
| PostgreSQL (Docker) | intern (fără port extern) | intern |
| n8n (Docker) | 127.0.0.1:5678 | intern, acces via SSH tunnel |

**Server:** AWS EC2 `13.60.216.226`  
**Acces SSH:** `ssh -i key.pem ubuntu@13.60.216.226`  
**Acces n8n:** `ssh -i key.pem -N -L 5678:127.0.0.1:5678 ubuntu@13.60.216.226` → browser la `http://localhost:5678`

---

## 3. GitHub Secrets necesare

| Secret | Valoare exemplu | Obligatoriu |
|---|---|---|
| `EC2_SSH_KEY` | conținut fișier `.pem` | da |
| `EC2_USERNAME` | `ubuntu` | da |
| `EC2_HOST` | `13.60.216.226` | da |
| `POSTGRES_USER` | `admin` | da |
| `POSTGRES_PASSWORD` | parolă puternică | da |
| `POSTGRES_DB` | `monorepodb` | da |
| `JWT_SECRET` | min 32 chars random | da |
| `JWT_REFRESH_SECRET` | min 32 chars random | da |
| `ADMIN_PASSWORD` | parola panoului admin | da |
| `ALLOWED_ORIGINS` | `http://13.60.216.226` | da |
| `INTERNAL_API_KEY` | min 32 chars random | da |
| `N8N_WEBHOOK_ID` | UUID din workflow n8n | da |
| `EC2_DOMAIN` | `portofoliu.ro` | opțional — activează SSL |
| `CERTBOT_EMAIL` | email pentru Let's Encrypt | opțional — cu EC2_DOMAIN |

**Generare secret random:** `openssl rand -hex 32`

---

## 4. Upgrade la HTTPS (când ai domeniu)

1. DNS: A record `portofoliu.ro` → `13.60.216.226`
2. GitHub Secrets: adaugă `EC2_DOMAIN=portofoliu.ro` și `CERTBOT_EMAIL=email@gmail.com`
3. Actualizează `ALLOWED_ORIGINS=https://portofoliu.ro`
4. Push orice modificare pe `main` — certbot obține cert automat, nginx trece pe HTTPS

---

## 5. Comenzi utile pe EC2

```bash
# Status containere
sudo docker compose -f ~/app/docker-compose.prod.yml ps

# Logs backend
sudo docker compose -f ~/app/docker-compose.prod.yml logs backend -f

# Restart un serviciu
sudo docker compose -f ~/app/docker-compose.prod.yml restart backend

# Health check manual
curl http://localhost:3000/api/health

# Status nginx
sudo systemctl status nginx
sudo nginx -t   # validare config
```

---

## 6. Rollback

```bash
# Pe EC2 — revert la imaginea anterioară
cd ~/app
git log --oneline -5
git checkout <commit-hash>
sudo docker compose -f docker-compose.prod.yml up -d --build
```

---

## 7. Arhitectura viitoare (planificată)

Documentul `docs/infrastructure/AWS_DEPLOYMENT.md` descrie planul de migrare la ECS Fargate + RDS pentru scalabilitate. Configurarea curentă EC2 single-instance este suficientă pentru un portfolio personal.
