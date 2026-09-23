"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChartColumn,
  Copy,
  Database,
  Grid3x3,
  Hash,
  ListOrdered,
  Rows3,
  Sigma,
  Table2,
  Type,
  WandSparkles,
  HardDrive,
  CircleOff,
  Columns3,
} from "lucide-react";
import { NextStep } from "@/components/app/AppChrome";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Segmented, TabPanel, Tabs } from "@/components/ui/Controls";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/Feedback";
import { PageHeader, StatCard, TableContainer } from "@/components/ui/Layout";
import { Select } from "@/components/ui/Select";
import { api } from "@/lib/api/endpoints";
import type { Cell, Overview } from "@/lib/api/types";
import { setPreferences, usePreferences } from "@/lib/preferences";
import { useReadySession } from "@/lib/session";
import { useResource, type Resource } from "@/lib/use-resource";
import {
  cn,
  formatCompact,
  formatDecimal,
  formatInteger,
  formatKilobytes,
  formatPercent,
  countLabel,
} from "@/lib/utils";

type TabKey = "preview" | "summary" | "types" | "correlation" | "values";

function ResourceView<T>({
  resource,
  loadingLabel,
  errorTitle,
  children,
}: {
  resource: Resource<T>;
  loadingLabel: string;
  errorTitle: string;
  children: (data: T) => React.ReactNode;
}) {
  if (resource.status === "error" && !resource.data) {
    return (
      <ErrorState
        title={errorTitle}
        message={resource.error?.message ?? "Something went wrong."}
        onRetry={resource.reload}
      />
    );
  }
  if (!resource.data) return <LoadingBlock label={loadingLabel} />;
  return <>{children(resource.data)}</>;
}

function CellValue({ value }: { value: Cell }) {
  if (value === null || value === undefined || value === "") {
    return (
      <span className="rounded bg-danger-soft px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-danger uppercase">
        Missing
      </span>
    );
  }
  if (typeof value === "number")
    return <span className="num">{formatDecimal(value, 4)}</span>;
  if (typeof value === "boolean")
    return <span className="num">{String(value)}</span>;
  const text = String(value);
  return (
    <span
      className="block max-w-72 truncate"
      title={text.length > 40 ? text : undefined}
    >
      {text}
    </span>
  );
}

function columnKind(dtype: string): { label: string; tone: Tone } {
  const value = dtype.toLowerCase();
  if (value.includes("int") || value.includes("float"))
    return { label: "Number", tone: "info" };
  if (value.includes("datetime") || value.includes("date"))
    return { label: "Date", tone: "success" };
  if (value.includes("bool")) return { label: "Boolean", tone: "warning" };
  if (
    value.includes("object") ||
    value.includes("string") ||
    value.includes("category")
  ) {
    return { label: "Text", tone: "brand" };
  }
  return { label: "Other", tone: "neutral" };
}

