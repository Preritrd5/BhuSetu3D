# Phase 7: Vertical Property Mapping + 3D ULPIN Model

**Project:** BhuSetu 3D  
**Team:** TANTRAKATHA  
**Hackathon:** Smart India Hackathon 2026 (SIH 2026) | **Problem Statement:** SIH26011  
**Phase Status:** PHASE 7 COMPLETED  

---

## 1. Executive Summary & Architectural Positioning

Phase 7 advances BhuSetu 3D from single-envelope 3D building visualization to a **canonical vertical property intelligence hierarchy**:

$$\text{LAND} \longrightarrow \text{PARCEL} \longrightarrow \text{BUILDING} \longrightarrow \text{FLOOR} \longrightarrow \text{UNIT}$$

The system models vertical multi-story real estate assets in canonical Supabase PostGIS, performs rigorous deterministic geometric and elevation consistency checks, serializes 3D volumetric floor slabs and unit centroids for CesiumJS WebGL rendering, and generates deterministic, traceable **ULPIN-oriented 3D prototype property records**.

> [!IMPORTANT]
> **Statutory Notice on ULPIN Issuance:**  
> BhuSetu 3D generates technical, deterministic spatial prototype identifiers (`BHU-3D-*`). It does **NOT** claim that it independently issues an official government ULPIN unless an authorized government integration is formally active. All identifiers are explicitly labeled **ULPIN-ORIENTED / PROTOTYPE**.

---

## 2. Canonical Vertical Data Model

### 2.1 Entity Relationship

```
PARCEL (public.parcels)
  │  ├── id (UUID, PK)
  │  ├── ulpin_2d (VARCHAR, Unique 14-digit standard 2D ULPIN)
  │  └── geom_2d (POLYGON, EPSG:4326)
  │
  └── BUILDING (public.buildings)
        │  ├── id (UUID, PK)
        │  ├── building_code (VARCHAR)
        │  ├── ground_elevation (NUMERIC)
        │  ├── building_height (NUMERIC)
        │  ├── footprint_geom (POLYGON, EPSG:4326)
        │  └── geom_3d (POLYHEDRALSURFACEZ, EPSG:4326)
        │
        └── FLOOR (public.floors)
              │  ├── id (UUID, PK)
              │  ├── building_id (UUID, FK -> buildings.id)
              │  ├── floor_number (INTEGER)
              │  ├── floor_code (VARCHAR)
              │  ├── base_elevation (NUMERIC, Z_base)
              │  ├── ceiling_elevation (NUMERIC, Z_ceiling)
              │  ├── floor_height (NUMERIC, Z_ceiling - Z_base)
              │  ├── floor_area_sqm (NUMERIC)
              │  └── geom_3d (POLYHEDRALSURFACEZ, EPSG:4326)
              │
              └── UNIT (public.units)
                    ├── id (UUID, PK)
                    ├── floor_id (UUID, FK -> floors.id)
                    ├── building_id (UUID, FK -> buildings.id)
                    ├── parcel_id (UUID, FK -> parcels.id)
                    ├── ulpin_3d (VARCHAR, Unique 3D ULPIN prototype)
                    ├── unit_number (VARCHAR)
                    ├── unit_type (VARCHAR: RESIDENTIAL / COMMERCIAL)
                    ├── carpet_area_sqm (NUMERIC)
                    ├── spatial_centroid_z (POINTZ, EPSG:4326)
                    └── geom_3d (POLYHEDRALSURFACEZ, EPSG:4326, optional)
```

### 2.2 ULPIN-Oriented Prototype Identity Storage (`public.property_identities`)

