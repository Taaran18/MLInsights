"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { getModelCatalog, getRecommendations, getSuggestTarget, trainModel } from "@/lib/api";
import type { TrainRequest } from "@/lib/api";
import {
  Loader2, Play, Star, Lightbulb, Lock, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Circle, Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn, CATEGORY_COLORS } from "@/lib/utils";

interface Props {
  sessionId: string;
  columns: string[];
  onTrained: () => void;
  onSessionExpired: () => void;
}

const TASKS = ["regression", "classification", "clustering"] as const;
type TaskType = typeof TASKS[number];
type ScalerType = "none" | "standard" | "minmax" | "robust";

interface ModelProgress {
  key: string;
  name: string;
  status: "waiting" | "training" | "done" | "failed";
  duration?: number; // ms
  error?: string;
  estMs?: number;   // rough pre-training estimate
}

// Rough time estimates (ms) per model key — order of magnitude only
const MODEL_EST_MS: Record<string, number> = {
  // Fast linear models
  logistic_regression: 800, ridge_classifier: 300, sgd_classifier: 500,
  perceptron: 300, passive_aggressive_classifier: 300,
  linear_regression: 300, ridge_regression: 300, lasso_regression: 500,
  elastic_net: 500, bayesian_ridge: 600, huber_regressor: 600,
  // Tree
  decision_tree_classifier: 800, decision_tree_regressor: 800,
  extra_tree_classifier: 600, extra_tree_regressor: 600,
  // KNN / Naive Bayes / Discriminant
  knn_classifier: 1000, knn_regressor: 1000,
  gaussian_nb: 300, bernoulli_nb: 300, multinomial_nb: 300,
  lda: 400, qda: 400,
  // Ensemble
  random_forest_classifier: 4000, random_forest_regressor: 4000,
  extra_trees_classifier: 3000, extra_trees_regressor: 3000,
  bagging_classifier: 3000, bagging_regressor: 3000,
  // Boosting
  gradient_boosting_classifier: 6000, gradient_boosting_regressor: 6000,
  hist_gradient_boosting_classifier: 3000, hist_gradient_boosting_regressor: 3000,
  adaboost_classifier: 4000, adaboost_regressor: 4000,
  xgboost_classifier: 5000, xgboost_regressor: 5000,
  lightgbm_classifier: 3000, lightgbm_regressor: 3000,
  catboost_classifier: 8000, catboost_regressor: 8000,
  // SVM
  svm_rbf_classifier: 4000, svm_rbf_regressor: 4000,
  svm_linear_classifier: 3000, svm_linear_regressor: 3000,
  // MLP
  mlp_classifier: 5000, mlp_regressor: 5000,
  // Stacking
  stacking_classifier: 15000, stacking_regressor: 15000,
  // Clustering
  kmeans: 1000, dbscan: 1500, agglomerative: 2000,
  spectral: 5000, birch: 1000, optics: 3000,
};

// Simple formatter — used in the training modal
function fmtSec(ms: number) {
  return ms < 1000 ? `~${ms}ms` : `~${Math.round(ms / 1000)}s`;
}

const SCALER_OPTIONS: { key: ScalerType; label: string; desc: string }[] = [
  { key: "none",     label: "None",     desc: "Raw values" },
  { key: "standard", label: "Standard", desc: "Z-score (μ=0, σ=1)" },
  { key: "minmax",   label: "Min-Max",  desc: "Scales to [0, 1]" },
  { key: "robust",   label: "Robust",   desc: "Median/IQR — outlier-safe" },
];

const TASK_INFO: Record<TaskType, { label: string; desc: string; color: string }> = {
  regression:     { label: "Regression",     desc: "Predict a continuous numeric value (price, temperature, score…)", color: "bg-blue-600 border-blue-500 shadow-blue-500/20" },
  classification: { label: "Classification", desc: "Predict which category something belongs to (fraud/not fraud, spam/ham…)", color: "bg-brand-600 border-brand-500 shadow-brand-500/20" },
  clustering:     { label: "Clustering",     desc: "Discover natural groups in unlabelled data — no target column needed", color: "bg-purple-600 border-purple-500 shadow-purple-500/20" },
};

