# BhuSetu 3D — 3D Recovery Phase 1 Engineering Report
**Provider-Aware 3D Foundation + External 3D API Fallback**  
*Document Version: 2.0.0 | Date: 2026-09-28*

---

## 1. Current 3D Architecture

The BhuSetu 3D workspace utilizes CesiumJS (^1.145.0) within a client-side WebGL viewport, integrated into the Next.js 14 application shell. 

To bridge the gap between BhuSetu's cadastral intelligence and city-scale urban visualization, the system implements a **3D Source Resolver** architecture:

```
                         BHUSETU 3D
                              |
                              v
                     3D SOURCE RESOLVER
                              |
                 +------------+-------------+
                 |                          |
                 v                          v
         BHUSETU-OWNED DATA         EXTERNAL 3D PROVIDER
           Supabase/PostGIS            API KEY / TOKEN
                 |                          |
                 +------------+-------------+
                              |
                              v
                           CesiumJS
                              |
                              v
                   3D Spatial Workspace
```

---

## 2. Current Reality: Absence of a Proprietary City-Scale 3D Model

**Critical Fact**: BhuSetu currently does **NOT** possess a complete proprietary city-scale 3D mesh model dataset stored in Supabase/PostGIS for entire cities. 

- PostGIS holds authoritative records for surveyed cadastral parcels (boundaries, ULPINs, ownership, land use) and verified building models where survey/dossier audits exist.
- PostGIS does **not** store complete city-wide exterior building meshes, universal room layouts, or unverified underground utility networks.
- Therefore, BhuSetu does not fabricate synthetic city models or invent fake ULPINs. Instead, surrounding urban context is provided through decoupled external 3D providers.

---

## 3. Native BhuSetu Source (`BHUSETU_NATIVE`)

* **Data Store**: Supabase / PostgreSQL / PostGIS (`apps/web/lib/api/properties.ts`, `apps/api`).
* **Authoritative Entities**:
  * Cadastral Parcels: Boundary polygons (EPSG:4326), survey numbers, setback buffers.
  * Verified Buildings: Metric height extrusions, sanctioned heights, detected floors, conflict boundaries.
  * Vertical Property: Floor slabs and unit centroids when present in the authoritative database.
* **Integrity Guarantee**: Only real database geometry is tagged with `_isBhuSetuProperty = true`. Missing floors or rooms are never fabricated.

---

## 4. External 3D Provider (`EXTERNAL_PROVIDER`)

* **Purpose**: Serves strictly as a **3D Context Provider** to present rich urban surrounding massing.
* **Supported Integrations**:
  1. **Cesium OSM Buildings**: Streamed via Cesium Ion using `NEXT_PUBLIC_CESIUM_ION_TOKEN` (`Cesium.createOsmBuildingsAsync()`).
  2. **Google Photorealistic 3D Tiles**: Supported via `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (`Cesium.createGooglePhotorealistic3DTileset()`).
* **Non-Property Rule**: External buildings are strictly classified as `EXTERNAL 3D CONTEXT`. The system never assigns ULPINs, parcel IDs, ownership records, or legal verification status to external contextual buildings.

---

## 5. Source Priority Model

The `Spatial3DSourceResolver` enforces this strict priority hierarchy:

1. **`BHUSETU_NATIVE`**: If BhuSetu-owned PostGIS geometry exists for the active scene and no external provider is active.
2. **`HYBRID`**: If BhuSetu-owned PostGIS geometry exists **AND** an external 3D provider is available, BhuSetu property geometry is layered seamlessly on top of external 3D city context.
3. **`EXTERNAL_PROVIDER`**: If BhuSetu-owned 3D geometry is unavailable, the external 3D provider renders the surrounding urban environment.
4. **`FALLBACK`**: If neither is available, or if the external provider fails (401/403/offline), the viewer falls back to a clean native Cesium scene (globe + base studio floor).

---

## 6. Credential & Environment Configuration

Credentials are completely decoupled and managed exclusively via environment variables:

| Variable | Scope | Status | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Mandatory | Supabase database endpoint |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client | Mandatory | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | Client | Mandatory | FastAPI backend base URL |
| `NEXT_PUBLIC_CESIUM_ION_TOKEN` | Client | **Optional** | Cesium Ion access token (for Cesium OSM Buildings / Ion tiles) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client | **Optional** | Google Maps Platform API key (for Photorealistic 3D Tiles) |

*Credentials are never hardcoded in source files, React components, or repository commits.*

---

## 7. Provider Fallback & Failure Handling

The application is hardened against all external provider failures:
- **Missing Token**: Immediately falls back to clean Cesium native mode without attempting external provider calls.
- **Invalid / Expired Token (401/403)**: Caught in `External3DProviderManager.loadExternal3DContext()`. Removes tileset from primitives, logs developer warning, and activates `FALLBACK` mode.
- **Network Outage / Tile Errors**: Base imagery and tileset error events are intercepted; unhandled error popups are completely suppressed via `viewer.cesiumWidget.showErrorPanel` override.
- **Zero UI Crashes**: Provider failures never crash the route, freeze the UI, or trigger infinite retry loops.

---

## 8. Provider Attribution Requirements

Mandatory external provider attributions are preserved and surfaced:
- **Cesium OSM Buildings**: Displayed in UI telemetry and source badge as `Cesium OSM Buildings / OpenStreetMap ©`.
- **Google Photorealistic 3D Tiles**: Displayed as `Google Photorealistic 3D Tiles ©`.
- **BhuSetu Authoritative Data**: Displayed as `BhuSetu 3D Cadastral Registry (PostGIS / KSRSAC / BBMP Authoritative)`.

---

## 9. Future PostGIS Geometry Integration

The abstraction is architected so that as BhuSetu's GIS/AI ingestion pipelines ingest real 3D city data in future phases:
- New parcels and building meshes added to PostGIS will automatically be picked up by `BhuSetuNativeProviderManager`.
- The `Spatial3DSourceResolver` will automatically transition those areas from `EXTERNAL_PROVIDER` to `HYBRID` or `BHUSETU_NATIVE`.
- No rewrites of the viewer, outliner, or inspector are needed.

---

## 10. Known Limitations (Phase 1 Boundaries)

- Phase 1 does **not** create a proprietary city-scale 3D mesh model dataset.
- Indoor floor/unit room geometry is only displayed where explicitly modeled in authoritative PostGIS demo records (e.g. Aura Horizon).
- External buildings remain strictly unparsed visual context.
