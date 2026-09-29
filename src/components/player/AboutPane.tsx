import * as React from "react";
import { Link } from "@tanstack/react-router";
import { getAlgorithm } from "@/content/algorithms";
import type { Algorithm } from "@/content/types";

export function AboutPane({ algo }: { algo: Algorithm }): React.ReactElement {
  const prereqs = algo.prerequisites
    .map((slug) => getAlgorithm(slug))
    .filter((a): a is Algorithm => Boolean(a));

  return (
    <div className="space-y-5 p-4">
      <section>
        <h2 className="t-mono-label mb-1.5">Summary</h2>
        <p className="t-body text-slate">{algo.summary}</p>
      </section>
      {/* Complexity, category and tags moved here from the old bottom strip. */}
      <section>
        <h2 className="t-mono-label mb-1.5">Complexity</h2>
        <dl className="grid grid-cols-2 gap-2">
          {[
            { k: "Time (avg)", v: algo.timeAvg },
            { k: "Time (worst)", v: algo.timeWorst },
            { k: "Space", v: algo.space },
            { k: "Category", v: algo.category },
          ].map((row) => (
            <div
              key={row.k}
              className="flex flex-col rounded-lg border border-hairline bg-paper px-3 py-2"
            >
              <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate">
                {row.k}
              </dt>
              <dd className="font-mono text-[13px] text-ink">{row.v}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section>
        <h2 className="t-mono-label mb-1.5">Tags</h2>
        <ul className="flex flex-wrap gap-2">
          {algo.tags.map((t) => (
            <li
              key={t}
              className="inline-flex rounded-full border border-hairline bg-card px-3 py-1 font-mono text-xs text-slate"
            >
              {t.replace(/-/g, " ")}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="t-mono-label mb-1.5">Real-world uses</h2>
        <ul className="space-y-1">
          {algo.realWorldUses.map((use) => (
            <li key={use} className="t-small text-slate">
              · {use}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="t-mono-label mb-1.5">Common mistakes</h2>
        <ul className="space-y-1">
          {algo.commonMistakes.map((m) => (
            <li key={m} className="t-small text-slate">
              · {m}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="t-mono-label mb-1.5">Prerequisites</h2>
        {prereqs.length === 0 ? (
          <p className="t-small text-slate">None — you can start here.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {prereqs.map((p) => (
              <li key={p.slug}>
                <Link
                  to="/algorithms/$slug"
                  params={{ slug: p.slug }}
                  className="inline-flex rounded-full border border-hairline bg-card px-3 py-1 font-mono text-xs text-ink hover:bg-tint"
                >
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="t-mono-label mb-1.5">When NOT to use this</h2>
        <p className="t-small text-slate">
          Reach for something else when the worst case {algo.timeWorst} is too slow for your input
          size, when the space cost {algo.space} is unacceptable, or when the data does not satisfy
          the assumptions this technique relies on ({algo.tags.join(", ")}).
        </p>
      </section>
    </div>
  );
}

export default AboutPane;