// ── Confidence strip ──────────────────────────────────────────────────────────
function ConfidenceBar({ score, max }: { score: number; max: number }) {
  const pct = Math.min(100, Math.round((score / Math.max(max, 1)) * 100));
  const color = pct > 65 ? "#10b981" : pct > 35 ? "#f59e0b" : "#6366f1";
  const label = pct > 65 ? "Strong match" : pct > 35 ? "Likely match" : "Possible";
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-medium shrink-0" style={{ color }}>{label}</span>
    </div>
  );
}

// ── Model Card ────────────────────────────────────────────────────────────────
function ModelCard({ model, selected, recommended, onClick }: {
  model: any; selected: boolean; recommended: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 relative min-h-[72px]",
        selected
          ? "border-brand-500 bg-brand-600/10 ring-1 ring-brand-500/20"
          : recommended
          ? "border-yellow-500/40 bg-yellow-500/5 hover:bg-yellow-500/10 hover:border-yellow-400/60"
          : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/60"
      )}
    >
      {/* Glow strip */}
      {recommended && (
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-gradient-to-r from-yellow-500/0 via-yellow-400 to-yellow-500/0" />
      )}

      {/* Name + radio on the same row */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          {/* Star prefix inline with name */}
          <p className={cn(
            "text-sm font-semibold leading-snug break-words",
            selected ? "text-brand-200" : recommended ? "text-yellow-100" : "text-slate-100"
          )}>
            {recommended && <span className="text-yellow-400 mr-1">⭐</span>}
            {model.name}
          </p>

          {/* Category + recommended badge below name */}
          <div className="flex items-center gap-1.5 flex-wrap mt-2">
            <span className={cn("badge text-xs", CATEGORY_COLORS[model.category] || "bg-slate-700 text-slate-300")}>
              {model.category}
            </span>
            {recommended && (
              <span className="badge bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 text-xs">
                ★ Rec
              </span>
            )}
          </div>
        </div>

        {/* Radio — right-aligned, always visible */}
        <div className={cn(
          "w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
          selected
            ? "border-brand-500 bg-brand-500"
            : recommended
            ? "border-yellow-500/70"
            : "border-slate-600"
        )}>
          {selected && <div className="w-3 h-3 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  );
}

// ── Step label ────────────────────────────────────────────────────────────────
function Step({ n, label, done }: { n: number; label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
        done ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-300"
      )}>
        {done ? "✓" : n}
      </div>
      <span className="text-slate-200 text-sm font-semibold">{label}</span>
    </div>
  );
}

