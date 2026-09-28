"use client";

/**
 * BhuSetu 3D Evidence Vault & Provenance Explorer
 * Evidence-Backed 3D Property Intelligence Platform
 */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { SpatialLoadingRoller } from "@/components/common/SpatialLoadingRoller";
import { useAuth } from "@/hooks/useAuth";
import {
  FileCheck2,
  Search,
  Filter,
  Layers,
  Building2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  Database,
  ExternalLink,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  X,
  Compass,
  GitBranch,
  RefreshCw,
  Sliders,
} from "lucide-react";

interface EvidenceItem {
  id: string;
  entity_type: string;
  entity_id: string;
  dataset_id?: string;
  dataset_name?: string;
  dataset_type?: string;
  source_id?: string;
  source_name?: string;
  source_type: string;
  source_classification: string;
  confidence_score: number;
  status: string;
  processing_method: string;
  model_version?: string;
  notes?: string;
  supporting_factors: string[];
  limiting_factors: string[];
  evidence_metadata: Record<string, any>;
  created_at: string;
}

interface ProvenanceNode {
  id: string;
  target_entity_type: string;
  target_entity_id: string;
  source_entity_type?: string;
  source_entity_id?: string;
  operation_type: string;
  operation_name: string;
  operation_version?: string;
  performed_by?: string;
  execution_timestamp: string;
  input_reference: Record<string, any>;
  output_reference: Record<string, any>;
  metadata_json: Record<string, any>;
}

interface ConfidenceBreakdown {
  property_id: string;
  composite_confidence: number;
  verification_status: string;
  is_verified: boolean;
  component_scores: Record<string, number>;
  supporting_factors: string[];
  limiting_factors: string[];
  evidence_coverage_percentage: number;
  classification_counts: Record<string, number>;
}

