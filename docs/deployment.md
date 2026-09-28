# BhuSetu 3D Production Deployment Guide

**Project:** BhuSetu 3D  
**SIH Problem Statement:** SIH26011 — 3D ULPIN Generation and Vertical Property Mapping System  
**Team:** TANTRAKATHA  
**Phase:** Phase 14: Production Deployment + Security + Performance Hardening  

---

## 1. Production Architecture Topology

```mermaid
flowchart TD
    INTERNET["Public Internet / Surveyor Clients"] --> EDGE["Edge Nginx Reverse Proxy (TLS 1.3 / Port 443)"]
    
    subgraph DMZ["Container Network (bhusetu-internal)"]
        EDGE -- "Static & Shell Routes (/)" --> WEB["Next.js 14 Web Frontend (Node.js 20 Alpine / Port 3000)"]
        EDGE -- "API Calls (/api/v1/*)" --> API["FastAPI Backend (Python 3.11 / Port 8000)"]
    end

    subgraph CLOUD["Managed External Cloud Services"]
        API -- "Encrypted PostGIS SQL (TLS / Port 5432)" --> SUPABASE["Supabase PostgreSQL 16 + PostGIS 3.4 (Sole DB)"]
        API -- "Evidence & Document Storage" --> STORAGE["Supabase Private S3-Compatible Buckets"]
        API -- "Grounded Spatial AI" --> GEMINI["Google Gemini AI REST API"]
    end
```

### Core Architecture Rules:
1. **Supabase is the Sole Canonical Database**: No local PostgreSQL, SQLite, or secondary database containers are deployed in production.
2. **Strict Separation of Secrets**: Browser clients receive only `NEXT_PUBLIC_*` variables. Database passwords, JWT secrets, and Gemini private keys remain strictly server-side.
3. **Non-Root Containers**: FastAPI (`appuser:10001`) and Next.js (`nextjs:1001`) run as unprivileged non-root users.

---

## 2. Prerequisites & Environment Setup

- Docker Engine 24.0+ & Docker Compose v2.20+
- Access to Supabase managed PostgreSQL 16 with PostGIS 3.4 enabled
- Valid SSL/TLS certificates mounted to Nginx reverse proxy

### Required Production Environment Variables

| Variable | Scope | Description | Example / Format |
|---|---|---|---|
| `ENVIRONMENT` | Server | Runtime environment | `production` |
| `DEBUG` | Server | Debugging flag (must be false) | `false` |
| `DATABASE_URL` | Server | Supabase asyncpg connection string | `postgresql+asyncpg://postgres:pass@db...supabase.co:5432/postgres?ssl=require` |
| `SUPABASE_URL` | Server & Web | Supabase Project URL | `https://qcobqjtrhhdwzmadfykq.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Server & Web | Client-safe public API key | `sb_publishable_...` |
| `SUPABASE_JWT_SECRET` | Server | HMAC-SHA256 JWT Secret | `[32+ character secret]` |
| `GEMINI_API_KEY` | Server | Google Gemini API Key | `AIza...` |
| `CORS_ORIGINS` | Server | Strict allowed origin array | `["https://bhusetu3d.gov.in"]` |
| `MAX_REQUEST_SIZE_BYTES` | Server | Maximum request payload | `52428800` (50MB) |
| `RATE_LIMIT_ENABLED` | Server | Global rate limiting flag | `true` |

---

## 3. Deployment Steps

### 3.1 Pre-Flight Configuration Validation
Run the built-in configuration validator:
```bash
python -m app.core.config_validator
```
If any critical misconfiguration (e.g. `DEBUG=true`, wildcard CORS, localhost DB in production) is detected, startup is aborted.

### 3.2 Database Migration Execution
Apply Alembic migrations to the Supabase instance:
```bash
alembic upgrade head
```

### 3.3 Production Container Launch
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 3.4 Verification of Health Probes
```bash
# Liveness probe (should return HTTP 200 {"status": "alive"})
curl -f http://localhost/api/v1/health/live

# Readiness probe (should return HTTP 200 {"status": "ready"})
curl -f http://localhost/api/v1/health/ready
```

---

## 4. Rollback Procedure

If a deployment fails health checks:
1. Revert container image tags in `docker-compose.prod.yml`.
2. Redeploy previous known-good containers:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
3. If database schema was modified in a breaking manner, execute the corresponding Alembic downgrade script:
   ```bash
   alembic downgrade -1
   ```
