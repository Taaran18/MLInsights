"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import {
  CircleAlert,
  CircleCheck,
  Download,
  FileBraces,
  FileSpreadsheet,
  FileText,
  Package,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Controls";
import { Callout } from "@/components/ui/Feedback";
import { PageHeader } from "@/components/ui/Layout";
import { getErrorMessage, saveBlob } from "@/lib/api/client";
import { api, reportPaths } from "@/lib/api/endpoints";
import { useReadySession } from "@/lib/session";
import { SESSION_TTL_HOURS } from "@/lib/site";
import { cn, formatBytes, stripExtension } from "@/lib/utils";

type DownloadState =
  | { status: "idle" }
  | { status: "busy" }
  | { status: "done"; size: number }
  | { status: "error"; message: string };

function useDownload() {
  const [state, setState] = useState<DownloadState>({ status: "idle" });
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = async (path: string, filename: string) => {
    if (state.status === "busy") return;
    setState({ status: "busy" });
    try {
      const { blob } = await api.download(path);
      saveBlob(blob, filename);
      setState({ status: "done", size: blob.size });
      toast.success(`Downloaded ${filename}.`);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(
        () => setState({ status: "idle" }),
        4000,
      );
    } catch (error) {
      setState({ status: "error", message: getErrorMessage(error) });
    }
  };

  return { state, run };
}

interface ExportCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  format: string;
  filename: string;
  path: string;
  disabledReason?: string;
  extra?: ReactNode;
}

function ExportCard({
  icon,
  title,
  description,
  format,
  filename,
  path,
  disabledReason,
  extra,
}: ExportCardProps) {
  const { state, run } = useDownload();
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex size-12 items-center justify-center rounded-xl border border-brand-line bg-brand-soft text-brand [&_svg]:size-5.5">
          {icon}
        </span>
        <Badge tone="brand" className="font-mono">
          {format}
        </Badge>
      </div>
      <h2 className="mt-5 text-xl font-bold tracking-tight text-fg">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-muted">
        {description}
      </p>
      {extra ? <div className="mt-4">{extra}</div> : null}
      <p
        className="mt-4 truncate font-mono text-xs text-fg-subtle"
        title={filename}
      >
        {filename}
      </p>
      <div className="mt-3" aria-live="polite">
        {disabledReason ? (
          <p className="rounded-xl border border-border bg-bg-alt p-3 text-sm text-fg-muted">
            {disabledReason}
          </p>
        ) : (
          <Button
            className="w-full"
            variant={state.status === "done" ? "secondary" : "primary"}
            loading={state.status === "busy"}
            loadingText="Preparing Download…"
            onClick={() => void run(path, filename)}
          >
            {state.status === "done" ? (
              <>
                <CircleCheck className="text-success" aria-hidden="true" />
                Downloaded · {formatBytes(state.size)}
              </>
            ) : (
              <>
                <Download aria-hidden="true" />
                Download {title}
              </>
            )}
          </Button>
        )}
        {state.status === "error" ? (
          <p
            role="alert"
            className="mt-2 flex items-start gap-1.5 text-sm text-danger"
          >
            <CircleAlert
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            {state.message}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function ExportView() {
  const { sessionId, filename, overview } = useReadySession();
  const base = stripExtension(filename);
  const uploadedExcel = /\.xlsx?$/i.test(filename);
  const [format, setFormat] = useState<"csv" | "xlsx">(
    uploadedExcel ? "xlsx" : "csv",
  );

  return (
    <div className="space-y-10 lg:space-y-12">
      <PageHeader
        eyebrow="Step 7 · Share"
        title="Export Your Work"
        description="Download a report to share, your cleaned data, and trained models you can load in Python."
      />

      <Callout
        tone="warning"
        icon={<Timer />}
        title={`Download what you need within ${SESSION_TTL_HOURS} hours`}
      >
        Sessions expire {SESSION_TTL_HOURS} hours after upload, so exports
        won&apos;t be available after that.
      </Callout>

      <section
        aria-label="Downloads"
        className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-4"
      >
        <ExportCard
          icon={<FileText aria-hidden="true" />}
          title="PDF Report"
          format=".pdf"
          description="A shareable summary: dataset overview, missing values, and every trained model's scores."
          filename={`${base}_report.pdf`}
          path={reportPaths.pdf(sessionId)}
        />
        <ExportCard
          icon={<FileSpreadsheet aria-hidden="true" />}
          title="Dataset"
          format={`.${format}`}
          description={
            overview.is_cleaned
              ? "Your cleaned data, ready to use in spreadsheets or other tools."
              : "Your data as uploaded. Clean it first if you want gaps filled and duplicates removed."
          }
          filename={`${base}_cleaned.${format}`}
          path={reportPaths.dataset(sessionId, format)}
          extra={
            <Segmented
              aria-label="Dataset file format"
              value={format}
              onChange={setFormat}
              size="sm"
              fullWidth
              options={[
                { value: "csv", label: "CSV" },
                { value: "xlsx", label: "Excel" },
              ]}
            />
          }
        />
        <ExportCard
          icon={<FileBraces aria-hidden="true" />}
          title="Session Metadata"
          format=".json"
          description="Settings, feature columns, and full results for every model in a machine-readable file."
          filename={`${base}_meta.json`}
          path={reportPaths.meta(sessionId)}
        />
        <ExportCard
          icon={<Package aria-hidden="true" />}
          title="Trained Models"
          format=".zip"
          description="Every fitted model as a .pkl file, including its scaler, plus a manifest of the columns it expects."
          filename={`${base}_models.zip`}
          path={reportPaths.models(sessionId)}
          disabledReason={
            overview.trained_models === 0
              ? "Train at least one model to download model files."
              : undefined
          }
          extra={
            overview.trained_models === 0 ? (
              <ButtonLink
                href="/app/train"
                variant="secondary"
                size="sm"
                className="w-full"
              >
                Train Models
              </ButtonLink>
            ) : (
              <p className="text-sm text-fg-muted">
                Includes{" "}
                <span className="font-semibold text-fg">
                  {overview.trained_models}
                </span>{" "}
                {overview.trained_models === 1 ? "model" : "models"}.
              </p>
            )
          }
        />
      </section>

      <section
        aria-labelledby="using-models"
        className={cn(
          "rounded-2xl border border-border bg-bg-alt p-6",
          overview.trained_models === 0 && "opacity-80",
        )}
      >
        <h2
          id="using-models"
          className="text-lg font-bold tracking-tight text-fg"
        >
          Using an Exported Model in Python
        </h2>
        <p className="mt-1 text-sm text-fg-muted">
          Load a model with joblib, then pass rows with the same columns listed
          in manifest.json.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface p-4 font-mono text-sm leading-relaxed text-fg">
          <code>{`import json
import joblib
import pandas as pd

entry = json.load(open("manifest.json"))[0]
model = joblib.load(entry["file"])
rows = pd.read_csv("new_data.csv")
predictions = model.predict(rows[entry["feature_columns"]])`}</code>
        </pre>
        <p className="mt-3 text-xs text-fg-subtle">
          Text columns were converted to numbers during training, so apply the
          same encoding to new data. Only load .pkl files from sources you
          trust.
        </p>
      </section>
    </div>
  );
}
