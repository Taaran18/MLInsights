"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowUpRight,
  CircleCheck,
  CircleUser,
  FileSpreadsheet,
  FolderClock,
  Info,
  Palette,
  RefreshCw,
  Server,
  ShieldAlert,
  SlidersHorizontal,
  Trash,
  Wifi,
  WifiOff,
} from "lucide-react";
import { ThemeSegmented } from "@/components/theme/ThemeControls";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SwitchField } from "@/components/ui/Controls";
import { EmptyState, Spinner } from "@/components/ui/Feedback";
import { Field, PageHeader, TableContainer } from "@/components/ui/Layout";
import { Select } from "@/components/ui/Select";
import { getErrorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/endpoints";
import type {
  HealthResponse,
  ScalerType,
  SessionSummary,
  TaskType,
} from "@/lib/api/types";
import {
  DEFAULT_PREFERENCES,
  clearPreferences,
  resetWorkspaceDefaults,
  setPreferences,
  usePreferences,
} from "@/lib/preferences";
import {
  forgetAllSessions,
  forgetSessions,
  setCurrentSession,
  useCurrentSession,
  useSessionHistory,
  type SessionRecord,
} from "@/lib/session-store";
import { API_URL, APP_VERSION, REPO_URL, SESSION_TTL_HOURS } from "@/lib/site";
import { invalidateResources, useResource } from "@/lib/use-resource";
import { useScrollSpy } from "@/lib/use-scroll-spy";
import {
  cn,
  formatCompact,
  formatDateTime,
  formatRelativeTime,
  pluralize,
} from "@/lib/utils";

const SECTIONS = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "defaults", label: "Workspace Defaults", icon: SlidersHorizontal },
  { id: "sessions", label: "Sessions", icon: FolderClock },
  { id: "privacy", label: "Privacy and Data", icon: ShieldAlert },
  { id: "connection", label: "Connection", icon: Server },
  { id: "about", label: "About", icon: Info },
];

function saved(message: string) {
  toast.success(message, { id: "settings-saved" });
}

