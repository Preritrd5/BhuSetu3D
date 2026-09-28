# ASTATINE: 3D ULPIN Generation and Vertical Property Mapping System

**Project Name:** ASTATINE  
**Team:** TANTRAKATHA  
**Hackathon:** Smart India Hackathon 2026 (SIH 2026)  
**Problem Statement ID:** SIH26011  
**Theme:** Smart Automation | **Category:** Software  
**Current Phase:** **PHASE 1 — PROJECT FOUNDATION & DEVELOPMENT ENVIRONMENT**  

---

## 1. Executive Overview

ASTATINE is an evidence-backed 3D property intelligence and land-governance platform aligned with **SIH26011**. It bridges 2D cadastral records (*Bhu-Aadhaar* / ULPIN) with modern multi-story vertical properties, subsurface utilities, and automated spatial discrepancy analysis.

The system is architected around a 5-tier spatial hierarchy:
$$\text{PARCEL} \longrightarrow \text{BUILDING} \longrightarrow \text{FLOOR} \longrightarrow \text{UNIT} \longrightarrow \text{INFRASTRUCTURE}$$

---

## 2. Phase 1 Scope & Implementation Status

Phase 1 establishes the verified full-stack development foundation:
- **Frontend Web Shell:** Next.js 14+ (App Router), TypeScript, Tailwind CSS with dark technical theme tokens, responsive layout, TopBar, and Navigation Sidebar.
- **Backend API Engine:** FastAPI (Python 3.11+), Pydantic v2 schemas, structured logging, CORS configuration, and central router.
- **Database & PostGIS Integration:** PostgreSQL 16 with PostGIS 3.4 spatial extension, Async SQLAlchemy & asyncpg connection pooling, and real-time connectivity probes.
- **System Telemetry & Health Probe:** Live endpoints (`/api/v1/health`, `/api/v1/health/database`, `/api/v1/health/system`) and frontend `SystemStatus` component reporting real state.
- **Docker Compose Topology:** Multi-service container definitions for PostGIS, FastAPI, and Next.js.
- **Database Migration Infrastructure:** Alembic configuration with initial PostGIS/UUID foundation scripts.
- **Automated Testing:** Pytest async test suite verifying application endpoints and error states.

> [!NOTE]
> In accordance with Phase 1 execution rules, business functionality (3D Cesium map, building extraction, 3D ULPIN vertical slicing, AI Spatial Investigator, and conflict detection) is deferred to subsequent phases.

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) | 14.2+ | Server & Client Components, routing, asset optimization |
| **Frontend Language** | TypeScript | 5.7+ | Strict-mode static typing |
| **Styling & Design** | Tailwind CSS | 3.4+ | Slate technical design system, responsive utility classes |
| **Icons & UI** | Lucide React | 0.475+ | Technical status and navigation icons |
| **Backend Framework** | FastAPI | 0.135+ | High-throughput AsyncIO REST API with automatic OpenAPI |
| **Backend Language** | Python | 3.11+ | Business logic, GIS integration, and AI orchestration |
| **Validation Layer** | Pydantic | 2.13+ | Schema validation and settings management |
| **Database Engine** | PostgreSQL | 16+ | Relational data integrity, ACID compliance |
| **Spatial Engine** | PostGIS | 3.4+ | Spatial geometries, GIST indexing, topological predicates |
| **Database Drivers** | SQLAlchemy / asyncpg | 2.0+ / 0.31+ | Async ORM and connection pooling |
| **Database Migrations**| Alembic | 1.20+ | Version-controlled database schema migrations |
| **Testing** | Pytest / pytest-asyncio | 9.1+ / 1.4+ | Automated unit, API, and integration test runner |
| **Containerization** | Docker & Docker Compose | 20+ / 2.0+ | Multi-service local development & staging topology |

---

## 4. Repository Structure

```
astatine/
├── apps/
│   ├── web/                          # Next.js 14+ Frontend Application
│   │   ├── app/                      # App Router (layout.tsx, page.tsx, globals.css)
│   │   ├── components/               # Layout & UI components
│   │   │   ├── layout/               # TopBar.tsx, Sidebar.tsx
│   │   │   └── status/               # SystemStatus.tsx
│   │   ├── hooks/                    # useSystemHealth.ts
│   │   ├── lib/                      # utils.ts (cn helper)
│   │   ├── services/api/             # Centralized API client (client.ts)
│   │   ├── types/                    # Frontend TypeScript definitions
│   │   ├── tailwind.config.ts        # Design tokens & theme colors
│   │   └── package.json
│   │
│   └── api/                          # FastAPI Backend Application
│       ├── app/
│       │   ├── api/                  # Versioned API routes (/health)
│       │   ├── core/                 # config.py, logging.py
│       │   ├── database/             # connection.py (asyncpg & PostGIS probe)
│       │   ├── models/               # SQLAlchemy models (Phase 3+)
│       │   ├── schemas/              # Pydantic v2 health schemas
│       │   ├── services/             # Health and domain services
│       │   └── main.py               # Application entrypoint & lifespan
│       ├── tests/                    # Automated pytest test suite
│       ├── requirements.txt
│       └── pyproject.toml
│
├── packages/
│   └── shared-types/                 # Monorepo shared TypeScript types
│       └── src/index.ts
│
├── database/
│   ├── migrations/                   # Alembic schema migrations
│   │   ├── versions/                 # Revision scripts (0001_initial_postgis_foundation)
│   │   └── env.py
│   └── alembic.ini
│
├── infrastructure/
│   └── docker/
│       ├── Dockerfile.api            # Multi-stage Python 3.11 container
│       └── Dockerfile.web            # Node.js 20 Alpine container
│
├── docs/                             # Phase 0 Architecture Specifications (Locked)
├── .env.example                      # Environment configuration template
├── .gitignore                        # Git exclusion rules
├── docker-compose.yml                # Multi-container local development stack
└── README.md                         # Project documentation
```

