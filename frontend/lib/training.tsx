"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/endpoints";
import type { ScalerType, TaskType } from "@/lib/api/types";
import { bumpModelsVersion, markSessionExpired } from "@/lib/session-store";

export type JobStatus = "queued" | "training" | "done" | "failed" | "skipped";

export interface TrainingJob {
  key: string;
  name: string;
  status: JobStatus;
  startedAt?: number;
  durationMs?: number;
  serverMs?: number;
  error?: string;
}

export interface TrainingPlan {
  sessionId: string;
  task: TaskType;
  target: string | null;
  featureCols: string[] | null;
  testSize: number;
  scaler: ScalerType;
  models: { key: string; name: string }[];
}

export interface TrainingRun {
  id: number;
  sessionId: string;
  task: TaskType;
  target: string | null;
  jobs: TrainingJob[];
  startedAt: number;
  finishedAt: number | null;
  stopRequested: boolean;
  sessionExpired: boolean;
}

interface TrainingContextValue {
  run: TrainingRun | null;
  isRunning: boolean;
  start: (plan: TrainingPlan) => void;
  requestStop: () => void;
  dismiss: () => void;
}

const TrainingContext = createContext<TrainingContextValue | null>(null);

export function TrainingProvider({ children }: { children: ReactNode }) {
  const [run, setRun] = useState<TrainingRun | null>(null);
  const runningRef = useRef(false);
  const stopRef = useRef(false);
  const runIdRef = useRef(0);

  const patchJob = useCallback(
    (runId: number, key: string, patch: Partial<TrainingJob>) => {
      setRun((current) =>
        current && current.id === runId
          ? {
              ...current,
              jobs: current.jobs.map((job) =>
                job.key === key ? { ...job, ...patch } : job,
              ),
            }
          : current,
      );
    },
    [],
  );

  const start = useCallback(
    (plan: TrainingPlan) => {
      if (runningRef.current || plan.models.length === 0) return;
      runningRef.current = true;
      stopRef.current = false;
      runIdRef.current += 1;
      const runId = runIdRef.current;

      setRun({
        id: runId,
        sessionId: plan.sessionId,
        task: plan.task,
        target: plan.target,
        jobs: plan.models.map((model) => ({
          key: model.key,
          name: model.name,
          status: "queued",
        })),
        startedAt: Date.now(),
        finishedAt: null,
        stopRequested: false,
        sessionExpired: false,
      });

      void (async () => {
        let sessionExpired = false;
        for (const model of plan.models) {
          if (stopRef.current || sessionExpired) {
            patchJob(runId, model.key, { status: "skipped" });
            continue;
          }
          const startedAt = performance.now();
          patchJob(runId, model.key, {
            status: "training",
            startedAt: Date.now(),
          });
          try {
            const result = await api.train(plan.sessionId, {
              model_key: model.key,
              task: plan.task,
              target_col: plan.task === "clustering" ? null : plan.target,
              feature_cols: plan.featureCols,
              test_size: plan.testSize,
              scaler_type: plan.scaler,
            });
            patchJob(runId, model.key, {
              status: "done",
              durationMs: Math.round(performance.now() - startedAt),
              serverMs: result.duration_ms,
            });
            bumpModelsVersion();
          } catch (error) {
            const durationMs = Math.round(performance.now() - startedAt);
            if (error instanceof ApiError && error.isSessionExpired) {
              sessionExpired = true;
              markSessionExpired(plan.sessionId);
            }
            patchJob(runId, model.key, {
              status: "failed",
              durationMs,
              error: getErrorMessage(error),
            });
          }
        }
        setRun((current) =>
          current && current.id === runId
            ? { ...current, finishedAt: Date.now(), sessionExpired }
            : current,
        );
        runningRef.current = false;
      })();
    },
    [patchJob],
  );

  const requestStop = useCallback(() => {
    stopRef.current = true;
    setRun((current) =>
      current ? { ...current, stopRequested: true } : current,
    );
  }, []);

  const dismiss = useCallback(() => {
    if (runningRef.current) return;
    setRun(null);
  }, []);

  const isRunning = run !== null && run.finishedAt === null;

  useEffect(() => {
    if (!isRunning) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isRunning]);

  const value = useMemo(
    () => ({ run, isRunning, start, requestStop, dismiss }),
    [run, isRunning, start, requestStop, dismiss],
  );

  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining(): TrainingContextValue {
  const value = useContext(TrainingContext);
  if (!value)
    throw new Error("useTraining must be used inside TrainingProvider");
  return value;
}
