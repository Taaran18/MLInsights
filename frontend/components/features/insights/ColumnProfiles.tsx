"use client";

import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Hash,
  ScanSearch,
  ShieldCheck,
  ToggleLeft,
  Type,
} from "lucide-react";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState, LoadingBlock } from "@/components/ui/Feedback";
import { api } from "@/lib/api/endpoints";
import type { ColumnProfile, ProfileResponse } from "@/lib/api/types";
import { useResource } from "@/lib/use-resource";
import { cn, formatCompact, formatDecimal, formatInteger } from "@/lib/utils";

const INITIAL_VISIBLE = 9;

const KIND_META: Record<
  ColumnProfile["kind"],
  { label: string; tone: Tone; icon: typeof Hash }
> = {
  number: { label: "Number", tone: "info", icon: Hash },
  text: { label: "Text", tone: "brand", icon: Type },
  date: { label: "Date", tone: "success", icon: CalendarDays },
  boolean: { label: "True / False", tone: "warning", icon: ToggleLeft },
};

function qualityLabel(score: number): { label: string; tone: Tone } {
  if (score >= 95) return { label: "Excellent", tone: "success" };
  if (score >= 85) return { label: "Good", tone: "success" };
  if (score >= 70) return { label: "Needs Attention", tone: "warning" };
  return { label: "Poor", tone: "danger" };
}

function QualityRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(score, 0), 100) / 100);
  return (
    <div className="relative size-36 shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <defs>
          <linearGradient id="quality-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="55%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="url(#quality-gradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-3xl font-extrabold tracking-tight text-fg">
          {Math.round(score)}
        </span>
        <span className="text-xs font-medium text-fg-subtle">out of 100</span>
      </div>
    </div>
  );
}

