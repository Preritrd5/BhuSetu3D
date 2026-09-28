# ASTATINE: UI/UX Architecture Specification
**Project Name:** ASTATINE  
**Team:** TANTRAKATHA  
**Hackathon:** Smart India Hackathon 2026 (SIH 2026) | **Problem Statement:** SIH26011  
**Document Version:** 1.0.0 (Phase 0 Baseline)  
**Status:** Approved Architecture Blueprint  

---

## 1. Design Philosophy & Aesthetic Identity

ASTATINE is designed as a **mission-critical geospatial intelligence and land governance platform** for sovereign cadastral authorities, urban local bodies (ULBs), and surveyors. 

### 1.1 Core Principles
- **No Gimmicky SaaS Dashboard:** Avoid decorative widgets, arbitrary round progress rings, and neon gradients. The 3D globe is the workspace; all analytics and inspections are contextually tethered to geographic features.
- **High Information Density with Visual Hierarchy:** Present high-precision spatial attributes (coordinates to 6 decimal places, elevation to centimeters, square meters to 2 decimal places, confidence percentages) in crisp, tabular, readable layouts without overwhelming the user.
- **Subdued, Focused Color Palette:** The UI uses deep slate backgrounds (`slate-950`, `slate-900`), neutral borders (`slate-800`), crisp white-to-slate typography (`slate-100`, `slate-400`), and semantic indicators that adhere to strict WCAG 2.1 AA contrast ratios.
- **Never Rely Solely on Color:** Statuses (e.g., Verified, Pending, Conflict) must pair distinct icons and explicit textual badges alongside colors to accommodate color vision deficiencies.

---

## 2. Master Workspace Layout

The application viewport utilizes a responsive **Five-Zone Spatial Workspace**:

```
+----------------------------------------------------------------------------------------------------+
|  ZONE 1: TOP NAVIGATION & SPATIAL COMMAND BAR                                                      |
|  [Logo: ASTATINE] [City: Bengaluru Urban ▼] [ AI Spatial Investigator Search Bar           ] [Role: Officer ▼]|
+----+-----------------------------------------------------------------------------+-----------------+
| Z  | ZONE 3: 3D CESIUM SPATIAL VIEWPORT                                          | ZONE 4:         |
| O  |                                                                             | CONTEXTUAL      |
| N  | - Terrain, Cadastral Polygons (2D WGS84)                                    | PROPERTY        |
| E  | - LoD1 / LoD2 3D Building Meshes & Floor Slices                             | INSPECTOR       |
|    | - Subsurface Infrastructure (Evidence Gated)                                |                 |
| 2: | - Spatial Conflict Highlights (Red/Amber outlines)                          | - ULPIN Record  |
|    | - Spatial Measurement Guides                                                | - Hierarchy Tree|
| N  |                                                                             | - Evidence Card |
| A  |                                                                             | - Conflict Card |
| V  |                                                                             | - Verification  |
|    |                                                                             |   Actions       |
| R  |                                                                             | - Audit Log     |
| A  |                                                                             |                 |
| I  |                                                                             |                 |
| L  |                                                                             |                 |
+----+-----------------------------------------------------------------------------+-----------------+
|  ZONE 5: BOTTOM SPATIAL TOOLBAR & TIMELINE SCRUBBER                                               |
|  [Layers ▼] [Floor Slicer: Floor 4/12 ──●──] [Measure ▼] [4D Timeline: 2021 ──●── 2026] [Cam Views]|
+----------------------------------------------------------------------------------------------------+
```

### 2.1 Zone 1: Top Navigation & Spatial Command Bar
- **Branding:** ASTATINE wordmark with Tantrakatha team attribution and official SIH26011 alignment badge.
- **City & Region Selector:** Allows instant switching across configured urban centers (e.g., Bengaluru Urban, Delhi NCR, Pune Metropolitan).
- **AI Spatial Investigator Command Input:** Combines traditional keyword/ULPIN lookup with natural language spatial search (e.g., *"Show residential buildings taller than 15 meters on parcel 142"*).
- **Active Role & Authentication Avatar:** Displays current user identity (e.g., "Rajesh Sharma (Surveyor)") with swift persona-switching for demonstration and testing.
- **System Telemetry Indicator:** Live health badge for PostGIS connection, Cesium WebGL frame time, and AI service latency.

