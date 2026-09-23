"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import {
  BrainCircuit,
  Check,
  ChartColumn,
  CircleCheck,
  Layers,
  Lightbulb,
  Play,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Checkbox, Slider, Switch } from "@/components/ui/Controls";
import {
  Callout,
  EmptyState,
  ErrorState,
  LoadingBlock,
  Spinner,
} from "@/components/ui/Feedback";
import { Field, PageHeader } from "@/components/ui/Layout";
import { Select } from "@/components/ui/Select";
import { api } from "@/lib/api/endpoints";
import type { ModelInfo, ScalerType, TaskType } from "@/lib/api/types";
import { TASK_LABELS } from "@/lib/metrics";
import { usePreferences } from "@/lib/preferences";
import { useReadySession } from "@/lib/session";
import { useTraining } from "@/lib/training";
import { useResource } from "@/lib/use-resource";
import { cn, formatInteger, pluralize, countLabel } from "@/lib/utils";

const TASKS: {
  value: TaskType;
  title: string;
  description: string;
  example: string;
  icon: ReactNode;
}[] = [
  {
    value: "classification",
    title: "Classification",
    description: "Predict which category a row belongs to.",
    example: "Churn or not, spam or not, flower species",
    icon: <Layers aria-hidden="true" />,
  },
  {
    value: "regression",
    title: "Regression",
    description: "Predict a number on a continuous scale.",
    example: "House price, demand, a test score",
    icon: <ChartColumn aria-hidden="true" />,
  },
  {
    value: "clustering",
    title: "Clustering",
    description: "Find natural groups without a target column.",
    example: "Customer segments, similar products",
    icon: <Sparkles aria-hidden="true" />,
  },
];

const SCALERS: { value: ScalerType; label: string; description: string }[] = [
  {
    value: "standard",
    label: "Standard (Recommended)",
    description: "Centers each column at 0 with unit variance.",
  },
  {
    value: "minmax",
    label: "Min-Max",
    description: "Rescales each column to the range 0 to 1.",
  },
  {
    value: "robust",
    label: "Robust",
    description: "Uses the median and IQR, so outliers matter less.",
  },
  {
    value: "none",
    label: "None",
    description: "Use raw values. Fine for tree-based models.",
  },
];

function StepHeader({
  step,
  title,
  description,
  done,
}: {
  step: number;
  title: string;
  description: string;
  done: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <span
        className={cn(
          "num inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-base font-bold transition-colors",
          done
            ? "bg-success text-white dark:text-black"
            : "bg-primary text-on-primary",
        )}
        aria-hidden="true"
      >
        {done ? <Check className="size-5" /> : step}
      </span>
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-tight text-fg">
          <span className="sr-only">
            Step {step}
            {done ? ", complete" : ""}:{" "}
          </span>
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-fg-muted">{description}</p>
      </div>
    </div>
  );
}

function StepCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "space-y-6 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-7",
        className,
      )}
    >
      {children}
    </section>
  );
}

function ModelCard({
  model,
  selected,
  recommended,
  trained,
  onToggle,
}: {
  model: ModelInfo;
  selected: boolean;
  recommended: boolean;
  trained: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "group relative flex h-full w-full flex-col rounded-xl border p-4 text-left transition-[border-color,background-color,box-shadow] duration-150",
        selected
          ? "border-primary bg-brand-soft ring-1 ring-brand-line"
          : "border-border bg-surface hover:border-border-strong hover:bg-bg-alt",
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="text-sm leading-snug font-bold text-fg">
          {model.name}
        </span>
        <span
          className={cn(
            "inline-flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
            selected
              ? "border-primary bg-primary text-white"
              : "border-border-strong bg-surface",
          )}
          aria-hidden="true"
        >
          {selected ? <Check className="size-3.5" /> : null}
        </span>
      </span>
      <span className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-fg-muted">
        {model.description}
      </span>
      <span className="mt-auto flex flex-wrap gap-1.5 pt-3">
        <Badge tone="neutral">{model.category}</Badge>
        {recommended ? (
          <Badge tone="warning">
            <Star aria-hidden="true" />
            Recommended
          </Badge>
        ) : null}
        {trained ? (
          <Badge tone="success">
            <CircleCheck aria-hidden="true" />
            Trained
          </Badge>
        ) : null}
      </span>
    </button>
  );
}

