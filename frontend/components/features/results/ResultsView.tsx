"use client";

import { useId, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowDown,
  ArrowUp,
  BrainCircuit,
  Crown,
  GitCompareArrows,
  PanelRightOpen,
  Timer,
  Trash,
  Trophy,
} from "lucide-react";
import { NextStep } from "@/components/app/AppChrome";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Sheet } from "@/components/ui/Dialog";
import { EmptyState, ErrorState } from "@/components/ui/Feedback";
import { PageHeader, StatCard } from "@/components/ui/Layout";
import { Select } from "@/components/ui/Select";
import { PageSkeleton } from "@/components/app/AppChrome";
import { getErrorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/endpoints";
import type { TaskType, TrainedModel } from "@/lib/api/types";
import {
  METRIC_DESCRIPTIONS,
  TASK_LABELS,
  bestValue,
  formatMetric,
  metricBar,
  metricDirection,
  numericMetrics,
  primaryMetricFor,
} from "@/lib/metrics";
import { useReadySession } from "@/lib/session";
import { bumpModelsVersion } from "@/lib/session-store";
import { useResource } from "@/lib/use-resource";
import {
  cn,
  formatDuration,
  formatInteger,
  formatRelativeTime,
} from "@/lib/utils";

const SCALER_LABELS: Record<string, string> = {
  none: "None",
  standard: "Standard",
  minmax: "Min-Max",
  robust: "Robust",
};

interface ResultEntry extends TrainedModel {
  key: string;
}

interface ResultGroup {
  id: string;
  task: TaskType;
  target: string | null;
  label: string;
  models: ResultEntry[];
  metric: string | null;
}

function groupResults(trained: Record<string, TrainedModel>): ResultGroup[] {
  const groups = new Map<string, ResultGroup>();
  Object.entries(trained).forEach(([key, model]) => {
    const id = `${model.task}|${model.target_col ?? ""}`;
    if (!groups.has(id)) {
      groups.set(id, {
        id,
        task: model.task,
        target: model.target_col,
        label: model.target_col
          ? `${TASK_LABELS[model.task]} · ${model.target_col}`
          : TASK_LABELS[model.task],
        models: [],
        metric: null,
      });
    }
    groups.get(id)!.models.push({ key, ...model });
  });
  return [...groups.values()].map((group) => {
    const available = new Set(
      group.models.flatMap((model) =>
        numericMetrics(model.metrics).map(([name]) => name),
      ),
    );
    const metric = primaryMetricFor(group.task, available);
    const direction = metric ? metricDirection(metric) : null;
    const sorted = [...group.models].sort((a, b) => {
      if (!metric) return 0;
      const av = a.metrics[metric];
      const bv = b.metrics[metric];
      const an =
        typeof av === "number"
          ? av
          : direction === "lower"
            ? Infinity
            : -Infinity;
      const bn =
        typeof bv === "number"
          ? bv
          : direction === "lower"
            ? Infinity
            : -Infinity;
      return direction === "lower" ? an - bn : bn - an;
    });
    return { ...group, models: sorted, metric };
  });
}

function DirectionIcon({ metric }: { metric: string }) {
  const direction = metricDirection(metric);
  if (direction === "higher") {
    return (
      <ArrowUp
        className="size-3.5 text-fg-subtle"
        aria-label="Higher is better"
      />
    );
  }
  if (direction === "lower") {
    return (
      <ArrowDown
        className="size-3.5 text-fg-subtle"
        aria-label="Lower is better"
      />
    );
  }
  return null;
}

function Leaderboard({ group }: { group: ResultGroup }) {
  const metric = group.metric;
  if (!metric) return null;
  const values = group.models
    .map((model) => model.metrics[metric])
    .filter((value): value is number => typeof value === "number");
  const best = bestValue(metric, values);
  const max = Math.max(...values.map((value) => Math.abs(value)), 1e-9);
  return (
    <section
      aria-labelledby="leaderboard-title"
      className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="leaderboard-title"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-fg"
        >
          <Trophy className="size-5 text-amber-500" aria-hidden="true" />
          Leaderboard by {metric}
        </h2>
        <p className="flex items-center gap-1.5 text-sm text-fg-muted">
          <DirectionIcon metric={metric} />
          {metricDirection(metric) === "lower"
            ? "Lower is better"
            : "Higher is better"}
        </p>
      </div>
      <ol className="mt-5 space-y-3">
        {group.models.map((model, index) => {
          const value = model.metrics[metric];
          const numeric = typeof value === "number" ? value : null;
          const isBest = numeric !== null && numeric === best;
          const width =
            numeric === null
              ? 0
              : (metricBar(metric, numeric) ?? Math.abs(numeric) / max);
          return (
            <li
              key={model.key}
              className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[1.75rem_minmax(0,16rem)_1fr_6rem]"
            >
              <span
                className={cn(
                  "num text-center text-sm font-bold",
                  isBest ? "text-amber-500" : "text-fg-subtle",
                )}
              >
                {isBest ? (
                  <Crown className="mx-auto size-4.5" aria-label="Best" />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className="truncate text-sm font-semibold text-fg"
                title={model.name}
              >
                {model.name}
              </span>
              <span className="col-span-2 h-2.5 overflow-hidden rounded-full bg-surface-3 sm:col-span-1">
                <span
                  className={cn(
                    "block h-full rounded-full transition-[width] duration-700",
                    isBest
                      ? "bg-linear-to-r from-emerald-500 to-emerald-400"
                      : "bg-linear-to-r from-indigo-500 to-violet-500",
                  )}
                  style={{ width: `${Math.max(width * 100, 2)}%` }}
                />
              </span>
              <span
                className={cn(
                  "num col-span-2 text-sm font-semibold sm:col-span-1 sm:text-right",
                  isBest ? "text-success" : "text-fg",
                )}
              >
                {formatMetric(metric, numeric)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ConfusionMatrix({
  matrix,
  labels,
}: {
  matrix: number[][];
  labels: string[];
}) {
  const max = Math.max(...matrix.flat(), 1);
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1 text-sm">
        <caption className="mb-2 text-left text-xs text-fg-muted">
          Rows are actual classes, columns are predicted classes.
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="px-2 text-left text-xs font-semibold text-fg-subtle"
            >
              Actual ↓ / Predicted →
            </th>
            {labels.map((label) => (
              <th
                key={label}
                scope="col"
                className="max-w-24 truncate px-2 text-xs font-semibold text-fg-muted"
                title={label}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={labels[i] ?? i}>
              <th
                scope="row"
                className="max-w-32 truncate pr-2 text-right text-xs font-semibold text-fg-muted"
                title={labels[i]}
              >
                {labels[i] ?? i}
              </th>
              {row.map((value, j) => {
                const intensity = value / max;
                const correct = i === j;
                return (
                  <td
                    key={j}
                    className="num size-14 min-w-14 rounded-lg text-center font-bold"
                    style={{
                      background:
                        value === 0
                          ? "var(--surface-2)"
                          : correct
                            ? `rgb(99 102 241 / ${0.15 + intensity * 0.75})`
                            : `rgb(239 68 68 / ${0.12 + intensity * 0.6})`,
                      color:
                        intensity > 0.55
                          ? "#ffffff"
                          : value === 0
                            ? "var(--fg-subtle)"
                            : "var(--fg)",
                    }}
                    title={`Actual ${labels[i]}, predicted ${labels[j]}: ${value}`}
                  >
                    {value}
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

function ModelDetail({ model }: { model: ResultEntry }) {
  const metrics = numericMetrics(model.metrics);
  const matrix = model.metrics.confusion_matrix;
  const labels =
    model.metrics.class_labels ??
    matrix?.map((_, index) => String(index)) ??
    [];
  const distribution = model.metrics.class_distribution;
  const importances = model.feature_importances?.slice(0, 15) ?? [];
  const maxImportance = Math.max(
    ...importances.map((item) => item.importance),
    1e-9,
  );
  const clusters = model.metrics.n_clusters;

  return (
    <div className="space-y-8 p-5 sm:p-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {model.task !== "clustering" ? (
          <>
            <StatCard
              label="Train Rows"
              value={formatInteger(model.train_size ?? null)}
              tone="brand"
            />
            <StatCard
              label="Test Rows"
              value={formatInteger(model.test_size_n ?? null)}
              tone="brand"
            />
          </>
        ) : (
          <>
            <StatCard
              label="Clusters"
              value={formatInteger(
                typeof clusters === "number" ? clusters : null,
              )}
              tone="brand"
            />
            <StatCard
              label="Noise Points"
              value={formatInteger(
                typeof model.metrics.n_noise_points === "number"
                  ? model.metrics.n_noise_points
                  : null,
              )}
              tone="brand"
            />
          </>
        )}
        <StatCard
          label="Features"
          value={formatInteger(model.feature_cols.length)}
          tone="brand"
        />
        <StatCard
          label="Training Time"
          value={formatDuration(model.duration_ms ?? null)}
          tone="brand"
        />
      </div>

      <section aria-labelledby="detail-metrics">
        <h3 id="detail-metrics" className="text-base font-bold text-fg">
          Performance Metrics
        </h3>
        {metrics.length === 0 ? (
          <p className="mt-2 text-sm text-fg-muted">
            No scores could be calculated. Clustering scores need at least two
            clusters.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
            {metrics.map(([name, value]) => {
              const bar = metricBar(name, value);
              return (
                <li key={name} className="bg-surface px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-fg">
                      {name}
                      <DirectionIcon metric={name} />
                    </span>
                    <span className="num text-sm font-bold text-fg">
                      {formatMetric(name, value)}
                    </span>
                  </div>
                  {bar !== null ? (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500"
                        style={{ width: `${bar * 100}%` }}
                      />
                    </div>
                  ) : null}
                  {METRIC_DESCRIPTIONS[name] ? (
                    <p className="mt-1.5 text-xs text-fg-subtle">
                      {METRIC_DESCRIPTIONS[name]}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {matrix ? (
        <section aria-labelledby="detail-matrix">
          <h3 id="detail-matrix" className="text-base font-bold text-fg">
            Confusion Matrix
          </h3>
          <div className="mt-3 rounded-xl border border-border bg-bg-alt p-4">
            <ConfusionMatrix matrix={matrix} labels={labels} />
          </div>
        </section>
      ) : model.task === "classification" ? (
        <p className="text-sm text-fg-muted">
          This target has too many classes to show a confusion matrix.
        </p>
      ) : null}

      {distribution ? (
        <section aria-labelledby="detail-distribution">
          <h3 id="detail-distribution" className="text-base font-bold text-fg">
            Class Balance in the Test Set
          </h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {Object.entries(distribution).map(([label, count]) => (
              <li
                key={label}
                className="rounded-xl border border-border bg-surface-2 px-3.5 py-2"
              >
                <span className="block text-xs text-fg-muted">{label}</span>
                <span className="num text-base font-bold text-fg">
                  {formatInteger(count)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {importances.length > 0 ? (
        <section aria-labelledby="detail-importance">
          <h3 id="detail-importance" className="text-base font-bold text-fg">
            Most Influential Features
          </h3>
          <p className="mt-1 text-sm text-fg-muted">
            How much each column contributed to this model&apos;s predictions.
          </p>
          <ol className="mt-4 space-y-2.5">
            {importances.map((item, index) => (
              <li
                key={item.feature}
                className="grid grid-cols-[1.5rem_minmax(0,10rem)_1fr_4.5rem] items-center gap-3 text-sm"
              >
                <span className="num text-right text-xs text-fg-subtle">
                  {index + 1}
                </span>
                <span className="truncate text-fg" title={item.feature}>
                  {item.feature}
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-surface-3">
                  <span
                    className="block h-full rounded-full bg-linear-to-r from-sky-500 to-indigo-500"
                    style={{
                      width: `${(item.importance / maxImportance) * 100}%`,
                    }}
                  />
                </span>
                <span className="num text-right text-xs text-fg-muted">
                  {item.importance.toFixed(4)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section aria-labelledby="detail-features">
        <h3 id="detail-features" className="text-base font-bold text-fg">
          Features Used ({model.feature_cols.length})
        </h3>
        <ul className="mt-3 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          {model.feature_cols.map((feature) => (
            <li key={feature}>
              <Badge tone="neutral">{feature}</Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function ResultsView() {
  const { sessionId, versions } = useReadySession();
  const groupLabelId = useId();
  const results = useResource(
    `results:${sessionId}:${versions.models}`,
    (signal) => api.results(sessionId, signal),
    {
      sessionId,
      keepPrevious: true,
    },
  );
  const [groupId, setGroupId] = useState<string | null>(null);
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const groups = useMemo(
    () => groupResults(results.data?.trained_models ?? {}),
    [results.data],
  );
  const group = groups.find((item) => item.id === groupId) ?? groups[0];
  const allModels = groups.flatMap((item) => item.models);
  const detail = allModels.find((model) => model.key === detailKey) ?? null;
  const pendingDelete =
    allModels.find((model) => model.key === deleteKey) ?? null;

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.deleteResult(sessionId, pendingDelete.key);
      toast.success(`Deleted results for ${pendingDelete.name}.`);
      if (detailKey === pendingDelete.key) setDetailKey(null);
      setDeleteKey(null);
      bumpModelsVersion();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const header = (
    <PageHeader
      eyebrow="Step 5 · Review"
      title="Training Results"
      description="See how every model performed on data it hadn't seen, then open any model for the full breakdown."
    />
  );

  if (results.status === "error" && !results.data) {
    return (
      <div className="space-y-10">
        {header}
        <ErrorState
          title="We Couldn't Load Your Results"
          message={results.error?.message ?? ""}
          onRetry={results.reload}
        />
      </div>
    );
  }
  if (!results.data) return <PageSkeleton label="Loading your results…" />;

  if (!group) {
    return (
      <div className="space-y-10">
        {header}
        <EmptyState
          icon={<BrainCircuit aria-hidden="true" />}
          title="No Models Trained Yet"
          description="Train at least one model to see its accuracy, errors, and most influential features here."
          actions={
            <ButtonLink href="/app/train">
              <BrainCircuit aria-hidden="true" />
              Train Models
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const best = group.models[0];
  const bestValueForGroup = group.metric
    ? best.metrics[group.metric]
    : undefined;
  const fastest = [...group.models].sort(
    (a, b) => (a.duration_ms ?? Infinity) - (b.duration_ms ?? Infinity),
  )[0];

  return (
    <div className="space-y-10 lg:space-y-12">
      {header}

      {groups.length > 1 ? (
        <div className="flex flex-col items-center gap-2">
          <p id={groupLabelId} className="text-sm text-fg-muted">
            You&apos;ve trained models for {groups.length} different goals.
            Results are compared within each goal.
          </p>
          <Select
            aria-labelledby={groupLabelId}
            value={group.id}
            onChange={setGroupId}
            options={groups.map((item) => ({
              value: item.id,
              label: item.label,
              meta: `${item.models.length}`,
            }))}
            className="w-80 max-w-full"
          />
        </div>
      ) : null}

      <section
        aria-label="Results summary"
        className="grid gap-4 md:grid-cols-3"
      >
        <div className="relative overflow-hidden rounded-2xl border border-success-line bg-success-soft p-5 md:col-span-1">
          <p className="flex items-center gap-2 text-sm font-medium text-fg-muted">
            <Crown className="size-4 text-amber-500" aria-hidden="true" />
            Best Model
          </p>
          <p className="mt-2 text-lg leading-snug font-bold text-fg">
            {best.name}
          </p>
          {group.metric ? (
            <p className="num mt-1 text-3xl font-extrabold tracking-tight text-success">
              {formatMetric(
                group.metric,
                typeof bestValueForGroup === "number"
                  ? bestValueForGroup
                  : null,
              )}
            </p>
          ) : null}
          <p className="text-xs text-fg-subtle">
            {group.metric
              ? `${group.metric} on the test split`
              : "No comparable score"}
          </p>
        </div>
        <StatCard
          label="Models Trained"
          value={formatInteger(group.models.length)}
          hint={
            group.target
              ? `Predicting “${group.target}”`
              : TASK_LABELS[group.task]
          }
          icon={<BrainCircuit />}
          tone="brand"
        />
        <StatCard
          label="Fastest Model"
          value={formatDuration(fastest.duration_ms ?? null)}
          hint={fastest.name}
          icon={<Timer />}
          tone="info"
        />
      </section>

      <Leaderboard group={group} />

      <section aria-labelledby="models-title" className="space-y-4">
        <h2
          id="models-title"
          className="text-center text-2xl font-bold tracking-tight text-fg"
        >
          All Models
        </h2>
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {group.models.map((model, index) => {
            const metrics = numericMetrics(model.metrics).slice(0, 4);
            return (
              <li key={model.key}>
                <article className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-card">
                  <header className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="num text-xs font-semibold text-fg-subtle">
                        #{index + 1}
                      </p>
                      <h3
                        className="truncate text-base font-bold text-fg"
                        title={model.name}
                      >
                        {model.name}
                      </h3>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {model.category ? (
                          <Badge tone="neutral">{model.category}</Badge>
                        ) : null}
                        {index === 0 && group.metric ? (
                          <Badge tone="success">
                            <Crown aria-hidden="true" />
                            Best
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteKey(model.key)}
                      aria-label={`Delete results for ${model.name}`}
                      className="hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash aria-hidden="true" />
                    </Button>
                  </header>
                  <dl className="mt-4 space-y-2.5">
                    {metrics.map(([name, value]) => {
                      const bar = metricBar(name, value);
                      return (
                        <div key={name}>
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <dt className="text-fg-muted">{name}</dt>
                            <dd className="num font-semibold text-fg">
                              {formatMetric(name, value)}
                            </dd>
                          </div>
                          {bar !== null ? (
                            <div
                              className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3"
                              aria-hidden="true"
                            >
                              <div
                                className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500"
                                style={{ width: `${bar * 100}%` }}
                              />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </dl>
                  <footer className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
                    <p className="text-xs text-fg-subtle">
                      {model.trained_at
                        ? `Trained ${formatRelativeTime(model.trained_at)}`
                        : "Trained"}
                      {model.duration_ms
                        ? ` · ${formatDuration(model.duration_ms)}`
                        : ""}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setDetailKey(model.key)}
                    >
                      <PanelRightOpen aria-hidden="true" />
                      View Details
                    </Button>
                  </footer>
                </article>
              </li>
            );
          })}
        </ul>
      </section>

      <NextStep
        href="/app/compare"
        title="Compare Models"
        description="Rank every model on any metric with a leaderboard, bar chart, or radar chart."
        icon={<GitCompareArrows aria-hidden="true" />}
      />

      <Sheet
        open={detail !== null}
        onClose={() => setDetailKey(null)}
        title={detail?.name ?? "Model details"}
        description={
          detail ? (
            <span className="flex flex-wrap gap-1.5 pt-1">
              <Badge tone="brand">{TASK_LABELS[detail.task]}</Badge>
              {detail.target_col ? (
                <Badge tone="neutral">Target: {detail.target_col}</Badge>
              ) : null}
              {detail.scaler_type ? (
                <Badge tone="neutral">
                  Scaling: {SCALER_LABELS[detail.scaler_type]}
                </Badge>
              ) : null}
              {detail.test_size ? (
                <Badge tone="neutral">
                  Test split: {Math.round(detail.test_size * 100)}%
                </Badge>
              ) : null}
            </span>
          ) : null
        }
      >
        {detail ? <ModelDetail model={detail} /> : null}
      </Sheet>

      <ConfirmDialog
        open={pendingDelete !== null}
        onCancel={() => setDeleteKey(null)}
        onConfirm={confirmDelete}
        busy={deleting}
        busyLabel="Deleting…"
        tone="danger"
        title={`Delete Results for ${pendingDelete?.name ?? "This Model"}?`}
        description="This removes the model's scores and its downloadable model file from this session. You can train it again later."
        confirmLabel="Delete Results"
      />
    </div>
  );
}
