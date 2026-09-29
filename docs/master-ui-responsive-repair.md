# BhuSetu 3D — Master UI/UX Repair & Responsive Layout System

## 1. Overview & Core Directives

This document summarizes the master UI/UX, responsive layout, overlap elimination, and typography standardization implemented across **BhuSetu 3D**.

### Non-Negotiable Directive
> **"OVERLAP IS A LAYOUT PROBLEM, NOT A FONT-SIZE PROBLEM."**  
> Under no circumstances was overlap solved by reducing fonts to microscopic sizes (8px–10px) or shrinking touch targets into unclickable buttons. Standard typography across the entire platform enforces a minimum of **11px** for secondary metadata/badges and **13px–14px** for body/inputs, maintaining touch targets at $\ge 36\text{px}$–$40\text{px}$.

---

## 2. Global Hierarchy & Visual Priority Model

The application adheres to a strict visual priority hierarchy:
$$\text{WORLD} \longrightarrow \text{SPATIAL CONTEXT} \longrightarrow \text{PRIMARY ACTION} \longrightarrow \text{CONTEXTUAL INFO} \longrightarrow \text{SECONDARY CONTROLS}$$

1. **3D Cesium Canvas (`WORLD`):** The primary hero element. It is never obstructed by non-essential floating widgets or opaque blocks.
2. **Top Workspace Bar & Breadcrumb (`SPATIAL CONTEXT`):** Clear, single-row or wrapped hierarchy (`City > Parcel > Building > Floor > Room`) with responsive truncation.
3. **Primary Action Strip (`PRIMARY ACTION`):** Central bottom dock with elevation, camera tools, and mode switchers.
4. **Contextual Inspector (`CONTEXTUAL INFO`):** Floating right panel on desktop/tablet, converting smoothly into a swipeable bottom sheet on mobile.
5. **Left Spatial Layers & Outliner (`SECONDARY CONTROLS`):** Floating collapsible side rail on desktop, transforming into a sliding drawer modal on mobile.

---

## 3. Responsive Breakpoints & Adaptive Behaviors

| Viewport | Device Range | Navigation & Panels Behavior |
| :--- | :--- | :--- |
| **Desktop Ultra & Standard** | $\ge 1280\text{px}$ (`lg`, `xl`, `2xl`) | Full persistent sidebar (w-64), dual floating glass panels (Left Layers w-80, Right Inspector w-96), full telemetry status strips. |
| **Laptop / Tablet Landscape** | $1024\text{px} - 1279\text{px}$ (`md` to `lg`) | Sidebar transitions to drawer or icon rail; inspector width constrained to 360px; header items truncate gracefully. |
| **Tablet Portrait** | $768\text{px} - 1023\text{px}$ (`md`) | TopBar hamburger menu activates; sidebar becomes backdrop-dimmed drawer; inspector remains anchored right with vertical scrolling. |
| **Mobile** | $< 768\text{px}$ (360px–430px) | Full-screen canvas experience. Left panel opens via drawer modal (`fixed inset-0 z-40`). Right inspector transforms into a **swipeable bottom sheet** (`max-h-[65vh]`). Bottom tool strip adapts to icon-only buttons with horizontal scroll. |

---

## 4. Key Architectural Fixes Implemented

### A. Navigation & Shell Layout
- **Global Drawer Hook:** Added `useNavigationDrawer` (`apps/web/hooks/useNavigationDrawer.tsx`) to manage mobile drawer state across all route transitions.
- **TopBar (`TopBar.tsx`):**
  - Added mobile hamburger menu toggle.
  - User profile badge made responsive: avatar and role badge stay visible while user email and full name hide on small viewports.
  - Standardized all button heights to $\ge 36\text{px}$.
- **Sidebar (`Sidebar.tsx`):**
  - Converted desktop layout to `hidden lg:flex w-64`.
  - Added slide-over modal drawer (`fixed inset-0 z-50 lg:hidden`) with `bg-black/60 backdrop-blur-sm` and dismiss-on-click navigation.
  - Upgraded all font sizes from 9px/10px to standard 11px/12px font sizes with $\ge 40\text{px}$ interactive hit targets.

### B. 3D Workspace Environment (`/3d-city`)
- **Left Control Panel (`LeftSpatialControlPanel.tsx`):**
  - Responsive positioning: floating glass card on desktop, slide-out drawer on mobile with backdrop overlay.
  - Fixed syntax nesting and upgraded all sub-10px fonts (`text-[7px]`, `text-[8px]`, `text-[9px]`, `text-[10px]`) to `text-[11px]`.
- **Workspace TopBar & Breadcrumbs (`WorkspaceTopBar.tsx`, `WorkspaceBreadcrumb.tsx`):**
  - Multi-row wrapping and truncation prevents colliding with camera/layer tools.
  - Added role-based indicator and system health status.
- **Bottom Tool Strip (`BottomSpatialToolStrip.tsx`):**
  - Priority dock design with horizontal scrolling (`overflow-x-auto no-scrollbar`) on mobile.
  - Camera presets and height sliders collapse into popup drawers when horizontal space is constrained.
- **Contextual Inspector & Bottom Sheet (`InspectorShell.tsx`, `PropertyInspector.tsx`):**
  - Mobile bottom sheet with drag indicator handle (`w-10 h-1 bg-[rgba(244,240,232,0.2)] rounded-full`).
  - Height bounded to `max-h-[65vh]` on mobile to ensure the 3D scene remains visible and interactive above the card.
  - All typography upgraded: headers to `text-sm font-semibold`, labels to `text-[11px] font-mono`, values to `text-xs font-mono font-bold`.
- **Inspector Sections (`ContextualIntelligenceSection.tsx`, `FloorInspector.tsx`, `UnitInspector.tsx`, `ParcelInspector.tsx`):**
  - Eliminated all absolute positioned overlaps.
  - Discrepancy matrices, evidence DAGs, and infrastructure utility badges reflowed into responsive flex/grid layouts.

### C. Standard Operational Modules (24 Next.js Pages)
All platform pages upgraded to prevent viewport clipping and eliminate rigid padding:
- **Viewports:** Replaced rigid `h-screen` with `h-[calc(100vh-3.5rem)]` across all operational pages.
- **Responsive Padding:** Replaced rigid `p-8` or `px-8` with `px-4 sm:px-6 lg:px-8` and `p-4 sm:p-6 lg:p-8`.
- **Target Pages Refactored:**
  - `/overview`
  - `/properties`
  - `/verification` & `/verification/[id]`
  - `/conflicts` & `/conflicts/[id]`
  - `/spatial-investigator`
  - `/history`
  - `/analytics`
  - `/evidence` & `/evidence/[id]`
  - `/spatial-analysis`
  - `/admin`, `/admin/users`, `/admin/roles`, `/admin/audit`, `/admin/settings`

---

## 5. Verification & Build Results

1. **TypeScript Typecheck:**
   - Command: `npx tsc --noEmit`
   - Exit Code: `0` (Zero type errors across all 25 Next.js routes and component tree).
2. **Next.js Production Build:**
   - Command: `npm run build`
   - Status: **25/25 pages successfully generated and optimized**.
   - First Load JS shared by all: `87.4 kB`.
   - Output artifacts verified cleanly for production deployment.
