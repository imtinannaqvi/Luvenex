"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  FiGlobe,
  FiShare2,
  FiFileText,
  FiCornerUpRight,
  FiBarChart2,
  FiImage,
  FiX,
  FiPlus,
  FiTrash2,
  FiAlertTriangle,
} from "react-icons/fi";

const API = process.env.NEXT_PUBLIC_API_URL;

const FREQS = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];

// Google truncates around these lengths. Not hard limits, just where it cuts.
const TITLE_LIMIT = 60;
const DESC_LIMIT = 160;

function Section({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-background border border-line rounded-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-line bg-surface/40">
        <div className="w-10 h-10 rounded-sm bg-primary flex items-center justify-center text-white shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold italic text-foreground">{title}</h2>
          <p className="text-xs text-foreground/60 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  counter,
  full,
  children,
}: {
  label: string;
  hint?: string;
  counter?: React.ReactNode;
  /** Span both columns — for textareas and anything that needs the room. */
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <label className="text-xs font-semibold text-foreground">{label}</label>
        {counter}
      </div>
      {children}
      {hint && <p className="text-[11px] text-foreground/50 mt-1.5">{hint}</p>}
    </div>
  );
}

function CharCount({ value, limit }: { value: string; limit: number }) {
  const len = value.length;
  const over = len > limit;
  return (
    <span className={`text-[11px] font-medium ${over ? "text-red-500" : "text-foreground/40"}`}>
      {len}/{limit}
      {over && " — Google will cut this off"}
    </span>
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

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-sm border border-line bg-surface/30">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="text-xs text-foreground/60 mt-0.5">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export default function SeoSettingsPage() {
  const [seo, setSeo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [ogFile, setOgFile] = useState<File | null>(null);
  const [ogPreview, setOgPreview] = useState<string | null>(null);
  const [ogCleared, setOgCleared] = useState(false);

  const [redirects, setRedirects] = useState<any[]>([]);
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");
  const [newType, setNewType] = useState(301);
  const [addingRedirect, setAddingRedirect] = useState(false);

  const load = () =>
    fetch(`${API}/api/seo`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.seo) throw new Error("Couldn't load SEO settings");
        setSeo(d.seo);
        if (d.seo.ogImage) setOgPreview(`${API}${d.seo.ogImage}`);
      })
      .catch((e: any) => toast.error(e.message))
      .finally(() => setLoading(false));

  const loadRedirects = () =>
    apiFetch("/api/seo/redirects", { token: getToken()! })
      .then((d: any) => setRedirects(d.redirects || []))
      .catch(() => {});

  useEffect(() => {
    load();
    loadRedirects();
  }, []);

  const update = (key: string, value: any) => setSeo((p: any) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      const fields = [
        "siteName", "titleTemplate", "defaultDescription", "defaultKeywords",
        "canonicalBaseUrl", "allowIndexing", "ogTitle", "ogDescription",
        "twitterCard", "twitterHandle", "robotsTxt", "sitemapIncludeBlog",
        "sitemapIncludeProfiles", "sitemapIncludeServices", "sitemapChangeFreq",
        "sitemapPriority", "googleAnalyticsId", "googleSiteVerification",
        "bingSiteVerification", "facebookPixelId",
      ];
      fields.forEach((f) => fd.append(f, String(seo[f] ?? "")));
      if (ogFile) fd.append("ogImage", ogFile);
      if (ogCleared && !ogFile) fd.append("removeOgImage", "true");

      const res = await fetch(`${API}/api/seo`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Failed to save");

      toast.success("SEO settings saved");
      setOgFile(null);
      setOgCleared(false);
      setSeo(data.seo);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const addRedirect = async () => {
    if (!newFrom.trim() || !newTo.trim()) return toast.error("Both paths are required.");
    setAddingRedirect(true);
    try {
      await apiFetch("/api/seo/redirects", {
        method: "POST",
        token: getToken()!,
        body: { from: newFrom, to: newTo, type: newType },
      });
      toast.success("Redirect added");
      setNewFrom("");
      setNewTo("");
      loadRedirects();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAddingRedirect(false);
    }
  };

  const toggleRedirect = async (r: any) => {
    try {
      await apiFetch(`/api/seo/redirects/${r._id}`, {
        method: "PATCH",
        token: getToken()!,
        body: { isActive: !r.isActive },
      });
      loadRedirects();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const removeRedirect = async (id: string) => {
    if (!confirm("Delete this redirect? Anyone following the old link will hit a 404.")) return;
    try {
      await apiFetch(`/api/seo/redirects/${id}`, { method: "DELETE", token: getToken()! });
      setRedirects((p) => p.filter((r) => r._id !== id));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading || !seo) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-line bg-background text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

  const previewTitle = (seo.titleTemplate || "%s").replace("%s", "Discover Creators");
  const previewUrl = seo.canonicalBaseUrl || "https://luvenex.com";

  const pickOgFile = (f: File | null) => {
    if (!f) return;
    setOgFile(f);
    setOgPreview(URL.createObjectURL(f));
    setOgCleared(false);
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground ">SEO Manager</h1>
      
      </div>

      {!seo.allowIndexing && (
        <div className="flex items-start gap-2.5 mb-5 px-4 py-3 rounded-sm border border-red-500/30 bg-red-500/10">
          <FiAlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">
            Search indexing is switched off — the whole site is sending{" "}
            <span className="font-mono">noindex</span>. Turn it back on below before launch.
          </p>
        </div>
      )}

      <div className="space-y-5">
        {/* ── 1. General ── */}
        <Section
          title="General"
          icon={<FiGlobe size={17} />}
        >
          <>
            <Field label="Site name">
              <input
                type="text"
                value={seo.siteName ?? ""}
                onChange={(e) => update("siteName", e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field
              label="Title template"
            >
              <input
                type="text"
                placeholder="%s | Luvenex"
                value={seo.titleTemplate ?? ""}
                onChange={(e) => update("titleTemplate", e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field
              full
              label="Default meta description"
              counter={<CharCount value={seo.defaultDescription ?? ""} limit={DESC_LIMIT} />}
            >
              <textarea
                rows={3}
                value={seo.defaultDescription ?? ""}
                onChange={(e) => update("defaultDescription", e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field
              label="Keywords"
            >
              <input
                type="text"
                placeholder="influencer marketing, brand deals"
                value={seo.defaultKeywords ?? ""}
                onChange={(e) => update("defaultKeywords", e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field
              label="Canonical base URL"
            >
              <input
                type="url"
                placeholder="https://luvenex.com"
                value={seo.canonicalBaseUrl ?? ""}
                onChange={(e) => update("canonicalBaseUrl", e.target.value)}
                className={inputCls}
              />
            </Field>

            <div className="md:col-span-2">
              <ToggleRow
                title="Allow search indexing"
                checked={seo.allowIndexing ?? true}
                onChange={(v) => update("allowIndexing", v)}
              />
            </div>

          
          </>
        </Section>

        {/* ── 2. Social sharing ── */}
        <Section
          title="Social Sharing"
          subtitle="What appears when someone pastes a link"
          icon={<FiShare2 size={17} />}
        >
          <>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Share image
              </label>
              {ogPreview ? (
                <div className="relative w-full max-w-md aspect-[1200/630] rounded-xl overflow-hidden border border-line group bg-surface/40">
                  <img src={ogPreview} className="w-full h-full object-cover" alt="" />
                  <label className="absolute inset-0 group-hover:bg-background/40 transition flex items-center justify-center cursor-pointer">
                    <span className="opacity-0 group-hover:opacity-100 text-foreground text-xs font-semibold transition">
                      Change image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => pickOgFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOgFile(null);
                      setOgPreview(null);
                      setOgCleared(true);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-sm bg-background/70 hover:bg-background text-foreground flex items-center justify-center transition"
                  >
                    <FiX size={13} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-1.5 w-full max-w-md aspect-[1200/630] border-2 border-dashed border-line hover:border-primary hover:bg-primary/5 rounded-xl cursor-pointer transition">
                  <FiImage size={20} className="text-foreground" />
                  <p className="text-xs text-foreground">Click to upload</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => pickOgFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              )}
              <p className="text-[11px] text-foreground/50 mt-1.5">
                1200×630. This is what shows on WhatsApp and LinkedIn — the highest-impact field
                here.
              </p>
            </div>

            <Field
              label="Share title"
              counter={<CharCount value={seo.ogTitle ?? ""} limit={TITLE_LIMIT} />}
            >
              <input
                type="text"
                placeholder="Falls back to the site title"
                value={seo.ogTitle ?? ""}
                onChange={(e) => update("ogTitle", e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field
              full
              label="Share description"
              counter={<CharCount value={seo.ogDescription ?? ""} limit={DESC_LIMIT} />}
            >
              <textarea
                rows={3}
                placeholder="Falls back to the default description"
                value={seo.ogDescription ?? ""}
                onChange={(e) => update("ogDescription", e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Twitter card type">
              <select
                value={seo.twitterCard ?? "summary_large_image"}
                onChange={(e) => update("twitterCard", e.target.value)}
                className={inputCls + " cursor-pointer"}
              >
                <option value="summary_large_image">Large image</option>
                <option value="summary">Small thumbnail</option>
              </select>
            </Field>

            <Field label="Twitter handle">
              <input
                type="text"
                placeholder="@luvenex"
                value={seo.twitterHandle ?? ""}
                onChange={(e) => update("twitterHandle", e.target.value)}
                className={inputCls}
              />
            </Field>
          </>
        </Section>

        {/* ── 3. Robots & sitemap ── */}
        <Section
          title="Robots & Sitemap"
          subtitle="What crawlers are allowed to see"
          icon={<FiFileText size={17} />}
        >
          <>
            <Field
              full
              label="robots.txt"
              hint="Served at /robots.txt. A stray Disallow: / here hides the entire site."
            >
              <textarea
                rows={8}
                spellCheck={false}
                value={seo.robotsTxt ?? ""}
                onChange={(e) => update("robotsTxt", e.target.value)}
                className={inputCls + " font-mono text-xs leading-relaxed resize-y"}
              />
            </Field>

            <div className="md:col-span-2 space-y-3 pt-2 border-t border-line/60">
              <p className="text-xs font-semibold text-foreground">Include in the sitemap</p>
              <ToggleRow
                title="Blog posts"
                checked={seo.sitemapIncludeBlog ?? true}
                onChange={(v) => update("sitemapIncludeBlog", v)}
              />
              <ToggleRow
                title="Creator and brand profiles"
                checked={seo.sitemapIncludeProfiles ?? true}
                onChange={(v) => update("sitemapIncludeProfiles", v)}
              />
              <ToggleRow
                title="Services"
                checked={seo.sitemapIncludeServices ?? true}
                onChange={(v) => update("sitemapIncludeServices", v)}
              />
            </div>

            <Field label="Change frequency">
              <select
                value={seo.sitemapChangeFreq ?? "weekly"}
                onChange={(e) => update("sitemapChangeFreq", e.target.value)}
                className={inputCls + " cursor-pointer capitalize"}
              >
                {FREQS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Default priority (0–1)">
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={seo.sitemapPriority ?? 0.7}
                onChange={(e) => update("sitemapPriority", Number(e.target.value))}
                className={inputCls}
              />
            </Field>
          </>
        </Section>

        {/* ── 4. Tracking ── */}
        <Section
          title="Tracking & Verification"
          subtitle="Analytics and search console ownership"
          icon={<FiBarChart2 size={17} />}
        >
          <>
            <Field label="Google Analytics / GTM ID">
              <input
                type="text"
                placeholder="G-XXXXXXXXXX or GTM-XXXXXXX"
                value={seo.googleAnalyticsId ?? ""}
                onChange={(e) => update("googleAnalyticsId", e.target.value)}
                className={inputCls + " font-mono text-xs"}
              />
            </Field>

            <Field label="Facebook Pixel ID">
              <input
                type="text"
                placeholder="1234567890"
                value={seo.facebookPixelId ?? ""}
                onChange={(e) => update("facebookPixelId", e.target.value)}
                className={inputCls + " font-mono text-xs"}
              />
            </Field>

            <Field
              full
              label="Google Search Console verification"
              hint="Paste only the content value, not the whole meta tag."
            >
              <input
                type="text"
                value={seo.googleSiteVerification ?? ""}
                onChange={(e) => update("googleSiteVerification", e.target.value)}
                className={inputCls + " font-mono text-xs"}
              />
            </Field>

            <Field full label="Bing Webmaster verification">
              <input
                type="text"
                value={seo.bingSiteVerification ?? ""}
                onChange={(e) => update("bingSiteVerification", e.target.value)}
                className={inputCls + " font-mono text-xs"}
              />
            </Field>
          </>
        </Section>

        {/* ── 5. Redirects ── */}
        <Section
          title="Redirects"
          subtitle="Point old URLs at new ones — saved as you add them"
          icon={<FiCornerUpRight size={17} />}
        >
          <>
            <div className="md:col-span-2 p-4 rounded-sm border border-line bg-surface/30 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <Field label="From">
                <input
                  type="text"
                  placeholder="/old-page"
                  value={newFrom}
                  onChange={(e) => setNewFrom(e.target.value)}
                  className={inputCls + " font-mono text-xs"}
                />
              </Field>

              <Field label="To">
                <input
                  type="text"
                  placeholder="/new-page"
                  value={newTo}
                  onChange={(e) => setNewTo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addRedirect();
                  }}
                  className={inputCls + " font-mono text-xs"}
                />
              </Field>

              <div className="md:col-span-2 flex items-center gap-2.5">
                <select
                  value={newType}
                  onChange={(e) => setNewType(Number(e.target.value))}
                  /* Not inputCls — that sets w-full, which would fight w-28
                     and push the Add button outside the card. */
                  className="w-28 shrink-0 px-3.5 py-2.5 rounded-xl border border-line bg-background text-sm text-foreground cursor-pointer focus:outline-none focus:border-primary"
                >
                  <option value={301}>301</option>
                  <option value={302}>302</option>
                </select>
                <button
                  onClick={addRedirect}
                  disabled={addingRedirect}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-sm bg-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  <FiPlus size={14} />
                  Add redirect
                </button>
              </div>

            
            </div>

            {redirects.length === 0 ? (
              <p className="md:col-span-2 text-xs text-foreground/50 text-center py-6">
                No redirects yet. Add one whenever you rename or remove a page.
              </p>
            ) : (
              <div className="md:col-span-2 space-y-2">
                {redirects.map((r) => (
                  <div
                    key={r._id}
                    className="flex items-center gap-3 p-3.5 rounded-sm border border-line bg-surface/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-foreground truncate">{r.from}</p>
                      <p className="font-mono text-xs text-primary truncate mt-0.5">→ {r.to}</p>
                      <p className="text-[11px] text-foreground/40 mt-1">
                        {r.type} · {r.hits || 0} hit{r.hits === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Toggle checked={r.isActive} onChange={() => toggleRedirect(r)} />
                    <button
                      onClick={() => removeRedirect(r._id)}
                      className="w-8 h-8 shrink-0 rounded-sm text-foreground/40 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition"
                      aria-label="Delete redirect"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        </Section>
      </div>

     
      <div className="sticky bottom-0 mt-5 -mx-4 px-4 py-3   backdrop-blur-sm flex items-center justify-center gap-3">
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}