function SectionNav() {
  const active = useScrollSpy(
    SECTIONS.map((section) => section.id),
    { offset: 140, fallbackToFirst: true },
  );

  return (
    <nav
      aria-label="Settings sections"
      className="min-w-0 lg:sticky lg:top-24 lg:self-start"
    >
      <ul className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <li key={id} className="shrink-0">
            <a
              href={`#${id}`}
              aria-current={active === id ? "location" : undefined}
              className={cn(
                "flex h-10 items-center gap-2.5 rounded-xl px-3.5 text-sm font-semibold whitespace-nowrap transition-colors",
                active === id
                  ? "bg-brand-soft text-brand"
                  : "text-fg-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function AppearanceSection() {
  const prefs = usePreferences();
  return (
    <Panel
      id="appearance"

      title="Appearance"
      description="Choose how MLInsights looks on this device."
      icon={<Palette aria-hidden="true" />}
    >
      <div className="space-y-0 divide-y divide-border">
        <div className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-fg">Theme</p>
            <p className="mt-0.5 text-sm text-fg-muted">
              Light uses a white background, Dark uses black.
            </p>
          </div>
          <ThemeSegmented />
        </div>
        <div className="py-5">
          <SwitchField
            label="Keep Sidebar Expanded"
            description="On larger screens, show navigation labels at all times. When off, the sidebar expands while you hover over it."
            checked={prefs.sidebarPinned}
            onChange={(checked) => {
              setPreferences({ sidebarPinned: checked });
              saved(
                checked
                  ? "The sidebar will stay expanded."
                  : "The sidebar will expand on hover.",
              );
            }}
          />
        </div>
        <div className="pt-5">
          <SwitchField
            label="Reduce Motion"
            description="Turns off scroll, page, and chart animations. Your device's reduced-motion setting is always respected."
            checked={prefs.reduceMotion}
            onChange={(checked) => {
              setPreferences({ reduceMotion: checked });
              saved(
                checked ? "Animations reduced." : "Animations turned back on.",
              );
            }}
          />
        </div>
      </div>
    </Panel>
  );
}

function DefaultsSection() {
  const prefs = usePreferences();
  const [confirmReset, setConfirmReset] = useState(false);
  const taskId = useId();
  const splitId = useId();
  const scalerId = useId();
  const rowsId = useId();
  const isDefault =
    prefs.defaultTask === DEFAULT_PREFERENCES.defaultTask &&
    prefs.defaultTestSize === DEFAULT_PREFERENCES.defaultTestSize &&
    prefs.defaultScaler === DEFAULT_PREFERENCES.defaultScaler &&
    prefs.previewRows === DEFAULT_PREFERENCES.previewRows;

  return (
    <Panel
      id="defaults"

      title="Workspace Defaults"
      description="Starting values for new training runs and data previews. You can still change them each time."
      icon={<SlidersHorizontal aria-hidden="true" />}
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setConfirmReset(true)}
          disabled={isDefault}
        >
          Reset to Defaults
        </Button>
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Default Task" labelId={taskId}>
          <Select
            aria-labelledby={taskId}
            value={prefs.defaultTask}
            onChange={(value: TaskType) => {
              setPreferences({ defaultTask: value });
              saved("Default task updated.");
            }}
            options={[
              {
                value: "classification",
                label: "Classification",
                description: "Predict a category.",
              },
              {
                value: "regression",
                label: "Regression",
                description: "Predict a number.",
              },
              {
                value: "clustering",
                label: "Clustering",
                description: "Find groups without a target.",
              },
            ]}
          />
        </Field>
        <Field label="Default Test Split" labelId={splitId}>
          <Select
            aria-labelledby={splitId}
            value={String(prefs.defaultTestSize)}
            onChange={(value) => {
              setPreferences({ defaultTestSize: Number(value) });
              saved("Default test split updated.");
            }}
            options={[0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4].map((value) => ({
              value: String(value),
              label: `${Math.round(value * 100)}% held out for testing`,
            }))}
          />
        </Field>
        <Field label="Default Feature Scaling" labelId={scalerId}>
          <Select
            aria-labelledby={scalerId}
            value={prefs.defaultScaler}
            onChange={(value: ScalerType) => {
              setPreferences({ defaultScaler: value });
              saved("Default scaling updated.");
            }}
            options={[
              {
                value: "standard",
                label: "Standard",
                description: "Recommended for most models.",
              },
              {
                value: "minmax",
                label: "Min-Max",
                description: "Rescale to the range 0 to 1.",
              },
              {
                value: "robust",
                label: "Robust",
                description: "Less sensitive to outliers.",
              },
              { value: "none", label: "None", description: "Use raw values." },
            ]}
          />
        </Field>
        <Field label="Rows in Data Previews" labelId={rowsId}>
          <Select
            aria-labelledby={rowsId}
            value={String(prefs.previewRows)}
            onChange={(value) => {
              setPreferences({ previewRows: Number(value) });
              saved("Preview size updated.");
            }}
            options={[10, 25, 50, 100].map((value) => ({
              value: String(value),
              label: `${value} rows`,
            }))}
          />
        </Field>
      </div>
      <ConfirmDialog
        open={confirmReset}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetWorkspaceDefaults();
          setConfirmReset(false);
          saved("Workspace defaults restored.");
        }}
        tone="warning"
        title="Reset Workspace Defaults?"
        description="Default task, test split, scaling, and preview size will return to their original values. Your theme and sessions aren't affected."
        confirmLabel="Reset Defaults"
      />
    </Panel>
  );
}

