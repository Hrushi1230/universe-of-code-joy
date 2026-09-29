import { StepBuilder } from "@/engine/builder";
import { parseEdgeList } from "@/engine/algorithms/bfs";
import { layeredLayout } from "@/engine/layout";
import type {
  AlgorithmModule,
  AlgorithmRun,
  AuxPanel,
  CellState,
  CodeLineMap,
  EdgeState,
  GraphFrame,
  ValidationResult,
} from "@/engine/types";

/**
 * Pseudocode -> listing line. The braced listings build `dist` before the loop
 * and pick the minimum across two lines, so the tail shifts by four. They also
 * omit `prev`, so pseudo 13 maps to 0 (no counterpart) rather than to a line
 * that says something else.
 */
const CODE_MAP: CodeLineMap = {
  js: [1, 3, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 0, 17],
  ts: [1, 3, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 0, 17],
  py: [1, 3, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
};

const PSEUDOCODE: string[] = [
  "function dijkstra(graph, start)",
  "  for each node v",
  "    dist[v] <- infinity",
  "  dist[start] <- 0",
  "  queue <- all nodes, keyed by dist",
  "  while queue is not empty",
  "    u <- node in queue with smallest dist",
  "    remove u from queue",
  "    for each neighbour v of u",
  "      alt <- dist[u] + weight(u, v)",
  "      if alt < dist[v]",
  "        dist[v] <- alt",
  "        prev[v] <- u",
  "  return dist",
];

const CODE_BY_LANG: Record<"js" | "ts" | "py", string[]> = {
  js: [
    "function dijkstra(graph, start) {",
    "  const dist = {};",
    "  for (const v of Object.keys(graph)) dist[v] = Infinity;",
    "  dist[start] = 0;",
    "  const queue = new Set(Object.keys(graph));",
    "  while (queue.size > 0) {",
    "    let u = null;",
    "    for (const v of queue) if (u === null || dist[v] < dist[u]) u = v;",
    "    queue.delete(u);",
    "    for (const [v, w] of graph[u]) {",
    "      const alt = dist[u] + w;",
    "      if (alt < dist[v]) {",
    "        dist[v] = alt;",
    "      }",
    "    }",
    "  }",
    "  return dist;",
    "}",
  ],
  ts: [
    "function dijkstra(graph: Record<string, [string, number][]>, start: string) {",
    "  const dist: Record<string, number> = {};",
    "  for (const v of Object.keys(graph)) dist[v] = Infinity;",
    "  dist[start] = 0;",
    "  const queue = new Set(Object.keys(graph));",
    "  while (queue.size > 0) {",
    "    let u: string | null = null;",
    "    for (const v of queue) if (u === null || dist[v]! < dist[u]!) u = v;",
    "    queue.delete(u!);",
    "    for (const [v, w] of graph[u!] ?? []) {",
    "      const alt = dist[u!]! + w;",
    "      if (alt < dist[v]!) {",
    "        dist[v] = alt;",
    "      }",
    "    }",
    "  }",
    "  return dist;",
    "}",
  ],
  py: [
    "def dijkstra(graph, start):",
    "    dist = {}",
    "    for v in graph: dist[v] = float('inf')",
    "    dist[start] = 0",
    "    queue = set(graph)",
    "    while queue:",
    "        u = min(queue, key=lambda v: dist[v])",
    "        queue.remove(u)",
    "        for v, w in graph[u]:",
    "            alt = dist[u] + w",
    "            if alt < dist[v]:",
    "                dist[v] = alt",
    "                prev[v] = u",
    "    return dist",
  ],
};

interface Graph {
  nodes: string[];
  edges: Array<{ from: string; to: string; weight?: number }>;
  weighted: boolean;
  adjacency: Map<string, string[]>;
}

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function fmt(d: number): string {
  return Number.isFinite(d) ? String(d) : "∞";
}

function buildFrame(
  graph: Graph,
  positions: Record<string, { x: number; y: number }>,
  nodeStates: Map<string, CellState>,
  edgeStates: Map<string, EdgeState>,
  dist: Map<string, number>,
  parent: Map<string, string>,
): GraphFrame {
  return {
    kind: "graph",
    directed: false,
    weighted: true,
    nodes: graph.nodes.map((id) => {
      const pos = positions[id] ?? { x: 50, y: 50 };
      const d = dist.get(id) ?? Infinity;
      return {
        id,
        label: id,
        x: pos.x,
        y: pos.y,
        state: nodeStates.get(id) ?? "idle",
        dist: Number.isFinite(d) ? d : null,
        parent: parent.get(id) ?? null,
      };
    }),
    edges: graph.edges.map((e) => ({
      from: e.from,
      to: e.to,
      weight: e.weight ?? 1,
      state: edgeStates.get(edgeKey(e.from, e.to)) ?? "idle",
    })),
  };
}

function auxFor(
  graph: Graph,
  dist: Map<string, number>,
  queue: string[],
  current: string | null,
): AuxPanel[] {
  return [
    {
      kind: "keyvalue",
      label: "Shortest distance so far",
      rows: graph.nodes.map((id) => ({
        k: id,
        v: fmt(dist.get(id) ?? Infinity),
        highlight: id === current,
      })),
    },
    {
      kind: "queue",
      label: "Priority queue (smallest distance first)",
      items: [...queue]
        .sort((a, b) => (dist.get(a) ?? Infinity) - (dist.get(b) ?? Infinity))
        .map((id) => ({
          id,
          label: `${id} (${fmt(dist.get(id) ?? Infinity)})`,
          state: id === current ? ("active" as CellState) : ("frontier" as CellState),
        })),
    },
  ];
}

function weightBetween(graph: Graph, a: string, b: string): number {
  const edge = graph.edges.find(
    (e) => (e.from === a && e.to === b) || (e.from === b && e.to === a),
  );
  return edge?.weight ?? 1;
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const graph = parsed["graph"] as Graph;
  const start = parsed["start"] as string;

  const positions = layeredLayout(graph.nodes, (id) => graph.adjacency.get(id) ?? [], [start]);
  const dist = new Map<string, number>();
  for (const id of graph.nodes) dist.set(id, Infinity);
  dist.set(start, 0);

  const nodeStates = new Map<string, CellState>();
  const edgeStates = new Map<string, EdgeState>();
  const parent = new Map<string, string>();
  const queue: string[] = [...graph.nodes];
  const b = new StepBuilder(PSEUDOCODE, CODE_BY_LANG, CODE_MAP);
  nodeStates.set(start, "frontier");

  b.emit({
    frame: buildFrame(graph, positions, nodeStates, edgeStates, dist, parent),
    aux: auxFor(graph, dist, queue, null),
    codeLine: 4,
    narration: `We say ${start} costs nothing to reach and every other node is unreachably far for now.`,
    detail:
      "Dijkstra always settles the closest unfinished node next, then relaxes the edges leaving it.",
    phase: "setup",
    isMilestone: true,
  });

  while (queue.length > 0) {
    let bestIndex = 0;
    for (let i = 1; i < queue.length; i += 1) {
      b.bump("comparisons");
      if ((dist.get(queue[i]!) ?? Infinity) < (dist.get(queue[bestIndex]!) ?? Infinity))
        bestIndex = i;
    }
    const u = queue[bestIndex]!;
    if (!Number.isFinite(dist.get(u) ?? Infinity)) {
      b.emit({
        frame: buildFrame(graph, positions, nodeStates, edgeStates, dist, parent),
        aux: auxFor(graph, dist, queue, null),
        codeLine: 6,
        narration: `Everything still in the queue is unreachable from ${start}, so there is nothing left to settle.`,
        phase: "done",
        isMilestone: true,
      });
      break;
    }

    queue.splice(bestIndex, 1);
    b.bump("settled");
    nodeStates.set(u, "active");

    b.emit({
      frame: buildFrame(graph, positions, nodeStates, edgeStates, dist, parent),
      aux: auxFor(graph, dist, queue, u),
      codeLine: 7,
      narration: `${u} is the closest node we have not settled yet, at a cost of ${fmt(dist.get(u) ?? Infinity)}.`,
      phase: "pick-closest",
      isMilestone: true,
    });

    for (const v of graph.adjacency.get(u) ?? []) {
      const key = edgeKey(u, v);
      const w = weightBetween(graph, u, v);
      const alt = (dist.get(u) ?? Infinity) + w;
      b.bump("edgesRelaxed");
      edgeStates.set(key, "active");

      if (alt < (dist.get(v) ?? Infinity)) {
        dist.set(v, alt);
        parent.set(v, u);
        b.bump("improvements");
        edgeStates.set(key, "tree");
        if (nodeStates.get(v) !== "visited") nodeStates.set(v, "frontier");
        b.emit({
          frame: buildFrame(graph, positions, nodeStates, edgeStates, dist, parent),
          aux: auxFor(graph, dist, queue, u),
          codeLine: 12,
          narration: `Going through ${u} reaches ${v} for only ${alt}, which beats the best route we knew.`,
          phase: "relax-edges",
        });
      } else {
        edgeStates.set(key, "rejected");
        b.emit({
          frame: buildFrame(graph, positions, nodeStates, edgeStates, dist, parent),
          aux: auxFor(graph, dist, queue, u),
          codeLine: 11,
          narration: `Going through ${u} would cost ${alt} to reach ${v}, which is no better than what we have.`,
          phase: "relax-edges",
        });
      }
    }

    nodeStates.set(u, "visited");
    b.emit({
      frame: buildFrame(graph, positions, nodeStates, edgeStates, dist, parent),
      aux: auxFor(graph, dist, queue, null),
      codeLine: 8,
      narration: `${u} is finished, because no later route can ever reach it more cheaply.`,
      phase: "settle",
    });
  }

  b.emit({
    frame: buildFrame(graph, positions, nodeStates, edgeStates, dist, parent),
    aux: auxFor(graph, dist, queue, null),
    codeLine: 14,
    narration: "Every reachable node now holds the cheapest cost of getting there from the start.",
    phase: "done",
    isMilestone: true,
  });

  const summary = graph.nodes.map((id) => `${id}=${fmt(dist.get(id) ?? Infinity)}`).join(", ");
  return b.finish(
    "dijkstra",
    `${graph.nodes.length} nodes, ${graph.edges.length} weighted edges, starting at ${start}`,
    `Shortest distances: ${summary}`,
  );
}

export const dijkstraModule: AlgorithmModule = {
  slug: "dijkstra",
  inputs: [
    {
      name: "graph",
      label: "Weighted edges",
      kind: "graph",
      default: "A-B:4, A-C:2, B-C:5, B-D:10, C-E:3, E-D:4, D-F:11",
      help: 'Every edge needs a weight, written as "A-B:4".',
    },
    { name: "start", label: "Start node", kind: "text", default: "A" },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const parsedGraph = parseEdgeList(raw["graph"] ?? "");
    if (!parsedGraph.ok) return { ok: false, error: parsedGraph.error };
    const graph = parsedGraph.graph;
    const missing = graph.edges.filter((e) => e.weight === undefined);
    if (missing.length > 0) {
      return {
        ok: false,
        error: `Dijkstra needs a weight on every edge — "${missing[0]!.from}-${missing[0]!.to}" has none. Write it as "${missing[0]!.from}-${missing[0]!.to}:4".`,
      };
    }
    const negative = graph.edges.find((e) => (e.weight ?? 0) < 0);
    if (negative) {
      return {
        ok: false,
        error: `Edge "${negative.from}-${negative.to}" has a negative weight, which Dijkstra cannot handle.`,
      };
    }
    const start = (raw["start"] ?? "").trim();
    if (start.length === 0)
      return { ok: false, error: "Enter the node the search should start from." };
    if (!graph.adjacency.has(start)) {
      return {
        ok: false,
        error: `"${start}" is not a node in this graph. Available nodes: ${graph.nodes.join(", ")}.`,
      };
    }
    return { ok: true, parsed: { graph, start } };
  },
  run,
  presets: [
    {
      label: "Textbook road map",
      values: { graph: "A-B:4, A-C:2, B-C:5, B-D:10, C-E:3, E-D:4, D-F:11", start: "A" },
    },
    {
      label: "Cheap detour beats direct road",
      values: { graph: "A-B:20, A-C:1, C-D:1, D-B:1", start: "A" },
    },
    {
      label: "Worst case: dense graph + unreachable island",
      values: {
        graph: "A-B:1, A-C:4, A-D:7, B-C:2, B-D:5, C-D:1, C-E:3, D-E:2, X-Y:6",
        start: "A",
      },
    },
  ],
};

export default dijkstraModule;
