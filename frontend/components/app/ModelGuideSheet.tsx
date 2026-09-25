"use client";

import {
  BookOpen,
  CircleCheck,
  Cog,
  Compass,
  Sigma,
  TriangleAlert,
  Workflow,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Sheet } from "@/components/ui/Dialog";
import { getModelGuide } from "@/lib/model-guide";

export interface GuideModel {
  key: string;
  name: string;
  category: string;
  description?: string;
}

function MathText({ expression }: { expression: string }) {
  const parts: ReactNode[] = [];
  const pattern = /([\^_])\{([^}]*)\}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(expression)) !== null) {
    if (match.index > last) parts.push(expression.slice(last, match.index));
    const Tag = match[1] === "^" ? "sup" : "sub";
    parts.push(
      <Tag key={match.index} className="text-[0.72em]">
        {match[2]}
      </Tag>,
    );
    last = match.index + match[0].length;
  }
  if (last < expression.length) parts.push(expression.slice(last));
  return <>{parts}</>;
}

function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide text-fg [&_svg]:size-4 [&_svg]:text-brand">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

export function ModelGuideSheet({
  model,
  onClose,
  footer,
}: {
  model: GuideModel | null;
  onClose: () => void;
  footer?: ReactNode;
}) {
  const guide = model ? getModelGuide(model.key) : null;
  return (
    <Sheet
      open={model !== null}
      onClose={onClose}
      bodyClassName="px-5 py-6 sm:px-6"
      title={model?.name ?? "Model details"}
      description={
        model ? (
          <span className="flex flex-wrap gap-1.5 pt-1">
            <Badge tone="brand">{guide?.kind ?? model.category}</Badge>
            <Badge tone="neutral">{model.category}</Badge>
          </span>
        ) : null
      }
    >
      {model && guide ? (
        <div className="space-y-7">
          <div className="relative overflow-hidden rounded-2xl border border-orange-500/25 bg-linear-to-br from-orange-500/[0.12] via-surface to-surface p-5">
            <p className="text-sm leading-relaxed text-fg">{guide.summary}</p>
          </div>

          <Section icon={<Compass aria-hidden="true" />} title="Purpose">
            <p className="text-sm leading-relaxed text-fg-muted">
              {guide.purpose}
            </p>
          </Section>

          <Section icon={<Workflow aria-hidden="true" />} title="How It Works">
            <ol className="space-y-2.5">
              {guide.steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-fg-muted">
                  <span className="num inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section
            icon={<Sigma aria-hidden="true" />}
            title="The Math Behind It"
          >
            <ul className="space-y-3">
              {guide.formulas.map((formula) => (
                <li
                  key={formula.label}
                  className="rounded-xl border border-border bg-bg-alt p-4"
                >
                  <p className="text-xs font-semibold tracking-wide text-fg-subtle uppercase">
                    {formula.label}
                  </p>
                  <p className="mt-2 overflow-x-auto text-[1.05rem] leading-relaxed font-semibold tracking-wide whitespace-pre-wrap text-brand">
                    <MathText expression={formula.expression} />
                  </p>
                  {formula.note ? (
                    <p className="mt-2 text-xs leading-relaxed text-fg-muted">
                      {formula.note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </Section>

          <div className="grid gap-4 sm:grid-cols-2">
            <Section
              icon={<CircleCheck aria-hidden="true" />}
              title="Strengths"
            >
              <ul className="space-y-2">
                {guide.strengths.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-sm leading-relaxed text-fg-muted"
                  >
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-success"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
            <Section
              icon={<TriangleAlert aria-hidden="true" />}
              title="Watch Out For"
            >
              <ul className="space-y-2">
                {guide.limitations.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-sm leading-relaxed text-fg-muted"
                  >
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-warning"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {guide.settings ? (
            <Section
              icon={<Cog aria-hidden="true" />}
              title="Settings Used Here"
            >
              <p className="text-sm leading-relaxed text-fg-muted">
                {guide.settings}
              </p>
            </Section>
          ) : null}

          {footer}
        </div>
      ) : model ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-fg">
            <BookOpen className="size-4 text-brand" aria-hidden="true" />
            About This Model
          </p>
          <p className="text-sm text-fg-muted">{model.description}</p>
        </div>
      ) : null}
    </Sheet>
  );
}
