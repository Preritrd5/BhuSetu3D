/**
 * BhuSetu 3D — Rich Multi-Building Spatial Environment Data Model
 * Phase 2: Multi-Building 3D Digital Twin Environment & Spatial Composition
 *
 * Strict Architectural Typology, Clean Parcel-to-Building Mapping,
 * Highway/Cross-Street Network, and Infrastructure Demonstrations.
 */

export type UrbanTypology =
  | "TYPE_A_LOW_RISE"
  | "TYPE_B_MID_RISE"
  | "TYPE_C_TALLER"
  | "TYPE_D_SPECIAL";

export type RoofStyle =
  | "FLAT_PARAPET"
  | "PENTHOUSE_ENCLOSURE"
  | "UTILITY_CAGE"
  | "STEPPED";

export type PropertyStatus =
  | "VERIFIED"
  | "DISPUTED"
  | "SURVEYED"
  | "PENDING_VERIFICATION";

export type ParcelCategory =
  | "COMMERCIAL"
  | "RESIDENTIAL"
  | "MIXED_USE"
  | "INSTITUTIONAL"
  | "OPEN_RESERVE";

export interface UrbanBuildingDefinition {
  buildingId: string;
  legacyId?: string;
  code: string;
  parcelId: string;
  legacyParcelId?: string;
  name: string;
  typology: UrbanTypology;
  typologyLabel: string;
  floorCount: number;
  height: number;
  sanctionedHeight: number;
  footprint: [number, number][]; // Closed polygon [lng, lat][]
  centroid: [number, number];     // [lng, lat]
  primaryColor: string;
  outlineColor: string;
  hasConflict?: boolean;
  isPrimaryDemo?: boolean;
  podiumHeight?: number;
  hasPenthouse?: boolean;
  hasBalconies?: boolean;
  hasCurtainWall?: boolean;
  hasColonnade?: boolean;
  roofType: RoofStyle;
  propertyStatus: PropertyStatus;
}

export interface UrbanParcelDefinition {
  parcelId: string;
  legacyId?: string;
  ulpin: string;
  surveyNumber: string;
  areaSqm: number;
  category: ParcelCategory;
  footprint: [number, number][]; // Closed polygon [lng, lat][]
  centroid: [number, number];
  primaryBuildingIds: string[];
  isUndeveloped?: boolean;
}

export interface UrbanRoadCorridor {
  id: string;
  name: string;
  type: "MAIN_ARTERIAL" | "CROSS_STREET" | "AVENUE";
  width: number;
  elevation: number;
  color: string;
  positions: [number, number][];
  hasCenterlineMarking?: boolean;
  hasShoulderLines?: boolean;
  hasCrosswalks?: boolean;
  crosswalkLats?: number[];
  sidewalks?: {
    westLng?: number;
    eastLng?: number;
    width: number;
  };
}

export interface UrbanInfrastructureLine {
  id: string;
  name: string;
  category: "ROAD" | "DRAINAGE" | "WATER" | "POWER" | "TRANSIT_VIADUCT";
  isIllustrative: boolean; // Explicit requirement: marked illustrative / demonstration data
  color: string;
  width: number;
  coords: [number, number][];
}

// ============================================================================
// Helper: Closed rectangular polygon footprint generator
// ============================================================================
export function makeBox(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number
): [number, number][] {
  return [
    [minLng, minLat],
    [maxLng, minLat],
    [maxLng, maxLat],
    [minLng, maxLat],
    [minLng, minLat],
  ];
}

export function calcCentroid(coords: [number, number][]): [number, number] {
  let sumLng = 0;
  let sumLat = 0;
  const count = coords.length - 1; // Last point duplicates first
  for (let i = 0; i < count; i++) {
    sumLng += coords[i][0];
    sumLat += coords[i][1];
  }
  return [sumLng / count, sumLat / count];
}

