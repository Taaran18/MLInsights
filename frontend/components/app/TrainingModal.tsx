"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CircleCheck,
  CircleSlash,
  CircleX,
  Clock,
  LoaderCircle,
  Square,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Controls";
import { Dialog } from "@/components/ui/Dialog";
import { TASK_LABELS } from "@/lib/metrics";
import { useTraining, type TrainingJob } from "@/lib/training";
import { cn, formatDuration } from "@/lib/utils";

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [active]);
  return now;
}

function JobRow({
  job,
  index,
  now,
}: {
  job: TrainingJob;
  index: number;
  now: number;
}) {
  const elapsed =
    job.status === "training" && job.startedAt
      ? now - job.startedAt
      : (job.durationMs ?? null);
  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors",
        job.status === "training" && "border-brand-line bg-brand-soft",
        job.status === "done" && "border-success-line bg-success-soft",
        job.status === "failed" && "border-danger-line bg-danger-soft",
        (job.status === "queued" || job.status === "skipped") &&
          "border-border bg-surface-2",
      )}
    >
      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center">
        {job.status === "training" ? (
          <LoaderCircle
            className="size-5 animate-spin text-brand"
            aria-hidden="true"
          />
        ) : job.status === "done" ? (
          <CircleCheck className="size-5 text-success" aria-hidden="true" />
        ) : job.status === "failed" ? (
          <CircleX className="size-5 text-danger" aria-hidden="true" />
        ) : job.status === "skipped" ? (
          <CircleSlash className="size-5 text-fg-subtle" aria-hidden="true" />
        ) : (
          <span className="num inline-flex size-5 items-center justify-center rounded-full border border-border-strong text-[10px] font-bold text-fg-subtle">
            {index + 1}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-sm font-semibold",
            job.status === "queued" || job.status === "skipped"
              ? "text-fg-muted"
              : "text-fg",
          )}
        >
          {job.name}
        </span>
        <span className="block text-xs text-fg-subtle">
          {job.status === "training" && "Training now…"}
          {job.status === "queued" && "Waiting in queue"}
          {job.status === "done" && "Trained successfully"}
          {job.status === "skipped" && "Skipped"}
        </span>
        {job.status === "failed" && job.error ? (
          <span className="mt-1 block text-xs leading-relaxed text-danger">
            {job.error}
          </span>
        ) : null}
      </span>
      {elapsed !== null ? (
        <span className="num shrink-0 text-xs font-medium text-fg-muted">
          {formatDuration(elapsed)}
        </span>
      ) : null}
    </li>
  );
}

export function TrainingModal() {
  const router = useRouter();
  const { run, isRunning, requestStop, dismiss } = useTraining();
  const now = useNow(isRunning);

  const jobs = run?.jobs ?? [];
  const finished = jobs.filter((job) =>
    ["done", "failed", "skipped"].includes(job.status),
  ).length;
  const succeeded = jobs.filter((job) => job.status === "done").length;
  const failed = jobs.filter((job) => job.status === "failed").length;
  const skipped = jobs.filter((job) => job.status === "skipped").length;
  const percent = jobs.length ? (finished / jobs.length) * 100 : 0;
  const elapsed = run ? (run.finishedAt ?? now) - run.startedAt : 0;

  const completedDurations = jobs
    .filter((job) => job.status === "done" || job.status === "failed")
    .map((job) => job.durationMs ?? 0);
  const remaining = jobs.filter(
    (job) => job.status === "queued" || job.status === "training",
  ).length;
  const average =
    completedDurations.length > 0
      ? completedDurations.reduce((sum, value) => sum + value, 0) /
        completedDurations.length
      : null;
  const eta =
    isRunning && average !== null && !run?.stopRequested
      ? average * remaining
      : null;

  const title = !run
    ? "Training Models"
    : isRunning
      ? run.stopRequested
        ? "Stopping After This Model"
        : `Training ${jobs.length} ${jobs.length === 1 ? "Model" : "Models"}`
      : run.sessionExpired
        ? "Training Stopped"
        : succeeded > 0
          ? "Training Complete"
          : "Training Finished With Errors";

  const summary = !run
    ? ""
    : isRunning
      ? `${finished} of ${jobs.length} finished · ${run.task === "clustering" ? TASK_LABELS[run.task] : `Predicting “${run.target}”`}`
      : run.sessionExpired
        ? "Your session expired during training. Upload the dataset again to continue."
        : [
            `${succeeded} trained`,
            failed ? `${failed} failed` : null,
            skipped ? `${skipped} skipped` : null,
          ]
            .filter(Boolean)
            .join(" · ");

  return (
    <Dialog
      open={run !== null}
      onClose={dismiss}
      dismissible={!isRunning}
      size="lg"
      title={title}
      description={<span aria-live="polite">{summary}</span>}
      icon={
        <span
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-xl border",
            isRunning
              ? "border-brand-line bg-brand-soft text-brand"
              : succeeded > 0
                ? "border-success-line bg-success-soft text-success"
                : "border-danger-line bg-danger-soft text-danger",
          )}
        >
          {isRunning ? (
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
          ) : succeeded > 0 ? (
            <Trophy className="size-5" aria-hidden="true" />
          ) : (
            <CircleX className="size-5" aria-hidden="true" />
          )}
        </span>
      }
      footer={
        isRunning ? (
          <Button
            variant="secondary"
            onClick={requestStop}
            disabled={run?.stopRequested}
          >
            <Square aria-hidden="true" />
            {run?.stopRequested ? "Stopping…" : "Stop After This Model"}
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={dismiss}>
              Close
            </Button>
            {succeeded > 0 ? (
              <Button
                onClick={() => {
                  dismiss();
                  router.push("/app/results");
                }}
                data-autofocus
              >
                View Results
              </Button>
            ) : null}
          </>
        )
      }
    >
      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-xs font-medium text-fg-muted">
            <span className="num">{Math.round(percent)}% complete</span>
            <span className="num inline-flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden="true" />
              {formatDuration(elapsed)} elapsed
              {eta !== null ? ` · about ${formatDuration(eta)} left` : ""}
            </span>
          </div>
          <Progress
            value={percent}
            label="Training progress"
            tone={
              isRunning
                ? "brand"
                : failed > 0 && succeeded === 0
                  ? "danger"
                  : "success"
            }
          />
        </div>
        <ol
          className="max-h-[min(22rem,45dvh)] space-y-2 overflow-y-auto pr-1"
          aria-label="Models in this run"
        >
          {jobs.map((job, index) => (
            <JobRow key={job.key} job={job} index={index} now={now} />
          ))}
        </ol>
        {isRunning ? (
          <p className="text-xs text-fg-subtle">
            Keep this tab open. Time left is an estimate based on the models
            finished so far.
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
