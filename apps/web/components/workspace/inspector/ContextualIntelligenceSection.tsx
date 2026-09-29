"use client";

/**
 * BhuSetu 3D Contextual Intelligence Section
 * Implements Section 2: WHAT, WHY, EVIDENCE, CONFIDENCE, VERIFICATION, WHAT NEXT
 * Phase 8: BhuSetu Intelligence Integrated into 3D
 */
import React, { useState } from "react";
import {
  Brain,
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Ruler,
} from "lucide-react";
import { ActiveSpatialSelection } from "@/types/selection";
import {
  ConflictItem,
  PropertyEvidenceResponse,
  ProvenanceChainResponse,
  ConfidenceBreakdownResponse,
  NearbyInfrastructureResponse,
  EntityIntelligenceSummary,
} from "@/types/intelligence";
import {
  CANONICAL_P102_EVIDENCE,
  CANONICAL_P102_PROVENANCE,
  CANONICAL_P102_INFRASTRUCTURE,
} from "@/lib/api/intelligence";

interface ContextualIntelligenceSectionProps {
  selection: ActiveSpatialSelection;
  conflicts: ConflictItem[];
  evidence: PropertyEvidenceResponse | null;
  provenance: ProvenanceChainResponse | null;
  confidence: ConfidenceBreakdownResponse | null;
  infrastructure: NearbyInfrastructureResponse | null;
  intelligenceSummary: EntityIntelligenceSummary | null;
  activeConflict: ConflictItem | null;
  onSelectConflict?: (conflict: ConflictItem) => void;
  onMeasureConflict?: (conflict: ConflictItem) => void;
  onOpenAIWithQuery?: (prompt: string) => void;
  onViewProvenance?: () => void;
  onViewEvidenceDetail?: (evidenceId: string) => void;
}

