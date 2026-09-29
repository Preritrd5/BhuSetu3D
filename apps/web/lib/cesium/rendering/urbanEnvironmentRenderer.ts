/**
 * BhuSetu 3D — Urban Environment Procedural Cesium Renderer
 * Phase 2: Rich Multi-Building 3D Digital Twin Environment & Spatial Composition
 *
 * Implements high-performance procedural rendering of:
 * - Cadastral Ground Studio Apron
 * - Hierarchical Road Network (Dual-Lane, Shoulders, Sidewalks, Zebra Crosswalks)
 * - Parcel Boundaries (Subtle Restrained Ground Polygons, Elevating on Selection)
 * - Multi-Typology Buildings (Type A, B, C, D) with Floor Spandrels, Balconies & Roof Gear
 * - Hero Architectural Articulation for Primary Demonstration Property (Aura Horizon)
 * - Roadside Timber Trees & Architectural Street Luminaires
 * - Subsurface & Transit Viaduct Infrastructure (Clearly Marked Illustrative)
 */

import {
  UrbanBuildingDefinition,
  UrbanParcelDefinition,
  UrbanRoadCorridor,
  UrbanInfrastructureLine,
  URBAN_PARCELS,
  URBAN_BUILDINGS,
  URBAN_ROADS,
  URBAN_INFRASTRUCTURE,
  URBAN_VEGETATION_TREES,
  URBAN_STREET_LAMPS,
} from "../data/urbanEnvironmentData";

export interface RenderContext {
  viewer: any;
  Cesium: any;
  selectedBuildingId: string | null;
  selectedParcelId: string | null;
  selectedFloorId?: string | null;
  comparisonEntityBId?: string | null;
  highlightEntityIds?: string[];
  currentLevel: string;
  isolateBuilding?: boolean;
  isolateFloor?: boolean;
  explodeFloors?: boolean;
  temporalYear?: number;
  layers: {
    buildings: boolean;
    parcels: boolean;
    subsurfaceUtilities?: boolean;
    conflicts?: boolean;
  };
}

export interface RenderedEntityCollections {
  groundGrid: any[];
  roads: any[];
  parcels: Map<string, any>;
  buildings: Map<string, any>;
  cityEntities: any[];
  facadeElements: any[];
  roofEquipment: any[];
  explodedEntities: any[];
  flyoverEntities: any[];
  utilities: Map<string, any>;
  vegetation: any[];
  streetLamps: any[];
}

export function createEmptyCollections(): RenderedEntityCollections {
  return {
    groundGrid: [],
    roads: [],
    parcels: new Map(),
    buildings: new Map(),
    cityEntities: [],
    facadeElements: [],
    roofEquipment: [],
    explodedEntities: [],
    flyoverEntities: [],
    utilities: new Map(),
    vegetation: [],
    streetLamps: [],
  };
}

export function clearCollections(
  viewer: any,
  collections: RenderedEntityCollections
): void {
  if (!viewer) return;

  const removeArray = (arr: any[]) => {
    arr.forEach((e) => {
      try {
        viewer.entities.remove(e);
      } catch {}
    });
    arr.length = 0;
  };

  const removeMap = (map: Map<string, any>) => {
    map.forEach((e) => {
      try {
        viewer.entities.remove(e);
      } catch {}
    });
    map.clear();
  };

  removeArray(collections.groundGrid);
  removeArray(collections.roads);
  removeMap(collections.parcels);
  removeMap(collections.buildings);
  removeArray(collections.cityEntities);
  removeArray(collections.facadeElements);
  removeArray(collections.roofEquipment);
  removeArray(collections.explodedEntities);
  removeArray(collections.flyoverEntities);
  removeMap(collections.utilities);
  removeArray(collections.vegetation);
  removeArray(collections.streetLamps);
}

// ============================================================================
// 1. Cadastral Studio Ground Apron
// ============================================================================
export function renderGroundApron(
  viewer: any,
  Cesium: any,
  collections: RenderedEntityCollections
): void {
  const apron = viewer.entities.add({
    name: "Cadastral Digital Twin Studio Floor",
    polygon: {
      hierarchy: Cesium.Cartesian3.fromDegreesArray([
        77.5670, 12.9920,
        77.5770, 12.9920,
        77.5770, 13.0050,
        77.5670, 13.0050,
        77.5670, 12.9920,
      ]),
      height: 0.0,
      material: Cesium.Color.fromCssColorString("#060A12"),
    },
  });
  collections.groundGrid.push(apron);
}

