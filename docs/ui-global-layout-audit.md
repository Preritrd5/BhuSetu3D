# BhuSetu 3D — Global UI/UX Layout Audit
### Spatial Workspace Layout Correction + Brand Color Token Pass

---

## 1. Audit Scope

This audit covers the complete global UI/UX quality, spacing, responsiveness, overlap, and readability correction pass for the BhuSetu 3D application, based on the primary visual reference identifying live collision, text contrast, and styling problems.

**Pages Audited:**
- `/3d-city` — Primary 3D spatial workspace (core focus)
- `/properties` — 2D Cadastral Map & Property Explorer

**Scope Boundaries (preserved, untouched):**
- CesiumJS 3D digital twin environment and all PostGIS spatial geometry
- Supabase backend and spatial hierarchy (City -> Parcel -> Building -> Floor -> Unit -> Room)
- All existing analytical tools, conflict detection, and feature sets
- BhuSetu 3D brand identity and 3D-first spatial workflow

---

## 2. Layout Architecture & Safe Zone Grid

### Vertical Zones (top to bottom)

| Zone | Position | Component | Height |
|------|----------|-----------|--------|
| Top Bar | `top-0` | `WorkspaceTopBar` | 60px |
| Safe Gap | `top-[60px]` | Clearance margin | 8px |
| Panel Row | `top-[68px]` | Left Panel, Right Inspector, Camera Toolbar, Breadcrumb | `calc(100vh - 68px - 44px)` |
| Tool Strip | `bottom-11` (44px above bottom) | `BottomSpatialToolStrip` | ~44px |
| Telemetry Bar | `bottom-0` | Status & Coordinates Bar | 32px (`h-8`) |

### Horizontal Safe Zones (dynamic collision prevention)

| State | Left Boundary | Right Boundary |
|-------|--------------|----------------|
| Left panel open | `left: 344px` | — |
| Left panel collapsed | `left: 68px` | — |
| Right inspector open | — | `right: 436px` |
| Right inspector closed | — | `right: 18px` |

> [!IMPORTANT]
> The `WorkspaceBreadcrumb` dynamically consumes `isLeftPanelCollapsed` and `isRightPanelOpen` props to compute its horizontal margins, preventing collision with the Left Panel and Right Inspector regardless of viewport width.

---

## 3. Overlap & Collision Resolutions

### 3.1 Top Bar + Breadcrumb Collision ✅ Fixed
- **Root cause:** Tailwind CSS v3 lacks default `top-18`, `top-22`, and `w-88` tokens. The classes were silently dropped, resulting in `top: auto` rendering collisions behind `WorkspaceTopBar`.
- **Fix:** Extended `tailwind.config.ts` spacing scale with `18: "4.5rem"`, `22: "5.5rem"`, and `88: "22rem"`. Anchored panel tops to explicit safe zones at `top-[68px]`.

### 3.2 Right Inspector Behind Top Bar ✅ Fixed
- **Fix:** `InspectorShell.tsx` was re-anchored to `top-[68px] right-4 z-20` with bounded height `max-h-[calc(100vh-6.5rem)]` and internal smooth vertical scrolling.

### 3.3 Camera Toolbar Obscured Behind Right Inspector ✅ Fixed
- **Fix:** `CesiumViewer.tsx` floating camera toolbar was updated to accept `isRightPanelOpen`. When the inspector opens, the camera toolbar smoothly transitions horizontally from `right-4` to `right-[436px]`, remaining completely accessible.

### 3.4 Bottom Spatial Tool Strip vs. Telemetry Collision ✅ Fixed
- **Fix:** `BottomSpatialToolStrip.tsx` moved to `bottom-11` (44px clearance), ensuring a 12px breathing buffer above the 32px telemetry status bar without obstructing camera or spatial entities.

---

## 4. Button & Control Sizing System

A strict touch-target and visual hierarchy was established:

| Category | Target Height | Padding | Border Radius | Application |
|----------|---------------|---------|---------------|-------------|
| Primary Action | 44px | `py-3 px-4` | `rounded-[8px]` | Primary Inspector actions (e.g. Run Spatial Checks, Deep Inspect) |
| Secondary Action | 38px | `py-2.5 px-3.5` | `rounded-[8px]` | Secondary actions (e.g. Export GeoJSON, Isolate Structure) |
| Spatial Tool Strip | 36–38px | `py-2 px-3.5` | `rounded-[6px]` | Bottom workspace mode selectors |
| Compact Control | 32px | `py-1.5 px-2.5` | `rounded-[6px]` | Breadcrumb step selectors, filter resets |
| Icon Micro-Target | 28–32px | `p-2` | `rounded-[6px]` | Floating camera controls, eye visibility toggles |

---

## 5. Typography & Readability Improvements

- **Sublabels and Metadata:** Elevated all micro-text from illegible 9px/10px to `text-[11px]` minimum with proper line-height (`leading-relaxed`).
- **Section Headers:** Normalized across all inspectors to `text-xs font-semibold text-[#F4F0E8]` with `tracking-wider uppercase`.
- **Numerical Metrics:** Formatted with bold weights, distinct unit labels (`text-[#77867C]`), and monospace font alignment for spatial coordinates, elevation, and parcel areas.
- **Contrast Ratios:** Replaced low-contrast gray-on-dark text with high-contrast Cream White (`#F4F0E8`) and secondary Warm Sand (`#D9D2C5`).

---

## 6. Authoritative BhuSetu Design Token Color Sweep

