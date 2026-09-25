"use client";

import {
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  type TooltipContentProps,
} from "recharts";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Crown,
  Gauge,
  Lightbulb,
  Sigma,
  Timer,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Sheet } from "@/components/ui/Dialog";
import type { ComparisonRow } from "@/lib/api/types";
import { getMetricGuide } from "@/lib/metric-guide";
import {
  METRIC_DESCRIPTIONS,
  formatMetric,
  metricDirection,
} from "@/lib/metrics";
import { cn, formatDecimal, formatDuration } from "@/lib/utils";

export interface ChartPalette {
  grid: string;
  axis: string;
  cursor: string;
}

export function metricValue(row: ComparisonRow, name: string): number | null {
  const value = row[name];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function relativeScore(
  rows: ComparisonRow[],
  name: string,
  row: ComparisonRow,
): number | null {
  const value = metricValue(row, name);
  if (value === null) return null;
  const values = rows
    .map((item) => metricValue(item, name))
    .filter((item): item is number => item !== null);
  if (values.length === 0) return null;
  if (metricDirection(name) === "lower") {
    const best = Math.min(...values);
    if (value <= 0) return 100;
    return Math.max(0, Math.min(100, (Math.max(best, 0) / value) * 100));
  }
  const best = Math.max(...values.map((item) => Math.abs(item)), 1e-9);
  return Math.max(0, Math.min(100, (value / best) * 100));
}

export function spreadScore(
  rows: ComparisonRow[],
  name: string,
  row: ComparisonRow,
): number | null {
  const value = metricValue(row, name);
  if (value === null) return null;
  const values = rows
    .map((item) => metricValue(item, name))
    .filter((item): item is number => item !== null);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max - min < 1e-12) return 1;
  const t = (value - min) / (max - min);
  return metricDirection(name) === "lower" ? 1 - t : t;
}

function short(name: string, limit: number) {
  return name.length > limit ? `${name.slice(0, limit - 1)}…` : name;
}

