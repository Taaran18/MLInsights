"use client";

import { useId, useMemo, useState, useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BrainCircuit,
  ChartColumn,
  Crown,
  Download,
  GitCompareArrows,
  Radar as RadarIcon,
  Table2,
} from "lucide-react";
import { NextStep, PageSkeleton } from "@/components/app/AppChrome";
import { ButtonLink } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Controls";
import { Callout, EmptyState, ErrorState } from "@/components/ui/Feedback";
import { PageHeader, TableContainer } from "@/components/ui/Layout";
import { Select } from "@/components/ui/Select";
import { api } from "@/lib/api/endpoints";
import type { ComparisonRow, TaskType } from "@/lib/api/types";
import {
  CHART_COLORS,
  HIGHER_IS_BETTER,
  METRIC_DESCRIPTIONS,
  TASK_LABELS,
  bestValue,
  formatMetric,
  isPercentMetric,
  metricDirection,
  primaryMetricFor,
} from "@/lib/metrics";
import { usePreferences } from "@/lib/preferences";
import { useReadySession } from "@/lib/session";
import { useResource } from "@/lib/use-resource";
import { cn, formatDecimal } from "@/lib/utils";

type View = "table" | "bar" | "radar";

const HIDDEN = new Set([
  "model_key",
  "model_name",
  "task",
  "target_col",
  "category",
  "n_clusters",
  "n_noise_points",
]);

interface Group {
  id: string;
  task: TaskType;
  target: string | null;
  label: string;
  rows: ComparisonRow[];
  metrics: string[];
}

function subscribeNarrow(callback: () => void) {
  const query = window.matchMedia("(max-width: 640px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function useNarrowScreen() {
  return useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia("(max-width: 640px)").matches,
    () => false,
  );
}

function useChartColors() {
  const { theme } = usePreferences();
  return theme === "dark"
    ? { grid: "#25272f", axis: "#868d9c", cursor: "rgba(255,255,255,0.05)" }
    : { grid: "#e3e6ee", axis: "#5d6474", cursor: "rgba(79,70,229,0.06)" };
}

