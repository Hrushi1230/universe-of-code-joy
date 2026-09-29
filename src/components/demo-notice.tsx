export function DemoNotice({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="rounded-xl border border-primary/25 bg-primary-tint/60 px-3.5 py-3 font-mono text-[12px] leading-relaxed text-foreground/80"
    >
      <span className="font-semibold text-primary">Local preview:</span> {children}
    </div>
  );
}
