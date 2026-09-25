"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowRight,
  ArrowUpRight,
  Bird,
  CircleAlert,
  CloudUpload,
  FileSpreadsheet,
  Flower2,
  HeartPulse,
  LoaderCircle,
  ShieldCheck,
  Wine,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Controls";
import { PageHeader } from "@/components/ui/Layout";
import { getErrorMessage, isApiError } from "@/lib/api/client";
import { api } from "@/lib/api/endpoints";
import type { SessionSummary } from "@/lib/api/types";
import { useSession } from "@/lib/session";
import {
  recordUpload,
  setCurrentSession,
  useSessionHistory,
} from "@/lib/session-store";
import {
  ACCEPTED_EXTENSIONS,
  MAX_UPLOAD_MB,
  SESSION_TTL_HOURS,
} from "@/lib/site";
import { cn, formatBytes, formatRelativeTime, countLabel } from "@/lib/utils";

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; filename: string; size: number; progress: number }
  | { status: "processing"; filename: string; size: number }
  | { status: "error"; message: string };

const SAMPLES = [
  {
    file: "iris.csv",
    title: "Iris Flowers",
    task: "Classification",
    rows: 150,
    columns: 5,
    icon: Flower2,
    accent: "from-emerald-400 to-teal-500",
    description: "Predict a flower's species from petal and sepal size.",
  },
  {
    file: "penguins.csv",
    title: "Palmer Penguins",
    task: "Classification",
    rows: 344,
    columns: 7,
    icon: Bird,
    accent: "from-sky-400 to-blue-500",
    description: "Has missing values and text columns, great for cleaning.",
  },
  {
    file: "wine.csv",
    title: "Wine Cultivars",
    task: "Classification",
    rows: 178,
    columns: 14,
    icon: Wine,
    accent: "from-rose-400 to-pink-600",
    description: "Tell three grape cultivars apart from chemical analysis.",
  },
  {
    file: "diabetes.csv",
    title: "Diabetes Progression",
    task: "Regression",
    rows: 442,
    columns: 11,
    icon: HeartPulse,
    accent: "from-amber-400 to-orange-500",
    description: "Predict disease progression from age, BMI, and blood tests.",
  },
];

const TIPS = [
  "One header row",
  "One row per record",
  "Include the column to predict",
];

function validateFile(file: File): string | null {
  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  if (
    !ACCEPTED_EXTENSIONS.includes(
      extension as (typeof ACCEPTED_EXTENSIONS)[number],
    )
  ) {
    return `“${file.name}” isn't a supported file. Upload a .csv, .xlsx, or .xls file.`;
  }
  if (file.size === 0)
    return `“${file.name}” is empty. Add some data and try again.`;
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return `“${file.name}” is ${formatBytes(file.size)}, which is over the ${MAX_UPLOAD_MB} MB limit. Remove columns or rows you don't need and try again.`;
  }
  return null;
}

function ContinueCard() {
  const { session, overview, status } = useSession();
  if (!session || status === "empty" || status === "restoring") return null;
  const expired = status === "expired";
  return (
    <section
      aria-label="Current dataset"
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6",
        expired
          ? "border-danger-line bg-danger-soft"
          : "border-brand-line bg-brand-soft",
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-brand-line bg-surface text-brand">
          <FileSpreadsheet className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.14em] text-fg-subtle uppercase">
            {expired ? "Session Expired" : "Continue Where You Left Off"}
          </p>
          <p className="truncate text-lg font-bold text-fg">
            {session.filename}
          </p>
          <p className="num text-sm text-fg-muted">
            {expired
              ? "This dataset was deleted from the server. Upload it again to keep working."
              : overview
                ? `${countLabel(overview.rows, "row", "rows", true)} · ${countLabel(overview.columns, "column")} · ${countLabel(overview.trained_models, "trained model")}`
                : "Loading dataset details…"}
          </p>
        </div>
      </div>
      {expired ? (
        <Button variant="secondary" onClick={() => setCurrentSession(null)}>
          Dismiss
        </Button>
      ) : (
        <ButtonLink href="/app/insights" className="shrink-0">
          Continue Analysis
          <ArrowRight aria-hidden="true" />
        </ButtonLink>
      )}
    </section>
  );
}

