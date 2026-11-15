# Production Deployment Guide

Guide for deploying ProfileGuard on government cloud infrastructure (e.g., MeghRaj / NIC Cloud / Secure Dedicated Clusters).

## 1. Security Baseline

- **Secrets Handling:**
  - Store all production credentials in HashiCorp Vault or cloud KMS.
  - Set `APP_ENV=prod`.
  - Ensure `.env` is never committed and directory permissions on `/data/evidence` are restricted to the service user (`chmod 700`).
- **Network Boundaries:**
  - Database (PostgreSQL) and Redis queue must reside in private isolated subnets without public ingress.
  - Outbound traffic must be allowlisted strictly to official platform endpoints:
    - `api.x.com`
    - `graph.facebook.com`
    - `api.telegram.org`
    - `safebrowsing.googleapis.com`

## 2. Docker Compose Production Deployment

```bash
# 1. Clone repository onto deployment host
git clone https://github.com/itbp-cybershield/profileguard.git /opt/profileguard
cd /opt/profileguard

# 2. Configure production .env
cp .env.example .env
chmod 600 .env
nano .env

# 3. Build and launch services
docker compose -f docker-compose.yml up -d --build
```

## 3. Database Migrations & Initial Setup

```bash
# Run database schema migrations
docker compose exec api alembic upgrade head

# Provision the master administrator
docker compose exec -it api python scripts/create_admin.py

# Verify audit chain integrity
docker compose exec api python scripts/verify_audit_chain.py
```

## 4. Reverse Proxy & TLS Configuration (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name profileguard.itbp.gov.in;

    ssl_certificate /etc/ssl/certs/itbp_cert.pem;
    ssl_certificate_key /etc/ssl/private/itbp_key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # React Analyst Dashboard
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # FastAPI REST Engine
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```