---

## 5. Prerequisites

Before running ASTATINE locally, ensure you have installed:
1. **Node.js:** v18.17+ or v20.x (Recommended: v20.x or v22.x)
2. **Python:** v3.11+ or v3.12+ (with `pip`)
3. **Docker & Docker Compose:** Docker Desktop with Linux containers enabled (optional for purely local dev)
4. **PostgreSQL 16 + PostGIS 3.4:** Either via Docker Compose or a local/cloud instance

---

## 6. Environment Configuration

Copy the example environment template:
```bash
cp .env.example .env
```

Key environment variables:
```ini
# Runtime Environment
ENVIRONMENT=development

# FastAPI Backend Settings
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

# Database Connection (PostgreSQL + PostGIS)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/astatine_db
POSTGRES_DB=astatine_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

# Next.js Frontend Settings
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## 7. Development Quickstart

### Option A: Local Development (Recommended for Development)

#### 1. Start the Database
Ensure PostgreSQL with PostGIS is running and reachable at your `DATABASE_URL`.

#### 2. Start the FastAPI Backend
```bash
# In terminal 1 (Backend):
cd apps/api
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Base: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/api/v1/docs`
- Health Endpoint: `http://localhost:8000/api/v1/health/system`

#### 3. Start the Next.js Frontend
```bash
# In terminal 2 (Frontend):
cd apps/web
npm install
npm run dev
```
- Open your browser at: `http://localhost:3000`

---

### Option B: Docker Compose (Full Stack)

To run the complete stack (PostGIS + FastAPI + Next.js) in isolated containers:
```bash
# Start all services
docker compose up -d

# View status of services
docker compose ps

# Follow logs
docker compose logs -f

# Stop all services
docker compose down
```

---

## 8. Verification & Testing

### Running Backend Tests
```bash
# Run pytest from the project root:
python -m pytest apps/api/tests -v
```
Test suite validates:
- Application startup and root service descriptor (`/`)
- API operational health endpoint (`/api/v1/health`)
- Database connectivity probe and PostGIS telemetry (`/api/v1/health/database`)
- Aggregated system status payload (`/api/v1/health/system`)
- Graceful handling of unavailable database states (HTTP 503)

### Running Database Migrations
```bash
# Run Alembic migrations to initialize PostGIS extensions:
alembic -c database/alembic.ini upgrade head
```

---

## 9. Development Phase Roadmap

| Phase | Title | Focus Area | Status |
| :---: | :--- | :--- | :---: |
| **Phase 0** | **Product Definition & Master Blueprint** | Specifications, PRD, ER model, ADRs | ✅ COMPLETE |
| **Phase 1** | **Project Foundation & Environment** | Monorepo, App Shell, FastAPI, Health Probes | 🟡 ACTIVE |
| **Phase 2** | **Auth, Roles & Application Shell** | RBAC boundaries, Officer / Surveyor personas | ⏳ PENDING |
| **Phase 3** | **PostGIS & Property Data Model** | Cadastral parcels, 3D buildings, units schema | ⏳ PENDING |
| **Phase 4** | **Data Ingestion & GIS Pipeline** | GDAL/Shapely reprojection, DEM sampling | ⏳ PENDING |
| **Phase 5** | **2D Parcel Mapping & Explorer** | Cadastral 2D boundary rendering in Cesium | ⏳ PENDING |
| **Phase 6** | **AI Building Extraction & 3D Extrusion**| 3D building envelopes, LoD2 height models | ⏳ PENDING |
| **Phase 7** | **Vertical Property Mapping & 3D ULPIN** | Floor slicing, 3D unit centroids, 3D ULPIN | ⏳ PENDING |
| **Phase 8** | **Evidence & Provenance System** | Sensor lineage tracking, confidence scores | ⏳ PENDING |
| **Phase 9** | **Spatial Conflict Detection** | ST_Difference encroachments, height deviations | ⏳ PENDING |
| **Phase 10** | **AI Spatial Investigator & NL Query** | Gemini tool-calling -> Validated Spatial AST | ⏳ PENDING |
| **Phase 11** | **Human Verification & Audit Ledger** | Maker-checker review UI, SHA-256 hash chain | ⏳ PENDING |
| **Phase 12** | **4D History & Infrastructure** | Multi-epoch timeline scrubber, utility lines | ⏳ PENDING |
| **Phase 13** | **Analytics & UI/UX Polish** | FAR/FSI compliance, 60 FPS WebGL optimizations| ⏳ PENDING |
| **Phase 14** | **Production Hardening & Security** | Container security, rate limits, TLS/CORS | ⏳ PENDING |
| **Phase 15** | **Complete SIH Demo Integration** | End-to-end golden narrative & jury pitch | ⏳ PENDING |

---

## 10. Development Discipline & Rules

1. **Phase Execution Rule:** Implement strictly within the approved phase scope. Never start future phases without explicit approval.
2. **Zero Mock Policy:** System telemetry and status indicators reflect real system states. Never hardcode successful states.
3. **Evidence-Aware AI:** Derived metrics must be verifiable, mathematically grounded, and accompanied by confidence scores.
4. **Security & Secrets:** Never commit real credentials, database passwords, or API keys to version control.
