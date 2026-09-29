"use client";

/**
 * BhuSetu 3D Human Verification Queue Dashboard
 * Evidence-Backed 3D Property Intelligence Platform
 */
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import {
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowUpRight,
  Filter,
  Search,
  RefreshCw,
  UserPlus,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Layers,
  FileCheck2,
  ShieldAlert,
  Hash,
} from "lucide-react";
import {
  VerificationQueueItem,
  VerificationQueueSummary,
  ReviewerInfo,
  AuditChainVerificationResponse,
} from "@/types/verification";
import {
  getVerificationQueue,
  getVerificationSummary,
  getEligibleReviewers,
  assignReviewer,
  verifyAuditChain,
} from "@/lib/api/verification";

export default function VerificationQueuePage() {
  const router = useRouter();
  const { token, user } = useAuth();

  // State
  const [items, setItems] = useState<VerificationQueueItem[]>([]);
  const [summary, setSummary] = useState<VerificationQueueSummary | null>(null);
  const [reviewers, setReviewers] = useState<ReviewerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [total, setTotal] = useState(0);

  // Assign modal state
  const [assignModalFinding, setAssignModalFinding] = useState<VerificationQueueItem | null>(null);
  const [selectedReviewerId, setSelectedReviewerId] = useState<string>("");
  const [assignmentNotes, setAssignmentNotes] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Audit verify modal state
  const [isVerifyingAudit, setIsVerifyingAudit] = useState(false);
  const [auditVerifyResult, setAuditVerifyResult] = useState<AuditChainVerificationResponse | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statusFilter = selectedStatus === "ALL" ? undefined : [selectedStatus];
      const res = await getVerificationQueue(
        {
          status: statusFilter,
          severity: selectedSeverity || undefined,
          search: searchQuery || undefined,
          unassignedOnly,
          page,
          pageSize,
        },
        token
      );
      setItems(res.items);
      setTotal(res.total);
      setSummary(res.summary);
    } catch (err: any) {
      console.error("Queue load error:", err);
      setError(err.message || "Failed to load verification queue");
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedStatus, selectedSeverity, searchQuery, unassignedOnly, page, pageSize]);

  // Load reviewers on mount
  useEffect(() => {
    async function loadReviewersList() {
      try {
        const list = await getEligibleReviewers(token);
        setReviewers(list);
      } catch (err) {
        console.warn("Failed to load reviewers:", err);
      }
    }
    loadReviewersList();
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Quick Assign
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalFinding || !selectedReviewerId) return;

    setIsAssigning(true);
    try {
      await assignReviewer(assignModalFinding.id, selectedReviewerId, assignmentNotes, token);
      setAssignModalFinding(null);
      setSelectedReviewerId("");
      setAssignmentNotes("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to assign reviewer");
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle Verify Audit Chain
  const handleVerifyAuditChain = async () => {
    setIsVerifyingAudit(true);
    setShowAuditModal(true);
    try {
      const res = await verifyAuditChain(token);
      setAuditVerifyResult(res);
    } catch (err: any) {
      setAuditVerifyResult({
        is_valid: false,
        event_count: 0,
        verified_at: new Date().toISOString(),
        genesis_hash: "0".repeat(64),
        message: err.message || "Network error during audit verification",
      });
    } finally {
      setIsVerifyingAudit(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UNREVIEWED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-medium bg-[#B56E48]/10 text-[#C47B50] border border-amber-500/20">
            <Clock className="w-3 h-3" /> Unreviewed
          </span>
        );
      case "IN_REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-medium bg-blue-500/10 text-[#D9D2C5] border border-blue-500/20">
            <RefreshCw className="w-3 h-3 animate-spin" /> In Review
          </span>
        );
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-medium bg-[#23847D]/10 text-[#C47B50] border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Verified
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case "NEEDS_MORE_EVIDENCE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <HelpCircle className="w-3 h-3" /> Needs Evidence
          </span>
        );
      case "ESCALATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <ArrowUpRight className="w-3 h-3" /> Escalated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-medium bg-[#0F1210]/10 text-[#6F7772] border border-[#6F7772]/20">
            {status}
          </span>
        );
    }
  };

  const getSeverityBadge = (sev: string) => {
    const isCritical = sev === "CRITICAL";
    const isHigh = sev === "HIGH";
    return (
      <span
        className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
          isCritical
            ? "bg-rose-950/60 text-rose-300 border border-rose-800/60"
            : isHigh
            ? "bg-amber-950/60 text-[#F4F0E8] border border-amber-800/60"
            : "bg-[#1A201D] text-[#D9D2C5] border border-[rgba(244,240,232,0.12)]"
        }`}
      >
        {sev}
      </span>
    );
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <ProtectedRoute
      requiredRole={["ADMIN", "GOVERNMENT_OFFICER", "SURVEYOR"]}
      moduleName="Statutory Review Queue"
    >
      <div className="flex h-[calc(100vh-3.5rem)] bg-[#0F1210] text-[#F4F0E8] overflow-hidden select-none font-sans">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0F1210]">
          {/* Top Header */}
          <header className="border-b border-[rgba(244,240,232,0.08)] bg-[#0F1210] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 sticky top-0 z-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[#141816] border border-[rgba(244,240,232,0.08)] text-[#23847D] text-[11px] font-mono font-bold uppercase tracking-wider">
                    STATUTORY REVIEW WORKFLOW
                  </span>
                  <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#F4F0E8] flex items-center gap-2">
                    <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#C47B50]" />
                    Statutory Verification Queue
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-[#8C988F] mt-1 leading-relaxed">
                  Maker-checker workflow converting algorithmic detections into legally defensible, human-verified spatial records.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={handleVerifyAuditChain}
                  className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-[6px] bg-[#141816] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] text-[#D9D2C5] text-xs font-mono font-medium transition shadow-sm cursor-pointer"
                  title="Cryptographically verify SHA-256 hash chaining across all audit logs"
                >
                  <Hash className="w-4 h-4 text-[#23847D]" />
                  <span className="hidden sm:inline">Verify Audit Integrity</span>
                  <span className="sm:hidden">Audit</span>
                </button>

                <button
                  onClick={() => loadData()}
                  className="p-2 rounded-[6px] bg-[#141816] hover:bg-[#1A201D] border border-[rgba(244,240,232,0.08)] text-[#8C988F] transition cursor-pointer"
                  title="Refresh Queue"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#23847D]" : ""}`} />
                </button>
              </div>
            </div>

            {/* Statutory Notice Banner */}
            <div className="mt-4 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-[8px] bg-[#141816] border border-[#B56E48]/30 flex items-start gap-2.5 sm:gap-3 text-xs text-[#D9D2C5] font-sans">
              <ShieldAlert className="w-4 h-4 text-[#C47B50] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold font-mono text-[#C47B50]">Legal Governance Rule: </span>
                High algorithmic confidence does <span className="underline text-[#F4F0E8]">not</span> constitute verification.
                All discrepancies require inspection of canonical primary evidence by an authorized officer prior to statutory confirmation.
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
            {/* Telemetry Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] p-4">
                <div className="text-xs text-[#6F7772] font-medium flex items-center justify-between">
                  <span>Total Findings</span>
                  <Layers className="w-3.5 h-3.5 text-[#6F7772]" />
                </div>
                <div className="text-2xl font-bold text-[#F4F0E8] mt-1.5">
                  {summary ? summary.total : "—"}
                </div>
                <div className="text-[11px] text-[#6F7772] mt-1">Requiring governance</div>
              </div>

              <div
                onClick={() => { setSelectedStatus("UNREVIEWED"); setPage(1); }}
                className={`bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] p-4 cursor-pointer transition ${
                  selectedStatus === "UNREVIEWED" ? "border-[#B56E48] bg-[#B56E48]/15" : "border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.16)]"
                }`}
              >
                <div className="text-xs text-[#C47B50] font-medium flex items-center justify-between">
                  <span>Unreviewed</span>
                  <Clock className="w-3.5 h-3.5 text-[#C47B50]" />
                </div>
                <div className="text-2xl font-bold text-[#C47B50] mt-1.5">
                  {summary ? summary.unreviewed : "—"}
                </div>
                <div className="text-[11px] text-[#6F7772] mt-1">Pending first inspection</div>
              </div>

              <div
                onClick={() => { setSelectedStatus("IN_REVIEW"); setPage(1); }}
                className={`bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] p-4 cursor-pointer transition ${
                  selectedStatus === "IN_REVIEW" ? "border-[#176C68] bg-[#176C68]/15" : "border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.12)]"
                }`}
              >
                <div className="text-xs text-[#D9D2C5] font-medium flex items-center justify-between">
                  <span>In Review</span>
                  <RefreshCw className="w-3.5 h-3.5 text-[#D9D2C5]" />
                </div>
                <div className="text-2xl font-bold text-[#D9D2C5] mt-1.5">
                  {summary ? summary.in_review : "—"}
                </div>
                <div className="text-[11px] text-[#6F7772] mt-1">Active statutory check</div>
              </div>

              <div
                onClick={() => { setSelectedStatus("VERIFIED"); setPage(1); }}
                className={`bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] p-4 cursor-pointer transition ${
                  selectedStatus === "VERIFIED" ? "border-[#23847D] bg-[#23847D]/15" : "border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.12)]"
                }`}
              >
                <div className="text-xs text-[#23847D] font-medium flex items-center justify-between">
                  <span>Verified</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#23847D]" />
                </div>
                <div className="text-2xl font-bold text-[#23847D] mt-1.5">
                  {summary ? summary.verified : "—"}
                </div>
                <div className="text-[11px] text-[#6F7772] mt-1">Confirmed by reviewer</div>
              </div>

              <div
                onClick={() => { setSelectedStatus("REJECTED"); setPage(1); }}
                className={`bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] p-4 cursor-pointer transition ${
                  selectedStatus === "REJECTED" ? "border-rose-500/50 bg-rose-500/5" : "border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.12)]"
                }`}
              >
                <div className="text-xs text-rose-400 font-medium flex items-center justify-between">
                  <span>Rejected</span>
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="text-2xl font-bold text-rose-400 mt-1.5">
                  {summary ? summary.rejected : "—"}
                </div>
                <div className="text-[11px] text-[#6F7772] mt-1">Dismissed / Preserved</div>
              </div>

              <div
                onClick={() => { setSelectedStatus("ESCALATED"); setPage(1); }}
                className={`bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] p-4 cursor-pointer transition ${
                  selectedStatus === "ESCALATED" ? "border-purple-500/50 bg-purple-500/5" : "border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.12)]"
                }`}
              >
                <div className="text-xs text-purple-400 font-medium flex items-center justify-between">
                  <span>Escalated</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-purple-400 mt-1.5">
                  {summary ? summary.escalated : "—"}
                </div>
                <div className="text-[11px] text-[#6F7772] mt-1">Senior legal / survey</div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-[#0F1210]/80 border border-[rgba(244,240,232,0.08)] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Status Tab Group */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {["ALL", "UNREVIEWED", "IN_REVIEW", "VERIFIED", "REJECTED", "NEEDS_MORE_EVIDENCE", "ESCALATED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => { setSelectedStatus(st); setPage(1); }}
                    className={`px-3 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition ${
                      selectedStatus === st
                        ? "bg-[#23847D] text-[#F4F0E8] font-semibold shadow-sm"
                        : "text-[#6F7772] hover:text-[#F4F0E8] hover:bg-[#1A201D]/60"
                    }`}
                  >
                    {st === "ALL" ? "All Findings" : st.replace(/_/g, " ")}
                  </button>
                ))}
              </div>

              {/* Search & Modifiers */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#6F7772] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    placeholder="Search rule or explanation..."
                    className="pl-8 pr-3 py-1.5 rounded-[6px] bg-[#0F1210] border border-[rgba(244,240,232,0.12)] text-[#F4F0E8] text-xs focus:outline-none focus:border-emerald-500 w-52"
                  />
                </div>

                <select
                  value={selectedSeverity}
                  onChange={(e) => { setSelectedSeverity(e.target.value); setPage(1); }}
                  className="px-2.5 py-1.5 rounded-[6px] bg-[#0F1210] border border-[rgba(244,240,232,0.12)] text-[#F4F0E8] text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>

                <label className="flex items-center gap-2 text-xs text-[#6F7772] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={unassignedOnly}
                    onChange={(e) => { setUnassignedOnly(e.target.checked); setPage(1); }}
                    className="rounded bg-[#0F1210] border-[rgba(244,240,232,0.08)] text-emerald-500 focus:ring-0"
                  />
                  Unassigned only
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => loadData()} className="underline text-xs">Retry</button>
              </div>
            )}

            {/* Queue Table */}
            <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#D9D2C5]">
                  <thead className="bg-[#0F1210]/60 text-[#6F7772] text-xs uppercase tracking-wider font-semibold border-b border-[rgba(244,240,232,0.08)]">
                    <tr>
                      <th className="py-3.5 px-4">Finding / Rule</th>
                      <th className="py-3.5 px-4">Entity</th>
                      <th className="py-3.5 px-4">Measured Discrepancy</th>
                      <th className="py-3.5 px-4">Confidence</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Reviewer</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#6F7772]/60">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-[#6F7772]">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#23847D] mb-2" />
                          Loading statutory verification queue...
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-[#6F7772]">
                          <CheckCircle2 className="w-8 h-8 mx-auto text-[#23847D]/50 mb-2" />
                          No findings match the selected verification criteria.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id} className="hover:bg-[#1A201D]/30 transition">
                          <td className="py-4 px-4">
                            <div className="font-medium text-[#F4F0E8] flex items-center gap-2">
                              {item.rule_name || item.conflict_type.replace(/_/g, " ")}
                              {getSeverityBadge(item.severity)}
                            </div>
                            <div className="text-xs text-[#6F7772] mt-0.5 line-clamp-1">
                              {item.explanation || "Automated spatial discrepancy finding"}
                            </div>
                            <div className="text-[11px] font-mono text-[#6F7772] mt-1">
                              ID: {item.id.slice(0, 8)}... | {item.rule_id || "SPATIAL-RULE"}
                            </div>
                          </td>

                          <td className="py-4 px-4 text-xs">
                            <div className="font-mono text-[#D9D2C5] font-medium">
                              {item.entity_type}
                            </div>
                            <div className="text-[#6F7772] font-mono text-[11px] truncate max-w-[120px]">
                              {item.entity_id ? `${item.entity_id.slice(0, 8)}...` : "—"}
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="text-xs font-semibold text-[#F4F0E8]">
                              {item.measured_value !== null ? `${item.measured_value} ${item.measured_unit}` : "—"}
                            </div>
                            <div className="text-[11px] text-[#6F7772]">
                              Threshold: {item.threshold_value !== null ? `${item.threshold_value} ${item.measured_unit}` : "—"}
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-semibold text-[#F4F0E8]">
                                {(item.confidence_score * 100).toFixed(1)}%
                              </span>
                              <span
                                className="text-[10px] text-[#6F7772] cursor-help"
                                title="Algorithmic Confidence (Primary). Confidence is NOT verification."
                              >
                                [info]
                              </span>
                            </div>
                            <div className="text-[11px] text-[#6F7772]">
                              {item.evidence_count} evidence item{item.evidence_count === 1 ? "" : "s"}
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            {getStatusBadge(item.verification_status)}
                          </td>

                          <td className="py-4 px-4 text-xs">
                            {item.assigned_reviewer ? (
                              <div>
                                <div className="text-[#F4F0E8] font-medium">
                                  {item.assigned_reviewer.full_name}
                                </div>
                                <div className="text-[#6F7772] text-[11px]">
                                  {item.assigned_reviewer.role}
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setAssignModalFinding(item);
                                  setSelectedReviewerId("");
                                  setAssignmentNotes("");
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1A201D] hover:bg-[#1A201D] text-[#D9D2C5] text-xs transition"
                              >
                                <UserPlus className="w-3 h-3 text-[#23847D]" />
                                Assign
                              </button>
                            )}
                          </td>

                          <td className="py-4 px-4 text-right">
                            <Link
                              href={`/verification/${item.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#23847D]/10 hover:bg-[#23847D]/20 text-[#23847D] border border-emerald-500/30 text-xs font-medium transition"
                            >
                              Review Workspace
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="p-4 border-t border-[rgba(244,240,232,0.08)] flex items-center justify-between text-xs text-[#6F7772]">
                <div>
                  Showing {items.length > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
                  {Math.min(page * pageSize, total)} of {total} findings
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded bg-[#1A201D] hover:bg-[#1A201D] text-[#D9D2C5] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-[#D9D2C5]">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded bg-[#1A201D] hover:bg-[#1A201D] text-[#D9D2C5] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Quick Assign Modal */}
        {assignModalFinding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#0F1210] border border-[rgba(244,240,232,0.08)] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#F4F0E8] flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#23847D]" />
                  Assign Reviewer
                </h3>
                <button
                  onClick={() => setAssignModalFinding(null)}
                  className="text-[#6F7772] hover:text-[#F4F0E8]"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-[#6F7772] space-y-1 bg-[#0F1210] p-3 rounded-[6px] border border-[rgba(244,240,232,0.08)]">
                <div className="font-semibold text-[#F4F0E8]">{assignModalFinding.rule_name}</div>
                <div>Finding ID: <span className="font-mono text-[#6F7772]">{assignModalFinding.id}</span></div>
                <div>Severity: <span className="font-semibold text-[#C47B50]">{assignModalFinding.severity}</span></div>
              </div>

              <form onSubmit={handleAssignSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#D9D2C5] mb-1">
                    Select Authorized Reviewer
                  </label>
                  <select
                    value={selectedReviewerId}
                    onChange={(e) => setSelectedReviewerId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-[6px] bg-[#0F1210] border border-[rgba(244,240,232,0.12)] text-[#F4F0E8] text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Choose Reviewer --</option>
                    {reviewers.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.full_name} ({r.role} - {r.department || "Survey Cell"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#D9D2C5] mb-1">
                    Assignment Instructions / Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    placeholder="e.g., Please cross-verify LiDAR setback against latest survey parcel..."
                    className="w-full px-3 py-2 rounded-[6px] bg-[#0F1210] border border-[rgba(244,240,232,0.12)] text-[#F4F0E8] text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssignModalFinding(null)}
                    className="px-4 py-2 rounded-[6px] bg-[#1A201D] text-[#D9D2C5] text-xs font-medium hover:bg-[#1A201D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAssigning || !selectedReviewerId}
                    className="px-4 py-2 rounded-[6px] bg-[#23847D] text-[#F4F0E8] text-xs font-bold hover:bg-emerald-400 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isAssigning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    Confirm Assignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Audit Verify Modal */}
        {showAuditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="bg-[#0F1210] border border-[rgba(244,240,232,0.08)] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#F4F0E8] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#23847D]" />
                  Audit Chain Cryptographic Verification
                </h3>
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="text-[#6F7772] hover:text-[#F4F0E8]"
                >
                  ✕
                </button>
              </div>

              {isVerifyingAudit ? (
                <div className="py-8 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#23847D] mx-auto" />
                  <p className="text-sm text-[#D9D2C5]">
                    Traversing append-only audit log chain & independently recalculating SHA-256 hashes...
                  </p>
                </div>
              ) : auditVerifyResult ? (
                <div className="space-y-4 text-xs">
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-3 ${
                      auditVerifyResult.is_valid
                        ? "bg-[#23847D]/10 border-emerald-500/30 text-emerald-300"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    {auditVerifyResult.is_valid ? (
                      <CheckCircle2 className="w-5 h-5 text-[#23847D] shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-sm">
                        {auditVerifyResult.is_valid ? "Audit Chain Cryptographically Intact" : "Tamper Alert: Audit Chain Broken"}
                      </div>
                      <div className="mt-1 text-[#D9D2C5]">{auditVerifyResult.message}</div>
                    </div>
                  </div>

                  <div className="bg-[#0F1210] p-3.5 rounded-[6px] border border-[rgba(244,240,232,0.08)] space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#6F7772]">Verified Events:</span>
                      <span className="text-[#F4F0E8] font-bold">{auditVerifyResult.event_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6F7772]">Genesis Block:</span>
                      <span className="text-[#6F7772]">00000000...0000</span>
                    </div>
                    {auditVerifyResult.latest_hash && (
                      <div>
                        <span className="text-[#6F7772] block">Latest Hash (Head):</span>
                        <span className="text-[#23847D] break-all">{auditVerifyResult.latest_hash}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#6F7772]">Timestamp:</span>
                      <span className="text-[#6F7772]">{new Date(auditVerifyResult.verified_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setShowAuditModal(false)}
                      className="px-4 py-2 rounded-[6px] bg-[#1A201D] text-[#F4F0E8] text-xs font-semibold hover:bg-[#1A201D]"
                    >
                      Close Verification Report
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
