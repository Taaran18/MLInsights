"use client";

import { Crosshair, MousePointerClick, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Feedback";
import { api } from "@/lib/api/endpoints";
import type { TaskType } from "@/lib/api/types";
import { useResource } from "@/lib/use-resource";
import { formatCompact, formatDecimal, formatInteger } from "@/lib/utils";

export function TargetPreview({
  sessionId,
  dataVersion,
  target,
  task,
}: {
  sessionId: string;
  dataVersion: number;
  target: string | null;
  task: TaskType;
}) {
  const profile = useResource(
    `profile:${sessionId}:${dataVersion}`,
    (signal) => api.profile(sessionId, signal),
    { sessionId },
  );

  if (!target) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border-strong px-5 py-8 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <MousePointerClick className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm font-bold text-fg">No Target Chosen Yet</p>
        <p className="mt-1 text-sm text-fg-muted">
          Pick a suggestion or search every column above. A preview of its
          values will appear here.
        </p>
      </div>
    );
  }

  const column = profile.data?.profiles.find((item) => item.name === target);
  const rows = profile.data?.rows ?? 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-linear-to-br from-orange-500/[0.14] via-surface to-surface p-5">
      <span
        className="pointer-events-none absolute -top-14 -right-14 size-40 rounded-full bg-orange-500/20 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-3">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 via-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30">
          <Crosshair className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.14em] text-fg-subtle uppercase">
            Predicting
          </p>
          <p
            className="truncate font-mono text-lg font-bold text-fg"
            title={target}
          >
            {target}
          </p>
        </div>
      </div>

      {!column ? (
        <div className="relative mt-5">
          {profile.status === "error" ? (
            <p className="text-sm text-fg-muted">
              A preview of this column isn&apos;t available right now.
            </p>
          ) : (
            <Spinner label="Reading the column…" />
          )}
        </div>
      ) : (
        <div className="relative mt-5 space-y-4">
          <dl className="num grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-surface-2 px-2 py-2">
              <dt className="text-[11px] text-fg-subtle">Type</dt>
              <dd className="text-sm font-bold text-fg capitalize">
                {column.kind}
              </dd>
            </div>
            <div className="rounded-xl bg-surface-2 px-2 py-2">
              <dt className="text-[11px] text-fg-subtle">
                {task === "classification" ? "Classes" : "Unique"}
              </dt>
              <dd className="text-sm font-bold text-fg">
                {formatCompact(column.unique)}
              </dd>
            </div>
            <div className="rounded-xl bg-surface-2 px-2 py-2">
              <dt className="text-[11px] text-fg-subtle">Missing</dt>
              <dd className="text-sm font-bold text-fg">
                {formatInteger(column.missing)}
              </dd>
            </div>
          </dl>

          {column.histogram ? (
            <div>
              <p className="mb-2 text-xs font-semibold text-fg-muted">
                Value Distribution
              </p>
              <div className="flex h-20 items-end gap-0.5" aria-hidden="true">
                {column.histogram.map((count, index) => {
                  const peak = Math.max(...(column.histogram ?? [1]), 1);
                  return (
                    <span
                      key={index}
                      className="flex-1 rounded-t-[3px] bg-linear-to-t from-orange-500/70 to-amber-400"
                      style={{
                        height: `${Math.max((count / peak) * 100, count ? 6 : 2)}%`,
                      }}
                    />
                  );
                })}
              </div>
              <div className="num mt-1.5 flex justify-between text-[11px] text-fg-subtle">
                <span>{formatCompact(column.min ?? 0)}</span>
                <span>Mean {formatCompact(column.mean ?? 0)}</span>
                <span>{formatCompact(column.max ?? 0)}</span>
              </div>
            </div>
          ) : column.top_values?.length ? (
            <div>
              <p className="mb-2 text-xs font-semibold text-fg-muted">
                Class Balance
              </p>
              <ul className="space-y-2">
                {column.top_values.map((item) => {
                  const share = rows ? (item.count / rows) * 100 : 0;
                  return (
                    <li key={item.value} className="text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="truncate font-medium text-fg">
                          {item.value}
                        </span>
                        <span className="num shrink-0 text-fg-subtle">
                          {formatInteger(item.count)} ·{" "}
                          {formatDecimal(share, 1)}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-amber-400 to-orange-500"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              {column.unique > column.top_values.length ? (
                <p className="mt-2 text-[11px] text-fg-subtle">
                  Showing the {column.top_values.length} most common of{" "}
                  {formatInteger(column.unique)} values.
                </p>
              ) : null}
            </div>
          ) : null}

          {column.missing > 0 ? (
            <Badge tone="warning" size="md">
              <TriangleAlert aria-hidden="true" />
              Rows missing this value are skipped
            </Badge>
          ) : null}
        </div>
      )}
    </div>
  );
}
