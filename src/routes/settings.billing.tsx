import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CreditCard, FileText, ShieldCheck } from "lucide-react";
import { AppSidebar, AppWorkspaceBar } from "@/components/app-shell";
import { DemoNotice } from "@/components/demo-notice";
import { SettingsNav } from "@/components/settings-nav";
import useHydrated from "@/hooks/useHydrated";
import { baselineProgress, useProgressStore } from "@/stores/progressStore";

export const Route = createFileRoute("/settings/billing")({
  component: Billing,
  head: () => ({
    meta: [
      { title: "Billing availability — Algora" },
      {
        name: "description",
        content: "Review local usage and the current availability of Algora billing services.",
      },
      { property: "og:title", content: "Billing availability — Algora" },
      {
        property: "og:description",
        content: "Payments, subscriptions, and invoices are not connected in this frontend build.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function UsageRow({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-[13px] text-foreground">{label}</span>
        <span className="font-mono text-[13px] text-foreground">{value}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Billing() {
  const hydrated = useHydrated();
  const liveProgress = useProgressStore((state) => state);
  const progress = hydrated ? liveProgress : baselineProgress;

  const totalSteps = useMemo(
    () => Object.values(progress.algorithms).reduce((sum, item) => sum + item.stepsWatched, 0),
    [progress.algorithms],
  );
  const solved = useMemo(
    () => Object.values(progress.problems).filter((item) => Boolean(item.solvedAt)).length,
    [progress.problems],
  );
  const completedLessons = useMemo(
    () => Object.values(progress.lessons).filter((item) => Boolean(item.completedAt)).length,
    [progress.lessons],
  );

  return (
    <div className="flex min-h-screen w-full bg-background lg:h-screen lg:overflow-hidden">
      <AppSidebar active="Settings" collapsible />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppWorkspaceBar crumbs={["Settings", "Billing"]} search />

        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-8 lg:flex-row lg:gap-5">
          <SettingsNav active="Billing" />

          <section className="min-w-0 flex-1">
            <h1 className="text-[26px] font-semibold leading-none tracking-tight text-foreground">
              Subscription &amp; billing
            </h1>
            <p className="mt-2 font-mono text-[13px] text-muted-foreground">
              Local access and service availability.
            </p>

            <div className="mt-3">
              <DemoNotice>
                Algora currently has no connected checkout, subscription, payment method, invoice,
                cancellation, or entitlement service in this frontend build.
              </DemoNotice>
            </div>

            <div className="relative mt-4 overflow-hidden rounded-2xl border border-hairline bg-card p-5 sm:p-6">
              <span className="absolute left-0 top-0 h-full w-1 bg-primary" aria-hidden="true" />
              <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-primary px-2.5 py-1 font-mono text-[13px] text-primary-foreground">
                      Local
                    </span>
                    <span className="text-[19px] font-semibold text-foreground">Free access</span>
                  </div>
                  <p className="mt-3 max-w-2xl font-mono text-[12.5px] leading-relaxed text-muted-foreground">
                    This label describes the current frontend experience only. It is not a paid
                    subscription and does not grant server-verified entitlements.
                  </p>
                </div>
                <Link
                  to="/pricing"
                  className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-hairline bg-card px-5 text-[14px] text-foreground hover:bg-secondary"
                >
                  View plan information <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="rounded-2xl border border-hairline bg-card p-5 sm:p-6">
                <h2 className="text-[17px] font-semibold text-foreground">Billing actions</h2>
                <p className="mt-1 font-mono text-[12.5px] text-muted-foreground">
                  Unavailable controls remain visible so the future service contract is explicit.
                </p>

                <div className="mt-4 overflow-hidden rounded-xl border border-hairline">
                  {[
                    {
                      icon: ShieldCheck,
                      title: "Subscription",
                      detail: "No active subscription or renewal date",
                    },
                    {
                      icon: CreditCard,
                      title: "Payment method",
                      detail: "No card or billing profile stored",
                    },
                    {
                      icon: FileText,
                      title: "Invoices",
                      detail: "No invoice records available",
                    },
                  ].map(({ icon: Icon, title, detail }) => (
                    <div
                      key={title}
                      className="flex flex-col gap-3 border-b border-hairline px-4 py-4 last:border-0 sm:flex-row sm:items-center"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary">
                        <Icon className="h-5 w-5" strokeWidth={1.7} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-medium text-foreground">{title}</div>
                        <div className="mt-0.5 font-mono text-[12px] text-muted-foreground">
                          {detail}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled
                        className="h-10 cursor-not-allowed rounded-xl border border-hairline bg-secondary/50 px-4 text-[13px] text-muted-foreground"
                      >
                        Not connected
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-2xl border border-hairline bg-card p-5 sm:p-6">
                <h2 className="text-[17px] font-semibold text-foreground">Local usage</h2>
                <p className="mt-1 font-mono text-[12px] leading-relaxed text-muted-foreground">
                  Derived from this device, not a billing meter.
                </p>
                <div className="mt-5 space-y-5">
                  <UsageRow
                    label="Active paths"
                    value={progress.activePathSlug ? "1" : "0"}
                    pct={progress.activePathSlug ? 100 : 0}
                  />
                  <UsageRow
                    label="Visualizer steps"
                    value={String(totalSteps)}
                    pct={Math.min((totalSteps / 500) * 100, 100)}
                  />
                  <UsageRow
                    label="Lessons completed"
                    value={String(completedLessons)}
                    pct={Math.min((completedLessons / 30) * 100, 100)}
                  />
                  <UsageRow
                    label="Problems solved"
                    value={String(solved)}
                    pct={Math.min((solved / 56) * 100, 100)}
                  />
                </div>
              </aside>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
