# Operations & Deployment Guide

This document covers everything related to running, syncing, and deploying the portfolio project.

---

## 1. Deployment Guide
**Prerequisites**: Docker, Node.js, Access credentials.

**Steps**:
1. Build the project.
2. Deploy the backend.
3. Deploy the frontend.
4. Verify Deployment.

**Rollback**: Revert to previous stable version in case of failure.

---

## 2. Project Synchronization
**GitHub**: `git pull origin main` to sync with remote.
**Database**: Pull latest schema/seed data locally.
**Environment**: Safely update `.env` files.

---

## 3. External Deployment Sites
**Frontend**: [Vercel/Netlify/Render]
**Backend**: [Render/Heroku/AWS]
**Database**: [Supabase/MongoDB Atlas]
**Automation**: n8n hosted on [Provider].

---

## 4. GitHub Repository Info
**Branching**: `main` (stable), `dev` (active development), `feature/*`.
**Pull Requests**: PR against `dev`, pass tests/linters, request reviews.
**Issues**: Use bug/feature labels.
