# BhuSetu 3D — Phase 9: Spatial Intelligence & Conflict Detection
**SIH Problem Statement**: SIH26011 — 3D ULPIN Generation and Vertical Property Mapping System  
**Product**: Evidence-Backed 3D Property Intelligence Platform  
**Team**: TANTRAKATHA  
**Status**: Implemented & Verified (Phase 9 Complete)

---

## 1. Executive Summary & Purpose

Phase 9 establishes the **Spatial Intelligence & Conflict Detection System** for BhuSetu 3D. While earlier phases focused on 2D cadastral ingestion, 3D mesh reconstruction, vertical unit hierarchy, and evidentiary provenance tracking, Phase 9 equips the platform with real-time **computational geometry and topological reasoning** backed by PostgreSQL 16 and PostGIS 3.4.

Phase 9 systematically detects geometric discrepancies, boundary encroachments, setback violations, and infrastructure clearance risks. Crucially, the system operates under a strict **Spatial Governance Principle**: *Spatial Discrepancy $\neq$ Legal Violation*. All findings are advisory technical observations designed to assist human surveyors and urban authorities, strictly avoiding defamatory or premature legal pronouncements.

---

## 2. Mandatory Spatial Governance Principle

```
        +-------------------------------------------------------+
        |                  GEOMETRIC REALITY                    |
        |  PostGIS identifies footprint extending 4.2m outside  |
        |  the digitized cadastral parcel boundary polygon.     |
        +---------------------------+---------------------------+
                                    |
                                    v
        +-------------------------------------------------------+
        |                 MANDATORY GOVERNANCE                  |
        |  Is this illegal? -> UNKNOWN TO MACHINE               |
        |  Could it be:                                         |
        |   - Survey measurement error in legacy revenue map?   |
        |   - Cantilevered chajja / balcony projection?        |
        |   - Digitization distortion / orthorectification skew?|
        |   - Unmutated lawful adverse possession / settlement? |
        +---------------------------+---------------------------+
                                    |
                                    v
        +-------------------------------------------------------+
        |                 SYSTEM TERMINOLOGY                    |
        |  "Potential spatial discrepancy detected"             |
        |  "Review required by authorized land surveyor"        |
        |  (NEVER: "Illegal building", "Encroacher", "Fraud")   |
        +-------------------------------------------------------+
```

### Governing Directives:
1. **Advisory Posture**: Every discrepancy is presented as an automated geometric calculation (`discrepancy`), never an indictment of statutory wrongdoing.
2. **Neutral Taxonomy**: Statuses transition through `OPEN`, `REVIEWED`, `RESOLVED`, and `DISMISSED`.
3. **Evidence Lineage Integration**: Inherits Phase 8 confidence scores and links to source datasets, processing runs, and model versions.
4. **Permanent Traceability**: Findings maintain full audit logs with measured metrics, threshold limits, and observed deviations.

---

## 3. Spatial Rules Engine Catalog

The engine evaluates five deterministic spatial validation rules:

| Rule Code | Rule Name | PostGIS Function / Logic | Default Threshold | Severity | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `RULE-BLDG-001` | **Building Outside Parcel** | `ST_Difference(building, parcel)` | Area $> 0.1\text{ m}^2$ | `HIGH` | Identifies building footprint portions extending beyond the registered parcel polygon. Calculates exact outside area in $\text{m}^2$ using conformal UTM Zone 43N. |
| `RULE-BLDG-002` | **Setback / Boundary Proximity** | `ST_Distance(building, parcel_boundary)` | Minimum setback $< 0.5\text{ m}$ | `MEDIUM` | Measures closest perpendicular distance from building wall to parcel boundary. Flags potential municipal setback infractions. |
| `RULE-PRCL-001` | **Parcel Boundary Overlap** | `ST_Intersection(parcel_a, parcel_b)` | Area $> 0.1\text{ m}^2$ (Excludes `ST_Touches`) | `HIGH` | Detects overlapping boundary polygons between adjacent parcels. Specifically ignores shared boundaries via `ST_Touches` to avoid false positives. |
| `RULE-INFR-001` | **Infrastructure Clearance** | `ST_DWithin(parcel, infrastructure, buffer)` | Road: $5\text{ m}$, Power: $15\text{ m}$, Pipe: $10\text{ m}$ | `HIGH` / `MEDIUM` | Evaluates proximity of properties to critical utility corridors (High Tension lines, pipelines, national highways). |
| `RULE-GEOM-001` | **Geometry Validity** | `ST_IsValid`, `ST_IsSimple`, `ST_Area` | Invalid geometry or Area $\le 0$ | `HIGH` | PostGIS and Shapely validation preventing self-intersecting rings, zero-area slivers, or bow-tie anomalies. |

---

## 4. PostGIS DE-9IM Topological Relationships

BhuSetu 3D computes and persists Dimensionally Extended 9-Intersection Model (DE-9IM) spatial relationships:

```mermaid
graph TD
    P[Cadastral Parcel Polygon] -->|ST_Contains| B[Building Footprints]
    P -->|ST_Touches| AP1[Adjacent Parcel A - Shared Boundary]
    P -->|ST_Touches| AP2[Adjacent Parcel B - Shared Boundary]
    P -->|ST_Overlaps [DISCREPANCY]| OP[Overlapping Parcel C]
    P -->|ST_DWithin < 15m| HT[High Tension Power Corridor]
    P -->|ST_DWithin < 5m| RD[Primary Road Network]
```

