"use client";

/**
 * BhuSetu 3D Human Verification Review Workspace
 * Evidence-Backed 3D Property Intelligence Platform
 */
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  ArrowLeft,
  FileCheck2,
  Layers,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Hash,
  ShieldAlert,
  GitCommit,
  CheckSquare,
  Square,
  Lock,
  RotateCcw,
} from "lucide-react";
import {
  VerificationDetailResponse,
  AuditLogItem,
  VerificationDecision,
} from "@/types/verification";
import {
  getVerificationDetail,
  submitVerificationDecision,
  startReview,
  reopenVerification,
  getFindingAuditTrail,
} from "@/lib/api/verification";

export default function VerificationReviewWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuth();
  const conflictId = params?.id as string;

  // State
  const [data, setData] = useState<VerificationDetailResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Decision Form State
  const [selectedDecision, setSelectedDecision] = useState<VerificationDecision>("CONFIRMED");
  const [justification, setJustification] = useState("");
  const [officerNotes, setOfficerNotes] = useState("");
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [hasConfirmedInspection, setHasConfirmedInspection] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reopen Form State
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenJustification, setReopenJustification] = useState("");
  const [isReopening, setIsReopening] = useState(false);

  // Active Tab for Left Column
  const [activeTab, setActiveTab] = useState<"evidence" | "history" | "audit">("evidence");

  // Load Dossier
  const loadDossier = useCallback(async () => {
    if (!conflictId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [detail, logs] = await Promise.all([
        getVerificationDetail(conflictId, token),
        getFindingAuditTrail(conflictId, token).catch(() => []),
      ]);
      setData(detail);
      setAuditLogs(logs);

      // Pre-select all available evidence IDs
      if (detail.associated_evidence && detail.associated_evidence.length > 0) {
        setSelectedEvidenceIds(detail.associated_evidence.map((e) => e.id));
      }
    } catch (err: any) {
      console.error("Dossier load error:", err);
      setError(err.message || "Failed to load verification dossier");
    } finally {
      setIsLoading(false);
    }
  }, [conflictId, token]);

  useEffect(() => {
    loadDossier();
  }, [loadDossier]);

  // Handle Start Review
  const handleStartReview = async () => {
    if (!conflictId) return;
    setIsSubmitting(true);
    try {
      await startReview(conflictId, "Officer opened verification workspace.", token);
      await loadDossier();
    } catch (err: any) {
      alert(err.message || "Failed to start review");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Submit Decision
  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !conflictId) return;

    if (justification.trim().length < 10) {
      alert("Statutory justification must be at least 10 characters long.");
      return;
    }
    if (!hasConfirmedInspection) {
      alert("You must confirm that you have inspected the primary evidence.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitVerificationDecision(
        conflictId,
        {
          decision: selectedDecision,
          justification,
          evidenceReferences: selectedEvidenceIds,
          notes: officerNotes || undefined,
          expectedPreviousStatus: data.item.verification_status,
        },
        token
      );
      setJustification("");
      setOfficerNotes("");
      setHasConfirmedInspection(false);
      await loadDossier();
    } catch (err: any) {
      alert(err.message || "Failed to submit decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reopen
  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conflictId || reopenJustification.trim().length < 10) {
      alert("Please provide a detailed justification of at least 10 characters.");
      return;
    }

    setIsReopening(true);
    try {
      await reopenVerification(conflictId, reopenJustification, undefined, token);
      setShowReopenModal(false);
      setReopenJustification("");
      await loadDossier();
    } catch (err: any) {
      alert(err.message || "Failed to reopen verification");
    } finally {
      setIsReopening(false);
    }
  };

  // Toggle evidence selection
  const toggleEvidenceId = (id: string) => {
    setSelectedEvidenceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UNREVIEWED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-semibold bg-[#B56E48]/10 text-[#C47B50] border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Unreviewed
          </span>
        );
      case "IN_REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> In Review
          </span>
        );
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-semibold bg-[#23847D]/10 text-[#23847D] border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified (Confirmed)
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" /> Rejected (Dismissed)
          </span>
        );
      case "NEEDS_MORE_EVIDENCE":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30">
            <HelpCircle className="w-3.5 h-3.5" /> Needs More Evidence
          </span>
        );
      case "ESCALATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <ArrowUpRight className="w-3.5 h-3.5" /> Escalated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-semibold bg-[#0F1210]/10 text-[#6F7772] border border-[#6F7772]/30">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute
        requiredRole={["ADMIN", "GOVERNMENT_OFFICER", "SURVEYOR"]}
        moduleName="Statutory Verification Dossier"
      >
        <div className="flex h-[calc(100vh-3.5rem)] bg-[#0F1210] text-[#F4F0E8] font-sans">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#23847D] mx-auto" />
              <p className="text-sm text-[#8C988F]">Loading statutory verification dossier...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !data) {
    return (
      <ProtectedRoute
        requiredRole={["ADMIN", "GOVERNMENT_OFFICER", "SURVEYOR"]}
        moduleName="Statutory Verification Dossier"
      >
        <div className="flex h-[calc(100vh-3.5rem)] bg-[#0F1210] text-[#F4F0E8] font-sans">
          <Sidebar />
          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            <Link
              href="/verification"
              className="inline-flex items-center gap-2 text-xs text-[#8C988F] hover:text-[#F4F0E8] mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Queue
            </Link>
            <div className="p-6 rounded-[8px] bg-rose-500/10 border border-rose-500/30 text-rose-300 max-w-lg">
              <h2 className="text-lg font-bold mb-2">Finding Not Found</h2>
              <p className="text-sm">{error || "The requested conflict finding does not exist."}</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const item = data.item;
  const isCompleted = item.verification_status === "VERIFIED" || item.verification_status === "REJECTED";
  const canDecide = item.verification_status === "IN_REVIEW" || item.verification_status === "ESCALATED";
  const canApprove = user?.roles?.includes("ADMIN") || user?.roles?.includes("GOVERNMENT_OFFICER");

  return (
    <ProtectedRoute
      requiredRole={["ADMIN", "GOVERNMENT_OFFICER", "SURVEYOR"]}
      moduleName="Statutory Verification Dossier"
    >
      <div className="flex h-[calc(100vh-3.5rem)] bg-[#0F1210] text-[#F4F0E8] overflow-hidden select-none font-sans">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0F1210]">
          {/* Top Header */}
          <header className="border-b border-[rgba(244,240,232,0.08)] bg-[#141816]/60 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4 sm:py-5 sticky top-0 z-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Link
                    href="/verification"
                    className="p-1.5 rounded-[6px] bg-[#1A201D] hover:bg-[#222A26] text-[#D9D2C5] transition cursor-pointer"
                    title="Return to Verification Queue"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                  <span className="text-xs font-mono text-[#23847D] bg-[#23847D]/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    DOSSIER #{item.id.slice(0, 8)}
                  </span>
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#F4F0E8]">
                    {item.rule_name || item.conflict_type.replace(/_/g, " ")}
                  </h1>
                  {getStatusBadge(item.verification_status)}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8C988F] mt-2">
                  <span>Target: <span className="font-mono text-[#D9D2C5]">{item.entity_type} ({item.entity_id ? item.entity_id.slice(0, 8) : "—"})</span></span>
                  <span>Severity: <span className="font-semibold text-[#C47B50]">{item.severity}</span></span>
                  <span>
                    Reviewer:{" "}
                    <span className="text-[#D9D2C5] font-medium">
                      {item.assigned_reviewer ? item.assigned_reviewer.full_name : "Unassigned"}
                    </span>
                  </span>
                  <span>Confidence: <span className="font-mono font-semibold text-[#23847D]">{(item.confidence_score * 100).toFixed(1)}%</span></span>
                </div>
              </div>

              {/* Fast links */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/spatial-investigator?conflict=${item.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#1A201D] hover:bg-[#222A26] text-[#F4F0E8] text-xs font-medium border border-[rgba(244,240,232,0.12)] transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Ask AI Investigator</span>
                  <span className="sm:hidden">AI</span>
                </Link>
                {item.parcel_id && (
                  <Link
                    href={`/properties?id=${item.parcel_id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#1A201D] hover:bg-[#222A26] text-[#F4F0E8] text-xs font-medium border border-[rgba(244,240,232,0.12)] transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">View Parcel</span>
                    <span className="sm:hidden">Parcel</span>
                  </Link>
                )}
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 flex-1">
            {/* Left Column (8 cols): Spatial Dossier, Evidence Inspection & Audit Trail */}
            <div className="lg:col-span-8 space-y-6">
              {/* Finding Summary Card */}
              <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] p-5 space-y-4">
                <h3 className="text-sm font-semibold text-[#F4F0E8] uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#C47B50]" />
                  Detected Spatial Discrepancy
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#0F1210] p-4 rounded-[8px] border border-[rgba(244,240,232,0.08)] text-xs font-mono">
                  <div>
                    <span className="text-[#6F7772] block">Measured Value</span>
                    <span className="text-base font-bold text-[#F4F0E8]">
                      {item.measured_value !== null ? `${item.measured_value} ${item.measured_unit}` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6F7772] block">Threshold</span>
                    <span className="text-base font-bold text-[#D9D2C5]">
                      {item.threshold_value !== null ? `${item.threshold_value} ${item.measured_unit}` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6F7772] block">Rule ID</span>
                    <span className="text-[#D9D2C5]">{item.rule_id || "SPATIAL-RULE"}</span>
                  </div>
                  <div>
                    <span className="text-[#6F7772] block">Detection Date</span>
                    <span className="text-[#D9D2C5]">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="text-sm text-[#D9D2C5] leading-relaxed bg-[#0F1210]/40 p-4 rounded-[8px] border border-[rgba(244,240,232,0.08)]/60">
                  <div className="text-xs font-semibold text-[#6F7772] mb-1">Algorithmic Explanation:</div>
                  {item.explanation || "Automated spatial rule evaluation flagged discrepancy."}
                </div>
              </div>

              {/* Tabs: Primary Evidence | History | Audit Trail */}
              <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] overflow-hidden">
                <div className="flex border-b border-[rgba(244,240,232,0.08)] bg-[#0F1210]/60 px-4">
                  <button
                    onClick={() => setActiveTab("evidence")}
                    className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
                      activeTab === "evidence"
                        ? "border-emerald-500 text-[#23847D]"
                        : "border-transparent text-[#6F7772] hover:text-[#F4F0E8]"
                    }`}
                  >
                    <FileCheck2 className="w-4 h-4" />
                    Primary Primary Evidence ({data.associated_evidence.length})
                  </button>

                  <button
                    onClick={() => setActiveTab("history")}
                    className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
                      activeTab === "history"
                        ? "border-emerald-500 text-[#23847D]"
                        : "border-transparent text-[#6F7772] hover:text-[#F4F0E8]"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Decision History ({data.history.length})
                  </button>

                  <button
                    onClick={() => setActiveTab("audit")}
                    className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
                      activeTab === "audit"
                        ? "border-emerald-500 text-[#23847D]"
                        : "border-transparent text-[#6F7772] hover:text-[#F4F0E8]"
                    }`}
                  >
                    <Hash className="w-4 h-4" />
                    Cryptographic Audit Trail ({auditLogs.length})
                  </button>
                </div>

                <div className="p-5">
                  {/* TAB 1: Evidence Inspection */}
                  {activeTab === "evidence" && (
                    <div className="space-y-4">
                      <div className="text-xs text-[#6F7772] flex items-center justify-between">
                        <span>
                          Check the sensor datasets and evidence records inspected during your review. These IDs are permanently attached to the decision record.
                        </span>
                      </div>

                      {data.associated_evidence.length === 0 ? (
                        <div className="py-8 text-center text-[#6F7772] text-xs">
                          No direct evidence records linked to this entity geometry.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {data.associated_evidence.map((ev) => {
                            const isChecked = selectedEvidenceIds.includes(ev.id);
                            return (
                              <div
                                key={ev.id}
                                onClick={() => toggleEvidenceId(ev.id)}
                                className={`p-4 rounded-[8px] border cursor-pointer transition flex items-start gap-3 ${
                                  isChecked
                                    ? "bg-[#0F1210] border-emerald-500/40"
                                    : "bg-[#0F1210]/60 border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.12)]"
                                }`}
                              >
                                <div className="mt-0.5 text-[#23847D]">
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4" />
                                  ) : (
                                    <Square className="w-4 h-4 text-[#6F7772]" />
                                  )}
                                </div>
                                <div className="flex-1 text-xs space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-[#F4F0E8]">{ev.source_type}</span>
                                    <span className="px-2 py-0.5 rounded bg-[#1A201D] text-[10px] font-mono text-[#23847D]">
                                      {(ev.confidence_score * 100).toFixed(0)}% Confidence
                                    </span>
                                  </div>
                                  <div className="text-[#6F7772]">
                                    Classification: <span className="font-mono text-[#D9D2C5]">{ev.source_classification}</span> | Status: <span className="text-[#23847D]">{ev.status}</span>
                                  </div>
                                  <div className="text-[#6F7772] font-mono text-[11px]">
                                    Evidence UUID: {ev.id}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: Decision History */}
                  {activeTab === "history" && (
                    <div className="space-y-4">
                      {data.history.length === 0 ? (
                        <div className="py-8 text-center text-[#6F7772] text-xs">
                          No statutory verification decisions recorded yet.
                        </div>
                      ) : (
                        <div className="relative pl-6 border-l-2 border-[rgba(244,240,232,0.08)] space-y-6">
                          {data.history.map((rec, i) => (
                            <div key={rec.id} className="relative">
                              <div className="absolute -left-[31px] top-0 w-3.5 h-3.5 rounded-[4px] bg-[#23847D] border-2 border-[#F4F0E8]" />
                              <div className="bg-[#0F1210] p-4 rounded-[8px] border border-[rgba(244,240,232,0.08)] space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-[#F4F0E8]">{rec.action}</span>
                                  <span className="text-[#6F7772]">{new Date(rec.created_at).toLocaleString()}</span>
                                </div>
                                <div className="text-[#6F7772]">
                                  Officer: <span className="text-[#F4F0E8] font-medium">{rec.officer_name}</span> | Transition:{" "}
                                  <span className="font-mono text-[#C47B50]">{rec.previous_status}</span> &rarr;{" "}
                                  <span className="font-mono text-[#23847D]">{rec.new_status}</span>
                                </div>
                                <div className="bg-[#141816]/60 p-3 rounded-[6px] border border-[rgba(244,240,232,0.08)] text-[#D9D2C5] italic">
                                  &quot;{rec.justification}&quot;
                                </div>
                                {rec.confidence_at_review !== null && rec.confidence_at_review !== undefined && (
                                  <div className="text-[11px] text-[#6F7772]">
                                    Snapshotted confidence at review: {(rec.confidence_at_review * 100).toFixed(1)}%
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: Cryptographic Audit Trail */}
                  {activeTab === "audit" && (
                    <div className="space-y-4">
                      <div className="text-xs text-[#6F7772] flex items-center justify-between">
                        <span>
                          Immutable, SHA-256 chained audit sequence recording every state mutation.
                        </span>
                      </div>

                      {auditLogs.length === 0 ? (
                        <div className="py-8 text-center text-[#6F7772] text-xs">
                          No audit events recorded for this entity yet.
                        </div>
                      ) : (
                        <div className="space-y-3 font-mono text-[11px]">
                          {auditLogs.map((log) => (
                            <div
                              key={log.id}
                              className="p-4 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.08)] space-y-2"
                            >
                              <div className="flex items-center justify-between border-b border-[rgba(244,240,232,0.08)] pb-2">
                                <span className="font-bold text-[#23847D]">LOG #{log.id} — {log.action}</span>
                                <span className="text-[#6F7772]">{new Date(log.created_at).toLocaleString()}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[#6F7772]">
                                <div>
                                  <span className="text-[#6F7772] block">Previous Hash (Anchor):</span>
                                  <span className="text-[#6F7772] truncate block">{log.prev_hash.slice(0, 24)}...</span>
                                </div>
                                <div>
                                  <span className="text-[#6F7772] block">Current Hash:</span>
                                  <span className="text-[#23847D] truncate block">{log.current_hash.slice(0, 24)}...</span>
                                </div>
                              </div>
                              {log.new_state && (
                                <div className="mt-2 p-2 rounded bg-[#141816]/80 text-[10px] text-[#D9D2C5] break-all">
                                  {JSON.stringify(log.new_state)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (4 cols): Statutory Action & Decision Panel */}
            <div className="lg:col-span-4 space-y-6">
              {/* Reviewer Action Card */}
              <div className="bg-[#141816]/80 border border-[rgba(244,240,232,0.08)] rounded-[8px] p-5 space-y-4 shadow-sm sticky top-28">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#F4F0E8] flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#23847D]" />
                    Statutory Action Panel
                  </h3>
                </div>

                {/* State: UNREVIEWED */}
                {item.verification_status === "UNREVIEWED" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-[8px] bg-[#B56E48]/10 border border-amber-500/30 text-xs text-[#F4F0E8] space-y-2">
                      <div className="font-semibold">Pending Initial Officer Review</div>
                      <p className="text-amber-200/80">
                        This finding has not yet been opened for statutory inspection.
                      </p>
                    </div>

                    <button
                      onClick={handleStartReview}
                      disabled={isSubmitting}
                      className="w-full py-2.5 rounded-[6px] bg-[#23847D] text-[#F4F0E8] font-bold text-xs hover:bg-emerald-400 transition flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                      Start Human Review (Mark In-Review)
                    </button>
                  </div>
                )}

                {/* State: IN_REVIEW or ESCALATED */}
                {canDecide && !canApprove && (
                  <div className="p-4 rounded-[8px] bg-[#161B18] border border-[rgba(244,240,232,0.08)] space-y-2 text-xs font-mono">
                    <div className="flex items-center gap-2 text-[#4ADE80] font-bold">
                      <UserCheck className="w-4 h-4" />
                      <span>Field Inspection Mode (Surveyor)</span>
                    </div>
                    <p className="text-[#94A3B8] font-sans leading-relaxed">
                      You are authenticated with Surveyor clearance. You may inspect the evidence chain and submitted measurements. Statutory determinations and legal sealing require Town Planning Officer or Admin authorization.
                    </p>
                  </div>
                )}

                {canDecide && canApprove && (
                  <form onSubmit={handleSubmitDecision} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#D9D2C5] mb-1.5">
                        Statutory Determination
                      </label>
                      <div className="space-y-2">
                        {[
                          {
                            value: "CONFIRMED",
                            label: "Confirm Discrepancy",
                            sub: "Discrepancy verified against evidence (Status -> VERIFIED)",
                            color: "hover:border-emerald-500/50",
                          },
                          {
                            value: "NOT_CONFIRMED",
                            label: "Reject / Dismiss Finding",
                            sub: "False positive or permissible margin (Status -> REJECTED)",
                            color: "hover:border-rose-500/50",
                          },
                          {
                            value: "INSUFFICIENT_EVIDENCE",
                            label: "Request More Evidence",
                            sub: "Requires additional ground survey (Status -> NEEDS EVIDENCE)",
                            color: "hover:border-orange-500/50",
                          },
                          {
                            value: "ESCALATE",
                            label: "Escalate to Senior Officer",
                            sub: "Complex jurisdiction or legal boundary (Status -> ESCALATED)",
                            color: "hover:border-purple-500/50",
                          },
                        ].map((opt) => (
                          <div
                            key={opt.value}
                            onClick={() => setSelectedDecision(opt.value as VerificationDecision)}
                            className={`p-3 rounded-[6px] border cursor-pointer transition text-xs ${
                              selectedDecision === opt.value
                                ? "bg-[#0F1210] border-emerald-500 ring-1 ring-emerald-500/30"
                                : `bg-[#0F1210]/60 border-[rgba(244,240,232,0.08)] ${opt.color}`
                            }`}
                          >
                            <div className="font-semibold text-[#F4F0E8]">{opt.label}</div>
                            <div className="text-[11px] text-[#6F7772] mt-0.5">{opt.sub}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#D9D2C5] mb-1">
                        Mandatory Statutory Justification <span className="text-rose-400">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        placeholder="Detail the spatial evidence inspected, measurements verified, and statutory rationale..."
                        className="w-full p-2.5 rounded-[6px] bg-[#0F1210] border border-[rgba(244,240,232,0.08)] text-[#F4F0E8] text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <div className="text-[10px] text-[#6F7772] mt-1">Minimum 10 characters required for permanent audit trail.</div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#D9D2C5] mb-1">
                        Reviewer Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={officerNotes}
                        onChange={(e) => setOfficerNotes(e.target.value)}
                        placeholder="Internal departmental notes..."
                        className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#0F1210] border border-[rgba(244,240,232,0.08)] text-[#F4F0E8] text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Attestation Checkbox */}
                    <div className="p-3 rounded-[6px] bg-[#0F1210] border border-[rgba(244,240,232,0.08)] space-y-2">
                      <label className="flex items-start gap-2.5 text-xs text-[#D9D2C5] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={hasConfirmedInspection}
                          onChange={(e) => setHasConfirmedInspection(e.target.checked)}
                          className="mt-0.5 rounded bg-[#141816] border-[rgba(244,240,232,0.12)] text-emerald-500 focus:ring-0"
                        />
                        <span>
                          I confirm that I have inspected the linked Primary evidence items and am submitting this official determination under statutory authority.
                        </span>
                      </label>
                      <div className="text-[10px] text-[#6F7772] font-mono">
                        Confidence snapshot: {(item.confidence_score * 100).toFixed(1)}% | Evidence attached: {selectedEvidenceIds.length}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !hasConfirmedInspection || justification.trim().length < 10}
                      className="w-full py-2.5 rounded-[6px] bg-[#23847D] text-[#F4F0E8] font-bold text-xs hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      Submit Authoritative Decision
                    </button>
                  </form>
                )}

                {/* State: VERIFIED or REJECTED (Completed) */}
                {isCompleted && (
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-[8px] border text-xs space-y-2 ${
                        item.verification_status === "VERIFIED"
                          ? "bg-[#23847D]/10 border-emerald-500/30 text-emerald-300"
                          : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                      }`}
                    >
                      <div className="font-bold flex items-center gap-2">
                        {item.verification_status === "VERIFIED" ? (
                          <CheckCircle2 className="w-4 h-4 text-[#23847D]" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                        Review Completed ({item.verification_status})
                      </div>
                      <p className="text-[#D9D2C5]">
                        This finding was finalized by an authorized officer. Geometric findings remain preserved in the registry.
                      </p>
                      {item.reviewed_at && (
                        <div className="text-[11px] text-[#6F7772]">
                          Reviewed: {new Date(item.reviewed_at).toLocaleString()}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setShowReopenModal(true)}
                      className="w-full py-2 rounded-[6px] bg-[#1A201D] hover:bg-[#1A201D] text-[#F4F0E8] text-xs font-semibold border border-[rgba(244,240,232,0.12)] transition flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#C47B50]" />
                      Reopen Review (Requires Justification)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Reopen Review Modal */}
        {showReopenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#F4F0E8] flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-[#C47B50]" />
                  Reopen Verification Review
                </h3>
                <button
                  onClick={() => setShowReopenModal(false)}
                  className="text-[#6F7772] hover:text-[#F4F0E8]"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[#6F7772]">
                Reopening transitions this completed finding back to <span className="font-semibold text-blue-400">IN_REVIEW</span>.
                All previous decisions remain preserved in the immutable audit trail.
              </p>

              <form onSubmit={handleReopenSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#D9D2C5] mb-1">
                    Statutory Reason for Reopening <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reopenJustification}
                    onChange={(e) => setReopenJustification(e.target.value)}
                    placeholder="e.g., Owner submitted freshly commissioned DGPS survey contesting encroachment finding..."
                    className="w-full p-2.5 rounded-[6px] bg-[#0F1210] border border-[rgba(244,240,232,0.08)] text-[#F4F0E8] text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <div className="text-[10px] text-[#6F7772] mt-1">Minimum 10 characters required.</div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReopenModal(false)}
                    className="px-4 py-2 rounded-[6px] bg-[#1A201D] text-[#D9D2C5] text-xs font-medium hover:bg-[#1A201D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isReopening || reopenJustification.trim().length < 10}
                    className="px-4 py-2 rounded-[6px] bg-[#B56E48] text-[#F4F0E8] text-xs font-bold hover:bg-amber-400 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isReopening ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    Confirm Reopen
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