// ============================================================================
// 2. Road Network, Sidewalks, & Intersections
// ============================================================================
export function renderRoadNetwork(
  viewer: any,
  Cesium: any,
  roads: UrbanRoadCorridor[],
  collections: RenderedEntityCollections
): void {
  roads.forEach((road) => {
    const flatPositions: number[] = [];
    road.positions.forEach(([lng, lat]) => flatPositions.push(lng, lat));

    // Road Corridor Surface
    const roadEntity = viewer.entities.add({
      name: road.name,
      corridor: {
        positions: Cesium.Cartesian3.fromDegreesArray(flatPositions),
        width: road.width,
        height: road.elevation,
        material: Cesium.Color.fromCssColorString(road.color),
      },
    });
    collections.roads.push(roadEntity);

    // Arterial Centerline Dashed Divider
    if (road.hasCenterlineMarking) {
      const centerLine = viewer.entities.add({
        name: `${road.name} Centerline`,
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights([
            road.positions[0][0], road.positions[0][1], road.elevation + 0.04,
            road.positions[1][0], road.positions[1][1], road.elevation + 0.04,
          ]),
          width: 2.5,
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.fromCssColorString("#F1F5F9"),
            dashLength: 12.0,
          }),
        },
      });
      collections.roads.push(centerLine);
    }

    // Arterial Road Shoulders
    if (road.hasShoulderLines) {
      [77.57176, 77.57188].forEach((sLng, idx) => {
        const shoulder = viewer.entities.add({
          name: `${road.name} Shoulder ${idx === 0 ? "West" : "East"}`,
          corridor: {
            positions: Cesium.Cartesian3.fromDegreesArray([
              sLng, 12.9922,
              sLng, 13.0046,
            ]),
            width: 0.18,
            height: road.elevation + 0.02,
            material: Cesium.Color.fromCssColorString("#94A3B8").withAlpha(0.85),
          },
        });
        collections.roads.push(shoulder);
      });
    }

    // Concrete Sidewalks with 0.16m Curbs
    if (road.sidewalks) {
      const sw = road.sidewalks;
      [sw.westLng, sw.eastLng].forEach((wLng, idx) => {
        if (!wLng) return;
        const sidewalk = viewer.entities.add({
          name: `${road.name} Pedestrian Sidewalk ${idx === 0 ? "West" : "East"}`,
          corridor: {
            positions: Cesium.Cartesian3.fromDegreesArray([
              wLng, 12.9920,
              wLng, 13.0048,
            ]),
            width: sw.width,
            height: 0.04,
            extrudedHeight: 0.16,
            material: Cesium.Color.fromCssColorString("#253346"),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString("#334960"),
            outlineWidth: 1.0,
          },
        });
        collections.roads.push(sidewalk);
      });
    }

    // Pedestrian Zebra Crosswalks at Intersections
    if (road.hasCrosswalks && road.crosswalkLats) {
      road.crosswalkLats.forEach((cLat) => {
        const crosswalk = viewer.entities.add({
          name: `${road.name} Zebra Crosswalk (${cLat})`,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([
              77.57176, cLat, 0.08,
              77.57188, cLat, 0.08,
            ]),
            width: 6.0,
            material: new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.WHITE,
              dashLength: 6.0,
            }),
          },
        });
        collections.roads.push(crosswalk);
      });
    }
  });
}

// ============================================================================
// 3. Cadastral Parcels Layer (Subtle, Restrained, Highlighting on Selection)
// ============================================================================
export function renderParcels(
  viewer: any,
  Cesium: any,
  parcels: UrbanParcelDefinition[],
  ctx: RenderContext,
  collections: RenderedEntityCollections
): void {
  if (!ctx.layers.parcels) return;

  parcels.forEach((p) => {
    const flatCoords: number[] = [];
    p.footprint.forEach(([lng, lat]) => flatCoords.push(lng, lat));

    const isSelected =
      p.parcelId === ctx.selectedParcelId ||
      p.legacyId === ctx.selectedParcelId ||
      p.ulpin === ctx.selectedParcelId;

    // Normal vs Selected styling
    const fillColor = isSelected
      ? Cesium.Color.fromCssColorString("#F97316").withAlpha(0.20)
      : p.isUndeveloped
      ? Cesium.Color.fromCssColorString("#132E28").withAlpha(0.25)
      : Cesium.Color.fromCssColorString("#14B8A6").withAlpha(0.07);

    const outlineColor = isSelected
      ? Cesium.Color.fromCssColorString("#F97316")
      : p.isUndeveloped
      ? Cesium.Color.fromCssColorString("#10B981").withAlpha(0.75)
      : Cesium.Color.fromCssColorString("#14B8A6").withAlpha(0.50);

    const entity = viewer.entities.add({
      name: `${p.surveyNumber} (${p.ulpin})`,
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
        height: 0.06,
        material: fillColor,
        outline: true,
        outlineColor: outlineColor,
        outlineWidth: isSelected ? 3.0 : 1.5,
      },
    });

    (entity as any)._bhuParcelId = p.legacyId || p.parcelId;
    (entity as any)._bhuParcelMeta = p;
    collections.parcels.set(p.parcelId, entity);
    if (p.legacyId) {
      collections.parcels.set(p.legacyId, entity);
    }

    // Undeveloped Parcel corner survey markers
    if (p.isUndeveloped) {
      p.footprint.slice(0, 4).forEach(([cLng, cLat], idx) => {
        const marker = viewer.entities.add({
          name: `Survey Marker Stone ${idx + 1} (${p.surveyNumber})`,
          position: Cesium.Cartesian3.fromDegrees(cLng, cLat, 0.4),
          cylinder: {
            length: 0.8,
            topRadius: 0.15,
            bottomRadius: 0.18,
            material: Cesium.Color.fromCssColorString("#10B981"),
            outline: true,
            outlineColor: Cesium.Color.WHITE,
          },
        });
        collections.parcels.set(`${p.parcelId}-stone-${idx}`, marker);
      });
    }
  });
}

