# ASTATINE: REST API Architecture Specification
**Project Name:** ASTATINE  
**Team:** TANTRAKATHA  
**Hackathon:** Smart India Hackathon 2026 (SIH 2026) | **Problem Statement:** SIH26011  
**Document Version:** 1.0.0 (Phase 0 Baseline)  
**Status:** Approved Architecture Blueprint  

---

## 1. API Architecture Principles & Standards

ASTATINE provides a RESTful, OpenAPI 3.1-compliant backend interface designed around high-performance geospatial data transfer, structured spatial filtering, and strict role-based access.

### 1.1 Core API Standards
- **Base URI:** `/api/v1`
- **Serialization Format:** JSON for tabular metadata; GeoJSON (`RFC 7946`) for 2D spatial features; 3D GeoJSON / Batched 3D Tiles (`b3dm`) for 3D envelopes and meshes.
- **Coordinate Standard:** All GeoJSON geometries are serialized in `EPSG:4326` (WGS 84), with coordinates ordered as `[longitude, latitude]` for 2D, and `[longitude, latitude, altitude]` for 3D.
- **Standardized Response Envelope:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1280
  },
  "error": null
}
```
- **Error Response Envelope:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "SPATIAL_VALIDATION_FAILED",
    "message": "Supplied polygon exhibits self-intersecting boundary edges.",
    "details": [{ "field": "footprint_geom", "issue": "Ring Self-intersection at [77.5946, 12.9716]" }]
  }
}
```

---

## 2. API Endpoint Groupings & Module Boundaries

### 2.1 Spatial Parcels & Cadastral Registry (`/api/v1/parcels`)
| Method | Endpoint | Description | Auth Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/parcels` | Query parcels with spatial BBox filter (`min_lon,min_lat,max_lon,max_lat`) | All |
| `GET` | `/parcels/{id}` | Retrieve single parcel record with computed area & boundary geometry | All |
| `GET` | `/parcels/by-ulpin/{ulpin_2d}` | Lookup parcel by its 14-digit cadastral ULPIN | All |
| `POST` | `/parcels` | Ingest new cadastral parcel record | `ADMIN`, `SURVEYOR` |
| `PATCH` | `/parcels/{id}/geometry` | Submit revised ground-survey boundary geometry | `SURVEYOR`, `OFFICER` |

### 2.2 3D Buildings & Vertical Structures (`/api/v1/buildings`)
| Method | Endpoint | Description | Auth Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/buildings` | List 3D buildings within bounding box / parcel ID | All |
| `GET` | `/buildings/{id}` | Detailed 3D building envelope with LoD2 height & floor count | All |
| `GET` | `/buildings/{id}/floors` | Retrieve complete vertical floor stack for building | All |
| `POST` | `/buildings/extrude` | Trigger extrusion of building footprint using target DEM dataset | `ADMIN`, `SURVEYOR` |

### 2.3 Vertical Floors & 3D Units (`/api/v1/floors`, `/api/v1/units`)
| Method | Endpoint | Description | Auth Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/floors/{id}` | Get specific floor plate polygon, elevation bounds ($Z_{min}, Z_{max}$) | All |
| `GET` | `/floors/{id}/units` | Retrieve all 3D units situated on a target floor | All |
| `GET` | `/units/{id}` | Complete 3D unit record, 3D ULPIN, carpet area, spatial centroid | All |
| `GET` | `/units/by-ulpin/{ulpin_3d}` | Resolve 3D ULPIN identifier to exact vertical unit record | All |
| `POST` | `/units/slice` | Subdivide floor plate into 3D units based on architectural plans | `ADMIN`, `SURVEYOR` |

### 2.4 Subsurface & Above-ground Infrastructure (`/api/v1/infrastructure`)
| Method | Endpoint | Description | Auth Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/infrastructure` | Query utility networks by category & evidence type | All |
| `GET` | `/infrastructure/subsurface` | Query buried utility lines filtered strictly by authoritative evidence | `OFFICER`, `PLANNER`, `ADMIN` |
| `GET` | `/parcels/{id}/infrastructure` | Query utility connections & easements intersecting a parcel | All |

### 2.5 Evidence & Provenance Explorer (`/api/v1/evidence`)
| Method | Endpoint | Description | Auth Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/evidence/entity/{entity_type}/{entity_id}` | Retrieve complete lineage, dataset sources & confidence scores | All |
| `GET` | `/evidence/datasets/{id}` | Ingested dataset metadata (sensor, capture date, resolution) | All |
| `POST` | `/evidence/attach` | Bind an authoritative survey document or photogrammetry model | `SURVEYOR`, `OFFICER` |

### 2.6 Spatial Intelligence & Conflict Detection (`/api/v1/conflicts`)
| Method | Endpoint | Description | Auth Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/conflicts` | List detected spatial discrepancies (encroachments, height variances) | `OFFICER`, `PLANNER`, `ADMIN` |
| `GET` | `/conflicts/{id}` | Detailed conflict report with clash geometry and offset distance | `OFFICER`, `PLANNER`, `ADMIN` |
| `POST` | `/conflicts/evaluate-parcel/{parcel_id}` | Trigger topological clash detection for a given parcel | `OFFICER`, `SURVEYOR` |

### 2.7 AI Spatial Investigator & NL Query (`/api/v1/ai`)
| Method | Endpoint | Description | Auth Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/ai/investigate` | Natural language spatial query input $\rightarrow$ validated spatial AST | All |
| `POST` | `/ai/explain-conflict/{conflict_id}` | Generate evidence-aware natural language explanation for conflict | `OFFICER`, `PLANNER` |

### 2.8 Human Verification & Audit Ledger (`/api/v1/verification`, `/api/v1/audit`)
| Method | Endpoint | Description | Auth Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/verification/queue` | List pending verification tasks awaiting officer review | `OFFICER`, `ADMIN` |
| `POST` | `/verification/decide` | Submit maker-checker decision (`APPROVE`, `MODIFY`, `REJECT`) | `OFFICER` |
| `GET` | `/audit/entity/{entity_type}/{entity_id}` | Cryptographically validated audit history for property | `OFFICER`, `ADMIN` |
| `GET` | `/audit/verify-chain` | Verify SHA-256 tamper-evident hash chain integrity | `ADMIN` |

---

## 3. Strict Query Parameters & Geo-Filtering

### 3.1 Bounding Box Query Standard
All spatial endpoints list endpoints accept standard geographic envelope bounds:
`GET /api/v1/parcels?bbox=77.5900,12.9700,77.6100,12.9850&limit=100`
- Query parameters are strictly parsed using Pydantic validators:
  - `min_lon`: Longitude between -180.0 and 180.0
  - `min_lat`: Latitude between -90.0 and 90.0
  - `max_lon`: Greater than `min_lon`
  - `max_lat`: Greater than `min_lat`

### 3.2 Pagination Strategy
Spatial results implement keyset cursor-based pagination or index-bounded limit/offset:
- Default `limit`: 50 items.
- Maximum allowable `limit`: 500 items per request (prevents browser WebGL memory exhaustion).
