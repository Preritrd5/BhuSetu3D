# BhuSetu 3D Dependency Licenses & Inventory

**Project:** BhuSetu 3D  
**Team:** TANTRAKATHA | Smart India Hackathon 2026 (SIH26011)  
**Phase:** Phase 14: Production Deployment + Security + Performance Hardening  

---

## 1. Core Backend & GIS Dependencies (Python)

| Package | Version | License | Primary Purpose |
|---|---|---|---|
| **FastAPI** | 0.115+ | MIT | Asynchronous REST API framework |
| **Uvicorn** | 0.32+ | BSD-3-Clause | ASGI production web server |
| **SQLAlchemy** | 2.0+ | MIT | ORM and SQL query construction |
| **GeoAlchemy2** | 0.16+ | MIT | PostGIS spatial geometry mapping |
| **Shapely** | 2.0+ | BSD-3-Clause | 2D/3D computational geometry operations |
| **PyPydantic** | 2.10+ | MIT | Data parsing, validation, and type safety |
| **Alembic** | 1.14+ | MIT | Database schema migrations |
| **asyncpg** | 0.30+ | Apache-2.0 | High-performance asynchronous PostgreSQL driver |
| **httpx** | 0.28+ | BSD-3-Clause | Asynchronous HTTP client for Supabase Auth |
| **PyJWT** | 2.10+ | MIT | Cryptographic JWT signature verification |

---

## 2. Core Frontend & Visualization Dependencies (TypeScript / Node.js)

| Package | Version | License | Primary Purpose |
|---|---|---|---|
| **Next.js** | 14.2+ | MIT | React full-stack application framework |
| **React** | 18.3+ | MIT | Component UI library |
| **Cesium** | 1.120+ | Apache-2.0 | 3D Geospatial globe, terrain, and building mesh rendering |
| **Tailwind CSS** | 3.4+ | MIT | Utility-first CSS layout engine |
| **Lucide React** | 0.440+ | ISC | Accessible UI iconography |
| **Supabase JS** | 2.45+ | MIT | Supabase Auth client integration |

---

## 3. Container & Infrastructure Images

| Component | Base Image | License | Primary Purpose |
|---|---|---|---|
| **FastAPI Backend** | `python:3.11-slim` (Debian) | Python-2.0 / Debian DFSG | Minimal hardened runtime container |
| **Next.js Frontend** | `node:20-alpine` (Alpine Linux) | MIT / Alpine OSS | Lightweight standalone web container |
| **Edge Proxy** | `nginx:1.25-alpine` | BSD-2-Clause | TLS termination and reverse proxy |

---

## 4. License Compliance Summary

All libraries utilized across BhuSetu 3D are distributed under permissive open-source licenses (MIT, Apache 2.0, BSD-3-Clause, ISC). There are no viral copyleft licenses (e.g. GPLv3, AGPL) that restrict commercial deployment, government adoption, or municipal infrastructure usage.
