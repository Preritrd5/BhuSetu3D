# ASTATINE: Deployment Architecture Specification
**Project Name:** ASTATINE  
**Team:** TANTRAKATHA  
**Hackathon:** Smart India Hackathon 2026 (SIH 2026) | **Problem Statement:** SIH26011  
**Document Version:** 1.0.0 (Phase 0 Baseline)  
**Status:** Approved Architecture Blueprint  

---

## 1. Deployment Topology Overview

ASTATINE provides a reproducible, containerized deployment topology designed for seamless local development, isolated hackathon evaluation, and cloud deployment.

```
                             INTERNET / CLIENTS
                                     │
                                     ▼
                   [REVERSE PROXY / INGRESS CONTROLLER]
                     (Nginx / Traefik - TLS 1.3 / SSL)
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
  [WEB FRONTEND SERVICE]                              [FASTAPI BACKEND SERVICE]
  - Next.js 14+ (Node.js 20)                          - Python 3.11 + Uvicorn
  - Static 3D Asset Cache                             - Geospatial C-Libs (GDAL/GEOS)
  - CesiumJS WebGL Worker                             - OpenAPI / Swagger Docs
           │                                                   │
           └─────────────────────────┬─────────────────────────┘
                                     │
           ┌───────────────────────────────────────────────────┐
           ▼                                                   ▼
  [SUPABASE MANAGED SPATIAL DATABASE]                 [OBJECT STORAGE SERVICE]
  - Supabase PostgreSQL 16                            - Supabase Storage / MinIO / S3
  - PostGIS 3.4 Spatial Extension                     - 3D Tilesets (b3dm), DEMs
  - GIST 2D/3D Spatial Indexes                        - Drone Orthomosaics (GeoTIFF)
  - PostgREST & Managed Pooler                        - Point Clouds (LAS/LAZ)
```

---

## 2. Local Container Orchestration (`docker-compose.yml` Architecture)

For development and hackathon demonstration, the application stack is orchestrated via Docker Compose, connecting directly to the **Supabase Managed PostgreSQL + PostGIS** project.

> [!IMPORTANT]
> **Zero Local Database Rule:** Docker Compose does **NOT** run a local PostgreSQL or PostGIS container. Supabase is the sole database platform and single source of truth.

### 2.1 Service Specifications
1. **`api` (FastAPI Geospatial Engine):**
   - **Build:** `apps/api/Dockerfile` (Multi-stage Python 3.11 with system `gdal-bin`, `libgdal-dev`, `libgeos-dev`)
   - **Ports:** `8000:8000`
   - **Environment Variables:**
     - `SUPABASE_URL=https://qcobqjtrhhdwzmadfykq.supabase.co`
     - `SUPABASE_PUBLISHABLE_KEY=sb_publishable_lCZMVQiaV9X-GnUjdYx-TA_2iHm3AHp`
     - `DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@db.qcobqjtrhhdwzmadfykq.supabase.co:5432/postgres`
     - `GEMINI_API_KEY=${GEMINI_API_KEY}`
2. **`web` (Next.js 3D Spatial Canvas):**
   - **Build:** `apps/web/Dockerfile` (Node.js 20 Alpine)
   - **Ports:** `3000:3000`
   - **Environment Variables:**
     - `NEXT_PUBLIC_SUPABASE_URL=https://qcobqjtrhhdwzmadfykq.supabase.co`
     - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_lCZMVQiaV9X-GnUjdYx-TA_2iHm3AHp`
     - `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`
3. **`storage` (Optional Local S3 Cache / MinIO):**
   - **Image:** `minio/minio:RELEASE.2024-01-16T16-07-38Z`
   - **Command:** `server /data --console-address ":9001"`
   - **Ports:** `9000:9000` (API), `9001:9001` (Web Console)
   - **Usage:** Local proxy / cache for heavy drone point clouds and orthophoto GeoTIFFs.
   - **Environment:** `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`

---

## 3. High-Performance Geospatial Serving & Asset Optimization

Serving 3D building models, high-resolution satellite/drone orthomosaics, and elevation rasters introduces unique throughput challenges. ASTATINE deploys specific optimization strategies:

### 3.1 3D Tileset Streaming (b3dm & Quantized Mesh)
- Building envelopes and vertical floor polyhedra are pre-converted into **OGC 3D Tiles (b3dm)** hierarchical spatial bounding volumes (Bounding Volume Hierarchy - BVH).
- The CesiumJS client requests only the LoD tile subsets within the camera frustum using HTTP Range requests.
- Headers enforce immutable caching: `Cache-Control: public, max-age=31536000, immutable`.

### 3.2 Raster Elevation & Ortho Tiling
- Drone orthomosaics and Digital Elevation Models (DEMs) are stored as **Cloud Optimized GeoTIFFs (COGs)**.
- Rasterio and GDAL stream internal overview pyramids directly over HTTP range requests without downloading the entire multi-gigabyte raster to memory.

---

## 4. Production Cloud Target Architecture

For sovereign state-wide or national deployment:
- **Compute:** Managed Kubernetes (EKS / GKE) with horizontal pod autoscaling (HPA) targeting CPU and memory saturation.
- **Database:** Managed Cloud PostgreSQL with PostGIS extension (e.g., AWS Aurora PostgreSQL with multi-AZ replication).
- **Storage:** Amazon S3 / Google Cloud Storage fronted by CloudFront CDN with edge TLS termination.
- **Security:** Ingress rate limiting (100 req/min per IP on spatial endpoints), WAF rules protecting against SQL injection, and IAM role isolation for database credentials.
