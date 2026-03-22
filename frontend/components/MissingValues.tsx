"use client";
import { useEffect, useState } from "react";
import { getMissing, cleanDataset, resetCleaning } from "@/lib/api";
import type { CleanOptions } from "@/lib/api";
import { Loader2, Sparkles, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Props {
  sessionId: string;
  onCleaned: () => void;
  onSessionExpired: () => void;
}

interface ColumnMissing {
  count: number;
  percentage: number;
  dtype: string;
}

export default function MissingValues({ sessionId, onCleaned, onSessionExpired }: Props) {
  const [missingData, setMissingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [options, setOptions] = useState<CleanOptions>({
    drop_duplicates: true,
    fill_numeric: "mean",
    fill_categorical: "mode",
    drop_high_missing_cols: null,
    drop_high_missing_rows: null,
    normalize_empty_strings: true,
  });

  const fetchMissing = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const d = await getMissing(sessionId);
      setMissingData(d);
    } catch (e: any) {
      if (e?.response?.status === 404) { onSessionExpired(); return; }
      setFetchError(e?.response?.data?.detail || "Failed to load missing value info.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMissing(); }, [sessionId]);

  const handleClean = async () => {
    setCleaning(true);
    try {
      const res = await cleanDataset(sessionId, options);
      toast.success(`Cleaned! Rows: ${res.before.rows} → ${res.after.rows}, Missing: ${res.before.missing} → ${res.after.missing}`);
      onCleaned();
      await fetchMissing();
    } catch (e: any) {
      if (e?.response?.status === 404) { onSessionExpired(); return; }
      toast.error(e?.response?.data?.detail || "Cleaning failed");
    } finally {
      setCleaning(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetCleaning(sessionId);
      toast.success("Reverted to original dataset.");
      onCleaned();
      await fetchMissing();
    } catch (e: any) {
      if (e?.response?.status === 404) { onSessionExpired(); return; }
      toast.error("Reset failed");
    }
  };

  if (loading) return (
    <div className="card p-6 flex items-center justify-center h-40">
      <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
    </div>
  );

  if (fetchError) return (
    <div className="card p-6 flex items-center gap-3 text-red-300">
      <AlertTriangle className="w-5 h-5 shrink-0" />
      <p className="text-sm">{fetchError}</p>
    </div>
  );

  const perCol: Record<string, ColumnMissing> = missingData?.per_column || {};
  const colsWithMissing = Object.entries(perCol).filter(([, v]) => v.count > 0);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Missing Values</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {missingData?.total_missing?.toLocaleString()} missing cells ({missingData?.total_missing_percentage}%)
          </p>
        </div>
        <button onClick={handleReset} className="btn-secondary flex items-center gap-2 text-sm">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {colsWithMissing.length === 0 ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-emerald-300 text-sm">No missing values found in this dataset!</p>
        </div>
      ) : (
        <>
          {/* Missing per column */}
          <div className="overflow-auto max-h-64 mb-6">
            <table className="w-full text-xs">
              <thead className="sticky top-0">
                <tr className="bg-slate-800">
                  <th className="px-3 py-2 text-left text-slate-400 border-b border-slate-700">Column</th>
                  <th className="px-3 py-2 text-left text-slate-400 border-b border-slate-700">Type</th>
                  <th className="px-3 py-2 text-left text-slate-400 border-b border-slate-700">Missing</th>
                  <th className="px-3 py-2 text-left text-slate-400 border-b border-slate-700">%</th>
                  <th className="px-3 py-2 text-left text-slate-400 border-b border-slate-700">Bar</th>
                </tr>
              </thead>
              <tbody>
                {colsWithMissing.map(([col, info]) => (
                  <tr key={col} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                    <td className="px-3 py-1.5 text-slate-200 font-medium">{col}</td>
                    <td className="px-3 py-1.5 text-slate-400">{info.dtype}</td>
                    <td className="px-3 py-1.5 text-red-300">{info.count.toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-slate-300">{info.percentage.toFixed(1)}%</td>
                    <td className="px-3 py-1.5 w-32">
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", info.percentage > 50 ? "bg-red-500" : info.percentage > 20 ? "bg-yellow-500" : "bg-orange-400")}
                          style={{ width: `${info.percentage}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Clean Options */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 mb-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" /> Cleaning Options
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {/* Fill numeric */}
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Fill Numeric Missing</label>
                <select
                  className="input text-sm"
                  value={options.fill_numeric || ""}
                  onChange={(e) => setOptions({ ...options, fill_numeric: e.target.value || null })}
                >
                  <option value="">Don't fill</option>
                  <option value="mean">Mean</option>
                  <option value="median">Median</option>
                  <option value="zero">Zero</option>
                </select>
              </div>
              {/* Fill categorical */}
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Fill Categorical Missing</label>
                <select
                  className="input text-sm"
                  value={options.fill_categorical || ""}
                  onChange={(e) => setOptions({ ...options, fill_categorical: e.target.value || null })}
                >
                  <option value="">Don't fill</option>
                  <option value="mode">Mode (most frequent)</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              {/* Drop cols threshold */}
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">
                  Drop Columns with &gt;{options.drop_high_missing_cols ?? "—"}% Missing
                </label>
                <input
                  type="number" min={0} max={100}
                  placeholder="e.g. 50 (leave blank to skip)"
                  className="input text-sm"
                  value={options.drop_high_missing_cols ?? ""}
                  onChange={(e) => setOptions({ ...options, drop_high_missing_cols: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              {/* Drop rows threshold */}
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">
                  Drop Rows with &gt;{options.drop_high_missing_rows ?? "—"}% Missing
                </label>
                <input
                  type="number" min={0} max={100}
                  placeholder="e.g. 80 (leave blank to skip)"
                  className="input text-sm"
                  value={options.drop_high_missing_rows ?? ""}
                  onChange={(e) => setOptions({ ...options, drop_high_missing_rows: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              {/* Checkboxes */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.drop_duplicates}
                  onChange={(e) => setOptions({ ...options, drop_duplicates: e.target.checked })}
                  className="w-4 h-4 accent-brand-500"
                />
                <span className="text-slate-300">Drop duplicate rows</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.normalize_empty_strings}
                  onChange={(e) => setOptions({ ...options, normalize_empty_strings: e.target.checked })}
                  className="w-4 h-4 accent-brand-500"
                />
                <span className="text-slate-300">Normalize empty strings → NaN</span>
              </label>
            </div>
          </div>

          <button onClick={handleClean} disabled={cleaning} className="btn-primary flex items-center gap-2 w-full justify-center py-3">
            {cleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {cleaning ? "Cleaning…" : "Clean Dataset"}
          </button>
        </>
      )}
    </div>
  );
}
