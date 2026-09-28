# ASTATINE: Phase 1 Specification — Project Foundation & Development Environment
**Project Name:** ASTATINE  
**Team:** TANTRAKATHA  
**Hackathon:** Smart India Hackathon 2026 (SIH 2026) | **Problem Statement:** SIH26011  
**Phase:** 1 of 15  
**Document Version:** 1.0.0  
**Status:** SPECIFICATION LOCKED — AWAITING PHASE 1 EXECUTION APPROVAL  

---

## 1. Phase Objective
Establish the complete, reproducible monorepo development environment, developer toolchains, containerized application scaffolding, base FastAPI backend scaffolding with health-check endpoints connected to the **Supabase Managed PostgreSQL + PostGIS** database, and base Next.js 14+ frontend scaffolding with Tailwind CSS.

---

## 2. Scope & Target Deliverables
- **Monorepo Structure:** Initialize Turborepo / npm workspaces containing:
  - `apps/web`: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Supabase client SDK.
  - `apps/api`: FastAPI (Python 3.11+), Poetry / pip requirements, Pydantic v2, Uvicorn, Supabase client & SQLAlchemy/GeoAlchemy2.
  - `packages/shared-types`: Shared TypeScript interfaces and JSON schema contracts.
- **Docker Compose:** Local development infrastructure (`docker-compose.yml`) containing application services and asset cache, strictly enforcing the **Zero Local Database Rule** (no local PostgreSQL/PostGIS container; Supabase is the sole database platform).
- **Environment Configuration:** Secure `.env.example` templates configuring `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_DB_URL`.
- **Backend Health Check & Verification:** `/api/v1/health` endpoint returning Supabase database connectivity status and PostGIS version string.
- **Frontend Scaffolding:** Clean Next.js baseline landing screen with Tailwind dark mode configuration.
- **Tooling & Linting:** Prettier, ESLint, TypeScript compiler checks, and Python `flake8` / `black` / `ruff` configurations.

---

## 3. Workflows & Interactions
1. **Developer Bootstrapping Workflow:**
   - Configure `.env` with Supabase project credentials.
   - Run `cd apps/api && uvicorn app.main:app --reload` $\rightarrow$ FastAPI launches on port 8000, establishing an async connection pool to Supabase PostgreSQL.
   - Run `cd apps/web && npm run dev` $\rightarrow$ Next.js launches on port 3000.
2. **Healthcheck Ping Workflow:**
   - Navigating to `http://localhost:8000/api/v1/health` executes `SELECT PostGIS_Full_Version();` against the Supabase database and returns:
     ```json
     {
       "status": "healthy",
       "database": "connected",
       "provider": "supabase",
       "postgis_version": "POSTGIS=\"3.4.2\" ...",
       "storage": "connected"
     }
     ```

---

## 4. Technical Specifications by Layer

### 4.1 Frontend Work (`apps/web`)
- Initialize Next.js 14+ using App Router.
- Install core dependencies: `@supabase/supabase-js`, `clsx`, `tailwind-merge`, `lucide-react`.
- Configure `tailwind.config.ts` with ASTATINE slate color palette tokens (`bg-canvas: #020617`, `bg-surface: #0f172a`, `border-subtle: #1e293b`, `accent-cyan: #06b6d4`).
- Setup layout with font configurations (Inter and JetBrains Mono).

### 4.2 Backend Work (`apps/api`)
- Initialize Python 3.11 virtual environment and project structure.
- Install dependencies: `fastapi`, `uvicorn[standard]`, `pydantic>=2.0`, `pydantic-settings`, `supabase`, `asyncpg`, `sqlalchemy>=2.0`, `geoalchemy2`, `httpx`, `pytest`, `pytest-asyncio`.
- Setup `app/core/config.py` using Pydantic `BaseSettings` reading Supabase environment variables.
- Setup `app/db/session.py` with AsyncEngine connected to Supabase PostgreSQL.
- Setup `app/api/v1/health.py` endpoint verifying DB connection to Supabase.

### 4.3 Container Infrastructure (`docker-compose.yml`)
- Service `api`: FastAPI application container targeting Supabase database.
- Service `web`: Next.js web application container.
- Service `storage` (Optional): Local proxy / cache for heavy drone point clouds and GeoTIFFs (MinIO).
- **Strict Rule:** Docker Compose does **NOT** run a separate PostgreSQL container. Supabase is the sole database platform.

---

## 5. Directory & File Blueprint for Phase 1
```
astatine/
├── apps/
│   ├── api/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── v1/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   └── health.py
│   │   │   │   └── __init__.py
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   └── config.py
│   │   │   ├── db/
│   │   │   │   ├── __init__.py
│   │   │   │   └── session.py
│   │   │   ├── __init__.py
│   │   │   └── main.py
│   │   ├── tests/
│   │   │   ├── __init__.py
│   │   │   └── test_health.py
│   │   ├── .env.example
│   │   ├── pyproject.toml / requirements.txt
│   │   └── Dockerfile
│   └── web/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── globals.css
│       ├── .env.example
│       ├── package.json
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── Dockerfile
├── packages/
│   └── shared-types/
│       ├── package.json
│       └── src/index.ts
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 6. Testing & Validation Strategy for Phase 1
- **Backend Test:** Run `pytest apps/api/tests/test_health.py` asserting HTTP 200 and healthy DB response.
- **Frontend Test:** Run `npm run build` in `apps/web` asserting zero TypeScript compilation errors.
- **Docker Validation:** Run `docker compose ps` verifying both containers report `healthy` state.

---

## 7. Phase 1 Completion Checklist
- [ ] Monorepo structure created and configured.
- [ ] Docker Compose file created with PostgreSQL 16 + PostGIS 3.4 and MinIO.
- [ ] Docker containers boot up and establish healthy connections.
- [ ] FastAPI backend initializes and exposes `/api/v1/health`.
- [ ] Database connectivity verified via PostGIS full version query.
- [ ] Next.js frontend initializes cleanly with Tailwind design tokens.
- [ ] Backend test suite passes (`pytest`).
- [ ] Frontend build succeeds without type errors.
- [ ] Clean Git status, documentation updated.
