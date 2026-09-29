"use client";

/**
 * BhuSetu 3D Building & Vertical Hierarchy Inspector (3D Context)
 */
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE } from "@/lib/api/config";
import {
  Building2,
  X,
  MapPin,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Compass,
  ArrowUpRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Home,
  Check,
  Info,
  FileCheck2,
  GitBranch,
} from "lucide-react";

interface Building3DDetail {
  id: string;
  parcel_id: string;
  building_code: string;
  name?: string;
  building_type: string;
  ground_elevation: number;
  building_height: number;
  detected_floors: number;
  sanctioned_floors: number;
  height_source?: string;
  extraction_method?: string;
  confidence_score?: number;
  processing_version?: string;
  status_3d: string;
  metadata_json?: Record<string, any>;
  parent_parcel_ulpin?: string;
  parent_parcel_survey?: string;
}

export interface FloorItem {
  id: string;
  building_id: string;
  floor_number: number;
  floor_code: string;
  floor_label?: string;
  base_elevation: number;
  ceiling_elevation: number;
  floor_height: number;
  floor_area_sqm: number;
  status_3d: string;
  height_source?: string;
  extraction_method?: string;
  confidence_score?: number;
  units_count: number;
}

export interface UnitItem {
  id: string;
  floor_id: string;
  building_id: string;
  parcel_id: string;
  ulpin_3d: string;
  unit_number: string;
  unit_label?: string;
  unit_type: string;
  carpet_area_sqm: number;
  has_centroid_z: boolean;
  centroid_z_coords?: number[];
  has_geom_3d: boolean;
  verification_status: string;
  status_3d: string;
}

interface ValidationCheck {
  check_name: string;
  status: string;
  detail: string;
}

interface ValidationResult {
  is_valid: boolean;
  entity_type: string;
  entity_id: string;
  checks: ValidationCheck[];
  discrepancies: string[];
}

interface BuildingInspector3DProps {
  buildingId: string | null;
  selectedFloorId?: string | null;
  selectedUnitId?: string | null;
  isolateFloor?: boolean;
  onClose: () => void;
  onFocusBuilding?: (buildingId: string) => void;
  onSelectFloor?: (floorId: string | null) => void;
  onFocusFloor?: (floorId: string) => void;
  onSelectUnit?: (unitId: string | null) => void;
  onFocusUnit?: (unitId: string) => void;
  onToggleIsolateFloor?: (isolate: boolean) => void;
}