```sql
CREATE TABLE public.property_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL REFERENCES public.parcels(id) ON DELETE CASCADE,
    building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
    ulpin_oriented_id VARCHAR(100) UNIQUE NOT NULL,
    identity_version INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'PROTOTYPE',
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Deterministic ULPIN-Oriented Identifier Scheme

All prototype identifiers are computed deterministically from canonical database keys:

1. **Property ULPIN Prototype:**
   $$\text{BHU-3D-P-}\{\text{parcel.ulpin\_2d}\}\text{-B-}\{\text{building.building\_code}\}$$
   *Example:* `BHU-3D-P-KA-BLR-2026-001-B-BLD-TECH-01`
2. **Floor Level Identifier:**
   $$\text{BHU-3D-F}\{\text{floor\_number:02d}\}\text{-}\{\text{building.building\_code}\}$$
   *Example:* `BHU-3D-F01-BLD-TECH-01`
3. **Unit 3D ULPIN Prototype:**
   $$\text{BHU-3D-U}\{\text{unit\_number}\}\text{-F}\{\text{floor\_number:02d}\}\text{-}\{\text{building.building\_code}\}$$
   *Example:* `BHU-3D-U101-F01-BLD-TECH-01`

---

## 4. Vertical Consistency Validation Engine

The `VerticalPropertyService` enforces deterministic spatial integrity checks:

| Check Name | Rule | Severity |
| :--- | :--- | :--- |
| `FLOOR_DATA_AVAILABILITY` | Checks if building contains vertical floor records. | `PASSED` / `UNAVAILABLE` |
| `FLOOR_VERTICAL_SPAN` | Validates $\text{ceiling\_elevation} > \text{base\_elevation}$. | `PASSED` / `FAILED` |
| `INTER_FLOOR_OVERLAP` | Validates $\text{floor}_{i}.\text{ceiling\_elevation} \le \text{floor}_{i+1}.\text{base\_elevation}$. | `PASSED` / `FAILED` |
| `BUILDING_HEIGHT_ENVELOPE` | Validates $\max(\text{ceiling\_elevation}) \le \text{ground} + \text{height} + 0.5\text{m}$. | `PASSED` / `WARNING` (`VERTICAL DATA DISCREPANCY`) |

---

## 5. API Endpoints

All endpoints require Phase 2 Bearer token authentication via `get_current_user`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/properties/{property_id}/hierarchy` | Assembles full Parcel $\rightarrow$ Building $\rightarrow$ Floor $\rightarrow$ Unit hierarchy. |
| `GET` | `/api/v1/properties/buildings/{building_id}/floors` | Lists vertical floor levels with metrics and units counts. |
| `GET` | `/api/v1/properties/buildings/{building_id}/floors/3d` | Viewport GeoJSON FeatureCollection of 3D floor slabs for CesiumJS. |
| `GET` | `/api/v1/properties/floors/{floor_id}` | Detailed floor metadata with atomic units summary. |
| `GET` | `/api/v1/properties/floors/{floor_id}/units` | Lists atomic units belonging to a specific vertical floor. |
| `GET` | `/api/v1/properties/floors/{floor_id}/units/3d` | GeoJSON FeatureCollection of 3D unit centroids (PointZ) and polygons. |
| `GET` | `/api/v1/properties/units/{unit_id}` | Detailed property unit metadata with centroid coordinates. |
| `POST` | `/api/v1/properties/buildings/{building_id}/validate-vertical` | Executes geometric consistency check suite. |

---

## 6. CesiumJS 3D WebGL Visualization

- **3D Floor Slab Extrusion:** Floor slabs are dynamically extruded between `base_elevation` and `ceiling_elevation` using the building footprint polygon.
- **Active Floor Highlight:** The selected floor is highlighted in vivid emerald `#10b981` (alpha 0.95), with non-selected floors rendered with subtle transparency.
- **Floor Isolation Toggle:** Allows cross-section inspection of a single floor by hiding non-selected floor geometry.
- **3D Unit Centroids:** Units are projected as glowing 3D spheres/pins at $[lng, lat, z]$ with unit number billboards.
- **Camera Navigation:** Precise camera fly-to animations targeting individual building, floor, or unit spatial extents.

---

## 7. Strict Phase Boundaries

In compliance with project specifications, the following features remain deferred:
- **Phase 8:** Evidence Vault, Merkle provenance tree, source checksum audit.
- **Phase 9:** Automated building encroachment and legal boundary conflict engine.
- **Phase 10:** Natural-language spatial query compiler (Gemini AI Investigator).
- **Phase 11:** Statutory human verification queue and approval sign-off workflows.
- **Phase 12:** 4D property history and temporal discrepancy analytics.