All generic Tailwind palette colors (`slate-`, `cyan-`, `amber-`, `emerald-`, `purple-`, and unthemed `surface` variables) were systematically replaced with authoritative BhuSetu design tokens:

### Palette Token Mapping
- **Obsidian Deep (`#0F1210`)**: Deepest background layer, metric tile insets
- **Obsidian Panel (`#141816`)**: Floating inspector panels, tooltips, cards
- **Obsidian Elevated (`#1A201D`)**: Card containers, accordions, header bars
- **Obsidian Hover (`#222A26`)**: Interactive row hover states
- **Copper Dark (`#B56E48`)**: Borders, status highlights, warnings
- **Copper Accent (`#C47B50`)**: Primary brand accents, active state indicators, key icons
- **Jade Base (`#23847D`)**: Primary telemetry indicators, spatial success badges, links
- **Jade Light (`#2EB8B0`)**: Active link hovers, highlighted topological relations
- **Cream White (`#F4F0E8`)**: Primary high-contrast typography
- **Text Sand (`#D9D2C5`)**: Secondary descriptions and property attributes
- **Text Muted (`#A2B3A8`, `#77867C`, `#6F7772`)**: Captions, timestamps, unit labels
- **Subtle Borders (`rgba(244,240,232,0.06)` to `0.10`)**: Precision divider lines

---

## 7. Inspector Component Modernization

All workspace inspector shells and cards were modernized:
1. **`InspectorShell.tsx`**: Widened to `sm:w-[416px]` to prevent truncation of 16-character ULPINs and survey identifiers. Positioned at `top-[68px] right-4 z-20`.
2. **`InspectorActionBar.tsx`**: Sized to 44px primary / 38px secondary button hierarchy with copper and jade accent styling.
3. **`BuildingInspector.tsx`, `FloorInspector.tsx`, `ParcelInspector.tsx`, `UnitInspector.tsx`**: Standardized metric grids, status badges, and action bars.
4. **`RoomInspector.tsx`, `ConflictInspector.tsx`, `CityInspector.tsx`**: Replaced all legacy slate borders, dividers, and cyan accent icons.
5. **`CorridorInspector.tsx`, `DoorInspector.tsx`, `HallInspector.tsx`, `InfrastructureInspector.tsx`, `WindowInspector.tsx`**: Upgraded hierarchy dividers, icons, and conflict banners.
6. **`PostGISSpatialIntelligenceCard.tsx`**: Replaced slate text with BhuSetu muted tones, polished nearby topology features list.
7. **`CesiumViewer.tsx`**: Upgraded isolation mode banners, measurement prompts, and camera toolbar with dynamic collision avoidance.
8. **`LayerControl.tsx`, `SearchControl.tsx`, `FilterControl.tsx`, `PropertyInspector.tsx`**: Swept across `/properties` route to ensure unified dark-glassmorphic styling across both 2D and 3D maps.

---

## 8. Verification Checklist

| Checkpoint | Status | Result |
|------------|--------|--------|
| TypeScript compilation (`npx tsc --noEmit`) | ✅ PASS | 0 errors |
| Workspace TopBar + Breadcrumb spacing | ✅ PASS | Explicit 8px safe zone margin (`top-[68px]`) |
| Right Inspector behind TopBar | ✅ PASS | Anchored at `top-[68px]`, scrollable within viewport |
| Camera Toolbar vs Inspector collision | ✅ PASS | Dynamically offsets to `right-[436px]` when inspector is open |
| Bottom tool strip vs Telemetry bar | ✅ PASS | Anchored at `bottom-11` (12px buffer above `bottom-0`) |
| Inspector button hierarchy | ✅ PASS | 44px primary, 38px secondary |
| Font size compliance | ✅ PASS | No labels below 11px font size |
| Color tokens sweep | ✅ PASS | All generic `slate-`, `cyan-`, `purple-` tokens eliminated |
| 2D Properties page alignment | ✅ PASS | Layer, Search, Filter, and Property Inspector fully aligned |

---

## 9. Modified Files Summary (25 files)

```
apps/web/tailwind.config.ts
apps/web/app/3d-city/page.tsx
apps/web/components/workspace/WorkspaceBreadcrumb.tsx
apps/web/components/workspace/LeftSpatialControlPanel.tsx
apps/web/components/workspace/BottomSpatialToolStrip.tsx
apps/web/components/workspace/inspector/InspectorShell.tsx
apps/web/components/workspace/inspector/InspectorActionBar.tsx
apps/web/components/workspace/inspector/BuildingInspector.tsx
apps/web/components/workspace/inspector/FloorInspector.tsx
apps/web/components/workspace/inspector/ParcelInspector.tsx
apps/web/components/workspace/inspector/UnitInspector.tsx
apps/web/components/workspace/inspector/RoomInspector.tsx
apps/web/components/workspace/inspector/ConflictInspector.tsx
apps/web/components/workspace/inspector/CityInspector.tsx
apps/web/components/workspace/inspector/CorridorInspector.tsx
apps/web/components/workspace/inspector/DoorInspector.tsx
apps/web/components/workspace/inspector/HallInspector.tsx
apps/web/components/workspace/inspector/InfrastructureInspector.tsx
apps/web/components/workspace/inspector/WindowInspector.tsx
apps/web/components/workspace/inspector/PostGISSpatialIntelligenceCard.tsx
apps/web/components/cesium/CesiumViewer.tsx
apps/web/components/map/LayerControl.tsx
apps/web/components/map/SearchControl.tsx
apps/web/components/map/FilterControl.tsx
apps/web/components/map/PropertyInspector.tsx
```
