"use client";
import { useEffect, useState } from "react";
import { getHead, getTail, getDescribe, getCorrelation, getDtypes } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface Props {
  sessionId: string;
  overview: any;
  onSessionExpired: () => void;
}

type Tab = "head" | "tail" | "describe" | "dtypes" | "correlation";

function DataTable({ data, columns }: { data: any[]; columns: string[] }) {
  return (
    <div className="overflow-auto max-h-96">
      <table className="w-full text-xs min-w-max">
        <thead className="sticky top-0">
          <tr className="bg-slate-800">
            <th className="px-3 py-2 text-left text-slate-400 font-medium border-b border-slate-700">#</th>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 text-left text-slate-400 font-medium border-b border-slate-700 whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/40">
              <td className="px-3 py-1.5 text-slate-500">{i}</td>
              {columns.map((col) => (
                <td key={col} className="px-3 py-1.5 text-slate-300 whitespace-nowrap">
                  {row[col] == null ? <span className="text-red-400/70 italic">null</span> : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CorrelationHeatmap({ matrix }: { matrix: Record<string, Record<string, number>> }) {
  const cols = Object.keys(matrix);
  if (!cols.length) return <p className="text-slate-500 text-sm">No numeric columns for correlation.</p>;

  const getColor = (v: number | null) => {
    if (v == null) return "#1e293b";
    const abs = Math.abs(v);
    if (v > 0) return `rgba(99,102,241,${abs.toFixed(2)})`;
    return `rgba(239,68,68,${abs.toFixed(2)})`;
  };

  return (
    <div className="overflow-auto">
      <table className="text-xs">
        <thead>
          <tr>
            <th className="p-1"></th>
            {cols.map((c) => (
              <th key={c} className="p-1 text-slate-400 font-medium whitespace-nowrap" style={{ maxWidth: 80 }}>
                <span className="block truncate" style={{ maxWidth: 80 }}>{c}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cols.map((row) => (
            <tr key={row}>
              <td className="p-1 text-slate-400 font-medium whitespace-nowrap pr-3">{row}</td>
              {cols.map((col) => {
                const v = matrix[row]?.[col];
                return (
                  <td key={col} className="p-0.5">
                    <div
                      className="w-14 h-9 flex items-center justify-center rounded text-xs font-mono"
                      style={{ background: getColor(v) }}
                      title={`${row} × ${col}: ${v}`}
                    >
                      {v != null ? v.toFixed(2) : "—"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DataInsights({ sessionId, overview, onSessionExpired }: Props) {
  const [tab, setTab] = useState<Tab>("head");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setData(null);
    setLoading(true);
    const fetch = async () => {
      try {
        let res;
        if (tab === "head") res = await getHead(sessionId);
        else if (tab === "tail") res = await getTail(sessionId);
        else if (tab === "describe") res = await getDescribe(sessionId);
        else if (tab === "dtypes") res = await getDtypes(sessionId);
        else if (tab === "correlation") res = await getCorrelation(sessionId);
        setData(res);
      } catch (e: any) {
        if (e?.response?.status === 404) { onSessionExpired(); return; }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [tab, sessionId]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "head", label: "Head (10)" },
    { key: "tail", label: "Tail (10)" },
    { key: "describe", label: "Describe" },
    { key: "dtypes", label: "Data Types" },
    { key: "correlation", label: "Correlation" },
  ];

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-white mb-1">Dataset Preview</h2>
      <p className="text-slate-400 text-sm mb-4">
        {overview.rows?.toLocaleString()} rows × {overview.columns} columns •{" "}
        {overview.memory_usage_kb} KB
      </p>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Rows", value: overview.rows?.toLocaleString() },
          { label: "Columns", value: overview.columns },
          { label: "Numeric", value: overview.numeric_columns?.length },
          { label: "Categorical", value: overview.categorical_columns?.length },
          { label: "Duplicates", value: overview.duplicate_rows },
          { label: "Memory", value: `${overview.memory_usage_kb} KB` },
          { label: "Missing Cells", value: overview.total_missing?.toLocaleString() },
          { label: "Missing %", value: `${overview.total_missing_percentage}%` },
        ].map((item) => (
          <div key={item.label} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <p className="text-slate-400 text-xs">{item.label}</p>
            <p className="text-white font-semibold text-lg mt-0.5">{item.value ?? "—"}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap mb-4">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} className={cn("tab-btn", tab === key && "active")}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      ) : data ? (
        <>
          {(tab === "head" || tab === "tail") && data.data && (
            <DataTable data={data.data} columns={data.columns} />
          )}
          {tab === "describe" && data.describe && (
            <div className="overflow-auto max-h-96">
              <table className="w-full text-xs min-w-max">
                <thead className="sticky top-0">
                  <tr className="bg-slate-800">
                    <th className="px-3 py-2 text-left text-slate-400 border-b border-slate-700">Stat</th>
                    {Object.keys(data.describe).map((col) => (
                      <th key={col} className="px-3 py-2 text-left text-slate-400 border-b border-slate-700 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(Object.values(data.describe)[0] as any).map((stat) => (
                    <tr key={stat} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                      <td className="px-3 py-1.5 text-slate-400 font-medium">{stat}</td>
                      {Object.values(data.describe).map((colData: any, i) => (
                        <td key={i} className="px-3 py-1.5 text-slate-300 whitespace-nowrap">
                          {colData[stat] != null
                            ? typeof colData[stat] === "number"
                              ? colData[stat].toFixed(4)
                              : String(colData[stat])
                            : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === "dtypes" && data.dtypes && (
            <div className="overflow-auto max-h-96">
              <table className="w-full text-xs">
                <thead className="sticky top-0">
                  <tr className="bg-slate-800">
                    <th className="px-3 py-2 text-left text-slate-400 border-b border-slate-700">Column</th>
                    <th className="px-3 py-2 text-left text-slate-400 border-b border-slate-700">Data Type</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.dtypes).map(([col, dtype]: any) => (
                    <tr key={col} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                      <td className="px-3 py-1.5 text-slate-300">{col}</td>
                      <td className="px-3 py-1.5">
                        <span className={cn("badge border text-xs",
                          dtype.includes("int") || dtype.includes("float") ? "bg-blue-500/10 text-blue-300 border-blue-500/20" :
                          dtype.includes("object") ? "bg-amber-500/10 text-amber-300 border-amber-500/20" :
                          "bg-slate-500/10 text-slate-300 border-slate-500/20"
                        )}>
                          {dtype}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === "correlation" && <CorrelationHeatmap matrix={data.correlation || {}} />}
        </>
      ) : null}
    </div>
  );
}
