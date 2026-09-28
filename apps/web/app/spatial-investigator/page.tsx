"use client";

/**
 * BhuSetu 3D AI Spatial Investigator Workspace
 * Evidence-Backed 3D Property Intelligence Platform
 */
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { SpatialLoadingRoller } from "@/components/common/SpatialLoadingRoller";
import { useAuth } from "@/hooks/useAuth";
import {
  Sparkles,
  Search,
  Compass,
  Layers,
  Building2,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  GitBranch,
  Cpu,
  ArrowRight,
  Zap,
  Sliders,
  X,
  History,
} from "lucide-react";

interface SpatialIntent {
  intent: string;
  entity_type?: string;
  target_entity_type?: string;
  relationship?: string;
  property_id?: string;
  parcel_id?: string;
  building_id?: string;
  infrastructure_type?: string;
  distance_meters?: number;
  conflict_type?: string;
  severity?: string;
  min_confidence?: number;
  limit: number;
  clarification_needed: boolean;
  clarification_question?: string;
  unsupported_reason?: string;
}

interface InvestigationResultItem {
  entity_id: string;
  entity_type: string;
  entity_code?: string;
  title: string;
  subtitle?: string;
  finding_type?: string;
  measured_value?: number;
  measured_unit?: string;
  deviation_value?: number;
  confidence_score?: number;
  evidence_count: number;
  evidence_summary?: string;
  has_discrepancy: boolean;
  metadata: Record<string, any>;
}

interface InvestigationExplanation {
  summary: string;
  why_flagged?: string;
  evidence_context?: string;
  provenance_context?: string;
  confidence_explanation?: string;
  limitations_notice: string;
  governance_notice: string;
}

interface MapActionDirective {
  action_type: string;
  target_ids: string[];
  primary_id?: string;
  zoom_level?: number;
  highlight_features: any[];
}

interface InvestigationResponse {
  request_id: string;
  question: string;
  interpreted_intent: SpatialIntent;
  status: string;
  results_count: number;
  results: InvestigationResultItem[];
  explanation: InvestigationExplanation;
  map_directive?: MapActionDirective;
  execution_trace: Record<string, any>;
}

interface SuggestedQuestion {
  id: string;
  category: string;
  question: string;
  description: string;
  requires_property_context: boolean;
}

function SpatialInvestigatorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token } = useAuth();

  const urlQuery = searchParams.get("q") || "";
  const urlParcel = searchParams.get("parcel") || "";
  const urlConflict = searchParams.get("conflict") || "";

  // State
  const [question, setQuestion] = useState(urlQuery);
  const [activeContextId, setActiveContextId] = useState<string>(urlParcel || urlConflict || "");
  const [activeContextType, setActiveContextType] = useState<string>(urlConflict ? "CONFLICT" : (urlParcel ? "PARCEL" : ""));
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<InvestigationResponse | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
  const [showTrace, setShowTrace] = useState(false);

  // Fetch suggested questions
  useEffect(() => {
    async function loadSuggested() {
      try {
        const res = await fetch("http://localhost:8000/api/v1/spatial-investigator/suggested-questions");
        if (res.ok) {
          const data = await res.json();
          setSuggestedQuestions(data);
        }
      } catch (err) {
        console.error("Failed to load suggested questions", err);
      }
    }
    loadSuggested();
  }, []);

  // Auto-execute if query parameter exists
  useEffect(() => {
    if (urlQuery && !response && !isLoading) {
      handleInvestigate(urlQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  const handleInvestigate = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    // Staged progress indicators for genuine user feedback
    setLoadingStage("Understanding natural language spatial query...");
    setTimeout(() => setLoadingStage("Validating spatial intent & metric boundaries..."), 300);
    setTimeout(() => setLoadingStage("Executing PostGIS conformal spatial operations..."), 600);
    setTimeout(() => setLoadingStage("Retrieving sensor evidence & provenance lineage..."), 900);
    setTimeout(() => setLoadingStage("Synthesizing grounded explanation..."), 1200);

    try {
      const res = await fetch("http://localhost:8000/api/v1/spatial-investigator/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question: q.trim(),
          context_entity_type: activeContextType || undefined,
          context_entity_id: activeContextId || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Spatial investigation failed");
      }

      const data: InvestigationResponse = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message || "Failed to complete spatial investigation.");
    } finally {
      setIsLoading(false);
      setLoadingStage("");
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "SUCCESS":
        return "bg-[#176C68]/20 text-[#23847D] border-[#176C68]/40 rounded-[4px]";
      case "CLARIFICATION_NEEDED":
        return "bg-[#B56E48]/20 text-[#C47B50] border-[#B56E48]/40 rounded-[4px]";
      case "NO_RESULTS":
        return "bg-[#1A201D] text-[#D9D2C5] border-[rgba(244,240,232,0.12)] rounded-[4px]";
      case "UNSUPPORTED":
        return "bg-rose-950/40 text-rose-300 border-rose-800/40 rounded-[4px]";
      default:
        return "bg-[#141816] text-[#6F7772] border-[rgba(244,240,232,0.08)] rounded-[4px]";
    }
  };

  const getConfidenceColor = (score?: number) => {
    if (!score) return "text-[#6F7772] bg-[#141816] border-[rgba(244,240,232,0.08)]";
    if (score >= 0.85) return "text-[#23847D] bg-[#176C68]/20 border-[#176C68]/40";
    if (score >= 0.65) return "text-[#C47B50] bg-[#B56E48]/20 border-[#B56E48]/40";
    return "text-rose-400 bg-rose-950/40 border-rose-800/40";
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[#0F1210] text-[#F4F0E8] overflow-hidden select-none font-sans">
        <Sidebar />

        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0F1210]">
          {/* Header */}
          <div className="border-b border-[rgba(244,240,232,0.08)] bg-[#0F1210] px-8 py-5 sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#23847D] uppercase tracking-wider font-bold bg-[#141816] px-2 py-0.5 rounded-[4px] border border-[rgba(244,240,232,0.08)] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#C47B50]" />
                  GROUNDED SPATIAL INTELLIGENCE
                </span>
                <span className="text-xs text-[#6F7772]">•</span>
                <span className="text-xs font-mono text-[#6F7772]">PostGIS 3.4 Conformal Engine</span>
              </div>
              <h1 className="text-xl font-bold font-mono text-[#F4F0E8] flex items-center gap-2.5 mt-1.5">
                <Compass className="w-5 h-5 text-[#C47B50]" />
                Natural-Language Spatial Query & Investigation
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/spatial-analysis"
                className="px-3.5 py-1.5 rounded-[6px] bg-[#141816] hover:bg-[#1A201D] text-[#D9D2C5] text-xs font-mono flex items-center gap-2 border border-[rgba(244,240,232,0.08)] transition-colors"
              >
                <Layers className="w-4 h-4 text-[#23847D]" />
                Spatial Analysis
              </Link>
              <Link
                href="/conflicts"
                className="px-3.5 py-1.5 rounded-[6px] bg-[#141816] hover:bg-[#1A201D] text-[#D9D2C5] text-xs font-mono flex items-center gap-2 border border-[rgba(244,240,232,0.08)] transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-[#C47B50]" />
                Discrepancy Vault
              </Link>
            </div>
          </div>

          <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
            {/* Mandatory Governance Notice */}
            <div className="bg-[#141816] border border-[#B56E48]/30 rounded-[8px] p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-[#C47B50] mt-0.5 shrink-0" />
              <div className="text-sm">
                <span className="font-semibold text-[#C47B50] font-mono">Mandatory Governance Notice: </span>
                <span className="text-[#D9D2C5] leading-relaxed">
                  Spatial discrepancies are advisory technical findings indicating geometric misalignment or setback
                  clearance non-compliance for surveyor inspection. They do not constitute legal adjudications or
                  determinations of illegality. The AI investigator translates natural language into validated PostGIS
                  operations and does not generate arbitrary SQL.
                </span>
              </div>
            </div>

            {/* Active Context Banner (if pre-selected property or conflict) */}
            {activeContextId && (
              <div className="bg-[#141816] border border-[#176C68]/40 rounded-[8px] px-4 py-3 flex items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#23847D] shrink-0" />
                  <span className="text-[#6F7772]">Target Entity Context:</span>
                  <span className="font-mono text-[#23847D] font-semibold uppercase">{activeContextType}</span>
                  <span className="font-mono text-[#F4F0E8] bg-[#0F1210] px-2 py-0.5 rounded-[4px] border border-[rgba(244,240,232,0.12)]">
                    {activeContextId}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setActiveContextId("");
                    setActiveContextType("");
                  }}
                  className="text-[#6F7772] hover:text-[#F4F0E8] p-1 hover:bg-[#0F1210] rounded transition-colors"
                  title="Clear active context"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Natural Language Query Bar */}
            <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[10px] p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#6F7772] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isLoading) handleInvestigate();
                    }}
                    placeholder="Ask about properties, boundary encroachments, setbacks, nearby roads, or evidence..."
                    className="w-full pl-11 pr-4 py-3 rounded-[6px] bg-[#0F1210] border border-[rgba(244,240,232,0.12)] text-xs text-[#F4F0E8] placeholder-[#6F7772] focus:outline-none focus:border-[#B56E48] font-mono"
                  />
                  {question && (
                    <button
                      onClick={() => setQuestion("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#6F7772] hover:text-[#D9D2C5]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleInvestigate()}
                  disabled={isLoading || !question.trim()}
                  className="px-5 py-3 rounded-[6px] bg-[#B56E48] hover:bg-[#C47B50] text-[#F4F0E8] font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 shrink-0"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Investigating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Investigate
                    </>
                  )}
                </button>
              </div>

              {/* Suggested Questions Pills */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6F7772] block">
                  Suggested Questions:
                </span>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((sq) => (
                    <button
                      key={sq.id}
                      onClick={() => {
                        setQuestion(sq.question);
                        handleInvestigate(sq.question);
                      }}
                      disabled={isLoading}
                      className="text-xs px-3 py-1.5 rounded-[6px] bg-[#0F1210] hover:bg-[#1A201D] text-[#D9D2C5] hover:text-[#F4F0E8] border border-[rgba(244,240,232,0.08)] hover:border-[#B56E48]/40 transition-colors text-left font-mono flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-[#C47B50] shrink-0" />
                      <span>{sq.question}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Loading Indicator with Multi-stage feedback */}
            {isLoading && (
              <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[10px] p-8 text-center space-y-3 shadow-sm">
                <SpatialLoadingRoller
                  size="md"
                  label={loadingStage || "AI REASONING IN PROGRESS"}
                  subtitle="Evaluating spatial rules & enforcing strict PostGIS schema constraints..."
                  showCoordinates={false}
                />
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="bg-[#141816] border border-rose-800/40 rounded-[8px] p-5 text-rose-300 text-xs font-mono flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-semibold block mb-0.5">Investigation Error:</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Investigation Response Presentation */}
            {response && !isLoading && (
              <div className="space-y-6">
                {/* Executive Summary Card */}
                <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[10px] p-6 space-y-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[rgba(244,240,232,0.08)]">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getStatusBadge(
                            response.status
                          )}`}
                        >
                          {response.status}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded-[4px] bg-[#1A201D] text-[#23847D] border border-[#176C68]/40">
                          {response.interpreted_intent.intent}
                        </span>
                        <span className="text-xs text-[#6F7772] font-mono">
                          ID: {response.request_id}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-[#F4F0E8]">{response.question}</h2>
                    </div>

                    <div className="flex items-center gap-3">
                      {response.results_count > 0 && (
                        <div className="text-right">
                          <div className="text-xs text-[#6F7772] mb-0.5">Findings Located</div>
                          <div className="text-xl font-bold font-mono text-[#23847D]">
                            {response.results_count}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Text */}
                  <div className="p-4 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.08)] text-xs text-[#D9D2C5] leading-relaxed font-sans">
                    {response.explanation.summary}
                  </div>

                  {/* Technical Rationale / Why Flagged */}
                  {response.explanation.why_flagged && (
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6F7772] flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-[#C47B50]" />
                        Geometric Rationale & Rule Evaluation:
                      </h3>
                      <p className="text-xs text-[#D9D2C5] leading-relaxed font-sans bg-[#0F1210] p-3.5 rounded-[6px] border border-[rgba(244,240,232,0.08)]">
                        {response.explanation.why_flagged}
                      </p>
                    </div>
                  )}

                  {/* Evidence & Confidence Factors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                    {response.explanation.evidence_context && (
                      <div className="p-3.5 rounded-lg bg-[#0F1210] border border-[rgba(244,240,232,0.08)] space-y-1">
                        <span className="font-semibold text-[#6F7772] uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                          Supporting Evidence & Sensors:
                        </span>
                        <p className="text-[#D9D2C5]">{response.explanation.evidence_context}</p>
                      </div>
                    )}

                    {response.explanation.confidence_explanation && (
                      <div className="p-3.5 rounded-lg bg-[#0F1210] border border-[rgba(244,240,232,0.08)] space-y-1">
                        <span className="font-semibold text-[#6F7772] uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#23847D]" />
                          Technical Reliability Rating:
                        </span>
                        <p className="text-[#D9D2C5]">{response.explanation.confidence_explanation}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Factual Results Table / Cards */}
                {response.results.length > 0 && (
                  <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[10px] p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#F4F0E8] flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#23847D]" />
                        Verified Spatial Records & Discrepancies ({response.results_count})
                      </h3>

                      {response.map_directive && (
                        <div className="flex items-center gap-2">
                          <Link
                            href={
                              response.map_directive.primary_id
                                ? `/properties?parcel=${response.map_directive.primary_id}`
                                : "/properties"
                            }
                            className="px-3 py-1.5 rounded-[6px] bg-[#1A201D] hover:bg-[#252E2A] border border-[rgba(244,240,232,0.12)] text-[#D9D2C5] text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            Focus on 2D Explorer
                          </Link>

                          <Link
                            href="/3d-city"
                            className="px-3 py-1.5 rounded-[6px] bg-[#B56E48] hover:bg-[#C47B50] text-[#F4F0E8] text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            Inspect in 3D City
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {response.results.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-[8px] bg-[#0F1210] border border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.16)] transition-colors space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#F4F0E8] font-mono">
                              {item.entity_code || item.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${getConfidenceColor(
                                item.confidence_score
                              )}`}
                            >
                              {item.confidence_score ? `${Math.round(item.confidence_score * 100)}% Conf` : "Verified"}
                            </span>
                          </div>

                          <p className="text-xs text-[#D9D2C5] leading-snug font-sans">{item.subtitle}</p>

                          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#6F7772] pt-2 border-t border-[rgba(244,240,232,0.08)]/60">
                            {item.measured_value !== undefined && item.measured_value !== null && (
                              <div>
                                Measurement:{" "}
                                <span className="text-[#23847D] font-bold">
                                  {item.measured_value.toFixed(2)} {item.measured_unit || ""}
                                </span>
                              </div>
                            )}
                            {item.deviation_value !== undefined && item.deviation_value !== null && (
                              <div>
                                Deviation:{" "}
                                <span className="text-amber-400 font-bold">
                                  {item.deviation_value.toFixed(2)} {item.measured_unit || ""}
                                </span>
                              </div>
                            )}
                            {item.finding_type && (
                              <div>
                                Type: <span className="text-[#D9D2C5]">{item.finding_type}</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Inspect Buttons */}
                          <div className="pt-2 flex items-center justify-end gap-3 text-xs">
                            {item.metadata?.conflict_id && (
                              <>
                                <Link
                                  href={`/verification/${item.metadata.conflict_id}`}
                                  className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-mono text-[11px]"
                                >
                                  Verify Finding <ChevronRight className="w-3 h-3" />
                                </Link>
                                <Link
                                  href={`/conflicts/${item.metadata.conflict_id}`}
                                  className="text-[#C47B50] hover:text-[#B56E48] inline-flex items-center gap-1 font-mono text-[11px]"
                                >
                                  Details <ChevronRight className="w-3 h-3" />
                                </Link>
                              </>
                            )}
                            {item.metadata?.parcel_id && (
                              <Link
                                href={`/properties?parcel=${item.metadata.parcel_id}`}
                                className="text-[#6F7772] hover:text-[#F4F0E8] inline-flex items-center gap-1 font-mono text-[11px]"
                              >
                                2D Map <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* "How This Was Analyzed" Collapsible Query Plan Card */}
                <div className="bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[10px] overflow-hidden shadow-sm">
                  <button
                    onClick={() => setShowTrace(!showTrace)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-[#1A201D] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#C47B50]" />
                      <span className="text-xs font-semibold text-[#F4F0E8] uppercase tracking-wider font-mono">
                        Auditable Query Plan & Execution Trace
                      </span>
                    </div>
                    {showTrace ? (
                      <ChevronUp className="w-4 h-4 text-[#6F7772]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#6F7772]" />
                    )}
                  </button>

                  {showTrace && (
                    <div className="p-4 border-t border-[rgba(244,240,232,0.08)] space-y-3 text-xs font-mono">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-2.5 rounded bg-[#0F1210] border border-[rgba(244,240,232,0.08)]">
                          <span className="text-[#6F7772] block text-[10px]">Interpreted Intent:</span>
                          <span className="text-[#23847D] font-semibold">{response.interpreted_intent.intent}</span>
                        </div>
                        <div className="p-2.5 rounded bg-[#0F1210] border border-[rgba(244,240,232,0.08)]">
                          <span className="text-[#6F7772] block text-[10px]">Approved PostGIS Tool:</span>
                          <span className="text-[#F4F0E8]">{response.execution_trace.tool_executed}</span>
                        </div>
                        <div className="p-2.5 rounded bg-[#0F1210] border border-[rgba(244,240,232,0.08)]">
                          <span className="text-[#6F7772] block text-[10px]">Metric CRS:</span>
                          <span className="text-[#F4F0E8]">{response.execution_trace.metric_crs}</span>
                        </div>
                        <div className="p-2.5 rounded bg-[#0F1210] border border-[rgba(244,240,232,0.08)]">
                          <span className="text-[#6F7772] block text-[10px]">Execution Duration:</span>
                          <span className="text-emerald-400">{response.execution_trace.duration_ms} ms</span>
                        </div>
                      </div>

                      <div className="p-3 rounded bg-[#0F1210] border border-[rgba(244,240,232,0.08)] text-[11px] text-[#6F7772] space-y-1 font-sans">
                        <div>
                          <strong className="text-[#D9D2C5]">Model Used:</strong> {response.execution_trace.model}
                        </div>
                        <div>
                          <strong className="text-[#D9D2C5]">Database Engine:</strong>{" "}
                          {response.execution_trace.database_platform}
                        </div>
                        <div>
                          <strong className="text-[#D9D2C5]">Limitations:</strong> {response.explanation.limitations_notice}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function SpatialInvestigatorPage() {
  return (
    <Suspense
      fallback={
        <SpatialLoadingRoller
          fullScreen={true}
          label="Loading AI Spatial Investigator"
          subtitle="Initializing Gemini spatial reasoning engine & PostGIS connection..."
        />
      }
    >
      <SpatialInvestigatorContent />
    </Suspense>
  );
}
