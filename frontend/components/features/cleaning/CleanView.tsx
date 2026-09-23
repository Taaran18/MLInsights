"use client";

import { useId, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowRight,
  BrainCircuit,
  CircleCheck,
  Columns3,
  Copy,
  Eye,
  RotateCcw,
  Rows3,
  CircleOff,
  WandSparkles,
} from "lucide-react";
import { NextStep } from "@/components/app/AppChrome";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SwitchField } from "@/components/ui/Controls";
import {
  Callout,
  EmptyState,
  ErrorState,
  LoadingBlock,
} from "@/components/ui/Feedback";
import {
  Field,
  PageHeader,
  StatCard,
  TableContainer,
} from "@/components/ui/Layout";
import { Select } from "@/components/ui/Select";
import { getErrorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/endpoints";
import type {
  CategoricalFill,
  CleanImpact,
  CleanOptions,
  NumericFill,
} from "@/lib/api/types";
import { useReadySession } from "@/lib/session";
import { bumpDataVersion } from "@/lib/session-store";
import { useResource } from "@/lib/use-resource";
import { cn, formatInteger, formatPercent, countLabel } from "@/lib/utils";

const DEFAULT_OPTIONS: CleanOptions = {
  drop_duplicates: true,
  fill_numeric: "median",
  fill_categorical: "mode",
  drop_high_missing_cols: null,
  drop_high_missing_rows: null,
  normalize_empty_strings: true,
};

const NUMERIC_OPTIONS = [
  {
    value: "none",
    label: "Don't Fill",
    description: "Leave missing numbers as they are.",
  },
  {
    value: "median",
    label: "Median",
    description: "The middle value. Robust to outliers.",
  },
  {
    value: "mean",
    label: "Mean",
    description: "The average value of the column.",
  },
  {
    value: "zero",
    label: "Zero",
    description: "Replace missing numbers with 0.",
  },
];

const TEXT_OPTIONS = [
  {
    value: "none",
    label: "Don't Fill",
    description: "Leave missing text as it is.",
  },
  {
    value: "mode",
    label: "Most Common Value",
    description: "The value that appears most often.",
  },
  {
    value: "unknown",
    label: "“Unknown”",
    description: "Replace missing text with the word Unknown.",
  },
];

const COLUMN_THRESHOLDS = [
  { value: "none", label: "Keep All Columns" },
  { value: "90", label: "More Than 90% Missing" },
  { value: "75", label: "More Than 75% Missing" },
  { value: "50", label: "More Than 50% Missing" },
  { value: "25", label: "More Than 25% Missing" },
];

const ROW_THRESHOLDS = [
  { value: "none", label: "Keep All Rows" },
  { value: "75", label: "More Than 75% Missing" },
  { value: "50", label: "More Than 50% Missing" },
  { value: "25", label: "More Than 25% Missing" },
  { value: "0", label: "Any Missing Value" },
];

function severity(percentage: number): {
  bar: string;
  tone: "danger" | "warning" | "info";
} {
  if (percentage >= 50) return { bar: "bg-red-500", tone: "danger" };
  if (percentage >= 20) return { bar: "bg-amber-500", tone: "warning" };
  return { bar: "bg-sky-500", tone: "info" };
}

function ImpactSummary({ impact }: { impact: CleanImpact }) {
  const rows = [
    {
      label: "Rows",
      icon: <Rows3 className="size-4" aria-hidden="true" />,
      before: impact.before.rows,
      after: impact.after.rows,
    },
    {
      label: "Columns",
      icon: <Columns3 className="size-4" aria-hidden="true" />,
      before: impact.before.columns,
      after: impact.after.columns,
    },
    {
      label: "Missing cells",
      icon: <CircleOff className="size-4" aria-hidden="true" />,
      before: impact.before.missing,
      after: impact.after.missing,
    },
  ];
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="data-table">
          <caption className="sr-only">
            Dataset before and after cleaning
          </caption>
          <thead>
            <tr>
              <th scope="col">Measure</th>
              <th scope="col" className="text-right">
                Before
              </th>
              <th scope="col" className="text-right">
                After
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const changed = row.before !== row.after;
              return (
                <tr key={row.label}>
                  <th
                    scope="row"
                    className="px-4 py-2.5 text-left font-medium text-fg"
                  >
                    <span className="inline-flex items-center gap-2">
                      {row.icon}
                      {row.label}
                    </span>
                  </th>
                  <td className="num text-right text-fg-muted">
                    {formatInteger(row.before)}
                  </td>
                  <td
                    className={cn(
                      "num text-right font-semibold",
                      changed ? "text-brand" : "text-fg",
                    )}
                  >
                    {formatInteger(row.after)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {impact.dropped_columns.length > 0 ? (
        <p className="text-sm text-fg-muted">
          <span className="font-semibold text-fg">Columns removed:</span>{" "}
          {impact.dropped_columns.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

export function CleanView() {
  const { sessionId, overview, versions } = useReadySession();
  const numericId = useId();
  const textId = useId();
  const columnId = useId();
  const rowId = useId();
  const [options, setOptions] = useState<CleanOptions>(DEFAULT_OPTIONS);
  const [preview, setPreview] = useState<{
    options: CleanOptions;
    impact: CleanImpact;
  } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [revertOpen, setRevertOpen] = useState(false);
  const [reverting, setReverting] = useState(false);

  const missing = useResource(
    `missing:${sessionId}:${versions.data}`,
    (signal) => api.missing(sessionId, signal),
    {
      sessionId,
      keepPrevious: true,
    },
  );

  const previewIsCurrent =
    preview !== null &&
    JSON.stringify(preview.options) === JSON.stringify(options);
  const update = (patch: Partial<CleanOptions>) =>
    setOptions((current) => ({ ...current, ...patch }));

  const runPreview = async (): Promise<CleanImpact | null> => {
    setPreviewing(true);
    try {
      const impact = await api.previewClean(sessionId, options);
      setPreview({ options, impact });
      return impact;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return null;
    } finally {
      setPreviewing(false);
    }
  };

  const openConfirm = async () => {
    if (!previewIsCurrent) {
      const impact = await runPreview();
      if (!impact) return;
    }
    setConfirmOpen(true);
  };

  const apply = async () => {
    setApplying(true);
    try {
      const result = await api.clean(sessionId, options);
      setConfirmOpen(false);
      bumpDataVersion();
      toast.success(
        `Cleaning applied: ${countLabel(result.after.rows, "row")} and ${countLabel(result.after.missing, "missing cell")} remain.`,
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setApplying(false);
    }
  };

  const revert = async () => {
    setReverting(true);
    try {
      await api.resetCleaning(sessionId);
      setRevertOpen(false);
      setPreview(null);
      bumpDataVersion();
      toast.success("Reverted to your original upload.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setReverting(false);
    }
  };

  const perColumn = Object.entries(missing.data?.per_column ?? {})
    .filter(([, info]) => info.count > 0)
    .sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="space-y-10 lg:space-y-12">
      <PageHeader
        eyebrow="Step 3 · Prepare"
        title="Clean Your Data"
        description="Fix missing values and duplicate rows. Cleaning always starts from your original upload, so you can adjust the options and apply them again at any time."
      />

      {overview.is_cleaned ? (
        <Callout
          tone="success"
          title="You're working with a cleaned copy of your data"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRevertOpen(true)}
            >
              <RotateCcw aria-hidden="true" />
              Revert to Original
            </Button>
          }
        >
          Insights, training, and exports use the cleaned data. Your original
          upload is still saved.
        </Callout>
      ) : null}

      <section
        aria-label="Data quality summary"
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        <StatCard
          label="Rows"
          value={formatInteger(overview.rows)}
          icon={<Rows3 />}
          tone="brand"
        />
        <StatCard
          label="Missing Cells"
          value={formatInteger(overview.total_missing)}
          hint={`${formatPercent(overview.total_missing_percentage)} of all cells`}
          icon={<CircleOff />}
          tone={overview.total_missing > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Columns With Gaps"
          value={missing.data ? formatInteger(perColumn.length) : "…"}
          hint={`Out of ${countLabel(overview.columns, "column")}`}
          icon={<Columns3 />}
          tone={perColumn.length > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Duplicate Rows"
          value={formatInteger(overview.duplicate_rows)}
          icon={<Copy />}
          tone={overview.duplicate_rows > 0 ? "warning" : "success"}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_26rem] xl:items-start">
        <Panel
          title="Missing Values by Column"
          description="Columns are sorted by how many values are missing."
          icon={<CircleOff aria-hidden="true" />}
        >
          {missing.status === "error" && !missing.data ? (
            <ErrorState
              title="We Couldn't Check for Missing Values"
              message={missing.error?.message ?? ""}
              onRetry={missing.reload}
            />
          ) : !missing.data ? (
            <LoadingBlock label="Checking every column for missing values…" />
          ) : perColumn.length === 0 ? (
            <EmptyState
              compact
              icon={<CircleCheck aria-hidden="true" />}
              title="No Missing Values Found"
              description="Every column in this dataset is complete. You can still remove duplicates or go straight to training."
            />
          ) : (
            <TableContainer label="Missing values by column" maxHeight="30rem">
              <table className="data-table">
                <caption className="sr-only">
                  Missing values in each column
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Column</th>
                    <th scope="col">Type</th>
                    <th scope="col" className="text-right">
                      Missing
                    </th>
                    <th scope="col" className="w-[40%]">
                      Share of Rows
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {perColumn.map(([column, info]) => {
                    const level = severity(info.percentage);
                    return (
                      <tr key={column}>
                        <td className="font-semibold text-fg">{column}</td>
                        <td className="font-mono text-sm text-fg-muted">
                          {info.dtype}
                        </td>
                        <td className="num text-right font-semibold text-danger">
                          {formatInteger(info.count)}
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                              <div
                                className={cn("h-full rounded-full", level.bar)}
                                style={{
                                  width: `${Math.max(info.percentage, 1.5)}%`,
                                }}
                              />
                            </div>
                            <Badge
                              tone={level.tone}
                              className="num w-16 justify-center"
                            >
                              {formatPercent(info.percentage)}
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableContainer>
          )}
        </Panel>

        <Panel
          title="Cleaning Options"
          description="Choose how to handle gaps, then preview the result."
          icon={<WandSparkles aria-hidden="true" />}
          className="xl:sticky xl:top-24"
        >
          <div className="space-y-5">
            <Field label="Fill Missing Numbers" labelId={numericId}>
              <Select
                aria-labelledby={numericId}
                value={options.fill_numeric ?? "none"}
                onChange={(value) =>
                  update({
                    fill_numeric:
                      value === "none" ? null : (value as NumericFill),
                  })
                }
                options={NUMERIC_OPTIONS}
              />
            </Field>
            <Field label="Fill Missing Text" labelId={textId}>
              <Select
                aria-labelledby={textId}
                value={options.fill_categorical ?? "none"}
                onChange={(value) =>
                  update({
                    fill_categorical:
                      value === "none" ? null : (value as CategoricalFill),
                  })
                }
                options={TEXT_OPTIONS}
              />
            </Field>
            <Field
              label="Remove Columns With"
              labelId={columnId}
              hint="Columns this empty rarely help a model."
            >
              <Select
                aria-labelledby={columnId}
                value={
                  options.drop_high_missing_cols === null
                    ? "none"
                    : String(options.drop_high_missing_cols)
                }
                onChange={(value) =>
                  update({
                    drop_high_missing_cols:
                      value === "none" ? null : Number(value),
                  })
                }
                options={COLUMN_THRESHOLDS}
              />
            </Field>
            <Field
              label="Remove Rows With"
              labelId={rowId}
              hint="Row removal happens before missing values are filled."
            >
              <Select
                aria-labelledby={rowId}
                value={
                  options.drop_high_missing_rows === null
                    ? "none"
                    : String(options.drop_high_missing_rows)
                }
                onChange={(value) =>
                  update({
                    drop_high_missing_rows:
                      value === "none" ? null : Number(value),
                  })
                }
                options={ROW_THRESHOLDS}
              />
            </Field>
            <div className="space-y-4 border-t border-border pt-5">
              <SwitchField
                label="Remove Duplicate Rows"
                description={
                  overview.duplicate_rows > 0
                    ? `${countLabel(overview.duplicate_rows, "exact duplicate")} found in the current data.`
                    : "No exact duplicates in the current data."
                }
                checked={options.drop_duplicates}
                onChange={(checked) => update({ drop_duplicates: checked })}
              />
              <SwitchField
                label="Treat Blank Text as Missing"
                description="Counts values like “”, “N/A”, and “null” as missing."
                checked={options.normalize_empty_strings}
                onChange={(checked) =>
                  update({ normalize_empty_strings: checked })
                }
              />
            </div>

            {previewIsCurrent && preview ? (
              <div
                className="rounded-xl border border-brand-line bg-brand-soft p-4"
                aria-live="polite"
              >
                <p className="mb-3 text-sm font-semibold text-fg">
                  Preview of Changes
                </p>
                <ImpactSummary impact={preview.impact} />
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row xl:flex-col 2xl:flex-row">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => void runPreview()}
                loading={previewing && !confirmOpen}
                loadingText="Previewing…"
                disabled={previewIsCurrent}
              >
                <Eye aria-hidden="true" />
                {previewIsCurrent ? "Preview Up to Date" : "Preview Changes"}
              </Button>
              <Button
                className="flex-1"
                onClick={() => void openConfirm()}
                disabled={previewing}
              >
                Apply Cleaning
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Panel>
      </div>

      <NextStep
        href="/app/train"
        title="Train Models"
        description="Pick a target column and train recommended models on your prepared data."
        icon={<BrainCircuit aria-hidden="true" />}
      />

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={apply}
        busy={applying}
        busyLabel="Applying…"
        tone="primary"
        title="Apply These Cleaning Steps?"
        description="Your working data will be replaced with a cleaned copy made from your original upload. You can revert to the original at any time."
        confirmLabel="Apply Cleaning"
      >
        {preview ? <ImpactSummary impact={preview.impact} /> : null}
        {overview.trained_models > 0 ? (
          <Callout
            tone="warning"
            title="Existing results won't update automatically"
          >
            {overview.trained_models} trained{" "}
            {overview.trained_models === 1
              ? "model keeps its"
              : "models keep their"}{" "}
            current results. Train again to use the cleaned data.
          </Callout>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={revertOpen}
        onCancel={() => setRevertOpen(false)}
        onConfirm={revert}
        busy={reverting}
        busyLabel="Reverting…"
        tone="warning"
        title="Revert to Your Original Data?"
        description="The cleaned copy will be discarded and your original upload will be used again. Trained model results are kept."
        confirmLabel="Revert to Original"
      />
    </div>
  );
}
