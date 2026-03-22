"use client";
import { useEffect, useState, useMemo } from "react";
import { compareModels } from "@/lib/api";
import { Loader2, GitCompare, TrendingUp, TrendingDown, CheckSquare, Square } from "lucide-react";
import { cn, formatNumber, formatMetric, isPercentMetric } from "@/lib/utils";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from "recharts";

interface Props {
  sessionId: string;
  refreshKey: number;
  onSessionExpired: () => void;
}

const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#84cc16","#f97316","#14b8a6"];
const HIGHER_IS_BETTER = new Set(["R2 Score","Accuracy","Precision","Recall","F1 Score","ROC AUC","Silhouette Score","CV Mean","Calinski-Harabasz Score"]);
const LOWER_IS_BETTER  = new Set(["MAE","MSE","RMSE","MAPE (%)","Davies-Bouldin Score","CV Std"]);

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-slate-200 font-semibold mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-slate-400">{p.dataKey}:</span>
          <span className="text-white font-mono">{typeof p.value === "number" ? formatMetric(p.dataKey, p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ModelComparison({ sessionId, refreshKey, onSessionExpired }: Props) {
  const [allData, setAllData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [sortMetric, setSortMetric] = useState<string>("");
  const [chartMetric, setChartMetric] = useState<string>("");
  const [viewMode, setViewMode] = useState<"bar" | "radar" | "table">("bar");

  useEffect(() => {
    setLoading(true);
    compareModels(sessionId)
      .then((d) => {
        const rows = d.comparison || [];
        setAllData(rows);
        setSelectedKeys(new Set(rows.map((r: any) => r.model_key)));
      })
      .catch((e) => { if (e?.response?.status === 404) onSessionExpired(); })
      .finally(() => setLoading(false));
  }, [sessionId, refreshKey]);

  const allMetricKeys = useMemo(() =>
    Array.from(new Set(
      allData.flatMap((row) =>
        Object.entries(row)
          .filter(([k, v]) => typeof v === "number" && k !== "model_key")
          .map(([k]) => k)
      )
    )).filter((k) => !["n_clusters","n_noise_points","train_size","test_size_n"].includes(k)),
    [allData]
  );

  useEffect(() => {
    if (!chartMetric && allMetricKeys.length) {
      const preferred = ["Accuracy","R2 Score","F1 Score","Silhouette Score"];
      setChartMetric(allMetricKeys.find((k) => preferred.includes(k)) ?? allMetricKeys[0]);
    }
    if (!sortMetric && allMetricKeys.length) setSortMetric(allMetricKeys[0]);
  }, [allMetricKeys]);

  const data = allData.filter((r) => selectedKeys.has(r.model_key));

  const bestPerMetric = useMemo(() => {
    const bpm: Record<string, number> = {};
    allMetricKeys.forEach((m) => {
      const vals = data.map((r) => r[m]).filter((v): v is number => typeof v === "number");
      if (!vals.length) return;
      bpm[m] = LOWER_IS_BETTER.has(m) ? Math.min(...vals) : Math.max(...vals);
    });
    return bpm;
  }, [data, allMetricKeys]);

  const sorted = useMemo(() => [...data].sort((a, b) => {
    if (!sortMetric) return 0;
    const av = a[sortMetric] ?? (LOWER_IS_BETTER.has(sortMetric) ? Infinity : -Infinity);
    const bv = b[sortMetric] ?? (LOWER_IS_BETTER.has(sortMetric) ? Infinity : -Infinity);
    return LOWER_IS_BETTER.has(sortMetric) ? av - bv : bv - av;
  }), [data, sortMetric]);

  const barData = useMemo(() =>
    sorted.map((row, i) => ({
      name: row.model_name.length > 18 ? row.model_name.slice(0, 16) + "…" : row.model_name,
      value: row[chartMetric] ?? null,
      color: COLORS[allData.findIndex((r) => r.model_key === row.model_key) % COLORS.length],
    })).filter((d) => d.value !== null),
    [sorted, chartMetric]
  );

  const radarMetrics = allMetricKeys.filter((k) => HIGHER_IS_BETTER.has(k) && data.some((r) => typeof r[k] === "number")).slice(0, 6);
  const radarData = useMemo(() =>
    radarMetrics.map((metric) => {
      const vals = data.map((r) => r[metric] ?? 0);
      const max = Math.max(...vals) || 1;
      const entry: any = { metric };
      data.forEach((row) => { entry[row.model_name] = +((row[metric] ?? 0) / max * 100).toFixed(1); });
      return entry;
    }),
    [data, radarMetrics]
  );

  const toggleKey = (key: string) => setSelectedKeys((prev) => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  if (loading) return (
    <div className="card p-6 flex items-center justify-center h-40">
      <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
    </div>
  );
  if (!allData.length) return (
    <div className="card p-6 text-center py-16">
      <GitCompare className="w-12 h-12 text-slate-800 mx-auto mb-3" />
      <p className="text-slate-500">Train at least 2 models to compare them.</p>
    </div>
  );

  return (
    <div className="card p-6 space-y-6">
      {/* Header + view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Model Comparison</h2>
        <div className="flex gap-1">
          {(["bar","radar","table"] as const).map((v) => (
            <button key={v} onClick={() => setViewMode(v)}
              className={cn("tab-btn text-xs px-3 py-1.5", viewMode === v && "active")}>
              {v === "bar" ? "Bar Chart" : v === "radar" ? "Radar" : "Table"}
            </button>
          ))}
        </div>
      </div>

      {/* Model selector */}
      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
        <div className="flex items-center justify-between mb-3">
          <p className="text-slate-300 text-sm font-medium">
            Select models to compare <span className="text-slate-500">({selectedKeys.size} of {allData.length})</span>
          </p>
          <div className="flex gap-2 text-xs">
            <button onClick={() => setSelectedKeys(new Set(allData.map((r) => r.model_key)))}
              className="text-brand-400 hover:text-brand-300">All</button>
            <span className="text-slate-700">|</span>
            <button onClick={() => setSelectedKeys(new Set())}
              className="text-slate-500 hover:text-slate-300">None</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {allData.map((row, i) => {
            const sel = selectedKeys.has(row.model_key);
            const color = COLORS[i % COLORS.length];
            return (
              <button key={row.model_key} onClick={() => toggleKey(row.model_key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                  sel ? "text-white" : "bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300"
                )}
                style={sel ? { borderColor: color, background: color + "22" } : {}}>
                {sel
                  ? <CheckSquare className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                  : <Square className="w-3.5 h-3.5 shrink-0" />}
                {row.model_name}
              </button>
            );
          })}
        </div>
      </div>

      {data.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-6">Select at least one model above.</p>
      )}

      {data.length >= 1 && (
        <>
          {/* BAR CHART */}
          {viewMode === "bar" && (
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <p className="text-slate-400 text-xs font-medium">Metric:</p>
                <div className="flex flex-wrap gap-1.5">
                  {allMetricKeys.map((m) => (
                    <button key={m} onClick={() => setChartMetric(m)}
                      className={cn("px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                        chartMetric === m
                          ? "bg-brand-600 border-brand-500 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                      )}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData} margin={{ top: 8, right: 16, left: -10, bottom: 64 }} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickFormatter={(v) => isPercentMetric(chartMetric) ? `${(v * 100).toFixed(0)}%` : formatNumber(v, 2)}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "#ffffff06" }} />
                    <Bar dataKey="value" name={chartMetric} radius={[6, 6, 0, 0]}>
                      {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-3 justify-center">
                  {data.map((row, i) => (
                    <span key={row.model_key} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="w-3 h-3 rounded" style={{ background: COLORS[allData.findIndex((r) => r.model_key === row.model_key) % COLORS.length] }} />
                      {row.model_name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RADAR CHART */}
          {viewMode === "radar" && (
            radarData.length > 0 ? (
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                <p className="text-slate-400 text-xs text-center mb-1">Normalized per metric (higher = better)</p>
                <ResponsiveContainer width="100%" height={360}>
                  <RadarChart data={radarData} outerRadius="72%">
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 9 }} angle={30} />
                    {data.map((row, i) => (
                      <Radar key={row.model_key} name={row.model_name} dataKey={row.model_name}
                        stroke={COLORS[allData.findIndex((r) => r.model_key === row.model_key) % COLORS.length]}
                        fill={COLORS[allData.findIndex((r) => r.model_key === row.model_key) % COLORS.length]}
                        fillOpacity={0.12} strokeWidth={2} />
                    ))}
                    <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8", paddingTop: 8 }} />
                    <Tooltip content={<ChartTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-6">No "higher is better" metrics available for radar chart.</p>
            )
          )}

          {/* TABLE */}
          {viewMode === "table" && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-slate-400 text-xs">Sort by:</p>
                <select className="input text-xs w-44" value={sortMetric} onChange={(e) => setSortMetric(e.target.value)}>
                  {allMetricKeys.map((k) => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div className="overflow-auto rounded-xl border border-slate-700/50">
                <table className="w-full text-xs min-w-max">
                  <thead>
                    <tr className="bg-slate-800">
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold sticky left-0 bg-slate-800 border-b border-slate-700 z-10">Model</th>
                      <th className="px-3 py-3 text-left text-slate-400 border-b border-slate-700">Task</th>
                      {allMetricKeys.map((m) => (
                        <th key={m} onClick={() => setSortMetric(m)}
                          className={cn("px-3 py-3 text-left border-b border-slate-700 cursor-pointer whitespace-nowrap hover:text-white select-none",
                            sortMetric === m ? "text-brand-300 font-semibold" : "text-slate-400 font-medium"
                          )}>
                          {m} {sortMetric === m ? (LOWER_IS_BETTER.has(m) ? "↑" : "↓") : ""}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((row, idx) => (
                      <tr key={row.model_key}
                        className={cn("border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors",
                          idx === 0 && "bg-brand-600/5"
                        )}>
                        <td className="px-4 py-2.5 font-medium text-slate-200 whitespace-nowrap sticky left-0 bg-slate-900 border-r border-slate-800">
                          <span className="mr-1">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : ""}</span>
                          <span className="inline-block w-2 h-2 rounded-sm mr-1.5"
                            style={{ background: COLORS[allData.findIndex((r) => r.model_key === row.model_key) % COLORS.length] }} />
                          {row.model_name}
                        </td>
                        <td className="px-3 py-2.5 text-slate-400 capitalize">{row.task}</td>
                        {allMetricKeys.map((m) => {
                          const v = row[m];
                          const best = v !== undefined && v === bestPerMetric[m];
                          return (
                            <td key={m} className={cn("px-3 py-2.5 font-mono whitespace-nowrap",
                              best ? "text-emerald-300 font-bold" : "text-slate-300")}>
                              {v != null ? (
                                <span className="flex items-center gap-1">
                                  {formatMetric(m, v)}
                                  {best && (HIGHER_IS_BETTER.has(m)
                                    ? <TrendingUp className="w-3 h-3 text-emerald-400" />
                                    : <TrendingDown className="w-3 h-3 text-emerald-400" />)}
                                </span>
                              ) : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