function SessionsSection() {
  const router = useRouter();
  const history = useSessionHistory();
  const current = useCurrentSession();
  const [refreshKey, setRefreshKey] = useState(0);
  const [pending, setPending] = useState<SessionRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const ids = history.map((item) => item.id).slice(0, 50);
  const statusResource = useResource(
    ids.length > 0 ? `sessions-status:${ids.join(",")}:${refreshKey}` : null,
    (signal) => api.sessionsStatus(ids, signal),
    { keepPrevious: true },
  );
  const statuses: Record<string, SessionSummary | null> | null =
    statusResource.data?.sessions ?? null;
  const checking = statusResource.status === "loading";
  const checkError = statusResource.error ? statusResource.error.message : null;

  const deleteOne = async () => {
    if (!pending) return;
    setDeleting(true);
    try {
      await api.deleteSession(pending.id);
      forgetSessions([pending.id]);
      invalidateResources("");
      toast.success(
        `Deleted ${pending.filename} and everything created from it.`,
      );
      setPending(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const deleteAll = async () => {
    setDeletingAll(true);
    try {
      await api.deleteSessions(history.map((item) => item.id).slice(0, 50));
      forgetAllSessions();
      invalidateResources("");
      toast.success("All sessions deleted.");
      setConfirmAll(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <Panel
      id="sessions"

      title="Sessions"
      description={`Datasets uploaded from this browser. Each one expires ${SESSION_TTL_HOURS} hours after upload.`}
      icon={<FolderClock aria-hidden="true" />}
      actions={
        history.length > 0 ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRefreshKey((key) => key + 1)}
              loading={checking}
              loadingText="Checking…"
            >
              <RefreshCw aria-hidden="true" />
              Refresh Status
            </Button>
            <Button
              variant="danger-soft"
              size="sm"
              onClick={() => setConfirmAll(true)}
            >
              <Trash aria-hidden="true" />
              Delete All Sessions
            </Button>
          </>
        ) : null
      }
    >
      {history.length === 0 ? (
        <EmptyState
          compact
          icon={<FileSpreadsheet aria-hidden="true" />}
          title="No Sessions Yet"
          description="Datasets you upload from this browser will appear here, so you can reopen or delete them."
          actions={
            <Button variant="secondary" onClick={() => router.push("/app")}>
              Upload a Dataset
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {checkError ? (
            <p role="alert" className="text-sm text-danger">
              Couldn&apos;t check session status: {checkError}
            </p>
          ) : null}
          <TableContainer label="Your sessions" maxHeight="30rem">
            <table className="data-table">
              <caption className="sr-only">
                Sessions created in this browser
              </caption>
              <thead>
                <tr>
                  <th scope="col">Dataset</th>
                  <th scope="col">Size</th>
                  <th scope="col">Uploaded</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => {
                  const summary = statuses?.[item.id];
                  const known = statuses !== null && item.id in statuses;
                  const active =
                    known && summary !== null && summary !== undefined;
                  const isCurrent = current?.id === item.id;
                  return (
                    <tr key={item.id}>
                      <td>
                        <span className="flex min-w-0 items-center gap-3">
                          <FileSpreadsheet
                            className="size-4 shrink-0 text-fg-subtle"
                            aria-hidden="true"
                          />
                          <span
                            className="max-w-64 truncate font-semibold text-fg"
                            title={item.filename}
                          >
                            {item.filename}
                          </span>
                          {isCurrent ? (
                            <Badge tone="brand">Current</Badge>
                          ) : null}
                        </span>
                      </td>
                      <td className="num whitespace-nowrap text-fg-muted">
                        {formatCompact(summary?.rows ?? item.rows)} ×{" "}
                        {summary?.columns ?? item.columns}
                      </td>
                      <td
                        className="whitespace-nowrap text-fg-muted"
                        title={formatDateTime(item.createdAt)}
                      >
                        {formatRelativeTime(item.createdAt)}
                      </td>
                      <td className="whitespace-nowrap">
                        {!known ? (
                          checking ? (
                            <Spinner />
                          ) : (
                            <Badge tone="neutral">Unknown</Badge>
                          )
                        ) : active ? (
                          <span className="flex flex-col gap-0.5">
                            <Badge tone="success" className="w-fit">
                              <CircleCheck aria-hidden="true" />
                              Active
                            </Badge>
                            <span className="text-xs text-fg-subtle">
                              {summary.trained_models}{" "}
                              {summary.trained_models === 1
                                ? "model"
                                : "models"}{" "}
                              · expires {formatRelativeTime(summary.expires_at)}
                            </span>
                          </span>
                        ) : (
                          <Badge tone="neutral">Expired</Badge>
                        )}
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <span className="inline-flex gap-2">
                          {active && !isCurrent ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setCurrentSession({
                                  id: item.id,
                                  filename: item.filename,
                                });
                                router.push("/app/insights");
                              }}
                            >
                              Open
                            </Button>
                          ) : null}
                          {known && !active ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => forgetSessions([item.id])}
                            >
                              Remove From List
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setPending(item)}
                              aria-label={`Delete ${item.filename}`}
                              className="hover:bg-danger-soft hover:text-danger"
                            >
                              <Trash aria-hidden="true" />
                            </Button>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableContainer>
        </div>
      )}

      <ConfirmDialog
        open={pending !== null}
        onCancel={() => setPending(null)}
        onConfirm={deleteOne}
        busy={deleting}
        busyLabel="Deleting…"
        tone="danger"
        title={`Delete ${pending?.filename ?? "This Session"}?`}
        description="The uploaded data, cleaned copy, trained models, and results will be permanently deleted from the server. This can't be undone."
        confirmLabel="Delete Session"
      />
      <ConfirmDialog
        open={confirmAll}
        onCancel={() => setConfirmAll(false)}
        onConfirm={deleteAll}
        busy={deletingAll}
        busyLabel="Deleting…"
        tone="danger"
        title={`Delete All ${pluralize(history.length, "Session")}?`}
        description="Every dataset uploaded from this browser, along with its trained models and results, will be permanently deleted from the server. Your preferences are kept."
        confirmLabel="Delete All Sessions"
      />
    </Panel>
  );
}

function PrivacySection() {
  const router = useRouter();
  const history = useSessionHistory();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const deleteEverything = async () => {
    setBusy(true);
    try {
      const ids = history.map((item) => item.id);
      if (ids.length > 0) await api.deleteSessions(ids.slice(0, 50));
      forgetAllSessions();
      clearPreferences();
      invalidateResources("");
      setOpen(false);
      toast.success(
        "All your data has been deleted from the server and this browser.",
      );
      router.push("/app");
    } catch (error) {
      toast.error(`Nothing was deleted. ${getErrorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      id="privacy"

      title="Privacy and Data"
      description="What MLInsights stores, where it's kept, and how to remove it."
      icon={<ShieldAlert aria-hidden="true" />}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-bg-alt p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-fg">
            <Server className="size-4 text-brand" aria-hidden="true" />
            On the Analysis Server
          </p>
          <p className="mt-1.5 text-sm text-fg-muted">
            Your uploaded files, cleaned copies, trained models, and results.
            They expire {SESSION_TTL_HOURS} hours after upload.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-alt p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-fg">
            <FileSpreadsheet className="size-4 text-brand" aria-hidden="true" />
            In This Browser
          </p>
          <p className="mt-1.5 text-sm text-fg-muted">
            Your preferences and the list of your sessions (
            {pluralize(history.length, "session")}). Never sent anywhere else.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-danger-line bg-danger-soft p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-bold text-fg">Delete All My Data</p>
          <p className="mt-1 max-w-xl text-sm text-fg-muted">
            Permanently deletes every session from the server and clears all
            preferences stored in this browser. It&apos;s the closest thing to
            deleting an account.
          </p>
        </div>
        <Button
          variant="danger"
          onClick={() => setOpen(true)}
          className="shrink-0"
        >
          <Trash aria-hidden="true" />
          Delete All My Data
        </Button>
      </div>
      <p className="mt-4 text-sm text-fg-subtle">
        Read the{" "}
        <Link
          href="/privacy"
          className="font-semibold text-brand hover:underline"
        >
          Privacy Policy
        </Link>{" "}
        for full details.
      </p>

      <ConfirmDialog
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={deleteEverything}
        busy={busy}
        busyLabel="Deleting Everything…"
        tone="danger"
        title="Delete All of Your Data?"
        description={`This permanently deletes ${pluralize(history.length, "session")} from the server, including trained models and results, and resets every preference in this browser. This can't be undone.`}
        confirmLabel="Delete Everything"
        requireText="DELETE"
      />
    </Panel>
  );
}

function ConnectionSection() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<
    | { status: "checking" }
    | { status: "online"; health: HealthResponse; latency: number }
    | { status: "offline"; message: string }
  >({ status: "checking" });

  useEffect(() => {
    const controller = new AbortController();
    const started = performance.now();
    api
      .health(controller.signal)
      .then((health) =>
        setState({
          status: "online",
          health,
          latency: Math.round(performance.now() - started),
        }),
      )
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ status: "offline", message: getErrorMessage(error) });
      });
    return () => controller.abort();
  }, [attempt]);

  const rows: { label: string; value: ReactNode }[] = [
    {
      label: "Status",
      value:
        state.status === "checking" ? (
          <Spinner label="Checking…" />
        ) : state.status === "online" ? (
          <Badge tone="success">
            <Wifi aria-hidden="true" />
            Online
          </Badge>
        ) : (
          <Badge tone="danger">
            <WifiOff aria-hidden="true" />
            Unreachable
          </Badge>
        ),
    },
    {
      label: "Response Time",
      value: state.status === "online" ? `${state.latency} ms` : "—",
    },
    {
      label: "API Version",
      value: state.status === "online" ? state.health.version : "—",
    },
    {
      label: "Data Expires",
      value: `${state.status === "online" ? state.health.session_ttl_hours : SESSION_TTL_HOURS} hours after upload`,
    },
    {
      label: "Server Address",
      value: <span className="break-all">{API_URL}</span>,
    },
  ];

  return (
    <Panel
      id="connection"

      title="Connection"
      description="Check whether the analysis server is reachable from your browser."
      icon={<Server aria-hidden="true" />}
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setState({ status: "checking" });
            setAttempt((value) => value + 1);
          }}
          loading={state.status === "checking"}
          loadingText="Checking…"
        >
          <RefreshCw aria-hidden="true" />
          Check Again
        </Button>
      }
    >
      <dl className="divide-y divide-border rounded-xl border border-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <dt className="text-sm text-fg-muted">{row.label}</dt>
            <dd className="num text-sm font-semibold text-fg">{row.value}</dd>
          </div>
        ))}
      </dl>
      {state.status === "offline" ? (
        <p role="alert" className="mt-4 text-sm text-fg-muted">
          {state.message}
        </p>
      ) : null}
    </Panel>
  );
}

