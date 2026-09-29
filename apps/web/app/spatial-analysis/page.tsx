"use client";

/**
 * BhuSetu 3D Spatial Intelligence & Discrepancy Analysis Workspace
 * Evidence-Backed 3D Property Intelligence Platform
 */
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { SpatialLoadingRoller } from "@/components/common/SpatialLoadingRoller";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE } from "@/lib/api/config";
import {
  Compass,
  AlertTriangle,
  Layers,
  Building2,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Info,
  CheckCircle2,
  RefreshCw,
  Search,
  Activity,
  Zap,
  Sliders,
  Play,
  Share2,
  Scale,
  MapPin,
  Check,
  GitBranch,
} from "lucide-react";

interface ParcelOption {
  id: string;
  ulpin_2d: string;
  survey_number: string;
  recorded_area_sqm: number;
  computed_area_sqm: number;
  land_use: string;
}

interface ConflictItem {
  id: string;
  conflict_type: string;
  severity: string;
  status: string;
  rule_id?: string;
  rule_name?: string;
  entity_type: string;
  entity_id?: string;
  parcel_id?: string;
  parcel_ulpin?: string;
  building_id?: string;
  building_code?: string;
  unit_id?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  related_entity_label?: string;
  measured_value?: number;
  threshold_value?: number;
  measured_unit: string;
  deviation_value?: number;
  explanation?: string;
  discrepancy_details: Record<string, any>;
  evidence_reference: Record<string, any>;
  confidence_score: number;
  analysis_version: string;
  created_at: string;
}

interface SpatialRelationshipItem {
  id: string;
  relationship_type: string;
  source_entity_type: string;
  source_entity_id: string;
  target_entity_type: string;
  target_entity_id: string;
  target_label?: string;
  distance_meters?: number;
  intersection_area_sqm?: number;
  shared_boundary_length_m?: number;
  confidence_score: number;
  is_valid: boolean;
  notes?: string;
}

interface InfrastructureFeature {
  id: string;
  name: string;
  type: string;
  distance_meters: number;
  buffer_zone_meters: number;
  is_inside_buffer: boolean;
  clearance_warning: boolean;
}

interface SpatialRuleItem {
  id: string;
  rule_code: string;
  name: string;
  description: string;
  rule_type: string;
  severity: string;
  is_active: boolean;
  parameters: Record<string, any>;
}

function SpatialAnalysisContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const urlParcelId = searchParams.get("parcel");

  // Selection
  const [selectedParcelId, setSelectedParcelId] = useState<string>(urlParcelId || "");
  const [parcelsList, setParcelsList] = useState<ParcelOption[]>([]);
  const [activeParcel, setActiveParcel] = useState<ParcelOption | null>(null);
  const [isSearchingParcels, setIsSearchingParcels] = useState(false);
  const [parcelSearchTerm, setParcelSearchTerm] = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState<"findings" | "relationships" | "infrastructure" | "rules">("findings");

  // Data states
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [relationships, setRelationships] = useState<SpatialRelationshipItem[]>([]);
  const [infrastructure, setInfrastructure] = useState<InfrastructureFeature[]>([]);
  const [rules, setRules] = useState<SpatialRuleItem[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResultMsg, setAnalysisResultMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial parcel options
  useEffect(() => {
    async function loadParcels() {
      setIsSearchingParcels(true);
      try {
        const res = await fetch("${API_BASE}/properties/parcels?limit=25", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          const items = data.items || data || [];
          setParcelsList(items);

          if (!selectedParcelId && items.length > 0) {
            setSelectedParcelId(items[0].id);
            setActiveParcel(items[0]);
          } else if (selectedParcelId) {
            const match = items.find((p: any) => p.id === selectedParcelId);
            if (match) setActiveParcel(match);
          }
        }
      } catch (err) {
        console.error("Failed to load parcels", err);
      } finally {
        setIsSearchingParcels(false);
      }
    }

    loadParcels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Load rules catalog
  useEffect(() => {
    async function loadRules() {
      try {
        const res = await fetch("${API_BASE}/spatial/rules", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setRules(data);
        }
      } catch (err) {
        console.error("Failed to load rules", err);
      }
    }

    loadRules();
  }, [token]);

  // Load data when selectedParcelId changes
  useEffect(() => {
    if (!selectedParcelId) return;

    // Update active parcel object
    const match = parcelsList.find((p) => p.id === selectedParcelId);
    if (match) setActiveParcel(match);

    async function loadParcelSpatialData() {
      setIsLoading(true);
      setError(null);
      setAnalysisResultMsg(null);

      try {
        const [confRes, relRes, infraRes] = await Promise.all([
          fetch(`${API_BASE}/properties/${selectedParcelId}/conflicts`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          fetch(`${API_BASE}/properties/${selectedParcelId}/relationships`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          fetch(`${API_BASE}/properties/${selectedParcelId}/nearby-infrastructure?radius_meters=200`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
        ]);

        if (confRes.ok) {
          const confData = await confRes.json();
          setConflicts(confData.items || confData || []);
        }

        if (relRes.ok) {
          const relData = await relRes.json();
          setRelationships(relData.items || relData || []);
        }

        if (infraRes.ok) {
          const infraData = await infraRes.json();
          setInfrastructure(infraData.features || []);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load spatial analysis data.");
      } finally {
        setIsLoading(false);
      }
    }

    loadParcelSpatialData();
  }, [selectedParcelId, parcelsList, token]);

  // Run spatial checks on current property
  const handleRunSpatialChecks = async () => {
    if (!selectedParcelId) return;
    setIsAnalyzing(true);
    setAnalysisResultMsg(null);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/properties/${selectedParcelId}/analyze-spatial`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Spatial analysis failed");
      }

      const result = await res.json();
      setAnalysisResultMsg(
        `Analysis completed successfully: ${result.new_conflicts_found} new findings detected (${result.existing_conflicts_updated} updated, ${result.relationships_analyzed} topological relationships evaluated).`
      );

      // Refresh data
      const [confRes, relRes] = await Promise.all([
        fetch(`${API_BASE}/properties/${selectedParcelId}/conflicts`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${API_BASE}/properties/${selectedParcelId}/relationships`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);

      if (confRes.ok) {
        const confData = await confRes.json();
        setConflicts(confData.items || confData || []);
      }
      if (relRes.ok) {
        const relData = await relRes.json();
        setRelationships(relData.items || relData || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to execute spatial checks.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev?.toUpperCase()) {
      case "HIGH":
        return "bg-rose-950/40 text-rose-300 border-rose-800/40";
      case "MEDIUM":
        return "bg-[#B56E48]/20 text-[#C47B50] border-[#B56E48]/40";
      case "LOW":
        return "bg-[#176C68]/20 text-[#23847D] border-[#176C68]/40";
      default:
        return "bg-[#1A201D] text-[#D9D2C5] border-[rgba(244,240,232,0.12)]";
    }
  };

  const getRelationshipBadge = (relType: string) => {
    switch (relType?.toUpperCase()) {
      case "CONTAINS":
        return "bg-[#176C68]/20 text-[#23847D] border-[#176C68]/40";
      case "TOUCHES":
        return "bg-[#176C68]/15 text-[#23847D] border-[#176C68]/30";
      case "OVERLAPS":
        return "bg-rose-950/40 text-rose-300 border-rose-800/40";
      case "WITHIN":
        return "bg-[#B56E48]/20 text-[#C47B50] border-[#B56E48]/40";
      case "NEAR":
        return "bg-[#1A201D] text-[#D9D2C5] border-[rgba(244,240,232,0.15)]";
      default:
        return "bg-[#141816] text-[#6F7772] border-[rgba(244,240,232,0.08)]";
    }
  };

  const filteredParcels = parcelsList.filter(
    (p) =>
      p.ulpin_2d.toLowerCase().includes(parcelSearchTerm.toLowerCase()) ||
      p.survey_number.toLowerCase().includes(parcelSearchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[#0F1210] text-[#F4F0E8] overflow-hidden select-none font-sans">
        <Sidebar />

        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0F1210]">
          {/* Header */}
          <div className="border-b border-[rgba(244,240,232,0.08)] bg-[#0F1210] px-8 py-5 sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#23847D] uppercase tracking-wider font-bold bg-[#141816] px-2 py-0.5 rounded-[4px] border border-[rgba(244,240,232,0.08)]">
                  SPATIAL TOPOLOGY ENGINE
                </span>
                <span className="text-xs text-[#6F7772]">•</span>
                <span className="text-xs font-mono text-[#6F7772]">PostGIS 3.4 Conformal UTM 43N</span>
              </div>
              <h1 className="text-xl font-bold font-mono text-[#F4F0E8] flex items-center gap-2.5 mt-1.5">
                <Compass className="w-5 h-5 text-[#C47B50]" />
                Spatial Intelligence & Discrepancy Analysis
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/conflicts"
                className="px-3.5 py-1.5 rounded-[6px] bg-[#141816] hover:bg-[#1A201D] text-[#D9D2C5] text-xs font-mono flex items-center gap-2 border border-[rgba(244,240,232,0.08)] transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-[#C47B50]" />
                All Discrepancies ({conflicts.length})
              </Link>

              <button
                onClick={handleRunSpatialChecks}
                disabled={isAnalyzing || !selectedParcelId}
                className="px-4 py-1.5 rounded-[6px] bg-[#B56E48] hover:bg-[#C47B50] text-[#F4F0E8] text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Analyzing Geometries...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Run Spatial Checks
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
            {/* Mandatory Governance Notice Banner */}
            <div className="bg-[#141816] border border-[#B56E48]/30 rounded-[8px] p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-[#C47B50] mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-[#C47B50] font-mono">Mandatory Governance Notice: </span>
                <span className="text-[#D9D2C5] leading-relaxed font-sans">
                  Spatial relationships and discrepancies generated by BhuSetu 3D are automated geometric observations
                  derived via PostGIS topology rules. They serve as surveyor assistance indicators and do not represent
                  statutory legal violations or final judicial determinations.
                </span>
              </div>
            </div>

            {/* Analysis feedback messages */}
            {analysisResultMsg && (
              <div className="bg-[#141816] border border-[#176C68]/40 rounded-[8px] p-4 flex items-center gap-3 text-[#23847D] text-xs font-mono">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#23847D]" />
                {analysisResultMsg}
              </div>
            )}

            {error && (
              <div className="bg-[#141816] border border-rose-800/40 rounded-[8px] p-4 flex items-center gap-3 text-rose-300 text-xs font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                {error}
              </div>
            )}

            {/* Property Selector Card */}
            <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[10px] p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-sm font-semibold font-mono text-[#F4F0E8] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#C47B50]" />
                    Target Property Selection
                  </h2>
                  <p className="text-xs text-[#6F7772] mt-0.5 font-sans">
                    Select a parcel to inspect its PostGIS topological relationships and spatial conflict rules.
                  </p>
                </div>

                {/* Property Dropdown / Search */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#6F7772] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter by ULPIN / Survey..."
                      value={parcelSearchTerm}
                      onChange={(e) => setParcelSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-[6px] bg-[#0F1210] border border-[rgba(244,240,232,0.12)] text-xs text-[#F4F0E8] placeholder-[#6F7772] focus:outline-none focus:border-[#B56E48] w-48 font-mono"
                    />
                  </div>

                  <select
                    value={selectedParcelId}
                    onChange={(e) => setSelectedParcelId(e.target.value)}
                    className="px-3 py-1.5 rounded-[6px] bg-[#0F1210] border border-[rgba(244,240,232,0.12)] text-xs text-[#F4F0E8] focus:outline-none focus:border-[#B56E48] max-w-xs font-mono"
                  >
                    {filteredParcels.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#0F1210] text-[#F4F0E8]">
                        {p.ulpin_2d} (Survey: {p.survey_number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Parcel Metadata Bar */}
              {activeParcel && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-[6px] bg-[#0F1210] border border-[rgba(244,240,232,0.08)] text-xs font-mono">
                  <div>
                    <span className="text-[#6F7772] block text-[10px] uppercase">ULPIN 2D:</span>
                    <span className="font-semibold text-[#23847D]">{activeParcel.ulpin_2d}</span>
                  </div>
                  <div>
                    <span className="text-[#6F7772] block text-[10px] uppercase">Survey Number:</span>
                    <span className="text-[#D9D2C5]">{activeParcel.survey_number}</span>
                  </div>
                  <div>
                    <span className="text-[#6F7772] block text-[10px] uppercase">Land Use:</span>
                    <span className="text-[#D9D2C5]">{activeParcel.land_use || "Standard"}</span>
                  </div>
                  <div>
                    <span className="text-[#6F7772] block text-[10px] uppercase">Area Comparison:</span>
                    <span className="text-[#D9D2C5]">
                      {activeParcel.computed_area_sqm?.toFixed(1) || 0} m² (Rec: {activeParcel.recorded_area_sqm || 0} m²)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[rgba(244,240,232,0.08)] gap-6 text-xs font-mono">
              <button
                onClick={() => setActiveTab("findings")}
                className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === "findings"
                    ? "border-[#C47B50] text-[#F4F0E8] font-bold"
                    : "border-transparent text-[#6F7772] hover:text-[#D9D2C5]"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#C47B50]" />
                Discrepancy Findings
                <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono bg-[#1A201D] text-[#D9D2C5] border border-[rgba(244,240,232,0.12)]">
                  {conflicts.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("relationships")}
                className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === "relationships"
                    ? "border-[#23847D] text-[#F4F0E8] font-bold"
                    : "border-transparent text-[#6F7772] hover:text-[#D9D2C5]"
                }`}
              >
                <GitBranch className="w-3.5 h-3.5 text-[#23847D]" />
                Topological Relationships
                <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono bg-[#1A201D] text-[#D9D2C5] border border-[rgba(244,240,232,0.12)]">
                  {relationships.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("infrastructure")}
                className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === "infrastructure"
                    ? "border-[#C47B50] text-[#F4F0E8] font-bold"
                    : "border-transparent text-[#6F7772] hover:text-[#D9D2C5]"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-[#C47B50]" />
                Infrastructure Proximity
                <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono bg-[#1A201D] text-[#D9D2C5] border border-[rgba(244,240,232,0.12)]">
                  {infrastructure.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("rules")}
                className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === "rules"
                    ? "border-[#23847D] text-[#F4F0E8] font-bold"
                    : "border-transparent text-[#6F7772] hover:text-[#D9D2C5]"
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-[#23847D]" />
                Spatial Rules Engine ({rules.length})
              </button>
            </div>

            {/* TAB 1: Discrepancy Findings */}
            {activeTab === "findings" && (
              <div className="space-y-4">
                {isLoading ? (
                  <div className="p-12 text-center text-[#6F7772] font-mono text-xs">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C47B50]" />
                    Loading spatial discrepancy findings...
                  </div>
                ) : conflicts.length === 0 ? (
                  <div className="p-12 text-center rounded-[8px] bg-[#141816] border border-[rgba(244,240,232,0.08)]">
                    <ShieldCheck className="w-12 h-12 text-[#23847D] mx-auto mb-3 opacity-80" />
                    <h3 className="text-sm font-semibold font-mono text-[#F4F0E8]">No Discrepancies Recorded</h3>
                    <p className="text-xs text-[#6F7772] max-w-md mx-auto mt-1 font-sans">
                      No boundary encroachments, setback non-compliances, or parcel overlaps have been flagged for this
                      property. Click &quot;Run Spatial Checks&quot; above to execute real-time PostGIS topological evaluations.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {conflicts.map((item) => (
                      <div
                        key={item.id}
                        className="bg-[#141816] border border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.16)] rounded-[8px] p-5 transition-all"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs px-2 py-0.5 rounded-[4px] bg-[#1A201D] text-[#23847D] border border-[#176C68]/40">
                              {item.rule_id || "RULE-SPATIAL"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-semibold uppercase tracking-wider border ${getSeverityBadge(
                                item.severity
                              )}`}
                            >
                              {item.severity}
                            </span>
                            <span className="text-sm font-bold font-mono text-[#F4F0E8]">{item.rule_name}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-xs text-[#6F7772] font-mono">
                              Confidence:{" "}
                              <span className="font-bold text-[#F4F0E8]">
                                {Math.round(item.confidence_score * 100)}%
                              </span>
                            </div>
                            <Link
                              href={`/conflicts/${item.id}`}
                              className="px-2.5 py-1 rounded-[4px] bg-[#1A201D] hover:bg-[#252E2A] text-[#C47B50] text-xs font-mono font-medium flex items-center gap-1 border border-[rgba(244,240,232,0.12)] transition-colors"
                            >
                              Inspect Details <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>

                        <p className="text-xs text-[#D9D2C5] leading-relaxed font-sans mb-3">{item.explanation}</p>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-3 border-t border-[rgba(244,240,232,0.08)] text-[#6F7772]">
                          {item.measured_value !== undefined && item.measured_value !== null && (
                            <div>
                              Measured:{" "}
                              <span className="text-[#23847D] font-bold">
                                {Number(item.measured_value).toFixed(2)} {item.measured_unit}
                              </span>
                            </div>
                          )}
                          {item.threshold_value !== undefined && item.threshold_value !== null && (
                            <div>
                              Threshold:{" "}
                              <span className="text-[#D9D2C5]">
                                {Number(item.threshold_value).toFixed(2)} {item.measured_unit}
                              </span>
                            </div>
                          )}
                          {item.deviation_value !== undefined && item.deviation_value !== null && (
                            <div>
                              Deviation:{" "}
                              <span className="text-[#C47B50] font-bold">
                                {Number(item.deviation_value).toFixed(2)} {item.measured_unit}
                              </span>
                            </div>
                          )}
                          {item.related_entity_label && (
                            <div>
                              Related Entity: <span className="text-[#D9D2C5]">{item.related_entity_label}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Topological Relationships */}
            {activeTab === "relationships" && (
              <div className="space-y-4">
                <div className="text-xs text-[#6F7772] font-mono">
                  PostGIS Nine-Intersection Model (DE-9IM) topological relations for this parcel against buildings and
                  adjacent parcels.
                </div>

                {isLoading ? (
                  <div className="p-12 text-center text-[#6F7772] font-mono text-xs">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#23847D]" />
                    Loading topological relationships...
                  </div>
                ) : relationships.length === 0 ? (
                  <div className="p-12 text-center rounded-[8px] bg-[#141816] border border-[rgba(244,240,232,0.08)]">
                    <Activity className="w-12 h-12 text-[#6F7772] mx-auto mb-3" />
                    <h3 className="text-sm font-semibold font-mono text-[#F4F0E8]">No Topological Relations Cached</h3>
                    <p className="text-xs text-[#6F7772] max-w-md mx-auto mt-1 font-sans">
                      Execute &quot;Run Spatial Checks&quot; above to evaluate ST_Contains, ST_Touches, and ST_Overlaps for this
                      property.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {relationships.map((rel) => (
                      <div
                        key={rel.id}
                        className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] p-4 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider border ${getRelationshipBadge(
                              rel.relationship_type
                            )}`}
                          >
                            {rel.relationship_type}
                          </span>
                          <span className="text-[10px] font-mono text-[#6F7772]">
                            Confidence: {Math.round(rel.confidence_score * 100)}%
                          </span>
                        </div>

                        <div className="text-xs text-[#D9D2C5] font-mono">
                          Target:{" "}
                          <span className="font-semibold text-[#23847D]">
                            {rel.target_label || `${rel.target_entity_type} (${rel.target_entity_id.slice(0, 8)}...)`}
                          </span>
                        </div>

                        {rel.notes && <p className="text-xs text-[#6F7772] leading-normal font-sans">{rel.notes}</p>}

                        <div className="flex flex-wrap gap-3 text-[11px] font-mono text-[#6F7772] pt-2 border-t border-[rgba(244,240,232,0.08)]">
                          {rel.distance_meters !== undefined && rel.distance_meters !== null && (
                            <div>
                              Distance:{" "}
                              <span className="text-[#D9D2C5]">{Number(rel.distance_meters).toFixed(2)} m</span>
                            </div>
                          )}
                          {rel.intersection_area_sqm !== undefined && rel.intersection_area_sqm !== null && (
                            <div>
                              Overlap Area:{" "}
                              <span className="text-[#C47B50]">
                                {Number(rel.intersection_area_sqm).toFixed(2)} m²
                              </span>
                            </div>
                          )}
                          {rel.shared_boundary_length_m !== undefined && rel.shared_boundary_length_m !== null && (
                            <div>
                              Shared Boundary:{" "}
                              <span className="text-[#23847D]">
                                {Number(rel.shared_boundary_length_m).toFixed(2)} m
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Nearby Infrastructure */}
            {activeTab === "infrastructure" && (
              <div className="space-y-4">
                <div className="text-xs text-[#6F7772] font-mono">
                  Critical infrastructure proximity and corridor clearance checks within 200m buffer zone (conformal UTM
                  Zone 43N metric projection).
                </div>

                {isLoading ? (
                  <div className="p-12 text-center text-[#6F7772] font-mono text-xs">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C47B50]" />
                    Scanning surrounding infrastructure...
                  </div>
                ) : infrastructure.length === 0 ? (
                  <div className="p-12 text-center rounded-[8px] bg-[#141816] border border-[rgba(244,240,232,0.08)]">
                    <Zap className="w-12 h-12 text-[#6F7772] mx-auto mb-3" />
                    <h3 className="text-sm font-semibold font-mono text-[#F4F0E8]">No Infrastructure Within Radius</h3>
                    <p className="text-xs text-[#6F7772] max-w-md mx-auto mt-1 font-sans">
                      No road network, power grid, pipeline, or railway corridors are detected within 200 meters of this
                      parcel boundary.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {infrastructure.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-[8px] border flex flex-wrap items-center justify-between gap-4 transition-colors ${
                          item.clearance_warning
                            ? "bg-[#141816] border-rose-800/40"
                            : "bg-[#141816] border-[rgba(244,240,232,0.08)]"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs font-mono text-[#F4F0E8]">{item.name}</span>
                            <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono uppercase bg-[#1A201D] text-[#23847D] border border-[#176C68]/40">
                              {item.type}
                            </span>
                            {item.clearance_warning && (
                              <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-950/40 text-rose-300 border border-rose-800/50">
                                Clearance Warning
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#6F7772] font-mono">
                            Clearance Buffer Zone: <span className="text-[#D9D2C5]">{item.buffer_zone_meters}m</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] font-mono text-[#6F7772] mb-0.5">Calculated Distance:</div>
                          <div
                            className={`text-base font-mono font-bold ${
                              item.clearance_warning ? "text-rose-400" : "text-[#23847D]"
                            }`}
                          >
                            {item.distance_meters.toFixed(2)} m
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Active Spatial Rules Engine */}
            {activeTab === "rules" && (
              <div className="space-y-4">
                <div className="text-xs text-[#6F7772] font-mono">
                  Deterministic PostGIS spatial validation rules enforcing geometric integrity and setback compliance.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-2 py-0.5 rounded-[4px] bg-[#1A201D] text-[#23847D] border border-[#176C68]/40">
                            {rule.rule_code}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-semibold uppercase tracking-wider border ${getSeverityBadge(
                              rule.severity
                            )}`}
                          >
                            {rule.severity}
                          </span>
                        </div>
                        <span className="flex items-center gap-1.5 text-xs text-[#23847D] font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#176C68]" />
                          Active
                        </span>
                      </div>

                      <h3 className="text-sm font-bold font-mono text-[#F4F0E8]">{rule.name}</h3>
                      <p className="text-xs text-[#D9D2C5] leading-relaxed font-sans">{rule.description}</p>

                      {rule.parameters && Object.keys(rule.parameters).length > 0 && (
                        <div className="p-3 rounded-[6px] bg-[#0F1210] border border-[rgba(244,240,232,0.08)] text-xs font-mono space-y-1">
                          <div className="text-[10px] text-[#6F7772] uppercase tracking-wider font-semibold">
                            Default Thresholds & Tolerance:
                          </div>
                          {Object.entries(rule.parameters).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-[#6F7772] text-[11px]">
                              <span>{k}:</span>
                              <span className="text-[#23847D] font-semibold">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function SpatialAnalysisPage() {
  return (
    <Suspense
      fallback={
        <SpatialLoadingRoller
          fullScreen={true}
          label="Loading Spatial Analysis Workspace"
          subtitle="Calculating 3D setback buffers, infrastructure proximity & corridor analytics..."
        />
      }
    >
      <SpatialAnalysisContent />
    </Suspense>
  );
}