// ============================================================================
// 4. Multi-Typology Buildings with Floor Slabs, Balconies, & Roof Architecture
// ============================================================================
export function renderBuildings(
  viewer: any,
  Cesium: any,
  buildings: UrbanBuildingDefinition[],
  ctx: RenderContext,
  collections: RenderedEntityCollections
): void {
  if (!ctx.layers.buildings) return;

  const isCitySubdued =
    ctx.isolateBuilding ||
    ctx.isolateFloor ||
    ctx.explodeFloors ||
    (ctx.currentLevel !== "CITY" && ctx.currentLevel !== "BUILDING" && ctx.currentLevel !== "PARCEL");

  buildings.forEach((b) => {
    const flatCoords: number[] = [];
    b.footprint.forEach(([lng, lat]) => flatCoords.push(lng, lat));

    const isSelected =
      b.buildingId === ctx.selectedBuildingId ||
      b.legacyId === ctx.selectedBuildingId ||
      b.code === ctx.selectedBuildingId;

    const isComparisonB = ctx.comparisonEntityBId === b.buildingId;
    const isAiHighlighted =
      ctx.highlightEntityIds &&
      (ctx.highlightEntityIds.includes(b.buildingId) ||
        ctx.highlightEntityIds.includes(b.code) ||
        (b.legacyId && ctx.highlightEntityIds.includes(b.legacyId)));

    const isConflict = b.hasConflict && ctx.layers.conflicts;

    // Temporal height adjustment for demo primary building in 2024
    const bHeight =
      ctx.temporalYear === 2024 && b.isPrimaryDemo
        ? b.sanctionedHeight
        : b.height;

    const isCutawayActive =
      isSelected &&
      (ctx.currentLevel === "FLOOR" ||
        ctx.currentLevel === "UNIT" ||
        ctx.currentLevel === "ROOM" ||
        ctx.currentLevel === "CORRIDOR" ||
        ctx.currentLevel === "ELEMENT");

    // ========================================================================
    // A. PRIMARY DEMONSTRATION BUILDING SPECIAL HERO HANDLING (AURA HORIZON)
    // ========================================================================
    if (b.isPrimaryDemo) {
      // ----------------------------------------------------------------
      // FLOOR CONSTANTS (28m building: 7 × 4.0m floors)
      // ----------------------------------------------------------------
      const FL_HEIGHT = 4.0;       // metres per structural floor
      const FL_GAP    = 2.0;       // exploded separation gap
      const ROOF_H    = 2.5;       // penthouse / mechanical roof band
      const BLDG_TOP  = FL_HEIGHT * 7; // 28.0m

      // Canonical 7-Floor Definitions (FL-01 to FL-07)
      const SEVEN_FLOOR_DEFS = [
        { id: "FL-01", label: "FL-01 — Ground Floor (Lobby & Retail)",    floorNum: 1, isAuthoritative: false },
        { id: "FL-02", label: "FL-02 — First Floor (Commercial Banking)", floorNum: 2, isAuthoritative: false },
        { id: "FL-03", label: "FL-03 — Executive Suite (Surveyed)",       floorNum: 3, isAuthoritative: true  },
        { id: "FL-04", label: "FL-04 — Tech Workstation Suites",          floorNum: 4, isAuthoritative: false },
        { id: "FL-05", label: "FL-05 — Corporate Advisory Suites",        floorNum: 5, isAuthoritative: false },
        { id: "FL-06", label: "FL-06 — Innovation & R&D Hub",             floorNum: 6, isAuthoritative: false },
        { id: "FL-07", label: "FL-07 — Sky Lounge & Executive Boardroom", floorNum: 7, isAuthoritative: false },
      ];

      if (ctx.explodeFloors && isSelected) {
        // ========================================
        // EXPLODED FLOOR VISUALIZATION MODE (7 FLOORS)
        // 7 Slab floors separated vertically by FL_GAP
        // ========================================
        const totalExplodedH = FL_HEIGHT * 7 + FL_GAP * 6 + ROOF_H;

        SEVEN_FLOOR_DEFS.forEach((fd, idx) => {
          const base = idx * (FL_HEIGHT + FL_GAP);
          const top = base + FL_HEIGHT;

          // When cutaway active for this floor, skip solid slab so interior shows
          if (isCutawayActive && fd.id === ctx.selectedFloorId) return;

          const isActiveFloor = ctx.isolateFloor
            ? (fd.id === ctx.selectedFloorId || (!ctx.selectedFloorId && fd.id === "FL-03"))
            : (fd.id === ctx.selectedFloorId);

          const floorAlpha = isActiveFloor ? 0.95 : ctx.isolateFloor ? 0.15 : 0.85 + idx * 0.015;
          const outlineAlpha = isActiveFloor ? 1.0 : ctx.isolateFloor ? 0.30 : 0.85;
          const outlineW = isActiveFloor ? 3.0 : 1.8;

          const floorEntity = viewer.entities.add({
            name: fd.label,
            polygon: {
              hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
              height: base,
              extrudedHeight: top,
              material: Cesium.Color.fromCssColorString("#0C2535").withAlpha(floorAlpha),
              outline: true,
              outlineColor: isActiveFloor
                ? Cesium.Color.fromCssColorString("#C47B50")
                : fd.id === "FL-03"
                ? Cesium.Color.fromCssColorString("#F97316").withAlpha(outlineAlpha)
                : Cesium.Color.fromCssColorString("#334155").withAlpha(outlineAlpha),
              outlineWidth: outlineW,
            },
          });
          (floorEntity as any)._bhuFloorId = fd.id;
          collections.explodedEntities.push(floorEntity);

          // Floor label badge in exploded view
          const tagEntity = viewer.entities.add({
            name: `${fd.id} Badge`,
            position: Cesium.Cartesian3.fromDegrees(
              b.centroid[0] + 0.00038,
              b.centroid[1],
              base + FL_HEIGHT * 0.5
            ),
            label: {
              text: `${fd.id} · ${fd.isAuthoritative ? "[AUTH]" : "[DEMO]"}`,
              font: "bold 10px monospace",
              fillColor: fd.isAuthoritative ? Cesium.Color.fromCssColorString("#F59E0B") : Cesium.Color.WHITE,
              showBackground: true,
              backgroundColor: Cesium.Color.fromCssColorString("#090E17").withAlpha(0.92),
              backgroundPadding: new Cesium.Cartesian2(6, 4),
              pixelOffset: new Cesium.Cartesian2(0, 0),
            },
          });
          collections.explodedEntities.push(tagEntity);
        });

        // Roof / Penthouse Volume
        const roofBase = 7 * (FL_HEIGHT + FL_GAP);
        const roof = viewer.entities.add({
          name: "Rooftop Mechanical Penthouse",
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
            height: roofBase,
            extrudedHeight: roofBase + ROOF_H,
            material: Cesium.Color.fromCssColorString("#1E293B").withAlpha(0.90),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString("#475569"),
            outlineWidth: 1.5,
          },
        });
        collections.explodedEntities.push(roof);

        // Corner Guide Polylines
        b.footprint.slice(0, 4).forEach(([cLng, cLat], idx) => {
          const leader = viewer.entities.add({
            name: `Corner Leader Guide ${idx + 1}`,
            polyline: {
              positions: [
                Cesium.Cartesian3.fromDegrees(cLng, cLat, 0.0),
                Cesium.Cartesian3.fromDegrees(cLng, cLat, totalExplodedH),
              ],
              width: 1.5,
              material: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.fromCssColorString("#475569").withAlpha(0.85),
                dashLength: 12.0,
              }),
            },
          });
          collections.explodedEntities.push(leader);
        });
      } else {
        // ======================================================
        // NON-EXPLODED MODE: Per-Floor Slab Rendering (7 Floors)
        //
        // In BUILDING/FLOOR/UNIT/ROOM/ELEMENT levels: render each
        // of the 7 floors as distinct Cesium entities so every floor
        // is individually clickable, isolatable, and inspectable.
        // ======================================================
        const isDetailLevel =
          isSelected &&
          (ctx.currentLevel === "BUILDING" ||
           ctx.currentLevel === "FLOOR" ||
           ctx.currentLevel === "UNIT" ||
           ctx.currentLevel === "ROOM" ||
           ctx.currentLevel === "CORRIDOR" ||
           ctx.currentLevel === "ELEMENT");

        if (isDetailLevel) {
          const activeFloorId = ctx.selectedFloorId || "FL-03";

          SEVEN_FLOOR_DEFS.forEach((fd, idx) => {
            const base = idx * FL_HEIGHT;
            const top = base + FL_HEIGHT;

            // When cutaway active for this specific floor, hide the solid slab
            if (isCutawayActive && fd.id === ctx.selectedFloorId) return;

            const isThisFloorActive = activeFloorId === fd.id;

            // Floor isolation: selected floor 100% visible, others ghosted
            const alpha = ctx.isolateFloor
              ? (isThisFloorActive ? 0.92 : 0.08)
              : isComparisonB
              ? 0.85
              : isCutawayActive
              ? 0.35
              : 0.88 + idx * 0.015;

            const floorOutlineColor = isThisFloorActive && ctx.isolateFloor
              ? Cesium.Color.fromCssColorString("#C47B50")       // Copper — active floor
              : isComparisonB
              ? Cesium.Color.fromCssColorString("#F59E0B")
              : isThisFloorActive
              ? Cesium.Color.fromCssColorString("#C47B50")
              : isConflict && fd.id === "FL-03"                  // Conflict floor
              ? Cesium.Color.fromCssColorString("#F97316")
              : Cesium.Color.fromCssColorString("#334960").withAlpha(0.80);

            const floorOutlineW = isThisFloorActive ? 3.0 : 1.5;

            const slabEntity = viewer.entities.add({
              name: fd.label,
              polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
                height: base,
                extrudedHeight: top,
                material: isComparisonB
                  ? Cesium.Color.fromCssColorString("#B45309").withAlpha(alpha)
                  : isCutawayActive
                  ? Cesium.Color.fromCssColorString("#0D2534").withAlpha(0.35)
                  : Cesium.Color.fromCssColorString("#0C2535").withAlpha(alpha),
                outline: true,
                outlineColor: floorOutlineColor,
                outlineWidth: floorOutlineW,
              },
            });

            (slabEntity as any)._bhuBuildingId = b.legacyId || b.buildingId;
            (slabEntity as any)._bhuFloorId = fd.id;
            (slabEntity as any)._bhuBuildingMeta = b;
            collections.buildings.set(`${b.buildingId}-${fd.id}`, slabEntity);
          });

          // Roof / parapet volume (above FL-07)
          if (!isCutawayActive) {
            const parapetVol = viewer.entities.add({
              name: "Roof Parapet Volume",
              polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
                height: BLDG_TOP,
                extrudedHeight: BLDG_TOP + ROOF_H,
                material: Cesium.Color.fromCssColorString("#1A2638").withAlpha(
                  ctx.isolateFloor ? 0.05 : 0.92
                ),
                outline: true,
                outlineColor: Cesium.Color.fromCssColorString("#475569").withAlpha(
                  ctx.isolateFloor ? 0.20 : 0.85
                ),
                outlineWidth: 1.5,
              },
            });
            (parapetVol as any)._bhuBuildingId = b.legacyId || b.buildingId;
            collections.buildings.set(`${b.buildingId}-roof`, parapetVol);
          }

          // Register main entity alias for flyTo etc.
          const mainAlias = viewer.entities.add({
            name: b.name,
            position: Cesium.Cartesian3.fromDegrees(b.centroid[0], b.centroid[1], FL_HEIGHT * 3.5),
            point: { pixelSize: 0.1, color: Cesium.Color.TRANSPARENT },
          });
          (mainAlias as any)._bhuBuildingId = b.legacyId || b.buildingId;
          (mainAlias as any)._bhuBuildingMeta = b;
          collections.buildings.set(b.buildingId, mainAlias);
          if (b.legacyId) collections.buildings.set(b.legacyId, mainAlias);

        } else {
          // CITY/PARCEL/non-selected: fast single-volume render
          const entity = viewer.entities.add({
            name: b.name,
            polygon: {
              hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
              height: 0.0,
              extrudedHeight: bHeight,
              material: isComparisonB
                ? Cesium.Color.fromCssColorString("#B45309").withAlpha(0.85)
                : isAiHighlighted
                ? Cesium.Color.fromCssColorString("#0C2535").withAlpha(0.92)
                : isCitySubdued
                ? Cesium.Color.fromCssColorString("#0C1A26").withAlpha(0.50)
                : Cesium.Color.fromCssColorString("#152332").withAlpha(0.92),
              outline: true,
              outlineColor: isAiHighlighted
                ? Cesium.Color.fromCssColorString("#38BDF8")
                : isComparisonB
                ? Cesium.Color.fromCssColorString("#F59E0B")
                : isConflict
                ? Cesium.Color.fromCssColorString("#F97316")
                : Cesium.Color.fromCssColorString("#334155"),
              outlineWidth: isAiHighlighted || isComparisonB ? 3.0 : 1.5,
            },
          });

          (entity as any)._bhuBuildingId = b.legacyId || b.buildingId;
          (entity as any)._bhuBuildingMeta = b;
          collections.buildings.set(b.buildingId, entity);
          if (b.legacyId) collections.buildings.set(b.legacyId, entity);
        }
      }

      // Hero Architectural Detailing (Entrance, mullions, spandrels, roof chillers)
      if (isSelected && !isCutawayActive && !ctx.explodeFloors) {
        // Glazed South Entrance Atrium
        const atrium = viewer.entities.add({
          name: "South Entrance Glazed Atrium",
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray([
              77.57210, 12.99828,
              77.57232, 12.99828,
              77.57232, 12.99834,
              77.57210, 12.99834,
              77.57210, 12.99828,
            ]),
            height: 0.0,
            extrudedHeight: 4.2,
            material: Cesium.Color.fromCssColorString("#0284C7").withAlpha(0.20),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString("#38BDF8").withAlpha(0.60),
            outlineWidth: 1.5,
          },
        });
        collections.facadeElements.push(atrium);

        // Entrance Colonnade Pillars
        [77.57212, 77.57218, 77.57224, 77.57230].forEach((colLng, idx) => {
          const col = viewer.entities.add({
            name: `Entrance Pillar ${idx + 1}`,
            position: Cesium.Cartesian3.fromDegrees(colLng, 12.99825, 1.8),
            cylinder: {
              length: 3.6,
              topRadius: 0.18,
              bottomRadius: 0.18,
              material: Cesium.Color.fromCssColorString("#94A3B8"),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString("#CBD5E1"),
            },
          });
          collections.facadeElements.push(col);
        });

        // Entrance Canopy
        const canopy = viewer.entities.add({
          name: "Main Entrance Canopy",
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray([
              77.57210, 12.99822,
              77.57232, 12.99822,
              77.57232, 12.99830,
              77.57210, 12.99830,
              77.57210, 12.99822,
            ]),
            height: 3.6,
            extrudedHeight: 3.85,
            material: Cesium.Color.fromCssColorString("#0284C7"),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString("#38BDF8"),
            outlineWidth: 1.5,
          },
        });
        collections.facadeElements.push(canopy);

        // Vertical Glass Curtain Mullions (West & East Facades)
        for (let lat = 12.99835; lat <= 12.99985; lat += 0.00015) {
          const mWest = viewer.entities.add({
            name: "Facade Mullion West",
            corridor: {
              positions: Cesium.Cartesian3.fromDegreesArray([
                77.57204, lat,
                77.57206, lat,
              ]),
              width: 0.15,
              height: 0.1,
              extrudedHeight: bHeight,
              material: Cesium.Color.fromCssColorString("#94A3B8").withAlpha(0.85),
            },
          });
          collections.facadeElements.push(mWest);

          const mEast = viewer.entities.add({
            name: "Facade Mullion East",
            corridor: {
              positions: Cesium.Cartesian3.fromDegreesArray([
                77.57236, lat,
                77.57238, lat,
              ]),
              width: 0.15,
              height: 0.1,
              extrudedHeight: bHeight,
              material: Cesium.Color.fromCssColorString("#94A3B8").withAlpha(0.85),
            },
          });
          collections.facadeElements.push(mEast);
        }

        // Horizontal Spandrel Floor Dividing Bands (Floors 1 to 7 + roof rim)
        [4.0, 8.0, 12.0, 16.0, 20.0, 24.0, bHeight].forEach((hVal, idx) => {
          const isRoofRim = idx === 6;
          const isSanctionLimit = idx === 4; // 20m sanctioned limit
          const spandrel = viewer.entities.add({
            name: `Spandrel Floor Band ${idx + 1}`,
            corridor: {
              positions: Cesium.Cartesian3.fromDegreesArray(flatCoords),
              width: 0.25,
              height: hVal - 0.25,
              extrudedHeight: hVal,
              material: Cesium.Color.fromCssColorString(
                isRoofRim
                  ? "#38BDF8"
                  : isSanctionLimit
                  ? "#F97316"
                  : "#475569"
              ).withAlpha(0.90),
            },
          });
          collections.facadeElements.push(spandrel);
        });

        // Rooftop Slatted Mechanical Screen Parapet Enclosure
        const parapetCage = viewer.entities.add({
          name: "Rooftop Mechanical Screen Parapet",
          corridor: {
            positions: Cesium.Cartesian3.fromDegreesArray([
              77.57210, 12.99850,
              77.57234, 12.99850,
              77.57234, 12.99955,
              77.57210, 12.99955,
              77.57210, 12.99850,
            ]),
            width: 0.35,
            height: bHeight,
            extrudedHeight: bHeight + 1.8,
            material: Cesium.Color.fromCssColorString("#E2E8F0").withAlpha(0.92),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString("#94A3B8"),
            outlineWidth: 1.5,
          },
        });
        collections.roofEquipment.push(parapetCage);

        // Elevator Machine Room Penthouse
        const penthouse = viewer.entities.add({
          name: "Rooftop Machine Penthouse",
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray([
              77.57214, 12.99910,
              77.57228, 12.99910,
              77.57228, 12.99948,
              77.57214, 12.99948,
              77.57214, 12.99910,
            ]),
            height: bHeight,
            extrudedHeight: bHeight + 2.5,
            material: Cesium.Color.fromCssColorString("#1E293B"),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString("#64748B"),
            outlineWidth: 1.5,
          },
        });
        collections.roofEquipment.push(penthouse);

        // Dual HVAC Chillers + Circular Fans
        [
          { name: "HVAC Chiller Unit A-1", lngMin: 77.57213, lngMax: 77.57221, fanLng: 77.57217 },
          { name: "HVAC Chiller Unit A-2", lngMin: 77.57225, lngMax: 77.57233, fanLng: 77.57229 },
        ].forEach((ch) => {
          const chiller = viewer.entities.add({
            name: ch.name,
            polygon: {
              hierarchy: Cesium.Cartesian3.fromDegreesArray([
                ch.lngMin, 12.99860,
                ch.lngMax, 12.99860,
                ch.lngMax, 12.99890,
                ch.lngMin, 12.99890,
                ch.lngMin, 12.99860,
              ]),
              height: bHeight,
              extrudedHeight: bHeight + 1.5,
              material: Cesium.Color.fromCssColorString("#334155"),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString("#14B8A6"),
              outlineWidth: 1.2,
            },
          });
          collections.roofEquipment.push(chiller);

          const fan = viewer.entities.add({
            name: `${ch.name} Exhaust Fan`,
            position: Cesium.Cartesian3.fromDegrees(ch.fanLng, 12.99875, bHeight + 1.52),
            cylinder: {
              length: 0.1,
              topRadius: 0.5,
              bottomRadius: 0.5,
              material: Cesium.Color.fromCssColorString("#0F172A"),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString("#475569"),
            },
          });
          collections.roofEquipment.push(fan);
        });
      }

      return; // Handled Primary Demo
    }

    // ========================================================================
    // B. GENERAL MULTI-TYPOLOGY BUILDINGS (TYPE A, B, C, D)
    // ========================================================================
    const hasPodium = b.podiumHeight && b.podiumHeight > 0;

    if (hasPodium && b.podiumHeight) {
      // 1. Podium Base Volume
      const podium = viewer.entities.add({
        name: `${b.name} (Podium Base)`,
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
          height: 0.0,
          extrudedHeight: b.podiumHeight,
          material: isCitySubdued
            ? Cesium.Color.fromCssColorString("#14202E").withAlpha(0.50)
            : Cesium.Color.fromCssColorString("#152233").withAlpha(0.95),
          outline: true,
          outlineColor: isCitySubdued
            ? Cesium.Color.fromCssColorString("#2D3F55").withAlpha(0.45)
            : Cesium.Color.fromCssColorString("#334155").withAlpha(0.50),
          outlineWidth: 1.0,
        },
      });
      collections.cityEntities.push(podium);

      // 2. Tower Shaft Volume
      const tower = viewer.entities.add({
        name: `${b.name} (Tower Shaft)`,
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
          height: b.podiumHeight,
          extrudedHeight: b.height,
          material: isAiHighlighted
            ? Cesium.Color.fromCssColorString("#0284C7").withAlpha(0.85)
            : isComparisonB
            ? Cesium.Color.fromCssColorString("#B45309").withAlpha(0.85)
            : isCitySubdued
            ? Cesium.Color.fromCssColorString("#162332").withAlpha(0.55)
            : Cesium.Color.fromCssColorString(b.primaryColor).withAlpha(0.92),
          outline: true,
          outlineColor: isAiHighlighted
            ? Cesium.Color.fromCssColorString("#38BDF8")
            : isComparisonB
            ? Cesium.Color.fromCssColorString("#F59E0B")
            : isCitySubdued
            ? Cesium.Color.fromCssColorString("#2E4158").withAlpha(0.45)
            : Cesium.Color.fromCssColorString(b.outlineColor).withAlpha(0.65),
          outlineWidth: isAiHighlighted ? 3.0 : isComparisonB ? 3.0 : 1.0,
        },
      });
      (tower as any)._bhuBuildingId = b.legacyId || b.buildingId;
      (tower as any)._bhuBuildingMeta = b;
      collections.buildings.set(b.buildingId, tower);
      if (b.legacyId) collections.buildings.set(b.legacyId, tower);

      // 3. Rooftop Penthouse Box
      if (b.hasPenthouse) {
        const ph = viewer.entities.add({
          name: `${b.name} (Rooftop Penthouse)`,
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
            height: b.height,
            extrudedHeight: b.height + 3.2,
            material: Cesium.Color.fromCssColorString("#1E293B").withAlpha(isCitySubdued ? 0.40 : 0.85),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString("#475569").withAlpha(isCitySubdued ? 0.35 : 0.65),
            outlineWidth: 1.0,
          },
        });
        collections.roofEquipment.push(ph);
      }
    } else {
      // Standard Volume
      const entity = viewer.entities.add({
        name: b.name,
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
          height: 0.0,
          extrudedHeight: b.height,
          material: isAiHighlighted
            ? Cesium.Color.fromCssColorString("#0284C7").withAlpha(0.85)
            : isComparisonB
            ? Cesium.Color.fromCssColorString("#B45309").withAlpha(0.85)
            : isCitySubdued
            ? Cesium.Color.fromCssColorString("#162332").withAlpha(0.55)
            : Cesium.Color.fromCssColorString(b.primaryColor).withAlpha(0.92),
          outline: true,
          outlineColor: isAiHighlighted
            ? Cesium.Color.fromCssColorString("#00F0FF")
            : isComparisonB
            ? Cesium.Color.fromCssColorString("#F59E0B")
            : isCitySubdued
            ? Cesium.Color.fromCssColorString("#2E4158").withAlpha(0.45)
            : Cesium.Color.fromCssColorString(b.outlineColor).withAlpha(0.65),
          outlineWidth: isAiHighlighted ? 3.5 : isComparisonB ? 3.0 : 1.0,
        },
      });
      (entity as any)._bhuBuildingId = b.legacyId || b.buildingId;
      (entity as any)._bhuBuildingMeta = b;
      collections.buildings.set(b.buildingId, entity);
      if (b.legacyId) collections.buildings.set(b.legacyId, entity);
    }

    // Horizontal Floor Separation Bands (Spandrel Ribbon Slabs) for Multi-Storey Buildings
    if (b.floorCount > 1) {
      const floorHeight = b.height / b.floorCount;
      for (let f = 1; f < b.floorCount; f++) {
        const floorZ = f * floorHeight;
        const floorBand = viewer.entities.add({
          name: `${b.name} Floor ${f} Slab Ribbon`,
          corridor: {
            positions: Cesium.Cartesian3.fromDegreesArray(flatCoords),
            width: 0.22,
            height: floorZ - 0.18,
            extrudedHeight: floorZ,
            material: Cesium.Color.fromCssColorString("#334155").withAlpha(isCitySubdued ? 0.45 : 0.85),
          },
        });
        collections.facadeElements.push(floorBand);
      }
    }

    // Balconies for Residential Blocks
    if (b.hasBalconies) {
      for (let bz = 4.0; bz < b.height; bz += 3.5) {
        const slab = viewer.entities.add({
          name: `${b.name} Balcony Ribbon ${bz.toFixed(1)}m`,
          corridor: {
            positions: Cesium.Cartesian3.fromDegreesArray(flatCoords),
            width: 0.35,
            height: bz - 0.2,
            extrudedHeight: bz,
            material: Cesium.Color.fromCssColorString("#334155").withAlpha(isCitySubdued ? 0.35 : 0.80),
          },
        });
        collections.cityEntities.push(slab);
      }
    }

    // Colonnade Glazed Base for Mixed-Use Retail Arcades
    if (b.hasColonnade) {
      const arcadeBase = viewer.entities.add({
        name: `${b.name} Retail Arcade Glazed Base`,
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
          height: 0.0,
          extrudedHeight: Math.min(4.5, b.height * 0.4),
          material: Cesium.Color.fromCssColorString("#0284C7").withAlpha(isCitySubdued ? 0.15 : 0.20),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString("#334155").withAlpha(isCitySubdued ? 0.35 : 0.55),
          outlineWidth: 1.0,
        },
      });
      collections.cityEntities.push(arcadeBase);
    }

    // Rooftop Parapet Perimeter Rims for Flat Roofs
    if (b.roofType === "FLAT_PARAPET") {
      const parapet = viewer.entities.add({
        name: `${b.name} Rooftop Parapet Rim`,
        corridor: {
          positions: Cesium.Cartesian3.fromDegreesArray(flatCoords),
          width: 0.25,
          height: b.height,
          extrudedHeight: b.height + 0.9,
          material: Cesium.Color.fromCssColorString("#475569").withAlpha(isCitySubdued ? 0.45 : 0.90),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString("#64748B").withAlpha(isCitySubdued ? 0.35 : 0.70),
          outlineWidth: 1.0,
        },
      });
      collections.roofEquipment.push(parapet);
    }
  });
}

