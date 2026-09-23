"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { ApiError } from "@/lib/api/client";
import { api } from "@/lib/api/endpoints";
import type { Overview } from "@/lib/api/types";
import {
  getSessionHistory,
  updateSessionRecord,
  useCurrentSession,
  useExpiredSessions,
  useSessionVersions,
  type CurrentSession,
  type SessionVersions,
} from "@/lib/session-store";
import { useResource } from "@/lib/use-resource";

export type SessionStatus =
  "restoring" | "empty" | "loading" | "ready" | "expired" | "error";

interface SessionContextValue {
  status: SessionStatus;
  session: CurrentSession | null;
  overview: Overview | undefined;
  error: ApiError | null;
  isRefreshing: boolean;
  versions: SessionVersions;
  reload: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function SessionBoundary({
  session,
  children,
}: {
  session: CurrentSession | null | undefined;
  children: ReactNode;
}) {
  const versions = useSessionVersions();
  const expired = useExpiredSessions();
  const sessionId = session?.id ?? null;
  const key = sessionId
    ? `overview:${sessionId}:${versions.data}:${versions.models}`
    : null;
  const overview = useResource(
    key,
    (signal) => api.overview(sessionId as string, signal),
    {
      sessionId,
      keepPrevious: true,
    },
  );

  const rows = overview.data?.rows;
  const columns = overview.data?.columns;
  useEffect(() => {
    if (!sessionId || rows === undefined || columns === undefined) return;
    const record = getSessionHistory().find((item) => item.id === sessionId);
    if (record && (record.rows !== rows || record.columns !== columns)) {
      updateSessionRecord(sessionId, { rows, columns });
    }
  }, [sessionId, rows, columns]);

  let status: SessionStatus;
  if (session === undefined) status = "restoring";
  else if (session === null) status = "empty";
  else if (expired.has(session.id) || overview.error?.isSessionExpired)
    status = "expired";
  else if (overview.data) status = "ready";
  else if (overview.status === "error") status = "error";
  else status = "loading";

  const value: SessionContextValue = {
    status,
    session: session ?? null,
    overview: overview.data,
    error: overview.error,
    isRefreshing: overview.isRefreshing,
    versions,
    reload: overview.reload,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const session = useCurrentSession();
  return <SessionBoundary session={session}>{children}</SessionBoundary>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}

export function useReadySession(): {
  sessionId: string;
  filename: string;
  overview: Overview;
  versions: SessionVersions;
} {
  const { session, overview, versions } = useSession();
  if (!session || !overview)
    throw new Error("useReadySession requires a loaded session");
  return {
    sessionId: session.id,
    filename: session.filename,
    overview,
    versions,
  };
}