// ============================================================================
// 1. CANONICAL CADASTRAL PARCELS (24 Structured Properties)
// ============================================================================
export const URBAN_PARCELS: UrbanParcelDefinition[] = [
  // --------------------------------------------------------------------------
  // CENTRAL-EAST DEMONSTRATION PRECINCT (Between 11th & 12th Cross)
  // --------------------------------------------------------------------------
  {
    parcelId: "PARCEL-001",
    legacyId: "66666666-6666-4000-8000-000000000102",
    ulpin: "KA-BLR-2026-P102",
    surveyNumber: "Survey 102/3B",
    areaSqm: 1850.0,
    category: "COMMERCIAL",
    footprint: makeBox(77.57198, 12.99810, 77.57248, 13.00010),
    centroid: [77.57223, 12.99910],
    primaryBuildingIds: ["BLDG-001"],
  },
  {
    parcelId: "PARCEL-004",
    ulpin: "KA-BLR-2026-P104",
    surveyNumber: "Survey 102/4",
    areaSqm: 1120.0,
    category: "COMMERCIAL",
    footprint: makeBox(77.57252, 12.99810, 77.57310, 12.99910),
    centroid: [77.57281, 12.99860],
    primaryBuildingIds: ["BLDG-004"],
  },
  {
    parcelId: "PARCEL-005",
    ulpin: "KA-BLR-2026-P105",
    surveyNumber: "Survey 102/5",
    areaSqm: 1140.0,
    category: "COMMERCIAL",
    footprint: makeBox(77.57252, 12.99915, 77.57310, 13.00010),
    centroid: [77.57281, 12.99962],
    primaryBuildingIds: ["BLDG-005"],
  },

  // --------------------------------------------------------------------------
  // MID-SOUTH EAST PRECINCT (Between 10th & 11th Cross)
  // --------------------------------------------------------------------------
  {
    parcelId: "PARCEL-002",
    legacyId: "66666666-6666-4000-8000-000000000101",
    ulpin: "KA-BLR-2026-P101",
    surveyNumber: "Survey 101/2A",
    areaSqm: 1680.0,
    category: "RESIDENTIAL",
    footprint: makeBox(77.57198, 12.99610, 77.57245, 12.99770),
    centroid: [77.57221, 12.99690],
    primaryBuildingIds: ["BLDG-002", "BLDG-002B"], // Multi-structure parcel!
  },
  {
    parcelId: "PARCEL-006",
    ulpin: "KA-BLR-2026-P106",
    surveyNumber: "Survey 101/3",
    areaSqm: 880.0,
    category: "INSTITUTIONAL",
    footprint: makeBox(77.57198, 12.99515, 77.57245, 12.99600),
    centroid: [77.57221, 12.99557],
    primaryBuildingIds: ["BLDG-006"],
  },
  {
    parcelId: "PARCEL-007",
    ulpin: "KA-BLR-2026-P107",
    surveyNumber: "Survey 101/4",
    areaSqm: 1950.0,
    category: "RESIDENTIAL",
    footprint: makeBox(77.57250, 12.99515, 77.57310, 12.99770),
    centroid: [77.57280, 12.99642],
    primaryBuildingIds: ["BLDG-007"],
  },

  // --------------------------------------------------------------------------
  // MID-NORTH EAST PRECINCT (Between 12th & 13th Cross)
  // --------------------------------------------------------------------------
  {
    parcelId: "PARCEL-003",
    legacyId: "66666666-6666-4000-8000-000000000103",
    ulpin: "KA-BLR-2026-P103",
    surveyNumber: "Survey 103/1",
    areaSqm: 1350.0,
    category: "MIXED_USE",
    footprint: makeBox(77.57198, 13.00040, 77.57245, 13.00180),
    centroid: [77.57221, 13.00110],
    primaryBuildingIds: ["BLDG-003"],
  },
  {
    parcelId: "PARCEL-008",
    ulpin: "KA-BLR-2026-P108",
    surveyNumber: "Survey 103/2",
    areaSqm: 540.0,
    category: "INSTITUTIONAL",
    footprint: makeBox(77.57198, 13.00185, 77.57245, 13.00230),
    centroid: [77.57221, 13.00207],
    primaryBuildingIds: ["BLDG-008"],
  },
  {
    parcelId: "PARCEL-009",
    ulpin: "KA-BLR-2026-P109",
    surveyNumber: "Survey 103/3",
    areaSqm: 2150.0,
    category: "COMMERCIAL",
    footprint: makeBox(77.57250, 13.00040, 77.57310, 13.00230),
    centroid: [77.57280, 13.00135],
    primaryBuildingIds: ["BLDG-009"],
  },

  // --------------------------------------------------------------------------
  // EAST BELT (East of Elevated Flyover Viaduct)
  // --------------------------------------------------------------------------
  {
    parcelId: "PARCEL-010",
    ulpin: "KA-BLR-2026-P110",
    surveyNumber: "Survey 104/1",
    areaSqm: 2900.0,
    category: "COMMERCIAL",
    footprint: makeBox(77.57360, 12.99820, 77.57480, 12.99960),
    centroid: [77.57420, 12.99890],
    primaryBuildingIds: ["BLDG-010"],
  },
  {
    parcelId: "PARCEL-011",
    ulpin: "KA-BLR-2026-P111",
    surveyNumber: "Survey 104/2",
    areaSqm: 2200.0,
    category: "RESIDENTIAL",
    footprint: makeBox(77.57490, 12.99820, 77.57580, 12.99960),
    centroid: [77.57535, 12.99890],
    primaryBuildingIds: ["BLDG-011"],
  },
  {
    parcelId: "PARCEL-012",
    ulpin: "KA-BLR-2026-P112",
    surveyNumber: "Survey 104/3",
    areaSqm: 2600.0,
    category: "MIXED_USE",
    footprint: makeBox(77.57360, 12.99600, 77.57480, 12.99760),
    centroid: [77.57420, 12.99680],
    primaryBuildingIds: ["BLDG-012"],
  },
  {
    parcelId: "PARCEL-013",
    ulpin: "KA-BLR-2026-P113",
    surveyNumber: "Survey 104/4",
    areaSqm: 2100.0,
    category: "RESIDENTIAL",
    footprint: makeBox(77.57490, 12.99600, 77.57580, 12.99760),
    centroid: [77.57535, 12.99680],
    primaryBuildingIds: ["BLDG-013"],
  },
  {
    parcelId: "PARCEL-014",
    ulpin: "KA-BLR-2026-P114",
    surveyNumber: "Survey 104/5",
    areaSqm: 2750.0,
    category: "RESIDENTIAL",
    footprint: makeBox(77.57360, 13.00060, 77.57480, 13.00200),
    centroid: [77.57420, 13.00130],
    primaryBuildingIds: ["BLDG-014"],
  },
  {
    parcelId: "PARCEL-015",
    ulpin: "KA-BLR-2026-P115",
    surveyNumber: "Survey 104/6",
    areaSqm: 1980.0,
    category: "INSTITUTIONAL",
    footprint: makeBox(77.57490, 13.00060, 77.57580, 13.00200),
    centroid: [77.57535, 13.00130],
    primaryBuildingIds: ["BLDG-015"],
  },

  // --------------------------------------------------------------------------
  // WEST SECTOR (West of 8th Main Road)
  // --------------------------------------------------------------------------
  {
    parcelId: "PARCEL-016",
    ulpin: "KA-BLR-2026-P116",
    surveyNumber: "Survey 105/1",
    areaSqm: 2100.0,
    category: "COMMERCIAL",
    footprint: makeBox(77.57020, 12.99810, 77.57140, 12.99990),
    centroid: [77.57080, 12.99900],
    primaryBuildingIds: ["BLDG-016"],
  },
  {
    parcelId: "PARCEL-017",
    ulpin: "KA-BLR-2026-P117",
    surveyNumber: "Survey 105/2",
    areaSqm: 3200.0,
    category: "COMMERCIAL",
    footprint: makeBox(77.56860, 12.99810, 77.57000, 12.99990),
    centroid: [77.56930, 12.99900],
    primaryBuildingIds: ["BLDG-017"],
  },
  {
    parcelId: "PARCEL-018",
    ulpin: "KA-BLR-2026-P118",
    surveyNumber: "Survey 105/3",
    areaSqm: 2450.0,
    category: "INSTITUTIONAL",
    footprint: makeBox(77.56860, 12.99610, 77.57000, 12.99760),
    centroid: [77.56930, 12.99685],
    primaryBuildingIds: ["BLDG-018"],
  },
  {
    parcelId: "PARCEL-019",
    ulpin: "KA-BLR-2026-P119",
    surveyNumber: "Survey 105/4",
    areaSqm: 1980.0,
    category: "RESIDENTIAL",
    footprint: makeBox(77.57020, 12.99610, 77.57140, 12.99760),
    centroid: [77.57080, 12.99685],
    primaryBuildingIds: ["BLDG-019"],
  },
  // Open / Undeveloped Parcel (explicitly required to demonstrate property dataset reality)
  {
    parcelId: "PARCEL-020",
    ulpin: "KA-BLR-2026-P120",
    surveyNumber: "Survey 105/5",
    areaSqm: 1850.0,
    category: "OPEN_RESERVE",
    footprint: makeBox(77.57020, 13.00040, 77.57140, 13.00190),
    centroid: [77.57080, 13.00115],
    primaryBuildingIds: [],
    isUndeveloped: true,
  },
  {
    parcelId: "PARCEL-021",
    ulpin: "KA-BLR-2026-P121",
    surveyNumber: "Survey 105/6",
    areaSqm: 2600.0,
    category: "RESIDENTIAL",
    footprint: makeBox(77.56860, 13.00040, 77.57000, 13.00190),
    centroid: [77.56930, 13.00115],
    primaryBuildingIds: ["BLDG-020"],
  },

  // --------------------------------------------------------------------------
  // SOUTH PERIMETER (South of 10th Cross)
  // --------------------------------------------------------------------------
  {
    parcelId: "PARCEL-022",
    ulpin: "KA-BLR-2026-P122",
    surveyNumber: "Survey 106/1",
    areaSqm: 2400.0,
    category: "COMMERCIAL",
    footprint: makeBox(77.56860, 12.99360, 77.57000, 12.99470),
    centroid: [77.56930, 12.99415],
    primaryBuildingIds: ["BLDG-021"],
  },
  {
    parcelId: "PARCEL-023",
    ulpin: "KA-BLR-2026-P123",
    surveyNumber: "Survey 106/2",
    areaSqm: 1800.0,
    category: "MIXED_USE",
    footprint: makeBox(77.57020, 12.99360, 77.57140, 12.99470),
    centroid: [77.57080, 12.99415],
    primaryBuildingIds: ["BLDG-022"],
  },
  {
    parcelId: "PARCEL-024",
    ulpin: "KA-BLR-2026-P124",
    surveyNumber: "Survey 106/3",
    areaSqm: 2200.0,
    category: "INSTITUTIONAL",
    footprint: makeBox(77.57200, 12.99360, 77.57310, 12.99470),
    centroid: [77.57255, 12.99415],
    primaryBuildingIds: ["BLDG-023"],
  },
];