### 2.2 Zone 2: Primary Navigation Rail
Vertical icon-and-label navigation rail allowing fast context switching:
1. **3D City View:** Full spatial exploration of parcels, buildings, and vertical infrastructure.
2. **Properties:** Tabular and spatial ledger of all registered parcels and 3D ULPIN records.
3. **Spatial Conflicts:** Focused triage view of all detected encroachments, height deviations, and buffer overlaps.
4. **Evidence & Provenance:** Catalog of ingested datasets (satellite, drone, cadastral, GPR) with lineage graphs.
5. **Verification Queue:** Pending maker-checker tasks for authorized officers.
6. **4D Property History:** Temporal change detection comparing historical cadastral boundaries against present-day drone surveys.
7. **System Configuration:** CRS parameters, tolerance thresholds, and user management.

### 2.3 Zone 3: 3D Cesium Spatial Viewport
- Full WebGL 3D Globe running CesiumJS.
- **Imagery & Terrain:** High-resolution base tiles with Cesium World Terrain / Copernicus DEM elevation.
- **Dynamic 3D Vector Layers:**
  - *Cadastral Parcels:* Extruded 2D boundary lines hugging terrain.
  - *3D Buildings:* Colored by classification, height, or conflict state; hovered and selected states.
  - *Vertical Floors & Units:* Rendered upon zooming into building proximity or activating the Floor Slicer.
  - *Infrastructure Layer:* Subsurface pipes and conduits rendered with rigorous evidence tags.
- **Interactive Navigation Gizmo:** View compass, tilt control, pitch reset, and true-north snapping.

### 2.4 Zone 4: Contextual Property Inspector (Right Drawer)
Dynamic multi-tab drawer that slides in whenever an entity (Parcel, Building, Floor, Unit, or Conflict) is selected on the 3D map:
- **Tab 1: Overview & 3D ULPIN:** Full 14-digit parcel ULPIN + Vertical 3D ULPIN (e.g., `KA-BLR-04-0012-B1-F04-U402`), centroid coordinates, property classification, ownership deed reference.
- **Tab 2: Vertical Hierarchy:** Interactive tree diagram:
  $$\text{Parcel } \rightarrow \text{Building } \rightarrow \text{Floor 4 } \rightarrow \text{Unit 402}$$
- **Tab 3: Evidence & Lineage:** Source dataset reference, capture date, sensor type, extraction model, and confidence score ($0-100\%$).
- **Tab 4: Spatial Conflicts:** Explicit description of any spatial clash, computed offset distances, and tolerance threshold.
- **Tab 5: Verification & Audit:** Officer action buttons (`APPROVE`, `REQUEST FIELD RE-SURVEY`, `MODIFY BOUNDS`, `REJECT`) with mandatory comment input, followed by a historical audit log list.

### 2.5 Zone 5: Bottom Spatial Toolbar & Controls
- **Layer Visibility Matrix:** Checkbox controls for Parcels, Footprints, 3D Extrusions, Floors, Units, Utilities, Cadastral Overlays, and Conflict Buffers.
- **Vertical Floor Slicer:** Interactive vertical slider that visually isolates individual floors of the currently selected building, hiding upper floors to reveal interior unit layouts.
- **Measurement Tools:** Snappable 3D measurement tools for Euclidean distance, horizontal cadastral offset, vertical building height, and polygonal footprint area.
- **4D Temporal Scrubber:** Date range slider enabling dual-layer comparative visualization (e.g., 2021 Cadastral Map vs. 2025 Drone LiDAR Survey).
- **Camera Presets:** Quick-jump buttons (Top-Down Ortho 2D, Isometric 3D, Street Eye-Level, Subsurface X-Ray Angle).

---

