"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  FiInfo,
  FiImage,
  FiX,
  FiPercent,
  FiDollarSign,
  FiClock,
  FiSettings,
  FiTool,
  FiUserX,
  FiStar,
  FiShield,
  FiVolume2,
} from "react-icons/fi";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    ["blockquote"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link", "image"],
    ["clean"],
  ],
};

const SECTIONS = [
  { key: "commission", label: "Commission Split", icon: FiPercent },
  { key: "financial", label: "Financial Limits", icon: FiDollarSign },
  { key: "timing", label: "Timing & Moderation", icon: FiClock },
  { key: "behavior", label: "Platform Behavior", icon: FiSettings },
  { key: "maintenance", label: "Scheduled Maintenance", icon: FiTool },
  { key: "deactivation", label: "Account Deactivation", icon: FiUserX },
  { key: "reviews", label: "Review & Rating Flags", icon: FiStar },
  { key: "about", label: "About Us", icon: FiInfo },
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

/* Styled toggle switch — replaces plain checkboxes for a more polished feel */
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
        className={`inline-block h-4.5 w-4.5 h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/* Per-section save button — same handleSave call, but rendered inside each panel */
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

const pkr = (minor: any) =>
  minor === undefined || minor === null || isNaN(minor) ? "" : minor / 100;

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>("commission");

  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutContent, setAboutContent] = useState("");
  const [aboutHeroImage, setAboutHeroImage] = useState<File | null>(null);
  const [aboutHeroPreview, setAboutHeroPreview] = useState<string | null>(null);
  const [savingAbout, setSavingAbout] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/settings", { token: getToken()! }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/about`).then((r) => r.json()),
    ])
      .then(([settingsData, aboutData]) => {
        setSettings(settingsData.settings);
        setAboutTitle(aboutData.page.title || "");
        setAboutContent(aboutData.page.content || "");
        if (aboutData.page.heroImage)
          setAboutHeroPreview(`${process.env.NEXT_PUBLIC_API_URL}${aboutData.page.heroImage}`);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const update = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await apiFetch("/api/settings", {
        method: "PATCH",
        token: getToken()!,
        body: settings,
      });
      setSettings(data.settings);
      toast.success("Settings updated successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAbout = async () => {
    setSavingAbout(true);
    try {
      const formData = new FormData();
      formData.append("title", aboutTitle);
      formData.append("content", aboutContent);
      if (aboutHeroImage) formData.append("heroImage", aboutHeroImage);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/about`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Failed to save");
      toast.success("About page updated");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingAbout(false);
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
        <p className="text-sm text-muted mt-1">Configure fees, thresholds, and platform behavior.</p>
      </div>

      {/* ── Horizontal tab row ── */}
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

      {/* ── Active section's content ── */}
      <div className="bg-background border border-line rounded-sm overflow-hidden">
        {/* Commission Split */}
        {activeSection === "commission" && (
          <>
            <SectionHeader
              title="Commission Split"
              subtitle="Fee division between brand and creator"
              icon={<FiPercent size={17} />}
            />
            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Brand fee (%)</label>
                  <input
                    type="number"
                    value={settings.brandFeePercent ?? ""}
                    onChange={(e) => update("brandFeePercent", Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Influencer fee (%)</label>
                  <input
                    type="number"
                    value={settings.influencerFeePercent ?? ""}
                    onChange={(e) => update("influencerFeePercent", Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-primary/5 border border-primary/10">
                <span className="text-xs font-semibold text-primary">
                  Total commission: {(settings.brandFeePercent ?? 0) + (settings.influencerFeePercent ?? 0)}%
                </span>
              </div>
            </div>
            <SaveButton onClick={handleSave} saving={saving} />
          </>
        )}

        {/* Financial Limits */}
        {activeSection === "financial" && (
          <>
            <SectionHeader
              title="Financial Limits"
              subtitle="Deal price boundaries and payout thresholds"
              icon={<FiDollarSign size={17} />}
            />
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Referral reward (%)</label>
                <input
                  type="number"
                  value={settings.referralRewardPercent ?? ""}
                  onChange={(e) => update("referralRewardPercent", Number(e.target.value))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Min withdrawal (PKR)</label>
                <input
                  type="number"
                  value={pkr(settings.minWithdrawalMinor)}
                  onChange={(e) => update("minWithdrawalMinor", Number(e.target.value) * 100)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Min deal price (PKR)</label>
                <input
                  type="number"
                  value={pkr(settings.minDealPriceMinor)}
                  onChange={(e) => update("minDealPriceMinor", Number(e.target.value) * 100)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Max deal price (0 = no limit)</label>
                <input
                  type="number"
                  value={pkr(settings.maxDealPriceMinor)}
                  onChange={(e) => update("maxDealPriceMinor", Number(e.target.value) * 100)}
                  className={inputCls}
                />
              </div>
            </div>
            <SaveButton onClick={handleSave} saving={saving} />
          </>
        )}

        {/* Timing & Moderation */}
        {activeSection === "timing" && (
          <>
            <SectionHeader
              title="Timing & Moderation"
              subtitle="Escrow release windows and review thresholds"
              icon={<FiClock size={17} />}
            />
            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Auto-release (days)</label>
                  <input
                    type="number"
                    value={settings.autoReleaseDays ?? ""}
                    onChange={(e) => update("autoReleaseDays", Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Complaint flag threshold</label>
                  <input
                    type="number"
                    value={settings.complaintAutoFlagThreshold ?? ""}
                    onChange={(e) => update("complaintAutoFlagThreshold", Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-line/60">
                <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.reviewModerationEnabled ?? false}
                    onChange={(e) => update("reviewModerationEnabled", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="font-medium text-foreground">Require approval for low-rated reviews</span>
                </label>
                {settings.reviewModerationEnabled && (
                  <input
                    type="number"
                    min="1"
                    max="5"
                    placeholder="Reviews at or below this rating need approval"
                    value={settings.reviewModerationMinRating ?? ""}
                    onChange={(e) => update("reviewModerationMinRating", Number(e.target.value))}
                    className="w-full mt-2 px-3.5 py-2.5 rounded-sm border border-line text-sm"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Auto-suspend unverified accounts after (days, 0 = disabled)
                </label>
                <input
                  type="number"
                  value={settings.inactiveAccountAutoSuspendDays ?? ""}
                  onChange={(e) => update("inactiveAccountAutoSuspendDays", Number(e.target.value))}
                  className={inputCls}
                />
              </div>
            </div>
            <SaveButton onClick={handleSave} saving={saving} />
          </>
        )}

        {/* Platform Behavior — redesigned with toggle switches + card rows */}
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
                    <p className="text-sm font-semibold text-foreground">Require KYC for withdrawals</p>
                    <p className="text-xs text-muted mt-0.5">Users must verify identity before cashing out.</p>
                  </div>
                </div>
                <Toggle
                  checked={settings.kycRequired ?? false}
                  onChange={(v) => update("kycRequired", v)}
                />
              </div>

              <div className="p-4 rounded-sm border border-line bg-surface/30 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-sm bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FiVolume2 size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">Show announcement banner</p>
                      <p className="text-xs text-muted mt-0.5">Displays a site-wide message to every visitor.</p>
                    </div>
                  </div>
                  <Toggle
                    checked={settings.announcementEnabled ?? false}
                    onChange={(v) => update("announcementEnabled", v)}
                  />
                </div>
                {settings.announcementEnabled && (
                  <input
                    type="text"
                    placeholder="Banner message shown site-wide"
                    value={settings.announcementMessage ?? ""}
                    onChange={(e) => update("announcementMessage", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm bg-background"
                  />
                )}
              </div>
            </div>
            <SaveButton onClick={handleSave} saving={saving} />
          </>
        )}

        {/* Scheduled Maintenance */}
        {activeSection === "maintenance" && (
          <>
            <SectionHeader
              title="Scheduled Maintenance"
              subtitle="Take the site offline on a schedule with a custom message"
              icon={<FiTool size={17} />}
            />
            <div className="p-6 space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-foreground">Maintenance mode</span>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode ?? false}
                  onChange={(e) => update("maintenanceMode", e.target.checked)}
                  className="w-4 h-4"
                />
              </label>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Message shown to visitors</label>
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
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Starts at</label>
                  <input
                    type="datetime-local"
                    value={settings.maintenanceStartAt ? settings.maintenanceStartAt.slice(0, 16) : ""}
                    onChange={(e) => update("maintenanceStartAt", e.target.value || null)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Ends at</label>
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

        {/* Account Deactivation */}
        {activeSection === "deactivation" && (
          <>
            <SectionHeader
              title="Account Deactivation"
              subtitle="Track who deactivates and why"
              icon={<FiUserX size={17} />}
            />
            <div className="p-6 space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span>
                  <span className="block text-sm font-medium text-foreground">Require a reason on deactivation</span>
                  <span className="block text-[11px] text-muted">
                    Users must pick a reason before their account is deactivated.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.deactivationReasonRequired ?? false}
                  onChange={(e) => update("deactivationReasonRequired", e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
              <div className="px-4 py-2.5 rounded-sm bg-primary/5 border border-primary/10">
                <p className="text-[11px] text-muted">
                  Deactivations are recorded with the user, timestamp, and reason. The full list will appear on the
                  deactivation log page.
                </p>
              </div>
            </div>
            <SaveButton onClick={handleSave} saving={saving} />
          </>
        )}

        {/* Review & Rating Flags — redesigned with card layout + live preview */}
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
                    <p className="text-sm font-semibold text-foreground">Flag creators with low average rating</p>
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
                  <p className="text-sm font-semibold text-foreground">Flag any single low review</p>
                  <p className="text-xs text-muted mt-0.5">
                    A single review at or below this rating gets flagged immediately, regardless of average.
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

        {/* About Us */}
        {activeSection === "about" && (
          <>
            <SectionHeader
              title="About Page"
              subtitle="Public-facing content shown on your About Us page"
              icon={<FiInfo size={17} />}
            />
            <div className="p-6 space-y-5">
              <div>
                <input
                  type="text"
                  placeholder="Page title"
                  value={aboutTitle}
                  onChange={(e) => setAboutTitle(e.target.value)}
                  className="w-full text-lg font-bold px-0 py-1 border-0 border-b border-line focus:outline-none focus:border-primary bg-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Hero Image</label>
                {aboutHeroPreview ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-line group">
                    <img src={aboutHeroPreview} className="w-full h-full object-cover" />
                    <label className="absolute inset-0 bg-black/0 group-hover:bg-background/40 transition flex items-center justify-center cursor-pointer">
                      <span className="opacity-0 group-hover:opacity-100 text-foreground text-xs font-semibold transition">
                        Change image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setAboutHeroImage(file);
                          if (file) setAboutHeroPreview(URL.createObjectURL(file));
                        }}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAboutHeroImage(null);
                        setAboutHeroPreview(null);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-sm bg-background/60 hover:bg-background/80 text-foreground flex items-center justify-center transition"
                    >
                      <FiX size={13} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1.5 w-full h-28 border-2 border-dashed border-line hover:border-primary hover:bg-primary/5 rounded-sm cursor-pointer transition">
                    <FiImage size={18} className="text-foreground" />
                    <p className="text-xs text-foreground">Click to upload hero image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setAboutHeroImage(file);
                        if (file) setAboutHeroPreview(URL.createObjectURL(file));
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Content</label>
                <div className="rounded-xl border border-line overflow-hidden bg-background">
                  <ReactQuill
                    theme="snow"
                    value={aboutContent}
                    onChange={setAboutContent}
                    modules={quillModules}
                    placeholder="Write about your platform..."
                    className="[&_.ql-editor]:min-h-[220px] [&_.ql-toolbar]:border-line [&_.ql-container]:border-line"
                  />
                </div>
              </div>
            </div>
            <SaveButton onClick={handleSaveAbout} saving={savingAbout} />
          </>
        )}
      </div>
    </div>
  );
}