// ============================================================================
// 2. URBAN BUILDINGS (24 Structured Multi-Typology Structures)
// ============================================================================
export const URBAN_BUILDINGS: UrbanBuildingDefinition[] = [
  // --------------------------------------------------------------------------
  // PRIMARY DEMONSTRATION PROPERTY
  // --------------------------------------------------------------------------
  {
    buildingId: "BLDG-001",
    legacyId: "77777777-7777-4000-8000-000000000102",
    code: "BLD-KA-BLR-102",
    parcelId: "PARCEL-001",
    legacyParcelId: "66666666-6666-4000-8000-000000000102",
    name: "Aura Horizon Commercial Complex",
    typology: "TYPE_C_TALLER",
    typologyLabel: "7-Storey Commercial Digital-Twin Complex",
    floorCount: 7,
    height: 28.0,
    sanctionedHeight: 20.0,
    hasConflict: true,
    isPrimaryDemo: true,
    footprint: [
      [77.57205, 12.99830],
      [77.57237, 12.99830],
      [77.57237, 12.99990],
      [77.57205, 12.99990],
      [77.57205, 12.99830],
    ],
    centroid: [77.57221, 12.99910],
    primaryColor: "#0C2535",
    outlineColor: "#00F0FF",
    hasCurtainWall: true,
    hasColonnade: true,
    hasPenthouse: true,
    roofType: "UTILITY_CAGE",
    propertyStatus: "DISPUTED",
  },

  // --------------------------------------------------------------------------
  // HORIZON DEMO PRECINCT (PARCELS 004 & 005)
  // --------------------------------------------------------------------------
  {
    buildingId: "BLDG-004",
    code: "BLD-KA-BLR-104",
    parcelId: "PARCEL-004",
    name: "Horizon East Corporate Wing",
    typology: "TYPE_B_MID_RISE",
    typologyLabel: "Corporate Annex",
    floorCount: 4,
    height: 14.0,
    sanctionedHeight: 14.0,
    footprint: makeBox(77.57258, 12.99820, 77.57302, 12.99900),
    centroid: [77.57280, 12.99860],
    primaryColor: "#152233",
    outlineColor: "#38BDF8",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-005",
    code: "BLD-KA-BLR-105",
    parcelId: "PARCEL-005",
    name: "Horizon Tech Pavilion",
    typology: "TYPE_A_LOW_RISE",
    typologyLabel: "Exhibition & Retail Pavilion",
    floorCount: 2,
    height: 8.0,
    sanctionedHeight: 8.0,
    footprint: makeBox(77.57258, 12.99925, 77.57302, 13.00000),
    centroid: [77.57280, 12.99962],
    primaryColor: "#1A2638",
    outlineColor: "#2DD4BF",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },

  // --------------------------------------------------------------------------
  // MID-SOUTH EAST PRECINCT (PARCELS 002, 006, 007)
  // --------------------------------------------------------------------------
  {
    buildingId: "BLDG-002",
    legacyId: "77777777-7777-4000-8000-000000000101",
    code: "BLD-KA-BLR-101",
    parcelId: "PARCEL-002",
    legacyParcelId: "66666666-6666-4000-8000-000000000101",
    name: "Malleshwaram Residency",
    typology: "TYPE_B_MID_RISE",
    typologyLabel: "Residential Multi-Family",
    floorCount: 3,
    height: 10.5,
    sanctionedHeight: 10.5,
    footprint: [
      [77.57205, 12.99645],
      [77.57235, 12.99645],
      [77.57235, 12.99755],
      [77.57205, 12.99755],
      [77.57205, 12.99645],
    ],
    centroid: [77.57220, 12.99700],
    primaryColor: "#1B2433",
    outlineColor: "#475569",
    hasBalconies: true,
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },
  {
    // Multi-structure demonstration on PARCEL-002!
    buildingId: "BLDG-002B",
    code: "BLD-KA-BLR-101B",
    parcelId: "PARCEL-002",
    name: "Malleshwaram Security & Service Annexe",
    typology: "TYPE_A_LOW_RISE",
    typologyLabel: "Service & Security Pavilion",
    floorCount: 1,
    height: 4.2,
    sanctionedHeight: 4.5,
    footprint: makeBox(77.57206, 12.99615, 77.57232, 12.99635),
    centroid: [77.57219, 12.99625],
    primaryColor: "#1E293B",
    outlineColor: "#64748B",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-006",
    code: "BLD-KA-BLR-106",
    parcelId: "PARCEL-006",
    name: "South End Community Dispensary",
    typology: "TYPE_A_LOW_RISE",
    typologyLabel: "Community Health Facility",
    floorCount: 2,
    height: 7.5,
    sanctionedHeight: 8.0,
    footprint: makeBox(77.57205, 12.99525, 77.57238, 12.99590),
    centroid: [77.57221, 12.99557],
    primaryColor: "#16202D",
    outlineColor: "#14B8A6",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-007",
    code: "BLD-KA-BLR-107",
    parcelId: "PARCEL-007",
    name: "Sampige Gardens Residential Block",
    typology: "TYPE_B_MID_RISE",
    typologyLabel: "Residential Apartments",
    floorCount: 4,
    height: 15.0,
    sanctionedHeight: 15.0,
    footprint: makeBox(77.57258, 12.99530, 77.57302, 12.99750),
    centroid: [77.57280, 12.99640],
    primaryColor: "#1B2433",
    outlineColor: "#475569",
    hasBalconies: true,
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },

  // --------------------------------------------------------------------------
  // MID-NORTH EAST PRECINCT (PARCELS 003, 008, 009)
  // --------------------------------------------------------------------------
  {
    buildingId: "BLDG-003",
    legacyId: "77777777-7777-4000-8000-000000000103",
    code: "BLD-KA-BLR-103",
    parcelId: "PARCEL-003",
    legacyParcelId: "66666666-6666-4000-8000-000000000103",
    name: "Green Valley Arcade",
    typology: "TYPE_A_LOW_RISE",
    typologyLabel: "Retail Commercial Arcade",
    floorCount: 2,
    height: 7.5,
    sanctionedHeight: 7.5,
    footprint: [
      [77.57205, 13.00060],
      [77.57230, 13.00060],
      [77.57230, 13.00160],
      [77.57205, 13.00160],
      [77.57205, 13.00060],
    ],
    centroid: [77.572175, 13.00110],
    primaryColor: "#1E293B",
    outlineColor: "#64748B",
    hasColonnade: true,
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-008",
    code: "BLD-KA-BLR-108",
    parcelId: "PARCEL-008",
    name: "Postal Sorting & Transit Sub-Office",
    typology: "TYPE_A_LOW_RISE",
    typologyLabel: "Public Postal Facility",
    floorCount: 2,
    height: 6.8,
    sanctionedHeight: 7.0,
    footprint: makeBox(77.57205, 13.00192, 77.57238, 13.00222),
    centroid: [77.57221, 13.00207],
    primaryColor: "#182230",
    outlineColor: "#334155",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-009",
    code: "BLD-KA-BLR-109",
    parcelId: "PARCEL-009",
    name: "North Star Corporate Tower",
    typology: "TYPE_C_TALLER",
    typologyLabel: "Commercial High-Rise",
    floorCount: 7,
    height: 24.5,
    sanctionedHeight: 25.0,
    podiumHeight: 5.5,
    hasPenthouse: true,
    footprint: makeBox(77.57258, 13.00060, 77.57302, 13.00210),
    centroid: [77.57280, 13.00135],
    primaryColor: "#0E1A27",
    outlineColor: "#38BDF8",
    roofType: "PENTHOUSE_ENCLOSURE",
    propertyStatus: "VERIFIED",
  },

  // --------------------------------------------------------------------------
  // EAST BELT BUILDINGS (East of Transit Viaduct)
  // --------------------------------------------------------------------------
  {
    buildingId: "BLDG-010",
    code: "BLD-KA-BLR-110",
    parcelId: "PARCEL-010",
    name: "Cauvery Tech Innovation Park",
    typology: "TYPE_C_TALLER",
    typologyLabel: "Technology Corporate Campus",
    floorCount: 9,
    height: 32.0,
    sanctionedHeight: 32.0,
    podiumHeight: 6.5,
    hasPenthouse: true,
    footprint: makeBox(77.57375, 12.99835, 77.57465, 12.99945),
    centroid: [77.57420, 12.99890],
    primaryColor: "#0E1A27",
    outlineColor: "#00F0FF",
    roofType: "PENTHOUSE_ENCLOSURE",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-011",
    code: "BLD-KA-BLR-111",
    parcelId: "PARCEL-011",
    name: "Metro View Residences Tower 1",
    typology: "TYPE_C_TALLER",
    typologyLabel: "High-Rise Residential",
    floorCount: 8,
    height: 28.0,
    sanctionedHeight: 28.0,
    hasBalconies: true,
    footprint: makeBox(77.57502, 12.99835, 77.57568, 12.99945),
    centroid: [77.57535, 12.99890],
    primaryColor: "#1B2433",
    outlineColor: "#475569",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-012",
    code: "BLD-KA-BLR-112",
    parcelId: "PARCEL-012",
    name: "Sampige Plaza Retail Concourse",
    typology: "TYPE_B_MID_RISE",
    typologyLabel: "Commercial Retail Arcade",
    floorCount: 4,
    height: 14.5,
    sanctionedHeight: 15.0,
    hasColonnade: true,
    footprint: makeBox(77.57375, 12.99615, 77.57465, 12.99745),
    centroid: [77.57420, 12.99680],
    primaryColor: "#1E293B",
    outlineColor: "#64748B",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-013",
    code: "BLD-KA-BLR-113",
    parcelId: "PARCEL-013",
    name: "Metro View Residences Tower 2",
    typology: "TYPE_B_MID_RISE",
    typologyLabel: "Residential Apartments",
    floorCount: 5,
    height: 18.0,
    sanctionedHeight: 18.0,
    hasBalconies: true,
    footprint: makeBox(77.57502, 12.99615, 77.57568, 12.99745),
    centroid: [77.57535, 12.99680],
    primaryColor: "#1B2433",
    outlineColor: "#475569",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-014",
    code: "BLD-KA-BLR-114",
    parcelId: "PARCEL-014",
    name: "Orchid Heights Sky Residence",
    typology: "TYPE_C_TALLER",
    typologyLabel: "Premium Residential Tower",
    floorCount: 8,
    height: 28.0,
    sanctionedHeight: 28.0,
    podiumHeight: 6.0,
    hasPenthouse: true,
    footprint: makeBox(77.57375, 13.00075, 77.57465, 13.00185),
    centroid: [77.57420, 13.00130],
    primaryColor: "#0E1A27",
    outlineColor: "#38BDF8",
    roofType: "PENTHOUSE_ENCLOSURE",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-015",
    code: "BLD-KA-BLR-115",
    parcelId: "PARCEL-015",
    name: "East Gate Municipal Logistics Bhavan",
    typology: "TYPE_D_SPECIAL",
    typologyLabel: "Municipal Logistics & Services",
    floorCount: 4,
    height: 16.0,
    sanctionedHeight: 16.0,
    footprint: makeBox(77.57502, 13.00075, 77.57568, 13.00185),
    centroid: [77.57535, 13.00130],
    primaryColor: "#16202D",
    outlineColor: "#475569",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },

  // --------------------------------------------------------------------------
  // WEST SECTOR BUILDINGS (West of 8th Main)
  // --------------------------------------------------------------------------
  {
    buildingId: "BLDG-016",
    code: "BLD-KA-BLR-116",
    parcelId: "PARCEL-016",
    name: "West Avenue Arcade & Commercial Hub",
    typology: "TYPE_B_MID_RISE",
    typologyLabel: "Commercial Retail Arcade",
    floorCount: 4,
    height: 14.5,
    sanctionedHeight: 15.0,
    hasColonnade: true,
    footprint: makeBox(77.57035, 12.99825, 77.57125, 12.99975),
    centroid: [77.57080, 12.99900],
    primaryColor: "#1E293B",
    outlineColor: "#64748B",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-017",
    code: "BLD-KA-BLR-117",
    parcelId: "PARCEL-017",
    name: "Aura West Corporate Pinnacle",
    typology: "TYPE_C_TALLER",
    typologyLabel: "Corporate Headquarters Landmark",
    floorCount: 10,
    height: 35.0,
    sanctionedHeight: 35.0,
    podiumHeight: 6.5,
    hasPenthouse: true,
    footprint: makeBox(77.56875, 12.99825, 77.56985, 12.99975),
    centroid: [77.56930, 12.99900],
    primaryColor: "#0E1A27",
    outlineColor: "#38BDF8",
    roofType: "PENTHOUSE_ENCLOSURE",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-018",
    code: "BLD-KA-BLR-118",
    parcelId: "PARCEL-018",
    name: "Karnataka State Financial Bhavan",
    typology: "TYPE_D_SPECIAL",
    typologyLabel: "State Financial Institution",
    floorCount: 5,
    height: 19.0,
    sanctionedHeight: 20.0,
    footprint: makeBox(77.56875, 12.99625, 77.56985, 12.99745),
    centroid: [77.56930, 12.99685],
    primaryColor: "#152332",
    outlineColor: "#475569",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-019",
    code: "BLD-KA-BLR-119",
    parcelId: "PARCEL-019",
    name: "Cauvery Executive Suites",
    typology: "TYPE_B_MID_RISE",
    typologyLabel: "Executive Serviced Suites",
    floorCount: 5,
    height: 17.5,
    sanctionedHeight: 18.0,
    hasBalconies: true,
    footprint: makeBox(77.57035, 12.99625, 77.57125, 12.99745),
    centroid: [77.57080, 12.99685],
    primaryColor: "#1B2433",
    outlineColor: "#475569",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-020",
    code: "BLD-KA-BLR-121",
    parcelId: "PARCEL-021",
    name: "Greenwood Heights Tower",
    typology: "TYPE_C_TALLER",
    typologyLabel: "Residential High-Rise",
    floorCount: 7,
    height: 24.0,
    sanctionedHeight: 24.0,
    hasBalconies: true,
    hasPenthouse: true,
    footprint: makeBox(77.56875, 13.00055, 77.56985, 13.00175),
    centroid: [77.56930, 13.00115],
    primaryColor: "#1B2433",
    outlineColor: "#475569",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },

  // --------------------------------------------------------------------------
  // SOUTH SECTOR BUILDINGS
  // --------------------------------------------------------------------------
  {
    buildingId: "BLDG-021",
    code: "BLD-KA-BLR-122",
    parcelId: "PARCEL-022",
    name: "Sankey Heights Commercial Plaza",
    typology: "TYPE_C_TALLER",
    typologyLabel: "Commercial Business Plaza",
    floorCount: 8,
    height: 28.0,
    sanctionedHeight: 28.0,
    podiumHeight: 5.5,
    hasPenthouse: true,
    footprint: makeBox(77.56875, 12.99375, 77.56985, 12.99455),
    centroid: [77.56930, 12.99415],
    primaryColor: "#0E1A27",
    outlineColor: "#38BDF8",
    roofType: "PENTHOUSE_ENCLOSURE",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-022",
    code: "BLD-KA-BLR-123",
    parcelId: "PARCEL-023",
    name: "Vyalikaval Heritage Chambers",
    typology: "TYPE_B_MID_RISE",
    typologyLabel: "Heritage Commercial Office",
    floorCount: 4,
    height: 14.0,
    sanctionedHeight: 14.0,
    footprint: makeBox(77.57035, 12.99375, 77.57125, 12.99455),
    centroid: [77.57080, 12.99415],
    primaryColor: "#1E293B",
    outlineColor: "#64748B",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-023",
    code: "BLD-KA-BLR-124",
    parcelId: "PARCEL-024",
    name: "Metro Interchange Hub A",
    typology: "TYPE_D_SPECIAL",
    typologyLabel: "Multi-Modal Transit Terminal",
    floorCount: 6,
    height: 22.0,
    sanctionedHeight: 22.0,
    podiumHeight: 5.5,
    hasPenthouse: true,
    footprint: makeBox(77.57215, 12.99375, 77.57295, 12.99455),
    centroid: [77.57255, 12.99415],
    primaryColor: "#0E1A27",
    outlineColor: "#38BDF8",
    roofType: "STEPPED",
    propertyStatus: "VERIFIED",
  },

  // --------------------------------------------------------------------------
  // PERIPHERAL URBAN FABRIC (Contextual Depth & City Scale)
  // --------------------------------------------------------------------------
  {
    buildingId: "BLDG-024",
    code: "BLD-KA-BLR-125",
    parcelId: "PARCEL-025",
    name: "Malleshwaram North IT Tower",
    typology: "TYPE_C_TALLER",
    typologyLabel: "High-Rise IT Campus",
    floorCount: 10,
    height: 34.0,
    sanctionedHeight: 34.0,
    podiumHeight: 6.5,
    hasPenthouse: true,
    footprint: makeBox(77.57025, 13.00240, 77.57135, 13.00360),
    centroid: [77.57080, 13.00300],
    primaryColor: "#0E1C2B",
    outlineColor: "#38BDF8",
    roofType: "PENTHOUSE_ENCLOSURE",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-025",
    code: "BLD-KA-BLR-126",
    parcelId: "PARCEL-026",
    name: "14th Cross Commercial Complex",
    typology: "TYPE_B_MID_RISE",
    typologyLabel: "Mid-Rise Commercial Center",
    floorCount: 6,
    height: 22.0,
    sanctionedHeight: 22.0,
    hasColonnade: true,
    footprint: makeBox(77.56865, 13.00240, 77.56995, 13.00360),
    centroid: [77.56930, 13.00300],
    primaryColor: "#182434",
    outlineColor: "#64748B",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-026",
    code: "BLD-KA-BLR-127",
    parcelId: "PARCEL-027",
    name: "Sankey West Residential Enclave",
    typology: "TYPE_B_MID_RISE",
    typologyLabel: "Residential High-Rise Block",
    floorCount: 7,
    height: 24.5,
    sanctionedHeight: 25.0,
    hasBalconies: true,
    footprint: makeBox(77.56715, 12.99815, 77.56835, 12.99985),
    centroid: [77.56775, 12.99900],
    primaryColor: "#1B2535",
    outlineColor: "#475569",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-027",
    code: "BLD-KA-BLR-128",
    parcelId: "PARCEL-028",
    name: "Sampige Heritage Craft Arcade",
    typology: "TYPE_A_LOW_RISE",
    typologyLabel: "Traditional Retail Bazaar",
    floorCount: 3,
    height: 11.0,
    sanctionedHeight: 11.0,
    hasColonnade: true,
    footprint: makeBox(77.56715, 12.99615, 77.56835, 12.99755),
    centroid: [77.56775, 12.99685],
    primaryColor: "#1E293B",
    outlineColor: "#64748B",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-028",
    code: "BLD-KA-BLR-129",
    parcelId: "PARCEL-029",
    name: "Central Postal Telecom Building",
    typology: "TYPE_D_SPECIAL",
    typologyLabel: "Public Communications Facility",
    floorCount: 5,
    height: 18.5,
    sanctionedHeight: 19.0,
    podiumHeight: 4.5,
    footprint: makeBox(77.57215, 13.00245, 77.57305, 13.00360),
    centroid: [77.57260, 13.00302],
    primaryColor: "#15202D",
    outlineColor: "#475569",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-029",
    code: "BLD-KA-BLR-130",
    parcelId: "PARCEL-030",
    name: "East Rail Service Corporate Tower",
    typology: "TYPE_C_TALLER",
    typologyLabel: "Rail Transport Corporate Wing",
    floorCount: 8,
    height: 28.0,
    sanctionedHeight: 28.0,
    podiumHeight: 5.5,
    hasPenthouse: true,
    footprint: makeBox(77.57375, 13.00245, 77.57475, 13.00360),
    centroid: [77.57425, 13.00302],
    primaryColor: "#0E1A27",
    outlineColor: "#38BDF8",
    roofType: "PENTHOUSE_ENCLOSURE",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-030",
    code: "BLD-KA-BLR-131",
    parcelId: "PARCEL-031",
    name: "Green Valley Medical Pavilion",
    typology: "TYPE_B_MID_RISE",
    typologyLabel: "Healthcare Outpatient Clinic",
    floorCount: 4,
    height: 15.0,
    sanctionedHeight: 15.0,
    footprint: makeBox(77.56715, 13.00045, 77.56835, 13.00185),
    centroid: [77.56775, 13.00115],
    primaryColor: "#162330",
    outlineColor: "#14B8A6",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },
  {
    buildingId: "BLDG-031",
    code: "BLD-KA-BLR-132",
    parcelId: "PARCEL-032",
    name: "Malleshwaram South Substation & Annex",
    typology: "TYPE_A_LOW_RISE",
    typologyLabel: "Civic Utilities & Power Depot",
    floorCount: 2,
    height: 8.5,
    sanctionedHeight: 9.0,
    footprint: makeBox(77.56715, 12.99365, 77.56835, 12.99475),
    centroid: [77.56775, 12.99420],
    primaryColor: "#1A2433",
    outlineColor: "#475569",
    roofType: "FLAT_PARAPET",
    propertyStatus: "VERIFIED",
  },
];

