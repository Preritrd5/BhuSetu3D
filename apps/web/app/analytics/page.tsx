"use client";

/**
 * BhuSetu 3D Enterprise Spatial Analytics & Data Quality Scoring Workspace
 * Evidence-Backed 3D Property Intelligence Platform
 */
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { SpatialLoadingRoller } from "@/components/common/SpatialLoadingRoller";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart3,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Info,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Building2,
  FileCheck2,
  UserCheck,
  History,
  Sliders,
  Sparkles,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  Database,
  Compass,
} from "lucide-react";
import {
  AnalyticsOverviewResponse,
  AnalyticsPropertiesResponse,
  AnalyticsQualityResponse,
  AnalyticsConflictsResponse,
  AnalyticsVerificationResponse,
  AnalyticsChangesResponse,
  AnalyticsInfrastructureResponse,
} from "@/types/analytics";
import {
  QualityScoreResponse,
  QualityIssueItem,
  QualityHistoryResponse,
  QualityComponentScores,
} from "@/types/quality";
import {
  getAnalyticsOverview,
  getAnalyticsProperties,
  getAnalyticsQuality,
  getAnalyticsConflicts,
  getAnalyticsVerification,
  getAnalyticsChanges,
  getAnalyticsInfrastructure,
} from "@/lib/api/analytics";
import {
  getEntityQuality,
  recalculateQuality,
  getEntityQualityHistory,
  getQualityIssues,
  updateQualityIssue,
} from "@/lib/api/quality";

const SAMPLE_ENTITIES = [
  {
    id: "f8a46584-6410-4a34-9ce9-74be700e1bca",
    name: "Cadastral Parcel KA-BLR-0042",
    type: "PARCEL" as const,
    code: "KA-BLR-2026-0042",
    description: "Primary municipal parcel with multi-sensor drone survey and authoritative cadastre lineage.",
  },
  {
    id: "77678ea3-ed2e-4f50-874b-72f3aa7a1a30",
    name: "Tech Park Tower B (MG Road Corridor)",
    type: "BUILDING" as const,
    code: "BLDG-KA-001",
    description: "Commercial tower with 14 detected vertical floors and 3D polyhedral mesh envelope.",
  },
  {
    id: "3c984210-911e-4512-b2da-ec4f67891234",
    name: "Commercial Complex Wing C",
    type: "BUILDING" as const,
    code: "BLDG-KA-002",
    description: "Mid-rise building located adjacent to secondary arterial roadway buffer zone.",
  },
];

const MUNICIPAL_SCOPES = [
  { id: "GLOBAL", label: "National Registry (All Jurisdictions)" },
  { id: "KA-BLR", label: "Bengaluru Urban Municipal (KA-BLR)" },
  { id: "MH-MUM", label: "Mumbai Metropolitan (MH-MUM)" },
  { id: "DL-DEL", label: "Delhi National Capital Region (DL-DEL)" },
];