// ============================================================================
// 5. Elevated Metro Transit Viaduct Corridor
// ============================================================================
export function renderTransitViaduct(
  viewer: any,
  Cesium: any,
  collections: RenderedEntityCollections
): void {
  // 1. Concrete Box-Girder Deck Slab (z = 8.5m to 9.2m)
  const flyoverDeck = viewer.entities.add({
    name: "Elevated Transit Viaduct Deck (Illustrative Demo Data)",
    corridor: {
      positions: Cesium.Cartesian3.fromDegreesArray([
        77.57325, 12.9928,
        77.57325, 13.0045,
      ]),
      width: 7.6,
      height: 8.5,
      extrudedHeight: 9.2,
      material: Cesium.Color.fromCssColorString("#334155"),
      outline: true,
      outlineColor: Cesium.Color.fromCssColorString("#475569"),
      outlineWidth: 1.5,
    },
  });
  collections.flyoverEntities.push(flyoverDeck);

  // 2. Parapet Safety Barriers (West and East)
  [77.57321, 77.57329].forEach((pLng, idx) => {
    const parapet = viewer.entities.add({
      name: `Viaduct Parapet Barrier ${idx === 0 ? "West" : "East"} (Illustrative)`,
      corridor: {
        positions: Cesium.Cartesian3.fromDegreesArray([
          pLng, 12.9928,
          pLng, 13.0045,
        ]),
        width: 0.35,
        height: 9.2,
        extrudedHeight: 10.1,
        material: Cesium.Color.fromCssColorString("#475569"),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#64748B"),
      },
    });
    collections.flyoverEntities.push(parapet);
  });

  // 3. Central Dual Rail Transit Tracks & Ballast Bed
  const trackBed = viewer.entities.add({
    name: "Viaduct Dual Rail Transit Bed (Illustrative)",
    corridor: {
      positions: Cesium.Cartesian3.fromDegreesArray([
        77.57325, 12.9928,
        77.57325, 13.0045,
      ]),
      width: 1.8,
      height: 9.22,
      extrudedHeight: 9.30,
      material: Cesium.Color.fromCssColorString("#0F172A"),
    },
  });
  collections.flyoverEntities.push(trackBed);

  // 4. Cylindrical Concrete Support Piers (spaced every ~35m)
  const pierLatitudes = [
    12.9932, 12.9942, 12.9952, 12.9962, 12.9972, 12.9982,
    12.9992, 13.0002, 13.0012, 13.0022, 13.0032, 13.0042,
  ];
  pierLatitudes.forEach((pLat, idx) => {
    const pier = viewer.entities.add({
      name: `Viaduct Concrete Support Pier ${idx + 1} (Illustrative)`,
      position: Cesium.Cartesian3.fromDegrees(77.57325, pLat, 4.25),
      cylinder: {
        length: 8.5,
        topRadius: 0.70,
        bottomRadius: 0.75,
        material: Cesium.Color.fromCssColorString("#475569"),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#64748B"),
        outlineWidth: 1.0,
      },
    });
    collections.flyoverEntities.push(pier);

    // Hammerhead Pier Cap Beam
    const capBeam = viewer.entities.add({
      name: `Viaduct Pier Cap Beam ${idx + 1} (Illustrative)`,
      corridor: {
        positions: Cesium.Cartesian3.fromDegreesArray([
          77.57322, pLat,
          77.57328, pLat,
        ]),
        width: 5.2,
        height: 7.8,
        extrudedHeight: 8.5,
        material: Cesium.Color.fromCssColorString("#3B4A5D"),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#64748B"),
      },
    });
    collections.flyoverEntities.push(capBeam);
  });
}

