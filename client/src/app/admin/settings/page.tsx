"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  FiSliders,
  FiInfo,
  FiImage,
  FiX,
  FiPercent,
  FiDollarSign,
  FiClock,
  FiSettings,
  FiToggleRight,
  FiTool,
  FiUserX,
  FiStar,
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

/* Static settings card — always expanded, no accordion behavior. */
function SettingsCard({
  title,
  subtitle,
  icon,
  span,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  span?: boolean; // full width across both columns
  children: React.ReactNode;
}) {
  return (
    <div
      className={`group relative border border-line rounded-2xl overflow-hidden ring-1 ring-transparent hover:ring-2 hover:ring-primary/20 transition-all duration-200 ${
        span ? "sm:col-span-2" : ""
      }`}
    >
      <div className="px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-md font-bold italic text-foreground">{title}</h2>
          <p className="text-[11px] text-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"platform" | "about">("platform");

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

  // update a nested featureFlags key without clobbering the others
  const updateFlag = (key: string, value: boolean) => {
    setSettings((prev: any) => ({
      ...prev,
      featureFlags: { ...(prev.featureFlags || {}), [key]: value },
    }));
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
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

  const flags = settings.featureFlags || {};

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground italic">Platform Settings</h1>
        <p className="text-sm text-muted mt-1">Configure fees, thresholds, and platform behavior.</p>
      </div>

      {/* Tab switcher */}
      <div className="inline-flex items-center gap-1 mb-6 p-1 bg-surface border border-line rounded-xl">
        <button
          onClick={() => setActiveTab("platform")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === "platform"
              ? "bg-background text-foreground shadow-sm border border-line"
              : "text-foreground hover:text-foreground"
          }`}
        >
          <FiSliders size={13} />
          Platform Settings
        </button>
        <button
          onClick={() => setActiveTab("about")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === "about"
              ? "bg-background text-foreground shadow-sm border border-line"
              : "text-foreground hover:text-foreground"
          }`}
        >
          <FiInfo size={13} />
          About Us
        </button>
      </div>

      {activeTab === "platform" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6 items-start">
            {/* ── Commission Split ── */}
            <SettingsCard
              title="Commission Split"
              subtitle="Fee division between brand and creator"
              icon={<FiPercent size={16} />}
            >
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Brand fee (%)</label>
                    <input
                      type="number"
                      value={settings.brandFeePercent}
                      onChange={(e) => update("brandFeePercent", Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Influencer fee (%)</label>
                    <input
                      type="number"
                      value={settings.influencerFeePercent}
                      onChange={(e) => update("influencerFeePercent", Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/10">
                  <span className="text-xs font-semibold text-primary">
                    Total commission: {settings.brandFeePercent + settings.influencerFeePercent}%
                  </span>
                </div>
              </div>
            </SettingsCard>

            {/* ── Financial Limits ── */}
            <SettingsCard
              title="Financial Limits"
              subtitle="Deal price boundaries and payout thresholds"
              icon={<FiDollarSign size={16} />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
  <label className="block text-xs font-semibold text-ink mb-1.5">Referral reward (%)</label>
  <input
    type="number"
    value={settings.referralRewardPercent}
    onChange={(e) => update("referralRewardPercent", Number(e.target.value))}
    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm"
  />
</div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Min withdrawal (PKR)</label>
                  <input
                    type="number"
                    value={settings.minWithdrawalMinor / 100}
                    onChange={(e) => update("minWithdrawalMinor", Number(e.target.value) * 100)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Min deal price (PKR)</label>
                  <input
                    type="number"
                    value={settings.minDealPriceMinor / 100}
                    onChange={(e) => update("minDealPriceMinor", Number(e.target.value) * 100)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Max deal price (0 = no limit)</label>
                  <input
                    type="number"
                    value={settings.maxDealPriceMinor / 100}
                    onChange={(e) => update("maxDealPriceMinor", Number(e.target.value) * 100)}
                    className={inputCls}
                  />
                </div>
              </div>
            </SettingsCard>

            {/* ── Timing & Moderation ── */}
            <SettingsCard
              title="Timing & Moderation"
              subtitle="Escrow release windows and review thresholds"
              icon={<FiClock size={16} />}
            >
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Auto-release (days)</label>
                    <input
                      type="number"
                      value={settings.autoReleaseDays}
                      onChange={(e) => update("autoReleaseDays", Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Complaint flag threshold</label>
                    <input
                      type="number"
                      value={settings.complaintAutoFlagThreshold}
                      onChange={(e) => update("complaintAutoFlagThreshold", Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-line/60">
                  <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.reviewModerationEnabled}
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
                      value={settings.reviewModerationMinRating}
                      onChange={(e) => update("reviewModerationMinRating", Number(e.target.value))}
                      className="w-full mt-2 px-3.5 py-2.5 rounded-xl border border-line text-sm"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Auto-suspend unverified accounts after (days, 0 = disabled)
                  </label>
                  <input
                    type="number"
                    value={settings.inactiveAccountAutoSuspendDays}
                    onChange={(e) => update("inactiveAccountAutoSuspendDays", Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
              </div>
            </SettingsCard>

            {/* ── Platform Behavior ── */}
            <SettingsCard
              title="Platform Behavior"
              subtitle="Global toggles affecting the entire site"
              icon={<FiSettings size={16} />}
            >
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-foreground">Require KYC for withdrawals</span>
                  <input
                    type="checkbox"
                    checked={settings.kycRequired}
                    onChange={(e) => update("kycRequired", e.target.checked)}
                    className="w-4 h-4"
                  />
                </label>

                <div className="pt-3 border-t border-line/60">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium text-foreground">Show announcement banner</span>
                    <input
                      type="checkbox"
                      checked={settings.announcementEnabled}
                      onChange={(e) => update("announcementEnabled", e.target.checked)}
                      className="w-4 h-4"
                    />
                  </label>
                  {settings.announcementEnabled && (
                    <input
                      type="text"
                      placeholder="Banner message shown site-wide"
                      value={settings.announcementMessage}
                      onChange={(e) => update("announcementMessage", e.target.value)}
                      className="w-full mt-2 px-3.5 py-2.5 rounded-xl border border-line text-sm"
                    />
                  )}
                </div>
              </div>
            </SettingsCard>

            {/* ── Feature Flags ── */}
            <SettingsCard
              title="Feature Flags"
              subtitle="Turn whole sections of the site on or off"
              icon={<FiToggleRight size={16} />}
            >
              <div className="space-y-1">
                {[
                  { key: "blog", label: "Blog", hint: "Public blog and articles" },
                  { key: "videos", label: "Videos", hint: "Creator video feed and uploads" },
                  { key: "newDeals", label: "New deals", hint: "Allow new deals to be created" },
                  { key: "newSignups", label: "New signups", hint: "Allow new account registration" },
                  { key: "messaging", label: "Messaging", hint: "Direct messages between users" },
                ].map((f, i) => (
                  <label
                    key={f.key}
                    className={`flex items-center justify-between py-3 cursor-pointer ${
                      i !== 0 ? "border-t border-line/60" : ""
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-medium text-foreground">{f.label}</span>
                      <span className="block text-[11px] text-muted">{f.hint}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={flags[f.key] !== false}
                      onChange={(e) => updateFlag(f.key, e.target.checked)}
                      className="w-4 h-4"
                    />
                  </label>
                ))}
              </div>
            </SettingsCard>

            {/* ── Scheduled Maintenance ── */}
            <SettingsCard
              title="Scheduled Maintenance"
              subtitle="Take the site offline on a schedule with a custom message"
              icon={<FiTool size={16} />}
            >
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-foreground">Maintenance mode</span>
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => update("maintenanceMode", e.target.checked)}
                    className="w-4 h-4"
                  />
                </label>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Message shown to visitors</label>
                  <input
                    type="text"
                    placeholder="We'll be back shortly — performing scheduled maintenance."
                    value={settings.maintenanceMessage || ""}
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
            </SettingsCard>

            {/* ── Account Deactivation ── */}
            <SettingsCard
              title="Account Deactivation"
              subtitle="Track who deactivates and why"
              icon={<FiUserX size={16} />}
            >
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span>
                    <span className="block text-sm font-medium text-foreground">Require a reason on deactivation</span>
                    <span className="block text-[11px] text-muted">
                      Users must pick a reason before their account is deactivated.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.deactivationReasonRequired || false}
                    onChange={(e) => update("deactivationReasonRequired", e.target.checked)}
                    className="w-4 h-4"
                  />
                </label>
                <div className="px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-[11px] text-muted">
                    Deactivations are recorded with the user, timestamp, and reason. The full list will appear on the
                    deactivation log page.
                  </p>
                </div>
              </div>
            </SettingsCard>

            {/* ── Review & Rating Flags ── */}
            <SettingsCard
              title="Review & Rating Flags"
              subtitle="Automatically flag low ratings for admin attention"
              icon={<FiStar size={16} />}
            >
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span>
                    <span className="block text-sm font-medium text-foreground">Flag creators with low average rating</span>
                    <span className="block text-[11px] text-muted">
                      Surfaces creators whose overall rating drops below the threshold.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.lowRatingFlagEnabled || false}
                    onChange={(e) => update("lowRatingFlagEnabled", e.target.checked)}
                    className="w-4 h-4"
                  />
                </label>

                {settings.lowRatingFlagEnabled && (
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Average rating threshold (1–5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={settings.lowRatingThreshold ?? 2.5}
                      onChange={(e) => update("lowRatingThreshold", Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                )}

                <div className="pt-2 border-t border-line/60">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Flag any single review at or below this rating (1–5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={settings.singleReviewFlagRating ?? 2}
                    onChange={(e) => update("singleReviewFlagRating", Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
              </div>
            </SettingsCard>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-primary text-foreground text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50 shadow-sm mb-5"
          >
            {saving ? "Saving..." : "Save all settings"}
          </button>

          {settings.changeLog?.length > 0 && (
            <div className="bg-background border border-line rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-line bg-surface/50">
                <h2 className="text-sm font-bold text-foreground">Recent Changes</h2>
              </div>
              <div className="p-6 space-y-2">
                {[...settings.changeLog].reverse().slice(0, 10).map((log: any, i: number) => (
                  <div key={i} className="text-xs text-muted border-b border-line last:border-0 pb-2">
                    {new Date(log.changedAt).toLocaleString()} — {Object.keys(log.changes).join(", ")} updated
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "about" && (
        <div className="max-w-3xl bg-background border border-line rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-line bg-surface/50 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-foreground shrink-0">
              <FiInfo size={15} />
            </div>
            <div>
              <h2 className="text-md font-bold italic text-foreground">About Page</h2>
              <p className="text-[11px] text-muted">Public-facing content shown on your About Us page</p>
            </div>
          </div>

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
              <label className="block text-lg font-semibold text-foreground mb-1.5">Hero Image</label>
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
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/60 hover:bg-background/80 text-foreground flex items-center justify-center transition"
                  >
                    <FiX size={13} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-1.5 w-full h-28 border-2 border-dashed border-line hover:border-primary hover:bg-primary/5 rounded-xl cursor-pointer transition">
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

            <button
              onClick={handleSaveAbout}
              disabled={savingAbout}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-foreground text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50"
            >
              {savingAbout ? "Saving..." : "Save About Page"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}