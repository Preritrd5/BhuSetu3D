# BhuSetu 3D — UI Transformation: Phase 6
## Contextual Inspectors + Spatial UI Architecture & Engineering Report

### Executive Summary

Phase 6 implements the **Contextual Inspectors and Spatial UI** architecture for BhuSetu 3D — Digital Property Intelligence. Transforming the experience from *"a 3D scene with fixed information panels"* to *"an intelligent 3D spatial environment where the contextual interface dynamically responds to the active spatial object"*, the core tenet remains absolute: **"THE WORLD IS PRIMARY. THE INSPECTOR RESPONDS TO THE WORLD."**

The 3D digital-twin environment established in Phase 4 and Phase 5 remains 100% frozen as the visual baseline. All contextual inspectors, in-scene spatial anchors, outliner nodes, and breadcrumbs now consume a unified single source of truth: `activeSpatialSelection`.

---

### 1. Unified Selection Architecture (`activeSpatialSelection`)

The application enforces a **Single Source of Truth** for all spatial selection states via the `useSpatialSelection` hook. The resulting `ActiveSpatialSelection` model is consumed synchronously by the Cesium 3D viewer, outliner, breadcrumb, contextual inspector, floating spatial anchor, and AI assistant:

```typescript
export interface ActiveSpatialSelection {
  entityType: SpatialLevel; // "CITY" | "PARCEL" | "BUILDING" | "FLOOR" | "UNIT" | "ROOM" | "HALL" | "CORRIDOR" | "DOOR" | "WINDOW" | "INFRASTRUCTURE"
  entityId: string;
  parentId?: string | null;
  parentType?: SpatialLevel | null;
  title: string;
  subtitle?: string;
  code?: string;
  hierarchyPath: HierarchyPathNode[];
  geometryReference?: string | null;
  source: TrustSource; // "AUTHORITATIVE" | "DERIVED" | "AI-DERIVED" | "INFERRED" | "ILLUSTRATIVE" | "UNVERIFIED"
  confidence?: number | null; // e.g. 0.98 or 98%
  verificationState: VerificationState; // "VERIFIED" | "REVIEW_REQUIRED" | "UNVERIFIED" | "DISCREPANCY_DETECTED"
  selectionState: "SELECTED" | "HOVERED" | "NONE";
  cameraTarget?: string | null;
  inspectionMode: {
    isolateBuilding?: boolean;
    isolateFloor?: boolean;
    explodeFloors?: boolean;
  };
  metadata?: Record<string, any>;
  rawNode?: any;
}
```

---

### 2. Contextual Inspector System & Primitives

Rather than fragmented, custom layouts, Phase 6 introduces a modular, reusable inspector design system:

| Component | Path | Responsibility |
|---|---|---|
| `InspectorShell` | `components/workspace/inspector/InspectorShell.tsx` | Translucent glass container (`backdrop-blur-[40px] saturate-[200%] border-slate-700/80 rounded-[32px]`), responsive width, close & minimize controls. |
| `InspectorHeader` | `components/workspace/inspector/InspectorHeader.tsx` | Answers "What am I looking at?" with entity icon, type badge, human-readable name, ID, and trust chips. |
| `InspectorSection` | `components/workspace/inspector/InspectorSection.tsx` | Collapsible section container with icons, badge counts, and smooth disclosure animation. |
| `InspectorStat` | `components/workspace/inspector/InspectorStat.tsx` | Dense metric cards clearly distinguishing **computed** vs **authoritative** values (e.g. `COMPUTED AREA 42.8 m²` vs `LEGAL RECORDED AREA`). |
| `DataTrustIndicator` | `components/workspace/inspector/DataTrustIndicator.tsx` | Compact trust chips distinguishing **probabilistic confidence** (e.g. `98% conf`) from **official legal verification** (`VERIFIED` vs `DISCREPANCY`). |
| `InspectorRelationship` | `components/workspace/inspector/InspectorRelationship.tsx` | Clickable ancestor hierarchy path enabling instant upward traversal in 3D and outliner without state loss. |
| `InspectorActionBar` | `components/workspace/inspector/InspectorActionBar.tsx` | Compact action bar with **at most ONE primary dominant action** (`FOCUS`, `ISOLATE`, `INSPECT`) and secondary working actions. Zero fake buttons. |
| `SpatialAnchorBadge` | `components/workspace/inspector/SpatialAnchorBadge.tsx` | Subtle in-scene floating selection anchor / HUD badge displayed when inspector is minimized or closed. |

---

### 3. Entity-Specific Inspectors Implemented

1. **`ParcelInspector`**:
   - **Identity**: ULPIN 2D (`KA-BLR-2026-P102`), Survey # (`102/3B`), Commercial/Mixed-Use Zoning.
   - **Metrics**: Legal Recorded Area (520.0 m²) vs Computed Area (520.0 m²), Base Elevation (920.0m MSL).
   - **Buildings on Parcel**: Direct interactive list of registered building twins.
   - **Actions**: `FOCUS PARCEL` (Primary), `Inspect Building`, `2D Cadastre` link.

