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

/** Pseudocode -> listing line. `return order` sits past three closers in JS/TS. */
const CODE_MAP: CodeLineMap = {
  js: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 18],
  ts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 18],
};

const PSEUDOCODE: string[] = [
  "function bfs(graph, start)",
  "  seen <- { start }",
  "  order <- empty list",
  "  queue <- new Queue()",
  "  enqueue start",
  "  while queue is not empty",
  "    node <- dequeue()",
  "    append node to order",
  "    for each neighbour of node",
  "      if neighbour in seen",
  "        skip it",
  "      else",
  "        add neighbour to seen",
  "        enqueue neighbour",
  "  return order",
];

const CODE_BY_LANG: Record<"js" | "ts" | "py", string[]> = {
  js: [
    "function bfs(graph, start) {",
    "  const seen = new Set([start]);",
    "  const order = [];",
    "  const queue = [];",
    "  queue.push(start);",
    "  while (queue.length > 0) {",
    "    const node = queue.shift();",
    "    order.push(node);",
    "    for (const next of graph[node] ?? []) {",
    "      if (seen.has(next)) {",
    "        continue;",
    "      } else {",
    "        seen.add(next);",
    "        queue.push(next);",
    "      }",
    "    }",
    "  }",
    "  return order;",
    "}",
  ],
  ts: [
    "function bfs(graph: Record<string, string[]>, start: string): string[] {",
    "  const seen = new Set<string>([start]);",
    "  const order: string[] = [];",
    "  const queue: string[] = [];",
    "  queue.push(start);",
    "  while (queue.length > 0) {",
    "    const node = queue.shift()!;",
    "    order.push(node);",
    "    for (const next of graph[node] ?? []) {",
    "      if (seen.has(next)) {",
    "        continue;",
    "      } else {",
    "        seen.add(next);",
    "        queue.push(next);",
    "      }",
    "    }",
    "  }",
    "  return order;",
    "}",
  ],
  py: [
    "def bfs(graph, start):",
    "    seen = {start}",
    "    order = []",
    "    queue = deque()",
    "    queue.append(start)",
    "    while queue:",
    "        node = queue.popleft()",
    "        order.append(node)",
    "        for nxt in graph.get(node, []):",
    "            if nxt in seen:",
    "                continue",
    "            else:",
    "                seen.add(nxt)",
    "                queue.append(nxt)",
    "    return order",
  ],
};

interface ParsedEdge {
  from: string;
  to: string;
  weight?: number;
}

interface ParsedGraph {
  nodes: string[];
  edges: ParsedEdge[];
  weighted: boolean;
  adjacency: Map<string, string[]>;
}

