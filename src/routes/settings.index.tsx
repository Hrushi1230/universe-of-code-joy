import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Lock, Monitor, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppSidebar, AppWorkspaceBar } from "@/components/app-shell";
import { SettingsNav } from "@/components/settings-nav";
import useHydrated from "@/hooks/useHydrated";
import { normalizeLocalProfile, validateLocalProfile, type ProfileField } from "@/lib/profile";
import type { ProfileData } from "@/stores/prefsStore";
import { usePrefsStore } from "@/stores/prefsStore";
import { DemoNotice } from "@/components/demo-notice";

export const Route = createFileRoute("/settings/")({
  component: SettingsProfile,
  head: () => ({
    meta: [
      { title: "Account settings — profile & security — Algora" },
      {
        name: "description",
        content: "Update the local Algora preview profile stored on this device.",
      },
      { property: "og:title", content: "Account settings — profile & security — Algora" },
      {
        property: "og:description",
        content: "Manage the local Algora preview profile stored on this device.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Field({
  id,
  label,
  error,
  children,
}: {
  id: ProfileField;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="font-mono text-[12px] text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error && (
        <span id={`${id}-error`} className="mt-1.5 block font-mono text-[12px] text-error">
          {error}
        </span>
      )}
    </label>
  );
}

const editableInput =
  "flex h-11 w-full items-center rounded-xl border border-hairline bg-card px-3.5 font-mono text-[13.5px] text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary-tint";

function SettingsProfile() {
  const hydrated = useHydrated();
  const profile = usePrefsStore((s) => s.profile);
  const updateProfile = usePrefsStore((s) => s.updateProfile);

  /* ---- draft state (local copy for dirty tracking) ---- */
  const [draft, setDraft] = useState<ProfileData>(() => ({ ...profile }));
  const [showErrors, setShowErrors] = useState(false);

  /* Sync draft when store changes (e.g. after hydration) */
  useEffect(() => {
    if (hydrated) setDraft({ ...profile });
  }, [hydrated, profile]);

  const isDirty = useMemo(() => {
    if (!hydrated) return false;
    return (
      draft.fullName !== profile.fullName ||
      draft.username !== profile.username ||
      draft.email !== profile.email ||
      draft.country !== profile.country ||
      draft.bio !== profile.bio
    );
  }, [hydrated, draft, profile]);

  const errors = useMemo(() => validateLocalProfile(draft), [draft]);
  const hasErrors = Object.keys(errors).length > 0;

  const handleSave = useCallback(() => {
    setShowErrors(true);
    if (Object.keys(validateLocalProfile(draft)).length > 0) {
      toast.error("Check the highlighted profile fields");
      return;
    }
    const normalized = normalizeLocalProfile(draft);
    updateProfile(normalized);
    setDraft(normalized);
    setShowErrors(false);
    toast.success("Local profile saved", {
      description: "Changes are stored only on this device.",
    });
  }, [draft, updateProfile]);

  const handleCancel = useCallback(() => {
    setDraft({ ...profile });
    setShowErrors(false);
  }, [profile]);

  /* Display values — SSR-safe baseline, then real after hydration */
  const d = hydrated ? draft : { fullName: "—", username: "—", email: "—", country: "—", bio: "—" };
  const initials = hydrated
    ? profile.fullName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "—";

  return (
    <div className="flex min-h-screen w-full bg-background lg:h-screen lg:overflow-hidden">
      <AppSidebar active="Settings" collapsible />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppWorkspaceBar crumbs={["Settings"]} search />

        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-8 lg:flex-row lg:gap-5">
          <SettingsNav active="Profile" />

          <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-hairline bg-card">
            <div className="min-h-0 flex-1 px-4 pt-5 sm:px-7">
              <h1 className="text-[24px] font-semibold leading-none tracking-tight text-foreground">
                Profile
              </h1>

              <div className="mt-3">
                <DemoNotice>
                  Profile changes stay on this device. Passwords, two-factor protection, sessions,
                  and uploads are not connected.
                </DemoNotice>
              </div>

              {/* Avatar row */}
              <div className="mt-3.5 flex items-center gap-5 border-b border-hairline pb-3.5">
                <span className="flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-full bg-primary-tint font-mono text-[19px] text-primary">
                  {initials}
                </span>
                <div>
                  <button
                    type="button"
                    disabled
                    className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-xl border border-hairline bg-secondary/50 px-4 font-sans text-[14px] text-muted-foreground"
                  >
                    <Upload className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                    Photo upload coming soon
                  </button>
                  <p className="mt-2 font-mono text-[12px] text-muted-foreground">
                    No photo is selected or stored.
                  </p>
                </div>
              </div>

              {/* Fields */}
              <div className="mt-4 grid grid-cols-1 gap-x-7 gap-y-3.5 sm:grid-cols-2">
                <Field
                  id="fullName"
                  label="Full name"
                  error={showErrors ? errors.fullName : undefined}
                >
                  <input
                    id="fullName"
                    className={editableInput}
                    value={d.fullName}
                    onChange={(e) => setDraft((p) => ({ ...p, fullName: e.target.value }))}
                    disabled={!hydrated}
                    aria-invalid={showErrors && Boolean(errors.fullName)}
                    aria-describedby={showErrors && errors.fullName ? "fullName-error" : undefined}
                  />
                </Field>
                <Field
                  id="username"
                  label="Username"
                  error={showErrors ? errors.username : undefined}
                >
                  <input
                    id="username"
                    className={editableInput}
                    value={d.username}
                    onChange={(e) => setDraft((p) => ({ ...p, username: e.target.value }))}
                    disabled={!hydrated}
                    aria-invalid={showErrors && Boolean(errors.username)}
                    aria-describedby={showErrors && errors.username ? "username-error" : undefined}
                  />
                </Field>
                <Field
                  id="email"
                  label="Email (optional)"
                  error={showErrors ? errors.email : undefined}
                >
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    className={editableInput}
                    value={d.email}
                    onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))}
                    disabled={!hydrated}
                    aria-invalid={showErrors && Boolean(errors.email)}
                    aria-describedby={showErrors && errors.email ? "email-error" : undefined}
                  />
                </Field>
                <Field
                  id="country"
                  label="Country (optional)"
                  error={showErrors ? errors.country : undefined}
                >
                  <input
                    id="country"
                    className={editableInput}
                    value={d.country}
                    onChange={(e) => setDraft((p) => ({ ...p, country: e.target.value }))}
                    disabled={!hydrated}
                    aria-invalid={showErrors && Boolean(errors.country)}
                    aria-describedby={showErrors && errors.country ? "country-error" : undefined}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field
                    id="bio"
                    label={`Bio (optional) · ${d.bio.length}/240`}
                    error={showErrors ? errors.bio : undefined}
                  >
                    <textarea
                      id="bio"
                      className="min-h-[44px] w-full resize-none rounded-xl border border-hairline bg-card px-3.5 py-2.5 font-mono text-[13.5px] leading-[1.6] text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary-tint"
                      value={d.bio}
                      onChange={(e) => setDraft((p) => ({ ...p, bio: e.target.value }))}
                      rows={2}
                      maxLength={260}
                      disabled={!hydrated}
                      aria-invalid={showErrors && Boolean(errors.bio)}
                      aria-describedby={showErrors && errors.bio ? "bio-error" : undefined}
                    />
                  </Field>
                </div>
              </div>

              {/* Security preview */}
              <h2 className="mt-3.5 text-[19px] font-semibold leading-none tracking-tight text-foreground">
                Security preview
              </h2>
              <div className="mt-2.5 overflow-hidden rounded-xl border border-hairline">
                <div className="flex min-h-[40px] shrink-0 items-center gap-3 border-b border-hairline px-4">
                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                  <span className="text-[14px] text-foreground">Password</span>
                  <span className="ml-auto font-mono text-[12.5px] text-muted-foreground">
                    No password stored
                  </span>
                </div>
                <div className="flex min-h-[40px] shrink-0 items-center gap-3 border-b border-hairline px-4">
                  <ShieldCheck
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    strokeWidth={1.8}
                  />
                  <span className="text-[14px] text-foreground">Two-factor authentication</span>
                  <span className="ml-auto font-mono text-[12.5px] text-muted-foreground">
                    Not connected
                  </span>
                </div>
                <div className="flex min-h-[40px] shrink-0 items-center gap-3 px-4">
                  <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                  <span className="text-[14px] text-foreground">Active sessions</span>
                  <span className="ml-8 font-mono text-[13px] text-muted-foreground">
                    Not connected
                  </span>
                  <button
                    type="button"
                    disabled
                    className="ml-auto cursor-not-allowed font-sans text-[14px] text-muted-foreground"
                  >
                    Coming soon
                  </button>
                </div>
              </div>
            </div>

            {/* Sticky footer — only visible when dirty */}
            <div
              className={`mt-4 flex min-h-[68px] shrink-0 flex-col items-stretch justify-between gap-3 border-t border-hairline px-4 py-3 transition-opacity sm:flex-row sm:items-center sm:px-7 ${
                isDirty ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <span className="font-mono text-[13px] text-primary">Unsaved changes</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancel}
                  className="h-11 rounded-xl border border-hairline bg-card px-6 font-sans text-[14px] text-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={hasErrors && showErrors}
                  className="h-11 rounded-xl bg-primary px-6 font-sans text-[14px] font-medium text-primary-foreground hover:bg-primary-glow"
                >
                  Save changes
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
