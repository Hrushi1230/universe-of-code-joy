import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AboutPane } from "@/components/player/AboutPane";
import { CodePane } from "@/components/player/CodePane";
import { ExplainPane } from "@/components/player/ExplainPane";
import { InputPane } from "@/components/player/InputPane";
import { getAlgorithm } from "@/content/algorithms";
import { getModule } from "@/engine/registry";
import { createPlayerStore, PlayerStoreProvider } from "@/stores/playerStore";

function loadedPlayer(children: React.ReactNode): string {
  const store = createPlayerStore();
  store.getState().load("binary-search");
  const loaded = store.getState();
  store.getInitialState = () => loaded;
  return renderToStaticMarkup(<PlayerStoreProvider store={store}>{children}</PlayerStoreProvider>);
}

describe("extracted player panes", () => {
  it("renders CodePane from the canonical player run", () => {
    const markup = loadedPlayer(<CodePane />);
    expect(markup).toContain("Code (JavaScript)");
    expect(markup).toContain("binarySearch");
  });

  it("renders ExplainPane from the same canonical step", () => {
    const markup = loadedPlayer(<ExplainPane />);
    expect(markup).toContain("Reasoning");
    expect(markup).toContain("Step 1 /");
  });

  it("renders InputPane from its narrow module and slug inputs", () => {
    const mod = getModule("binary-search")!;
    const markup = loadedPlayer(<InputPane module={mod} slug={mod.slug} />);
    expect(markup).toContain("Run");
    expect(markup).toContain("Randomize");
    expect(markup).toContain("Target");
  });

  it("renders AboutPane from algorithm content without player state", () => {
    const algo = getAlgorithm("binary-search")!;
    const markup = renderToStaticMarkup(<AboutPane algo={algo} />);
    expect(markup).toContain("Summary");
    expect(markup).toContain(algo.summary);
  });
});