// ============================================================================
// 3. URBAN ROAD NETWORK (Hierarchical Road Corridors)
// ============================================================================
export const URBAN_ROADS: UrbanRoadCorridor[] = [
  // 1. 8th Main Arterial Roadway (Primary Dual-Lane Avenue)
  {
    id: "ROAD-001",
    name: "8th Main Arterial Roadway",
    type: "MAIN_ARTERIAL",
    width: 11.0,
    elevation: 0.04,
    color: "#182232",
    positions: [
      [77.57182, 12.9920],
      [77.57182, 13.0048],
    ],
    hasCenterlineMarking: true,
    hasShoulderLines: true,
    sidewalks: {
      westLng: 77.57171,
      eastLng: 77.57193,
      width: 2.4,
    },
  },
  // 2. Secondary 7th Main Avenue (Parallel West Corridor)
  {
    id: "ROAD-002",
    name: "7th Main Avenue",
    type: "AVENUE",
    width: 7.0,
    elevation: 0.04,
    color: "#1B2433",
    positions: [
      [77.56950, 12.9920],
      [77.56950, 13.0048],
    ],
  },
  // 3. 10th Cross Road
  {
    id: "ROAD-003",
    name: "10th Cross Road",
    type: "CROSS_STREET",
    width: 7.5,
    elevation: 0.04,
    color: "#1E293B",
    positions: [
      [77.56840, 12.9950],
      [77.57600, 12.9950],
    ],
    hasCrosswalks: true,
    crosswalkLats: [12.9950],
  },
  // 4. 11th Cross Road (Facing Aura Horizon South Entrance)
  {
    id: "ROAD-004",
    name: "11th Cross Road",
    type: "CROSS_STREET",
    width: 7.5,
    elevation: 0.04,
    color: "#1E293B",
    positions: [
      [77.56840, 12.9978],
      [77.57600, 12.9978],
    ],
    hasCrosswalks: true,
    crosswalkLats: [12.9978],
  },
  // 5. 12th Cross Road (North of Aura Horizon)
  {
    id: "ROAD-005",
    name: "12th Cross Road",
    type: "CROSS_STREET",
    width: 7.5,
    elevation: 0.04,
    color: "#1E293B",
    positions: [
      [77.56840, 13.0002],
      [77.57600, 13.0002],
    ],
    hasCrosswalks: true,
    crosswalkLats: [13.0002],
  },
  // 6. 13th Cross Road
  {
    id: "ROAD-006",
    name: "13th Cross Road",
    type: "CROSS_STREET",
    width: 7.5,
    elevation: 0.04,
    color: "#1E293B",
    positions: [
      [77.56840, 13.0024],
      [77.57600, 13.0024],
    ],
    hasCrosswalks: true,
    crosswalkLats: [13.0024],
  },
];