export function TrainView() {
  const { sessionId, overview, versions } = useReadySession();
  const prefs = usePreferences();
  const training = useTraining();
  const targetLabelId = useId();
  const scalerLabelId = useId();
  const categoryLabelId = useId();
  const testSizeId = useId();
  const searchId = useId();

  const [task, setTaskState] = useState<TaskType>(prefs.defaultTask);
  const [target, setTargetState] = useState<string | null>(null);
  const [testSize, setTestSize] = useState(prefs.defaultTestSize);
  const [scaler, setScaler] = useState<ScalerType>(prefs.defaultScaler);
  const [excludedOverride, setExcludedOverride] = useState<Set<string> | null>(
    null,
  );
  const [selectedOverride, setSelectedOverride] = useState<Set<string> | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const supervised = task !== "clustering";

  const catalog = useResource("catalog", (signal) => api.catalog(signal));
  const suggestions = useResource(
    supervised ? `suggest:${sessionId}:${versions.data}:${task}` : null,
    (signal) => api.suggestTarget(sessionId, task, signal),
    { sessionId },
  );
  const recommend = useResource(
    `recommend:${sessionId}:${versions.data}:${task}:${supervised ? (target ?? "") : ""}`,
    (signal) =>
      api.recommend(sessionId, task, supervised ? target : null, signal),
    { sessionId, keepPrevious: true },
  );
  const results = useResource(
    `results:${sessionId}:${versions.models}`,
    (signal) => api.results(sessionId, signal),
    {
      sessionId,
      keepPrevious: true,
    },
  );

  const setTask = (value: TaskType) => {
    setTaskState(value);
    setTargetState(null);
    setSelectedOverride(null);
    setExcludedOverride(null);
    setCategory("all");
  };

  const setTarget = (value: string) => {
    setTargetState(value);
    setExcludedOverride(null);
  };

  const recommendData =
    recommend.data && recommend.data.task === task ? recommend.data : undefined;
  const recommendedKeys = useMemo(
    () =>
      new Set(recommendData?.recommendations.map((model) => model.key) ?? []),
    [recommendData],
  );
  const models = useMemo(
    () => catalog.data?.[task] ?? [],
    [catalog.data, task],
  );
  const selected = selectedOverride ?? recommendedKeys;
  const trainedKeys = new Set(Object.keys(results.data?.trained_models ?? {}));

  const featureColumns = overview.column_names.filter(
    (column) => !supervised || column !== target,
  );
  const excluded =
    excludedOverride ??
    new Set(
      (recommendData?.id_like_columns ?? []).filter((column) =>
        featureColumns.includes(column),
      ),
    );
  const includedFeatures = featureColumns.filter(
    (column) => !excluded.has(column),
  );

  const categories = useMemo(
    () => Array.from(new Set(models.map((model) => model.category))).sort(),
    [models],
  );
  const term = search.trim().toLowerCase();
  const visible = models
    .filter(
      (model) =>
        (!term ||
          model.name.toLowerCase().includes(term) ||
          model.description.toLowerCase().includes(term)) &&
        (category === "all" || model.category === category) &&
        (!recommendedOnly || recommendedKeys.has(model.key)),
    )
    .sort(
      (a, b) =>
        Number(recommendedKeys.has(b.key)) - Number(recommendedKeys.has(a.key)),
    );

  const selectedModels = models.filter((model) => selected.has(model.key));
  const replaceCount = selectedModels.filter((model) =>
    trainedKeys.has(model.key),
  ).length;
  const testRows = Math.round(overview.rows * testSize);

  const blocker =
    supervised && !target
      ? "Choose a target column to continue."
      : includedFeatures.length === 0
        ? "Keep at least one feature column to train on."
        : selectedModels.length === 0
          ? "Select at least one model to train."
          : null;

  const toggleModel = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedOverride(next);
  };

  const toggleFeature = (column: string) => {
    const next = new Set(excluded);
    if (next.has(column)) next.delete(column);
    else next.add(column);
    setExcludedOverride(next);
  };

  const launch = () => {
    setConfirmReplace(false);
    training.start({
      sessionId,
      task,
      target: supervised ? target : null,
      featureCols: excluded.size > 0 ? includedFeatures : null,
      testSize,
      scaler,
      models: selectedModels.map((model) => ({
        key: model.key,
        name: model.name,
      })),
    });
  };

  const onTrain = () => {
    if (blocker || training.isRunning) return;
    if (replaceCount > 0) setConfirmReplace(true);
    else launch();
  };

  const maxScore = Math.max(
    ...(suggestions.data?.suggestions.map((item) => item.score) ?? [1]),
    1,
  );
  const mismatch =
    supervised &&
    target &&
    recommendData &&
    recommendData.inferred_task !== task &&
    recommendData.inferred_task !== "clustering"
      ? recommendData.inferred_task
      : null;

  const columnOptions = overview.column_names.map((column) => ({
    value: column,
    label: column,
    meta: overview.numeric_columns.includes(column)
      ? "number"
      : overview.datetime_columns.includes(column)
        ? "date"
        : "text",
  }));

  return (
    <div className="space-y-8 lg:space-y-10">
      <PageHeader
        eyebrow="Step 4 · Model"
        title="Train Models"
        description="Choose what you want to predict, pick the models to try, and train them all in one run."
      />

      <StepCard>
        <StepHeader
          step={1}
          title="Choose a Task"
          description="What kind of question do you want your data to answer?"
          done
        />
        <div
          role="radiogroup"
          aria-label="Machine learning task"
          className="grid gap-3 md:grid-cols-3"
        >
          {TASKS.map((option) => {
            const active = option.value === task;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTask(option.value)}
                className={cn(
                  "flex h-full items-start gap-4 rounded-2xl border p-5 text-left transition-[border-color,background-color,box-shadow]",
                  active
                    ? "border-primary bg-brand-soft ring-1 ring-brand-line"
                    : "border-border bg-surface hover:border-border-strong hover:bg-bg-alt",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-11 shrink-0 items-center justify-center rounded-xl border [&_svg]:size-5",
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface-2 text-fg-muted",
                  )}
                >
                  {option.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-bold text-fg">
                    {option.title}
                  </span>
                  <span className="mt-1 block text-sm text-fg-muted">
                    {option.description}
                  </span>
                  <span className="mt-2 block text-xs text-fg-subtle">
                    e.g. {option.example}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </StepCard>

      {supervised ? (
        <StepCard>
          <StepHeader
            step={2}
            title="Choose a Target Column"
            description="The column your models will learn to predict. Every other column becomes an input."
            done={Boolean(target)}
          />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg">
                <Lightbulb className="size-4 text-warning" aria-hidden="true" />
                Suggested Targets
              </p>
              {suggestions.status === "error" ? (
                <p className="text-sm text-fg-muted">
                  Suggestions aren&apos;t available right now. Choose a column
                  from the list instead.
                </p>
              ) : !suggestions.data ? (
                <Spinner label="Analyzing your columns…" />
              ) : suggestions.data.suggestions.length === 0 ? (
                <p className="text-sm text-fg-muted">
                  No column stands out as a typical {task} target. Choose one
                  from the list.
                </p>
              ) : (
                <div
                  role="radiogroup"
                  aria-label="Suggested target columns"
                  className="grid gap-3 md:grid-cols-2"
                >
                  {suggestions.data.suggestions.map((item, index) => {
                    const active = item.column === target;
                    const strength = item.score / maxScore;
                    return (
                      <button
                        key={item.column}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setTarget(item.column)}
                        className={cn(
                          "rounded-xl border p-4 text-left transition-[border-color,background-color]",
                          active
                            ? "border-primary bg-brand-soft ring-1 ring-brand-line"
                            : "border-border bg-surface hover:border-border-strong",
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-bold text-fg">
                            {item.column}
                          </span>
                          {index === 0 ? (
                            <Badge tone="warning">
                              <Star aria-hidden="true" />
                              Best Match
                            </Badge>
                          ) : null}
                        </span>
                        <span className="mt-3 flex items-center gap-2">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                            <span
                              className={cn(
                                "block h-full rounded-full",
                                strength > 0.66
                                  ? "bg-emerald-500"
                                  : strength > 0.33
                                    ? "bg-amber-500"
                                    : "bg-sky-500",
                              )}
                              style={{
                                width: `${Math.max(strength * 100, 8)}%`,
                              }}
                            />
                          </span>
                          <span className="text-xs font-medium text-fg-muted">
                            {strength > 0.66
                              ? "Strong match"
                              : strength > 0.33
                                ? "Likely match"
                                : "Possible"}
                          </span>
                        </span>
                        <span className="mt-2 block text-xs leading-relaxed text-fg-muted">
                          {item.reasons.slice(0, 2).join(" · ")}
                        </span>
                        <span className="mt-3 flex flex-wrap gap-1.5">
                          <Badge tone="neutral" className="font-mono">
                            {item.dtype}
                          </Badge>
                          <Badge tone="neutral" className="num">
                            {formatInteger(item.n_unique)} unique
                          </Badge>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="h-fit rounded-xl border border-border bg-bg-alt p-4">
              <Field
                label="Or Choose Any Column"
                labelId={targetLabelId}
                hint={`${countLabel(overview.columns, "column")} available.`}
              >
                <Select
                  aria-labelledby={targetLabelId}
                  value={target}
                  onChange={setTarget}
                  options={columnOptions}
                  searchable
                  searchPlaceholder="Search columns…"
                  placeholder="Select a target column"
                />
              </Field>
              {target ? (
                <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-success">
                  <Target className="size-4" aria-hidden="true" />
                  Predicting “{target}”
                </p>
              ) : null}
            </div>
          </div>
          {mismatch ? (
            <Callout
              tone="warning"
              title={`“${target}” looks like a ${TASK_LABELS[mismatch].toLowerCase()} target`}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const keep = target;
                    setTask(mismatch);
                    if (keep) setTargetState(keep);
                  }}
                >
                  Switch to {TASK_LABELS[mismatch]}
                </Button>
              }
            >
              {mismatch === "classification"
                ? "It has few distinct values or contains text, which usually means categories rather than a continuous number."
                : "It contains many distinct numeric values, which usually means a continuous number rather than categories."}
            </Callout>
          ) : null}
        </StepCard>
      ) : null}

      <StepCard>
        <StepHeader
          step={supervised ? 3 : 2}
          title="Adjust Training Settings"
          description="Sensible defaults are already selected. Change them only if you need to."
          done={!supervised || Boolean(target)}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          {supervised ? (
            <Field
              label="Test Split"
              htmlFor={testSizeId}
              hint="Rows held out to measure how well each model performs on data it hasn't seen."
            >
              <div className="rounded-xl border border-border bg-bg-alt p-4">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <span className="num text-2xl font-bold text-fg">
                    {Math.round(testSize * 100)}%
                  </span>
                  <span className="num text-sm text-fg-muted">
                    {formatInteger(overview.rows - testRows)} train ·{" "}
                    {formatInteger(testRows)} test rows
                  </span>
                </div>
                <Slider
                  id={testSizeId}
                  min={0.1}
                  max={0.4}
                  step={0.05}
                  value={testSize}
                  onChange={setTestSize}
                  valueText={`${Math.round(testSize * 100)} percent of rows held out for testing`}
                />
                <div className="mt-2 flex justify-between text-xs text-fg-subtle">
                  <span>10% · more training data</span>
                  <span>40% · more reliable scores</span>
                </div>
              </div>
            </Field>
          ) : null}
          <Field
            label="Feature Scaling"
            labelId={scalerLabelId}
            hint="Scaling helps distance-based models like SVM, KNN, and neural networks."
          >
            <Select
              aria-labelledby={scalerLabelId}
              value={scaler}
              onChange={setScaler}
              options={SCALERS}
            />
          </Field>
        </div>

        <div className="rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setShowFeatures((open) => !open)}
            aria-expanded={showFeatures}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
          >
            <span className="flex items-center gap-3">
              <SlidersHorizontal
                className="size-4.5 text-fg-muted"
                aria-hidden="true"
              />
              <span>
                <span className="block text-sm font-semibold text-fg">
                  Feature Columns
                </span>
                <span className="block text-xs text-fg-muted">
                  Using {includedFeatures.length} of {featureColumns.length}{" "}
                  columns
                  {excluded.size > 0 ? ` · ${excluded.size} excluded` : ""}
                </span>
              </span>
            </span>
            <span className="text-sm font-semibold text-brand">
              {showFeatures ? "Hide" : "Customize"}
            </span>
          </button>
          {showFeatures ? (
            <div className="space-y-4 border-t border-border p-4">
              {recommendData &&
              recommendData.id_like_columns.length > 0 &&
              excludedOverride === null ? (
                <p className="text-sm text-fg-muted">
                  We excluded{" "}
                  {pluralize(
                    recommendData.id_like_columns.filter((c) =>
                      featureColumns.includes(c),
                    ).length,
                    "column",
                  )}{" "}
                  that looks like an ID. IDs rarely help a model and can make
                  scores look better than they are.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setExcludedOverride(new Set())}
                >
                  Include All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExcludedOverride(null)}
                >
                  Reset to Suggested
                </Button>
              </div>
              <div className="grid max-h-72 gap-x-6 gap-y-3 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
                {featureColumns.map((column) => (
                  <Checkbox
                    key={column}
                    checked={!excluded.has(column)}
                    onChange={() => toggleFeature(column)}
                    label={
                      <span className="block truncate" title={column}>
                        {column}
                      </span>
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </StepCard>

      <StepCard>
        <StepHeader
          step={supervised ? 4 : 3}
          title="Select Models"
          description={
            recommendData
              ? `${countLabel(recommendData.recommendations.length, "model is", "models are")} recommended for a ${TASK_LABELS[task].toLowerCase()} dataset with ${countLabel(overview.rows, "row")}.`
              : "Pick the models you want to compare."
          }
          done={selectedModels.length > 0}
        />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <label htmlFor={searchId} className="sr-only">
              Search models
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
              aria-hidden="true"
            />
            <input
              id={searchId}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search models by name or description"
              className="h-11 w-full rounded-xl border border-border bg-surface pr-10 pl-10 text-sm text-fg shadow-card outline-none placeholder:text-fg-subtle focus-visible:outline-2 [&::-webkit-search-cancel-button]:hidden"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-fg-subtle hover:text-fg"
                aria-label="Clear search"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span id={categoryLabelId} className="sr-only">
              Model family
            </span>
            <Select
              aria-labelledby={categoryLabelId}
              value={category}
              onChange={setCategory}
              options={[
                { value: "all", label: "All Model Families" },
                ...categories.map((item) => ({ value: item, label: item })),
              ]}
              className="w-56"
            />
            <label className="flex items-center gap-2.5 text-sm font-medium text-fg">
              <Switch
                checked={recommendedOnly}
                onChange={setRecommendedOnly}
                aria-label="Show recommended models only"
              />
              Recommended Only
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-fg-muted" aria-live="polite">
            <span className="font-semibold text-fg">
              {selectedModels.length}
            </span>{" "}
            of {models.length} selected
            {visible.length !== models.length
              ? ` · ${visible.length} shown`
              : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="brand-soft"
              size="sm"
              onClick={() => setSelectedOverride(null)}
              disabled={recommendedKeys.size === 0}
            >
              <Star aria-hidden="true" />
              Select Recommended
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setSelectedOverride(
                  new Set([...selected, ...visible.map((model) => model.key)]),
                )
              }
              disabled={visible.length === 0}
            >
              Select All Shown
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedOverride(new Set())}
              disabled={selected.size === 0}
            >
              Clear
            </Button>
          </div>
        </div>

        {catalog.status === "error" ? (
          <ErrorState
            title="We Couldn't Load the Model List"
            message={catalog.error?.message ?? ""}
            onRetry={catalog.reload}
          />
        ) : !catalog.data ? (
          <LoadingBlock label="Loading models…" rows={3} />
        ) : visible.length === 0 ? (
          <EmptyState
            compact
            icon={<Search aria-hidden="true" />}
            title="No Models Match Your Filters"
            description="Try a different search term or model family, or turn off Recommended Only."
            actions={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setRecommendedOnly(false);
                }}
              >
                Reset Filters
              </Button>
            }
          />
        ) : (
          <div className="max-h-168 overflow-y-auto rounded-2xl border border-border bg-bg-alt p-3 sm:p-4">
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
              {visible.map((model) => (
                <li key={model.key}>
                  <ModelCard
                    model={model}
                    selected={selected.has(model.key)}
                    recommended={recommendedKeys.has(model.key)}
                    trained={trainedKeys.has(model.key)}
                    onToggle={() => toggleModel(model.key)}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-fg">
              {selectedModels.length > 0
                ? `${pluralize(selectedModels.length, "model")} · ${TASK_LABELS[task]}${supervised && target ? ` · predicting “${target}”` : ""}`
                : "No models selected yet"}
            </p>
            <p
              className={cn(
                "text-sm",
                blocker ? "text-warning" : "text-fg-muted",
              )}
            >
              {blocker ??
                "Models train one at a time. You can stop after any model."}
            </p>
          </div>
          <Button
            size="lg"
            onClick={onTrain}
            disabled={Boolean(blocker) || training.isRunning}
            className="w-full sm:w-auto"
          >
            {training.isRunning ? (
              <BrainCircuit aria-hidden="true" />
            ) : (
              <Play aria-hidden="true" />
            )}
            {training.isRunning
              ? "Training in Progress"
              : `Train ${selectedModels.length || ""} ${selectedModels.length === 1 ? "Model" : "Models"}`.replace(
                  "  ",
                  " ",
                )}
          </Button>
        </div>
      </StepCard>

      <ConfirmDialog
        open={confirmReplace}
        onCancel={() => setConfirmReplace(false)}
        onConfirm={launch}
        tone="warning"
        title={`Replace ${pluralize(replaceCount, "Existing Result")}?`}
        description={`${pluralize(replaceCount, "selected model")} already ${replaceCount === 1 ? "has" : "have"} results in this session. Training again will overwrite ${replaceCount === 1 ? "it" : "them"} with new results.`}
        confirmLabel="Replace and Train"
      >
        <ul className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-border bg-bg-alt p-3 text-sm">
          {selectedModels
            .filter((model) => trainedKeys.has(model.key))
            .map((model) => (
              <li key={model.key} className="flex items-center gap-2 text-fg">
                <CircleCheck
                  className="size-4 shrink-0 text-success"
                  aria-hidden="true"
                />
                {model.name}
              </li>
            ))}
        </ul>
      </ConfirmDialog>
    </div>
  );
}