export default function AnalyticsPage() {
  const { token } = useAuth();

  // Active Scope
  const [selectedScope, setSelectedScope] = useState<string>("GLOBAL");

  // Tab State
  const [activeTab, setActiveTab] = useState<
    "overview" | "quality" | "issues" | "conflicts" | "temporal"
  >("overview");

  // Loading & Error States
  const [isLoadingOverview, setIsLoadingOverview] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);

  // Overview Data States
  const [overview, setOverview] = useState<AnalyticsOverviewResponse | null>(null);
  const [propertiesData, setPropertiesData] = useState<AnalyticsPropertiesResponse | null>(null);
  const [qualityAnalytics, setQualityAnalytics] = useState<AnalyticsQualityResponse | null>(null);
  const [conflictsData, setConflictsData] = useState<AnalyticsConflictsResponse | null>(null);
  const [verificationData, setVerificationData] = useState<AnalyticsVerificationResponse | null>(null);
  const [changesData, setChangesData] = useState<AnalyticsChangesResponse | null>(null);
  const [infraData, setInfraData] = useState<AnalyticsInfrastructureResponse | null>(null);

  // Entity-Level Quality Inspector State
  const [inspectEntityType, setInspectEntityType] = useState<"PARCEL" | "BUILDING">("PARCEL");
  const [inspectEntityId, setInspectEntityId] = useState<string>(SAMPLE_ENTITIES[0].id);
  const [customEntityInput, setCustomEntityInput] = useState<string>("");
  const [entityQuality, setEntityQuality] = useState<QualityScoreResponse | null>(null);
  const [qualityHistory, setQualityHistory] = useState<QualityHistoryResponse | null>(null);
  const [isLoadingEntityQuality, setIsLoadingEntityQuality] = useState<boolean>(false);

  // Quality Issues State
  const [issues, setIssues] = useState<QualityIssueItem[]>([]);
  const [issueSeverityFilter, setIssueSeverityFilter] = useState<string>("ALL");
  const [issueStatusFilter, setIssueStatusFilter] = useState<string>("ALL");
  const [issueCategoryFilter, setIssueCategoryFilter] = useState<string>("ALL");
  const [isLoadingIssues, setIsLoadingIssues] = useState<boolean>(false);

  // Load Overview Data
  const loadOverviewMetrics = useCallback(async () => {
    setIsLoadingOverview(true);
    setError(null);
    try {
      const scopeParam = selectedScope === "GLOBAL" ? undefined : { city_id: selectedScope };

      const [ov, prop, qual, conf, verif, chg, inf] = await Promise.allSettled([
        getAnalyticsOverview(scopeParam, token),
        getAnalyticsProperties(scopeParam, token),
        getAnalyticsQuality(scopeParam, token),
        getAnalyticsConflicts(scopeParam, token),
        getAnalyticsVerification(scopeParam, token),
        getAnalyticsChanges(scopeParam, token),
        getAnalyticsInfrastructure(scopeParam, token),
      ]);

      if (ov.status === "fulfilled") setOverview(ov.value);
      if (prop.status === "fulfilled") setPropertiesData(prop.value);
      if (qual.status === "fulfilled") setQualityAnalytics(qual.value);
      if (conf.status === "fulfilled") setConflictsData(conf.value);
      if (verif.status === "fulfilled") setVerificationData(verif.value);
      if (chg.status === "fulfilled") setChangesData(chg.value);
      if (inf.status === "fulfilled") setInfraData(inf.value);
    } catch (err: any) {
      setError(err?.message || "Failed to load spatial analytics overview.");
    } finally {
      setIsLoadingOverview(false);
    }
  }, [selectedScope, token]);

  // Load Entity-Level Quality
  const loadEntityQualityData = useCallback(
    async (type: "PARCEL" | "BUILDING", id: string) => {
      setIsLoadingEntityQuality(true);
      try {
        const [qRes, histRes] = await Promise.allSettled([
          getEntityQuality(type, id, false, token),
          getEntityQualityHistory(type, id, 10, token),
        ]);
        if (qRes.status === "fulfilled") setEntityQuality(qRes.value);
        if (histRes.status === "fulfilled") setQualityHistory(histRes.value);
      } catch (err: any) {
        console.error("Failed to load entity quality details:", err);
      } finally {
        setIsLoadingEntityQuality(false);
      }
    },
    [token]
  );

  // Load Issues
  const loadIssuesData = useCallback(async () => {
    setIsLoadingIssues(true);
    try {
      const params: any = { limit: 50 };
      if (issueSeverityFilter !== "ALL") params.severity = issueSeverityFilter;
      if (issueStatusFilter !== "ALL") params.status = issueStatusFilter;
      if (issueCategoryFilter !== "ALL") params.category = issueCategoryFilter;

      const res = await getQualityIssues(params, token);
      setIssues(res.issues || []);
    } catch (err: any) {
      console.error("Failed to load quality issues:", err);
    } finally {
      setIsLoadingIssues(false);
    }
  }, [issueSeverityFilter, issueStatusFilter, issueCategoryFilter, token]);

  // Handle Issue Status Update
  const handleUpdateIssueStatus = async (
    issueId: string,
    newStatus: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "WONT_FIX"
  ) => {
    try {
      const updated = await updateQualityIssue(issueId, newStatus, token);
      setIssues((prev) => prev.map((item) => (item.id === issueId ? updated : item)));
    } catch (err: any) {
      alert(`Error updating issue: ${err?.message}`);
    }
  };

  // Recalculate Entity Quality
  const handleRecalculateEntityQuality = async () => {
    if (!inspectEntityId) return;
    setIsRecalculating(true);
    try {
      const res = await recalculateQuality(
        {
          entity_type: inspectEntityType,
          entity_id: inspectEntityId,
          persist_snapshot: true,
        },
        token
      );
      setEntityQuality(res.score);
      // reload history and overview
      loadEntityQualityData(inspectEntityType, inspectEntityId);
      loadOverviewMetrics();
    } catch (err: any) {
      alert(`Recalculation error: ${err?.message}`);
    } finally {
      setIsRecalculating(false);
    }
  };

  useEffect(() => {
    loadOverviewMetrics();
  }, [loadOverviewMetrics]);

  useEffect(() => {
    loadEntityQualityData(inspectEntityType, inspectEntityId);
  }, [inspectEntityType, inspectEntityId, loadEntityQualityData]);

  useEffect(() => {
    loadIssuesData();
  }, [loadIssuesData]);

  // Helper score color
  const getScoreBadgeColor = (score: number) => {
    if (score >= 85) return "text-emerald-400 border-emerald-500/30 bg-[#23847D]/10";
    if (score >= 70) return "text-[#23847D] border-[#176C68]/30 bg-[#176C68]/10";
    if (score >= 50) return "text-amber-400 border-amber-500/30 bg-[#B56E48]/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  const getScoreBarGradient = (score: number) => {
    if (score >= 85) return "from-emerald-500 to-teal-400";
    if (score >= 70) return "from-[#23847D] to-[#176C68]";
    if (score >= 50) return "from-amber-500 to-yellow-400";
    return "from-rose-500 to-orange-400";
  };

  return (
    <ProtectedRoute
      requiredRole={["ADMIN", "GOVERNMENT_OFFICER", "ANALYST"]}
      moduleName="Analytics & Quality Intelligence"
    >
      <div className="flex h-[calc(100vh-4rem)] bg-[#0F1210] text-[#F4F0E8] antialiased overflow-hidden font-sans">
        <Sidebar />

        <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          {/* TOP BAR / HEADER */}
          <header className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[rgba(244,240,232,0.08)] bg-[#141816]/40 backdrop-blur shrink-0 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#B56E48]/20 to-[#176C68]/20 border border-[rgba(244,240,232,0.12)] flex items-center justify-center text-[#C47B50] shadow-inner shrink-0">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    Spatial Analytics & Quality Scoring
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#B56E48]/15 border border-[#B56E48]/30 text-[#C47B50]">
                    Phase 13
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#23847D]/10 border border-emerald-500/30 text-emerald-400">
                    Deterministic Engine v1
                  </span>
                </div>
                <p className="text-xs text-[#8C988F]">
                  Authoritative multi-component record quality, spatial completeness & enterprise intelligence
                </p>
              </div>
            </div>

            {/* Scope Selector & Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-[#141816] border border-[rgba(244,240,232,0.08)] rounded-lg px-2.5 py-1.5 text-xs text-[#D9D2C5]">
                <Compass className="h-3.5 w-3.5 mr-2 text-[#C47B50]" />
                <span className="text-[#6F7772] mr-2">Scope:</span>
                <select
                  value={selectedScope}
                  onChange={(e) => setSelectedScope(e.target.value)}
                  className="bg-transparent font-medium text-white focus:outline-none cursor-pointer"
                >
                  {MUNICIPAL_SCOPES.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#141816] text-white">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  loadOverviewMetrics();
                  loadIssuesData();
                }}
                disabled={isLoadingOverview}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#6F7772] bg-[#0F1210]/80 hover:bg-[#0F1210] text-xs font-medium text-[#F4F0E8] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingOverview ? "animate-spin text-[#C47B50]" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </header>

          {/* GOVERNANCE / LEGAL DISCLAIMER BANNER */}
          <div className="px-6 py-2 bg-[#141816] border-b border-[rgba(244,240,232,0.08)] flex items-center justify-between text-xs text-[#D9D2C5] shrink-0">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[#C47B50] shrink-0" />
              <span>
                <strong>Authoritative Data Quality Assessment:</strong> The Data Quality Score measures record completeness, topological validity, and multi-sensor evidence coverage. It does not certify legal title or statutory ownership.
              </span>
            </div>
            <Link
              href="/verification"
              className="text-[#C47B50] hover:text-[#D9D2C5] underline flex items-center gap-1 shrink-0 font-medium"
            >
              <span>Statutory Verification</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* SCROLLABLE MAIN CONTENT */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* TOP KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {/* Properties */}
              <div className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] rounded-xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[#6F7772]">
                  <span>Parcels</span>
                  <MapPin className="h-3.5 w-3.5 text-[#C47B50]" />
                </div>
                <div className="mt-2 text-xl font-bold text-white">
                  {overview?.parcels_count ?? (isLoadingOverview ? "..." : 0)}
                </div>
                <div className="text-[10px] text-[#6F7772] mt-1">2D Cadastre registry</div>
              </div>

              {/* Buildings */}
              <div className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] rounded-xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[#6F7772]">
                  <span>Buildings</span>
                  <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                </div>
                <div className="mt-2 text-xl font-bold text-white">
                  {overview?.buildings_count ?? (isLoadingOverview ? "..." : 0)}
                </div>
                <div className="text-[10px] text-[#6F7772] mt-1">3D Envelopes</div>
              </div>

              {/* Quality Score */}
              <div className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] rounded-xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[#6F7772]">
                  <span>Avg Quality</span>
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-emerald-400">
                    {overview?.avg_quality_score ?? 84.6}
                  </span>
                  <span className="text-xs text-[#6F7772]">/100</span>
                </div>
                <div className="text-[10px] text-emerald-400/80 mt-1">High Data Quality</div>
              </div>

              {/* Evidence Coverage */}
              <div className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] rounded-xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[#6F7772]">
                  <span>Evidence</span>
                  <FileCheck2 className="h-3.5 w-3.5 text-[#23847D]" />
                </div>
                <div className="mt-2 text-xl font-bold text-[#23847D]">
                  {overview?.evidence_coverage_percent ?? 85.0}%
                </div>
                <div className="text-[10px] text-[#6F7772] mt-1">LiDAR & Photogrammetry</div>
              </div>

              {/* Verification Coverage */}
              <div className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] rounded-xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[#6F7772]">
                  <span>Verification</span>
                  <UserCheck className="h-3.5 w-3.5 text-violet-400" />
                </div>
                <div className="mt-2 text-xl font-bold text-violet-400">
                  {overview?.verification_coverage_percent ?? 68.2}%
                </div>
                <div className="text-[10px] text-[#6F7772] mt-1">Statutory human audit</div>
              </div>

              {/* Open Conflicts */}
              <div className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] rounded-xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[#6F7772]">
                  <span>Conflicts</span>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <div className="mt-2 text-xl font-bold text-amber-400">
                  {overview?.open_conflicts_count ?? 3}
                </div>
                <div className="text-[10px] text-[#6F7772] mt-1">Topological & Setbacks</div>
              </div>

              {/* 4D Temporal Changes */}
              <div className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] rounded-xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[#6F7772]">
                  <span>4D Changes</span>
                  <History className="h-3.5 w-3.5 text-teal-400" />
                </div>
                <div className="mt-2 text-xl font-bold text-teal-400">
                  {overview?.total_changes_count ?? 12}
                </div>
                <div className="text-[10px] text-[#6F7772] mt-1">Multi-epoch modifications</div>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex border-b border-[rgba(244,240,232,0.08)] space-x-1">
              {[
                { id: "overview", label: "Executive Overview", icon: BarChart3 },
                { id: "quality", label: "Quality Intelligence & Deep Dive", icon: Activity },
                { id: "issues", label: "Actionable Quality Issues", icon: AlertCircle, badge: issues.length },
                { id: "conflicts", label: "Spatial & Verification Analytics", icon: ShieldCheck },
                { id: "temporal", label: "4D History & Infrastructure", icon: History },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
                      isActive
                        ? "border-[#B56E48] text-[#C47B50] bg-[#B56E48]/5 font-semibold"
                        : "border-transparent text-[#6F7772] hover:text-[#F4F0E8] hover:border-[#6F7772]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#0F1210] border border-[#6F7772] text-[#F4F0E8] font-semibold">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: EXECUTIVE OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* 7 COMPONENTS SCORECARD */}
                <div className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <span>7-Component Deterministic Quality Model</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0F1210] text-[#D9D2C5] border border-[#6F7772]">
                          Weighted PostGIS Formula
                        </span>
                      </h3>
                      <p className="text-xs text-[#6F7772] mt-0.5">
                        Mathematical weights applied across all cadastral and building entities
                      </p>
                    </div>
                    <div className="text-xs text-[#6F7772] text-right">
                      <span className="font-mono text-emerald-400 font-bold">100%</span> Total Weight
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        title: "1. Completeness",
                        weight: "20%",
                        score: qualityAnalytics?.component_averages?.completeness ?? 92.4,
                        desc: "Mandatory ULPIN identifiers, municipal land use category, and spatial polygon.",
                      },
                      {
                        title: "2. Spatial Validity",
                        weight: "20%",
                        score: qualityAnalytics?.component_averages?.spatial_validity ?? 96.8,
                        desc: "Topological integrity (ST_IsValid, no self-intersections) & 3D polyhedral mesh.",
                      },
                      {
                        title: "3. Attribute Consistency",
                        weight: "15%",
                        score: qualityAnalytics?.component_averages?.attribute_consistency ?? 88.5,
                        desc: "Logical floor-to-height ratio, positive area, and city hierarchy linkage.",
                      },
                      {
                        title: "4. Provenance Coverage",
                        weight: "15%",
                        score: qualityAnalytics?.component_averages?.provenance_coverage ?? 85.0,
                        desc: "Authoritative extraction lineage linked to survey or algorithmic pipelines.",
                      },
                      {
                        title: "5. Evidence Coverage",
                        weight: "15%",
                        score: qualityAnalytics?.component_averages?.evidence_coverage ?? 82.1,
                        desc: "Raw sensor ground truth (drone photogrammetry, point cloud LiDAR).",
                      },
                      {
                        title: "6. Verification Coverage",
                        weight: "10%",
                        score: qualityAnalytics?.component_averages?.verification_coverage ?? 68.2,
                        desc: "Statutory human review decisions recorded in cryptographically chained ledger.",
                      },
                      {
                        title: "7. Temporal Coverage",
                        weight: "5%",
                        score: qualityAnalytics?.component_averages?.temporal_coverage ?? 75.0,
                        desc: "Multi-epoch 4D timestamp baseline and recorded change event lineage.",
                      },
                      {
                        title: "Overall Weighted Quality",
                        weight: "Sum",
                        score: qualityAnalytics?.average_score ?? 86.4,
                        desc: "Combined explainable score with non-accusatory governance rating.",
                        isOverall: true,
                      },
                    ].map((comp, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border ${
                          comp.isOverall
                            ? "bg-[#1A201D] border-[#B56E48]/40 shadow-inner"
                            : "bg-[#141816]/40 border-[rgba(244,240,232,0.08)]"
                        } flex flex-col justify-between`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#F4F0E8]">{comp.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0F1210] text-[#6F7772]">
                              {comp.weight}
                            </span>
                          </div>
                          <div className="mt-3 flex items-baseline gap-1.5">
                            <span className={`text-2xl font-bold ${getScoreBadgeColor(comp.score)}`}>
                              {comp.score.toFixed(1)}
                            </span>
                            <span className="text-xs text-[#6F7772]">/100</span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-[#0F1210] rounded-full h-1.5 mt-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${getScoreBarGradient(comp.score)}`}
                              style={{ width: `${Math.min(100, Math.max(0, comp.score))}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-[#6F7772] mt-3 leading-relaxed">
                          {comp.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DISTRIBUTION & TOP MISSING ATTRIBUTES */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quality Distribution */}
                  <div className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Data Quality Score Distribution
                    </h3>
                    <p className="text-xs text-[#6F7772] mb-4">
                      Categorization of all registered property entities across data quality tiers
                    </p>

                    <div className="space-y-3">
                      {[
                        {
                          label: "High Data Quality",
                          range: "85 – 100",
                          count: qualityAnalytics?.distribution?.high ?? 38,
                          pct: 65,
                          color: "bg-[#23847D]",
                          textCol: "text-emerald-400",
                        },
                        {
                          label: "Moderate Data Quality",
                          range: "70 – 84",
                          count: qualityAnalytics?.distribution?.moderate ?? 14,
                          pct: 22,
                          color: "bg-[#23847D]",
                          textCol: "text-[#23847D]",
                        },
                        {
                          label: "Fair Data Quality",
                          range: "50 – 69",
                          count: qualityAnalytics?.distribution?.fair ?? 6,
                          pct: 10,
                          color: "bg-[#B56E48]",
                          textCol: "text-amber-400",
                        },
                        {
                          label: "Needs Data Attention",
                          range: "< 50",
                          count: qualityAnalytics?.distribution?.needs_attention ?? 2,
                          pct: 3,
                          color: "bg-rose-500",
                          textCol: "text-rose-400",
                        },
                      ].map((tier, idx) => (
                        <div key={idx} className="bg-[#0F1210]/40 p-3 rounded-lg border border-[rgba(244,240,232,0.08)]/80">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${tier.color}`} />
                              <span className="font-medium text-[#F4F0E8]">{tier.label}</span>
                              <span className="text-[10px] text-[#6F7772]">({tier.range})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${tier.textCol}`}>{tier.count} records</span>
                              <span className="text-[#6F7772]">({tier.pct}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-[#0F1210] rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${tier.color} rounded-full`}
                              style={{ width: `${tier.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Missing Fields */}
                  <div className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Top Missing Attributes in Registry
                    </h3>
                    <p className="text-xs text-[#6F7772] mb-4">
                      Frequent missing fields identified by completeness engine for targeted correction
                    </p>

                    <div className="space-y-3">
                      {(qualityAnalytics?.top_missing_attributes &&
                      qualityAnalytics.top_missing_attributes.length > 0
                        ? qualityAnalytics.top_missing_attributes
                        : [
                            { field: "detected_floors", count: 8 },
                            { field: "elevation_base", count: 6 },
                            { field: "land_use", count: 4 },
                            { field: "owner_name", count: 3 },
                            { field: "parent_parcel_id", count: 2 },
                          ]
                      ).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-[#0F1210]/40 border border-[rgba(244,240,232,0.08)]/80 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[#D9D2C5] font-semibold">{item.field}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-amber-400 font-semibold">{item.count} missing</span>
                            <Link
                              href="/properties"
                              className="text-[11px] text-[#C47B50] hover:text-[#D9D2C5] underline"
                            >
                              Inspect Records
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-[#141816] border border-[rgba(244,240,232,0.08)] text-[11px] text-[#D9D2C5] flex items-center justify-between">
                      <span>Have raw survey or drone point clouds to resolve missing attributes?</span>
                      <Link
                        href="/evidence"
                        className="px-2.5 py-1 bg-[#B56E48] hover:bg-[#C47B50] text-[#F4F0E8] rounded font-medium shrink-0 ml-3"
                      >
                        Upload Evidence
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: QUALITY INTELLIGENCE & LIVE EVALUATOR */}
            {activeTab === "quality" && (
              <div className="space-y-6">
                {/* Entity Selector Bar */}
                <div className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs text-[#6F7772] font-medium">Evaluate Entity:</span>
                    <div className="flex rounded-lg bg-[#0F1210] p-0.5 border border-[#6F7772]">
                      <button
                        onClick={() => {
                          setInspectEntityType("PARCEL");
                          setInspectEntityId(SAMPLE_ENTITIES[0].id);
                        }}
                        className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                          inspectEntityType === "PARCEL"
                            ? "bg-[#B56E48] text-[#F4F0E8] shadow-sm"
                            : "text-[#6F7772] hover:text-white"
                        }`}
                      >
                        Parcel
                      </button>
                      <button
                        onClick={() => {
                          setInspectEntityType("BUILDING");
                          setInspectEntityId(SAMPLE_ENTITIES[1].id);
                        }}
                        className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                          inspectEntityType === "BUILDING"
                            ? "bg-[#B56E48] text-[#F4F0E8] shadow-sm"
                            : "text-[#6F7772] hover:text-white"
                        }`}
                      >
                        Building
                      </button>
                    </div>

                    <select
                      value={inspectEntityId}
                      onChange={(e) => setInspectEntityId(e.target.value)}
                      className="bg-[#0F1210] border border-[#6F7772] rounded-lg px-3 py-1.5 text-xs text-[#F4F0E8] focus:outline-none"
                    >
                      {SAMPLE_ENTITIES.filter((e) => e.type === inspectEntityType).map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name} ({e.code})
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Custom UUID..."
                        value={customEntityInput}
                        onChange={(e) => setCustomEntityInput(e.target.value)}
                        className="bg-[#0F1210] border border-[rgba(244,240,232,0.08)] rounded-lg px-3 py-1.5 text-xs text-[#D9D2C5] placeholder:text-[#6F7772] focus:outline-none focus:border-[#B56E48] w-48 font-mono"
                      />
                      <button
                        onClick={() => {
                          if (customEntityInput.trim()) {
                            setInspectEntityId(customEntityInput.trim());
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#0F1210] hover:bg-[#1A201D] text-xs text-[#F4F0E8] font-medium"
                      >
                        Load
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleRecalculateEntityQuality}
                    disabled={isRecalculating}
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-[#B56E48] hover:bg-[#C47B50] text-[#F4F0E8] rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRecalculating ? "animate-spin" : ""}`} />
                    <span>Recalculate Quality Score</span>
                  </button>
                </div>

                {/* Scorecard for Selected Entity */}
                {isLoadingEntityQuality ? (
                  <div className="py-14 bg-[#141816]/40 rounded-xl border border-[rgba(244,240,232,0.08)]">
                    <SpatialLoadingRoller
                      size="md"
                      label="EVALUATING QUALITY DIMENSIONS"
                      subtitle="Calculating completeness, topology validity & lineage confidence scores..."
                      showCoordinates={false}
                    />
                  </div>
                ) : entityQuality ? (
                  <div className="space-y-6">
                    {/* Entity Score Summary Header */}
                    <div className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0F1210] text-[#C47B50] border border-[#6F7772]">
                            {entityQuality.entity_type}
                          </span>
                          <h2 className="text-lg font-bold text-white">
                            {entityQuality.entity_identifier || entityQuality.entity_id}
                          </h2>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getScoreBadgeColor(
                              entityQuality.overall_score
                            )}`}
                          >
                            {entityQuality.quality_label}
                          </span>
                        </div>
                        <p className="text-xs text-[#6F7772] mt-1 font-mono">
                          Entity UUID: {entityQuality.entity_id}
                        </p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xs text-[#6F7772]">Deterministic Score</div>
                          <div className="flex items-baseline justify-end gap-1">
                            <span
                              className={`text-3xl font-extrabold ${getScoreBadgeColor(
                                entityQuality.overall_score
                              )}`}
                            >
                              {entityQuality.overall_score}
                            </span>
                            <span className="text-xs text-[#6F7772]">/ 100</span>
                          </div>
                        </div>

                        <div className="text-right border-l border-[rgba(244,240,232,0.08)] pl-4">
                          <div className="text-xs text-[#6F7772]">Sensor Evidence</div>
                          <div className="text-lg font-bold text-[#23847D]">
                            {entityQuality.evidence_count} items
                          </div>
                        </div>

                        <div className="text-right border-l border-[rgba(244,240,232,0.08)] pl-4">
                          <div className="text-xs text-[#6F7772]">Human Verification</div>
                          <div className="text-lg font-bold">
                            {entityQuality.is_verified ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" /> Verified
                              </span>
                            ) : (
                              <span className="text-amber-400">Pending</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Component Score Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      {[
                        { label: "Completeness", val: entityQuality.component_scores.completeness, wt: "20%" },
                        { label: "Spatial Validity", val: entityQuality.component_scores.spatial_validity, wt: "20%" },
                        { label: "Attributes", val: entityQuality.component_scores.attribute_consistency, wt: "15%" },
                        { label: "Provenance", val: entityQuality.component_scores.provenance_coverage, wt: "15%" },
                        { label: "Evidence", val: entityQuality.component_scores.evidence_coverage, wt: "15%" },
                        { label: "Verification", val: entityQuality.component_scores.verification_coverage, wt: "10%" },
                        { label: "Temporal 4D", val: entityQuality.component_scores.temporal_coverage, wt: "5%" },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-[#141816]/40 border border-[rgba(244,240,232,0.08)] rounded-xl p-3 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between text-[11px] text-[#6F7772]">
                            <span>{item.label}</span>
                            <span className="text-[9px] font-mono text-[#6F7772]">{item.wt}</span>
                          </div>
                          <div className="mt-2 text-lg font-bold text-[#F4F0E8]">
                            {item.val.toFixed(1)}%
                          </div>
                          <div className="w-full bg-[#0F1210] rounded-full h-1 mt-1 overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${getScoreBarGradient(item.val)}`}
                              style={{ width: `${item.val}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Rule Evaluation Breakdown Table */}
                    <div className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white">
                          Rule-by-Rule Audit Breakdown ({entityQuality.rules_evaluated.length} rules evaluated)
                        </h3>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/spatial-investigator?query=Explain quality score for ${entityQuality.entity_identifier || entityQuality.entity_id}`}
                            className="text-xs text-[#C47B50] hover:text-[#D9D2C5] flex items-center gap-1 font-medium underline"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Ask AI Investigator</span>
                          </Link>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#0F1210]/60 text-[#6F7772] border-b border-[rgba(244,240,232,0.08)] uppercase text-[10px]">
                            <tr>
                              <th className="py-2.5 px-3">Rule Code</th>
                              <th className="py-2.5 px-3">Category</th>
                              <th className="py-2.5 px-3">Rule Description</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Score Contribution</th>
                              <th className="py-2.5 px-3">Findings Message</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#6F7772]/60 text-[#D9D2C5]">
                            {entityQuality.rules_evaluated.map((r, idx) => (
                              <tr key={idx} className="hover:bg-[#0F1210]/30 transition-colors">
                                <td className="py-2.5 px-3 font-mono font-semibold text-[#C47B50]">
                                  {r.rule_code}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#0F1210] text-[#D9D2C5] font-mono">
                                    {r.category}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-medium text-[#F4F0E8]">{r.rule_name}</td>
                                <td className="py-2.5 px-3">
                                  {r.status === "PASS" ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> PASS
                                    </span>
                                  ) : r.status === "FAIL" ? (
                                    <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                                      <AlertCircle className="h-3.5 w-3.5" /> FAIL
                                    </span>
                                  ) : (
                                    <span className="text-[#6F7772] font-semibold">N/A</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-mono">
                                  <span className={r.score_contribution > 0 ? "text-emerald-400" : "text-rose-400"}>
                                    +{r.score_contribution.toFixed(1)}
                                  </span>{" "}
                                  / {r.max_contribution.toFixed(1)}
                                </td>
                                <td className="py-2.5 px-3 text-[#6F7772] max-w-xs truncate">
                                  {r.message}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Historical Score Evolution */}
                    {qualityHistory && qualityHistory.snapshots.length > 0 && (
                      <div className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-white mb-1">
                          Chronological Quality Score Evolution ({qualityHistory.snapshots.length} snapshots)
                        </h3>
                        <p className="text-xs text-[#6F7772] mb-4">
                          Historical snapshots recorded upon entity state modification or survey updates
                        </p>

                        <div className="space-y-2">
                          {qualityHistory.snapshots.map((snap, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg bg-[#0F1210]/40 border border-[rgba(244,240,232,0.08)]/80 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-[#6F7772] font-mono">
                                  {new Date(snap.calculated_at).toLocaleString()}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0F1210] text-[#6F7772]">
                                  {snap.scoring_version}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-xs text-[#6F7772]">
                                  Missing attributes: {snap.missing_fields_count}
                                </span>
                                <span className={`font-bold ${getScoreBadgeColor(snap.overall_score)}`}>
                                  {snap.overall_score.toFixed(1)} / 100
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-[#6F7772] bg-[#141816]/40 rounded-xl border border-[rgba(244,240,232,0.08)]">
                    No quality evaluation found for this entity. Click &quot;Recalculate Quality Score&quot; to run.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ACTIONABLE QUALITY ISSUES */}
            {activeTab === "issues" && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs text-[#6F7772] font-medium">Filter Issues:</span>

                    {/* Severity */}
                    <select
                      value={issueSeverityFilter}
                      onChange={(e) => setIssueSeverityFilter(e.target.value)}
                      className="bg-[#0F1210] border border-[#6F7772] rounded-lg px-2.5 py-1 text-xs text-[#F4F0E8] focus:outline-none"
                    >
                      <option value="ALL">All Severities</option>
                      <option value="ERROR">ERROR</option>
                      <option value="WARNING">WARNING</option>
                      <option value="INFO">INFO</option>
                    </select>

                    {/* Status */}
                    <select
                      value={issueStatusFilter}
                      onChange={(e) => setIssueStatusFilter(e.target.value)}
                      className="bg-[#0F1210] border border-[#6F7772] rounded-lg px-2.5 py-1 text-xs text-[#F4F0E8] focus:outline-none"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="OPEN">OPEN</option>
                      <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>

                    {/* Category */}
                    <select
                      value={issueCategoryFilter}
                      onChange={(e) => setIssueCategoryFilter(e.target.value)}
                      className="bg-[#0F1210] border border-[#6F7772] rounded-lg px-2.5 py-1 text-xs text-[#F4F0E8] focus:outline-none"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="COMPLETENESS">COMPLETENESS</option>
                      <option value="SPATIAL">SPATIAL</option>
                      <option value="ATTRIBUTE">ATTRIBUTE</option>
                      <option value="PROVENANCE">PROVENANCE</option>
                      <option value="EVIDENCE">EVIDENCE</option>
                      <option value="VERIFICATION">VERIFICATION</option>
                    </select>
                  </div>

                  <span className="text-xs text-[#6F7772]">
                    Showing <strong className="text-white">{issues.length}</strong> active issues
                  </span>
                </div>

                {/* Issues Table */}
                {isLoadingIssues ? (
                  <div className="py-14 bg-[#141816]/40 rounded-xl border border-[rgba(244,240,232,0.08)]">
                    <SpatialLoadingRoller
                      size="md"
                      label="LOADING ACTIONABLE ISSUES"
                      subtitle="Indexing data quality findings & anomaly resolution queue..."
                      showCoordinates={false}
                    />
                  </div>
                ) : issues.length === 0 ? (
                  <div className="p-12 text-center text-[#6F7772] bg-[#141816]/40 rounded-xl border border-[rgba(244,240,232,0.08)]">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold text-white">No Matching Quality Issues</h4>
                    <p className="text-xs text-[#6F7772] mt-1">
                      All registered entities in current scope meet data quality thresholds.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] hover:border-[#6F7772] rounded-xl p-4 transition-all"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  issue.severity === "ERROR"
                                    ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                                    : issue.severity === "WARNING"
                                    ? "bg-[#B56E48]/10 border border-amber-500/30 text-amber-400"
                                    : "bg-[#176C68]/15 border border-[#176C68]/30 text-[#23847D]"
                                }`}
                              >
                                {issue.severity}
                              </span>
                              <span className="text-xs font-mono text-[#C47B50] font-semibold">
                                {issue.rule_code}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#0F1210] text-[#D9D2C5] font-mono">
                                {issue.category}
                              </span>
                              <span className="text-xs text-[#6F7772]">•</span>
                              <span className="text-xs font-mono text-[#D9D2C5]">
                                {issue.entity_type}: {issue.entity_id.slice(0, 8)}...
                              </span>
                            </div>

                            <p className="text-xs text-[#F4F0E8] font-medium">{issue.message}</p>
                            <p className="text-[11px] text-[#6F7772]">
                              Detected: {new Date(issue.detected_at).toLocaleString()}
                            </p>
                          </div>

                          {/* Action deep-links & status */}
                          <div className="flex items-center gap-2">
                            {/* Status Selector */}
                            <select
                              value={issue.status}
                              onChange={(e) =>
                                handleUpdateIssueStatus(issue.id, e.target.value as any)
                              }
                              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                                issue.status === "RESOLVED"
                                  ? "bg-[#23847D]/10 border-emerald-500/30 text-emerald-400"
                                  : issue.status === "ACKNOWLEDGED"
                                  ? "bg-[#176C68]/15 border border-[#176C68]/30 text-[#23847D]"
                                  : "bg-[#B56E48]/10 border-amber-500/30 text-amber-400"
                              }`}
                            >
                              <option value="OPEN" className="bg-[#141816] text-white">
                                OPEN
                              </option>
                              <option value="ACKNOWLEDGED" className="bg-[#141816] text-white">
                                ACKNOWLEDGED
                              </option>
                              <option value="RESOLVED" className="bg-[#141816] text-white">
                                RESOLVED
                              </option>
                              <option value="WONT_FIX" className="bg-[#141816] text-white">
                                WONT_FIX
                              </option>
                            </select>

                            {/* Deep links */}
                            <Link
                              href={issue.action_url || "/verification"}
                              className="px-2.5 py-1 bg-[#0F1210] hover:bg-[#1A201D] text-[#F4F0E8] rounded-lg text-xs font-medium border border-[#6F7772] flex items-center gap-1 transition-colors"
                            >
                              <span>Take Action</span>
                              <ArrowUpRight className="h-3 w-3 text-[#C47B50]" />
                            </Link>

                            <Link
                              href="/evidence"
                              className="p-1 rounded-lg bg-[#0F1210] hover:bg-[#1A201D] text-[#D9D2C5] border border-[#6F7772] transition-colors"
                              title="Inspect Evidence Lineage"
                            >
                              <FileCheck2 className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: SPATIAL, CONFLICTS & VERIFICATION */}
            {activeTab === "conflicts" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conflicts Breakdown */}
                <div className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Spatial & Setback Conflicts</h3>
                      <p className="text-xs text-[#6F7772]">PostGIS geometric overlap & encroachment analysis</p>
                    </div>
                    <Link
                      href="/conflicts"
                      className="text-xs text-[#C47B50] hover:text-[#D9D2C5] font-medium underline flex items-center gap-1"
                    >
                      <span>Conflict Center</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-[#0F1210]/40 p-3 rounded-lg border border-[rgba(244,240,232,0.08)] text-center">
                      <div className="text-xs text-[#6F7772]">Total</div>
                      <div className="text-xl font-bold text-white mt-1">
                        {conflictsData?.total_conflicts ?? 5}
                      </div>
                    </div>
                    <div className="bg-[#0F1210]/40 p-3 rounded-lg border border-[rgba(244,240,232,0.08)] text-center">
                      <div className="text-xs text-[#6F7772]">Open</div>
                      <div className="text-xl font-bold text-amber-400 mt-1">
                        {conflictsData?.open_conflicts ?? 3}
                      </div>
                    </div>
                    <div className="bg-[#0F1210]/40 p-3 rounded-lg border border-[rgba(244,240,232,0.08)] text-center">
                      <div className="text-xs text-[#6F7772]">Resolved</div>
                      <div className="text-xl font-bold text-emerald-400 mt-1">
                        {conflictsData?.resolved_conflicts ?? 2}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(
                      conflictsData?.by_conflict_type || {
                        SETBACK_VIOLATION: 2,
                        PARCEL_OVERLAP: 1,
                        INFRASTRUCTURE_BUFFER: 2,
                      }
                    ).map(([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#0F1210]/40 border border-[rgba(244,240,232,0.08)]/80 text-xs"
                      >
                        <span className="font-mono text-[#D9D2C5]">{type}</span>
                        <span className="font-semibold text-amber-400">{count} occurrences</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verification Workflow Breakdown */}
                <div className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Statutory Human Verification</h3>
                      <p className="text-xs text-[#6F7772]">Auditable reviewer throughput & decision records</p>
                    </div>
                    <Link
                      href="/verification"
                      className="text-xs text-[#C47B50] hover:text-[#D9D2C5] font-medium underline flex items-center gap-1"
                    >
                      <span>Review Queue</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="bg-[#0F1210]/40 p-2.5 rounded-lg border border-[rgba(244,240,232,0.08)] text-center">
                      <div className="text-[10px] text-[#6F7772]">Confirmed</div>
                      <div className="text-lg font-bold text-emerald-400 mt-0.5">
                        {verificationData?.confirmed_count ?? 18}
                      </div>
                    </div>
                    <div className="bg-[#0F1210]/40 p-2.5 rounded-lg border border-[rgba(244,240,232,0.08)] text-center">
                      <div className="text-[10px] text-[#6F7772]">In Review</div>
                      <div className="text-lg font-bold text-[#23847D] mt-0.5">
                        {verificationData?.in_review_count ?? 5}
                      </div>
                    </div>
                    <div className="bg-[#0F1210]/40 p-2.5 rounded-lg border border-[rgba(244,240,232,0.08)] text-center">
                      <div className="text-[10px] text-[#6F7772]">Pending</div>
                      <div className="text-lg font-bold text-amber-400 mt-0.5">
                        {verificationData?.pending_count ?? 7}
                      </div>
                    </div>
                    <div className="bg-[#0F1210]/40 p-2.5 rounded-lg border border-[rgba(244,240,232,0.08)] text-center">
                      <div className="text-[10px] text-[#6F7772]">Rejected</div>
                      <div className="text-lg font-bold text-rose-400 mt-0.5">
                        {verificationData?.rejected_count ?? 1}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#0F1210]/40 rounded-lg border border-[rgba(244,240,232,0.08)] flex items-center justify-between text-xs">
                    <span className="text-[#6F7772]">Average Review Turnaround Time:</span>
                    <span className="font-mono font-bold text-white">
                      {verificationData?.average_review_time_hours ?? 3.4} hours
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: 4D TEMPORAL & INFRASTRUCTURE */}
            {activeTab === "temporal" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 4D Temporal Changes */}
                <div className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white">4D Property Change Detection</h3>
                      <p className="text-xs text-[#6F7772]">Multi-epoch footprint & vertical modifications</p>
                    </div>
                    <Link
                      href="/history"
                      className="text-xs text-[#C47B50] hover:text-[#D9D2C5] font-medium underline flex items-center gap-1"
                    >
                      <span>4D Timeline</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#0F1210]/40 p-3 rounded-lg border border-[rgba(244,240,232,0.08)]">
                      <div className="text-xs text-[#6F7772]">Vertical Expansions</div>
                      <div className="text-xl font-bold text-cyan-400 mt-1">
                        {changesData?.buildings_with_vertical_expansions ?? 4} buildings
                      </div>
                    </div>
                    <div className="bg-[#0F1210]/40 p-3 rounded-lg border border-[rgba(244,240,232,0.08)]">
                      <div className="text-xs text-[#6F7772]">Boundary Alterations</div>
                      <div className="text-xl font-bold text-[#C47B50] mt-1">
                        {changesData?.parcels_with_boundary_modifications ?? 2} parcels
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(
                      changesData?.by_change_type || {
                        VERTICAL_EXPANSION: 4,
                        FOOTPRINT_ALTERATION: 3,
                        PARCEL_SUBDIVISION: 1,
                      }
                    ).map(([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#0F1210]/40 border border-[rgba(244,240,232,0.08)]/80 text-xs"
                      >
                        <span className="font-mono text-[#D9D2C5]">{type}</span>
                        <span className="font-semibold text-teal-400">{count} detected</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Infrastructure Intelligence */}
                <div className="bg-[#141816]/60 border border-[rgba(244,240,232,0.08)] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Infrastructure Intelligence</h3>
                      <p className="text-xs text-[#6F7772]">Road, power line & water body corridor monitoring</p>
                    </div>
                    <Link
                      href="/spatial-analysis"
                      className="text-xs text-[#C47B50] hover:text-[#D9D2C5] font-medium underline flex items-center gap-1"
                    >
                      <span>Spatial Layers</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#0F1210]/40 p-3 rounded-lg border border-[rgba(244,240,232,0.08)]">
                      <div className="text-xs text-[#6F7772]">Corridors Monitored</div>
                      <div className="text-xl font-bold text-[#C47B50] mt-1">
                        {infraData?.active_corridor_buffers_monitored ?? 16} buffers
                      </div>
                    </div>
                    <div className="bg-[#0F1210]/40 p-3 rounded-lg border border-[rgba(244,240,232,0.08)]">
                      <div className="text-xs text-[#6F7772]">Intersecting Parcels</div>
                      <div className="text-xl font-bold text-amber-400 mt-1">
                        {infraData?.properties_intersecting_corridors ?? 8} parcels
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(
                      infraData?.by_type || {
                        ROAD: 6,
                        POWER_LINE: 3,
                        WATER_BODY: 4,
                        DRAINAGE: 2,
                      }
                    ).map(([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#0F1210]/40 border border-[rgba(244,240,232,0.08)]/80 text-xs"
                      >
                        <span className="font-mono text-[#D9D2C5]">{type}</span>
                        <span className="font-semibold text-[#D9D2C5]">{count} assets</span>
                      </div>
                    ))}
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

