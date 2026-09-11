"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { minorToMajor, majorToMinor } from "@/lib/money";
import {
  FiInfo,
  FiImage,
  FiX,
  FiPercent,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
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
  { key: "verification", label: "Verification", icon: FiCheckCircle },
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
      <div className="w-10 h-10 rounded-sm bg-primary flex items-center justify-center text-white shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="text-lg font-bold italic text-foreground">{title}</h2>
        <p className="text-xs text-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <div className="px-6 py-4 border-t border-line bg-surface/30 flex justify-center">
      <button
        onClick={onClick}
        disabled={saving}
        className="px-6 py-2.5 rounded-sm bg-primary text-foreground text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50 shadow-sm"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}

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
        setAboutTitle(aboutData.page?.title || "");
        setAboutContent(aboutData.page?.content || "");
        if (aboutData.page?.heroImage)
          setAboutHeroPreview(`${process.env.NEXT_PUBLIC_API_URL}${aboutData.page.heroImage}`);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const update = (key: string, value: any) =>
    setSettings((prev: any) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        brandFeePercent: settings.brandFeePercent,
        influencerFeePercent: settings.influencerFeePercent,
        referralRewardPercent: settings.referralRewardPercent,
        minWithdrawalMinor: settings.minWithdrawalMinor,
        minDealPriceMinor: settings.minDealPriceMinor,
        maxDealPriceMinor: settings.maxDealPriceMinor,
        autoReleaseDays: settings.autoReleaseDays,
        complaintAutoFlagThreshold: settings.complaintAutoFlagThreshold,
        reviewModerationEnabled: settings.reviewModerationEnabled,
        reviewModerationMinRating: settings.reviewModerationMinRating,
        inactiveAccountAutoSuspendDays: settings.inactiveAccountAutoSuspendDays,
        minDealsForVerification: settings.minDealsForVerification,
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
    "w-full px-3.5 py-2.5 rounded-sm border border-line text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

  const totalCommission =
    (settings.brandFeePercent ?? 0) + (settings.influencerFeePercent ?? 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground italic">General Settings</h1>
        <p className="text-sm text-foreground mt-1">
          Fees, limits, timing rules, verification, and your About page.
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
                  : "text-foreground hover:text-muted"
              }`}
            >
              <Icon size={13} />
              {s.label}
            </button>
          );
        })}
      </div>

     <div className="bg-background border border-line rounded-sm overflow-hidden">
  {activeSection === "commission" && (
    <div className="flex flex-col justify-between min-h-[480px]">
      <div>
        <SectionHeader
          title="Commission Split"
          subtitle="Fee division between brand and creator"
          icon={<FiPercent size={17} />}
        />
        <div className="p-8 space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Brand fee (%)
              </label>
              <input
                type="number"
                value={settings.brandFeePercent ?? ""}
                onChange={(e) => update("brandFeePercent", Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Influencer fee (%)
              </label>
              <input
                type="number"
                value={settings.influencerFeePercent ?? ""}
                onChange={(e) => update("influencerFeePercent", Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-3.5 rounded-sm border ${
              totalCommission > 100
                ? "bg-red-50 border-red-200"
                : "bg-primary/5 border-primary/10"
            }`}
          >
            <span
              className={`text-xs font-semibold ${
                totalCommission > 100 ? "text-red-600" : "text-primary"
              }`}
            >
              {totalCommission > 100
                ? `Total commission is ${totalCommission}% — reduce it to 100% or less before saving.`
                : `Total commission: ${totalCommission}%`}
            </span>
          </div>
        </div>
      </div>
      <SaveButton onClick={handleSave} saving={saving} />
    </div>
  )}

  {activeSection === "financial" && (
    <div className="flex flex-col justify-between min-h-[480px]">
      <div>
        <SectionHeader
          title="Financial Limits"
          subtitle="Deal price boundaries and payout thresholds"
          icon={<FiDollarSign size={17} />}
        />
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Referral reward (%)
            </label>
            <input
              type="number"
              value={settings.referralRewardPercent ?? ""}
              onChange={(e) => update("referralRewardPercent", Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Min withdrawal (PKR)
            </label>
            <input
              type="number"
              value={minorToMajor(settings.minWithdrawalMinor)}
              onChange={(e) => update("minWithdrawalMinor", majorToMinor(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Min deal price (PKR)
            </label>
            <input
              type="number"
              value={minorToMajor(settings.minDealPriceMinor)}
              onChange={(e) => update("minDealPriceMinor", majorToMinor(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Max deal price (0 = no limit)
            </label>
            <input
              type="number"
              value={minorToMajor(settings.maxDealPriceMinor)}
              onChange={(e) => update("maxDealPriceMinor", majorToMinor(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>
      </div>
      <SaveButton onClick={handleSave} saving={saving} />
    </div>
  )}

  {activeSection === "timing" && (
    <div className="flex flex-col justify-between min-h-[480px]">
      <div>
        <SectionHeader
          title="Timing & Moderation"
          subtitle="Escrow release windows and review thresholds"
          icon={<FiClock size={17} />}
        />
        <div className="p-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Auto-release (days)
              </label>
              <input
                type="number"
                value={settings.autoReleaseDays ?? ""}
                onChange={(e) => update("autoReleaseDays", Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Complaint flag threshold
              </label>
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
              <span className="font-medium text-foreground">
                Require approval for low-rated reviews
              </span>
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
              onChange={(e) =>
                update("inactiveAccountAutoSuspendDays", Number(e.target.value))
              }
              className={inputCls}
            />
          </div>
        </div>
      </div>
      <SaveButton onClick={handleSave} saving={saving} />
    </div>
  )}

  {activeSection === "verification" && (
    <div className="flex flex-col justify-between min-h-[480px]">
      <div>
        <SectionHeader
          title="Verification"
          subtitle="When creators become eligible to apply for a verified badge"
          icon={<FiCheckCircle size={17} />}
        />
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Completed deals required to apply
            </label>
            <input
              type="number"
              min="0"
              value={settings.minDealsForVerification ?? ""}
              onChange={(e) => update("minDealsForVerification", Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>
      </div>
      <SaveButton onClick={handleSave} saving={saving} />
    </div>
  )}

  {activeSection === "about" && (
    <div className="flex flex-col justify-between min-h-[480px]">
      <div>
        <SectionHeader
          title="About Page"
          subtitle="Public-facing content shown on your About Us page"
          icon={<FiInfo size={17} />}
        />
        <div className="p-6 space-y-5">
          <input
            type="text"
            placeholder="Page title"
            value={aboutTitle}
            onChange={(e) => setAboutTitle(e.target.value)}
            className="w-full text-lg font-bold px-0 py-1 border-0 border-b border-line focus:outline-none focus:border-primary bg-transparent"
          />

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Hero image
            </label>
            {aboutHeroPreview ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border border-line group">
                <img src={aboutHeroPreview} className="w-full h-full object-cover" alt="" />
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
      </div>
      <SaveButton onClick={handleSaveAbout} saving={savingAbout} />
    </div>
  )}
</div>
    </div>
  );
}