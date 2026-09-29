"use client";

/**
 * BhuSetu 3D Property Inspector Drawer
 */
import React, { useEffect, useState } from "react";
import {
  X,
  Maximize2,
  Building,
  Layers,
  MapPin,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  ExternalLink,
  FileCheck2,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Activity,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE } from "@/lib/api/config";

export interface BuildingDetailItem {
  id: string;
  building_code: string;
  name?: string;
  building_type: string;
  ground_elevation: number;
  building_height: number;
  detected_floors: number;
  sanctioned_floors: number;
}

export interface ParcelDetailData {
  id: string;
  ulpin_2d: string;
  survey_number: string;
  recorded_area_sqm: number;
  computed_area_sqm: number;
  land_use: string;
  elevation_base: number;
  city_id: string;
  region_id: string;
  geom_2d_geojson?: any;
  buildings: BuildingDetailItem[];
  infrastructure_ids: string[];
  created_at: string;
}

interface PropertyInspectorProps {
  parcelId: string | null;
  onClose: () => void;
  onZoomToProperty: (geom: any) => void;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  parcelId,
  onClose,
  onZoomToProperty,
}) => {
  const { token } = useAuth();
  const [data, setData] = useState<ParcelDetailData | null>(null);
  const [confidence, setConfidence] = useState<{
    composite_confidence: number;
    verification_status: string;
    is_verified: boolean;
    supporting_factors: string[];
    limiting_factors: string[];
    evidence_coverage_percentage: number;
  } | null>(null);
  const [spatialSummary, setSpatialSummary] = useState<{
    conflictsCount: number;
    highCount: number;
    relationshipsCount: number;
    infraCount: number;
    conflicts: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingSpatial, setIsAnalyzingSpatial] = useState(false);
  const [spatialActionMsg, setSpatialActionMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBuildingsExpanded, setIsBuildingsExpanded] = useState(true);
  const [isEvidenceExpanded, setIsEvidenceExpanded] = useState(false);
  const [isSpatialExpanded, setIsSpatialExpanded] = useState(true);

  const fetchSpatialData = async (id: string) => {
    try {
      const [conflictRes, relRes, infraRes] = await Promise.all([
        fetch(`${API_BASE}/properties/${id}/conflicts`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${API_BASE}/properties/${id}/relationships`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${API_BASE}/properties/${id}/nearby-infrastructure?radius_meters=100`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);

      const confItems = conflictRes.ok ? (await conflictRes.json()).items || [] : [];
      const relItems = relRes.ok ? (await relRes.json()).items || [] : [];
      const infraItems = infraRes.ok ? (await infraRes.json()).features || [] : [];

      const highCount = confItems.filter((c: any) => c.severity === "HIGH").length;

      setSpatialSummary({
        conflictsCount: confItems.length,
        highCount,
        relationshipsCount: relItems.length,
        infraCount: infraItems.length,
        conflicts: confItems,
      });
    } catch (err) {
      console.error("Failed to load spatial summary", err);
    }
  };

  const handleRunSpatialChecks = async () => {
    if (!parcelId) return;
    setIsAnalyzingSpatial(true);
    setSpatialActionMsg(null);
    try {
      const res = await fetch(`${API_BASE}/properties/${parcelId}/analyze-spatial`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setSpatialActionMsg(`Analyzed: ${json.new_conflicts_found} new findings, ${json.relationships_analyzed} relations.`);
        await fetchSpatialData(parcelId);
        setTimeout(() => setSpatialActionMsg(null), 4000);
      }
    } catch (e: any) {
      alert("Spatial check failed: " + e.message);
    } finally {
      setIsAnalyzingSpatial(false);
    }
  };

  useEffect(() => {
    if (!parcelId) {
      setData(null);
      setConfidence(null);
      setSpatialSummary(null);
      setError(null);
      return;
    }

    async function fetchDetail() {
      setIsLoading(true);
      setError(null);
      try {
        const [parcelRes, confRes] = await Promise.all([
          fetch(`${API_BASE}/properties/parcels/${parcelId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          fetch(`${API_BASE}/properties/${parcelId}/confidence`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
        ]);

        if (!parcelRes.ok) {
          throw new Error(`Failed to load property (HTTP ${parcelRes.status})`);
        }
        const json = await parcelRes.json();
        setData(json);

        if (confRes.ok) {
          const confJson = await confRes.json();
          setConfidence(confJson);
        }

        if (parcelId) {
          await fetchSpatialData(parcelId);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load property details.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcelId, token]);

  if (!parcelId) return null;

  return (
    <aside className="w-full md:w-96 fixed inset-x-0 bottom-0 max-h-[65vh] md:max-h-none md:relative md:inset-auto bg-[#141816]/95 backdrop-blur-md border-t md:border-t-0 md:border-l border-[rgba(244,240,232,0.08)] flex flex-col h-auto md:h-full shadow-2xl z-30 text-xs font-mono select-none">
      {/* Mobile Drag Indicator */}
      <div className="w-10 h-1 bg-[rgba(244,240,232,0.2)] rounded-full mx-auto mt-2 md:hidden" />

      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-[rgba(244,240,232,0.08)] flex items-center justify-between bg-[#1A201D]">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#C47B50]" />
          <h2 className="text-xs font-bold text-[#F4F0E8] uppercase tracking-wider">
            Property Inspector
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {data?.geom_2d_geojson && (
            <button
              onClick={() => onZoomToProperty(data.geom_2d_geojson)}
              className="p-1.5 text-[#8C988F] hover:text-[#23847D] hover:bg-[#222A26] rounded-[4px] transition-colors cursor-pointer"
              title="Zoom to parcel extent"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-[#8C988F] hover:text-[#F4F0E8] hover:bg-[#222A26] rounded-[4px] transition-colors cursor-pointer"
            title="Close inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="h-48 flex flex-col items-center justify-center gap-2 text-[#8C988F]">
            <Loader2 className="w-5 h-5 text-[#23847D] animate-spin" />
            <span className="text-[11px]">Loading property details...</span>
          </div>
        ) : error ? (
          <div className="p-3 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Inspection Error</span>
            </div>
            <p className="text-[11px] text-rose-300/80">{error}</p>
          </div>
        ) : data ? (
          <>
            {/* ULPIN & Statutory Identifiers */}
            <div className="bg-[#1A201D] border border-[rgba(244,240,232,0.08)] rounded-[8px] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#8C988F] uppercase tracking-wider">
                  2D ULPIN IDENTIFIER
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#23847D]/20 text-[#23847D] border border-[#23847D]/40 font-semibold">
                  AUTHORITATIVE
                </span>
              </div>
              <div className="text-sm font-bold text-[#C47B50] break-all">
                {data.ulpin_2d}
              </div>
              <div className="text-[11px] text-[#8C988F] flex items-center justify-between pt-1 border-t border-[rgba(244,240,232,0.06)]">
                <span>Survey Number:</span>
                <span className="text-[#F4F0E8] font-semibold">{data.survey_number}</span>
              </div>
            </div>

            {/* 3D Property Identity */}
            <div className="bg-[#1A201D] border border-[#23847D]/30 rounded-[8px] p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#8C988F] uppercase tracking-wider font-semibold">
                  3D ULPIN-ORIENTED IDENTITY (PROTOTYPE)
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#23847D]/20 text-[#23847D] border border-[#23847D]/40 font-bold">
                  PROTOTYPE
                </span>
              </div>
              <div className="text-xs font-bold text-[#23847D] break-all font-mono">
                {`BHU-3D-P-${data.ulpin_2d}`}
              </div>
              <p className="text-[11px] text-[#8C988F] italic">
                * Technical spatial identifier linking parcel to vertical building levels. Does not claim official ULPIN issuance.
              </p>
            </div>

            {/* Vertical Model Completeness */}
            <div className="p-2.5 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)] grid grid-cols-3 gap-1.5 text-center text-[11px]">
              <div className="p-1 rounded-[4px] bg-[#141816] border border-[#23847D]/20 text-[#23847D] font-semibold">
                Parcel ✓
              </div>
              <div className="p-1 rounded-[4px] bg-[#141816] border border-[#23847D]/20 text-[#23847D] font-semibold">
                Buildings ({data.buildings.length})
              </div>
              <div className="p-1 rounded-[4px] bg-[#141816] border border-[#23847D]/20 text-[#23847D] font-semibold">
                3D Ready ✓
              </div>
            </div>

            {/* Spatial Metrics */}
            <div className="space-y-1.5">
              <span className="text-[11px] uppercase text-[#8C988F] tracking-wider">
                SPATIAL METRICS
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-[8px] bg-[#1A201D] border border-[rgba(244,240,232,0.06)]">
                  <div className="text-[11px] text-[#8C988F]">RECORDED AREA</div>
                  <div className="text-xs font-bold text-[#F4F0E8] mt-0.5">
                    {data.recorded_area_sqm.toLocaleString()} m²
                  </div>
                </div>
                <div className="p-2.5 rounded-[8px] bg-[#1A201D] border border-[rgba(244,240,232,0.06)]">
                  <div className="text-[11px] text-[#8C988F]">COMPUTED AREA</div>
                  <div className="text-xs font-bold text-[#F4F0E8] mt-0.5">
                    {data.computed_area_sqm.toLocaleString()} m²
                  </div>
                </div>
              </div>
            </div>

            {/* Land Use & Base Elevation */}
            <div className="p-3 rounded-[8px] bg-[#1A201D] border border-[rgba(244,240,232,0.06)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#8C988F]">Land Use:</span>
                <span className="px-2 py-0.5 rounded-[4px] bg-[#0F1210] text-[#F4F0E8] border border-[rgba(244,240,232,0.06)] text-[11px] font-semibold">
                  {data.land_use}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#8C988F]">Base Elevation:</span>
                <span className="text-[#F4F0E8] font-semibold">{data.elevation_base} m AMSL</span>
              </div>
            </div>

            {/* Physical Hierarchy: Parcel -> Buildings */}
            <div className="border border-[rgba(244,240,232,0.08)] rounded-[8px] overflow-hidden bg-[#1A201D]/50">
              <button
                onClick={() => setIsBuildingsExpanded(!isBuildingsExpanded)}
                className="w-full p-3 flex items-center justify-between bg-[#1A201D] hover:bg-[#222A26] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-[#C47B50]" />
                  <span className="text-[11px] font-semibold text-[#F4F0E8]">
                    Physical Structures ({data.buildings.length})
                  </span>
                </div>
                {isBuildingsExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#77867C]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#77867C]" />
                )}
              </button>

              {isBuildingsExpanded && (
                <div className="p-3 space-y-2 border-t border-[rgba(244,240,232,0.06)]">
                  {data.buildings.length > 0 ? (
                    data.buildings.map((b) => (
                      <div
                        key={b.id}
                        className="p-2.5 rounded-[6px] bg-[#141816] border border-[rgba(244,240,232,0.06)] space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#C47B50] text-[11px]">
                            {b.building_code}
                          </span>
                          <span className="text-[10px] text-[#77867C] px-1 rounded-[4px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)]">
                            {b.building_type}
                          </span>
                        </div>
                        {b.name && <div className="text-[11px] text-[#D9D2C5]">{b.name}</div>}
                        <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-[#77867C] border-t border-[rgba(244,240,232,0.06)]">
                          <div>Height: <span className="text-[#F4F0E8] font-semibold">{b.building_height}m</span></div>
                          <div>Floors: <span className="text-[#F4F0E8] font-semibold">{b.detected_floors}</span></div>
                        </div>
                        <a
                          href={`/3d-city?building=${b.id}`}
                          className="text-[10px] text-[#23847D] hover:text-[#2EB8B0] flex items-center gap-1 pt-1 border-t border-[rgba(244,240,232,0.06)] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Inspect 3D Volume</span>
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="text-[#77867C] text-[11px] py-1">
                      No building structures mapped to this parcel.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Evidence & Lineage Trace */}
            <div className="border border-[rgba(244,240,232,0.08)] rounded-[8px] overflow-hidden bg-[#1A201D]/50">
              <button
                onClick={() => setIsEvidenceExpanded(!isEvidenceExpanded)}
                className="w-full p-3 flex items-center justify-between bg-[#1A201D] hover:bg-[#222A26] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-3.5 h-3.5 text-[#23847D]" />
                  <span className="text-[11px] font-semibold text-[#F4F0E8]">
                    Evidence & Lineage Trace
                  </span>
                </div>
                {isEvidenceExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#77867C]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#77867C]" />
                )}
              </button>

              {isEvidenceExpanded && (
                <div className="p-3 space-y-3 border-t border-[rgba(244,240,232,0.06)] text-[11px]">
                  {confidence ? (
                    <>
                      {/* Confidence Score Bar */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-[#77867C] uppercase font-mono">
                            Composite Confidence:
                          </span>
                          <span className="font-mono font-bold text-[#23847D]">
                            {(confidence.composite_confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-[#0F1210] h-2 rounded-full overflow-hidden border border-[rgba(244,240,232,0.06)]">
                          <div
                            className={`h-full ${
                              confidence.composite_confidence >= 0.85
                                ? "bg-[#23847D]"
                                : confidence.composite_confidence >= 0.70
                                ? "bg-[#B56E48]"
                                : "bg-rose-400"
                            }`}
                            style={{ width: `${confidence.composite_confidence * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Statutory Verification Status Notice */}
                      <div className="p-2 rounded-[6px] bg-[#B56E48]/10 border border-[#B56E48]/30 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#C47B50] flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[#F4F0E8] block text-[10px] uppercase font-mono">
                            Statutory Status: {confidence.verification_status}
                          </span>
                          <span className="text-[10px] text-[#A2B3A8] leading-tight block">
                            Confidence score does not equal legal statutory verification.
                          </span>
                        </div>
                      </div>

                      {/* Supporting & Limiting Factors */}
                      <div className="space-y-1.5">
                        {confidence.supporting_factors.slice(0, 2).map((f, i) => (
                          <div key={i} className="text-[#23847D] text-[10px] flex items-start gap-1">
                            <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </div>
                        ))}
                        {confidence.limiting_factors.slice(0, 1).map((f, i) => (
                          <div key={i} className="text-[#C47B50] text-[10px] flex items-start gap-1">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>

                      {/* Vault Navigation Link */}
                      <a
                        href={`/evidence`}
                        className="text-[10px] text-[#23847D] hover:text-[#2EB8B0] flex items-center gap-1 pt-1 border-t border-[rgba(244,240,232,0.06)] hover:underline font-mono"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Inspect Full Evidence Vault</span>
                      </a>
                    </>
                  ) : (
                    <div className="text-[#77867C] text-[10px] py-1">
                      Loading evidence factors...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Spatial Intelligence & Conflicts Accordion (Phase 9) */}
            <div className="border border-[rgba(244,240,232,0.08)] rounded-[8px] bg-[#141816]/50 overflow-hidden">
              <button
                onClick={() => setIsSpatialExpanded(!isSpatialExpanded)}
                className="w-full p-2.5 flex items-center justify-between bg-[#1A201D] hover:bg-[#222A26] text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#23847D]" />
                  <span className="font-bold text-[11px] text-[#F4F0E8] uppercase tracking-wide">
                    SPATIAL TOPOLOGY & CONFLICTS
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {spatialSummary && (
                    <span
                      className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold ${
                        spatialSummary.conflictsCount > 0
                          ? spatialSummary.highCount > 0
                            ? "bg-rose-950 text-rose-300 border border-rose-500/40"
                            : "bg-[#B56E48]/20 text-[#C47B50] border border-[#B56E48]/40"
                          : "bg-[#23847D]/20 text-[#23847D] border border-[#23847D]/40"
                      }`}
                    >
                      {spatialSummary.conflictsCount > 0
                        ? `${spatialSummary.conflictsCount} Discrepancies`
                        : "0 Issues"}
                    </span>
                  )}
                  {isSpatialExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-[#77867C]" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-[#77867C]" />
                  )}
                </div>
              </button>

              {isSpatialExpanded && (
                <div className="p-3 space-y-2.5 border-t border-[rgba(244,240,232,0.06)] text-xs">
                  {spatialActionMsg && (
                    <div className="p-2 rounded-[6px] bg-[#23847D]/10 border border-[#23847D]/40 text-[10px] text-[#23847D] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                      <span>{spatialActionMsg}</span>
                    </div>
                  )}

                  {/* Summary Metrics */}
                  {spatialSummary && (
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 rounded-[6px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)]">
                        <span className="text-[#77867C] block mb-0.5">Topological Relations:</span>
                        <span className="font-bold text-[#23847D]">
                          {spatialSummary.relationshipsCount} relations
                        </span>
                      </div>
                      <div className="p-2 rounded-[6px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)]">
                        <span className="text-[#77867C] block mb-0.5">Nearby Infra (100m):</span>
                        <span className="font-bold text-[#F4F0E8]">
                          {spatialSummary.infraCount} features
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Discrepancies List */}
                  {spatialSummary && spatialSummary.conflicts.length > 0 ? (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-semibold text-[#77867C] uppercase tracking-wider">
                        Detected Discrepancies:
                      </div>
                      {spatialSummary.conflicts.slice(0, 2).map((c: any) => (
                        <div
                          key={c.id}
                          className="p-2 rounded-[6px] bg-[#0F1210] border border-[rgba(244,240,232,0.06)] text-[10px] space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[#C47B50] font-semibold">{c.rule_id || "RULE"}</span>
                            <span
                              className={`px-1 py-0.2 rounded-[4px] text-[8px] font-bold ${
                                c.severity === "HIGH"
                                  ? "bg-rose-950 text-rose-300"
                                  : "bg-[#B56E48]/20 text-[#C47B50]"
                              }`}
                            >
                              {c.severity}
                            </span>
                          </div>
                          <p className="text-[#D9D2C5] leading-snug line-clamp-2">{c.explanation}</p>
                          <a
                            href={`/conflicts/${c.id}`}
                            className="text-[#23847D] hover:text-[#2EB8B0] flex items-center gap-1 font-mono text-[9px] pt-1"
                          >
                            <span>Inspect Finding</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-[#23847D] py-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>No active spatial discrepancies detected for this parcel.</span>
                    </div>
                  )}

                  {/* Quick Action Buttons */}
                  <div className="pt-1.5 space-y-1.5 border-t border-[rgba(244,240,232,0.06)]">
                    <button
                      onClick={handleRunSpatialChecks}
                      disabled={isAnalyzingSpatial}
                      className="w-full py-1.5 px-2.5 rounded-[6px] bg-[#23847D]/20 hover:bg-[#23847D]/30 border border-[#23847D]/40 text-[#23847D] text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Activity className={`w-3 h-3 ${isAnalyzingSpatial ? "animate-spin" : ""}`} />
                      <span>{isAnalyzingSpatial ? "Analyzing Geometries..." : "Run Real-Time Spatial Checks"}</span>
                    </button>

                    <a
                      href={`/spatial-analysis?parcel=${data.id}`}
                      className="text-[10px] text-[#23847D] hover:text-[#2EB8B0] flex items-center justify-center gap-1 hover:underline font-mono py-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open Spatial Intelligence Workspace</span>
                    </a>

                    <a
                      href={`/spatial-investigator?parcel=${data.id}&q=Why was this property flagged?`}
                      className="w-full py-1.5 px-2.5 rounded-[6px] bg-[#B56E48]/10 hover:bg-[#B56E48]/20 border border-[#B56E48]/40 text-[#C47B50] text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-[#C47B50]" />
                      <span>Investigate with AI</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action */}
            <div className="pt-2">
              <button
                onClick={() => onZoomToProperty(data.geom_2d_geojson)}
                className="w-full py-2 px-3 bg-[#23847D]/20 hover:bg-[#23847D]/30 border border-[#23847D]/40 text-[#23847D] rounded-[6px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Zoom To Parcel Extent</span>
              </button>
            </div>
          </>
        ) : null}
      </div>
    </aside>
  );
};
