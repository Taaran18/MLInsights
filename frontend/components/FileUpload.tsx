"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { uploadDataset } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Props {
  onUploaded: (sessionId: string, filename: string) => void;
}

export default function FileUpload({ onUploaded }: Props) {
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!accepted.length) return;
      const file = accepted[0];
      setLoading(true);
      try {
        const res = await uploadDataset(file);
        toast.success(`Uploaded ${file.name} — ${res.rows} rows, ${res.columns} cols`);
        onUploaded(res.session_id, file.name);
      } catch (e: any) {
        toast.error(e?.response?.data?.detail || "Upload failed");
      } finally {
        setLoading(false);
      }
    },
    [onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    disabled: loading,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen px-4"
    >
      {/* Logo / Title */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 mb-4">
          <FileSpreadsheet className="w-8 h-8 text-brand-400" />
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">
          ML<span className="text-brand-400">Insights</span>
        </h1>
        <p className="mt-2 text-slate-400 text-lg">
          Upload any dataset and get instant insights, model recommendations & reports.
        </p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "w-full max-w-2xl border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-brand-500 bg-brand-600/10"
            : "border-slate-700 bg-slate-900 hover:border-slate-500 hover:bg-slate-800/50",
          loading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
            <p className="text-slate-300 font-medium">Parsing dataset…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className={cn("w-10 h-10", isDragActive ? "text-brand-400" : "text-slate-500")} />
            <p className="text-slate-200 font-medium text-lg">
              {isDragActive ? "Drop your file here" : "Drag & drop your dataset"}
            </p>
            <p className="text-slate-500 text-sm">or click to browse files</p>
            <div className="flex gap-2 mt-2">
              {[".csv", ".xlsx", ".xls"].map((ext) => (
                <span key={ext} className="badge bg-slate-800 text-slate-400 border border-slate-700 text-xs px-2.5 py-1">
                  {ext}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-slate-600 text-sm text-center max-w-md">
        Files are processed in-memory and never stored permanently.
      </p>
    </motion.div>
  );
}
