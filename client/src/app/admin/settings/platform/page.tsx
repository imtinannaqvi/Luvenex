"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { FiSettings, FiTool, FiUserX, FiStar, FiShield } from "react-icons/fi";

const SECTIONS = [
  { key: "behavior", label: "Platform Behavior", icon: FiSettings },
  { key: "maintenance", label: "Scheduled Maintenance", icon: FiTool },
  { key: "deactivation", label: "Account Deactivation", icon: FiUserX },
  { key: "reviews", label: "Review & Rating Flags", icon: FiStar },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

function SectionHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-5 border-b border-line bg-surface/40">
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="text-lg font-bold italic text-foreground">{title}</h2>
        <p className="text-xs text-muted mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-primary" : "bg-line"
      }`}
    >
      <span
        className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <div className="px-6 py-4 border-t border-line bg-surface/30 flex justify-end">
      <button
        onClick={onClick}
        disabled={saving}
        className="px-6 py-2.5 rounded-xl bg-primary text-foreground text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50 shadow-sm"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>("behavior");

  useEffect(() => {
    apiFetch("/api/settings", { token: getToken()! })
      .then((data: any) => setSettings(data.settings))
      .catch((err: any) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const update = (key: string, value: any) =>
    setSettings((prev: any) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        kycRequired: settings.kycRequired,
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
        maintenanceStartAt: settings.maintenanceStartAt,
        maintenanceEndAt: settings.maintenanceEndAt,
        deactivationReasonRequired: settings.deactivationReasonRequired,
        lowRatingFlagEnabled: settings.lowRatingFlagEnabled,
        lowRatingThreshold: settings.lowRatingThreshold,
        singleReviewFlagRating: settings.singleReviewFlagRating,
      };
      const data = await apiFetch("/api/settings", {
        method: "PATCH",
        token: getToken()!,
        body,
      });
      setSettings(data.settings);
      toast.success("Settings updated");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground italic">Platform Settings</h1>
        <p className="text-sm text-muted mt-1">
          Site-wide behavior, downtime, and automatic review flags.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6 p-1.5 bg-surface border border-line rounded-sm overflow-x-auto">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isActive = activeSection === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-sm transition whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-background text-foreground shadow-sm border border-line"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Icon size={13} />
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="bg-background border border-line rounded-sm overflow-hidden">
        {activeSection === "behavior" && (
          <>
            <SectionHeader
              title="Platform Behavior"
              subtitle="Global toggles affecting the entire site"
              icon={<FiSettings size={17} />}
            />
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between gap-4 p-4 rounded-sm border border-line bg-surface/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FiShield size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Require KYC for withdrawals
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Users must verify identity before cashing out.
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={settings.kycRequired ?? false}
                  onChange={(v) => update("kycRequired", v)}
                />
              </div>

              <div className="px-4 py-3 rounded-sm bg-primary/5 border border-primary/10">
                <p className="text-[11px] text-muted">
                  Site-wide banners moved to Settings &rarr; Announcements, where you can target
                  them by audience and set an expiry date.
                </p>
              </div>
            </div>
            <SaveButton onClick={handleSave} saving={saving} />
          </>
        )}

        {activeSection === "maintenance" && (
          <>
            <SectionHeader
              title="Scheduled Maintenance"
              subtitle="Take the site offline on a schedule with a custom message"
              icon={<FiTool size={17} />}
            />
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-4 p-4 rounded-sm border border-line bg-surface/30">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Maintenance mode</p>
                  <p className="text-xs text-muted mt-0.5">
                    Everyone except admins sees the message below.
                  </p>
                </div>
                <Toggle
                  checked={settings.maintenanceMode ?? false}
                  onChange={(v) => update("maintenanceMode", v)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Message shown to visitors
                </label>
                <input
                  type="text"
                  placeholder="We'll be back shortly — performing scheduled maintenance."
                  value={settings.maintenanceMessage ?? ""}
                  onChange={(e) => update("maintenanceMessage", e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Starts at
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      settings.maintenanceStartAt ? settings.maintenanceStartAt.slice(0, 16) : ""
                    }
                    onChange={(e) => update("maintenanceStartAt", e.target.value || null)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Ends at
                  </label>
                  <input
                    type="datetime-local"
                    value={settings.maintenanceEndAt ? settings.maintenanceEndAt.slice(0, 16) : ""}
                    onChange={(e) => update("maintenanceEndAt", e.target.value || null)}
                    className={inputCls}
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted">
                Leave the dates empty to control maintenance manually with the toggle above.
              </p>
            </div>
            <SaveButton onClick={handleSave} saving={saving} />
          </>
        )}

        {activeSection === "deactivation" && (
          <>
            <SectionHeader
              title="Account Deactivation"
              subtitle="Track who deactivates and why"
              icon={<FiUserX size={17} />}
            />
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-4 p-4 rounded-sm border border-line bg-surface/30">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Require a reason on deactivation
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    Users must pick a reason before their account is deactivated.
                  </p>
                </div>
                <Toggle
                  checked={settings.deactivationReasonRequired ?? false}
                  onChange={(v) => update("deactivationReasonRequired", v)}
                />
              </div>
              <div className="px-4 py-2.5 rounded-sm bg-primary/5 border border-primary/10">
                <p className="text-[11px] text-muted">
                  Deactivations are recorded with the user, timestamp, and reason. The full list
                  appears on the deactivation log page.
                </p>
              </div>
            </div>
            <SaveButton onClick={handleSave} saving={saving} />
          </>
        )}

        {activeSection === "reviews" && (
          <>
            <SectionHeader
              title="Review & Rating Flags"
              subtitle="Automatically flag low ratings for admin attention"
              icon={<FiStar size={17} />}
            />
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl border border-line bg-surface/30 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Flag creators with low average rating
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Surfaces creators whose overall rating drops below the threshold.
                    </p>
                  </div>
                  <Toggle
                    checked={settings.lowRatingFlagEnabled ?? false}
                    onChange={(v) => update("lowRatingFlagEnabled", v)}
                  />
                </div>

                {settings.lowRatingFlagEnabled && (
                  <div className="pt-3 border-t border-line/60">
                    <label className="block text-xs font-semibold text-foreground mb-2">
                      Average rating threshold
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.1"
                        value={settings.lowRatingThreshold ?? 2.5}
                        onChange={(e) => update("lowRatingThreshold", Number(e.target.value))}
                        className="flex-1 accent-primary"
                      />
                      <span className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-sm bg-primary/10 text-primary text-sm font-bold min-w-[64px] justify-center">
                        <FiStar size={13} />
                        {(settings.lowRatingThreshold ?? 2.5).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted mt-2">
                      Creators averaging at or below this rating get flagged for admin review.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-sm border border-line bg-surface/30 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Flag any single low review
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    A single review at or below this rating gets flagged immediately, regardless of
                    average.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={settings.singleReviewFlagRating ?? 2}
                    onChange={(e) => update("singleReviewFlagRating", Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-sm bg-primary/10 text-primary text-sm font-bold min-w-[64px] justify-center">
                    <FiStar size={13} />
                    {settings.singleReviewFlagRating ?? 2}
                  </span>
                </div>
              </div>
            </div>
            <SaveButton onClick={handleSave} saving={saving} />
          </>
        )}
      </div>
    </div>
  );
}