function AboutSection() {
  return (
    <Panel
      id="about"

      title="About"
      description="Your account, the app version, and legal information."
      icon={<Info aria-hidden="true" />}
    >
      <div className="flex items-start gap-4 rounded-xl border border-border bg-bg-alt p-4">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-brand">
          <CircleUser className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-fg">No Account Needed</p>
          <p className="mt-1 text-sm text-fg-muted">
            MLInsights doesn&apos;t use accounts or passwords, so there&apos;s
            nothing to sign in to or change. Your sessions and preferences
            belong to this browser. To remove everything, use Delete All My
            Data.
          </p>
        </div>
      </div>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-fg-muted">App Version</dt>
          <dd className="num mt-0.5 font-semibold text-fg">{APP_VERSION}</dd>
        </div>
        <div>
          <dt className="text-sm text-fg-muted">Data Retention</dt>
          <dd className="mt-0.5 font-semibold text-fg">
            {SESSION_TTL_HOURS} hours after upload
          </dd>
        </div>
      </dl>
      <ul className="mt-6 flex flex-wrap gap-2">
        {[
          { href: "/privacy", label: "Privacy Policy" },
          { href: "/terms", label: "Terms of Service" },
          { href: "/disclaimer", label: "Disclaimer" },
        ].map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold text-fg transition-colors hover:border-brand-line hover:text-brand"
            >
              {link.label}
            </Link>
          </li>
        ))}
        <li>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-semibold text-fg transition-colors hover:border-brand-line hover:text-brand"
          >
            Source Code
            <ArrowUpRight className="size-4" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
      </ul>
    </Panel>
  );
}

export function SettingsView() {
  return (
    <div className="space-y-10 lg:space-y-12">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Manage how MLInsights looks, your workspace defaults, your sessions, and your data."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:gap-10">
        <SectionNav />
        <div className="min-w-0 space-y-6">
          <AppearanceSection />
          <DefaultsSection />
          <SessionsSection />
          <PrivacySection />
          <ConnectionSection />
          <AboutSection />
        </div>
      </div>
    </div>
  );
}
