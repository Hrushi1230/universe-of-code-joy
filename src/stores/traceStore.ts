import * as React from "react";
import { useStore, type StoreApi } from "zustand";
import { createStore } from "zustand/vanilla";

/**
 * Learner-interaction state for Trace Mode.
 *
 * This is NOT algorithm execution state. The canonical execution lives in the
 * engine run, and the guided player's `playerStore` is never touched from here —
 * a learner's guess must not be able to move the Golden Visualizer.
 *
 * Scoped exactly like `playerStore` and `predictionStore`: factory plus React
 * context, so two lesson workspaces never share interaction state. Nothing is
 * persisted; a trace session is in-memory for this phase.
 */

export type TraceStatus = "unanswered" | "selected" | "incorrect" | "correct" | "revealed";

/** Structured for a future mastery system to read. No XP wiring in this phase. */
export type TraceOutcome = "correct-first-try" | "correct-after-retry" | "revealed";

export interface TraceEntry {
  status: TraceStatus;
  /** The option the learner currently has selected (not necessarily checked). */
  selectedOptionId?: string;
  attempts: number;
  /** 0 = none, 1 = conceptual, 2 = stronger, 3 = answer-level. */
  hintLevel: number;
  outcome?: TraceOutcome;
  /** True once the learner acknowledges the explanation and advances. */
  continued: boolean;
}

export interface TraceState {
  runKey: string | null;
  entries: Record<string, TraceEntry>;

  /** Points the store at an exercise run; entries drop when the run changes. */
  syncRun: (runKey: string | null) => void;
  select: (id: string, optionId: string) => void;
  /** Records an attempt; resolves the checkpoint only when the answer is right. */
  check: (id: string, correctOptionId: string) => void;
  retry: (id: string) => void;
  reveal: (id: string, correctOptionId: string) => void;
  continueFrom: (id: string) => void;
  nextHint: (id: string) => void;
  /** Restart: checkpoint 0, no answers, no hints. Exercise input is untouched. */
  restart: () => void;
}

export type TraceStoreApi = StoreApi<TraceState>;

export const EMPTY_TRACE_ENTRY: TraceEntry = {
  status: "unanswered",
  attempts: 0,
  hintLevel: 0,
  continued: false,
};

/** Statuses that let the trace advance to the next checkpoint. */
export function isTraceResolved(entry: TraceEntry | undefined | null): boolean {
  const status = entry?.status ?? "unanswered";
  return status === "correct" || status === "revealed";
}

/** Stable key for an exercise run: same inputs always serialize the same way. */
export function traceRunKey(
  slug: string | null | undefined,
  inputs: Record<string, string> | null | undefined,
): string | null {
  if (!slug) return null;
  const entries = Object.entries(inputs ?? {}).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `${slug}::${entries.map(([k, v]) => `${k}=${v}`).join("&")}`;
}

export function createTraceStore(): TraceStoreApi {
  return createStore<TraceState>()((set, get) => {
    const patch = (id: string, next: Partial<TraceEntry>): void =>
      set((s) => ({
        entries: { ...s.entries, [id]: { ...(s.entries[id] ?? EMPTY_TRACE_ENTRY), ...next } },
      }));

    return {
      runKey: null,
      entries: {},

      syncRun: (runKey) => {
        if (get().runKey === runKey) return;
        set({ runKey, entries: {} });
      },

      select: (id, optionId) => {
        if (isTraceResolved(get().entries[id])) return;
        patch(id, { status: "selected", selectedOptionId: optionId });
      },

      check: (id, correctOptionId) => {
        const entry = get().entries[id] ?? EMPTY_TRACE_ENTRY;
        if (isTraceResolved(entry) || !entry.selectedOptionId) return;
        const attempts = entry.attempts + 1;
        if (entry.selectedOptionId === correctOptionId) {
          patch(id, {
            status: "correct",
            attempts,
            outcome: attempts === 1 ? "correct-first-try" : "correct-after-retry",
          });
        } else {
          /* Feedback only: an incorrect answer never advances the trace, so the
             learner-visible algorithm state cannot go wrong. */
          patch(id, { status: "incorrect", attempts });
        }
      },

      retry: (id) => {
        if (isTraceResolved(get().entries[id])) return;
        patch(id, { status: "unanswered", selectedOptionId: undefined });
      },

      reveal: (id, correctOptionId) => {
        if (isTraceResolved(get().entries[id])) return;
        patch(id, {
          status: "revealed",
          selectedOptionId: correctOptionId,
          hintLevel: 3,
          outcome: "revealed",
        });
      },

      continueFrom: (id) => {
        if (!isTraceResolved(get().entries[id])) return;
        patch(id, { continued: true });
      },

      nextHint: (id) => {
        const entry = get().entries[id] ?? EMPTY_TRACE_ENTRY;
        if (isTraceResolved(entry) || entry.hintLevel >= 3) return;
        patch(id, { hintLevel: entry.hintLevel + 1 });
      },

      restart: () => {
        if (Object.keys(get().entries).length === 0) return;
        set({ entries: {} });
      },
    };
  });
}

/** Instance used when no provider is present. */
export const defaultTraceStore = createTraceStore();

const TraceStoreContext = React.createContext<TraceStoreApi | null>(null);

export interface TraceStoreProviderProps {
  store: TraceStoreApi;
  children: React.ReactNode;
}

/** Scopes every trace hook below it to `store`. */
export function TraceStoreProvider({
  store,
  children,
}: TraceStoreProviderProps): React.ReactElement {
  return React.createElement(TraceStoreContext.Provider, { value: store }, children);
}

export function useTraceStoreApi(): TraceStoreApi {
  return React.useContext(TraceStoreContext) ?? defaultTraceStore;
}

export function useTraceStore<T>(selector: (state: TraceState) => T): T {
  return useStore(useTraceStoreApi(), selector);
}

/** Number of resolved explanations acknowledged from the front — the active checkpoint index. */
export function resolvedCount(ids: readonly string[], entries: Record<string, TraceEntry>): number {
  let count = 0;
  for (const id of ids) {
    if (!isTraceResolved(entries[id]) || !entries[id]?.continued) break;
    count += 1;
  }
  return count;
}
