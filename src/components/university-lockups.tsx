const TOPICS = [
  ["Arrays", "Arrays and strings"],
  ["Trees", "Trees and binary search trees"],
  ["Graphs", "Graphs and graph traversal"],
  ["Sorting", "Sorting algorithms"],
  ["DP", "Dynamic programming"],
] as const;

/** Curriculum topics only; this strip must never imply institutional endorsement. */
export function UniversityStrip({ label }: { label: string }) {
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-10 sm:px-8">
      <div className="mb-6 text-center font-sans text-sm text-muted-foreground">{label}</div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {TOPICS.map(([name, description]) => (
          <span
            key={name}
            aria-label={description}
            className="rounded-full border border-hairline bg-card px-4 py-2 font-mono text-[12px] text-muted-foreground"
          >
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}