function RecentSessions() {
  const router = useRouter();
  const history = useSessionHistory();
  const { session } = useSession();
  const [statuses, setStatuses] = useState<Record<
    string,
    SessionSummary | null
  > | null>(null);
  const recent = history.filter((item) => item.id !== session?.id).slice(0, 4);
  const idsKey = recent.map((item) => item.id).join(",");

  useEffect(() => {
    if (!idsKey) return;
    const controller = new AbortController();
    api
      .sessionsStatus(idsKey.split(","), controller.signal)
      .then((result) => setStatuses(result.sessions))
      .catch(() => {});
    return () => controller.abort();
  }, [idsKey]);

  if (recent.length === 0) return null;

  return (
    <section aria-labelledby="recent-title" className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h2
          id="recent-title"
          className="text-xl font-bold tracking-tight text-fg"
        >
          Recent Datasets
        </h2>
        <Link
          href="/app/settings#sessions"
          className="text-sm font-semibold text-brand hover:underline"
        >
          Manage Sessions
        </Link>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {recent.map((item) => {
          const summary = statuses?.[item.id];
          const known = statuses !== null;
          const active = known && summary !== null && summary !== undefined;
          return (
            <li
              key={item.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-card"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-fg-muted">
                <FileSpreadsheet className="size-4.5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-fg">
                  {item.filename}
                </p>
                <p className="num text-xs text-fg-subtle">
                  {countLabel(item.rows, "row", "rows", true)} · uploaded{" "}
                  {formatRelativeTime(item.createdAt)}
                </p>
              </div>
              {!known ? (
                <LoaderCircle
                  className="size-4 animate-spin text-fg-subtle"
                  aria-label="Checking status"
                />
              ) : active ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setCurrentSession({ id: item.id, filename: item.filename });
                    router.push("/app/insights");
                  }}
                >
                  Open
                </Button>
              ) : (
                <Badge tone="neutral">Expired</Badge>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function UploadView() {
  const router = useRouter();
  const inputId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const busy = state.status === "uploading" || state.status === "processing";

  useEffect(() => () => controllerRef.current?.abort(), []);

  const upload = async (file: File) => {
    if (busy) return;
    const problem = validateFile(file);
    if (problem) {
      setState({ status: "error", message: problem });
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({
      status: "uploading",
      filename: file.name,
      size: file.size,
      progress: 0,
    });
    try {
      const result = await api.upload(file, {
        signal: controller.signal,
        onProgress: (progress) =>
          setState((current) =>
            current.status === "uploading" ? { ...current, progress } : current,
          ),
        onUploaded: () =>
          setState((current) =>
            current.status === "uploading"
              ? {
                  status: "processing",
                  filename: current.filename,
                  size: current.size,
                }
              : current,
          ),
      });
      recordUpload(result);
      toast.success(
        `${result.filename} is ready: ${countLabel(result.rows, "row", "rows", true)} and ${countLabel(result.columns, "column")}.`,
      );
      router.push("/app/insights");
    } catch (error) {
      if (isApiError(error) && error.kind === "aborted") {
        setState({ status: "idle" });
        toast("Upload cancelled.");
        return;
      }
      setState({ status: "error", message: getErrorMessage(error) });
    } finally {
      controllerRef.current = null;
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const loadSample = async (file: string) => {
    if (busy) return;
    try {
      const response = await fetch(`/samples/${file}`);
      if (!response.ok)
        throw new Error("The sample dataset couldn't be loaded. Try again.");
      const blob = await response.blob();
      await upload(new File([blob], file, { type: "text/csv" }));
    } catch (error) {
      setState({ status: "error", message: getErrorMessage(error) });
    }
  };

  const onDragEnter = (event: DragEvent) => {
    event.preventDefault();
    if (busy) return;
    dragDepth.current += 1;
    setDragging(true);
  };

  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (busy) return;
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 1) {
      setState({ status: "error", message: "Drop one file at a time." });
      return;
    }
    if (files[0]) void upload(files[0]);
  };

  const progressPercent =
    state.status === "uploading"
      ? state.progress * 100
      : state.status === "processing"
        ? 100
        : 0;

  return (
    <div className="space-y-12">
      <div className="flex min-h-[calc(100dvh-9.5rem)] flex-col justify-center gap-6 lg:min-h-[calc(100dvh-10.5rem)]">
        <PageHeader
          eyebrow="Step 1 · Upload"
          title="Start a New Analysis"
          description={`Drop a CSV or Excel file up to ${MAX_UPLOAD_MB} MB, or pick a sample below.`}
        />

        <section aria-label="Upload a dataset" className="space-y-3">
          <label
            htmlFor={inputId}
            onDragEnter={onDragEnter}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={cn(
              "relative flex min-h-[clamp(12rem,30dvh,21rem)] flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed px-6 py-8 text-center transition-[border-color,background-color] duration-200 has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-ring",
              busy ? "cursor-default" : "cursor-pointer",
              dragging
                ? "border-primary bg-brand-soft"
                : "border-border-strong bg-surface hover:border-brand-line hover:bg-bg-alt",
            )}
          >
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_60%_at_50%_0%,var(--brand-soft),transparent)]"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              disabled={busy}
              aria-describedby={hintId}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
              }}
            />

            {busy ? (
              <div className="relative w-full max-w-md" aria-live="polite">
                <span className="mx-auto inline-flex size-16 items-center justify-center rounded-2xl border border-brand-line bg-brand-soft text-brand">
                  <LoaderCircle
                    className="size-7 animate-spin"
                    aria-hidden="true"
                  />
                </span>
                <p className="mt-5 text-xl font-bold tracking-tight text-fg">
                  {state.status === "processing"
                    ? "Reading Your Data"
                    : "Uploading Your File"}
                </p>
                <p className="mt-1.5 truncate text-sm text-fg-muted">
                  {state.filename} · {formatBytes(state.size)}
                </p>
                <Progress
                  value={progressPercent}
                  label="Upload progress"
                  className="mt-5"
                />
                <p className="num mt-3 text-sm text-fg-subtle">
                  {state.status === "processing"
                    ? "Parsing rows and detecting column types. Large files can take a minute."
                    : `${Math.round(progressPercent)}% uploaded`}
                </p>
                {state.status === "uploading" ? (
                  <Button
                    variant="ghost"
                    className="mt-3"
                    onClick={(event) => {
                      event.preventDefault();
                      controllerRef.current?.abort();
                    }}
                  >
                    <X aria-hidden="true" />
                    Cancel Upload
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="relative flex flex-col items-center">
                <span
                  className={cn(
                    "inline-flex size-16 items-center justify-center rounded-2xl transition-transform duration-300",
                    dragging
                      ? "scale-110 bg-primary text-on-primary"
                      : "bg-linear-to-br from-amber-400 via-orange-500 to-red-500 text-white shadow-[0_12px_28px_-12px_rgb(234_88_12/0.9)]",
                  )}
                >
                  <CloudUpload className="size-7" aria-hidden="true" />
                </span>
                <p className="mt-5 text-2xl font-bold tracking-tight text-fg">
                  {dragging
                    ? "Drop Your File to Upload"
                    : "Drag and Drop Your Dataset"}
                </p>
                <p className="mt-1.5 text-fg-muted">
                  or{" "}
                  <span className="font-semibold text-brand underline-offset-4">
                    browse your files
                  </span>
                </p>
                <div
                  id={hintId}
                  className="mt-5 flex flex-wrap items-center justify-center gap-2"
                >
                  {ACCEPTED_EXTENSIONS.map((extension) => (
                    <Badge
                      key={extension}
                      tone="neutral"
                      size="md"
                      className="font-mono"
                    >
                      {extension}
                    </Badge>
                  ))}
                  <Badge tone="neutral" size="md">
                    Up to {MAX_UPLOAD_MB} MB
                  </Badge>
                </div>
                <ul className="mt-4 hidden flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-fg-subtle sm:flex [@media(max-height:50rem)]:hidden">
                  {TIPS.map((tip) => (
                    <li key={tip} className="inline-flex items-center gap-1.5">
                      <span
                        className="size-1 rounded-full bg-brand"
                        aria-hidden="true"
                      />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </label>

          {state.status === "error" ? (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-danger-line bg-danger-soft p-4"
            >
              <CircleAlert
                className="mt-0.5 size-5 shrink-0 text-danger"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-fg">
                  We Couldn&apos;t Upload That File
                </p>
                <p className="mt-0.5 text-sm text-fg-muted">{state.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setState({ status: "idle" })}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-subtle hover:text-fg"
                aria-label="Dismiss error"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </section>

        <section aria-labelledby="samples-title" className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2
              id="samples-title"
              className="text-lg font-bold tracking-tight text-fg"
            >
              Or Start With a Sample Dataset
            </h2>
            <p className="inline-flex items-center gap-1.5 text-sm text-fg-subtle">
              <ShieldCheck className="size-4 text-success" aria-hidden="true" />
              Files expire {SESSION_TTL_HOURS} hours after upload.{" "}
              <Link
                href="/privacy"
                className="font-semibold text-brand hover:underline"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {SAMPLES.map((sample) => {
              const Icon = sample.icon;
              return (
                <li key={sample.file}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void loadSample(sample.file)}
                    aria-label={`Use the ${sample.title} sample dataset`}
                    className="group relative flex h-full w-full items-start gap-3.5 overflow-hidden rounded-2xl border border-border bg-surface p-4 text-left shadow-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-line hover:shadow-card-hover disabled:pointer-events-none disabled:opacity-50"
                  >
                    <span
                      className={cn(
                        "inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-sm",
                        sample.accent,
                      )}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-fg">
                          {sample.title}
                        </span>
                        <ArrowUpRight
                          className="size-4 shrink-0 text-fg-subtle transition-[color,transform] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="num mt-0.5 block text-xs text-fg-subtle">
                        {sample.task} · {sample.rows} rows · {sample.columns}{" "}
                        columns
                      </span>
                      <span className="mt-1.5 block text-sm leading-snug text-fg-muted">
                        {sample.description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <ContinueCard />

      <RecentSessions />
    </div>
  );
}