export const BuildingInspector3D: React.FC<BuildingInspector3DProps> = ({
  buildingId,
  selectedFloorId = null,
  selectedUnitId = null,
  isolateFloor = false,
  onClose,
  onFocusBuilding,
  onSelectFloor,
  onFocusFloor,
  onSelectUnit,
  onFocusUnit,
  onToggleIsolateFloor,
}) => {
  const router = useRouter();
  const { token } = useAuth();
  const [data, setData] = useState<Building3DDetail | null>(null);
  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [expandedFloorId, setExpandedFloorId] = useState<string | null>(null);
  const [floorUnits, setFloorUnits] = useState<Record<string, UnitItem[]>>({});
  const [loadingUnitsFloorId, setLoadingUnitsFloorId] = useState<string | null>(null);
  const [buildingConflicts, setBuildingConflicts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vertical Consistency Validation State
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (!buildingId) {
      setData(null);
      setFloors([]);
      setFloorUnits({});
      setBuildingConflicts([]);
      setValidationResult(null);
      setError(null);
      return;
    }

    async function loadBuildingAndFloors() {
      setIsLoading(true);
      setError(null);
      try {
        const [bldRes, floorsRes] = await Promise.all([
          fetch(`${API_BASE}/buildings/${buildingId}/3d`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          }),
          fetch(`${API_BASE}/properties/buildings/${buildingId}/floors`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          }),
        ]);

        if (!bldRes.ok) {
          throw new Error(`Failed to load building (HTTP ${bldRes.status})`);
        }
        const bldJson = await bldRes.json();
        setData(bldJson);

        if (floorsRes.ok) {
          const floorsJson = await floorsRes.json();
          setFloors(floorsJson || []);
        }

        if (bldJson.parcel_id) {
          try {
            const confRes = await fetch(`${API_BASE}/properties/${bldJson.parcel_id}/conflicts`, {
              headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            });
            if (confRes.ok) {
              const confJson = await confRes.json();
              const items = confJson.items || confJson || [];
              const bldIssues = items.filter(
                (c: any) => c.building_id === bldJson.id || c.entity_id === bldJson.id
              );
              setBuildingConflicts(bldIssues);
            }
          } catch (e) {
            console.error("Failed to load building conflicts", e);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load building data.");
      } finally {
        setIsLoading(false);
      }
    }

    loadBuildingAndFloors();
  }, [buildingId, token]);

  // Load units when expanding a floor
  const handleToggleExpandFloor = async (floorId: string) => {
    if (expandedFloorId === floorId) {
      setExpandedFloorId(null);
      return;
    }

    setExpandedFloorId(floorId);

    // Fetch units if not cached
    if (!floorUnits[floorId]) {
      setLoadingUnitsFloorId(floorId);
      try {
        const res = await fetch(`${API_BASE}/properties/floors/${floorId}/units`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (res.ok) {
          const unitsJson = await res.json();
          setFloorUnits((prev) => ({ ...prev, [floorId]: unitsJson || [] }));
        }
      } catch (err) {
        console.error("Failed to load units for floor:", err);
      } finally {
        setLoadingUnitsFloorId(null);
      }
    }
  };

  // Run Vertical Geometry & Elevation Consistency Validation
  const handleValidateVertical = async () => {
    if (!buildingId) return;
    setIsValidating(true);
    setShowValidation(true);
    try {
      const res = await fetch(`${API_BASE}/properties/buildings/${buildingId}/validate-vertical`, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.ok) {
        const resJson = await res.json();
        setValidationResult(resJson);
      }
    } catch (err) {
      console.error("Validation error:", err);
    } finally {
      setIsValidating(false);
    }
  };

  if (!buildingId) return null;

  const ulpinPrototype = data?.parent_parcel_ulpin
    ? `BHU-3D-P-${data.parent_parcel_ulpin}-B-${data.building_code}`
    : `BHU-3D-B-${data?.building_code || "PROTOTYPE"}`;

  return (
    <aside className="w-80 md:w-96 bg-surface/95 backdrop-blur-md border-l border-border-subtle flex flex-col h-full shadow-2xl z-20 text-xs font-mono select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-border-subtle flex items-center justify-between bg-surface-subtle">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold truncate">
          <Building2 className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">VERTICAL PROPERTY INSPECTOR</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400 gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span className="text-[11px]">Loading vertical property tree...</span>
        </div>
      ) : error ? (
        <div className="p-4 m-4 rounded bg-rose-950/30 border border-rose-800/40 text-rose-300">
          <p className="font-semibold text-xs mb-1">Error Loading Hierarchy</p>
          <p className="text-[11px] text-rose-400">{error}</p>
        </div>
      ) : data ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Statutory Title Block & ULPIN-Oriented Prototype Identity */}
          <div className="bg-canvas/80 p-3 rounded border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                ULPIN-ORIENTED 3D IDENTITY (PROTOTYPE)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                {data.status_3d}
              </span>
            </div>
            <div className="text-xs font-bold text-cyan-300 break-all bg-surface/70 p-1.5 rounded border border-border-subtle/50">
              {ulpinPrototype}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="font-semibold text-slate-100">{data.building_code}</span>
              <span className="text-slate-400">{data.building_type}</span>
            </div>
            <p className="text-[9px] text-slate-500 italic">
              * Technical spatial identifier. Does NOT claim official government ULPIN issuance.
            </p>
          </div>

          {/* Completeness Indicator */}
          <div className="bg-canvas/40 p-2.5 rounded border border-border-subtle space-y-1.5">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
              VERTICAL DATA COMPLETENESS
            </span>
            <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
              <div className="p-1 rounded bg-slate-900 border border-emerald-500/30 text-emerald-400 font-semibold">
                Parcel ✓
              </div>
              <div className="p-1 rounded bg-slate-900 border border-emerald-500/30 text-emerald-400 font-semibold">
                Building ✓
              </div>
              <div className={`p-1 rounded bg-slate-900 border font-semibold ${floors.length > 0 ? "border-emerald-500/30 text-emerald-400" : "border-slate-800 text-slate-500"}`}>
                Floors ({floors.length})
              </div>
              <div className="p-1 rounded bg-slate-900 border border-cyan-500/30 text-cyan-300 font-semibold">
                Units ({floors.reduce((acc, f) => acc + f.units_count, 0)})
              </div>
            </div>
          </div>

          {/* Evidence & Provenance */}
          <div className="bg-canvas/40 p-3 rounded border border-cyan-500/30 space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <FileCheck2 className="w-3 h-3" />
                EVIDENCE & PROVENANCE
              </span>
              <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 text-[9px] font-bold">
                AI_ASSISTED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2 bg-slate-900 rounded border border-border-subtle/50">
                <span className="text-slate-500 block">Extraction:</span>
                <span className="text-slate-200 font-semibold truncate block">
                  {data.extraction_method || "YOLOv8x Building Segmentation"}
                </span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-border-subtle/50">
                <span className="text-slate-500 block">Height Source:</span>
                <span className="text-slate-200 font-semibold truncate block">
                  {data.height_source || "LIDAR_POINT_CLOUD"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-border-subtle/40">
              <span className="text-slate-400">Confidence Score:</span>
              <span className="text-emerald-400 font-bold">
                {((data.confidence_score || 0.85) * 100).toFixed(1)}%
              </span>
            </div>

            <a
              href={`/evidence`}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline font-mono pt-0.5"
            >
              <ArrowUpRight className="w-3 h-3" />
              <span>Inspect Full Evidence Vault</span>
            </a>
          </div>

          {/* Spatial Conflicts */}
          {buildingConflicts.length > 0 && (
            <div className="bg-amber-950/30 border border-amber-500/40 rounded p-3 space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>SPATIAL CONFLICT FINDINGS ({buildingConflicts.length})</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-900/60 text-amber-200 border border-amber-500/40">
                  Advisory
                </span>
              </div>

              <div className="space-y-1.5">
                {buildingConflicts.map((c: any) => (
                  <div key={c.id} className="p-2 rounded bg-slate-900/80 border border-amber-500/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-cyan-400 font-bold text-[10px]">
                        {c.rule_id || "RULE-BLDG"}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-amber-400">
                        {c.severity} Severity
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-tight">
                      {c.explanation || c.rule_name}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-1 flex items-center justify-between text-[10px]">
                <span className="text-[9px] text-slate-400 italic">
                  * Technical notice. Not a legal adjudication.
                </span>
                <a
                  href={`/conflicts/${buildingConflicts[0].id}`}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline font-mono"
                >
                  <span>Inspect Discrepancy</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Vertical Hierarchy: Building -> Floors -> Units */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>VERTICAL LEVELS ({floors.length})</span>
              </span>

              {onToggleIsolateFloor && selectedFloorId && (
                <button
                  onClick={() => onToggleIsolateFloor(!isolateFloor)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                    isolateFloor
                      ? "bg-amber-950 text-amber-300 border border-amber-500/40"
                      : "bg-surface hover:bg-slate-800 text-slate-400 border border-border-subtle"
                  }`}
                  title="Toggle isolation of the selected floor slab"
                >
                  {isolateFloor ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3" />}
                  <span>{isolateFloor ? "Isolated" : "Isolate Floor"}</span>
                </button>
              )}
            </div>

            {floors.length > 0 ? (
              <div className="space-y-1.5">
                {floors.map((floor) => {
                  const isSelected = floor.id === selectedFloorId;
                  const isExpanded = floor.id === expandedFloorId;
                  const units = floorUnits[floor.id] || [];

                  return (
                    <div
                      key={floor.id}
                      className={`rounded border transition-all ${
                        isSelected
                          ? "bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/30"
                          : "bg-canvas/50 border-border-subtle hover:border-slate-700"
                      }`}
                    >
                      {/* Floor Row Header */}
                      <div className="p-2.5 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            if (onSelectFloor) onSelectFloor(floor.id);
                            if (onFocusFloor) onFocusFloor(floor.id);
                          }}
                          className="flex items-center gap-2 flex-1 text-left"
                        >
                          <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] ${
                            isSelected ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 border border-border-subtle"
                          }`}>
                            L{floor.floor_number}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-200 text-[11px] flex items-center gap-1.5">
                              <span>{floor.floor_label || `Floor ${floor.floor_number}`}</span>
                              {isSelected && (
                                <span className="px-1 py-0.2 bg-emerald-900/80 text-emerald-300 text-[9px] rounded font-bold">
                                  ACTIVE 3D
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {floor.base_elevation.toFixed(1)}m – {floor.ceiling_elevation.toFixed(1)}m (Δ {floor.floor_height.toFixed(1)}m)
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleExpandFloor(floor.id)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-0.5 text-[10px]"
                            title="Expand Atomic Units"
                          >
                            <span className="text-cyan-400 font-semibold">{floor.units_count}u</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Units Sub-tree */}
                      {isExpanded && (
                        <div className="p-2 pt-0 border-t border-border-subtle/50 space-y-1 mt-1 bg-surface-subtle/40">
                          {loadingUnitsFloorId === floor.id ? (
                            <div className="py-2 text-center text-slate-500 text-[10px] flex items-center justify-center gap-1">
                              <div className="w-3 h-3 rounded-full border border-cyan-400 border-t-transparent animate-spin" />
                              <span>Loading atomic units...</span>
                            </div>
                          ) : units.length > 0 ? (
                            units.map((unit) => {
                              const isUnitSelected = unit.id === selectedUnitId;
                              return (
                                <button
                                  key={unit.id}
                                  onClick={() => {
                                    if (onSelectUnit) onSelectUnit(unit.id);
                                    if (onFocusUnit) onFocusUnit(unit.id);
                                  }}
                                  className={`w-full p-2 rounded text-left flex items-center justify-between text-[10px] border transition-colors ${
                                    isUnitSelected
                                      ? "bg-amber-950/40 border-amber-500/60 text-amber-200"
                                      : "bg-surface border-border-subtle/60 hover:bg-slate-800 text-slate-300"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <Home className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                                    <span className="font-bold">{unit.unit_number}</span>
                                    <span className="text-slate-400">({unit.unit_type})</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">{unit.carpet_area_sqm} m²</span>
                                    <span className={`px-1 py-0.2 rounded text-[8px] font-bold ${
                                      unit.verification_status === "VERIFIED"
                                        ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                                        : "bg-slate-800 text-slate-400 border border-border-subtle"
                                    }`}>
                                      {unit.verification_status}
                                    </span>
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="text-[10px] text-slate-500 py-1 text-center">
                              No atomic units recorded on this level.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded bg-canvas/30 border border-border-subtle text-slate-500 text-[11px] text-center">
                No vertical floor levels available for this building.
              </div>
            )}
          </div>

          {/* Vertical Consistency Validation Section */}
          <div className="bg-canvas/50 p-3 rounded border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>GEOMETRIC & VERTICAL CHECKS</span>
              </span>
              <button
                onClick={handleValidateVertical}
                disabled={isValidating}
                className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 text-[10px] font-semibold transition-colors disabled:opacity-50"
              >
                {isValidating ? "Validating..." : "Run Checks"}
              </button>
            </div>

            {showValidation && validationResult && (
              <div className="space-y-1.5 pt-1 text-[10px]">
                <div className={`p-1.5 rounded flex items-center gap-1.5 font-bold ${
                  validationResult.is_valid
                    ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                    : "bg-rose-950/60 border border-rose-500/40 text-rose-300"
                }`}>
                  {validationResult.is_valid ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  )}
                  <span>{validationResult.is_valid ? "Vertical Structure Valid" : "Discrepancies Detected"}</span>
                </div>

                <div className="space-y-1">
                  {validationResult.checks.map((c, i) => (
                    <div key={i} className="flex items-start justify-between p-1 bg-surface rounded border border-border-subtle/40">
                      <span className="text-slate-400 font-medium">{c.check_name}</span>
                      <span className={`px-1 rounded text-[9px] font-bold ${
                        c.status === "PASSED" ? "text-emerald-400" : c.status === "WARNING" ? "text-amber-400" : "text-rose-400"
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            {onFocusBuilding && (
              <button
                onClick={() => onFocusBuilding(data.id)}
                className="w-full py-2 px-3 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Compass className="w-3.5 h-3.5" />
                Focus Entire Building in 3D
              </button>
            )}

            {data.parcel_id && (
              <button
                onClick={() => router.push(`/properties?parcel=${data.parcel_id}&building=${data.id}`)}
                className="w-full py-2 px-3 rounded bg-surface hover:bg-slate-800 border border-border-subtle text-slate-300 text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                View in 2D Parcel Map
              </button>
            )}
          </div>
        </div>
      ) : null}
    </aside>
  );
};