// ============================================================================
// 4. INFRASTRUCTURE CORRIDORS (Strictly Labeled Illustrative Demo Data)
// ============================================================================
export const URBAN_INFRASTRUCTURE: UrbanInfrastructureLine[] = [
  {
    id: "UTIL-ROAD-001",
    name: "8th Main Primary Vehicular Right-of-Way",
    category: "ROAD",
    isIllustrative: false, // Physical road corridor
    color: "#475569",
    width: 6.0,
    coords: [
      [77.57185, 12.9925],
      [77.57185, 13.0045],
    ],
  },
  {
    id: "UTIL-SWD-002",
    name: "SWD-MALL-04 (Covered Stormwater Drainage - Illustrative Demo Data)",
    category: "DRAINAGE",
    isIllustrative: true,
    color: "#14B8A6",
    width: 3.5,
    coords: [
      [77.57192, 12.9925],
      [77.57192, 13.0045],
    ],
  },
  {
    id: "UTIL-BWSSB-003",
    name: "BWSSB-DIST-24 (Municipal Potable Feeder - Illustrative Demo Data)",
    category: "WATER",
    isIllustrative: true,
    color: "#0284C7",
    width: 3.0,
    coords: [
      [77.57173, 12.9925],
      [77.57173, 13.0045],
    ],
  },
  {
    id: "UTIL-BESCOM-004",
    name: "BESCOM-FEEDER-11KV (Subsurface Power Feeder - Illustrative Demo Data)",
    category: "POWER",
    isIllustrative: true,
    color: "#F59E0B",
    width: 2.5,
    coords: [
      [77.57165, 12.9925],
      [77.57165, 13.0045],
    ],
  },
];