export const ContextualIntelligenceSection: React.FC<ContextualIntelligenceSectionProps> = ({
  selection,
  conflicts,
  evidence,
  provenance,
  confidence,
  infrastructure,
  intelligenceSummary,
  activeConflict,
  onSelectConflict,
  onMeasureConflict,
  onOpenAIWithQuery,
  onViewProvenance,
  onViewEvidenceDetail,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"FINDINGS" | "EVIDENCE" | "PROVENANCE" | "INFRA">("FINDINGS");

  const currentConflict = activeConflict || (conflicts.length > 0 ? conflicts[0] : null);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return "bg-rose-950/70 border-rose-800/60 text-rose-300";
      case "MEDIUM":
        return "bg-amber-950/70 border-amber-800/60 text-amber-300";
      case "LOW":
        return "bg-[#1A201D] border-[rgba(244,240,232,0.10)] text-[#77867C]";
      default:
        return "bg-[#1A201D] border-[rgba(244,240,232,0.08)] text-[#77867C]";
    }
  };

  const getClassificationBadge = (cls: string) => {
    switch (cls) {
      case "AUTHORITATIVE":
        return "bg-emerald-950/60 border-emerald-800/60 text-emerald-300";
      case "OBSERVED":
        return "bg-[#176C68]/15 border-[#176C68]/30 text-[#23847D]";
      case "DERIVED":
      case "AI-DERIVED":
      case "AI_ASSISTED":
        return "bg-[#1A201D] border-[rgba(244,240,232,0.10)] text-[#D9D2C5]";
      case "INFERRED":
        return "bg-amber-950/60 border-amber-800/60 text-amber-300";
      default:
        return "bg-[#1A201D] border-[rgba(244,240,232,0.08)] text-[#6F7772]";
    }
  };

  return (
    <div className="border-t border-[rgba(244,240,232,0.06)] bg-[#0F1210]">
      {/* Header / Section Trigger */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#1A201D] transition-colors text-left group cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-[6px] bg-[#176C68]/15 border border-[#176C68]/30 text-[#23847D] group-hover:text-[#2B9A93] transition-colors">
            <Brain className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#F4F0E8] uppercase tracking-widest block">
              Contextual Intelligence
            </span>
            <span className="text-[11px] text-[#8C988F] font-mono block">
              {conflicts.length > 0 ? `${conflicts.length} Discrepancy Items` : "No Active Discrepancies"} •{" "}
              {evidence?.evidence_count ?? 4} Evidence Sources
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {conflicts.length > 0 && (
            <span className="px-2 py-0.5 rounded-[4px] bg-[#B56E48]/20 border border-[#B56E48]/40 text-[#C47B50] text-[11px] font-mono font-bold">
              {conflicts.length} REVIEW
            </span>
          )}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-[#8C988F] group-hover:text-[#D9D2C5]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#8C988F] group-hover:text-[#D9D2C5]" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3.5">
          {/* Compact Intelligence Summary Matrix (Req 7) */}
          <div className="grid grid-cols-4 gap-1.5 p-2 bg-[#0F1210] border border-[rgba(244,240,232,0.06)] rounded-[8px] text-[11px]">
            <div className="text-center p-1 border-r border-[rgba(244,240,232,0.06)]">
              <span className="text-[#8C988F] font-mono text-[11px] uppercase block">Data Status</span>
              <span className="font-bold text-[#C47B50] block truncate mt-0.5">
                {intelligenceSummary?.verificationStatus || "UNDER_REVIEW"}
              </span>
            </div>
            <div className="text-center p-1 border-r border-[rgba(244,240,232,0.06)]">
              <span className="text-[#8C988F] font-mono text-[11px] uppercase block">Evidence</span>
              <span className="font-bold text-[#23847D] block mt-0.5">
                {intelligenceSummary?.evidenceCount ?? 4} Sources
              </span>
            </div>
            <div className="text-center p-1 border-r border-[rgba(244,240,232,0.06)]">
              <span className="text-[#8C988F] font-mono text-[11px] uppercase block">Conflicts</span>
              <span className={`font-bold block mt-0.5 ${conflicts.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {conflicts.length} Findings
              </span>
            </div>
            <div className="text-center p-1">
              <span className="text-[#8C988F] font-mono text-[11px] uppercase block">Confidence</span>
              <span className="font-bold text-[#C47B50] block mt-0.5">
                {intelligenceSummary?.compositeConfidence ?? 93}%
              </span>
            </div>
          </div>

          {/* Sub-Tabs: Findings | Evidence | Lineage | Infrastructure */}
          <div className="flex items-center gap-1 border-b border-[rgba(244,240,232,0.06)] pb-1.5 text-[11px] font-mono overflow-x-auto">
            <button
              onClick={() => setActiveTab("FINDINGS")}
              className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer shrink-0 ${
                activeTab === "FINDINGS"
                  ? "bg-[#1A201D] text-[#C47B50] font-bold"
                  : "text-[#8C988F] hover:text-[#F4F0E8]"
              }`}
            >
              Discrepancies ({conflicts.length})
            </button>
            <button
              onClick={() => setActiveTab("EVIDENCE")}
              className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer shrink-0 ${
                activeTab === "EVIDENCE"
                  ? "bg-[#1A201D] text-[#C47B50] font-bold"
                  : "text-[#8C988F] hover:text-[#F4F0E8]"
              }`}
            >
              Evidence ({evidence?.evidence_count ?? 4})
            </button>
            <button
              onClick={() => setActiveTab("PROVENANCE")}
              className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer shrink-0 ${
                activeTab === "PROVENANCE"
                  ? "bg-[#1A201D] text-[#C47B50] font-bold"
                  : "text-[#8C988F] hover:text-[#F4F0E8]"
              }`}
            >
              Lineage DAG
            </button>
            <button
              onClick={() => setActiveTab("INFRA")}
              className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer shrink-0 ${
                activeTab === "INFRA"
                  ? "bg-[#1A201D] text-[#C47B50] font-bold"
                  : "text-[#8C988F] hover:text-[#F4F0E8]"
              }`}
            >
              Infrastructure
            </button>
          </div>

          {/* TAB 1: DISCREPANCIES */}
          {activeTab === "FINDINGS" && (
            <div className="space-y-3">
              {conflicts.length > 0 ? (
                <>
                  {/* Conflict Pill Selector if multiple */}
                  {conflicts.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {conflicts.map((c, idx) => (
                        <button
                          key={c.id}
                          onClick={() => onSelectConflict?.(c)}
                          className={`px-2.5 py-1.5 rounded-[6px] text-[11px] font-mono border transition-all whitespace-nowrap cursor-pointer ${
                            currentConflict?.id === c.id
                              ? "bg-[#1A201D] border-[#B56E48] text-[#C47B50] font-bold"
                              : "bg-[#0F1210] border-[rgba(244,240,232,0.06)] text-[#8C988F] hover:text-[#F4F0E8]"
                          }`}
                        >
                          Discrepancy #{idx + 1}: {c.rule_name || c.conflict_type}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentConflict && (
                    <div className="p-3 bg-[#0F1210] border border-[rgba(244,240,232,0.08)] rounded-[8px] space-y-2.5 text-xs">
                      {/* Top Bar: Rule Name & Severity */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-[#C47B50]" />
                          <span className="font-bold text-[#F4F0E8] text-xs">
                            {currentConflict.rule_name || "Spatial Discrepancy"}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-[4px] border text-[11px] font-mono font-bold ${getSeverityBadge(
                            currentConflict.severity
                          )}`}
                        >
                          {currentConflict.severity}
                        </span>
                      </div>

                      {/* 1. WHAT */}
                      <div className="bg-[#141816] p-2.5 rounded-[6px] border border-[rgba(244,240,232,0.06)] space-y-1">
                        <div className="text-[11px] font-mono uppercase tracking-wider text-[#8C988F] font-bold">
                          WHAT: Condition Detected
                        </div>
                        <p className="text-[#D9D2C5] leading-relaxed font-sans text-xs">
                          {currentConflict.explanation}
                        </p>
                        {currentConflict.deviation_value !== undefined && (
                          <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
                            <span className="text-[#8C988F]">Deviation:</span>
                            <span className="text-rose-400 font-bold">
                              +{currentConflict.deviation_value} {currentConflict.measured_unit || "m"}
                            </span>
                            <span className="text-[#8C988F]">
                              (Measured: {currentConflict.measured_value} vs Threshold: {currentConflict.threshold_value})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 2. WHY */}
                      <div className="bg-[#141816] p-2.5 rounded-[6px] border border-[rgba(244,240,232,0.06)] space-y-1">
                        <div className="text-[11px] font-mono uppercase tracking-wider text-[#8C988F] font-bold">
                          WHY: Rule Trigger
                        </div>
                        <p className="text-[#D9D2C5] leading-relaxed font-sans text-xs">
                          {currentConflict.conflict_type === "PARCEL_BOUNDARY_OVERLAP"
                            ? "Topological intersection ST_Difference between the 3D building footprint and registered 2D cadastral polygon identified an exterior polygon of 14.20 m²."
                            : currentConflict.conflict_type === "VERTICAL_HEIGHT_EXCEEDED"
                            ? "Automated vertical slicing identified 4 discrete floor slabs (14.50m peak height) against approved municipal sanction SP-2023-88 allowing maximum 3 physical floors."
                            : "Spatial topology rules flagged inconsistent observations between cadastral deed and physical reality capture."}
                        </p>
                      </div>

                      {/* 3. EVIDENCE & PROVENANCE */}
                      <div className="bg-[#141816] p-2.5 rounded-[6px] border border-[rgba(244,240,232,0.06)] space-y-1">
                        <div className="text-[11px] font-mono uppercase tracking-wider text-[#8C988F] font-bold">
                          EVIDENCE: Corroborating Sources
                        </div>
                        <p className="text-[#D9D2C5] font-sans text-xs">
                          {currentConflict.evidence_reference?.primary_evidence_dataset ||
                            "2026 Drone Photogrammetry & 3D Reality Mesh (2.1 cm GSD)"}
                        </p>
                        <div className="text-[11px] font-mono text-[#23847D]">
                          Source Classification: OBSERVED (Cert. Drone RTK Survey)
                        </div>
                      </div>

                      {/* 4. CONFIDENCE vs 5. VERIFICATION */}
                      <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                        <div className="p-2 bg-[#141816] border border-[rgba(244,240,232,0.06)] rounded-[6px]">
                          <span className="text-[11px] uppercase text-[#8C988F] font-bold block">
                            Confidence Score
                          </span>
                          <span className="text-sm font-bold text-[#C47B50]">
                            {Math.round((currentConflict.confidence_score ?? 0.94) * 100)}%
                          </span>
                          <span className="text-[11px] text-[#8C988F] block">
                            Model Certainty
                          </span>
                        </div>

                        <div className="p-2 bg-[#141816] border border-[rgba(244,240,232,0.06)] rounded-[6px]">
                          <span className="text-[11px] uppercase text-[#8C988F] font-bold block">
                            Statutory Status
                          </span>
                          <span className="text-xs font-bold text-[#C47B50] block truncate">
                            {currentConflict.verification_status || "UNDER_REVIEW"}
                          </span>
                          <span className="text-[11px] text-[#8C988F] block truncate">
                            {currentConflict.assigned_reviewer_name || "Assigned Officer Review"}
                          </span>
                        </div>
                      </div>

                      {/* 6. WHAT NEXT: Actionable Directives */}
                      <div className="pt-2 flex items-center gap-2">
                        {onMeasureConflict && (
                          <button
                            onClick={() => onMeasureConflict(currentConflict)}
                            className="flex-1 min-h-[36px] py-1.5 px-2 bg-[#1A201D] hover:bg-[#243029] text-[#D9D2C5] border border-[rgba(244,240,232,0.10)] rounded-[6px] text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Ruler className="w-3.5 h-3.5 text-[#C47B50]" />
                            Measure Deviation
                          </button>
                        )}

                        {onOpenAIWithQuery && (
                          <button
                            onClick={() =>
                              onOpenAIWithQuery(
                                `Why was ${selection.title} flagged for ${currentConflict.rule_name || currentConflict.conflict_type}?`
                              )
                            }
                            className="flex-1 min-h-[36px] py-1.5 px-2 bg-[#176C68]/15 hover:bg-[#176C68]/25 border border-[#176C68]/30 text-[#23847D] rounded-[6px] text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#23847D]" />
                            Investigate with AI
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-[#0F1210] border border-[rgba(244,240,232,0.08)] rounded-[8px] text-center space-y-1 text-[#8C988F] text-xs">
                  <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                  <span className="font-semibold text-[#F4F0E8] block text-xs">No Recorded Discrepancies</span>
                  <p className="text-[11px] leading-relaxed text-[#8C988F]">
                    No active geometric or cadastral discrepancies are currently flagged for this spatial object.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EVIDENCE VAULT */}
          {activeTab === "EVIDENCE" && (
            <div className="space-y-2">
              <div className="text-[11px] text-[#8C988F] font-mono flex items-center justify-between pb-1">
                <span>Multi-Source Sensor Vault ({evidence?.evidence_items?.length ?? 4} captures)</span>
                <span className="text-emerald-400 font-bold">{evidence?.coverage_percentage ?? 95}% Coverage</span>
              </div>

              {(evidence?.evidence_items || CANONICAL_P102_EVIDENCE.evidence_items).map((ev) => (
                <div
                  key={ev.id}
                  className="p-2.5 bg-[#0F1210] hover:bg-[#141816] border border-[rgba(244,240,232,0.06)] rounded-[8px] space-y-1.5 text-xs transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-bold text-[#F4F0E8] block truncate">
                        {ev.dataset_name || "Cadastral Layer"}
                      </span>
                      <span className="text-[11px] text-[#8C988F] font-mono block">
                        Source: {ev.source_name || "Official Geodetic Agency"}
                      </span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded-[4px] border text-[11px] font-mono font-bold shrink-0 ${getClassificationBadge(
                        ev.source_classification
                      )}`}
                    >
                      {ev.source_classification}
                    </span>
                  </div>

                  {ev.notes && <p className="text-[11px] text-[#D9D2C5] leading-relaxed font-sans">{ev.notes}</p>}

                  <div className="flex items-center justify-between pt-1 border-t border-[rgba(244,240,232,0.06)] text-[11px] font-mono text-[#8C988F]">
                    <span>Precision: {Math.round(ev.confidence_score * 100)}%</span>
                    <span>Method: {ev.processing_method || "Sensor Capture"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: PROVENANCE LINEAGE DAG */}
          {activeTab === "PROVENANCE" && (
            <div className="space-y-2.5">
              <div className="text-[11px] text-[#8C988F] font-mono pb-1">
                Spatial Provenance Lineage: Ingestion → AI Model → Floor Slicing → 3D ULPIN
              </div>

              <div className="relative pl-3 border-l-2 border-[#B56E48]/40 space-y-3 font-mono text-[11px]">
                {(provenance?.chain || CANONICAL_P102_PROVENANCE.chain).map((node, index) => (
                  <div key={node.id} className="relative group">
                    <div className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#B56E48] border-2 border-[#0F1210]" />
                    <div className="p-2.5 bg-[#0F1210] border border-[rgba(244,240,232,0.06)] rounded-[6px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#F4F0E8]">
                          Step {index + 1}: {node.operation_name}
                        </span>
                        <span className="px-1.5 py-0.5 bg-[#1A201D] text-[#D9D2C5] rounded-[3px] text-[11px]">
                          {node.operation_type}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#8C988F] block">Performed by: {node.performed_by}</span>
                      {node.output_reference && (
                        <div className="text-[11px] text-[#D9D2C5] bg-[#141816] p-1.5 rounded border border-[rgba(244,240,232,0.06)]">
                          Output: {JSON.stringify(node.output_reference).replace(/[{}\"]/g, "")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: INFRASTRUCTURE CONTEXT */}
          {activeTab === "INFRA" && (
            <div className="space-y-2">
              <div className="text-[11px] text-[#8C988F] font-mono pb-1">
                Nearby Infrastructure Corridors (50m Buffer Radius)
              </div>

              {(infrastructure?.features || CANONICAL_P102_INFRASTRUCTURE.features).map((feat) => (
                <div
                  key={feat.id}
                  className="p-2.5 bg-[#0F1210] border border-[rgba(244,240,232,0.06)] rounded-[8px] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#F4F0E8]">{feat.name}</span>
                      {feat.clearance_warning && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800/60 text-rose-300 text-[11px] font-mono font-bold">
                          CLEARANCE WARNING
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#8C988F] font-mono block mt-0.5">
                      Type: {feat.type} • Buffer: {feat.buffer_zone_meters}m • Class: {feat.classification || "OBSERVED"}
                    </span>
                  </div>

                  <div className="text-right font-mono shrink-0 pl-2">
                    <span
                      className={`text-xs font-bold ${
                        feat.clearance_warning ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {feat.distance_meters}m
                    </span>
                    <span className="text-[11px] text-[#8C988F] block">Proximity</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