## 3. UI Component Design System & Color Tokens

### 3.1 Color Palette
| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `bg-canvas` | `#020617` (Slate 950) | Main application background |
| `bg-surface` | `#0f172a` (Slate 900) | Card, panel, and drawer surfaces |
| `border-subtle`| `#1e293b` (Slate 800) | Structural dividing borders |
| `text-primary` | `#f8fafc` (Slate 50) | High-emphasis headings and coordinates |
| `text-secondary`| `#94a3b8` (Slate 400) | Field labels, metadata, secondary notes |
| `accent-cyan` | `#06b6d4` (Cyan 500) | Active selections, selected 3D building highlight |
| `status-verified`| `#10b981` (Emerald 500) | Verified property record, zero conflict |
| `status-pending` | `#f59e0b` (Amber 500) | Pending verification, needs officer review |
| `status-conflict`| `#ef4444` (Rose 500) | Spatial boundary encroachment detected |
| `source-authoritative`| `#3b82f6` (Blue 500) | Government cadastral / official revenue record |
| `source-derived` | `#8b5cf6` (Purple 500) | Photogrammetry / AI extracted geometry |
| `source-illustrative`| `#64748b` (Slate 500) | Non-verified demonstration geometry |

### 3.2 Typography Guidelines
- **Primary Interface Font:** `Inter`, `system-ui` for crisp legibility across all screen sizes.
- **Technical & Spatial Data Font:** `JetBrains Mono` or `Roboto Mono` for geographic coordinates, ULPIN identifiers, confidence metrics, and SQL/AST queries.
- **Text Scaling:**
  - Page/Panel Header: `16px / font-semibold`
  - Body Text: `13px / font-normal`
  - Technical Data / Coordinates: `12px / font-mono`
  - Badges & Micro-labels: `10px / font-mono / uppercase`

---

## 4. 3D Interaction Specifications

### 4.1 Mouse & Gesture Navigation in CesiumJS
- **Left Mouse Click:** Select spatial entity (Parcel, Building, Unit). Triggers dynamic highlight shader on the selected mesh, centers camera bounds smoothly, and opens the Contextual Property Inspector.
- **Left Mouse Drag:** Pan globe laterally.
- **Right Mouse Drag / Mouse Wheel:** Zoom in and out along the camera ray vector.
- **Middle Mouse Drag (or Ctrl + Left Drag):** 3D Pitch and Heading tilt control. Enables low-angle inspection of building verticality and floor levels.
- **Double Click:** Fly-to camera zoom into clicked building envelope.

### 4.2 Vertical Floor Slicing Interaction
When a user selects a multi-story building and activates the **Floor Slicer Tool**:
1. The Cesium renderer calculates the building's bounding box and floor count $N$.
2. As the user moves the vertical slider to Floor $k$, a WebGL clipping plane or custom shader hides floors $> k$.
3. Floor $k$ is highlighted with unit outlines, and the Contextual Inspector switches to **Unit Hierarchy View**.

---

## 5. Accessibility & Responsive Degradation

### 5.1 WCAG 2.1 AA Compliance
- All interactive buttons and drawer headers feature accessible ARIA labels (`aria-expanded`, `aria-controls`, `aria-label`).
- Full keyboard tab navigation through all navigation rails, inputs, and inspector panels.
- Focus rings styled with `outline-2 outline-cyan-500 outline-offset-2`.

### 5.2 Responsive Breakpoints & Device Targets
- **Primary Platform (Desktop - $\ge 1280\text{px}$):** Full 5-zone GIS workspace with dual interactive panels, 3D Cesium canvas, and high-density inspector.
- **Secondary Platform (Tablet - $768\text{px} - 1279\text{px}$):** Left rail collapses to icon-only dock; right inspector transforms into a bottom sliding sheet.
- **Restricted Platform (Mobile - $< 768\text{px}$):** Mobile does not attempt full desktop GIS editing. Instead, it provides:
  - 3D ULPIN lookup search.
  - Simplified touch-optimized map viewer.
  - Read-only property overview and verification badge.