// ============================================================================
// 5. VEGETATION NODES (Roadside & Setback Timber Trees)
// ============================================================================
export const URBAN_VEGETATION_TREES: [number, number][] = [
  // West Sidewalk of 8th Main
  [77.57171, 12.9935],
  [77.57171, 12.9942],
  [77.57171, 12.9958],
  [77.57171, 12.9968],
  [77.57171, 12.9985],
  [77.57171, 12.9995],
  [77.57171, 13.0008],
  [77.57171, 13.0018],
  [77.57171, 13.0032],

  // East Sidewalk of 8th Main
  [77.57193, 12.9938],
  [77.57193, 12.9945],
  [77.57193, 12.9962],
  [77.57193, 12.9972],
  [77.57193, 12.9988],
  [77.57193, 12.9998],
  [77.57193, 13.0012],
  [77.57193, 13.0022],
  [77.57193, 13.0038],

  // Setback Landscaped Buffers
  [77.57248, 12.9984],
  [77.57248, 12.9992],
  [77.57248, 12.9999],
  [77.57025, 12.9984],
  [77.57025, 12.9992],
  [77.57025, 13.0008],
];

// ============================================================================
// 6. STREET LUMINAIRES (Dual-Head Modern Columns)
// ============================================================================
export const URBAN_STREET_LAMPS: [number, number][] = [
  [77.57173, 12.9932],
  [77.57173, 12.9948],
  [77.57173, 12.9965],
  [77.57173, 12.9982],
  [77.57173, 12.9998],
  [77.57173, 13.0015],
  [77.57173, 13.0032],
  [77.57173, 13.0042],
];

// ============================================================================
// Lookup Query Helpers
// ============================================================================
export function getUrbanBuildingById(id: string): UrbanBuildingDefinition | undefined {
  return URBAN_BUILDINGS.find(
    (b) => b.buildingId === id || b.legacyId === id || b.code === id
  );
}

export function getUrbanParcelById(id: string): UrbanParcelDefinition | undefined {
  return URBAN_PARCELS.find(
    (p) => p.parcelId === id || p.legacyId === id || p.ulpin === id
  );
}

export function getBuildingsForParcel(parcelId: string): UrbanBuildingDefinition[] {
  return URBAN_BUILDINGS.filter(
    (b) => b.parcelId === parcelId || b.legacyParcelId === parcelId
  );
}

export function getPrimaryDemonstrationBuilding(): UrbanBuildingDefinition {
  return (
    URBAN_BUILDINGS.find((b) => b.isPrimaryDemo) || URBAN_BUILDINGS[0]
  );
}