// ============================================================================
// 6. Subsurface & Municipal Utility Corridors (Marked Illustrative)
// ============================================================================
export function renderUtilities(
  viewer: any,
  Cesium: any,
  utilities: UrbanInfrastructureLine[],
  ctx: RenderContext,
  collections: RenderedEntityCollections
): void {
  if (!ctx.layers.subsurfaceUtilities) return;

  utilities.forEach((u) => {
    const flatCoords: number[] = [];
    u.coords.forEach(([lng, lat]) => flatCoords.push(lng, lat));

    const entity = viewer.entities.add({
      name: u.name,
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(flatCoords),
        width: u.width,
        material: Cesium.Color.fromCssColorString(u.color),
      },
    });

    (entity as any)._bhuInfrastructureId = u.id;
    collections.utilities.set(u.id, entity);
  });
}

// ============================================================================
// 7. Vegetation (Roadside & Setback Timber Trees)
// ============================================================================
export function renderVegetation(
  viewer: any,
  Cesium: any,
  trees: [number, number][],
  collections: RenderedEntityCollections
): void {
  trees.forEach(([tLng, tLat]) => {
    // Timber Bark Slender Trunk
    const trunk = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(tLng, tLat, 1.2),
      cylinder: {
        length: 2.4,
        topRadius: 0.18,
        bottomRadius: 0.24,
        material: Cesium.Color.fromCssColorString("#3E2723"),
      },
    });
    collections.vegetation.push(trunk);

    // Lower Canopy Foliage (Natural Deep Forest Green)
    const foliage1 = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(tLng, tLat, 2.9),
      cylinder: {
        length: 2.0,
        topRadius: 1.5,
        bottomRadius: 2.4,
        material: Cesium.Color.fromCssColorString("#14532D"),
      },
    });
    collections.vegetation.push(foliage1);

    // Upper Crown Dome Foliage (Natural Emerald Green)
    const foliage2 = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(tLng, tLat, 4.5),
      cylinder: {
        length: 1.8,
        topRadius: 0.3,
        bottomRadius: 1.6,
        material: Cesium.Color.fromCssColorString("#15803D"),
      },
    });
    collections.vegetation.push(foliage2);
  });
}

// ============================================================================
// 8. Architectural Street Luminaires
// ============================================================================
export function renderStreetLamps(
  viewer: any,
  Cesium: any,
  lamps: [number, number][],
  collections: RenderedEntityCollections
): void {
  lamps.forEach(([lLng, lLat]) => {
    // Steel Pole
    const pole = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lLng, lLat, 2.6),
      cylinder: {
        length: 5.2,
        topRadius: 0.06,
        bottomRadius: 0.09,
        material: Cesium.Color.fromCssColorString("#334155"),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#475569"),
      },
    });
    collections.streetLamps.push(pole);

    // Luminaire Lantern Head
    const lampHead = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lLng, lLat, 5.3),
      point: {
        pixelSize: 7,
        color: Cesium.Color.fromCssColorString("#FEF08A"),
        outlineColor: Cesium.Color.fromCssColorString("#F59E0B"),
        outlineWidth: 2,
      },
    });
    collections.streetLamps.push(lampHead);
  });
}
