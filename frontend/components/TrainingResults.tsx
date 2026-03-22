"use client";
import { useEffect, useState } from "react";
import { getTrainingResults, deleteModelResult } from "@/lib/api";
import { Loader2, Trash2, BarChart3, X, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { cn, formatNumber, formatMetric, isPercentMetric } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from "recharts";

interface Props {
  sessionId: string;
  refreshKey: number;
  onSessionExpired: () => void;
}

const HIGHER_IS_BETTER = new Set(["R2 Score","Accuracy","Precision","Recall","F1 Score","ROC AUC","Silhouette Score","CV Mean","Calinski-Harabasz Score"]);
const LOWER_IS_BETTER  = new Set(["MAE","MSE","RMSE","MAPE (%)","Davies-Bouldin Score"]);

const METRIC_COLORS: Record<string, string> = {
  "Accuracy": "#10b981", "F1 Score": "#f59e0b", "Precision": "#06b6d4",
  "Recall": "#8b5cf6", "ROC AUC": "#ec4899", "R2 Score": "#6366f1",
  "MAE": "#ef4444", "RMSE": "#f97316", "MSE": "#dc2626",
  "Silhouette Score": "#6366f1", "CV Mean": "#84cc16",
};

// ── Confusion Matrix ──────────────────────────────────────────────────────────
function ConfusionMatrix({ matrix }: { matrix: number[][] }) {
  const max = Math.max(...matrix.flat()) || 1;
  const n = matrix.length;
  return (
    <div>
      <p className="text-slate-400 text-xs mb-2 font-medium">Confusion Matrix</p>
      <div className="overflow-auto">
        <div className="inline-block">
          {/* Column headers */}
          <div className="flex mb-1 ml-8">
            {matrix[0].map((_, j) => (
              <div key={j} className="w-11 text-center text-xs text-slate-500 font-medium">P{j}</div>
            ))}
          </div>
          {matrix.map((row, i) => (
            <div key={i} className="flex items-center mb-1">
              <div className="w-7 text-xs text-slate-500 font-medium text-right pr-1 shrink-0">A{i}</div>
              {row.map((v, j) => (
                <div key={j}
                  className={cn("w-11 h-10 flex items-center justify-center rounded-md mx-0.5 text-sm font-bold transition-all",
                    i === j ? "ring-2 ring-brand-500/50" : ""
                  )}
                  style={{
                    background: i === j
                      ? `rgba(99,102,241,${0.2 + 0.7 * (v / max)})`
                      : `rgba(239,68,68,${0.05 + 0.4 * (v / max)})`,
                    color: i === j ? "#a5b4fc" : v > 0 ? "#fca5a5" : "#475569",
                  }}
                  title={`Actual: ${i}, Predicted: ${j}, Count: ${v}`}
                >
                  {v}
                </div>
              ))}
            </div>
          ))}
          <div className="flex mt-2 ml-8 gap-4 text-xs text-slate-500">
            <span><span className="inline-block w-3 h-3 rounded bg-brand-500/50 mr-1" />Correct</span>
            <span><span className="inline-block w-3 h-3 rounded bg-red-500/30 mr-1" />Wrong</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Feature Importance Chart ──────────────────────────────────────────────────
function FeatureImportance({ data }: { data: { feature: string; importance: number }[] }) {
  const top = data.slice(0, 15);
  const chartData = top.map((d) => ({
    name: d.feature.length > 20 ? d.feature.slice(0, 18) + "…" : d.feature,
    value: d.importance,
  }));
  const maxVal = Math.max(...top.map((d) => d.importance));

  return (
    <div>
      <p className="text-slate-400 text-xs mb-3 font-medium">Feature Importance (top {top.length})</p>
      <div className="space-y-1.5">
        {top.map((item, i) => (
          <div key={item.feature} className="flex items-center gap-2">
            <span className="text-slate-500 text-xs w-4 text-right shrink-0">{i + 1}</span>
            <span className="text-slate-300 text-xs w-32 truncate shrink-0" title={item.feature}>{item.feature}</span>
            <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(item.importance / maxVal) * 100}%`,
                  background: `hsl(${240 - i * 12}, 70%, 60%)`,
                }}
              />
            </div>
            <span className="text-slate-400 text-xs font-mono w-14 text-right shrink-0">{formatNumber(item.importance, 4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Metric Score Bar ──────────────────────────────────────────────────────────
function MetricRow({ label, value }: { label: string; value: number }) {
  const isHigh = HIGHER_IS_BETTER.has(label);
  const isLow  = LOWER_IS_BETTER.has(label);
  const color = METRIC_COLORS[label] || "#6366f1";
  const normalized = isHigh ? Math.min(Math.max(value, 0), 1) :
                     isLow  ? Math.max(0, 1 - Math.min(value, 1)) : 0.5;
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-slate-400 text-xs w-32 truncate shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${normalized * 100}%`, background: color }} />
      </div>
      <span className="text-slate-200 text-xs font-mono w-20 text-right shrink-0 flex items-center justify-end gap-1">
        {formatMetric(label, value)}
        {isHigh && <TrendingUp className="w-3 h-3 text-emerald-500 opacity-60" />}
        {isLow  && <TrendingDown className="w-3 h-3 text-red-500 opacity-60" />}
      </span>
    </div>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({ model, onClose }: { model: any; onClose: () => void }) {
  const metrics = model.metrics || {};
  const numericMetrics = Object.entries(metrics).filter(([k, v]) =>
    typeof v === "number" && !["n_clusters","n_noise_points","train_size","test_size_n"].includes(k)
  ) as [string, number][];
  const confMatrix: number[][] | null = metrics.confusion_matrix ?? null;
  const classDist: Record<string, number> | null = metrics.class_distribution ?? null;
  const featureImportances = model.feature_importances ?? null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl h-full bg-slate-900 border-l border-slate-700 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-white font-semibold text-base">{model.name}</h2>
            <span className={cn("badge text-xs mt-1",
              model.task === "regression" ? "bg-blue-500/15 text-blue-300" :
              model.task === "classification" ? "bg-emerald-500/15 text-emerald-300" :
              "bg-purple-500/15 text-purple-300"
            )}>{model.task}</span>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Dataset split */}
          {(model.train_size || model.test_size_n) && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Train Samples", value: model.train_size },
                { label: "Test Samples", value: model.test_size_n },
                { label: "Features", value: model.feature_cols?.length },
              ].map((item) => (
                <div key={item.label} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 text-center">
                  <p className="text-slate-400 text-xs">{item.label}</p>
                  <p className="text-white font-bold text-xl mt-0.5">{item.value ?? "—"}</p>
                </div>
              ))}
            </div>
          )}

          {/* All numeric metrics */}
          {numericMetrics.length > 0 && (
            <div>
              <p className="text-slate-300 text-sm font-semibold mb-3">Performance Metrics</p>
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40 space-y-3">
                {numericMetrics.map(([k, v]) => <MetricRow key={k} label={k} value={v} />)}
              </div>
            </div>
          )}

          {/* Class distribution */}
          {classDist && (
            <div>
              <p className="text-slate-300 text-sm font-semibold mb-3">Class Distribution (test set)</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(classDist).map(([cls, count]) => (
                  <div key={cls} className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-center">
                    <p className="text-slate-400 text-xs">Class {cls}</p>
                    <p className="text-white font-semibold">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confusion matrix */}
          {confMatrix && (
            <div>
              <p className="text-slate-300 text-sm font-semibold mb-3">Confusion Matrix</p>
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                <ConfusionMatrix matrix={confMatrix} />
              </div>
            </div>
          )}

          {/* Feature importance */}
          {featureImportances && featureImportances.length > 0 && (
            <div>
              <p className="text-slate-300 text-sm font-semibold mb-3">Feature Importances</p>
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                <FeatureImportance data={featureImportances} />
              </div>
            </div>
          )}

          {/* Feature list */}
          {model.feature_cols?.length > 0 && (
            <div>
              <p className="text-slate-300 text-sm font-semibold mb-2">Features Used ({model.feature_cols.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {model.feature_cols.map((f: string) => (
                  <span key={f} className="badge bg-slate-800 text-slate-400 border border-slate-700 text-xs">{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TrainingResults({ sessionId, refreshKey, onSessionExpired }: Props) {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any | null>(null);

  useEffect(() => {
    setLoading(true);
    getTrainingResults(sessionId)
      .then((d) => setResults(d.trained_models || {}))
      .catch((e) => { if (e?.response?.status === 404) onSessionExpired(); })
      .finally(() => setLoading(false));
  }, [sessionId, refreshKey]);

  const handleDelete = async (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteModelResult(sessionId, key);
      setResults((prev: any) => { const n = { ...prev }; delete n[key]; return n; });
      if (selectedModel?.key === key) setSelectedModel(null);
      toast.success("Removed model result.");
    } catch (e: any) {
      if (e?.response?.status === 404) { onSessionExpired(); return; }
      toast.error("Failed to remove model.");
    }
  };

  const modelList = Object.entries(results);

  if (loading) return (
    <div className="card p-6 flex items-center justify-center h-40">
      <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
    </div>
  );
  if (!modelList.length) return (
    <div className="card p-6 text-center py-16">
      <BarChart3 className="w-12 h-12 text-slate-800 mx-auto mb-3" />
      <p className="text-slate-500">No models trained yet.</p>
      <p className="text-slate-600 text-sm mt-1">Go to "Train Models" to get started.</p>
    </div>
  );

  // Summary bar chart data (primary metric)
  const firstMetrics = (modelList[0]?.[1] as any)?.metrics || {};
  const primaryKey = ["Accuracy","R2 Score","F1 Score","Silhouette Score"].find((k) => k in firstMetrics) ||
    Object.keys(firstMetrics).find((k) => typeof firstMetrics[k] === "number") || null;

  const summaryData = modelList
    .map(([key, info]: any, i) => ({
      name: info.name.length > 16 ? info.name.slice(0, 14) + "…" : info.name,
      value: primaryKey ? info.metrics?.[primaryKey] : null,
      color: `hsl(${(i * 47) % 360}, 70%, 60%)`,
      key,
    }))
    .filter((d) => d.value != null);

  return (
    <>
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            Training Results <span className="text-slate-500 text-sm font-normal ml-1">({modelList.length} models)</span>
          </h2>
          <p className="text-slate-500 text-xs">Click a card for full details</p>
        </div>

        {/* Summary chart */}
        {primaryKey && summaryData.length > 0 && (
          <div className="mb-6 bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
            <p className="text-slate-400 text-xs mb-3">{primaryKey} — all models</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={summaryData} margin={{ top: 4, right: 12, left: -12, bottom: 48 }} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10, fontSize: 12 }}
                  formatter={(v: any) => [primaryKey ? formatMetric(primaryKey, v) : formatNumber(v), primaryKey]}
                  cursor={{ fill: "#ffffff06" }}
                />
                <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                  {summaryData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Model cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {modelList.map(([key, info]: any, i) => {
            const numericMetrics = Object.entries(info.metrics || {})
              .filter(([k, v]) => typeof v === "number" && !["n_clusters","n_noise_points","train_size","test_size_n"].includes(k))
              .slice(0, 4) as [string, number][];

            return (
              <div key={key}
                onClick={() => setSelectedModel({ key, ...info })}
                className="group bg-slate-800/50 border border-slate-700/60 hover:border-brand-500/40 hover:bg-slate-800 rounded-xl p-4 cursor-pointer transition-all duration-150"
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 font-medium text-sm truncate">{info.name}</p>
                    <span className={cn("badge text-xs mt-1",
                      info.task === "regression" ? "bg-blue-500/15 text-blue-300" :
                      info.task === "classification" ? "bg-emerald-500/15 text-emerald-300" :
                      "bg-purple-500/15 text-purple-300"
                    )}>{info.task}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button onClick={(e) => handleDelete(key, e)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-colors" />
                  </div>
                </div>

                {/* Top metrics */}
                <div className="space-y-2">
                  {numericMetrics.map(([k, v]) => {
                    const isHigh = HIGHER_IS_BETTER.has(k);
                    const isLow  = LOWER_IS_BETTER.has(k);
                    const normalized = isHigh ? Math.min(Math.max(v, 0), 1) :
                                       isLow  ? Math.max(0, 1 - Math.min(v, 1)) : 0.5;
                    const color = normalized > 0.7 ? "#10b981" : normalized > 0.4 ? "#f59e0b" : "#ef4444";
                    return (
                      <div key={k} className="flex items-center gap-2">
                        <span className="text-slate-500 text-xs w-24 truncate">{k}</span>
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${normalized * 100}%`, background: color }} />
                        </div>
                        <span className="text-slate-300 text-xs font-mono w-14 text-right">{formatMetric(k, v)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Feature importance indicator */}
                {info.feature_importances?.length > 0 && (
                  <p className="text-xs text-slate-600 mt-3 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Feature importances available
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedModel && (
        <DetailDrawer model={selectedModel} onClose={() => setSelectedModel(null)} />
      )}
    </>
  );
}
