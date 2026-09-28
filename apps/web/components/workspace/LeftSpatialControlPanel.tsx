"use client";

import React, { useState } from "react";
import {
  Layers,
  ListTree,
  Wrench,
  Eye,
  EyeOff,
  Building2,
  MapPin,
  Compass,
  Ruler,
  Cpu,
  Search,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Maximize2,
  Minimize2,
  Globe2,
  DoorOpen,
  LayoutGrid,
} from "lucide-react";
import { SpatialLevel } from "./WorkspaceBreadcrumb";
import {
  SpatialHierarchyTreeResponse,
  ParcelHierarchyNode,
  BuildingHierarchyNode,
  FloorHierarchyNode,
  UnitHierarchyNode,
  SpatialElementNode,
} from "@/types/property";

export interface LayerVisibilityState {
  buildings: boolean;
  parcels: boolean;
  floors: boolean;
  units: boolean;
  subsurfaceUtilities: boolean;
  conflicts: boolean;
  temporalDiff: boolean;
}

interface LeftSpatialControlPanelProps {
  layers: LayerVisibilityState;
  onToggleLayer: (key: keyof LayerVisibilityState) => void;
  currentLevel: SpatialLevel;
  selectedParcelId?: string | null;
  selectedBuildingId: string | null;
  selectedFloorId: string | null;
  selectedUnitId?: string | null;
  selectedRoomId: string | null;
  selectedElementId?: string | null;
  treeData?: SpatialHierarchyTreeResponse | null;
  isLoadingTree?: boolean;
  onSelectLevel: (level: SpatialLevel, id?: string) => void;
  onOpenExtractionModal: () => void;
  onSetCameraPreset: (preset: "CITY" | "PARCEL" | "BUILDING" | "FLOOR" | "UNIT" | "ROOM") => void;
  measurementActive: boolean;
  onToggleMeasurement: () => void;
  measurementResult?: { distance: number; heightDelta: number } | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const LeftSpatialControlPanel: React.FC<LeftSpatialControlPanelProps> = ({
  layers,
  onToggleLayer,
  currentLevel,
  selectedParcelId,
  selectedBuildingId,
  selectedFloorId,
  selectedUnitId,
  selectedRoomId,
  selectedElementId,
  treeData,
  isLoadingTree = false,
  onSelectLevel,
  onOpenExtractionModal,
  onSetCameraPreset,
  measurementActive,
  onToggleMeasurement,
  measurementResult,
  isCollapsed: propIsCollapsed,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<"LAYERS" | "OUTLINER" | "TOOLS">("LAYERS");
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;
  const setIsCollapsed = (val: boolean) => {
    if (onToggleCollapse && val !== isCollapsed) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(val);
    }
  };
  const [outlinerFilter, setOutlinerFilter] = useState("");
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    city: true,
    "p-66666666-6666-4000-8000-000000000102": true,
    "p-102": true,
    "b-77777777-7777-4000-8000-000000000102": true,
    "b-102": true,
    "f-FL-03": true,
    "f-floor-3": true,
    "u-room-302": true,
    "r-302": true,
  });

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const LAYER_DEFS: {
    key: keyof LayerVisibilityState;
    label: string;
    sublabel: string;
    color: string;
    category: "PROPERTY" | "INFRASTRUCTURE" | "CONTEXT";
  }[] = [
    {
      key: "buildings",
      label: "3D Building Envelopes",
      sublabel: "LoD2 Architectural Meshes",
      color: "bg-[#23847D]",
      category: "PROPERTY",
    },
    {
      key: "parcels",
      label: "Cadastral Land Parcels",
      sublabel: "2D Surface Boundaries",
      color: "bg-[#176C68]",
      category: "PROPERTY",
    },
    {
      key: "floors",
      label: "3D Floor Slabs",
      sublabel: "Vertical Stratified Volumes",
      color: "bg-[#B56E48]",
      category: "PROPERTY",
    },
    {
      key: "units",
      label: "Rooms & Partitions",
      sublabel: "Interior Spaces & Centroids",
      color: "bg-[#C47B50]",
      category: "PROPERTY",
    },
    {
      key: "subsurfaceUtilities",
      label: "Subsurface Infrastructure",
      sublabel: "Storm Drains & Water Mains",
      color: "bg-[#23847D]",
      category: "INFRASTRUCTURE",
    },
    {
      key: "conflicts",
      label: "Spatial Discrepancies",
      sublabel: "Height & Setback Overlaps",
      color: "bg-[#B56E48]",
      category: "CONTEXT",
    },
    {
      key: "temporalDiff",
      label: "4D Footprint Changes",
      sublabel: "Multi-Epoch Growth (+60m²)",
      color: "bg-[#6F7772]",
      category: "CONTEXT",
    },
  ];

  return (
    <div
      role="region"
      aria-label="Spatial Layers and Hierarchy Control Panel"
      className={`absolute top-[68px] left-4 z-20 transition-all duration-300 ease-in-out select-none max-sm:left-2 ${
        isCollapsed ? "w-12" : "w-80 max-sm:w-[calc(100vw-1rem)]"
      }`}
    >
      <div className="bg-[#141816]/95 backdrop-blur-md border border-[rgba(244,240,232,0.10)] rounded-[12px] shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-6.5rem)] font-sans">
        {/* Header Tabs (Expanded) / Icon Rail (Collapsed) */}
        {!isCollapsed ? (
          <div className="p-3 border-b border-[rgba(244,240,232,0.08)] flex items-center justify-between bg-[#141816]">
            <div className="flex items-center gap-1.5 p-1 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)] w-full mr-2">
              <button
                onClick={() => setActiveTab("LAYERS")}
                className={`flex-1 py-1.5 px-2.5 rounded-[4px] text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "LAYERS"
                    ? "bg-[#B56E48] text-[#F4F0E8] shadow-sm"
                    : "text-[#6F7772] hover:text-[#D9D2C5]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Layers</span>
              </button>
              <button
                onClick={() => setActiveTab("OUTLINER")}
                className={`flex-1 py-1.5 px-2.5 rounded-[4px] text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "OUTLINER"
                    ? "bg-[#B56E48] text-[#F4F0E8] shadow-sm"
                    : "text-[#6F7772] hover:text-[#D9D2C5]"
                }`}
              >
                <ListTree className="w-3.5 h-3.5" />
                <span>Outliner</span>
              </button>
              <button
                onClick={() => setActiveTab("TOOLS")}
                className={`flex-1 py-1.5 px-2.5 rounded-[4px] text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "TOOLS"
                    ? "bg-[#B56E48] text-[#F4F0E8] shadow-sm"
                    : "text-[#6F7772] hover:text-[#D9D2C5]"
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Tools</span>
              </button>
            </div>

            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-[4px] hover:bg-[#1A201D] text-[#6F7772] hover:text-[#F4F0E8] transition-colors flex-shrink-0 cursor-pointer"
              title="Collapse Panel"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Collapsed Icon Rail */
          <div className="py-2.5 flex flex-col items-center gap-2">
            <button
              onClick={() => {
                setActiveTab("LAYERS");
                setIsCollapsed(false);
              }}
              className={`p-2 rounded-[4px] transition-all cursor-pointer ${
                activeTab === "LAYERS"
                  ? "bg-[#B56E48] text-[#F4F0E8]"
                  : "text-[#6F7772] hover:text-[#F4F0E8] hover:bg-[#1A201D]"
              }`}
              title="Layers"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setActiveTab("OUTLINER");
                setIsCollapsed(false);
              }}
              className={`p-2 rounded-[4px] transition-all cursor-pointer ${
                activeTab === "OUTLINER"
                  ? "bg-[#B56E48] text-[#F4F0E8]"
                  : "text-[#6F7772] hover:text-[#F4F0E8] hover:bg-[#1A201D]"
              }`}
              title="Spatial Outliner"
            >
              <ListTree className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setActiveTab("TOOLS");
                setIsCollapsed(false);
              }}
              className={`p-2 rounded-[4px] transition-all cursor-pointer ${
                activeTab === "TOOLS"
                  ? "bg-[#B56E48] text-[#F4F0E8]"
                  : "text-[#6F7772] hover:text-[#F4F0E8] hover:bg-[#1A201D]"
              }`}
              title="Spatial Tools"
            >
              <Wrench className="w-4 h-4" />
            </button>
            <div className="w-4 h-[1px] bg-[rgba(244,240,232,0.08)] my-0.5" />
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1.5 rounded-[4px] hover:bg-[#1A201D] text-[#6F7772] hover:text-[#F4F0E8] transition-colors cursor-pointer"
              title="Expand Panel"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Panel Content */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto p-3 text-xs space-y-3">
            {/* TAB 1: LAYERS */}
            {activeTab === "LAYERS" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#6F7772] font-mono font-bold px-0.5">
                  <span>Geospatial Layers</span>
                  <span className="text-[#23847D] font-mono">Live PostGIS</span>
                </div>

                {/* Categories */}
                {(
                  [
                    { id: "PROPERTY", label: "Property Boundaries & Envelopes" },
                    { id: "INFRASTRUCTURE", label: "Infrastructure & Conduits" },
                    { id: "CONTEXT", label: "Context & Intelligence" },
                  ] as const
                ).map((cat) => {
                  const catLayers = LAYER_DEFS.filter((l) => l.category === cat.id);
                  if (catLayers.length === 0) return null;

                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="text-[9px] uppercase tracking-wider text-[#6F7772] font-mono font-semibold px-0.5">
                        {cat.label} ({catLayers.filter((l) => layers[l.key]).length}/{catLayers.length})
                      </div>

                      <div className="space-y-1">
                        {catLayers.map((layer) => {
                          const isVisible = layers[layer.key];
                          return (
                            <div
                              key={layer.key}
                              onClick={() => onToggleLayer(layer.key)}
                              className={`p-2.5 rounded-[6px] border cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                                isVisible
                                  ? "bg-[#1A201D] border-[rgba(244,240,232,0.12)] text-[#F4F0E8]"
                                  : "bg-[#141816] border-[rgba(244,240,232,0.04)] text-[#6F7772] hover:border-[rgba(244,240,232,0.1)]"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isVisible ? layer.color : "bg-[#6F7772]/40"}`} />
                                <div className="truncate">
                                  <div className="text-xs truncate font-semibold text-[#F4F0E8]">{layer.label}</div>
                                  <div className="text-[11px] text-[#77867C] truncate font-sans mt-0.5">{layer.sublabel}</div>
                                </div>
                              </div>

                              <button
                                type="button"
                                className={`w-7 h-7 rounded-[4px] flex items-center justify-center transition-colors flex-shrink-0 hover:bg-[#222A26] ${
                                  isVisible ? "text-[#23847D]" : "text-[#6F7772]"
                                }`}
                              >
                                {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Collapsible Symbology Legend */}
                <div className="pt-2 border-t border-[rgba(244,240,232,0.08)]">
                  <button
                    onClick={() => setIsLegendOpen(!isLegendOpen)}
                    className="w-full flex items-center justify-between p-2 rounded-[4px] bg-[#1A201D] hover:bg-[#141816] border border-[rgba(244,240,232,0.08)] text-[10px] font-mono text-[#D9D2C5] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                      <Compass className="w-3.5 h-3.5 text-[#23847D]" />
                      Symbology Legend
                    </span>
                    {isLegendOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#6F7772]" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-[#6F7772]" />
                    )}
                  </button>

                  {isLegendOpen && (
                    <div className="mt-1.5 p-2 rounded-[4px] bg-[#141816] border border-[rgba(244,240,232,0.08)] space-y-1.5 text-[10px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-1.5 rounded-sm bg-[#23847D] flex-shrink-0" />
                        <span className="text-[#D9D2C5]">Selected / Active Envelope</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-1.5 rounded-sm bg-[#176C68] flex-shrink-0" />
                        <span className="text-[#D9D2C5]">Cadastral Boundary & Turf</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-1.5 rounded-sm bg-[#B56E48] flex-shrink-0" />
                        <span className="text-[#D9D2C5]">Discrepancy / Overhang Alert</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-1.5 rounded-sm bg-[#6F7772] flex-shrink-0" />
                        <span className="text-[#D9D2C5]">Multi-Epoch Footprint Diff</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: PROGRESSIVE OUTLINER */}
            {activeTab === "OUTLINER" && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#6F7772] absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Search spatial tree..."
                    value={outlinerFilter}
                    onChange={(e) => setOutlinerFilter(e.target.value)}
                    className="w-full bg-[#1A201D] border border-[rgba(244,240,232,0.08)] rounded-[4px] pl-8 pr-2.5 py-1 text-[11px] text-[#F4F0E8] placeholder-[#6F7772] focus:outline-none focus:border-[#B56E48] font-mono"
                  />
                </div>

                {isLoadingTree ? (
                  <div className="p-6 flex flex-col items-center justify-center gap-2.5 text-[#6F7772] font-mono text-xs">
                    <div className="w-4 h-4 rounded-full border-2 border-[#B56E48] border-t-transparent animate-spin" />
                    <span>Loading Spatial Hierarchy...</span>
                  </div>
                ) : (
                  <div className="space-y-1 font-mono text-[11px] max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
                    {/* Root: City */}
                    <div className="border border-[rgba(244,240,232,0.08)] rounded-[4px] overflow-hidden bg-[#1A201D]">
                      <button
                        onClick={() => {
                          toggleNode("city");
                          onSelectLevel("CITY");
                        }}
                        className={`w-full text-left px-2 py-1.5 flex items-center justify-between transition-colors ${
                          currentLevel === "CITY"
                            ? "bg-[#B56E48] text-[#F4F0E8] font-bold"
                            : "hover:bg-[#141816] text-[#D9D2C5]"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {expandedNodes["city"] ? (
                            <ChevronDown className="w-3 h-3 text-[#6F7772] flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-[#6F7772] flex-shrink-0" />
                          )}
                          <Globe2 className="w-3 h-3 text-[#23847D] flex-shrink-0" />
                          <span className="truncate font-semibold">{treeData?.city?.name || "Bengaluru Metro"}</span>
                        </div>
                        <span className="text-[9px] text-[#6F7772] font-mono">CITY</span>
                      </button>

                      {/* Parcels under City */}
                      {expandedNodes["city"] && (
                        <div className="pl-3 pr-1 py-1 space-y-1 border-t border-[rgba(244,240,232,0.08)]">
                          {(treeData?.city?.regions?.flatMap((r) => r.parcels) || []).map((parcel) => {
                            const parcelKey = `p-${parcel.id}`;
                            const isParcelExpanded = outlinerFilter ? true : !!expandedNodes[parcelKey];
                            const isParcelActive = currentLevel === "PARCEL" && selectedParcelId === parcel.id;
                            const hasBuildings = parcel.buildings && parcel.buildings.length > 0;

                            return (
                              <div
                                key={parcel.id}
                                className="rounded-[4px] border border-[rgba(244,240,232,0.06)] bg-[#141816]"
                              >
                                <button
                                  onClick={() => {
                                    toggleNode(parcelKey);
                                    onSelectLevel("PARCEL", parcel.id);
                                  }}
                                  className={`w-full text-left px-2 py-1 flex items-center justify-between transition-colors ${
                                    isParcelActive
                                      ? "bg-[#B56E48]/20 text-[#C47B50] font-bold"
                                      : "hover:bg-[#1A201D] text-[#D9D2C5]"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    {hasBuildings && (
                                      isParcelExpanded ? (
                                        <ChevronDown className="w-2.5 h-2.5 text-[#6F7772] flex-shrink-0" />
                                      ) : (
                                        <ChevronRight className="w-2.5 h-2.5 text-[#6F7772] flex-shrink-0" />
                                      )
                                    )}
                                    <MapPin className="w-3 h-3 text-[#23847D] flex-shrink-0" />
                                    <span className="truncate">{parcel.survey_number}</span>
                                  </div>
                                  <span className="text-[8px] text-[#6F7772] font-mono">
                                    {parcel.recorded_area_sqm}m²
                                  </span>
                                </button>

                                {/* Buildings under Parcel */}
                                {isParcelExpanded && hasBuildings && (
                                  <div className="pl-3 pr-1 pb-1 pt-0.5 space-y-1 border-t border-[rgba(244,240,232,0.04)]">
                                    {parcel.buildings.map((building) => {
                                      const bldgKey = `b-${building.id}`;
                                      const isBldgExpanded = outlinerFilter ? true : !!expandedNodes[bldgKey];
                                      const isBldgActive =
                                        currentLevel === "BUILDING" && selectedBuildingId === building.id;
                                      const hasFloors = building.floors && building.floors.length > 0;

                                      return (
                                        <div
                                          key={building.id}
                                          className={`rounded-[3px] border ${
                                            isBldgActive
                                              ? "border-[#B56E48] bg-[#1A201D]"
                                              : "border-[rgba(244,240,232,0.04)] bg-[#141816]"
                                          }`}
                                        >
                                          <button
                                            onClick={() => {
                                              toggleNode(bldgKey);
                                              onSelectLevel("BUILDING", building.id);
                                            }}
                                            className={`w-full text-left px-2 py-1 flex items-center justify-between transition-colors ${
                                              isBldgActive
                                                ? "text-[#F4F0E8] font-bold"
                                                : "hover:bg-[#1A201D] text-[#D9D2C5]"
                                            }`}
                                          >
                                            <div className="flex items-center gap-1.5 truncate">
                                              {hasFloors && (
                                                isBldgExpanded ? (
                                                  <ChevronDown className="w-2.5 h-2.5 text-[#6F7772] flex-shrink-0" />
                                                ) : (
                                                  <ChevronRight className="w-2.5 h-2.5 text-[#6F7772] flex-shrink-0" />
                                                )
                                              )}
                                              <Building2 className="w-3 h-3 text-[#C47B50] flex-shrink-0" />
                                              <span className="truncate">{building.name}</span>
                                            </div>
                                            {building.has_discrepancy && (
                                              <span className="text-[7px] px-1 py-0.2 rounded bg-[#B56E48]/20 text-[#C47B50] border border-[#B56E48]/40">
                                                Review
                                              </span>
                                            )}
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TOOLS */}
            {activeTab === "TOOLS" && (
              <div className="space-y-3">
                <div className="p-3 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F4F0E8] flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-[#C47B50]" />
                      3D Measurement
                    </span>
                    <button
                      onClick={onToggleMeasurement}
                      className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                        measurementActive
                          ? "bg-[#B56E48] text-[#F4F0E8]"
                          : "bg-[#141816] text-[#D9D2C5] border border-[rgba(244,240,232,0.12)] hover:border-[#B56E48]"
                      }`}
                    >
                      {measurementActive ? "Stop" : "Measure"}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#6F7772] leading-relaxed font-sans">
                    Click two 3D vertices in the scene to calculate Euclidean distance, vertical height delta, and span.
                  </p>
                  {measurementResult && (
                    <div className="mt-2 p-2 rounded-[4px] bg-[#141816] border border-[rgba(244,240,232,0.08)] grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div>
                        <span className="text-[#6F7772] block">3D Distance:</span>
                        <span className="text-[#23847D] font-bold">
                          {measurementResult.distance.toFixed(2)} m
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6F7772] block">Height Delta:</span>
                        <span className="text-[#C47B50] font-bold">
                          {measurementResult.heightDelta.toFixed(2)} m
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Camera Presets */}
                <div className="p-3 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)] space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F4F0E8] flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#23847D]" />
                    Spatial Camera Presets
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => onSetCameraPreset("CITY")}
                      className="p-2 rounded-[4px] bg-[#141816] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] hover:border-[#B56E48] text-[10px] text-[#D9D2C5] transition-all text-left cursor-pointer"
                    >
                      <span className="block font-bold text-[#F4F0E8]">City Macro</span>
                      <span className="text-[9px] text-[#6F7772] font-mono">850m Altitude</span>
                    </button>
                    <button
                      onClick={() => onSetCameraPreset("BUILDING")}
                      className="p-2 rounded-[4px] bg-[#141816] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] hover:border-[#B56E48] text-[10px] text-[#D9D2C5] transition-all text-left cursor-pointer"
                    >
                      <span className="block font-bold text-[#F4F0E8]">Building Focus</span>
                      <span className="text-[9px] text-[#6F7772] font-mono">180m Pitch -32°</span>
                    </button>
                    <button
                      onClick={() => onSetCameraPreset("FLOOR")}
                      className="p-2 rounded-[4px] bg-[#141816] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] hover:border-[#B56E48] text-[10px] text-[#D9D2C5] transition-all text-left cursor-pointer"
                    >
                      <span className="block font-bold text-[#F4F0E8]">Floor Cutaway</span>
                      <span className="text-[9px] text-[#6F7772] font-mono">70m Isometric</span>
                    </button>
                    <button
                      onClick={() => onSetCameraPreset("ROOM")}
                      className="p-2 rounded-[4px] bg-[#141816] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] hover:border-[#B56E48] text-[10px] text-[#D9D2C5] transition-all text-left cursor-pointer"
                    >
                      <span className="block font-bold text-[#F4F0E8]">Room Interior</span>
                      <span className="text-[9px] text-[#6F7772] font-mono">30m Section</span>
                    </button>
                  </div>
                </div>

                {/* AI Building Extractor Trigger */}
                <button
                  onClick={onOpenExtractionModal}
                  className="w-full p-2.5 rounded-[4px] bg-[#B56E48] hover:bg-[#C47B50] text-[#F4F0E8] font-mono font-bold flex items-center justify-between text-xs transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    <span>AI Extract Buildings</span>
                  </div>
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
