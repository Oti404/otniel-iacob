# Operations & Deployment Guide

---

## 1. Automatic deployment (GitHub Actions)

Every push to `main` triggers the deploy pipeline automatically:

```
push → main
  ├── npm ci + build frontend (CI check)
  ├── SSH to EC2
  ├── setup-ec2.sh    — install Docker (skip if exists)
  ├── write .env from GitHub Secrets
  ├── rsync files to ~/app/
  ├── docker compose -f docker-compose.prod.yml up -d --build   ← Docker BEFORE nginx
  ├── setup-nginx.sh  — install nginx + SSL (idempotent)        ← nginx AFTER Docker
  └── curl localhost:3000/api/health  (health check, sleep 45s)
```

**Order note:** Docker Compose starts before nginx — nginx proxies to already-running containers. Reversing the order causes a port 80 conflict.

**Workflow:** `.github/workflows/deploy-aws.yml`

---

## 2. Current infrastructure (EC2)

| Component | Location | Port |
|---|---|---|
| nginx (host) | EC2 Ubuntu | 80 (public), 443 when SSL active |
| Frontend (Docker) | 127.0.0.1:8080 | internal |
| Backend Express (Docker) | 127.0.0.1:3000 | internal |
| PostgreSQL (Docker) | internal (no host port) | internal |
| n8n (Docker) | 127.0.0.1:5678 | internal, access via SSH tunnel |

**Server:** AWS EC2 `13.60.216.226`  
**SSH:** `ssh -i key.pem ubuntu@13.60.216.226`  
**n8n access:** `ssh -i key.pem -N -L 5678:127.0.0.1:5678 ubuntu@13.60.216.226` → browser at `http://localhost:5678`

---

## 3. GitHub Secrets required

### Core

| Secret | Example / Notes | Required |
|---|---|---|
| `EC2_SSH_KEY` | contents of `.pem` file | yes |
| `EC2_USERNAME` | `ubuntu` | yes |
| `EC2_HOST` | `13.60.216.226` | yes |
| `POSTGRES_USER` | `admin` | yes |
| `POSTGRES_PASSWORD` | strong password | yes |
| `POSTGRES_DB` | `monorepodb` | yes |
| `JWT_SECRET` | min 32 chars random | yes |
| `JWT_REFRESH_SECRET` | min 32 chars random | yes |
| `JWT_SUBSCRIBER_SECRET` | min 32 chars random, different from JWT_SECRET | yes |
| `ADMIN_PASSWORD` | admin panel password | yes |
| `ALLOWED_ORIGINS` | `http://13.60.216.226` | yes |
| `INTERNAL_API_KEY` | min 32 chars random | yes |
| `N8N_WEBHOOK_ID` | UUID from n8n workflow | yes |
| `FRONTEND_URL` | `http://13.60.216.226` (or domain if SSL) | yes |

### Adventures — Cloudinary

| Secret | Notes | Required |
|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | from cloudinary.com dashboard | for media uploads |
| `CLOUDINARY_API_KEY` | | for media uploads |
| `CLOUDINARY_API_SECRET` | | for media uploads |

### Adventures — Google OAuth

| Secret | Notes | Required |
|---|---|---|
| `GOOGLE_CLIENT_ID` | from Google Cloud Console | for subscriber login |
| `GOOGLE_CLIENT_SECRET` | | for subscriber login |
| `GOOGLE_CALLBACK_URL` | `https://domain/api/auth/google/callback` | for subscriber login |

### Adventures — Web Push

| Secret | Notes | Required |
|---|---|---|
| `VAPID_PUBLIC_KEY` | generated with `npx web-push generate-vapid-keys` | for push notifications |
| `VAPID_PRIVATE_KEY` | keep private, never rotate unless resetting all subs | for push notifications |
| `VAPID_SUBJECT` | `mailto:otnieliacob@gmail.com` | for push notifications |

### SSL (optional)

| Secret | Notes | Required |
|---|---|---|
| `EC2_DOMAIN` | `portofoliu.ro` — activates SSL | optional |
| `CERTBOT_EMAIL` | email for Let's Encrypt | with EC2_DOMAIN |

**Generate random secret:** `openssl rand -hex 32`

---

## 4. Upgrade to HTTPS (when you have a domain)

1. DNS: A record `portofoliu.ro` → `13.60.216.226`
2. GitHub Secrets: add `EC2_DOMAIN=portofoliu.ro` and `CERTBOT_EMAIL=email@gmail.com`
3. Update `ALLOWED_ORIGINS=https://portofoliu.ro`
4. Update `GOOGLE_CALLBACK_URL=https://portofoliu.ro/api/auth/google/callback`
5. Update `FRONTEND_URL=https://portofoliu.ro`
6. Push any change to `main` — certbot gets cert automatically, nginx switches to HTTPS

---

## 5. Useful EC2 commands

```bash
# Container status
sudo docker compose -f ~/app/docker-compose.prod.yml ps

# Backend logs
sudo docker compose -f ~/app/docker-compose.prod.yml logs backend -f

# Restart a service
sudo docker compose -f ~/app/docker-compose.prod.yml restart backend

# Manual health check
curl http://localhost:3000/api/health

# nginx status
sudo systemctl status nginx
sudo nginx -t   # validate config
```

---

## 6. Rollback

```bash
# On EC2 — revert to previous image
cd ~/app
git log --oneline -5
git checkout <commit-hash>
sudo docker compose -f docker-compose.prod.yml up -d --build
```

---

## 7. Security posture (as of 2026-06-16)

Full audit at `docs/security/SECURITY-AUDIT-2026-06-16.md`. Current status:

- **Fixed:** C1 (admin auth bypass via shared JWT — subscriber tokens now use a separate `JWT_SUBSCRIBER_SECRET`), H1 (npm vulns), H2 (OAuth CSRF state), M1 (AI-chat rate limit), M2 (subscriber-auth rate limit), M3 (SVG upload removed), M4 (login/refresh split rate limits), L2/L3/L6
- **Accepted open:** L1 (`/api/health` DB disclosure), L5 (30d subscriber JWT)
- **Open:** L4 (SRI for CDN assets), I1–I6 (process improvements)
- `/api/internal/` blocked at nginx (returns 403 for all public requests)
- CSP, Permissions-Policy, HSTS preload active in nginx configs

---

## 8. Future architecture

`docs/infrastructure/AWS_DEPLOYMENT.md` describes the planned migration to ECS Fargate + RDS for scalability. The current single-instance EC2 setup is sufficient for a personal portfolio.