function buildGroups(rows: ComparisonRow[]): Group[] {
  const map = new Map<string, Group>();
  rows.forEach((row) => {
    const id = `${row.task}|${row.target_col ?? ""}`;
    if (!map.has(id)) {
      map.set(id, {
        id,
        task: row.task,
        target: row.target_col,
        label: row.target_col
          ? `${TASK_LABELS[row.task]} · ${row.target_col}`
          : TASK_LABELS[row.task],
        rows: [],
        metrics: [],
      });
    }
    map.get(id)!.rows.push(row);
  });
  return [...map.values()].map((group) => {
    const metrics = new Set<string>();
    group.rows.forEach((row) =>
      Object.entries(row).forEach(([key, value]) => {
        if (!HIDDEN.has(key) && typeof value === "number") metrics.add(key);
      }),
    );
    return { ...group, metrics: [...metrics] };
  });
}

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm shadow-pop">
      <p className="mb-1.5 font-semibold text-fg">{label}</p>
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li
            key={String(entry.dataKey ?? entry.name)}
            className="flex items-center gap-2"
          >
            <span
              className="size-2.5 rounded-full"
              style={{ background: entry.color }}
              aria-hidden="true"
            />
            <span className="text-fg-muted">{entry.name}</span>
            <span className="num ml-auto pl-3 font-semibold text-fg">
              {typeof entry.value === "number"
                ? entry.payload && "metric" in entry.payload
                  ? `${formatDecimal(entry.value, 1)}`
                  : formatMetric(String(entry.name), entry.value)
                : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CompareView() {
  const { sessionId, versions } = useReadySession();
  const colors = useChartColors();
  const narrow = useNarrowScreen();
  const groupLabelId = useId();
  const metricLabelId = useId();
  const compare = useResource(
    `compare:${sessionId}:${versions.models}`,
    (signal) => api.compare(sessionId, signal),
    {
      sessionId,
      keepPrevious: true,
    },
  );
  const [groupId, setGroupId] = useState<string | null>(null);
  const [view, setView] = useState<View>("table");
  const [metricOverride, setMetricOverride] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const groups = useMemo(
    () => buildGroups(compare.data?.comparison ?? []),
    [compare.data],
  );
  const group = groups.find((item) => item.id === groupId) ?? groups[0];

  const header = (
    <PageHeader
      eyebrow="Step 6 · Compare"
      title="Compare Models"
      description="Rank every model side by side. The best score in each column is highlighted."
    />
  );

  if (compare.status === "error" && !compare.data) {
    return (
      <div className="space-y-10">
        {header}
        <ErrorState
          title="We Couldn't Load the Comparison"
          message={compare.error?.message ?? ""}
          onRetry={compare.reload}
        />
      </div>
    );
  }
  if (!compare.data) return <PageSkeleton label="Loading your models…" />;
  if (!group) {
    return (
      <div className="space-y-10">
        {header}
        <EmptyState
          icon={<GitCompareArrows aria-hidden="true" />}
          title="Nothing to Compare Yet"
          description="Train two or more models on the same target to compare their scores side by side."
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

  const colorFor = (key: string) =>
    CHART_COLORS[
      group.rows.findIndex((row) => row.model_key === key) % CHART_COLORS.length
    ];
  const metric =
    metricOverride && group.metrics.includes(metricOverride)
      ? metricOverride
      : primaryMetricFor(group.task, group.metrics);
  const direction = metric ? metricDirection(metric) : null;
  const shown = group.rows.filter((row) => !hidden.has(row.model_key));
  const sorted = [...shown].sort((a, b) => {
    if (!metric) return 0;
    const av =
      typeof a[metric] === "number"
        ? (a[metric] as number)
        : direction === "lower"
          ? Infinity
          : -Infinity;
    const bv =
      typeof b[metric] === "number"
        ? (b[metric] as number)
        : direction === "lower"
          ? Infinity
          : -Infinity;
    return direction === "lower" ? av - bv : bv - av;
  });
  const bestByMetric = Object.fromEntries(
    group.metrics.map((name) => [
      name,
      bestValue(
        name,
        shown
          .map((row) => row[name])
          .filter((value): value is number => typeof value === "number"),
      ),
    ]),
  );

  const barData = metric
    ? sorted
        .filter((row) => typeof row[metric] === "number")
        .map((row) => ({
          name: row.model_name,
          key: row.model_key,
          value: row[metric] as number,
        }))
    : [];

  const radarMetrics = group.metrics
    .filter((name) => HIGHER_IS_BETTER.has(name))
    .slice(0, 7);
  const radarData = radarMetrics.map((name) => {
    const values = shown.map((row) =>
      typeof row[name] === "number" ? (row[name] as number) : 0,
    );
    const max = Math.max(...values.map((value) => Math.abs(value)), 1e-9);
    const entry: Record<string, string | number> = { metric: name };
    shown.forEach((row) => {
      const value = typeof row[name] === "number" ? (row[name] as number) : 0;
      entry[row.model_key] = Math.max(0, (value / max) * 100);
    });
    return entry;
  });

  const toggleRow = (key: string) =>
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else if (group.rows.length - next.size > 1) next.add(key);
      return next;
    });

  return (
    <div className="space-y-8 lg:space-y-10">
      {header}

      {group.rows.length < 2 ? (
        <Callout
          tone="info"
          title="Train at least one more model to compare"
          action={
            <ButtonLink href="/app/train" size="sm" variant="secondary">
              Train Models
            </ButtonLink>
          }
        >
          Comparison works best with several models trained on the same target.
        </Callout>
      ) : null}

      <section
        aria-label="Comparison controls"
        className="space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {groups.length > 1 ? (
              <div className="w-full sm:w-72">
                <p
                  id={groupLabelId}
                  className="mb-2 text-sm font-semibold text-fg"
                >
                  Goal
                </p>
                <Select
                  aria-labelledby={groupLabelId}
                  value={group.id}
                  onChange={(value) => {
                    setGroupId(value);
                    setHidden(new Set());
                    setMetricOverride(null);
                  }}
                  options={groups.map((item) => ({
                    value: item.id,
                    label: item.label,
                    meta: String(item.rows.length),
                  }))}
                />
              </div>
            ) : null}
            <div className="w-full sm:w-64">
              <p
                id={metricLabelId}
                className="mb-2 text-sm font-semibold text-fg"
              >
                Rank By
              </p>
              <Select
                aria-labelledby={metricLabelId}
                value={metric}
                onChange={setMetricOverride}
                options={group.metrics.map((name) => ({
                  value: name,
                  label: name,
                  description: METRIC_DESCRIPTIONS[name],
                  meta:
                    metricDirection(name) === "lower"
                      ? "lower wins"
                      : metricDirection(name) === "higher"
                        ? "higher wins"
                        : undefined,
                }))}
                minMenuWidth={300}
              />
            </div>
          </div>
          <Segmented
            aria-label="Comparison view"
            value={view}
            onChange={setView}
            options={[
              {
                value: "table",
                label: "Leaderboard",
                icon: <Table2 aria-hidden="true" />,
              },
              {
                value: "bar",
                label: "Bar Chart",
                icon: <ChartColumn aria-hidden="true" />,
              },
              {
                value: "radar",
                label: "Radar",
                icon: <RadarIcon aria-hidden="true" />,
              },
            ]}
          />
        </div>
        <div>
          <p className="mb-2.5 text-sm font-semibold text-fg">
            Models Shown{" "}
            <span className="font-normal text-fg-subtle">
              ({shown.length} of {group.rows.length})
            </span>
          </p>
          <ul className="flex flex-wrap gap-2">
            {group.rows.map((row) => {
              const visible = !hidden.has(row.model_key);
              const color = colorFor(row.model_key);
              return (
                <li key={row.model_key}>
                  <button
                    type="button"
                    aria-pressed={visible}
                    onClick={() => toggleRow(row.model_key)}
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors",
                      visible
                        ? "border-border-strong bg-surface text-fg"
                        : "border-border bg-bg-alt text-fg-subtle line-through",
                    )}
                  >
                    <span
                      className="size-2.5 rounded-full"
                      style={{
                        background: visible ? color : "var(--border-strong)",
                      }}
                      aria-hidden="true"
                    />
                    {row.model_name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {view === "table" ? (
        <TableContainer label="Model leaderboard" maxHeight="40rem">
          <table className="data-table">
            <caption className="sr-only">Models ranked by {metric}</caption>
            <thead>
              <tr>
                <th scope="col" className="w-14 text-center">
                  Rank
                </th>
                <th scope="col" className="sticky-col min-w-56">
                  Model
                </th>
                {group.metrics.map((name) => {
                  const active = name === metric;
                  const dir = metricDirection(name);
                  return (
                    <th
                      key={name}
                      scope="col"
                      aria-sort={
                        active
                          ? dir === "lower"
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                      className="p-0 text-right"
                    >
                      <button
                        type="button"
                        onClick={() => setMetricOverride(name)}
                        className={cn(
                          "inline-flex w-full items-center justify-end gap-1.5 px-4 py-3 text-xs font-semibold tracking-wide uppercase",
                          active ? "text-brand" : "hover:text-fg",
                        )}
                        title={METRIC_DESCRIPTIONS[name]}
                      >
                        {name}
                        {active ? (
                          dir === "lower" ? (
                            <ArrowUp className="size-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowDown
                              className="size-3.5"
                              aria-hidden="true"
                            />
                          )
                        ) : (
                          <ArrowUpDown
                            className="size-3.5 opacity-40"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, index) => (
                <tr key={row.model_key}>
                  <td className="num text-center">
                    {index === 0 ? (
                      <Crown
                        className="mx-auto size-4.5 text-amber-500"
                        aria-label="Rank 1"
                      />
                    ) : (
                      <span className="font-semibold text-fg-subtle">
                        {index + 1}
                      </span>
                    )}
                  </td>
                  <th scope="row" className="sticky-col px-4 py-2.5 text-left">
                    <span className="flex items-center gap-2.5">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: colorFor(row.model_key) }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-fg">
                          {row.model_name}
                        </span>
                        {row.category ? (
                          <span className="block text-xs font-normal text-fg-subtle">
                            {row.category}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </th>
                  {group.metrics.map((name) => {
                    const value = row[name];
                    const numeric = typeof value === "number" ? value : null;
                    const isBest =
                      numeric !== null &&
                      shown.length > 1 &&
                      numeric === bestByMetric[name];
                    return (
                      <td
                        key={name}
                        className="num text-right whitespace-nowrap"
                      >
                        {isBest ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-success-line bg-success-soft px-2 py-0.5 font-bold text-success">
                            {formatMetric(name, numeric)}
                            <span className="sr-only">(best)</span>
                          </span>
                        ) : (
                          <span
                            className={
                              numeric === null ? "text-fg-subtle" : "text-fg"
                            }
                          >
                            {formatMetric(name, numeric)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      ) : null}

      {view === "bar" ? (
        <section
          aria-label={`Bar chart of ${metric}`}
          className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-6"
        >
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold tracking-tight text-fg">
              {metric}
            </h2>
            <p className="text-sm text-fg-muted">
              {direction === "lower" ? "Lower is better" : "Higher is better"}
            </p>
          </div>
          <div style={{ height: Math.max(280, barData.length * 44 + 60) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
                barCategoryGap={10}
              >
                <CartesianGrid horizontal={false} stroke={colors.grid} />
                <XAxis
                  type="number"
                  tick={{ fill: colors.axis, fontSize: 12 }}
                  stroke={colors.grid}
                  tickFormatter={(value: number) =>
                    metric && isPercentMetric(metric)
                      ? `${Math.round(value * 100)}%`
                      : formatDecimal(value, 2)
                  }
                  domain={
                    metric && isPercentMetric(metric)
                      ? [0, 1]
                      : ["auto", "auto"]
                  }
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={narrow ? 112 : 230}
                  tick={{ fill: colors.axis, fontSize: 12 }}
                  stroke={colors.grid}
                  tickFormatter={(value: string) => {
                    const limit = narrow ? 14 : 32;
                    return value.length > limit
                      ? `${value.slice(0, limit - 1)}…`
                      : value;
                  }}
                />
                <Tooltip
                  content={ChartTooltip}
                  cursor={{ fill: colors.cursor }}
                />
                <Bar
                  dataKey="value"
                  name={metric ?? "Value"}
                  radius={[0, 6, 6, 0]}
                  isAnimationActive
                >
                  {barData.map((entry) => (
                    <Cell key={entry.key} fill={colorFor(entry.key)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}

      {view === "radar" ? (
        radarMetrics.length >= 3 ? (
          <section
            aria-label="Radar chart of model scores"
            className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-6"
          >
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold tracking-tight text-fg">
                Overall Shape
              </h2>
              <p className="text-sm text-fg-muted">
                Each score is scaled so the best model on that metric reaches
                100.
              </p>
            </div>
            <div className="h-104">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke={colors.grid} />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: colors.axis, fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  {shown.map((row) => (
                    <Radar
                      key={row.model_key}
                      name={row.model_name}
                      dataKey={row.model_key}
                      stroke={colorFor(row.model_key)}
                      fill={colorFor(row.model_key)}
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />
                  ))}
                  <Tooltip content={ChartTooltip} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
              {shown.map((row) => (
                <li
                  key={row.model_key}
                  className="inline-flex items-center gap-2 text-fg-muted"
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: colorFor(row.model_key) }}
                    aria-hidden="true"
                  />
                  {row.model_name}
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <EmptyState
            compact
            icon={<RadarIcon aria-hidden="true" />}
            title="Not Enough Metrics for a Radar Chart"
            description="A radar chart needs at least three “higher is better” metrics. Use the leaderboard or bar chart instead."
          />
        )
      ) : null}

      <NextStep
        href="/app/export"
        title="Export Your Work"
        description="Download the PDF report, cleaned dataset, and trained model files."
        icon={<Download aria-hidden="true" />}
      />
    </div>
  );
}