// ── Training Progress Modal ───────────────────────────────────────────────────
function TrainingModal({
  progress, totalDuration, elapsed, onClose,
}: {
  progress: ModelProgress[];
  totalDuration: number | null;
  elapsed: number;
  onClose: () => void;
}) {
  const done = progress.filter((p) => p.status === "done" || p.status === "failed").length;
  const total = progress.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isFinished = totalDuration !== null;
  const totalEstMs = progress.reduce((acc, p) => acc + (p.estMs ?? 3000), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-semibold text-base">
              {isFinished ? "Training Complete" : "Training Models…"}
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              {isFinished
                ? `${progress.filter((p) => p.status === "done").length} succeeded · ${progress.filter((p) => p.status === "failed").length} failed`
                : `${done} of ${total} complete · est. total ${fmtSec(totalEstMs)}`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
            <Clock className="w-3.5 h-3.5" />
            {isFinished
              ? <span className="text-emerald-400">{(totalDuration! / 1000).toFixed(2)}s total</span>
              : <span>{(elapsed / 1000).toFixed(1)}s</span>}
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>{pct}% complete</span>
            <span>{done}/{total} models</span>
          </div>
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                isFinished ? "bg-gradient-to-r from-emerald-600 to-emerald-400" : "bg-gradient-to-r from-brand-600 to-brand-400"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Model list */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {progress.map((p, i) => (
            <div
              key={p.key}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                p.status === "done"     ? "bg-emerald-500/5 border-emerald-500/20" :
                p.status === "failed"   ? "bg-red-500/5 border-red-500/20" :
                p.status === "training" ? "bg-brand-600/8 border-brand-500/30 ring-1 ring-brand-500/20" :
                "bg-slate-800/40 border-slate-700/30"
              )}
            >
              {/* Status icon */}
              <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                {p.status === "done"     && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {p.status === "failed"   && <XCircle className="w-5 h-5 text-red-400" />}
                {p.status === "training" && <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />}
                {p.status === "waiting"  && (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-700 flex items-center justify-center">
                    <span className="text-slate-600 text-xs font-bold">{i + 1}</span>
                  </div>
                )}
              </div>

              {/* Name + sub-text */}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate",
                  p.status === "done"     ? "text-emerald-200" :
                  p.status === "failed"   ? "text-red-300" :
                  p.status === "training" ? "text-white" :
                  "text-slate-500"
                )}>
                  {p.name}
                </p>
                {p.status === "training" && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map((j) => (
                        <div
                          key={j}
                          className="w-1 h-1 rounded-full bg-brand-400 animate-bounce"
                          style={{ animationDelay: `${j * 150}ms` }}
                        />
                      ))}
                    </div>
                    <span className="text-brand-400 text-xs">Fitting…</span>
                  </div>
                )}
                {p.status === "waiting" && (
                  <span className="text-slate-600 text-xs">
                    Queued{p.estMs ? ` · est. ${fmtSec(p.estMs)}` : ""}
                  </span>
                )}
                {p.status === "failed" && p.error && (
                  <p className="text-red-400 text-xs mt-0.5 truncate">{p.error}</p>
                )}
              </div>

              {/* Duration badge */}
              {p.duration != null && (
                <span className={cn(
                  "text-xs font-mono shrink-0 px-2 py-0.5 rounded-lg",
                  p.status === "done"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/15 text-red-400"
                )}>
                  {p.duration < 1000 ? `${p.duration}ms` : `${(p.duration / 1000).toFixed(2)}s`}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        {isFinished && (
          <button onClick={onClose} className="btn-primary w-full mt-5 py-2.5">
            View Results
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ModelSelection({ sessionId, columns, onTrained, onSessionExpired }: Props) {
  const [task, setTask] = useState<TaskType>("classification");
  const [targetCol, setTargetCol] = useState("");
  const [catalog, setCatalog] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);
  const [scalerType, setScalerType] = useState<ScalerType>("none");
  const [testSize, setTestSize] = useState(0.2);
  const [loadingRec, setLoadingRec] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSugg, setLoadingSugg] = useState(false);
  const [showAllModels, setShowAllModels] = useState(false);

  // Training progress
  const [trainingProgress, setTrainingProgress] = useState<ModelProgress[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const trainingStartRef = useRef<number | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { getModelCatalog().then(setCatalog).catch(() => {}); }, []);

  useEffect(() => {
    if (task === "clustering") { setSuggestions([]); return; }
    setLoadingSugg(true);
    getSuggestTarget(sessionId, task)
      .then((d) => setSuggestions(d.suggestions || []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoadingSugg(false));
  }, [sessionId, task]);

  const fetchRecommendations = useCallback(async () => {
    setLoadingRec(true);
    try {
      const res = await getRecommendations(
        sessionId,
        task !== "clustering" ? targetCol || undefined : undefined,
      );
      setRecommendations(res.recommendations || []);
      setSelectedModels(new Set(res.recommendations.map((m: any) => m.key)));
    } finally {
      setLoadingRec(false);
    }
  }, [sessionId, task, targetCol]);

  useEffect(() => { fetchRecommendations(); }, [task, targetCol]);

  // Live elapsed timer
  useEffect(() => {
    if (showProgress && totalDuration === null) {
      trainingStartRef.current = Date.now();
      elapsedIntervalRef.current = setInterval(() => {
        setElapsed(Date.now() - (trainingStartRef.current ?? Date.now()));
      }, 100);
    } else {
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    }
    return () => { if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current); };
  }, [showProgress, totalDuration]);

  const allModels: any[] = catalog?.[task] || [];
  const categories = ["All", ...Array.from(new Set(allModels.map((m) => m.category as string)))];
  const recKeys = new Set(recommendations.map((r) => r.key));

  const filtered = allModels
    .filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === "All" || m.category === filterCategory;
      const matchRec = !showRecommendedOnly || recKeys.has(m.key);
      return matchSearch && matchCat && matchRec;
    })
    .sort((a: any, b: any) => (recKeys.has(a.key) ? 0 : 1) - (recKeys.has(b.key) ? 0 : 1));

  const toggle = (key: string) =>
    setSelectedModels((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const handleTrainAll = async () => {
    if (!selectedModels.size) { toast.error("Select at least one model."); return; }
    if (task !== "clustering" && !targetCol) { toast.error("Select a target column."); return; }

    const modelKeys = Array.from(selectedModels);
    const nameMap = Object.fromEntries(allModels.map((m: any) => [m.key, m.name]));

    const initialProgress: ModelProgress[] = modelKeys.map((key) => ({
      key, name: nameMap[key] || key, status: "waiting",
      estMs: MODEL_EST_MS[key] ?? 3000,
    }));
    setTrainingProgress(initialProgress);
    setTotalDuration(null);
    setElapsed(0);
    setShowProgress(true);

    const allStart = Date.now();
    let success = 0, failed = 0;

    for (const modelKey of modelKeys) {
      setTrainingProgress((prev) =>
        prev.map((p) => p.key === modelKey ? { ...p, status: "training" } : p)
      );

      const modelStart = Date.now();
      try {
        const req: TrainRequest = {
          model_key: modelKey,
          task,
          target_col: task !== "clustering" ? targetCol : undefined,
          test_size: testSize,
          scaler_type: scalerType,
        };
        await trainModel(sessionId, req);
        const duration = Date.now() - modelStart;
        setTrainingProgress((prev) =>
          prev.map((p) => p.key === modelKey ? { ...p, status: "done", duration } : p)
        );
        success++;
      } catch (e: any) {
        if (e?.response?.status === 404) {
          setShowProgress(false);
          onSessionExpired();
          return;
        }
        const duration = Date.now() - modelStart;
        const error = e?.response?.data?.detail || "Training failed";
        setTrainingProgress((prev) =>
          prev.map((p) => p.key === modelKey ? { ...p, status: "failed", duration, error } : p)
        );
        failed++;
      }
    }

    setTotalDuration(Date.now() - allStart);
    if (success > 0) {
      toast.success(`${success} model(s) trained${failed > 0 ? `, ${failed} failed` : ""}!`);
      onTrained();
    }
  };

  const handleProgressClose = () => setShowProgress(false);

  const targetSelected = task === "clustering" || !!targetCol;
  const isClustering = task === "clustering";
  const maxScore = suggestions[0]?.score ?? 1;
  const stepOffset = isClustering ? -1 : 0; // clustering skips step 2

  return (
    <>
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Model Selection & Training</h2>

        {/* ── Two-column grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 lg:gap-8">

          {/* ── LEFT: Configuration ──────────────────────────────────────── */}
          <div className="space-y-7">

            {/* Step 1: Task */}
            <div>
              <Step n={1} label="What are you trying to do?" done={true} />
              <div className="flex gap-2 flex-wrap mb-2">
                {TASKS.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTask(t); setTargetCol(""); setSelectedModels(new Set()); }}
                    className={cn(
                      "px-4 py-2 rounded-xl border text-sm font-medium transition-all shadow-lg",
                      task === t
                        ? `${TASK_INFO[t].color} text-white`
                        : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 shadow-none"
                    )}
                  >
                    {TASK_INFO[t].label}
                  </button>
                ))}
              </div>
              <p className="text-slate-500 text-xs pl-1 leading-relaxed">{TASK_INFO[task].desc}</p>
            </div>

            {/* Step 2: Target Column (supervised only) */}
            {!isClustering && (
              <div>
                <Step n={2} label="Which column are you predicting?" done={!!targetCol} />

                {loadingSugg ? (
                  <div className="flex items-center gap-2 text-slate-500 text-xs mb-3">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analysing columns…
                  </div>
                ) : suggestions.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-yellow-300 text-xs font-medium">Suggested — click to select</span>
                    </div>
                    <div className="space-y-2">
                      {suggestions.map((s: any, i: number) => (
                        <button
                          key={s.column}
                          onClick={() => setTargetCol(s.column)}
                          className={cn(
                            "w-full text-left p-3 rounded-xl border transition-all duration-150",
                            targetCol === s.column
                              ? "border-brand-500 bg-brand-600/10 ring-1 ring-brand-500/20"
                              : "border-slate-700/60 bg-slate-800/40 hover:border-yellow-500/40 hover:bg-yellow-500/5"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                {i === 0 && <span className="text-yellow-400 text-xs">⭐</span>}
                                <span className={cn("text-sm font-semibold truncate",
                                  targetCol === s.column ? "text-brand-300" : "text-slate-100"
                                )}>
                                  {s.column}
                                </span>
                              </div>
                              <ConfidenceBar score={s.score} max={maxScore} />
                              <div className="mt-1.5 space-y-0.5">
                                {s.reasons.map((r: string, ri: number) => (
                                  <p key={ri} className="text-slate-500 text-xs">• {r}</p>
                                ))}
                              </div>
                              <div className="flex gap-1.5 mt-2 flex-wrap">
                                <span className="badge bg-slate-700/80 text-slate-400 text-xs">{s.dtype}</span>
                                <span className="badge bg-slate-700/80 text-slate-400 text-xs">{s.n_unique} unique</span>
                              </div>
                            </div>
                            <div className={cn(
                              "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center mt-0.5",
                              targetCol === s.column ? "border-brand-500 bg-brand-500" : "border-slate-600"
                            )}>
                              {targetCol === s.column && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <span className="text-slate-500 text-xs shrink-0">
                    {suggestions.length > 0 ? "Or pick manually:" : "Select column:"}
                  </span>
                  <select
                    className="input text-sm flex-1 min-w-0"
                    value={targetCol}
                    onChange={(e) => setTargetCol(e.target.value)}
                  >
                    <option value="">— select column —</option>
                    {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {targetCol && (
                  <p className="flex items-center gap-1.5 text-emerald-400 text-xs mt-2 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Predicting <strong className="ml-0.5">"{targetCol}"</strong>
                  </p>
                )}
              </div>
            )}

            {/* Step 3: Training Settings */}
            <div>
              <Step
                n={isClustering ? 2 : 3}
                label="Training settings"
                done={targetSelected}
              />
              <div className={cn("space-y-5 transition-opacity duration-200",
                !targetSelected && "opacity-40 pointer-events-none select-none"
              )}>
                {!isClustering && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-slate-400 text-xs font-medium">Test / Validation Split</label>
                      <span className="text-brand-300 text-sm font-bold">{Math.round(testSize * 100)}% held out</span>
                    </div>
                    <input
                      type="range" min={0.1} max={0.4} step={0.05} value={testSize}
                      onChange={(e) => setTestSize(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full accent-brand-500"
                    />
                    <div className="flex justify-between text-slate-600 text-xs mt-1">
                      <span>10% (more training)</span>
                      <span>40% (more testing)</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-slate-400 text-xs font-medium block mb-2">Feature Scaling</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SCALER_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setScalerType(opt.key)}
                        className={cn(
                          "px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-left",
                          scalerType === opt.key
                            ? "bg-brand-600/20 border-brand-500 text-brand-300"
                            : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600"
                        )}
                      >
                        <div className="font-semibold">{opt.label}</div>
                        <div className="text-slate-500 text-xs mt-0.5 leading-tight">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Model Selection ────────────────────────────────────── */}
          <div className="flex flex-col">
            <Step
              n={isClustering ? 3 : 4}
              label="Select models to train"
              done={selectedModels.size > 0 && targetSelected}
            />

            {!targetSelected ? (
              <div className="flex flex-col items-center justify-center flex-1 min-h-52 rounded-xl border border-dashed border-slate-700 bg-slate-800/20 gap-3">
                <Lock className="w-10 h-10 text-slate-700" />
                <p className="text-slate-500 text-sm text-center px-4">
                  Select a target column first to unlock model selection
                </p>
              </div>
            ) : (
              <div className="flex flex-col flex-1">
                {/* Recommendations banner */}
                {loadingRec ? (
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-3">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading recommendations…
                  </div>
                ) : recommendations.length > 0 && (
                  <div className="flex items-center gap-2 mb-3 p-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl">
                    <Star className="w-4 h-4 text-yellow-400 shrink-0" />
                    <p className="text-yellow-200 text-sm">
                      <strong>{recommendations.length} recommended</strong> models auto-selected and shown first.
                    </p>
                  </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-3 items-center">
                  <input
                    type="text" placeholder="Search models…"
                    className="input text-sm flex-1 min-w-24"
                    value={search} onChange={(e) => setSearch(e.target.value)}
                  />
                  <select className="input text-sm w-36"
                    value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer whitespace-nowrap">
                    <input type="checkbox" checked={showRecommendedOnly}
                      onChange={(e) => setShowRecommendedOnly(e.target.checked)}
                      className="accent-brand-500" />
                    ⭐ only
                  </label>
                  <div className="flex items-center gap-1 ml-auto">
                    <button onClick={() => setSelectedModels(new Set(filtered.map((m: any) => m.key)))}
                      className="text-xs text-brand-400 hover:text-brand-300 px-2 py-1">All</button>
                    <span className="text-slate-700">·</span>
                    <button onClick={() => setSelectedModels(new Set())}
                      className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1">None</button>
                    <span className="text-slate-500 text-xs ml-1">({selectedModels.size})</span>
                  </div>
                </div>

                {/* Model grid — 2 columns */}
                <div className={cn(
                  "grid grid-cols-2 gap-3 overflow-y-auto pr-1",
                  showAllModels ? "max-h-[600px]" : "max-h-[460px]"
                )}>
                  {filtered.map((m: any) => (
                    <ModelCard
                      key={m.key}
                      model={m}
                      selected={selectedModels.has(m.key)}
                      recommended={recKeys.has(m.key)}
                      onClick={() => toggle(m.key)}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-slate-500 text-sm col-span-full py-8 text-center">
                      No models match your filters.
                    </p>
                  )}
                </div>

                {filtered.length > 5 && (
                  <button
                    onClick={() => setShowAllModels((v) => !v)}
                    className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mx-auto"
                  >
                    {showAllModels
                      ? <><ChevronUp className="w-3.5 h-3.5" />Show less</>
                      : <><ChevronDown className="w-3.5 h-3.5" />Show all {filtered.length} models</>}
                  </button>
                )}

                {/* Train button — pinned to bottom of right column */}
                <button
                  onClick={handleTrainAll}
                  disabled={selectedModels.size === 0 || !targetSelected}
                  className="btn-primary flex items-center gap-2 w-full justify-center py-3 text-base mt-4 disabled:opacity-50"
                >
                  <Play className="w-5 h-5" />
                  Train {selectedModels.size} Model{selectedModels.size !== 1 ? "s" : ""}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Training Progress Modal ──────────────────────────────────────── */}
      {showProgress && (
        <TrainingModal
          progress={trainingProgress}
          totalDuration={totalDuration}
          elapsed={elapsed}
          onClose={handleProgressClose}
        />
      )}
    </>
  );
}