export function parseEdgeList(
  raw: string,
): { ok: true; graph: ParsedGraph } | { ok: false; error: string } {
  const text = raw.trim();
  if (text.length === 0) {
    return { ok: false, error: 'Describe the graph as edges, for example "A-B, A-C, B-D".' };
  }

  const tokens = text
    .split(/[,\n;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (tokens.length === 0) {
    return { ok: false, error: 'Describe the graph as edges, for example "A-B, A-C, B-D".' };
  }

  const nodes: string[] = [];
  const edges: ParsedEdge[] = [];
  const adjacency = new Map<string, string[]>();
  let weighted = false;

  const addNode = (id: string): void => {
    if (!adjacency.has(id)) {
      adjacency.set(id, []);
      nodes.push(id);
    }
  };

  for (const token of tokens) {
    const [pair, weightPart, ...rest] = token.split(":");
    if (rest.length > 0) {
      return { ok: false, error: `"${token}" has too many colons. Use "A-B" or "A-B:4".` };
    }
    const parts = (pair ?? "").split("-").map((p) => p.trim());
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return { ok: false, error: `"${token}" is not a valid edge. Write it as "A-B" or "A-B:4".` };
    }
    const [from, to] = parts as [string, string];
    if (from === to) {
      return { ok: false, error: `"${token}" connects ${from} to itself, which BFS cannot use.` };
    }

    let weight: number | undefined;
    if (weightPart !== undefined) {
      const trimmed = weightPart.trim();
      const value = Number(trimmed);
      if (trimmed.length === 0 || !Number.isFinite(value)) {
        return {
          ok: false,
          error: `"${trimmed}" is not a valid weight in "${token}". Use a number like 4.`,
        };
      }
      weight = value;
      weighted = true;
    }

    addNode(from);
    addNode(to);
    if (nodes.length > MAX_NODES) {
      return {
        ok: false,
        error: `That graph has more than ${MAX_NODES} nodes — please use a smaller one.`,
      };
    }

    const already = adjacency.get(from)!.includes(to);
    if (!already) {
      adjacency.get(from)!.push(to);
      adjacency.get(to)!.push(from);
      const edge: ParsedEdge = { from, to };
      if (weight !== undefined) edge.weight = weight;
      edges.push(edge);
      if (edges.length > MAX_EDGES) {
        return {
          ok: false,
          error: `That graph has more than ${MAX_EDGES} edges — please use a smaller one.`,
        };
      }
    }
  }

  return { ok: true, graph: { nodes, edges, weighted, adjacency } };
}

interface RenderState {
  nodeStates: Map<string, CellState>;
  dist: Map<string, number>;
  edgeStates: Map<string, EdgeState>;
}

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function buildFrame(
  graph: ParsedGraph,
  positions: Record<string, { x: number; y: number }>,
  state: RenderState,
): GraphFrame {
  return {
    kind: "graph",
    directed: false,
    weighted: graph.weighted,
    nodes: graph.nodes.map((id) => {
      const pos = positions[id] ?? { x: 50, y: 50 };
      const depth = state.dist.get(id);
      const node: GraphFrame["nodes"][number] = {
        id,
        label: id,
        x: pos.x,
        y: pos.y,
        state: state.nodeStates.get(id) ?? "idle",
      };
      if (depth !== undefined) {
        node.dist = depth;
        node.badge = `L${depth}`;
      }
      return node;
    }),
    edges: graph.edges.map((e) => {
      const edge: GraphFrame["edges"][number] = {
        from: e.from,
        to: e.to,
        state: state.edgeStates.get(edgeKey(e.from, e.to)) ?? "idle",
      };
      if (e.weight !== undefined) edge.weight = e.weight;
      return edge;
    }),
  };
}

function buildAux(queue: string[], order: string[]): AuxPanel[] {
  return [
    {
      kind: "queue",
      label: "Queue (first in, first out)",
      items: queue.map((id, index) => ({
        id,
        label: id,
        state: index === 0 ? ("active" as CellState) : ("frontier" as CellState),
      })),
    },
    {
      kind: "log",
      label: "Visit order",
      lines: order.length > 0 ? order.map((id, i) => `${i + 1}. ${id}`) : ["nothing visited yet"],
    },
  ];
}

function run(parsed: Record<string, unknown>): AlgorithmRun {
  const graph = parsed["graph"] as ParsedGraph;
  const start = parsed["start"] as string;

  const positions = layeredLayout(graph.nodes, (id) => graph.adjacency.get(id) ?? [], [start]);
  const state: RenderState = { nodeStates: new Map(), dist: new Map(), edgeStates: new Map() };
  const b = new StepBuilder(PSEUDOCODE, CODE_BY_LANG, CODE_MAP);

  const queue: string[] = [start];
  const order: string[] = [];
  const seen = new Set<string>([start]);
  state.nodeStates.set(start, "frontier");
  state.dist.set(start, 0);
  b.bump("enqueues");

  b.emit({
    frame: buildFrame(graph, positions, state),
    aux: buildAux(queue, order),
    codeLine: 5,
    narration: `We drop the starting node ${start} into the queue, because that is where the search begins.`,
    detail:
      "Breadth-first search fans out one ring of neighbours at a time, so the queue keeps everything in order.",
    phase: "setup",
    isMilestone: true,
  });

  while (queue.length > 0) {
    const node = queue.shift()!;
    b.bump("dequeues");
    state.nodeStates.set(node, "active");
    order.push(node);

    b.emit({
      frame: buildFrame(graph, positions, state),
      aux: buildAux(queue, order),
      codeLine: 7,
      narration: `We take ${node} off the front of the queue and make it the node we are looking at right now.`,
      phase: "dequeue",
      isMilestone: true,
    });

    for (const next of graph.adjacency.get(node) ?? []) {
      b.bump("edgesExamined");
      const key = edgeKey(node, next);

      if (seen.has(next)) {
        state.edgeStates.set(key, "rejected");
        b.emit({
          frame: buildFrame(graph, positions, state),
          aux: buildAux(queue, order),
          codeLine: 11,
          narration: `${next} has already been met before, so we ignore this connection and move on.`,
          phase: "skip",
        });
        continue;
      }

      seen.add(next);
      state.edgeStates.set(key, "tree");
      state.dist.set(next, (state.dist.get(node) ?? 0) + 1);
      state.nodeStates.set(next, "frontier");
      queue.push(next);
      b.bump("enqueues");

      b.emit({
        frame: buildFrame(graph, positions, state),
        aux: buildAux(queue, order),
        codeLine: 14,
        narration: `${next} is brand new, so we mark it as discovered and line it up in the queue for later.`,
        phase: "discover",
      });
    }

    state.nodeStates.set(node, "visited");
    b.emit({
      frame: buildFrame(graph, positions, state),
      aux: buildAux(queue, order),
      codeLine: 6,
      narration: `Every connection out of ${node} has been checked, so ${node} is completely finished.`,
      phase: "finish-node",
    });
  }

  const unreached = graph.nodes.filter((id) => !seen.has(id));
  b.emit({
    frame: buildFrame(graph, positions, state),
    aux: buildAux(queue, order),
    codeLine: 15,
    narration:
      unreached.length > 0
        ? `The queue is empty, and ${unreached.join(", ")} could never be reached from ${start}.`
        : `The queue is empty, which means every node has been visited in ring-by-ring order.`,
    phase: "done",
    isMilestone: true,
  });

  return b.finish(
    "bfs",
    `${graph.nodes.length} nodes, ${graph.edges.length} edges, starting at ${start}`,
    `Visit order: ${order.join(" → ")}`,
  );
}

export const bfsModule: AlgorithmModule = {
  slug: "bfs",
  inputs: [
    {
      name: "graph",
      label: "Edges",
      kind: "graph",
      default: "A-B, A-C, B-D, B-E, C-F, E-G",
      help: 'One edge per pair, like "A-B". Add a weight with "A-B:4".',
    },
    { name: "start", label: "Start node", kind: "text", default: "A" },
  ],
  validate(raw: Record<string, string>): ValidationResult {
    const parsedGraph = parseEdgeList(raw["graph"] ?? "");
    if (!parsedGraph.ok) return { ok: false, error: parsedGraph.error };
    const start = (raw["start"] ?? "").trim();
    if (start.length === 0)
      return { ok: false, error: "Enter the node the search should start from." };
    if (!parsedGraph.graph.adjacency.has(start)) {
      return {
        ok: false,
        error: `"${start}" is not a node in this graph. Available nodes: ${parsedGraph.graph.nodes.join(", ")}.`,
      };
    }
    return { ok: true, parsed: { graph: parsedGraph.graph, start } };
  },
  run,
  presets: [
    { label: "Balanced tree", values: { graph: "A-B, A-C, B-D, B-E, C-F, E-G", start: "A" } },
    {
      label: "Cycles & shortcuts",
      values: { graph: "A-B, A-C, B-C, B-D, C-D, D-E, E-A", start: "A" },
    },
    {
      label: "Worst case: long chain + island",
      values: { graph: "A-B, B-C, C-D, D-E, E-F, F-G, G-H, X-Y", start: "A" },
    },
  ],
};

export default bfsModule;
