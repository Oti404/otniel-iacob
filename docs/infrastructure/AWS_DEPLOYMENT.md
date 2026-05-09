# Arhitectura AWS — Implementare Actuală

**Notă:** Documentul original descria un plan ECS Fargate + RDS care nu a fost implementat. Această versiune reflectă arhitectura reală în producție.

---

## Arhitectura curentă (EC2 single-instance)

```
Internet
    │
    ▼
[ nginx ] ← port 80 public (443 când SSL activ)
    │
    ├── /api/          → 127.0.0.1:3000  (backend Express)
    ├── /uploads/      → 127.0.0.1:3000  (fișiere statice)
    ├── /api/internal/ → 403 BLOCAT      (Docker-only, nu public)
    └── /             → 127.0.0.1:8080  (frontend Angular)

Docker Compose (monorepo-net):
    ├── backend   — Express + TypeScript (ts-node --transpile-only)
    ├── frontend  — Angular build servit de nginx intern
    ├── postgres  — PostgreSQL 15 (fără port extern)
    └── n8n       — Automation (127.0.0.1:5678, SSH tunnel only)
```

**Server:** AWS EC2 t3.micro, Ubuntu 24.04  
**IP:** `13.60.216.226`  
**Cost:** Gratuit (Free Tier 12 luni)

---

## De ce nu ECS Fargate?

ECS Fargate + RDS este arhitectura corectă pentru aplicații cu trafic real. Pentru un portfolio personal cu un singur admin:
- EC2 t3.micro este suficient și gratuit
- Complexitatea ECS (task definitions, IAM roles, ECR, ALB) nu aduce valoare la această scală
- Migrarea la ECS rămâne posibilă în viitor fără schimbări majore de cod

---

## Upgrade la HTTPS (când ai domeniu)

1. Cumpără/configurează domeniu → A record → `13.60.216.226`
2. Adaugă în GitHub Secrets: `EC2_DOMAIN=portofoliu.ro` și `CERTBOT_EMAIL=email@gmail.com`
3. Actualizează `ALLOWED_ORIGINS=https://portofoliu.ro`
4. Push orice modificare pe `main` → certbot obține cert Let's Encrypt automat → nginx trece pe HTTPS

**Notă:** Let's Encrypt nu emite certificate pentru IP-uri bare — necesită domeniu DNS.

---

## Securitate rețea

| Regula Security Group EC2 | Port | Sursă |
|---|---|---|
| SSH | 22 | Orice (0.0.0.0/0) |
| HTTP | 80 | Orice (0.0.0.0/0) |
| HTTPS | 443 | Orice (0.0.0.0/0) |

Porturile interne (3000, 5678, 5432) nu sunt expuse public — legate la `127.0.0.1` în Docker Compose.

---

## Plan viitor (dacă traficul crește)

| Componentă | Actuală | Viitoare |
|---|---|---|
| Compute | EC2 t3.micro | ECS Fargate |
| DB | PostgreSQL în Docker | RDS PostgreSQL |
| Secrets | GitHub Secrets | AWS Secrets Manager |
| CDN | — | CloudFront |
| Images | Build pe EC2 | ECR + build în CI |
