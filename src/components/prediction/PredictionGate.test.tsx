import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PredictionGate } from "@/components/prediction";
import type { Prediction } from "@/lib/prediction";
import {
  createPredictionStore,
  EMPTY_ENTRY,
  PredictionStoreProvider,
} from "@/stores/predictionStore";

const prediction: Prediction = {
  id: "contract-checkpoint",
  question: "Which boundary moves next?",
  context: ["16 < 23"],
  options: [
    { id: "move-low", label: "low = mid + 1" },
    { id: "move-high", label: "high = mid - 1" },
    { id: "return-mid", label: "return mid" },
    { id: "not-found", label: "target not found" },
  ],
  correctOptionId: "move-low",
  explanation: "The lower boundary moves past mid.",
  misconceptionFeedback: {
    "move-low": "Correct boundary.",
    "move-high": "That would discard the larger values.",
    "return-mid": "The target does not equal the midpoint.",
    "not-found": "Candidates remain.",
  },
  accessiblePrompt: "Predict the next boundary after 16 is less than 23.",
};

function renderGate(entry = EMPTY_ENTRY): string {
  const store = createPredictionStore();
  return renderToStaticMarkup(
    <PredictionStoreProvider store={store}>
      <PredictionGate prediction={prediction} entry={entry} />
    </PredictionStoreProvider>,
  );
}

describe("PredictionGate shared interaction contract", () => {
  it("renders the shared accessible choice group while unresolved", () => {
    const markup = renderGate();
    expect(markup).toContain('role="radiogroup"');
    expect(markup).toContain('name="prediction-contract-checkpoint"');
    expect(markup).toContain("low = mid + 1");
    expect(markup).toContain("Check answer");
  });

  it("renders shared focused feedback after an incorrect answer", () => {
    const markup = renderGate({
      status: "incorrect",
      selectedOptionId: "move-high",
      attempts: 1,
      continued: false,
    });
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('tabindex="-1"');
    expect(markup).toContain("Not quite.");
    expect(markup).toContain("That would discard the larger values.");
  });

  it("keeps resolved feedback on the same step until Continue", () => {
    const markup = renderGate({
      status: "correct",
      selectedOptionId: "move-low",
      attempts: 1,
      outcome: "correct-first-try",
      continued: false,
    });

    expect(markup).toContain("The lower boundary moves past mid.");
    expect(markup).toContain("Continue");
    expect(markup).not.toContain('role="radiogroup"');
  });
});