export default function EvidenceVaultPage() {
  const { token } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<"vault" | "lineage">("vault");
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassification, setSelectedClassification] = useState<string>("ALL");
  const [selectedEntityType, setSelectedEntityType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [minConfidence, setMinConfidence] = useState<number>(0.0);

  // Detail Modal
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  // Lineage State
  const [lookupPropertyId, setLookupPropertyId] = useState("");
  const [lineageNodes, setLineageNodes] = useState<ProvenanceNode[]>([]);
  const [lineageSummary, setLineageSummary] = useState<string>("");
  const [confidenceData, setConfidenceData] = useState<ConfidenceBreakdown | null>(null);
  const [isLineageLoading, setIsLineageLoading] = useState(false);
  const [lineageError, setLineageError] = useState<string | null>(null);

  // Fetch Evidence Vault items
  const fetchEvidence = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedClassification !== "ALL") params.append("source_classification", selectedClassification);
      if (selectedEntityType !== "ALL") params.append("entity_type", selectedEntityType);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (minConfidence > 0) params.append("min_confidence", minConfidence.toString());

      const res = await fetch(`http://localhost:8000/api/v1/evidence?${params.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load evidence vault (HTTP ${res.status})`);
      }

      const data = await res.json();
      setEvidenceList(data.items || []);
      setTotalItems(data.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load evidence.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedClassification, selectedEntityType, selectedStatus, minConfidence]);

  // Lookup Property Lineage
  const handleLookupLineage = async (propertyId: string) => {
    if (!propertyId.trim()) return;
    setIsLineageLoading(true);
    setLineageError(null);
    try {
      const [provRes, confRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/properties/${propertyId.trim()}/provenance`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`http://localhost:8000/api/v1/properties/${propertyId.trim()}/confidence`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);

      if (!provRes.ok) {
        throw new Error(`Property lineage not found (HTTP ${provRes.status})`);
      }

      const provData = await provRes.json();
      setLineageNodes(provData.chain || []);
      setLineageSummary(provData.lineage_summary || "");

      if (confRes.ok) {
        const confJson = await confRes.json();
        setConfidenceData(confJson);
      }
    } catch (err: any) {
      setLineageError(err.message || "Failed to fetch property lineage.");
      setLineageNodes([]);
      setConfidenceData(null);
    } finally {
      setIsLineageLoading(false);
    }
  };

  // Helper styles for source classification
  const getClassificationBadge = (cls: string) => {
    switch (cls) {
      case "OBSERVED":
        return "bg-[#176C68]/20 text-[#23847D] border-[#176C68]/40";
      case "AI_ASSISTED":
        return "bg-[#B56E48]/20 text-[#C47B50] border-[#B56E48]/40";
      case "DERIVED":
        return "bg-[#1A201D] text-[#D9D2C5] border-[rgba(244,240,232,0.15)]";
      case "INFERRED":
        return "bg-[#B56E48]/15 text-[#C47B50] border-[#B56E48]/30";
      case "VERIFIED":
        return "bg-[#176C68]/25 text-[#23847D] border-[#176C68]/50";
      default:
        return "bg-[#141816] text-[#6F7772] border-[rgba(244,240,232,0.08)]";
    }
  };

  // Filtered by local search query
  const filteredItems = evidenceList.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.entity_type.toLowerCase().includes(q) ||
      item.entity_id.toLowerCase().includes(q) ||
      (item.dataset_name && item.dataset_name.toLowerCase().includes(q)) ||
      (item.processing_method && item.processing_method.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  // Calculate summary metrics
  const avgConfidence =
    evidenceList.length > 0
      ? (evidenceList.reduce((acc, cur) => acc + cur.confidence_score, 0) / evidenceList.length) * 100
      : 0;

  const observedCount = evidenceList.filter((e) => e.source_classification === "OBSERVED").length;
  const aiCount = evidenceList.filter((e) => e.source_classification === "AI_ASSISTED").length;
  const derivedCount = evidenceList.filter((e) => ["DERIVED", "INFERRED"].includes(e.source_classification)).length;

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[#0F1210] text-[#F4F0E8] select-none font-sans overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-y-auto bg-[#0F1210]">
          {/* Header */}
          <div className="border-b border-[rgba(244,240,232,0.08)] bg-[#0F1210] px-8 py-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#23847D] uppercase tracking-wider font-bold bg-[#141816] px-2 py-0.5 rounded-[4px] border border-[rgba(244,240,232,0.08)] w-fit mb-1.5">
                <FileCheck2 className="w-3 h-3 text-[#C47B50]" />
                <span>CRYPTOGRAPHIC EVIDENCE VAULT & PROVENANCE</span>
              </div>
              <h1 className="text-xl font-bold font-mono text-[#F4F0E8] flex items-center gap-2">
                Evidence Vault & Lineage Graph
              </h1>
              <p className="text-xs text-[#6F7772] mt-0.5 font-sans">
                Multi-sensor provenance tracing across Parcel → Building → Floor → Unit → Infrastructure.
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-[#141816] border border-[rgba(244,240,232,0.12)] p-1 rounded-[6px]">
              <button
                onClick={() => setActiveTab("vault")}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === "vault"
                    ? "bg-[#B56E48] text-[#F4F0E8] font-bold shadow-sm"
                    : "text-[#6F7772] hover:text-[#D9D2C5]"
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                Evidence Repository ({totalItems})
              </button>
              <button
                onClick={() => setActiveTab("lineage")}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === "lineage"
                    ? "bg-[#B56E48] text-[#F4F0E8] font-bold shadow-sm"
                    : "text-[#6F7772] hover:text-[#D9D2C5]"
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                Lineage Graph Inspector
              </button>
            </div>
          </div>

          {/* Statutory Verification Rule Notice */}
          <div className="mx-8 mt-6 p-4 bg-[#141816] border border-[#B56E48]/30 rounded-[8px] flex items-start gap-3">
            <Info className="w-5 h-5 text-[#C47B50] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[#D9D2C5] leading-relaxed font-sans">
              <span className="font-semibold font-mono text-[#C47B50]">Mandatory Governance Rule (Confidence ≠ Verification): </span>
              High confidence scores reflect sensor ground sampling distance (GSD), algorithmic precision, and mathematical
              consistency. However, evidence remains legally <span className="text-[#C47B50] font-mono font-bold">UNVERIFIED</span> until
              statutory officer sign-off under the statutory Maker-Checker review queue.
            </div>
          </div>

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-8 mt-6">
            <div className="p-4 bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px]">
              <span className="text-[10px] font-mono text-[#6F7772] uppercase tracking-wider block mb-1">
                EVIDENCE RECORDS
              </span>
              <div className="text-2xl font-bold font-mono text-[#F4F0E8]">{totalItems}</div>
              <div className="text-[10px] text-[#6F7772] mt-1 font-mono">Cataloged across all entities</div>
            </div>

            <div className="p-4 bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px]">
              <span className="text-[10px] font-mono text-[#6F7772] uppercase tracking-wider block mb-1">
                MEAN CONFIDENCE
              </span>
              <div className="text-2xl font-bold font-mono text-[#23847D]">
                {avgConfidence.toFixed(1)}%
              </div>
              <div className="text-[10px] text-[#6F7772] mt-1 font-mono">Normalized sensor/model rating</div>
            </div>

            <div className="p-4 bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px]">
              <span className="text-[10px] font-mono text-[#6F7772] uppercase tracking-wider block mb-1">
                PHYSICAL OBSERVED
              </span>
              <div className="text-2xl font-bold font-mono text-[#23847D]">{observedCount}</div>
              <div className="text-[10px] text-[#6F7772] mt-1 font-mono">RTK-GNSS & high-res drone captures</div>
            </div>

            <div className="p-4 bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px]">
              <span className="text-[10px] font-mono text-[#6F7772] uppercase tracking-wider block mb-1">
                AI DERIVED
              </span>
              <div className="text-2xl font-bold font-mono text-[#C47B50]">{aiCount}</div>
              <div className="text-[10px] text-[#6F7772] mt-1 font-mono">YOLO segmentation & height models</div>
            </div>
          </div>

          {/* TAB 1: EVIDENCE VAULT */}
          {activeTab === "vault" && (
            <div className="p-8 space-y-4">
              {/* Filter Bar */}
              <div className="p-4 bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6F7772]" />
                    <input
                      type="text"
                      placeholder="Search by entity UUID, dataset name, notes, or method..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#0F1210] border border-[rgba(244,240,232,0.12)] pl-9 pr-3 py-1.5 rounded-[6px] text-xs text-[#F4F0E8] placeholder-[#6F7772] focus:outline-none focus:border-[#B56E48] font-mono"
                    />
                  </div>
                  <button
                    onClick={fetchEvidence}
                    className="px-3 py-1.5 bg-[#1A201D] hover:bg-[#252E2A] text-[#D9D2C5] rounded-[6px] text-xs font-mono flex items-center gap-1.5 border border-[rgba(244,240,232,0.12)] transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-mono text-[#6F7772] uppercase block mb-1">
                      Classification
                    </label>
                    <select
                      value={selectedClassification}
                      onChange={(e) => setSelectedClassification(e.target.value)}
                      className="w-full bg-[#0F1210] border border-[rgba(244,240,232,0.12)] px-2.5 py-1.5 rounded-[6px] text-[#F4F0E8] text-xs focus:outline-none focus:border-[#B56E48] font-mono"
                    >
                      <option value="ALL">All Classifications</option>
                      <option value="OBSERVED">OBSERVED (Physical Ground Truth)</option>
                      <option value="AI_ASSISTED">AI_ASSISTED (ML Derived)</option>
                      <option value="DERIVED">DERIVED (Geometric Calc)</option>
                      <option value="INFERRED">INFERRED (Heuristic Assumption)</option>
                      <option value="VERIFIED">VERIFIED (Statutory Signoff)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-[#6F7772] uppercase block mb-1">
                      Entity Scope
                    </label>
                    <select
                      value={selectedEntityType}
                      onChange={(e) => setSelectedEntityType(e.target.value)}
                      className="w-full bg-[#0F1210] border border-[rgba(244,240,232,0.12)] px-2.5 py-1.5 rounded-[6px] text-[#F4F0E8] text-xs focus:outline-none focus:border-[#B56E48] font-mono"
                    >
                      <option value="ALL">All Entities</option>
                      <option value="PARCEL">PARCEL (Land Boundaries)</option>
                      <option value="BUILDING">BUILDING (3D Physical Structures)</option>
                      <option value="FLOOR">FLOOR (Vertical Slices)</option>
                      <option value="UNIT">UNIT (3D Volume Properties)</option>
                      <option value="INFRASTRUCTURE">INFRASTRUCTURE (Utilities)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-[#6F7772] uppercase block mb-1">
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full bg-[#0F1210] border border-[rgba(244,240,232,0.12)] px-2.5 py-1.5 rounded-[6px] text-[#F4F0E8] text-xs focus:outline-none focus:border-[#B56E48] font-mono"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="PARTIAL">PARTIAL</option>
                      <option value="UNAVAILABLE">UNAVAILABLE</option>
                      <option value="INVALID">INVALID</option>
                      <option value="SUPERSEDED">SUPERSEDED</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-[#6F7772] uppercase mb-1">
                      <span>Min Confidence</span>
                      <span className="text-[#23847D]">{(minConfidence * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={minConfidence}
                      onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                      className="w-full accent-[#B56E48] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Evidence Records Table */}
              <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] overflow-hidden">
                {isLoading ? (
                  <div className="py-14">
                    <SpatialLoadingRoller
                      size="md"
                      label="QUERYING EVIDENCE LINEAGE"
                      subtitle="Retrieving UAV photogrammetry, LiDAR cloud & satellite sensor proof..."
                      showCoordinates={false}
                    />
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-12 text-center text-[#6F7772] space-y-2">
                    <FileCheck2 className="w-8 h-8 mx-auto text-[#6F7772]" />
                    <p className="text-xs">No evidence records matched your search filters.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0F1210] text-[10px] font-mono text-[#6F7772] uppercase border-b border-[rgba(244,240,232,0.08)]">
                      <tr>
                        <th className="py-2.5 px-4">Entity</th>
                        <th className="py-2.5 px-4">Classification</th>
                        <th className="py-2.5 px-4">Confidence</th>
                        <th className="py-2.5 px-4">Source / Dataset</th>
                        <th className="py-2.5 px-4">Method</th>
                        <th className="py-2.5 px-4">Factors</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(244,240,232,0.05)]">
                      {filteredItems.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-[#1A201D]/70 transition-colors group cursor-pointer"
                          onClick={() => setSelectedEvidence(item)}
                        >
                          <td className="py-3 px-4">
                            <span className="font-mono text-[#23847D] font-semibold">{item.entity_type}</span>
                            <span className="block font-mono text-[10px] text-[#6F7772] truncate max-w-[140px]">
                              {item.entity_id}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono border font-semibold ${getClassificationBadge(
                                item.source_classification
                              )}`}
                            >
                              {item.source_classification}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#F4F0E8]">
                                {(item.confidence_score * 100).toFixed(1)}%
                              </span>
                              <div className="w-14 bg-[#0F1210] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    item.confidence_score >= 0.85
                                      ? "bg-emerald-400"
                                      : item.confidence_score >= 0.70
                                      ? "bg-amber-400"
                                      : "bg-rose-400"
                                  }`}
                                  style={{ width: `${item.confidence_score * 100}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 max-w-[200px]">
                            <span className="font-medium text-[#F4F0E8] truncate block">
                              {item.dataset_name || item.source_type}
                            </span>
                            {item.source_name && (
                              <span className="text-[10px] text-[#6F7772] truncate block">{item.source_name}</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-[#6F7772] max-w-[180px] truncate">
                            {item.processing_method}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-[11px] font-mono">
                              <span className="text-emerald-400">+{item.supporting_factors.length}</span>
                              <span className="text-[#6F7772]">/</span>
                              <span className="text-amber-400">-{item.limiting_factors.length}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                                item.status === "AVAILABLE"
                                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/20"
                                  : "bg-amber-950/60 text-amber-400 border-amber-500/20"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvidence(item);
                              }}
                              className="text-[#C47B50] hover:text-[#B56E48] font-mono text-[11px] flex items-center gap-1 ml-auto"
                            >
                              Inspect <ChevronRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LINEAGE GRAPH INSPECTOR */}
          {activeTab === "lineage" && (
            <div className="p-8 space-y-6">
              {/* Lookup Card */}
              <div className="p-5 bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#F4F0E8] flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#C47B50]" />
                    Property Provenance & Lineage DAG Resolver
                  </span>
                  <span className="text-[10px] font-mono text-[#6F7772]">
                    Input a Property Parcel UUID to reconstruct its algorithmic derivation
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Property UUID (e.g. 7c9e6679-7425-40de-944b-e07fc1f90ae7)..."
                    value={lookupPropertyId}
                    onChange={(e) => setLookupPropertyId(e.target.value)}
                    className="flex-1 bg-[#0F1210] border border-[rgba(244,240,232,0.12)] px-3 py-2 rounded-[6px] text-xs text-[#F4F0E8] font-mono placeholder-[#6F7772] focus:outline-none focus:border-[#B56E48]"
                  />
                  <button
                    onClick={() => handleLookupLineage(lookupPropertyId)}
                    disabled={isLineageLoading || !lookupPropertyId.trim()}
                    className="px-4 py-2 bg-[#B56E48] hover:bg-[#C47B50] text-[#F4F0E8] font-mono font-bold rounded-[6px] text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isLineageLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitBranch className="w-3.5 h-3.5" />}
                    Trace Lineage
                  </button>
                </div>

                {/* Pre-fill suggestion button */}
                <div className="flex items-center gap-2 text-[11px] text-[#6F7772]">
                  <span>Quick sample:</span>
                  <button
                    onClick={() => {
                      // Grab first parcel from evidence if present
                      const firstParcel = evidenceList.find((e) => e.entity_type === "PARCEL");
                      if (firstParcel) {
                        setLookupPropertyId(firstParcel.entity_id);
                        handleLookupLineage(firstParcel.entity_id);
                      }
                    }}
                    className="font-mono text-[#C47B50] hover:underline"
                  >
                    Select First Registered Parcel
                  </button>
                </div>
              </div>

              {lineageError && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {lineageError}
                </div>
              )}

              {/* Confidence Breakdown Card */}
              {confidenceData && (
                <div className="p-5 bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] space-y-4">
                  <div className="flex items-center justify-between border-b border-[rgba(244,240,232,0.08)] pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#6F7772]">COMPOSITE CONFIDENCE</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-2xl font-bold font-mono text-[#23847D]">
                          {(confidenceData.composite_confidence * 100).toFixed(1)}%
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${
                            confidenceData.is_verified
                              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                              : "bg-amber-950/80 text-[#F4F0E8] border-amber-500/40"
                          }`}
                        >
                          Status: {confidenceData.verification_status}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase text-[#6F7772]">EVIDENCE COVERAGE</span>
                      <div className="text-lg font-bold font-mono text-[#F4F0E8]">
                        {confidenceData.evidence_coverage_percentage}%
                      </div>
                    </div>
                  </div>

                  {/* Component Breakdown Bars */}
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    {Object.entries(confidenceData.component_scores).map(([compKey, compScore]) => (
                      <div key={compKey} className="p-2.5 bg-[#0F1210] border border-[rgba(244,240,232,0.08)] rounded">
                        <span className="text-[10px] font-mono text-[#6F7772] uppercase truncate block">
                          {compKey.replace(/_/g, " ")}
                        </span>
                        <div className="text-base font-bold font-mono text-[#F4F0E8] mt-1">
                          {(compScore * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Supporting vs Limiting Factors */}
                  <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Supporting Factors ({confidenceData.supporting_factors.length})
                      </span>
                      <div className="space-y-1">
                        {confidenceData.supporting_factors.map((f, i) => (
                          <div key={i} className="text-[#D9D2C5] bg-[#0F1210]/60 p-2 rounded border border-emerald-500/20">
                            • {f}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Limiting Factors ({confidenceData.limiting_factors.length})
                      </span>
                      <div className="space-y-1">
                        {confidenceData.limiting_factors.map((f, i) => (
                          <div key={i} className="text-[#D9D2C5] bg-[#0F1210]/60 p-2 rounded border border-amber-500/20">
                            • {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lineage Graph Flow */}
              {lineageNodes.length > 0 && (
                <div className="p-5 bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#F4F0E8]">
                      Sequential Lineage DAG ({lineageNodes.length} Operations)
                    </span>
                    <span className="text-[10px] font-mono text-[#23847D]">{lineageSummary}</span>
                  </div>

                  <div className="relative border-l-2 border-[#176C68]/40 ml-4 space-y-6 pl-6 py-2">
                    {lineageNodes.map((node, idx) => (
                      <div key={node.id} className="relative group">
                        {/* Dot on timeline */}
                        <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#176C68] border-2 border-canvas" />

                        <div className="p-4 bg-[#0F1210] border border-[rgba(244,240,232,0.08)] rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#176C68]/20 text-[#23847D] border border-[#176C68]/40 font-bold uppercase">
                                {node.operation_type}
                              </span>
                              <span className="text-xs font-semibold text-[#F4F0E8]">{node.operation_name}</span>
                            </div>
                            <span className="text-[10px] font-mono text-[#6F7772]">
                              {new Date(node.execution_timestamp).toLocaleString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-[#6F7772]">
                            <div>
                              <span className="text-[#6F7772] block">Agent / Performed By:</span>
                              <span className="text-[#F4F0E8]">{node.performed_by || "System Engine"}</span>
                            </div>
                            <div>
                              <span className="text-[#6F7772] block">Version:</span>
                              <span className="text-[#23847D]">{node.operation_version || "N/A"}</span>
                            </div>
                          </div>

                          {/* Inputs & Outputs */}
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[rgba(244,240,232,0.08)]/50 text-[11px]">
                            <div>
                              <span className="text-[10px] font-mono text-[#6F7772] uppercase block mb-1">
                                Input Reference:
                              </span>
                              <pre className="bg-[#0F1210] p-2 rounded text-[10px] font-mono text-[#D9D2C5] overflow-x-auto">
                                {JSON.stringify(node.input_reference, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-[#6F7772] uppercase block mb-1">
                                Output Reference:
                              </span>
                              <pre className="bg-[#0F1210] p-2 rounded text-[10px] font-mono text-[#D9D2C5] overflow-x-auto">
                                {JSON.stringify(node.output_reference, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DETAIL MODAL / DRAWER */}
          {selectedEvidence && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] w-full max-w-2xl rounded-[10px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="p-4 border-b border-[rgba(244,240,232,0.08)] bg-[#0F1210] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-[#C47B50]" />
                    <div>
                      <h3 className="text-sm font-bold text-[#F4F0E8]">
                        Evidence Record Detail
                      </h3>
                      <span className="text-[10px] font-mono text-[#6F7772]">
                        ID: {selectedEvidence.id}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEvidence(null)}
                    className="p-1 text-[#6F7772] hover:text-[#F4F0E8] rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-4 text-xs">
                  {/* Top Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-[#0F1210] border border-[rgba(244,240,232,0.08)] rounded-lg">
                      <span className="text-[10px] font-mono uppercase text-[#6F7772] block">ENTITY</span>
                      <div className="text-sm font-bold font-mono text-[#23847D] mt-1">
                        {selectedEvidence.entity_type}
                      </div>
                      <span className="text-[10px] font-mono text-[#6F7772] truncate block mt-0.5">
                        {selectedEvidence.entity_id}
                      </span>
                    </div>

                    <div className="p-3 bg-[#0F1210] border border-[rgba(244,240,232,0.08)] rounded-lg">
                      <span className="text-[10px] font-mono uppercase text-[#6F7772] block">CLASSIFICATION</span>
                      <div className="mt-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border font-semibold ${getClassificationBadge(
                            selectedEvidence.source_classification
                          )}`}
                        >
                          {selectedEvidence.source_classification}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#6F7772] block mt-1">
                        {selectedEvidence.source_classification === "OBSERVED"
                          ? "Physical Ground Truth"
                          : selectedEvidence.source_classification === "AI_ASSISTED"
                          ? "ML Derivation"
                          : "Deterministic Model"}
                      </span>
                    </div>

                    <div className="p-3 bg-[#0F1210] border border-[rgba(244,240,232,0.08)] rounded-lg">
                      <span className="text-[10px] font-mono uppercase text-[#6F7772] block">CONFIDENCE SCORE</span>
                      <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
                        {(selectedEvidence.confidence_score * 100).toFixed(1)}%
                      </div>
                      <span className="text-[10px] text-[#6F7772] block mt-0.5">
                        Status: {selectedEvidence.status}
                      </span>
                    </div>
                  </div>

                  {/* Dataset & Sensor Source */}
                  <div className="p-3 bg-[#0F1210]/60 border border-[rgba(244,240,232,0.08)] rounded-lg space-y-2">
                    <span className="text-[10px] font-mono text-[#23847D] uppercase font-semibold block">
                      Originating Spatial Dataset
                    </span>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                      <div>
                        <span className="text-[#6F7772] block">Dataset Name:</span>
                        <span className="text-[#F4F0E8]">{selectedEvidence.dataset_name || "Direct Survey Record"}</span>
                      </div>
                      <div>
                        <span className="text-[#6F7772] block">Source Organization:</span>
                        <span className="text-[#F4F0E8]">{selectedEvidence.source_name || "State Land Directorate"}</span>
                      </div>
                      <div>
                        <span className="text-[#6F7772] block">Processing Method:</span>
                        <span className="text-[#F4F0E8]">{selectedEvidence.processing_method}</span>
                      </div>
                      <div>
                        <span className="text-[#6F7772] block">Model Version:</span>
                        <span className="text-[#F4F0E8]">{selectedEvidence.model_version || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Factors */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
                        Supporting Factors ({selectedEvidence.supporting_factors.length})
                      </span>
                      {selectedEvidence.supporting_factors.length > 0 ? (
                        selectedEvidence.supporting_factors.map((f, i) => (
                          <div key={i} className="p-2 bg-[#0F1210] border border-emerald-500/20 rounded text-[#D9D2C5]">
                            • {f}
                          </div>
                        ))
                      ) : (
                        <div className="text-[#6F7772] italic p-2 bg-[#0F1210] rounded">No factors registered</div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">
                        Limiting Factors ({selectedEvidence.limiting_factors.length})
                      </span>
                      {selectedEvidence.limiting_factors.length > 0 ? (
                        selectedEvidence.limiting_factors.map((f, i) => (
                          <div key={i} className="p-2 bg-[#0F1210] border border-amber-500/20 rounded text-[#D9D2C5]">
                            • {f}
                          </div>
                        ))
                      ) : (
                        <div className="text-[#6F7772] italic p-2 bg-[#0F1210] rounded">None recorded</div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedEvidence.notes && (
                    <div className="p-3 bg-[#0F1210] border border-[rgba(244,240,232,0.08)] rounded-lg">
                      <span className="text-[10px] font-mono text-[#6F7772] uppercase block mb-1">Field Notes</span>
                      <p className="text-[#D9D2C5] leading-relaxed">{selectedEvidence.notes}</p>
                    </div>
                  )}

                  {/* Raw Metadata JSON */}
                  <div>
                    <span className="text-[10px] font-mono text-[#6F7772] uppercase block mb-1">
                      Evidence Metadata JSON
                    </span>
                    <pre className="bg-[#0F1210] p-3 rounded-lg border border-[rgba(244,240,232,0.08)] text-[11px] font-mono text-[#D9D2C5] overflow-x-auto max-h-40">
                      {JSON.stringify(selectedEvidence.evidence_metadata, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[rgba(244,240,232,0.08)] bg-[#0F1210] flex justify-between items-center">
                  <button
                    onClick={() => {
                      setSelectedEvidence(null);
                      setActiveTab("lineage");
                      setLookupPropertyId(selectedEvidence.entity_id);
                      handleLookupLineage(selectedEvidence.entity_id);
                    }}
                    className="text-[#23847D] hover:text-[#23847D] font-mono text-xs flex items-center gap-1"
                  >
                    Trace Lineage for this Entity <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSelectedEvidence(null)}
                    className="px-4 py-1.5 bg-[#0F1210] hover:bg-[#1A201D] text-[#F4F0E8] rounded text-xs transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
