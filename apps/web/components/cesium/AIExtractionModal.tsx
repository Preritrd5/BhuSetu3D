"use client";

/**
 * BhuSetu 3D AI Building Extraction Control Modal
 */
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Cpu,
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Terminal,
} from "lucide-react";

interface AIExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtractionComplete: () => void;
}

export const AIExtractionModal: React.FC<AIExtractionModalProps> = ({
  isOpen,
  onClose,
  onExtractionComplete,
}) => {
  const { token } = useAuth();
  const [modelName, setModelName] = useState("building-segmentation-unet");
  const [modelVersion, setModelVersion] = useState("v1.0");
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [minAreaSqm, setMinAreaSqm] = useState(15.0);
  const [defaultHeightM, setDefaultHeightM] = useState(12.0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [jobState, setJobState] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartExtraction = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setJobState(null);

    try {
      const payload = {
        model_name: modelName,
        model_version: modelVersion,
        confidence_threshold: confidenceThreshold,
        min_area_sqm: minAreaSqm,
        default_height_m: defaultHeightM,
      };

      const res = await fetch("http://localhost:8000/api/v1/buildings/extraction-jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Failed to initiate AI job (HTTP ${res.status})`);
      }

      const jobData = await res.json();
      setJobState(jobData);
      setIsProcessing(false);
      onExtractionComplete();
    } catch (err: any) {
      setErrorMessage(err.message || "Extraction job execution failed.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-surface border border-border-subtle rounded-xl max-w-lg w-full shadow-2xl overflow-hidden text-xs font-mono text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface-subtle">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold">
            <Cpu className="w-4 h-4 flex-shrink-0" />
            <span>AI BUILDING EXTRACTION & 3D GENERATOR</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {!jobState ? (
            <>
              {/* Architecture selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 uppercase font-semibold">
                  Segmentation Model Architecture
                </label>
                <div className="p-3 rounded bg-canvas border border-border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-bold text-slate-100">{modelName}</div>
                      <div className="text-[10px] text-slate-500">
                        PyTorch ConvNet (U-Net with Skip-Connections & Tiling)
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                    {modelVersion}
                  </span>
                </div>
              </div>

              {/* Threshold Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">Confidence Threshold</span>
                  <span className="text-cyan-300 font-bold">{Math.round(confidenceThreshold * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.9"
                  step="0.05"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 rounded h-1.5 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500">
                  <span>20% (More detections)</span>
                  <span>90% (Strict boundaries)</span>
                </div>
              </div>

              {/* Min Area and Height */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-semibold uppercase">
                    Min Footprint (m²)
                  </label>
                  <input
                    type="number"
                    value={minAreaSqm}
                    onChange={(e) => setMinAreaSqm(parseFloat(e.target.value) || 10)}
                    className="w-full bg-canvas border border-border-subtle rounded px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-semibold uppercase">
                    Extrusion Height (m)
                  </label>
                  <input
                    type="number"
                    value={defaultHeightM}
                    onChange={(e) => setDefaultHeightM(parseFloat(e.target.value) || 9)}
                    className="w-full bg-canvas border border-border-subtle rounded px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Execution Failed:</span> {errorMessage}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Results Screen */
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="p-3 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="font-bold text-xs">Pipeline Execution Complete</div>
                  <div className="text-[10px] text-emerald-400/80">
                    Durable job persisted in Supabase PostGIS
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-canvas p-2.5 rounded border border-border-subtle">
                  <span className="text-[10px] text-slate-400 block">Detections</span>
                  <span className="text-base font-bold text-slate-100">
                    {jobState.buildings_detected}
                  </span>
                </div>
                <div className="bg-canvas p-2.5 rounded border border-border-subtle">
                  <span className="text-[10px] text-slate-400 block">Extracted Footprints</span>
                  <span className="text-base font-bold text-cyan-300">
                    {jobState.buildings_extracted}
                  </span>
                </div>
                <div className="bg-canvas p-2.5 rounded border border-border-subtle">
                  <span className="text-[10px] text-slate-400 block">3D Volumes Generated</span>
                  <span className="text-base font-bold text-emerald-300">
                    {jobState.buildings_3d_generated}
                  </span>
                </div>
                <div className="bg-canvas p-2.5 rounded border border-border-subtle">
                  <span className="text-[10px] text-slate-400 block">Rejected / Low Conf</span>
                  <span className="text-base font-bold text-slate-400">
                    {jobState.buildings_rejected}
                  </span>
                </div>
              </div>

              {/* Execution Logs */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-cyan-400" />
                  Execution Audit Logs
                </span>
                <div className="p-2.5 rounded bg-black/60 border border-border-subtle text-[10px] text-slate-300 max-h-36 overflow-y-auto space-y-1 font-mono">
                  {(jobState.execution_logs || []).map((log: any, i: number) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-cyan-400 font-bold">[{log.stage}]</span>
                      <span className="text-slate-300">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border-subtle flex items-center justify-between bg-surface-subtle">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            {jobState ? "Close" : "Cancel"}
          </button>

          {!jobState ? (
            <button
              onClick={handleStartExtraction}
              disabled={isProcessing}
              className="py-1.5 px-4 rounded bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900 disabled:text-slate-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-lg"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Running Inference...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Execute Extraction
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="py-1.5 px-4 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-lg"
            >
              <span>View in 3D City</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
