"use client";
import { useState } from "react";
import { FileText, Table2, FileDown, FileJson, Package, Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Props {
  sessionId: string;
  filename: string;
}

/**
 * Fetch through our own Next.js proxy (/api/download?path=...) so the request
 * is same-origin. That lets us use a.download = "proper-name.ext" which the
 * browser respects for same-origin blob URLs.
 *
 * Direct fetch to localhost:8000 (cross-origin) causes Chrome to generate its
 * own UUID filename, ignoring both a.download and Content-Disposition.
 */
async function downloadViaProxy(backendPath: string, filename: string) {
  const proxyUrl = `/api/download?path=${encodeURIComponent(backendPath)}`;
  const res = await fetch(proxyUrl);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = text;
    try { detail = JSON.parse(text)?.error || text; } catch { /* raw text is fine */ }
    throw new Error(detail || `Server returned ${res.status}`);
  }

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename; // Works because blob: URL is same-origin
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

interface CardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  loading: boolean;
  onClick: () => void;
}

function DownloadCard({ icon, iconBg, title, subtitle, badge, badgeColor, loading, onClick }: CardProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "group flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all duration-150 w-full",
        "bg-slate-800/50 hover:bg-brand-600/10 border-slate-700/60 hover:border-brand-500/40",
        loading && "opacity-60 cursor-not-allowed"
      )}
    >
      <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center border transition-colors relative", iconBg)}>
        {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : icon}
        {badge && !loading && (
          <span className={cn("absolute -top-2 -right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full border", badgeColor)}>
            {badge}
          </span>
        )}
      </div>
      <div className="text-center">
        <p className="text-slate-200 font-semibold text-sm">{title}</p>
        <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>
      </div>
      <span className="flex items-center gap-1.5 text-xs font-medium text-brand-400">
        <Download className="w-3.5 h-3.5" />
        {loading ? "Downloading…" : "Download"}
      </span>
    </button>
  );
}

export default function ReportDownload({ sessionId, filename }: Props) {
  const [loadingPdf,  setLoadingPdf]  = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [loadingZip,  setLoadingZip]  = useState(false);

  const base      = filename.replace(/\.[^.]+$/, "");
  const uploadExt = filename.split(".").pop()?.toLowerCase() ?? "csv";
  const isXlsx    = uploadExt === "xlsx";
  const dataFmt   = isXlsx ? "xlsx" : "csv";

  const handle = async (path: string, name: string, setLoading: (v: boolean) => void) => {
    setLoading(true);
    try {
      await downloadViaProxy(path, name);
    } catch (e: any) {
      toast.error(e?.message || "Download failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-white mb-1">Download</h2>
      <p className="text-slate-400 text-sm mb-6">
        Export your PDF report, dataset, session metadata, and trained model files.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DownloadCard
          loading={loadingPdf}
          onClick={() => handle(`/api/report/${sessionId}/pdf`, `${base}_report.pdf`, setLoadingPdf)}
          iconBg="bg-red-500/15 border-red-500/20 group-hover:bg-red-500/25"
          icon={<FileText className="w-7 h-7 text-red-400" />}
          badge="PDF"
          badgeColor="bg-red-500/20 text-red-400 border-red-500/30"
          title="Full Report"
          subtitle="Dataset overview + all model results"
        />

        <DownloadCard
          loading={loadingData}
          onClick={() => handle(
            `/api/report/${sessionId}/dataset?fmt=${dataFmt}`,
            `${base}_cleaned.${dataFmt}`,
            setLoadingData,
          )}
          iconBg="bg-emerald-500/15 border-emerald-500/20 group-hover:bg-emerald-500/25"
          icon={isXlsx
            ? <FileDown className="w-7 h-7 text-emerald-400" />
            : <Table2 className="w-7 h-7 text-emerald-400" />}
          badge={isXlsx ? "XLSX" : "CSV"}
          badgeColor="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
          title={isXlsx ? "Excel Dataset" : "CSV Dataset"}
          subtitle={`Current (cleaned) dataset as .${dataFmt}`}
        />

        <DownloadCard
          loading={loadingMeta}
          onClick={() => handle(`/api/report/${sessionId}/meta`, `${base}_meta.json`, setLoadingMeta)}
          iconBg="bg-yellow-500/15 border-yellow-500/20 group-hover:bg-yellow-500/25"
          icon={<FileJson className="w-7 h-7 text-yellow-400" />}
          badge="JSON"
          badgeColor="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
          title="Session Meta"
          subtitle="Filename, features, trained model info"
        />

        <DownloadCard
          loading={loadingZip}
          onClick={() => handle(`/api/report/${sessionId}/models_zip`, `${base}_models.zip`, setLoadingZip)}
          iconBg="bg-purple-500/15 border-purple-500/20 group-hover:bg-purple-500/25"
          icon={<Package className="w-7 h-7 text-purple-400" />}
          badge=".pkl"
          badgeColor="bg-purple-500/20 text-purple-400 border-purple-500/30"
          title="Trained Models"
          subtitle="All .pkl files zipped (train first)"
        />
      </div>

      <p className="text-slate-600 text-xs mt-5 text-center">
        Train at least one model before downloading the models ZIP.
        PDF and meta.json are available immediately after upload.
      </p>
    </div>
  );
}