### Relationship Types Supported:
- **`CONTAINS`**: Parcel contains one or more 2D/3D building structures (`ST_Contains`).
- **`TOUCHES`**: Parcels share a boundary edge or vertices with zero interior overlap area (`ST_Touches`).
- **`OVERLAPS`**: Parcels intersect with shared interior area $> 0.1\text{ m}^2$ (`ST_Overlaps`).
- **`WITHIN`**: Unit or sub-feature resides within parent geometry (`ST_Within`).
- **`NEAR`**: Proximity relation within a specified buffer radius (`ST_DWithin`).

---

## 5. Metric Calculations & Conformal CRS Strategy

PostGIS geometries in BhuSetu 3D are stored in `EPSG:4326` (WGS84 Lon/Lat) for global interoperability. However, geodesic operations on angular coordinates produce severe distortion for meter-scale calculations (areas and setbacks).

To guarantee sub-centimeter geometric precision:
1. **Metric Area Calculations**:
   - Geometries are transformed into conformal **UTM Zone 43N (`EPSG:32643`)** covering western and central India:
     $$\text{ST\_Area}(\text{ST\_Transform}(\text{geom}, 32643))$$
   - In Shapely / Python engine, coordinates are projected via pyproj `EPSG:4326 -> EPSG:32643` (or `EPSG:3857` fallback) before boolean operations.
2. **Noise and Precision Filters**:
   - Numerical tolerance of $0.1\text{ m}^2$ is applied to all intersection calculations to filter out floating-point rasterization noise and sliver vertices.
3. **Boundary Adjacency Distinction**:
   - Pure boundary contacts (`ST_Touches`) return zero interior intersection and are classified as valid topological neighbors, avoiding false overlap alerts.

---

## 6. Deduplication and Upsert Lifecycle

To prevent database bloat when spatial checks are re-executed repeatedly:
- **Active Finding Lookup**: For a given `rule_id`, `entity_type`, `entity_id`, and `related_entity_id`, the system checks for existing records with status `OPEN` or `REVIEWED`.
- **In-Place Update**: If an unresolved finding exists, its `measured_value`, `deviation_value`, `explanation`, `confidence_score`, and `updated_at` timestamp are updated rather than creating duplicate records.
- **Auto-Resolution**: If a subsequent analysis run reveals that an earlier discrepancy has been resolved (e.g. geometry corrected), the finding can be automatically transitioned to `RESOLVED`.

---

## 7. Evidence & Provenance Integration (Phase 8 Synergy)

Spatial findings directly inherit the provenance lineage established in Phase 8:
- **Conservative Confidence Propagation**:
  $$\text{Confidence}_{\text{finding}} = \min(\text{Confidence}_{\text{parcel}}, \text{Confidence}_{\text{building}}) \times \text{Confidence}_{\text{rule}}$$
- **Evidence Reference**: Findings store JSON references to source survey datasets, orthophoto extraction versions, and rule parameters.
- **Cross-Linking**: Findings directly link to `/evidence` and `/properties` for complete auditability.

---

## 8. REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/conflicts` | List discrepancies with filters for severity, type, status, and confidence. |
| `GET` | `/api/v1/conflicts/{id}` | Retrieve individual discrepancy record with GeoJSON and evidence links. |
| `POST` | `/api/v1/conflicts/{id}/status` | Update finding status (`OPEN`, `REVIEWED`, `RESOLVED`, `DISMISSED`) with reviewer notes. |
| `GET` | `/api/v1/properties/{id}/conflicts` | Retrieve all active discrepancies associated with a parcel. |
| `GET` | `/api/v1/properties/{id}/relationships`| Retrieve topological relationships (`CONTAINS`, `TOUCHES`, `NEAR`). |
| `GET` | `/api/v1/properties/{id}/nearby-infrastructure` | Scan nearby utility corridors within a specified radius (default 100m). |
| `POST` | `/api/v1/properties/{id}/analyze-spatial` | Execute real-time PostGIS spatial rule evaluations for the target property. |
| `GET` | `/api/v1/spatial/rules` | Retrieve active spatial validation rules and parameter thresholds. |

---

## 9. Verification & Test Coverage

The spatial intelligence engine is verified by comprehensive automated test suites:
- **`apps/api/tests/test_spatial_conflicts.py`**:
  - `test_rule_engine_building_outside_parcel`: Verifies `RULE-BLDG-001` with metric outside area.
  - `test_rule_engine_setback_violation`: Verifies `RULE-BLDG-002` setback proximity calculations.
  - `test_rule_engine_parcel_overlap`: Verifies `RULE-PRCL-001` overlap detection and touching tolerance.
  - `test_rule_engine_infrastructure_proximity`: Verifies `RULE-INFR-001` corridor buffer warnings.
  - `test_rule_engine_invalid_geometry`: Verifies `RULE-GEOM-001` self-intersection detection.
  - `test_api_get_spatial_rules`: Verifies rule catalog endpoint.
  - `test_api_get_conflicts_list`: Verifies conflict query filtering and summaries.
  - `test_api_conflict_detail_and_status_update`: Verifies transition from `OPEN` to `REVIEWED` with notes.
  - `test_api_property_conflicts`: Verifies parcel conflict queries.
  - `test_api_property_relationships`: Verifies topological relationship queries.
  - `test_api_analyze_property_spatial`: Verifies end-to-end PostGIS analysis execution.
- **Total Suite Passing**: **88/88 tests passing** (77 prior + 11 new) in under 28 seconds.
