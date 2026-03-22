"use client";
import { useState, useCallback } from "react";
import FileUpload from "@/components/FileUpload";
import DataInsights from "@/components/DataInsights";
import MissingValues from "@/components/MissingValues";
import ModelSelection from "@/components/ModelSelection";
import TrainingResults from "@/components/TrainingResults";
import ModelComparison from "@/components/ModelComparison";
import ReportDownload from "@/components/ReportDownload";
import { getOverview } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Database, BarChart2, Wand2, BrainCircuit, GitCompare, Download,
  Upload, ChevronRight, FileSpreadsheet, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

type Section = "insights" | "missing" | "models" | "results" | "compare" | "download";

const NAV_ITEMS: { key: Section; label: string; icon: React.ElementType }[] = [
  { key: "insights",  label: "Dataset Insights", icon: Database },
  { key: "missing",   label: "Missing Values",   icon: BarChart2 },
  { key: "models",    label: "Train Models",      icon: BrainCircuit },
  { key: "results",   label: "Results",           icon: Wand2 },
  { key: "compare",   label: "Compare",           icon: GitCompare },
  { key: "download",  label: "Download",          icon: Download },
];

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [overview, setOverview] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<Section>("insights");
  const [trainRefreshKey, setTrainRefreshKey] = useState(0);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Called by any child component when it receives a 404/session-not-found error
  const handleSessionExpired = useCallback(() => {
    setSessionExpired(true);
  }, []);

  const resetToUpload = useCallback(() => {
    setSessionId(null);
    setOverview(null);
    setFilename("");
    setSessionExpired(false);
    setActiveSection("insights");
  }, []);

  const handleUploaded = useCallback(async (sid: string, fname: string) => {
    setSessionExpired(false);
    setSessionId(sid);
    setFilename(fname);
    try {
      const ov = await getOverview(sid);
      setOverview(ov);
    } catch {
      toast.error("Could not load dataset overview — please try uploading again.");
      return;
    }
    setActiveSection("insights");
  }, []);

  const handleCleaned = useCallback(async () => {
    if (!sessionId) return;
    try {
      const ov = await getOverview(sessionId);
      setOverview(ov);
    } catch {
      /* overview refresh is non-critical */
    }
  }, [sessionId]);

  const handleTrained = useCallback(() => {
    setTrainRefreshKey((k) => k + 1);
    setActiveSection("results");
  }, []);

  // ── Upload screen ──────────────────────────────────────────────────────────
  if (!sessionId) {
    return <FileUpload onUploaded={handleUploaded} />;
  }

  // ── Session-expired overlay ────────────────────────────────────────────────
  if (sessionExpired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <div className="card p-8 max-w-md w-full text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Session Expired</h2>
          <p className="text-slate-400 text-sm">
            The backend was restarted and your session was lost. Please upload your dataset again.
          </p>
          <button onClick={resetToUpload} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" /> Upload Again
          </button>
        </div>
      </div>
    );
  }

  // ── Main dashboard ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-brand-400" />
            <span className="font-bold text-white">ML<span className="text-brand-400">Insights</span></span>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-slate-300 text-sm truncate max-w-48">{filename}</span>
            {overview?.is_cleaned && (
              <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs">Cleaned</span>
            )}
          </div>
          <button
            onClick={resetToUpload}
            className="btn-secondary flex items-center gap-1.5 text-sm py-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> New Dataset
          </button>
        </div>
      </header>

      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-52 border-r border-slate-800 p-3 gap-1 shrink-0">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                activeSection === key
                  ? "bg-brand-600/15 text-brand-300 border border-brand-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950 border-t border-slate-800 flex overflow-x-auto px-2 py-1 gap-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                activeSection === key ? "text-brand-300" : "text-slate-500"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              {activeSection === "insights" && overview && (
                <DataInsights
                  sessionId={sessionId}
                  overview={overview}
                  onSessionExpired={handleSessionExpired}
                />
              )}
              {activeSection === "missing" && (
                <MissingValues
                  sessionId={sessionId}
                  onCleaned={handleCleaned}
                  onSessionExpired={handleSessionExpired}
                />
              )}
              {activeSection === "models" && overview && (
                <ModelSelection
                  sessionId={sessionId}
                  columns={overview.column_names || []}
                  onTrained={handleTrained}
                  onSessionExpired={handleSessionExpired}
                />
              )}
              {activeSection === "results" && (
                <TrainingResults
                  sessionId={sessionId}
                  refreshKey={trainRefreshKey}
                  onSessionExpired={handleSessionExpired}
                />
              )}
              {activeSection === "compare" && (
                <ModelComparison
                  sessionId={sessionId}
                  refreshKey={trainRefreshKey}
                  onSessionExpired={handleSessionExpired}
                />
              )}
              {activeSection === "download" && (
                <ReportDownload sessionId={sessionId} filename={filename} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
