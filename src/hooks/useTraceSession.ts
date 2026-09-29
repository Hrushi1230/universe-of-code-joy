import * as React from "react";
import { resolveModule } from "@/engine/registry";
import type { TraceExercise } from "@/content/trace-exercises";
import {
  buildTraceSession,
  viewAt,
  type TraceCheckpoint,
  type TraceSession,
  type TraceView,
} from "@/lib/trace";
import {
  EMPTY_TRACE_ENTRY,
  resolvedCount,
  traceRunKey,
  useTraceStore,
  useTraceStoreApi,
  type TraceEntry,
} from "@/stores/traceStore";

/**
 * Joins the canonical engine run with trace interaction state.
 *
 * The engine module is executed once per exercise and is the only source of
 * correct answers. This hook never touches `playerStore` or `predictionStore`.
 */
export interface TraceSessionState {
  session: TraceSession | null;
  /** Checkpoint the learner is answering, or null when the trace is complete. */
  checkpoint: TraceCheckpoint | null;
  entry: TraceEntry;
  /** Learner-visible algorithm state right now. */
  view: TraceView;
  /** How many resolved explanations have been acknowledged from the front. */
  progress: number;
  total: number;
  completed: boolean;
  /** Aggregated metrics that are actually tracked. */
  hintsUsed: number;
  attempts: number;
}

const EMPTY_VIEW: TraceView = {
  low: 0,
  high: 0,
  mid: null,
  comparison: null,
  found: null,
  exhausted: false,
};

export function useTraceSession(exercise: TraceExercise | undefined): TraceSessionState {
  const storeApi = useTraceStoreApi();
  const entries = useTraceStore((s) => s.entries);

  const session = React.useMemo(() => {
    if (!exercise) return null;
    const mod = resolveModule(exercise.moduleSlug ?? exercise.algorithmSlug);
    if (!mod) return null;
    const validation = mod.validate(exercise.inputs);
    if (!validation.ok) return null;
    return buildTraceSession(mod.run(validation.parsed));
  }, [exercise]);

  const runKey = traceRunKey(exercise?.slug, exercise?.inputs);
  React.useEffect(() => {
    storeApi.getState().syncRun(runKey);
  }, [runKey, storeApi]);

  const ids = React.useMemo(() => (session ? session.checkpoints.map((c) => c.id) : []), [session]);
  const progress = resolvedCount(ids, entries);
  const total = ids.length;
  const checkpoint = session?.checkpoints[progress] ?? null;
  const entry = (checkpoint ? entries[checkpoint.id] : undefined) ?? EMPTY_TRACE_ENTRY;
  const view = session ? viewAt(session, progress) : EMPTY_VIEW;

  const hintsUsed = ids.reduce((sum, id) => sum + (entries[id]?.hintLevel ?? 0), 0);
  const attempts = ids.reduce((sum, id) => sum + (entries[id]?.attempts ?? 0), 0);

  return {
    session,
    checkpoint,
    entry,
    view,
    progress,
    total,
    completed: total > 0 && progress >= total,
    hintsUsed,
    attempts,
  };
}

export default useTraceSession;
