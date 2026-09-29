"use client";

/**
 * BhuSetu 3D Spatial Conflicts & Discrepancies Workspace
 * Evidence-Backed 3D Property Intelligence Platform
 */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { SpatialLoadingRoller } from "@/components/common/SpatialLoadingRoller";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE } from "@/lib/api/config";
import {
  AlertTriangle,
  Search,
  Layers,
  ShieldAlert,
  ChevronRight,
  Info,
  CheckCircle2,
  X,
  RefreshCw,
  MapPin,
  Check,
  FileCheck2,
  UserCheck,
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
  created_at: string;
  updated_at: string;
}

interface ConflictSummary {
  open_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
}

export default function ConflictsPage() {
  const { token } = useAuth();

  // State
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState<ConflictSummary>({
    open_count: 0,
    high_count: 0,
    medium_count: 0,
    low_count: 0,
    info_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [minConfidence, setMinConfidence] = useState<number>(0.0);

  // Inspection Drawer
  const [selectedConflict, setSelectedConflict] = useState<ConflictItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchConflicts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedSeverity !== "ALL") params.append("severity", selectedSeverity);
      if (selectedType !== "ALL") params.append("conflict_type", selectedType);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (minConfidence > 0) params.append("min_confidence", minConfidence.toString());

      const res = await fetch(`${API_BASE}/conflicts?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error(`Failed to load spatial findings (HTTP ${res.status})`);
      }

      const data = await res.json();
      setConflicts(data.items || []);
      setTotalItems(data.total || 0);
      if (data.summary) setSummary(data.summary);
    } catch (err: any) {
      setError(err.message || "Failed to load conflicts.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConflicts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedSeverity, selectedType, selectedStatus, minConfidence]);

  const handleUpdateStatus = async (conflictId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`${API_BASE}/conflicts/${conflictId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus, comment: `Status updated via console to ${newStatus}` }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update status (HTTP ${res.status})`);
      }

      const updated = await res.json();
      setConflicts((prev) => prev.map((c) => (c.id === conflictId ? updated : c)));
      if (selectedConflict && selectedConflict.id === conflictId) {
        setSelectedConflict(updated);
      }
    } catch (err: any) {
      alert(err.message || "Error updating status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
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

  const filteredConflicts = conflicts.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.parcel_ulpin && c.parcel_ulpin.toLowerCase().includes(q)) ||
      (c.building_code && c.building_code.toLowerCase().includes(q)) ||
      (c.rule_name && c.rule_name.toLowerCase().includes(q)) ||
      (c.conflict_type && c.conflict_type.toLowerCase().includes(q)) ||
      (c.explanation && c.explanation.toLowerCase().includes(q))
    );
  });

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[#0F1210] text-[#F4F0E8] select-none font-sans">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="border-b border-[rgba(244,240,232,0.08)] bg-[#141816] px-8 py-5 flex items-center justify-between sticky top-0 z-20">
            <div>
              <div className="flex items-center gap-2 text-[#23847D] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#176C68]" />
                <span>SPATIAL FINDINGS & DISCREPANCY REGISTRY · POSTGIS 3.4</span>
              </div>
              <h1 className="text-xl font-bold font-mono text-[#F4F0E8] flex items-center gap-2.5">
                Spatial Findings & Conflicts Registry
              </h1>
              <p className="text-xs text-[#6F7772] mt-0.5 font-sans">
                Deterministic PostGIS geometry relationship analysis, boundary setbacks, and infrastructure proximity.
              </p>
            </div>

            <Link
              href="/spatial-analysis"
              className="px-4 py-2 bg-[#B56E48] hover:bg-[#C47B50] text-[#F4F0E8] font-mono font-bold rounded-[6px] text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Launch Spatial Analysis Workspace</span>
            </Link>
          </div>

          {/* Legal Limitation Notice Banner */}
          <div className="mx-8 mt-5 p-4 bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] flex items-start gap-3">
            <Info className="w-4 h-4 text-[#C47B50] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[#D9D2C5] leading-relaxed font-sans">
              <span className="font-bold text-[#F4F0E8] font-mono">Mandatory Governance Notice:</span> Spatial findings are
              computational observations derived from mathematical comparisons of spatial records and configured rules.
              They <span className="font-semibold text-[#F4F0E8]">do not by themselves establish legal ownership, illegality, or unauthorized construction</span>.
              Final administrative determinations are made by statutory human officers under statutory review.
            </div>
          </div>

          {/* Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-8 mt-4">
            <div className="p-4 rounded-[8px] bg-[#141816] border border-[rgba(244,240,232,0.08)] shadow-sm">
              <span className="text-[10px] font-mono text-[#6F7772] uppercase tracking-wider block mb-1 font-semibold">
                TOTAL FINDINGS
              </span>
              <div className="text-[28px] font-extrabold font-mono text-[#F4F0E8] leading-tight">{totalItems}</div>
              <div className="text-[10px] text-[#6F7772] mt-1">Durable geometric discrepancies</div>
            </div>

            <div className="p-4 rounded-[8px] bg-[#141816] border border-[rgba(244,240,232,0.08)] shadow-sm">
              <span className="text-[10px] font-mono text-[#6F7772] uppercase tracking-wider block mb-1 font-semibold">
                HIGH SEVERITY
              </span>
              <div className="text-[28px] font-extrabold font-mono text-[#C47B50] leading-tight">{summary.high_count}</div>
              <div className="text-[10px] text-[#6F7772] mt-1">Significant boundary discrepancies</div>
            </div>

            <div className="p-4 rounded-[8px] bg-[#141816] border border-[rgba(244,240,232,0.08)] shadow-sm">
              <span className="text-[10px] font-mono text-[#6F7772] uppercase tracking-wider block mb-1 font-semibold">
                REVIEW REQUIRED
              </span>
              <div className="text-[28px] font-extrabold font-mono text-[#C47B50] leading-tight">{summary.open_count}</div>
              <div className="text-[10px] text-[#6F7772] mt-1">Pending statutory assessment</div>
            </div>

            <div className="p-4 rounded-[8px] bg-[#141816] border border-[rgba(244,240,232,0.08)] shadow-sm">
              <span className="text-[10px] font-mono text-[#6F7772] uppercase tracking-wider block mb-1 font-semibold">
                MEDIUM / LOW
              </span>
              <div className="text-[28px] font-extrabold font-mono text-[#23847D] leading-tight">
                {summary.medium_count + summary.low_count}
              </div>
              <div className="text-[10px] text-[#6F7772] mt-1">Minor setbacks & proximity buffers</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-8 space-y-4">
            <div className="p-4 bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6F7772]" />
                  <input
                    type="text"
                    placeholder="Search by property ULPIN, building code, rule ID, or explanation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1A201D] border border-[rgba(244,240,232,0.08)] pl-9 pr-3 py-1.5 rounded-[4px] text-xs text-[#F4F0E8] placeholder-[#6F7772] focus:outline-none focus:border-[#B56E48] font-mono"
                  />
                </div>
                <button
                  onClick={fetchConflicts}
                  className="px-3 py-1.5 bg-[#1A201D] hover:bg-[#141816] text-[#D9D2C5] border border-[rgba(244,240,232,0.08)] rounded-[4px] text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#C47B50]" />
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                <div>
                  <label className="text-[10px] text-[#6F7772] uppercase block mb-1">
                    Severity
                  </label>
                  <select
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                    className="w-full bg-[#1A201D] border border-[rgba(244,240,232,0.08)] px-2.5 py-1.5 rounded-[4px] text-[#F4F0E8] focus:outline-none focus:border-[#B56E48]"
                  >
                    <option value="ALL">All Severities</option>
                    <option value="HIGH">HIGH (Significant Overlap/Outside)</option>
                    <option value="MEDIUM">MEDIUM (Setback/Buffer Deviation)</option>
                    <option value="LOW">LOW (Minor Tolerance Boundary)</option>
                    <option value="INFO">INFO (Advisory Spatial Note)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#6F7772] uppercase block mb-1">
                    Conflict Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full bg-[#1A201D] border border-[rgba(244,240,232,0.08)] px-2.5 py-1.5 rounded-[4px] text-[#F4F0E8] focus:outline-none focus:border-[#B56E48]"
                  >
                    <option value="ALL">All Conflict Types</option>
                    <option value="BUILDING_OUTSIDE_PARCEL">Building Outside Parcel</option>
                    <option value="BUILDING_BOUNDARY_PROXIMITY">Building Boundary Proximity</option>
                    <option value="PROPERTY_PROPERTY_OVERLAP">Parcel Geometry Overlap</option>
                    <option value="INFRASTRUCTURE_PROXIMITY">Infrastructure Buffer Proximity</option>
                    <option value="INFRASTRUCTURE_INTERSECTION">Infrastructure Intersection</option>
                    <option value="GEOMETRY_INVALID">Geometry Invalid</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#6F7772] uppercase block mb-1">
                    Lifecycle Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full bg-[#1A201D] border border-[rgba(244,240,232,0.08)] px-2.5 py-1.5 rounded-[4px] text-[#F4F0E8] focus:outline-none focus:border-[#B56E48]"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="OPEN">OPEN</option>
                    <option value="REVIEW_REQUIRED">REVIEW REQUIRED</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="DISMISSED">DISMISSED</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-[#6F7772] uppercase mb-1">
                    <span>Min Confidence</span>
                    <span className="text-[#23847D] font-bold">{(minConfidence * 100).toFixed(0)}%</span>
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

            {/* Findings Data Table */}
            <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] overflow-hidden shadow-sm">
              {isLoading ? (
                <div className="py-14">
                  <SpatialLoadingRoller
                    size="md"
                    label="EVALUATING SPATIAL RULES"
                    subtitle="Querying database for setback overlap & volumetric height deviations..."
                    showCoordinates={false}
                  />
                </div>
              ) : filteredConflicts.length === 0 ? (
                <div className="p-12 text-center text-[#6F7772] space-y-2">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-[#23847D]" />
                  <p className="text-xs font-semibold text-[#F4F0E8] font-mono">No spatial conflicts detected matching query.</p>
                  <p className="text-[11px] text-[#6F7772]">
                    Spatial rules evaluated with zero active discrepancies for the selected filters.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1A201D] text-[10px] font-mono text-[#6F7772] uppercase border-b border-[rgba(244,240,232,0.08)]">
                    <tr>
                      <th className="py-2.5 px-4">Finding Type</th>
                      <th className="py-2.5 px-4">Severity</th>
                      <th className="py-2.5 px-4">Target / Entity</th>
                      <th className="py-2.5 px-4">Measured Value</th>
                      <th className="py-2.5 px-4">Threshold</th>
                      <th className="py-2.5 px-4">Confidence</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(244,240,232,0.04)] font-mono">
                    {filteredConflicts.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#1A201D] transition-colors group cursor-pointer"
                        onClick={() => setSelectedConflict(item)}
                      >
                        <td className="py-3 px-4 max-w-[220px]">
                          <span className="font-semibold text-[#F4F0E8] block truncate">
                            {item.rule_name || item.conflict_type.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-[#6F7772] block truncate">
                            {item.rule_id || "SYSTEM_RULE"}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-[3px] text-[10px] font-mono border font-semibold ${getSeverityBadge(
                              item.severity
                            )}`}
                          >
                            {item.severity}
                          </span>
                        </td>

                        <td className="py-3 px-4 max-w-[160px]">
                          <span className="text-[#23847D] block truncate font-bold">
                            {item.parcel_ulpin || (item.parcel_id ? `Parcel ${item.parcel_id.slice(0, 8)}...` : item.entity_type)}
                          </span>
                          {item.building_code && (
                            <span className="text-[10px] text-[#C47B50] block">
                              Building: {item.building_code}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-[#F4F0E8]">
                            {item.measured_value !== null && item.measured_value !== undefined
                              ? `${item.measured_value.toFixed(2)} ${item.measured_unit}`
                              : "N/A"}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-[#6F7772]">
                          {item.threshold_value !== null && item.threshold_value !== undefined
                            ? `${item.threshold_value.toFixed(2)} ${item.measured_unit}`
                            : "N/A"}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-[#D9D2C5]">
                              {(item.confidence_score * 100).toFixed(0)}%
                            </span>
                            <div className="w-12 bg-[#1A201D] h-1 rounded-[2px] overflow-hidden border border-[rgba(244,240,232,0.06)]">
                              <div
                                className={`h-full ${
                                  item.confidence_score >= 0.85
                                    ? "bg-[#23847D]"
                                    : "bg-[#B56E48]"
                                }`}
                                style={{ width: `${item.confidence_score * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-[3px] border ${
                              item.status === "OPEN"
                                ? "bg-[#B56E48]/20 text-[#C47B50] border-[#B56E48]/40"
                                : item.status === "REVIEW_REQUIRED"
                                ? "bg-[#B56E48]/20 text-[#C47B50] border-[#B56E48]/40"
                                : "bg-[#176C68]/20 text-[#23847D] border-[#176C68]/40"
                            }`}
                          >
                            {item.status.replace(/_/g, " ")}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedConflict(item);
                            }}
                            className="text-[#C47B50] hover:text-[#B56E48] font-mono text-[11px] font-bold flex items-center gap-1 ml-auto cursor-pointer"
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

          {/* DETAIL MODAL / DRAWER */}
          {selectedConflict && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#141816] border border-[rgba(244,240,232,0.12)] w-full max-w-2xl rounded-[10px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-[rgba(244,240,232,0.08)] bg-[#1A201D] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#C47B50]" />
                    <div>
                      <h3 className="text-sm font-bold font-mono text-[#F4F0E8]">
                        {selectedConflict.rule_name || "Spatial Finding"}
                      </h3>
                      <span className="text-[10px] font-mono text-[#6F7772]">
                        Rule ID: {selectedConflict.rule_id} • Finding ID: {selectedConflict.id}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedConflict(null)}
                    className="p-1 text-[#6F7772] hover:text-[#F4F0E8] rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
                  {/* Status & Severity Bar */}
                  <div className="flex items-center justify-between p-3 bg-[#1A201D] border border-[rgba(244,240,232,0.08)] rounded-[6px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-[3px] text-[10px] border font-semibold ${getSeverityBadge(
                          selectedConflict.severity
                        )}`}
                      >
                        SEVERITY: {selectedConflict.severity}
                      </span>
                      <span className="text-[10px] text-[#6F7772] uppercase">
                        STATUS: {selectedConflict.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[#6F7772]">Finding Confidence:</span>
                      <span className="text-[#23847D] font-bold">
                        {(selectedConflict.confidence_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Mandatory Legal Limitation Notice */}
                  <div className="p-3 bg-[#1A201D] border border-[rgba(244,240,232,0.08)] rounded-[6px] text-[#D9D2C5] space-y-1">
                    <span className="font-semibold text-[#C47B50] text-[10px] uppercase block">
                      LIMITATION NOTICE
                    </span>
                    <p className="text-[11px] leading-relaxed font-sans">
                      Spatial findings are computational observations and do not by themselves establish legal ownership,
                      legality, authorization, or regulatory violation.
                    </p>
                  </div>

                  {/* Explanation */}
                  <div className="p-3 bg-[#1A201D] border border-[rgba(244,240,232,0.08)] rounded-[6px] space-y-1">
                    <span className="text-[10px] uppercase text-[#23847D] font-semibold block">
                      WHAT WAS DETECTED
                    </span>
                    <p className="text-[#F4F0E8] leading-relaxed font-sans text-xs">
                      {selectedConflict.explanation || "Spatial relationship discrepancy identified against parcel boundary."}
                    </p>
                  </div>

                  {/* Measured vs Threshold Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#1A201D] border border-[rgba(244,240,232,0.08)] rounded-[6px]">
                      <span className="text-[10px] uppercase text-[#6F7772] block">MEASURED VALUE</span>
                      <div className="text-lg font-bold text-[#C47B50] mt-1">
                        {selectedConflict.measured_value !== null && selectedConflict.measured_value !== undefined
                          ? `${selectedConflict.measured_value.toFixed(2)} ${selectedConflict.measured_unit}`
                          : "N/A"}
                      </div>
                      <span className="text-[10px] text-[#6F7772] block mt-0.5">Calculated PostGIS metric magnitude</span>
                    </div>

                    <div className="p-3 bg-[#1A201D] border border-[rgba(244,240,232,0.08)] rounded-[6px]">
                      <span className="text-[10px] uppercase text-[#6F7772] block">CONFIGURED THRESHOLD</span>
                      <div className="text-lg font-bold text-[#F4F0E8] mt-1">
                        {selectedConflict.threshold_value !== null && selectedConflict.threshold_value !== undefined
                          ? `${selectedConflict.threshold_value.toFixed(2)} ${selectedConflict.measured_unit}`
                          : "N/A"}
                      </div>
                      <span className="text-[10px] text-[#6F7772] block mt-0.5">Allowable tolerance before discrepancy</span>
                    </div>
                  </div>

                  {/* Evidence & Provenance Backing */}
                  <div className="p-3 bg-[#1A201D] border border-[rgba(244,240,232,0.08)] rounded-[6px] space-y-2">
                    <span className="text-[10px] text-[#23847D] uppercase font-semibold block flex items-center gap-1">
                      <FileCheck2 className="w-3.5 h-3.5" /> SUPPORTING EVIDENCE & PROVENANCE
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[#6F7772] block text-[10px]">Parcel Data Source:</span>
                        <span className="text-[#F4F0E8]">
                          {selectedConflict.evidence_reference?.parcel_source || "Cadastral Land Records"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6F7772] block text-[10px]">Building Data Source:</span>
                        <span className="text-[#F4F0E8]">
                          {selectedConflict.evidence_reference?.building_source || "Drone Orthomosaic Imagery"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6F7772] block text-[10px]">Extraction Method:</span>
                        <span className="text-[#F4F0E8]">
                          {selectedConflict.evidence_reference?.building_extraction || "AI YOLOv8x Segmentation"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6F7772] block text-[10px]">Height Source:</span>
                        <span className="text-[#F4F0E8]">
                          {selectedConflict.evidence_reference?.height_source || "LiDAR Point Cloud / DSM"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Discrepancy Details JSON */}
                  <div>
                    <span className="text-[10px] text-[#6F7772] uppercase block mb-1">
                      DISCREPANCY METRICS JSON
                    </span>
                    <pre className="bg-[#0F1210] p-3 rounded-[6px] border border-[rgba(244,240,232,0.08)] text-[11px] text-[#D9D2C5] overflow-x-auto max-h-36">
                      {JSON.stringify(selectedConflict.discrepancy_details, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-[rgba(244,240,232,0.08)] bg-[#1A201D] flex justify-between items-center font-mono">
                  <div className="flex items-center gap-2">
                    {selectedConflict.status !== "REVIEW_REQUIRED" && (
                      <button
                        onClick={() => handleUpdateStatus(selectedConflict.id, "REVIEW_REQUIRED")}
                        disabled={isUpdatingStatus}
                        className="px-3 py-1.5 bg-[#B56E48]/20 hover:bg-[#B56E48]/30 text-[#C47B50] border border-[#B56E48]/40 rounded-[4px] text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Mark Review Required
                      </button>
                    )}
                    {selectedConflict.status !== "RESOLVED" && (
                      <button
                        onClick={() => handleUpdateStatus(selectedConflict.id, "RESOLVED")}
                        disabled={isUpdatingStatus}
                        className="px-3 py-1.5 bg-[#176C68]/20 hover:bg-[#176C68]/30 text-[#23847D] border border-[#176C68]/40 rounded-[4px] text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark Resolved
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/verification/${selectedConflict.id}`}
                      className="px-3 py-1.5 bg-[#B56E48] hover:bg-[#C47B50] text-[#F4F0E8] rounded-[4px] text-xs transition-colors flex items-center gap-1 font-bold shadow-sm"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Human Verification
                    </Link>
                    {selectedConflict.parcel_id && (
                      <Link
                        href={`/properties?parcel=${selectedConflict.parcel_id}`}
                        className="px-3 py-1.5 bg-[#141816] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] text-[#D9D2C5] rounded-[4px] text-xs flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#23847D]" />
                        View 2D
                      </Link>
                    )}
                    <button
                      onClick={() => setSelectedConflict(null)}
                      className="px-3 py-1.5 bg-[#141816] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] text-[#6F7772] hover:text-[#F4F0E8] rounded-[4px] text-xs transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
