# BhuSetu 3D Production Performance Guide

**Project:** BhuSetu 3D  
**Team:** TANTRAKATHA | Smart India Hackathon 2026 (SIH26011)  
**Phase:** Phase 14: Production Deployment + Security + Performance Hardening  

---

## 1. PostGIS Spatial Query Optimizations

### 1.1 GiST Spatial Indexing
All spatial geometry columns use PostGIS GiST (Generalized Search Tree) indexing:
- `parcels(geom_2d)` — Index: `idx_parcels_geom_2d_gist`
- `buildings(footprint_geom)` — Index: `idx_buildings_footprint_gist`
- `infrastructure(geom_spatial)` — Index: `idx_infrastructure_geom_gist`
- `property_state_versions(geom_spatial)` — Index: `idx_prop_versions_geom_gist`

### 1.2 Bounded Viewport Querying
- Map APIs query features using PostGIS bounding-box operators (`&&` and `ST_Intersects`).
- Viewports are bounded to avoid loading city-wide datasets in a single request.
- Feature limits prevent browser memory overload.

### 1.3 Infrastructure Proximity Optimization
- Proximity analysis filters candidates using `ST_DWithin` bounding boxes before calculating precise conformal distances.
- Avoids expensive Cartesian cross-joins ($N \times M$).

---

## 2. API & Database Performance

### 2.1 Server-Side Analytical Aggregations
- Dashboard metrics and KPI cards compute aggregations directly in PostgreSQL/PostGIS.
- Zero client-side computation over raw tabular records.

### 2.2 Pagination & Selective Projection
- Potentially large endpoints (`/quality/issues`, `/verification/queue`, `/conflicts`, `/properties`) enforce default pagination (`limit` & `offset`).
- Heavy geometry payloads are omitted from metadata list queries and served only upon explicit detail retrieval.

---

## 3. Frontend & Cesium 3D Performance

### 3.1 Next.js App Router Optimization
- Routes are statically compiled where possible (`○ Static`).
- First Load JS is optimized to 87.5 kB shared baseline.
- Code splitting isolates Cesium and heavy GIS modules to on-demand chunks.

### 3.2 Cesium 3D Lifecycle Management
- Viewer instances are cleanly destroyed and WebGL contexts released on route changes.
- Polyhedral building envelopes use Level-of-Detail (LOD): simplified 2.5D extrusions for distant overview, detailed 3D PolyhedralSurfaceZ meshes for selected inspection.
