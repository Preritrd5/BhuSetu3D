"use client";

/**
 * BhuSetu 3D Spatial Discrepancy Detail Page
 * Evidence-Backed 3D Property Intelligence Platform
 */
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { SpatialLoadingRoller } from "@/components/common/SpatialLoadingRoller";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Layers,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Info,
  RefreshCw,
  MapPin,
  Check,
  FileCheck2,
  Activity,
  Sparkles,
} from "lucide-react";

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
  conflict_geom_geojson?: Record<string, any>;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export default function ConflictDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const conflictId = params.id as string;

  const [conflict, setConflict] = useState<ConflictItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [resolutionNoteInput, setResolutionNoteInput] = useState("");

  const fetchDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/conflicts/${conflictId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error(`Failed to load discrepancy finding (HTTP ${res.status})`);
      }
      const data = await res.json();
      setConflict(data);
      if (data.resolution_notes) {
        setResolutionNoteInput(data.resolution_notes);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load discrepancy finding.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (conflictId) {
      fetchDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conflictId, token]);

  const handleUpdateStatus = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/conflicts/${conflictId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: newStatus,
          comment: resolutionNoteInput || `Status updated to ${newStatus}`,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update status (HTTP ${res.status})`);
      }

      const updated = await res.json();
      setConflict(updated);
      setStatusMessage(`Status successfully updated to ${newStatus}`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev?.toUpperCase()) {
      case "HIGH":
        return "bg-[#B56E48]/20 text-[#C47B50] border-[#B56E48]/40";
      case "MEDIUM":
        return "bg-[#B56E48]/15 text-[#C47B50] border-[#B56E48]/30";
      case "LOW":
        return "bg-[#176C68]/20 text-[#23847D] border-[#176C68]/40";
      default:
        return "bg-[#1A201D] text-[#D9D2C5] border-[rgba(244,240,232,0.12)]";
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st?.toUpperCase()) {
      case "OPEN":
        return "bg-[#B56E48]/20 text-[#C47B50] border-[#B56E48]/40";
      case "REVIEWED":
      case "REVIEW_REQUIRED":
        return "bg-[#B56E48]/15 text-[#C47B50] border-[#B56E48]/30";
      case "RESOLVED":
        return "bg-[#176C68]/20 text-[#23847D] border-[#176C68]/40";
      default:
        return "bg-[#1A201D] text-[#6F7772] border-[rgba(244,240,232,0.08)]";
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[#0F1210] text-[#F4F0E8] overflow-hidden font-sans select-none">
        <Sidebar />

        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Header */}
          <div className="border-b border-[rgba(244,240,232,0.08)] bg-[#141816] px-8 py-5 sticky top-0 z-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/conflicts")}
                className="p-2 rounded-[6px] bg-[#1A201D] hover:bg-[#141816] text-[#D9D2C5] transition-colors border border-[rgba(244,240,232,0.08)] cursor-pointer"
                title="Back to Conflicts"
              >
                <ArrowLeft className="w-5 h-5 text-[#6F7772]" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#23847D] uppercase tracking-wider font-semibold">
                    Spatial Discrepancy Record · PostGIS 3.4
                  </span>
                  <span className="text-xs text-[#6F7772]">•</span>
                  <span className="text-xs font-mono text-[#6F7772]">{conflictId.slice(0, 8)}...</span>
                </div>
                <h1 className="text-xl font-bold font-mono text-[#F4F0E8] flex items-center gap-2.5 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-[#C47B50]" />
                  {conflict?.rule_name || "Spatial Discrepancy Finding"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {conflict && (
                <Link
                  href={`/spatial-investigator?conflict=${conflict.id}&parcel=${conflict.parcel_id || ""}&q=Explain this spatial finding`}
                  className="px-3.5 py-1.5 rounded-[6px] bg-[#1A201D] hover:bg-[#141816] border border-[rgba(244,240,232,0.12)] text-[#F4F0E8] text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-[#C47B50]" />
                  <span>Explain with AI</span>
                </Link>
              )}

              <button
                onClick={fetchDetail}
                disabled={isLoading}
                className="px-3.5 py-1.5 rounded-[6px] bg-[#1A201D] hover:bg-[#141816] text-[#D9D2C5] text-xs font-mono flex items-center gap-2 border border-[rgba(244,240,232,0.08)] transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#B56E48]" : "text-[#6F7772]"}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
            {/* Governance Disclaimer Banner */}
            <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#C47B50] mt-0.5 shrink-0" />
              <div className="text-xs text-[#D9D2C5] leading-relaxed font-sans">
                <span className="font-bold text-[#F4F0E8] font-mono">Mandatory Spatial Governance Notice: </span>
                Spatial discrepancies are advisory technical findings indicating geometric misalignment, footprint encroachment,
                or setback clearance warnings for surveyor verification. They do not constitute legal adjudications or determinations
                of illegality.
              </div>
            </div>

            {statusMessage && (
              <div className="bg-[#176C68]/20 border border-[#176C68]/40 rounded-[6px] p-4 flex items-center gap-3 text-[#23847D] text-xs font-mono">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {statusMessage}
              </div>
            )}

            {isLoading && (
              <div className="py-16">
                <SpatialLoadingRoller
                  size="md"
                  label="LOADING DISCREPANCY RECORD"
                  subtitle="Retrieving spatial geometry, setback delta & sensor telemetry..."
                  showCoordinates={false}
                />
              </div>
            )}

            {error && (
              <div className="p-4 rounded-[6px] bg-[#B56E48]/20 border border-[#B56E48]/40 text-[#C47B50] text-xs font-mono flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {conflict && !isLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
                {/* Left 2 Cols: Main Intelligence & Findings */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Summary Card */}
                  <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[rgba(244,240,232,0.08)]">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[#1A201D] text-[#D9D2C5] border border-[rgba(244,240,232,0.12)]">
                            {conflict.rule_id || "RULE-SPATIAL"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-[4px] text-[10px] uppercase font-bold border ${getSeverityBadge(
                              conflict.severity
                            )}`}
                          >
                            {conflict.severity} Severity
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-[4px] text-[10px] uppercase font-bold border ${getStatusBadge(
                              conflict.status
                            )}`}
                          >
                            {conflict.status}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-[#F4F0E8]">{conflict.rule_name}</h2>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-[#6F7772] mb-1">Discrepancy Confidence</div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-bold bg-[#1A201D] text-[#23847D] border border-[rgba(244,240,232,0.08)]">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#176C68]" />
                          {Math.round(conflict.confidence_score * 100)}%
                        </div>
                      </div>
                    </div>

                    {/* Technical Explanation */}
                    <div className="mt-5">
                      <h3 className="text-[10px] uppercase tracking-wider text-[#6F7772] mb-2 font-bold">
                        Geometric Finding Explanation
                      </h3>
                      <div className="p-4 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)] text-xs text-[#D9D2C5] leading-relaxed font-sans">
                        {conflict.explanation || "No explanation provided for this finding."}
                      </div>
                    </div>

                    {/* Metric Measurements */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)]">
                        <div className="text-[10px] text-[#6F7772] mb-1">Measured Value</div>
                        <div className="text-xl font-bold text-[#C47B50]">
                          {conflict.measured_value !== undefined && conflict.measured_value !== null
                            ? `${Number(conflict.measured_value).toFixed(2)} ${conflict.measured_unit || ""}`
                            : "N/A"}
                        </div>
                      </div>
                      <div className="p-4 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)]">
                        <div className="text-[10px] text-[#6F7772] mb-1">Threshold Limit</div>
                        <div className="text-xl font-bold text-[#F4F0E8]">
                          {conflict.threshold_value !== undefined && conflict.threshold_value !== null
                            ? `${Number(conflict.threshold_value).toFixed(2)} ${conflict.measured_unit || ""}`
                            : "0.00"}
                        </div>
                      </div>
                      <div className="p-4 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)]">
                        <div className="text-[10px] text-[#6F7772] mb-1">Observed Deviation</div>
                        <div className="text-xl font-bold text-[#C47B50]">
                          {conflict.deviation_value !== undefined && conflict.deviation_value !== null
                            ? `${Number(conflict.deviation_value).toFixed(2)} ${conflict.measured_unit || ""}`
                            : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Discrepancy Context & Attributes */}
                  <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-[#F4F0E8] mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#23847D]" />
                      Detailed Geometric Findings & Parameters
                    </h3>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)]">
                          <span className="text-[#6F7772] block mb-1">Conflict Type:</span>
                          <span className="text-[#F4F0E8] font-bold">{conflict.conflict_type}</span>
                        </div>
                        <div className="p-3 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)]">
                          <span className="text-[#6F7772] block mb-1">Analysis Engine Version:</span>
                          <span className="text-[#F4F0E8] font-bold">{conflict.analysis_version || "PostGIS 3.4"}</span>
                        </div>
                      </div>

                      {conflict.discrepancy_details && Object.keys(conflict.discrepancy_details).length > 0 && (
                        <div>
                          <div className="text-[10px] text-[#6F7772] mb-1 font-bold">Discrepancy Parameters:</div>
                          <pre className="p-3.5 rounded-[6px] bg-[#0F1210] border border-[rgba(244,240,232,0.08)] text-[11px] text-[#D9D2C5] overflow-x-auto">
                            {JSON.stringify(conflict.discrepancy_details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Evidence & Lineage Reference */}
                  <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-[#F4F0E8] mb-4 flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-[#23847D]" />
                      Evidence & Source Lineage
                    </h3>

                    {conflict.evidence_reference && Object.keys(conflict.evidence_reference).length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-xs text-[#6F7772] font-sans">
                          This finding incorporates derived evidence sources and conservative confidence tracking:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(conflict.evidence_reference).map(([key, val]) => (
                            <div key={key} className="p-3 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)]">
                              <span className="text-[#6F7772] block mb-1 capitalize text-[10px]">
                                {key.replace(/_/g, " ")}:
                              </span>
                              <span className="text-[#F4F0E8]">
                                {typeof val === "object" ? JSON.stringify(val) : String(val)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#6F7772] italic font-sans">
                        Derived directly from primary cadastral and building geometry layers.
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Col: Entities & Status Management */}
                <div className="space-y-6">
                  {/* Entity Links */}
                  <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-[#F4F0E8] mb-4 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#23847D]" />
                      Subject Entities
                    </h3>

                    <div className="space-y-4">
                      {/* Primary Entity */}
                      <div className="p-3.5 rounded-[6px] bg-[#1A201D] border border-[rgba(244,240,232,0.08)]">
                        <div className="text-xs text-[#6F7772] mb-1 flex items-center justify-between">
                          <span>Primary Entity ({conflict.entity_type})</span>
                          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-[4px] bg-[#141816] text-[#23847D] border border-[rgba(244,240,232,0.08)]">
                            Subject
                          </span>
                        </div>

                        {conflict.parcel_ulpin && (
                          <div className="mt-1">
                            <div className="text-xs text-[#F4F0E8] font-bold">{conflict.parcel_ulpin}</div>
                            <Link
                              href="/properties"
                              className="inline-flex items-center gap-1 text-xs text-[#23847D] hover:text-[#176C68] mt-2 font-bold"
                            >
                              Inspect in 2D Explorer <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        )}

                        {conflict.building_code && (
                          <div className="mt-2 pt-2 border-t border-[rgba(244,240,232,0.08)]">
                            <div className="text-xs text-[#6F7772] mb-0.5">Building Code:</div>
                            <div className="text-xs text-[#F4F0E8] font-bold">{conflict.building_code}</div>
                            <Link
                              href="/3d-city"
                              className="inline-flex items-center gap-1 text-xs text-[#C47B50] hover:text-[#B56E48] mt-2 font-bold"
                            >
                              Inspect in 3D City <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lifecycle Status Workflow */}
                  <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-[#F4F0E8] flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-[#C47B50]" />
                      Statutory Review Action
                    </h3>

                    <div className="space-y-2">
                      <label className="text-[10px] text-[#6F7772] uppercase block">Resolution / Assessment Note:</label>
                      <textarea
                        value={resolutionNoteInput}
                        onChange={(e) => setResolutionNoteInput(e.target.value)}
                        placeholder="Add surveyor observations or legal determinations..."
                        className="w-full bg-[#1A201D] border border-[rgba(244,240,232,0.08)] rounded-[6px] p-2.5 text-xs text-[#F4F0E8] placeholder-[#6F7772] focus:outline-none focus:border-[#B56E48] font-mono resize-none h-20"
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                      {conflict.status !== "REVIEW_REQUIRED" && (
                        <button
                          onClick={() => handleUpdateStatus("REVIEW_REQUIRED")}
                          disabled={isUpdatingStatus}
                          className="w-full py-2 bg-[#B56E48]/20 hover:bg-[#B56E48]/30 text-[#C47B50] border border-[#B56E48]/40 rounded-[6px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          <span>Flag for Review Required</span>
                        </button>
                      )}

                      {conflict.status !== "RESOLVED" && (
                        <button
                          onClick={() => handleUpdateStatus("RESOLVED")}
                          disabled={isUpdatingStatus}
                          className="w-full py-2 bg-[#176C68]/20 hover:bg-[#176C68]/30 text-[#23847D] border border-[#176C68]/40 rounded-[6px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Mark Resolved (Field Truthed)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