function Composition({ overview }: { overview: Overview }) {
  const numeric = overview.numeric_columns.length;
  const text = overview.categorical_columns.length;
  const dates = overview.datetime_columns.length;
  const other = Math.max(0, overview.columns - numeric - text - dates);
  const parts = [
    { label: "Number", count: numeric, className: "bg-sky-500" },
    { label: "Text", count: text, className: "bg-indigo-500" },
    { label: "Date", count: dates, className: "bg-emerald-500" },
    { label: "Other", count: other, className: "bg-zinc-400" },
  ].filter((part) => part.count > 0);
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-fg">Column Composition</h2>
        <p className="text-sm text-fg-subtle">
          {countLabel(overview.columns, "column")} in total
        </p>
      </div>
      <div
        className="mt-4 flex h-3 overflow-hidden rounded-full bg-surface-3"
        aria-hidden="true"
      >
        {parts.map((part) => (
          <span
            key={part.label}
            className={part.className}
            style={{
              width: `${(part.count / Math.max(overview.columns, 1)) * 100}%`,
            }}
          />
        ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {parts.map((part) => (
          <li
            key={part.label}
            className="inline-flex items-center gap-2 text-fg-muted"
          >
            <span
              className={cn("size-2.5 rounded-full", part.className)}
              aria-hidden="true"
            />
            <span className="font-semibold text-fg">{part.count}</span>{" "}
            {part.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PreviewPanel({
  sessionId,
  dataVersion,
}: {
  sessionId: string;
  dataVersion: number;
}) {
  const { previewRows } = usePreferences();
  const [edge, setEdge] = useState<"head" | "tail">("head");
  const resource = useResource(
    `preview:${sessionId}:${dataVersion}:${edge}:${previewRows}`,
    (signal) =>
      edge === "head"
        ? api.head(sessionId, previewRows, signal)
        : api.tail(sessionId, previewRows, signal),
    { sessionId, keepPrevious: true },
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          aria-label="Rows to preview"
          value={edge}
          onChange={setEdge}
          options={[
            { value: "head", label: "First Rows" },
            { value: "tail", label: "Last Rows" },
          ]}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-fg-muted" id="preview-rows-label">
            Rows shown
          </span>
          <Select
            aria-labelledby="preview-rows-label"
            value={String(previewRows)}
            onChange={(value) => setPreferences({ previewRows: Number(value) })}
            options={[10, 25, 50, 100].map((n) => ({
              value: String(n),
              label: `${n} rows`,
            }))}
            size="sm"
            align="end"
            minMenuWidth={140}
            className="w-32"
          />
        </div>
      </div>
      <ResourceView
        resource={resource}
        loadingLabel="Loading rows…"
        errorTitle="We Couldn't Load the Preview"
      >
        {(data) => {
          const numeric = new Set(
            data.columns.filter((column) =>
              data.data.some((row) => typeof row[column] === "number"),
            ),
          );
          return (
            <TableContainer
              label="Dataset preview"
              maxHeight="32rem"
              className={cn(resource.isRefreshing && "opacity-60")}
            >
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col" className="sticky-col w-14 text-right">
                      #
                    </th>
                    {data.columns.map((column) => (
                      <th
                        key={column}
                        scope="col"
                        className={cn(numeric.has(column) && "text-right")}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((row, index) => (
                    <tr key={index}>
                      <td className="sticky-col num text-right text-fg-subtle">
                        {index + 1}
                      </td>
                      {data.columns.map((column) => (
                        <td
                          key={column}
                          className={cn(
                            "whitespace-nowrap",
                            numeric.has(column) && "text-right",
                          )}
                        >
                          <CellValue value={row[column]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableContainer>
          );
        }}
      </ResourceView>
    </div>
  );
}

const STAT_ORDER = [
  "count",
  "mean",
  "std",
  "min",
  "25%",
  "50%",
  "75%",
  "max",
  "unique",
  "top",
  "freq",
];
const STAT_LABELS: Record<string, string> = {
  count: "Count",
  mean: "Mean",
  std: "Std Dev",
  min: "Min",
  "25%": "25%",
  "50%": "Median",
  "75%": "75%",
  max: "Max",
  unique: "Unique",
  top: "Most Common",
  freq: "Frequency",
};

function SummaryPanel({
  sessionId,
  dataVersion,
}: {
  sessionId: string;
  dataVersion: number;
}) {
  const resource = useResource(
    `describe:${sessionId}:${dataVersion}`,
    (signal) => api.describe(sessionId, signal),
    {
      sessionId,
    },
  );
  return (
    <ResourceView
      resource={resource}
      loadingLabel="Calculating statistics…"
      errorTitle="We Couldn't Load Statistics"
    >
      {(data) => {
        const columns = Object.keys(data.describe);
        const stats = STAT_ORDER.filter((stat) =>
          columns.some(
            (column) =>
              data.describe[column]?.[stat] !== null &&
              data.describe[column]?.[stat] !== undefined,
          ),
        );
        return (
          <TableContainer label="Summary statistics" maxHeight="34rem">
            <table className="data-table">
              <caption className="sr-only">
                Summary statistics for each column
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="sticky-col">
                    Column
                  </th>
                  {stats.map((stat) => (
                    <th key={stat} scope="col" className="text-right">
                      {STAT_LABELS[stat]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {columns.map((column) => (
                  <tr key={column}>
                    <th
                      scope="row"
                      className="sticky-col px-4 py-2.5 text-left font-semibold whitespace-nowrap text-fg"
                    >
                      {column}
                    </th>
                    {stats.map((stat) => {
                      const value = data.describe[column]?.[stat];
                      return (
                        <td key={stat} className="text-right whitespace-nowrap">
                          {value === null || value === undefined ? (
                            <span className="text-fg-subtle">—</span>
                          ) : typeof value === "number" ? (
                            <span className="num">
                              {stat === "count" ||
                              stat === "unique" ||
                              stat === "freq"
                                ? formatInteger(value)
                                : formatDecimal(value, 3)}
                            </span>
                          ) : (
                            <span
                              className="inline-block max-w-48 truncate align-bottom"
                              title={String(value)}
                            >
                              {String(value)}
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
        );
      }}
    </ResourceView>
  );
}

function TypesPanel({
  sessionId,
  dataVersion,
}: {
  sessionId: string;
  dataVersion: number;
}) {
  const types = useResource(
    `dtypes:${sessionId}:${dataVersion}`,
    (signal) => api.dtypes(sessionId, signal),
    { sessionId },
  );
  const missing = useResource(
    `missing:${sessionId}:${dataVersion}`,
    (signal) => api.missing(sessionId, signal),
    { sessionId },
  );
  return (
    <ResourceView
      resource={types}
      loadingLabel="Detecting column types…"
      errorTitle="We Couldn't Load Column Types"
    >
      {(data) => (
        <TableContainer label="Column types" maxHeight="34rem">
          <table className="data-table">
            <caption className="sr-only">
              Data type and missing values for each column
            </caption>
            <thead>
              <tr>
                <th scope="col">Column</th>
                <th scope="col">Kind</th>
                <th scope="col">Stored As</th>
                <th scope="col" className="text-right">
                  Missing
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.dtypes).map(([column, dtype]) => {
                const kind = columnKind(dtype);
                const info = missing.data?.per_column[column];
                return (
                  <tr key={column}>
                    <td className="font-semibold text-fg">{column}</td>
                    <td>
                      <Badge tone={kind.tone}>{kind.label}</Badge>
                    </td>
                    <td className="font-mono text-sm text-fg-muted">{dtype}</td>
                    <td className="num text-right">
                      {info ? (
                        info.count > 0 ? (
                          <span className="font-semibold text-danger">
                            {formatInteger(info.count)} (
                            {formatPercent(info.percentage)})
                          </span>
                        ) : (
                          <span className="text-fg-subtle">None</span>
                        )
                      ) : (
                        <span className="text-fg-subtle">…</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableContainer>
      )}
    </ResourceView>
  );
}

const MAX_HEATMAP_COLUMNS = 20;

function correlationColor(value: number | null): {
  background: string;
  color: string;
} {
  if (value === null)
    return { background: "var(--surface-2)", color: "var(--fg-subtle)" };
  const alpha = Math.min(Math.abs(value), 1);
  const background =
    value >= 0
      ? `rgb(99 102 241 / ${0.08 + alpha * 0.82})`
      : `rgb(239 68 68 / ${0.08 + alpha * 0.8})`;
  return { background, color: alpha > 0.5 ? "#ffffff" : "var(--fg)" };
}

function CorrelationPanel({
  sessionId,
  dataVersion,
}: {
  sessionId: string;
  dataVersion: number;
}) {
  const resource = useResource(
    `correlation:${sessionId}:${dataVersion}`,
    (signal) => api.correlation(sessionId, signal),
    {
      sessionId,
    },
  );
  return (
    <ResourceView
      resource={resource}
      loadingLabel="Calculating correlations…"
      errorTitle="We Couldn't Load Correlations"
    >
      {(data) => {
        const allColumns = Object.keys(data.correlation);
        if (allColumns.length < 2) {
          return (
            <EmptyState
              compact
              icon={<Grid3x3 aria-hidden="true" />}
              title="Not Enough Numeric Columns"
              description="Correlations compare numeric columns with each other, so at least two numeric columns are needed."
            />
          );
        }
        const columns = allColumns.slice(0, MAX_HEATMAP_COLUMNS);
        const pairs: { a: string; b: string; value: number }[] = [];
        allColumns.forEach((a, i) =>
          allColumns.slice(i + 1).forEach((b) => {
            const value = data.correlation[a]?.[b];
            if (typeof value === "number") pairs.push({ a, b, value });
          }),
        );
        const strongest = pairs
          .sort((x, y) => Math.abs(y.value) - Math.abs(x.value))
          .slice(0, 8);
        return (
          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-3">
              <TableContainer
                label="Correlation heatmap"
                maxHeight="36rem"
                className="p-3"
              >
                <table className="border-separate border-spacing-1 text-xs">
                  <caption className="sr-only">
                    Pearson correlation between numeric columns
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" className="sr-only">
                        Column
                      </th>
                      {columns.map((column) => (
                        <th
                          key={column}
                          scope="col"
                          className="h-28 max-w-12 px-1 align-bottom font-semibold text-fg-muted"
                        >
                          <span
                            className="mx-auto block max-h-28 rotate-180 truncate [writing-mode:vertical-rl]"
                            title={column}
                          >
                            {column}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {columns.map((row) => (
                      <tr key={row}>
                        <th
                          scope="row"
                          className="max-w-40 truncate pr-2 text-right font-semibold text-fg-muted"
                          title={row}
                        >
                          {row}
                        </th>
                        {columns.map((column) => {
                          const value = data.correlation[row]?.[column] ?? null;
                          const style = correlationColor(value);
                          return (
                            <td
                              key={column}
                              className="num size-12 min-w-12 rounded-md text-center font-semibold"
                              style={style}
                              title={`${row} and ${column}: ${value === null ? "not available" : value.toFixed(3)}`}
                            >
                              {value === null ? "—" : value.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableContainer>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-fg-muted">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="size-3 rounded bg-indigo-500"
                    aria-hidden="true"
                  />{" "}
                  Positive: both rise together
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="size-3 rounded bg-red-500"
                    aria-hidden="true"
                  />{" "}
                  Negative: one rises as the other falls
                </span>
                {allColumns.length > MAX_HEATMAP_COLUMNS ? (
                  <span>
                    Showing the first {MAX_HEATMAP_COLUMNS} of{" "}
                    {allColumns.length} numeric columns.
                  </span>
                ) : null}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-bg-alt p-5">
              <h3 className="text-base font-bold text-fg">
                Strongest Relationships
              </h3>
              <p className="mt-1 text-sm text-fg-muted">
                Pairs of columns that move together the most.
              </p>
              <ol className="mt-4 space-y-3">
                {strongest.map((pair) => (
                  <li key={`${pair.a}-${pair.b}`}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span
                        className="min-w-0 truncate font-medium text-fg"
                        title={`${pair.a} and ${pair.b}`}
                      >
                        {pair.a} <span className="text-fg-subtle">and</span>{" "}
                        {pair.b}
                      </span>
                      <span
                        className={cn(
                          "num shrink-0 font-semibold",
                          pair.value >= 0 ? "text-brand" : "text-danger",
                        )}
                      >
                        {pair.value >= 0 ? "+" : ""}
                        {pair.value.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          pair.value >= 0 ? "bg-indigo-500" : "bg-red-500",
                        )}
                        style={{ width: `${Math.abs(pair.value) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        );
      }}
    </ResourceView>
  );
}

function ValueCountsPanel({
  sessionId,
  dataVersion,
  overview,
}: {
  sessionId: string;
  dataVersion: number;
  overview: Overview;
}) {
  const defaultColumn =
    overview.categorical_columns[0] ?? overview.column_names[0] ?? null;
  const [column, setColumn] = useState<string | null>(defaultColumn);
  const resource = useResource(
    column ? `values:${sessionId}:${dataVersion}:${column}` : null,
    (signal) => api.valueCounts(sessionId, column as string, signal),
    { sessionId, keepPrevious: true },
  );
  const options = useMemo(
    () =>
      overview.column_names.map((name) => ({
        value: name,
        label: name,
        meta: overview.numeric_columns.includes(name)
          ? "number"
          : overview.datetime_columns.includes(name)
            ? "date"
            : "text",
      })),
    [overview],
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-full max-w-sm">
          <p
            id="value-column-label"
            className="mb-2 text-sm font-semibold text-fg"
          >
            Column
          </p>
          <Select
            aria-labelledby="value-column-label"
            value={column}
            onChange={setColumn}
            options={options}
            searchable
            searchPlaceholder="Search columns…"
            placeholder="Choose a column"
          />
        </div>
        {resource.data ? (
          <div className="flex flex-wrap gap-2 pb-1">
            <Badge tone="brand" size="md">
              {formatInteger(resource.data.unique)} unique values
            </Badge>
            <Badge
              tone={resource.data.missing > 0 ? "danger" : "neutral"}
              size="md"
            >
              {formatInteger(resource.data.missing)} missing
            </Badge>
          </div>
        ) : null}
      </div>
      {column ? (
        <ResourceView
          resource={resource}
          loadingLabel="Counting values…"
          errorTitle="We Couldn't Count Values"
        >
          {(data) => {
            const max = Math.max(...data.counts.map((item) => item.count), 1);
            return (
              <div
                className={cn(
                  "rounded-2xl border border-border bg-surface p-5",
                  resource.isRefreshing && "opacity-60",
                )}
              >
                <p className="text-sm text-fg-muted">
                  Top {data.counts.length} values in{" "}
                  <span className="font-semibold text-fg">{data.column}</span>
                </p>
                <ol className="mt-4 space-y-2.5">
                  {data.counts.map((item, index) => {
                    const label =
                      item.value === null ? "Missing" : String(item.value);
                    return (
                      <li
                        key={`${label}-${index}`}
                        className="grid grid-cols-[minmax(0,12rem)_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[minmax(0,16rem)_1fr_auto]"
                      >
                        <span
                          className={cn(
                            "truncate",
                            item.value === null
                              ? "font-semibold text-danger"
                              : "text-fg",
                          )}
                          title={label}
                        >
                          {label}
                        </span>
                        <span className="h-2.5 overflow-hidden rounded-full bg-surface-3">
                          <span
                            className={cn(
                              "block h-full rounded-full",
                              item.value === null
                                ? "bg-red-500"
                                : "bg-linear-to-r from-indigo-500 to-violet-500",
                            )}
                            style={{ width: `${(item.count / max) * 100}%` }}
                          />
                        </span>
                        <span className="num text-right whitespace-nowrap text-fg-muted">
                          {formatInteger(item.count)}
                          <span className="ml-2 hidden text-fg-subtle sm:inline">
                            {formatPercent(
                              (item.count / Math.max(overview.rows, 1)) * 100,
                            )}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          }}
        </ResourceView>
      ) : null}
    </div>
  );
}

function nextStepMessage(overview: Overview): string {
  const missing = overview.total_missing;
  const duplicates = overview.duplicate_rows;
  if (missing > 0 && duplicates > 0) {
    return `Fix ${countLabel(missing, "missing cell")} and ${countLabel(duplicates, "duplicate row")} before training.`;
  }
  if (missing > 0)
    return `Fix ${countLabel(missing, "missing cell")} before training.`;
  if (duplicates > 0)
    return `Remove ${countLabel(duplicates, "duplicate row")} before training.`;
  return "Your data has no missing values or duplicates. Review the cleaning options or move straight to training.";
}

export function InsightsView() {
  const { sessionId, filename, overview, versions } = useReadySession();
  const [tab, setTab] = useState<TabKey>("preview");

  const stats: {
    label: string;
    value: string;
    hint?: string;
    icon: React.ReactNode;
    tone: Tone;
  }[] = [
    {
      label: "Rows",
      value: formatCompact(overview.rows),
      hint: formatInteger(overview.rows) + " records",
      icon: <Rows3 />,
      tone: "brand",
    },
    {
      label: "Columns",
      value: formatInteger(overview.columns),
      hint: "Attributes per record",
      icon: <Columns3 />,
      tone: "brand",
    },
    {
      label: "Number Columns",
      value: formatInteger(overview.numeric_columns.length),
      hint: "Integers and decimals",
      icon: <Hash />,
      tone: "info",
    },
    {
      label: "Text Columns",
      value: formatInteger(overview.categorical_columns.length),
      hint: "Labels and categories",
      icon: <Type />,
      tone: "brand",
    },
    {
      label: "Missing Cells",
      value: formatInteger(overview.total_missing),
      hint: `${formatPercent(overview.total_missing_percentage)} of all cells`,
      icon: <CircleOff />,
      tone: overview.total_missing > 0 ? "danger" : "success",
    },
    {
      label: "Duplicate Rows",
      value: formatInteger(overview.duplicate_rows),
      hint:
        overview.duplicate_rows > 0
          ? "Can be removed in Clean Data"
          : "No exact duplicates",
      icon: <Copy />,
      tone: overview.duplicate_rows > 0 ? "warning" : "success",
    },
    {
      label: "Date Columns",
      value: formatInteger(overview.datetime_columns.length),
      hint: "Parsed as dates",
      icon: <CalendarDays />,
      tone: "success",
    },
    {
      label: "Memory Size",
      value: formatKilobytes(overview.memory_usage_kb),
      hint: "In-memory footprint",
      icon: <HardDrive />,
      tone: "neutral",
    },
  ];

  const tabs: { value: TabKey; label: string; icon: React.ReactNode }[] = [
    { value: "preview", label: "Preview", icon: <Table2 aria-hidden="true" /> },
    {
      value: "summary",
      label: "Summary Statistics",
      icon: <Sigma aria-hidden="true" />,
    },
    {
      value: "types",
      label: "Column Types",
      icon: <ListOrdered aria-hidden="true" />,
    },
    {
      value: "correlation",
      label: "Correlation",
      icon: <Grid3x3 aria-hidden="true" />,
    },
    {
      value: "values",
      label: "Value Counts",
      icon: <ChartColumn aria-hidden="true" />,
    },
  ];

  return (
    <div className="space-y-10 lg:space-y-12">
      <PageHeader
        eyebrow="Step 2 · Explore"
        title="Dataset Insights"
        description="Get to know your data before you clean it or train models: its shape, types, statistics, and relationships."
        meta={
          <>
            <Badge tone="neutral" size="md">
              <Database aria-hidden="true" />
              {filename}
            </Badge>
            <Badge tone={overview.is_cleaned ? "success" : "neutral"} size="md">
              {overview.is_cleaned ? "Cleaned copy" : "Original upload"}
            </Badge>
          </>
        }
      />

      <section
        aria-label="Dataset summary"
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            hint={stat.hint}
            icon={stat.icon}
            tone={stat.tone}
          />
        ))}
      </section>

      <Composition overview={overview} />

      <section aria-label="Explore the data" className="space-y-5">
        <Tabs
          aria-label="Insight views"
          idPrefix="insights"
          value={tab}
          onChange={setTab}
          tabs={tabs}
        />
        <TabPanel idPrefix="insights" value={tab}>
          {tab === "preview" ? (
            <PreviewPanel sessionId={sessionId} dataVersion={versions.data} />
          ) : null}
          {tab === "summary" ? (
            <SummaryPanel sessionId={sessionId} dataVersion={versions.data} />
          ) : null}
          {tab === "types" ? (
            <TypesPanel sessionId={sessionId} dataVersion={versions.data} />
          ) : null}
          {tab === "correlation" ? (
            <CorrelationPanel
              sessionId={sessionId}
              dataVersion={versions.data}
            />
          ) : null}
          {tab === "values" ? (
            <ValueCountsPanel
              sessionId={sessionId}
              dataVersion={versions.data}
              overview={overview}
            />
          ) : null}
        </TabPanel>
      </section>

      <NextStep
        href="/app/clean"
        title="Clean Your Data"
        description={nextStepMessage(overview)}
        icon={<WandSparkles aria-hidden="true" />}
      />
    </div>
  );
}