2. **`BuildingInspector`**:
   - **Identity**: Building Code (`BLD-KA-BLR-102`), Name (`Aura Horizon Commercial Complex`).
   - **Metrics**: Observed Height (14.5m) vs Sanctioned Height (11.5m), Detected Floors (4) vs Sanctioned (3).
   - **Discrepancy Banner**: Highlighted warning for vertical height violation (+3.00m).
   - **Floor Slab Matrix**: Interactive floor slab preview (FL-00 to FL-03) with unsanctioned badge on FL-03.
   - **Actions**: `FOCUS BUILDING` (Primary), `Isolate Building`, `Explode Floors`, `Ask BhuSetu`.

3. **`FloorInspector`**:
   - **Identity**: Floor Code (`FL-03`), Level (`Floor Slab #3`).
   - **Metrics**: Base Elevation (931.0m MSL), Ceiling Elevation (935.0m MSL), Slab Height (4.0m), Floor Plate (240.0m²).
   - **Units on Floor**: Strata units breakdown with direct navigation to Unit 301.
   - **Actions**: `ISOLATE FLOOR SLAB` (Primary), `Inspect Unit`, `Explode Floors`, `Ask BhuSetu`.

4. **`UnitInspector`**:
   - **Identity**: Unit Number (`301`), ULPIN 3D (`KA-BLR-2026-P102-B1-F3-U04`).
   - **Metrics**: Carpet Area (190.0m²), Built-Up Area (225.0m²), Commercial Office Typology.
   - **Internal Spaces**: Interactive rooms list (Conference Hall, Executive Suite, Corridor).
   - **Actions**: `FOCUS UNIT INTERIOR` (Primary), `Inspect Room`, `Ask BhuSetu`.

5. **`RoomInspector`**:
   - **Metrics**: Computed Area (24.8m²), Dimensions (5.2m x 4.8m), Partition Material (Double Glazed Partition).
   - **Architectural Elements**: Doors and windows list.
   - **Actions**: `INSPECT ROOM INTERIOR` (Primary), `Inspect Door`, `Ask BhuSetu`.

6. **`HallInspector`**:
   - **Metrics**: Assembly Area (32.5m²), Dimensions (6.5m x 5.0m), Acoustic Timber Paneling, Capacity (~24 Persons).
   - **Actions**: `FOCUS CONFERENCE HALL` (Primary), `Ask BhuSetu`.

7. **`CorridorInspector`**:
   - **Metrics**: Circulation Area (36.4m²), Clear Width (2.6m — NBC 2016 Compliant), Terrazzo finish.
   - **Actions**: `FOCUS CIRCULATION CORRIDOR` (Primary), `Inspect Floor`, `Ask BhuSetu`.

8. **`DoorInspector`**:
   - **Metrics**: Dimensions (1.1m x 2.4m), Solid Core Timber, FD-60 Fire Barrier Rating, Outward Egress.
   - **Actions**: `FOCUS DOOR ELEMENT` (Primary), `Inspect Room`, `Ask BhuSetu`.

9. **`WindowInspector`**:
   - **Metrics**: Dimensions (2.2m x 1.6m), Low-E Double Glazed, 0.28 SHGC, North-East Facing.
   - **Actions**: `FOCUS FACADE WINDOW` (Primary), `Inspect Room`, `Ask BhuSetu`.

10. **`InfrastructureInspector`**:
    - **Metrics**: Subsurface Stormwater Drainage Main (`SWD-MALL-04`), Invert Depth (-1.8m BGL), Mandated Buffer (5.0m) vs Measured Clearance (3.2m -> -1.80m Infringement).
    - **Actions**: `FOCUS UTILITY ALIGNMENT` (Primary), `Ask BhuSetu`.

11. **`CityInspector`**:
    - **Metrics**: Macro municipal parcel, building, slab, and unit counts; list of featured complex twins.
    - **Actions**: `INSPECT PRIMARY COMPLEX` (Primary), `Ask BhuSetu`.

---

### 4. Synchronization & Interactivity

- **3D Picking**: Picking in Cesium canvas triggers `onSelectLevel` for parcels, buildings, floors, units, rooms, corridors, elements, and infrastructure utilities.
- **Outliner & Breadcrumb**: Selecting any node synchronously updates the unified selection, camera focus, and inspector.
- **Minimization / Restoration**: Clicking minimize or `[Esc]` collapses the inspector while preserving the active 3D selection and displaying the floating `SpatialAnchorBadge`. Clicking "Inspect" instantly restores the contextual panel.
- **AI Context Inheritance**: Opening "Ask BhuSetu" passes `contextEntity={selection}`, allowing natural language queries grounded in the active object.

---

### 5. Regression & Verification Results

- **TypeScript Compilation**: `npx tsc --noEmit` exited with **0 errors**.
- **Frontend Server**: Next.js 14 responding with `HTTP 200 OK` on `http://localhost:3000/3d-city`.
- **Backend API Server**: FastAPI responding with `HTTP 200 OK` on `http://127.0.0.1:8000/api/v1/health`.
- **Visual Environment**: Baseline next-gen 3D world (lighting, elevated viaduct, urban matrix, setback guides, canopy trees) remains fully intact.