function RelativeTooltip({ active, payload, label }: TooltipContentProps) {
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
                ? formatDecimal(entry.value, 1)
                : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartCard({
  title,
  note,
  label,
  children,
}: {
  title: string;
  note: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold tracking-tight text-fg">{title}</h2>
        <p className="text-sm text-fg-muted">{note}</p>
      </div>
      {children}
    </section>
  );
}

export function GroupedBars({
  rows,
  metrics,
  colorFor,
  palette,
}: {
  rows: ComparisonRow[];
  metrics: string[];
  colorFor: (key: string) => string;
  palette: ChartPalette;
}) {
  const data = metrics.map((name) => {
    const entry: Record<string, string | number> = { metric: name };
    rows.forEach((row) => {
      entry[row.model_key] = relativeScore(rows, name, row) ?? 0;
    });
    return entry;
  });
  return (
    <ChartCard
      title="Every Metric Side by Side"
      note="Relative score: the best model on each metric reaches 100."
      label="Grouped bar chart of every metric"
    >
      <div className="h-104">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
          >
            <CartesianGrid vertical={false} stroke={palette.grid} />
            <XAxis
              dataKey="metric"
              tick={{ fill: palette.axis, fontSize: 12 }}
              stroke={palette.grid}
              interval={0}
              tickFormatter={(value: string) => short(value, 14)}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: palette.axis, fontSize: 12 }}
              stroke={palette.grid}
              width={40}
            />
            <Tooltip
              content={RelativeTooltip}
              cursor={{ fill: palette.cursor }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              formatter={(value: string) => (
                <span style={{ color: palette.axis }}>{value}</span>
              )}
            />
            {rows.map((row) => (
              <Bar
                key={row.model_key}
                dataKey={row.model_key}
                name={row.model_name}
                fill={colorFor(row.model_key)}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function ProfileLines({
  rows,
  metrics,
  colorFor,
  palette,
}: {
  rows: ComparisonRow[];
  metrics: string[];
  colorFor: (key: string) => string;
  palette: ChartPalette;
}) {
  const data = metrics.map((name) => {
    const entry: Record<string, string | number> = { metric: name };
    rows.forEach((row) => {
      entry[row.model_key] = relativeScore(rows, name, row) ?? 0;
    });
    return entry;
  });
  return (
    <ChartCard
      title="Score Profile"
      note="Follow each line to see where a model is strong or weak."
      label="Line chart of relative scores"
    >
      <div className="h-104">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
          >
            <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="metric"
              tick={{ fill: palette.axis, fontSize: 12 }}
              stroke={palette.grid}
              interval={0}
              tickFormatter={(value: string) => short(value, 14)}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: palette.axis, fontSize: 12 }}
              stroke={palette.grid}
              width={40}
            />
            <Tooltip content={RelativeTooltip} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              formatter={(value: string) => (
                <span style={{ color: palette.axis }}>{value}</span>
              )}
            />
            {rows.map((row) => (
              <Line
                key={row.model_key}
                type="monotone"
                dataKey={row.model_key}
                name={row.model_name}
                stroke={colorFor(row.model_key)}
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 0, fill: colorFor(row.model_key) }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function MetricHeatmap({
  rows,
  metrics,
  onMetric,
}: {
  rows: ComparisonRow[];
  metrics: string[];
  onMetric: (name: string) => void;
}) {
  return (
    <ChartCard
      title="Score Heatmap"
      note="On each metric, the darkest cell is the best model and the lightest the weakest."
      label="Heatmap of every model and metric"
    >
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1.5 text-sm">
          <caption className="sr-only">
            Every model&apos;s score on every metric, shaded by relative score
          </caption>
          <thead>
            <tr>
              <th scope="col" className="sr-only">
                Model
              </th>
              {metrics.map((name) => (
                <th
                  key={name}
                  scope="col"
                  className="px-1 pb-1 text-center text-xs font-semibold text-fg-muted"
                >
                  <button
                    type="button"
                    onClick={() => onMetric(name)}
                    className="rounded-md px-1.5 py-0.5 hover:bg-surface-2 hover:text-brand"
                  >
                    {name}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.model_key}>
                <th
                  scope="row"
                  className="max-w-56 truncate pr-3 text-left font-semibold whitespace-nowrap text-fg"
                  title={row.model_name}
                >
                  {row.model_name}
                </th>
                {metrics.map((name) => {
                  const value = metricValue(row, name);
                  const score = spreadScore(rows, name, row);
                  const alpha = score === null ? 0 : 0.1 + score * 0.85;
                  return (
                    <td
                      key={name}
                      className="num min-w-24 rounded-lg px-2 py-3 text-center font-semibold"
                      style={{
                        background:
                          score === null
                            ? "var(--surface-2)"
                            : `rgb(249 115 22 / ${alpha})`,
                        color:
                          score !== null && alpha > 0.55
                            ? "#1c0a00"
                            : "var(--fg)",
                      }}
                    >
                      {formatMetric(name, value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

function ScatterTip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as
    | { name: string; seconds: number; score: number; metric: string }
    | undefined;
  if (!point) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm shadow-pop">
      <p className="mb-1 font-semibold text-fg">{point.name}</p>
      <p className="num text-fg-muted">
        {point.metric}:{" "}
        <span className="font-semibold text-fg">
          {formatMetric(point.metric, point.score)}
        </span>
      </p>
      <p className="num text-fg-muted">
        Training time:{" "}
        <span className="font-semibold text-fg">
          {formatDuration(point.seconds * 1000)}
        </span>
      </p>
    </div>
  );
}

export function SpeedScatter({
  rows,
  metric,
  colorFor,
  palette,
}: {
  rows: ComparisonRow[];
  metric: string;
  colorFor: (key: string) => string;
  palette: ChartPalette;
}) {
  const points = rows
    .map((row) => ({
      key: row.model_key,
      name: row.model_name,
      metric,
      seconds: (metricValue(row, "duration_ms") ?? NaN) / 1000,
      score: metricValue(row, metric) ?? NaN,
    }))
    .filter(
      (point) => Number.isFinite(point.seconds) && Number.isFinite(point.score),
    );
  if (points.length === 0) {
    return (
      <ChartCard
        title="Score Versus Speed"
        note="Training times aren't available for these models."
        label="Score versus training time"
      >
        <p className="py-10 text-center text-sm text-fg-muted">
          Retrain the models to record how long each one takes.
        </p>
      </ChartCard>
    );
  }
  const scores = points.map((point) => point.score);
  const low = Math.min(...scores);
  const high = Math.max(...scores);
  const pad = Math.max((high - low) * 0.15, Math.abs(high) * 0.01, 1e-3);
  const domain: [number, number] = [low - pad, high + pad];
  return (
    <ChartCard
      title="Score Versus Speed"
      note={`${metric} against training time. ${metricDirection(metric) === "lower" ? "Bottom" : "Top"}-left is fast and accurate.`}
      label="Scatter chart of score against training time"
    >
      <div className="h-104">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 12, right: 24, bottom: 24, left: 8 }}>
            <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="seconds"
              name="Training time"
              tick={{ fill: palette.axis, fontSize: 12 }}
              stroke={palette.grid}
              tickFormatter={(value: number) => `${formatDecimal(value, 2)}s`}
              label={{
                value: "Training time (seconds)",
                position: "insideBottom",
                offset: -14,
                fill: palette.axis,
                fontSize: 12,
              }}
            />
            <YAxis
              type="number"
              dataKey="score"
              name={metric}
              domain={domain}
              tick={{ fill: palette.axis, fontSize: 12 }}
              stroke={palette.grid}
              width={64}
              tickFormatter={(value: number) => formatMetric(metric, value)}
            />
            <ZAxis range={[160, 160]} />
            <Tooltip content={ScatterTip} cursor={{ strokeDasharray: "3 3" }} />
            {points.map((point) => (
              <Scatter
                key={point.key}
                name={point.name}
                data={[point]}
                fill={colorFor(point.key)}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
        {points.map((point) => (
          <li
            key={point.key}
            className="inline-flex items-center gap-2 text-fg-muted"
          >
            <span
              className="size-2.5 rounded-full"
              style={{ background: colorFor(point.key) }}
              aria-hidden="true"
            />
            {point.name}
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

export function MetricTip({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  const [box, setBox] = useState<{
    x: number;
    y: number;
    above: boolean;
  } | null>(null);
  const timer = useRef<number | null>(null);
  const description = METRIC_DESCRIPTIONS[name];
  const show = (event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(
      Math.max(rect.left + rect.width / 2, 150),
      window.innerWidth - 150,
    );
    const above = rect.bottom + 170 > window.innerHeight;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => setBox({ x, y: above ? rect.top - 8 : rect.bottom + 8, above }),
      120,
    );
  };
  const hide = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setBox(null);
  };
  return (
    <span
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className="inline-flex"
    >
      {children}
      {box && description
        ? createPortal(
            <span
              role="tooltip"
              className={cn(
                "pointer-events-none fixed z-70 w-72 -translate-x-1/2 rounded-xl border border-border bg-surface p-3 text-left text-xs leading-relaxed font-normal tracking-normal text-fg-muted normal-case shadow-pop",
                box.above && "-translate-y-full",
              )}
              style={{ left: box.x, top: box.y }}
            >
              <span className="mb-1 block text-sm font-bold text-fg">
                {name}
              </span>
              {description}
              <span className="mt-1.5 block font-semibold text-brand">
                Click the info icon for the formula.
              </span>
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}

export function MetricSheet({
  name,
  rows,
  onClose,
}: {
  name: string | null;
  rows: ComparisonRow[];
  onClose: () => void;
}) {
  const guide = name ? getMetricGuide(name) : null;
  const direction = name ? metricDirection(name) : null;
  const ranked = name
    ? rows
        .filter((row) => metricValue(row, name) !== null)
        .sort((a, b) => {
          const av = metricValue(a, name) as number;
          const bv = metricValue(b, name) as number;
          return direction === "lower" ? av - bv : bv - av;
        })
    : [];
  return (
    <Sheet
      open={name !== null}
      onClose={onClose}
      bodyClassName="px-5 py-6 sm:px-6"
      title={guide?.title ?? name ?? "Metric"}
      description={
        direction ? (
          <span className="flex flex-wrap gap-1.5 pt-1">
            <Badge tone={direction === "higher" ? "success" : "info"}>
              {direction === "higher" ? (
                <ArrowUp aria-hidden="true" />
              ) : (
                <ArrowDown aria-hidden="true" />
              )}
              {direction === "higher" ? "Higher is better" : "Lower is better"}
            </Badge>
          </span>
        ) : null
      }
    >
      {name ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-orange-500/25 bg-linear-to-br from-orange-500/[0.12] via-surface to-surface p-5">
            <p className="text-sm leading-relaxed text-fg">
              {guide?.meaning ?? METRIC_DESCRIPTIONS[name]}
            </p>
          </div>
          {guide ? (
            <>
              <section className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-bold text-fg">
                  <Sigma className="size-4 text-brand" aria-hidden="true" />
                  Formula
                </h3>
                <div className="rounded-xl border border-border bg-bg-alt p-4">
                  <p className="overflow-x-auto text-[1.05rem] leading-relaxed font-semibold tracking-wide text-brand">
                    {guide.formula}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-fg-muted">
                    {guide.legend}
                  </p>
                </div>
              </section>
              <section className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-bold text-fg">
                  <Lightbulb className="size-4 text-brand" aria-hidden="true" />
                  How to Read It
                </h3>
                <p className="text-sm leading-relaxed text-fg-muted">
                  {guide.reading}
                </p>
                <p className="text-sm font-semibold text-fg">
                  Range: <span className="font-normal">{guide.range}</span>
                </p>
              </section>
            </>
          ) : null}
          {ranked.length ? (
            <section className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-fg">
                <Trophy className="size-4 text-brand" aria-hidden="true" />
                Your Models on This Metric
              </h3>
              <ol className="space-y-1.5">
                {ranked.map((row, index) => (
                  <li
                    key={row.model_key}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm",
                      index === 0
                        ? "border-success-line bg-success-soft"
                        : "border-border bg-surface",
                    )}
                  >
                    <span className="num w-5 text-center font-bold text-fg-subtle">
                      {index === 0 ? (
                        <Crown
                          className="size-4 text-amber-500"
                          aria-label="Best"
                        />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-fg">
                      {row.model_name}
                    </span>
                    <span className="num font-semibold text-fg">
                      {formatMetric(name, metricValue(row, name))}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>
      ) : null}
    </Sheet>
  );
}

export function MetricGuideGrid({
  rows,
  metrics,
  onOpen,
}: {
  rows: ComparisonRow[];
  metrics: string[];
  onOpen: (name: string) => void;
}) {
  return (
    <section aria-labelledby="metric-guide-title" className="space-y-5">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow justify-center">
          <BookOpen className="size-4" aria-hidden="true" />
          Metric Guide
        </p>
        <h2
          id="metric-guide-title"
          className="mt-2 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl"
        >
          What Each Score Means
        </h2>
        <p className="mt-2 text-fg-muted">
          Select any metric to see its formula, how to read it, and how your
          models rank on it.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((name) => {
          const guide = getMetricGuide(name);
          const direction = metricDirection(name);
          const values = rows
            .map((row) => ({ row, value: metricValue(row, name) }))
            .filter(
              (item): item is { row: ComparisonRow; value: number } =>
                item.value !== null,
            )
            .sort((a, b) =>
              direction === "lower" ? a.value - b.value : b.value - a.value,
            );
          const best = values[0];
          return (
            <li key={name}>
              <button
                type="button"
                onClick={() => onOpen(name)}
                className="group flex h-full w-full flex-col rounded-2xl border border-border bg-surface p-5 text-left shadow-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-line hover:shadow-card-hover"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="text-base font-bold text-fg">{name}</span>
                  {direction ? (
                    <Badge tone={direction === "higher" ? "success" : "info"}>
                      {direction === "higher" ? (
                        <ArrowUp aria-hidden="true" />
                      ) : (
                        <ArrowDown aria-hidden="true" />
                      )}
                      {direction === "higher" ? "Higher" : "Lower"} wins
                    </Badge>
                  ) : null}
                </span>
                <span className="mt-2 line-clamp-3 text-sm leading-relaxed text-fg-muted">
                  {METRIC_DESCRIPTIONS[name] ?? guide?.meaning}
                </span>
                {guide ? (
                  <span className="mt-3 block rounded-lg bg-bg-alt px-3 py-2 text-sm leading-relaxed font-semibold text-brand">
                    {guide.formula}
                  </span>
                ) : null}
                {best ? (
                  <span className="mt-auto flex items-center gap-2 pt-4 text-xs text-fg-subtle">
                    <Crown
                      className="size-3.5 text-amber-500"
                      aria-hidden="true"
                    />
                    Best here:{" "}
                    <span className="truncate font-semibold text-fg">
                      {best.row.model_name}
                    </span>
                    <span className="num ml-auto font-semibold text-fg">
                      {formatMetric(name, best.value)}
                    </span>
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ComparisonSummary({
  rows,
  metric,
}: {
  rows: ComparisonRow[];
  metric: string | null;
}) {
  if (!metric || rows.length === 0) return null;
  const direction = metricDirection(metric);
  const ranked = rows
    .filter((row) => metricValue(row, metric) !== null)
    .sort((a, b) => {
      const av = metricValue(a, metric) as number;
      const bv = metricValue(b, metric) as number;
      return direction === "lower" ? av - bv : bv - av;
    });
  const best = ranked[0];
  const runnerUp = ranked[1];
  const worst = ranked[ranked.length - 1];
  const timed = rows
    .filter((row) => metricValue(row, "duration_ms") !== null)
    .sort(
      (a, b) =>
        (metricValue(a, "duration_ms") as number) -
        (metricValue(b, "duration_ms") as number),
    );
  const stable = rows
    .filter((row) => metricValue(row, "CV Std") !== null)
    .sort(
      (a, b) =>
        (metricValue(a, "CV Std") as number) -
        (metricValue(b, "CV Std") as number),
    );
  const items: { icon: ReactNode; title: string; body: string }[] = [];
  if (best) {
    items.push({
      icon: <Trophy aria-hidden="true" />,
      title: "Top Performer",
      body: `${best.model_name} leads on ${metric} with ${formatMetric(metric, metricValue(best, metric))}${runnerUp ? `, ahead of ${runnerUp.model_name} at ${formatMetric(metric, metricValue(runnerUp, metric))}` : ""}.`,
    });
  }
  if (best && worst && worst !== best) {
    items.push({
      icon: <Gauge aria-hidden="true" />,
      title: "Spread",
      body: `Scores range from ${formatMetric(metric, metricValue(worst, metric))} (${worst.model_name}) to ${formatMetric(metric, metricValue(best, metric))}, across ${ranked.length} models.`,
    });
  }
  if (timed[0]) {
    items.push({
      icon: <Timer aria-hidden="true" />,
      title: "Fastest to Train",
      body: `${timed[0].model_name} trained in ${formatDuration(metricValue(timed[0], "duration_ms") as number)}${metricValue(timed[0], metric) !== null ? ` and scored ${formatMetric(metric, metricValue(timed[0], metric))}` : ""}.`,
    });
  }
  if (stable[0]) {
    items.push({
      icon: <Sigma aria-hidden="true" />,
      title: "Most Consistent",
      body: `${stable[0].model_name} varied least across cross-validation folds (spread ${formatDecimal(metricValue(stable[0], "CV Std") as number, 3)}).`,
    });
  }
  if (items.length === 0) return null;
  return (
    <section
      aria-label="Comparison summary"
      className="relative overflow-hidden rounded-2xl border border-orange-500/25 bg-linear-to-br from-orange-500/[0.1] via-surface to-surface p-5 shadow-card sm:p-6"
    >
      <span
        className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-orange-500/15 blur-3xl"
        aria-hidden="true"
      />
      <h2 className="relative flex items-center gap-2 text-lg font-bold tracking-tight text-fg">
        <Lightbulb className="size-5 text-brand" aria-hidden="true" />
        Summary
      </h2>
      <ul className="relative mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <li key={item.title} className="flex gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-md [&_svg]:size-4.5">
              {item.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-fg">
                {item.title}
              </span>
              <span className="mt-0.5 block text-sm leading-relaxed text-fg-muted">
                {item.body}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