function QualityCard({ data }: { data: ProfileResponse }) {
  const { quality } = data;
  const verdict = qualityLabel(quality.score);
  const parts = [
    {
      label: "Completeness",
      value: quality.completeness,
      hint: "Cells that have a value",
    },
    {
      label: "Uniqueness",
      value: quality.uniqueness,
      hint: "Rows that aren't exact duplicates",
    },
    {
      label: "Consistency",
      value: quality.consistency,
      hint:
        quality.constant_columns > 0
          ? `${formatInteger(quality.constant_columns)} column${quality.constant_columns === 1 ? "" : "s"} hold a single value`
          : "Every column has varying values",
    },
  ];
  return (
    <section
      aria-labelledby="quality-title"
      className="relative overflow-hidden rounded-3xl border border-orange-500/25 bg-linear-to-br from-orange-500/[0.12] via-surface to-surface p-6 shadow-card"
    >
      <span
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-orange-500/20 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-2">
        <ShieldCheck className="size-5 text-brand" aria-hidden="true" />
        <h3 id="quality-title" className="text-lg font-bold text-fg">
          Data Quality Score
        </h3>
      </div>
      <div className="relative mt-5 flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
        <QualityRing score={quality.score} />
        <div className="w-full min-w-0 space-y-3.5">
          <Badge tone={verdict.tone} size="md">
            {verdict.label}
          </Badge>
          {parts.map((part) => (
            <div key={part.label}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-semibold text-fg">{part.label}</span>
                <span className="num font-semibold text-fg-muted">
                  {formatDecimal(part.value, 1)}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full bg-linear-to-r from-amber-400 to-orange-500"
                  style={{ width: `${part.value}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-fg-subtle">{part.hint}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="relative mt-5 text-xs leading-relaxed text-fg-subtle">
        Weighted 50% completeness, 30% uniqueness, and 20% consistency.
      </p>
    </section>
  );
}

function Histogram({ profile }: { profile: ColumnProfile }) {
  const counts = profile.histogram ?? [];
  const peak = Math.max(...counts, 1);
  return (
    <div>
      <div
        className="flex h-16 items-end gap-0.5"
        role="img"
        aria-label={`Distribution of ${profile.name} from ${formatCompact(profile.min ?? 0)} to ${formatCompact(profile.max ?? 0)}`}
      >
        {counts.map((count, index) => (
          <span
            key={index}
            className="flex-1 rounded-t-[3px] bg-linear-to-t from-orange-500/70 to-amber-400"
            style={{
              height: `${Math.max((count / peak) * 100, count ? 6 : 2)}%`,
            }}
            title={`${formatInteger(count)} rows`}
          />
        ))}
      </div>
      <div className="num mt-1.5 flex justify-between text-[11px] text-fg-subtle">
        <span>{formatCompact(profile.min ?? 0)}</span>
        <span>{formatCompact(profile.max ?? 0)}</span>
      </div>
    </div>
  );
}

function TopValues({
  profile,
  rows,
}: {
  profile: ColumnProfile;
  rows: number;
}) {
  const values = profile.top_values ?? [];
  if (values.length === 0)
    return <p className="text-sm text-fg-subtle">No values to show.</p>;
  return (
    <ul className="space-y-1.5">
      {values.map((item) => {
        const share = rows ? (item.count / rows) * 100 : 0;
        return (
          <li key={item.value} className="text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium text-fg" title={item.value}>
                {item.value}
              </span>
              <span className="num shrink-0 text-fg-subtle">
                {formatDecimal(share, 1)}%
              </span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-linear-to-r from-sky-400 to-blue-500"
                style={{ width: `${share}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ProfileCard({
  profile,
  rows,
}: {
  profile: ColumnProfile;
  rows: number;
}) {
  const meta = KIND_META[profile.kind];
  const Icon = meta.icon;
  return (
    <li className="flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-card transition-[border-color,box-shadow] hover:border-brand-line hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <p
          className="min-w-0 truncate font-mono text-sm font-semibold text-fg"
          title={profile.name}
        >
          {profile.name}
        </p>
        <Badge tone={meta.tone}>
          <Icon aria-hidden="true" />
          {meta.label}
        </Badge>
      </div>
      <dl className="num mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-surface-2 px-2 py-1.5">
          <dt className="text-[11px] text-fg-subtle">Missing</dt>
          <dd
            className={cn(
              "text-sm font-bold",
              profile.missing > 0 ? "text-danger" : "text-fg",
            )}
          >
            {formatDecimal(profile.missing_percentage, 1)}%
          </dd>
        </div>
        <div className="rounded-lg bg-surface-2 px-2 py-1.5">
          <dt className="text-[11px] text-fg-subtle">Unique</dt>
          <dd className="text-sm font-bold text-fg">
            {formatCompact(profile.unique)}
          </dd>
        </div>
        <div className="rounded-lg bg-surface-2 px-2 py-1.5">
          <dt className="text-[11px] text-fg-subtle">
            {profile.kind === "number" ? "Mean" : "Top Share"}
          </dt>
          <dd className="truncate text-sm font-bold text-fg">
            {profile.kind === "number"
              ? formatCompact(profile.mean ?? 0)
              : profile.top_values?.[0] && rows
                ? `${formatDecimal((profile.top_values[0].count / rows) * 100, 0)}%`
                : "—"}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex-1">
        {profile.histogram ? (
          <Histogram profile={profile} />
        ) : (
          <TopValues profile={profile} rows={rows} />
        )}
      </div>
    </li>
  );
}

export function ColumnProfiles({
  sessionId,
  dataVersion,
}: {
  sessionId: string;
  dataVersion: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const resource = useResource(
    `profile:${sessionId}:${dataVersion}`,
    (signal) => api.profile(sessionId, signal),
    { sessionId },
  );

  if (resource.status === "error" && !resource.data) {
    return (
      <ErrorState
        title="We Couldn't Profile Your Columns"
        message={resource.error?.message ?? "Something went wrong."}
        onRetry={resource.reload}
      />
    );
  }
  if (!resource.data) return <LoadingBlock label="Profiling every column…" />;

  const data = resource.data;
  const visible = showAll
    ? data.profiles
    : data.profiles.slice(0, INITIAL_VISIBLE);
  const hidden = data.profiles.length - visible.length;

  return (
    <section aria-labelledby="profiles-title" className="space-y-6">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow justify-center">
          <ScanSearch className="size-4" aria-hidden="true" />
          Column by Column
        </p>
        <h2
          id="profiles-title"
          className="mt-2 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl"
        >
          Column Profiles
        </h2>
        <p className="mt-2 text-fg-muted">
          How complete each column is, how many distinct values it holds, and
          how its values are spread.
        </p>
      </div>
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-24">
          <QualityCard data={data} />
        </div>
        <div className="space-y-4">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {visible.map((profile) => (
              <ProfileCard
                key={profile.name}
                profile={profile}
                rows={data.rows}
              />
            ))}
          </ul>
          {hidden > 0 || showAll ? (
            <div className="flex justify-center">
              <Button variant="secondary" onClick={() => setShowAll(!showAll)}>
                <ChevronDown
                  className={cn(
                    "transition-transform",
                    showAll && "rotate-180",
                  )}
                  aria-hidden="true"
                />
                {showAll
                  ? "Show Fewer Columns"
                  : `Show All ${formatInteger(data.profiles.length)} Columns`}
              </Button>
            </div>
          ) : null}
          {data.truncated ? (
            <p className="text-center text-xs text-fg-subtle">
              Profiles cover the first {formatInteger(data.profiles.length)} of{" "}
              {formatInteger(data.columns)} columns.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
