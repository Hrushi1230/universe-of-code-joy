import { StepBuilder } from "@/engine/builder";
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

const MAX_NODES = 10;
const MAX_EDGES = 16;

/**
 * Pseudocode -> listing line. Both listings count in-degrees with a nested
 * loop the pseudocode states as one line, so everything after shifts.
 */
const CODE_MAP: CodeLineMap = {
  js: [1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 13, 16, 16, 17],
  ts: [1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 13, 16, 16, 17],
  py: [1, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
};

const PSEUDOCODE: string[] = [
  "function topologicalSort(graph)",
  "  for each node v",
  "    inDegree[v] <- number of arrows into v",
  "  queue <- all nodes with inDegree = 0",
  "  order <- empty list",
  "  while queue is not empty",
  "    u <- dequeue()",
  "    append u to order",
  "    for each node v that u points to",
  "      inDegree[v] <- inDegree[v] - 1",
  "      if inDegree[v] = 0",
  "        enqueue v",
  "  if size(order) < node count",
  "    report a cycle",
  "  return order",
];

const CODE_BY_LANG: Record<"js" | "ts" | "py", string[]> = {
  js: [
    "function topologicalSort(graph) {",
    "  const inDegree = {};",
    "  for (const v of Object.keys(graph)) inDegree[v] ??= 0;",
    "  for (const u of Object.keys(graph))",
    "    for (const v of graph[u]) inDegree[v] = (inDegree[v] ?? 0) + 1;",
    "  const queue = Object.keys(inDegree).filter((v) => inDegree[v] === 0);",
    "  const order = [];",
    "  while (queue.length > 0) {",
    "    const u = queue.shift();",
    "    order.push(u);",
    "    for (const v of graph[u] ?? []) {",
    "      inDegree[v] -= 1;",
    "      if (inDegree[v] === 0) queue.push(v);",
    "    }",
    "  }",
    "  if (order.length < Object.keys(inDegree).length) throw new Error('cycle');",
    "  return order;",
    "}",
  ],
  ts: [
    "function topologicalSort(graph: Record<string, string[]>): string[] {",
    "  const inDegree: Record<string, number> = {};",
    "  for (const v of Object.keys(graph)) inDegree[v] ??= 0;",
    "  for (const u of Object.keys(graph))",
    "    for (const v of graph[u]!) inDegree[v] = (inDegree[v] ?? 0) + 1;",
    "  const queue = Object.keys(inDegree).filter((v) => inDegree[v] === 0);",
    "  const order: string[] = [];",
    "  while (queue.length > 0) {",
    "    const u = queue.shift()!;",
    "    order.push(u);",
    "    for (const v of graph[u] ?? []) {",
    "      inDegree[v] = inDegree[v]! - 1;",
    "      if (inDegree[v] === 0) queue.push(v);",
    "    }",
    "  }",
    "  if (order.length < Object.keys(inDegree).length) throw new Error('cycle');",
    "  return order;",
    "}",
  ],
  py: [
    "def topological_sort(graph):",
    "    in_degree = {v: 0 for v in graph}",
    "    for u in graph:",
    "        for v in graph[u]:",
    "            in_degree[v] = in_degree.get(v, 0) + 1",
    "    queue = deque(v for v in in_degree if in_degree[v] == 0)",
    "    order = []",
    "    while queue:",
    "        u = queue.popleft()",
    "        order.append(u)",
    "        for v in graph.get(u, []):",
    "            in_degree[v] -= 1",
    "            if in_degree[v] == 0:",
    "                queue.append(v)",
    "    if len(order) < len(in_degree):",
    "        raise ValueError('cycle')",
    "    return order",
  ],
};

interface DirectedGraph {
  nodes: string[];
  edges: Array<{ from: string; to: string }>;
  out: Map<string, string[]>;
}

export function parseDirectedEdges(
  raw: string,
): { ok: true; graph: DirectedGraph } | { ok: false; error: string } {
  const text = raw.trim();
  if (text.length === 0) {
    return {
      ok: false,
      error: 'Describe the dependencies as arrows, for example "A>B, A>C, B>D".',
    };
  }
  const tokens = text
    .split(/[,\n;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const nodes: string[] = [];
  const edges: Array<{ from: string; to: string }> = [];
  const out = new Map<string, string[]>();
  const addNode = (id: string): void => {
    if (!out.has(id)) {
      out.set(id, []);
      nodes.push(id);
    }
  };

  for (const token of tokens) {
    const parts = token.split(/->|>/).map((p) => p.trim());
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return {
        ok: false,
        error: `"${token}" is not a valid arrow. Write it as "A>B" (A must come before B).`,
      };
    }
    const [from, to] = parts as [string, string];
    if (from === to) {
      return {
        ok: false,
        error: `"${token}" points ${from} at itself, which can never be ordered.`,
      };
    }
    addNode(from);
    addNode(to);
    if (nodes.length > MAX_NODES) {
      return {
        ok: false,
        error: `That graph has more than ${MAX_NODES} nodes — please use a smaller one.`,
      };
    }
    if (!out.get(from)!.includes(to)) {
      out.get(from)!.push(to);
      edges.push({ from, to });
      if (edges.length > MAX_EDGES) {
        return {
          ok: false,
          error: `That graph has more than ${MAX_EDGES} arrows — please use a smaller one.`,
        };
      }
    }
  }

  return { ok: true, graph: { nodes, edges, out } };
}

function inDegreesOf(graph: DirectedGraph): Map<string, number> {
  const deg = new Map<string, number>();
  for (const id of graph.nodes) deg.set(id, 0);
  for (const e of graph.edges) deg.set(e.to, (deg.get(e.to) ?? 0) + 1);
  return deg;
}

function hasCycle(graph: DirectedGraph): boolean {
  const deg = inDegreesOf(graph);
  const queue = graph.nodes.filter((id) => (deg.get(id) ?? 0) === 0);
  let removed = 0;
  while (queue.length > 0) {
    const u = queue.shift()!;
    removed += 1;
    for (const v of graph.out.get(u) ?? []) {
      const next = (deg.get(v) ?? 0) - 1;
      deg.set(v, next);
      if (next === 0) queue.push(v);
    }
  }
  return removed < graph.nodes.length;
}

function buildFrame(
  graph: DirectedGraph,
  positions: Record<string, { x: number; y: number }>,
  states: Map<string, CellState>,
  edgeStates: Map<string, EdgeState>,
  deg: Map<string, number>,
): GraphFrame {
  return {
    kind: "graph",
    directed: true,
    weighted: false,
    nodes: graph.nodes.map((id) => {
      const pos = positions[id] ?? { x: 50, y: 50 };
      return {
        id,
        label: id,
        x: pos.x,
        y: pos.y,
        state: states.get(id) ?? "idle",
        indegree: deg.get(id) ?? 0,
      };
    }),
    edges: graph.edges.map((e) => ({
      from: e.from,
      to: e.to,
      state: edgeStates.get(`${e.from}>${e.to}`) ?? "idle",
    })),
  };
}

function auxFor(queue: string[], order: string[]): AuxPanel[] {
  return [
    {
      kind: "queue",
      label: "Ready to go (in-degree 0)",
      items: queue.map((id, index) => ({
        id,
        label: id,
        state: index === 0 ? ("active" as CellState) : ("frontier" as CellState),
      })),
    },
    {
      kind: "log",
      label: "Order so far",
      lines: order.length > 0 ? order.map((id, i) => `${i + 1}. ${id}`) : ["nothing ordered yet"],
    },
  ];
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const graph = parsed["graph"] as DirectedGraph;
  const deg = inDegreesOf(graph);
  const positions = layeredLayout(
    graph.nodes,
    (id) => graph.out.get(id) ?? [],
    graph.nodes.filter((id) => (deg.get(id) ?? 0) === 0),
  );
  const states = new Map<string, CellState>();
  const edgeStates = new Map<string, EdgeState>();
  const queue: string[] = graph.nodes.filter((id) => (deg.get(id) ?? 0) === 0);
  const order: string[] = [];
  const b = new StepBuilder(PSEUDOCODE, CODE_BY_LANG, CODE_MAP);

  for (const id of queue) states.set(id, "frontier");

  b.emit({
    frame: buildFrame(graph, positions, states, edgeStates, deg),
    aux: auxFor(queue, order),
    codeLine: 4,
    narration: `We count the arrows pointing into each node, and ${queue.join(", ")} start with none.`,
    detail:
      "A topological order lists every task after everything it depends on, peeling off free tasks first.",
    phase: "setup",
    isMilestone: true,
  });

  while (queue.length > 0) {
    const u = queue.shift()!;
    b.bump("peels");
    states.set(u, "active");
    order.push(u);

    b.emit({
      frame: buildFrame(graph, positions, states, edgeStates, deg),
      aux: auxFor(queue, order),
      codeLine: 8,
      narration: `${u} has nothing left waiting on it, so it can safely go next in the order.`,
      phase: "peel",
      isMilestone: true,
    });

    for (const v of graph.out.get(u) ?? []) {
      b.bump("edgesRemoved");
      deg.set(v, (deg.get(v) ?? 0) - 1);
      edgeStates.set(`${u}>${v}`, "tree");
      b.emit({
        frame: buildFrame(graph, positions, states, edgeStates, deg),
        aux: auxFor(queue, order),
        codeLine: 10,
        narration: `${v} loses one dependency, so it now waits on ${deg.get(v) ?? 0} other node(s).`,
        phase: "relax",
      });

      if ((deg.get(v) ?? 0) === 0) {
        queue.push(v);
        states.set(v, "frontier");
        b.emit({
          frame: buildFrame(graph, positions, states, edgeStates, deg),
          aux: auxFor(queue, order),
          codeLine: 12,
          narration: `${v} is free of dependencies now, so it joins the ready queue.`,
          phase: "peel",
        });
      }
    }

    states.set(u, "visited");
    b.emit({
      frame: buildFrame(graph, positions, states, edgeStates, deg),
      aux: auxFor(queue, order),
      codeLine: 6,
      narration: `${u} is fully placed, so we look at whatever is ready next.`,
      phase: "peel",
    });
  }

  const stuck = graph.nodes.filter((id) => !order.includes(id));
  b.emit({
    frame: buildFrame(graph, positions, states, edgeStates, deg),
    aux: auxFor(queue, order),
    codeLine: stuck.length > 0 ? 14 : 15,
    narration:
      stuck.length > 0
        ? `${stuck.join(", ")} can never become free, which means the arrows form a cycle.`
        : "Every node has been placed, so we have a valid order that respects all the arrows.",
    phase: "done",
    isMilestone: true,
  });

  return b.finish(
    "topological-sort",
    `${graph.nodes.length} nodes, ${graph.edges.length} arrows`,
    stuck.length > 0 ? `Cycle detected around ${stuck.join(", ")}` : `Order: ${order.join(" → ")}`,
  );
}

export const topologicalSortModule: AlgorithmModule = {
  slug: "topological-sort",
  inputs: [
    {
      name: "graph",
      label: "Dependencies",
      kind: "graph",
      default: "A>C, B>C, C>D, C>E, D>F, E>F",
      help: '"A>B" means A has to come before B.',
    },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const parsedGraph = parseDirectedEdges(raw["graph"] ?? "");
    if (!parsedGraph.ok) return { ok: false, error: parsedGraph.error };
    if (hasCycle(parsedGraph.graph)) {
      return {
        ok: false,
        error:
          "These arrows loop back on themselves, so no valid order exists. Remove one arrow from the cycle.",
      };
    }
    return { ok: true, parsed: { graph: parsedGraph.graph } };
  },
  run,
  presets: [
    { label: "Course prerequisites", values: { graph: "A>C, B>C, C>D, C>E, D>F, E>F" } },
    { label: "Two independent chains", values: { graph: "A>B, B>C, X>Y, Y>Z" } },
    {
      label: "Worst case: one long chain",
      values: { graph: "A>B, B>C, C>D, D>E, E>F, F>G, G>H, H>I" },
    },
  ],
};

export default topologicalSortModule;
