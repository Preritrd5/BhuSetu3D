"use client";

/**
 * BhuSetu 3D Evidence Detail Page
 * Evidence-Backed 3D Property Intelligence Platform
 */
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { SpatialLoadingRoller } from "@/components/common/SpatialLoadingRoller";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE } from "@/lib/api/config";
import {
  FileCheck2,
  ArrowLeft,
  Database,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  GitBranch,
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

export default function EvidenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const evidenceId = params.id as string;

  const [evidence, setEvidence] = useState<EvidenceItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/evidence/${evidenceId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          throw new Error(`Failed to load evidence record (HTTP ${res.status})`);
        }
        const data = await res.json();
        setEvidence(data);
      } catch (err: any) {
        setError(err.message || "Failed to load evidence.");
      } finally {
        setIsLoading(false);
      }
    }

    if (evidenceId) {
      fetchDetail();
    }
  }, [evidenceId, token]);

  const getClassificationBadge = (cls: string) => {
    switch (cls) {
      case "OBSERVED":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-500/40";
      case "AI_ASSISTED":
        return "bg-purple-950/80 text-purple-300 border-purple-500/40";
      case "DERIVED":
        return "bg-cyan-950/80 text-[#C47B50] border-cyan-500/40";
      case "INFERRED":
        return "bg-amber-950/80 text-[#F4F0E8] border-amber-500/40";
      case "VERIFIED":
        return "bg-blue-950/80 text-blue-300 border-blue-500/40";
      default:
        return "bg-[#0F1210] text-[#6F7772] border-[#6F7772]";
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[#0F1210] text-[#F4F0E8] select-none font-sans overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-y-auto bg-[#0F1210]">
          {/* Header */}
          <div className="border-b border-[rgba(244,240,232,0.08)] bg-[#0F1210] px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/evidence"
                className="p-1.5 bg-[#0F1210] border border-[rgba(244,240,232,0.08)] rounded text-[#6F7772] hover:text-[#F4F0E8] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#23847D] font-bold block">
                  EVIDENCE VAULT RECORD
                </span>
                <h1 className="text-lg font-bold text-[#F4F0E8] flex items-center gap-2">
                  Evidence Detail: <span className="font-mono text-cyan-300">{evidenceId}</span>
                </h1>
              </div>
            </div>

            <Link
              href="/evidence"
              className="text-xs text-[#6F7772] hover:text-[#C47B50] font-mono text-xs transition-colors"
            >
              ← Back to Vault
            </Link>
          </div>

          <div className="p-6 max-w-4xl space-y-6">
            {isLoading ? (
              <div className="py-16">
                <SpatialLoadingRoller
                  size="md"
                  label="LOADING EVIDENCE PROVENANCE"
                  subtitle="Resolving SHA-256 hash, sensor telemetry & flight mission lineage..."
                  showCoordinates={false}
                />
              </div>
            ) : error || !evidence ? (
              <div className="p-6 bg-rose-950/40 border border-rose-500/30 rounded-[8px] text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error || "Evidence item not found."}
              </div>
            ) : (
              <>
                {/* Top Metrics Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px]">
                    <span className="text-[10px] font-mono uppercase text-[#6F7772] block mb-1">
                      TARGET ENTITY
                    </span>
                    <div className="text-lg font-bold font-mono text-[#23847D]">
                      {evidence.entity_type}
                    </div>
                    <span className="text-[11px] font-mono text-[#6F7772] break-all mt-1 block">
                      {evidence.entity_id}
                    </span>
                  </div>

                  <div className="p-4 bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px]">
                    <span className="text-[10px] font-mono uppercase text-[#6F7772] block mb-1">
                      CLASSIFICATION
                    </span>
                    <div className="mt-1">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-mono border font-semibold inline-block ${getClassificationBadge(
                          evidence.source_classification
                        )}`}
                      >
                        {evidence.source_classification}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#6F7772] block mt-2">
                      {evidence.source_classification === "OBSERVED"
                        ? "Physical Ground Truth Measurement"
                        : evidence.source_classification === "AI_ASSISTED"
                        ? "ML Detection & Polygon Extraction"
                        : "Deterministic Geometric Computation"}
                    </span>
                  </div>

                  <div className="p-4 bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px]">
                    <span className="text-[10px] font-mono uppercase text-[#6F7772] block mb-1">
                      CONFIDENCE SCORE
                    </span>
                    <div className="text-2xl font-bold font-mono text-emerald-400">
                      {(evidence.confidence_score * 100).toFixed(1)}%
                    </div>
                    <span className="text-[10px] font-mono text-[#6F7772] block mt-1">
                      Lifecycle Status: {evidence.status}
                    </span>
                  </div>
                </div>

                {/* Dataset & Sensor Lineage */}
                <div className="p-5 bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" /> Spatial Dataset & Sensor Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3 bg-[#0F1210] rounded border border-[rgba(244,240,232,0.08)]/50">
                      <span className="text-[#6F7772] block text-[10px]">Dataset Name:</span>
                      <span className="text-[#F4F0E8] font-semibold">{evidence.dataset_name || "Authoritative Survey Cadastre"}</span>
                    </div>
                    <div className="p-3 bg-[#0F1210] rounded border border-[rgba(244,240,232,0.08)]/50">
                      <span className="text-[#6F7772] block text-[10px]">Source Organization:</span>
                      <span className="text-[#F4F0E8] font-semibold">{evidence.source_name || "State Land Directorate"}</span>
                    </div>
                    <div className="p-3 bg-[#0F1210] rounded border border-[rgba(244,240,232,0.08)]/50">
                      <span className="text-[#6F7772] block text-[10px]">Processing Method:</span>
                      <span className="text-[#F4F0E8]">{evidence.processing_method}</span>
                    </div>
                    <div className="p-3 bg-[#0F1210] rounded border border-[rgba(244,240,232,0.08)]/50">
                      <span className="text-[#6F7772] block text-[10px]">Model Version:</span>
                      <span className="text-cyan-400">{evidence.model_version || "Deterministic v1.0"}</span>
                    </div>
                  </div>
                </div>

                {/* Factors */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Supporting Factors ({evidence.supporting_factors.length})
                    </h3>
                    {evidence.supporting_factors.length > 0 ? (
                      evidence.supporting_factors.map((f, i) => (
                        <div key={i} className="text-xs p-2.5 bg-[#0F1210] rounded border border-emerald-500/20 text-[#D9D2C5]">
                          • {f}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#6F7772] italic">No supporting factors explicitly documented.</p>
                    )}
                  </div>

                  <div className="p-5 bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Limiting Factors ({evidence.limiting_factors.length})
                    </h3>
                    {evidence.limiting_factors.length > 0 ? (
                      evidence.limiting_factors.map((f, i) => (
                        <div key={i} className="text-xs p-2.5 bg-[#0F1210] rounded border border-amber-500/20 text-[#D9D2C5]">
                          • {f}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#6F7772] italic">No limiting factors or constraints recorded.</p>
                    )}
                  </div>
                </div>

                {/* Metadata JSON */}
                <div className="p-5 bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-[8px] space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6F7772]">
                    Evidence Metadata JSON
                  </h3>
                  <pre className="p-4 bg-[#0F1210] rounded-[8px] text-xs font-mono text-[#D9D2C5] overflow-x-auto border border-[rgba(244,240,232,0.08)]">
                    {JSON.stringify(evidence.evidence_metadata, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
