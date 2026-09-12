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

const TABS = [
  { key: "general", label: "General", icon: FiGlobe },
  { key: "social", label: "Social Sharing", icon: FiShare2 },
  { key: "robots", label: "Robots & Sitemap", icon: FiFileText },
  { key: "redirects", label: "Redirects", icon: FiCornerUpRight },
  { key: "tracking", label: "Tracking", icon: FiBarChart2 },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const FREQS = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];

// Google truncates around these lengths. Not hard limits, just where it cuts.
const TITLE_LIMIT = 60;
const DESC_LIMIT = 160;

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

export default function SeoSettingsPage() {
  const [tab, setTab] = useState<TabKey>("general");
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
    if (!newFrom.trim() || !newTo.trim()) {
      return toast.error("Both paths are required.");
    }
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground italic">SEO Manager</h1>
        <p className="text-sm text-foreground/60 mt-1">
          How your site appears in search results and when shared.
        </p>
      </div>

      {!seo.allowIndexing && (
        <div className="flex items-start gap-2.5 mb-5 px-4 py-3 rounded-sm border border-red-500/30 bg-red-500/10">
          <FiAlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">
            Search indexing is switched off — the whole site is sending{" "}
            <span className="font-mono">noindex</span>. Turn it back on in General before launch.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-6 p-1.5 bg-surface border border-line rounded-sm overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-sm transition whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-background text-foreground shadow-sm border border-line"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="bg-background border border-line rounded-sm overflow-hidden">
        {/* ── General ── */}
        {tab === "general" && (
          <>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Site name
                  </label>
                  <input
                    type="text"
                    value={seo.siteName ?? ""}
                    onChange={(e) => update("siteName", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Title template
                  </label>
                  <input
                    type="text"
                    placeholder="%s | Luvenex"
                    value={seo.titleTemplate ?? ""}
                    onChange={(e) => update("titleTemplate", e.target.value)}
                    className={inputCls}
                  />
                  <p className="text-[11px] text-foreground/50 mt-1.5">
                    <span className="font-mono">%s</span> is swapped for each page&apos;s own title.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Default meta description
                  </label>
                  <CharCount value={seo.defaultDescription ?? ""} limit={DESC_LIMIT} />
                </div>
                <textarea
                  rows={3}
                  value={seo.defaultDescription ?? ""}
                  onChange={(e) => update("defaultDescription", e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Keywords
                  </label>
                  <input
                    type="text"
                    placeholder="influencer marketing, brand deals"
                    value={seo.defaultKeywords ?? ""}
                    onChange={(e) => update("defaultKeywords", e.target.value)}
                    className={inputCls}
                  />
                  <p className="text-[11px] text-foreground/50 mt-1.5">
                    Google ignores these. Harmless to fill in, but don&apos;t expect much.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Canonical base URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://luvenex.com"
                    value={seo.canonicalBaseUrl ?? ""}
                    onChange={(e) => update("canonicalBaseUrl", e.target.value)}
                    className={inputCls}
                  />
                  <p className="text-[11px] text-foreground/50 mt-1.5">
                    Stops www and non-www counting as two different sites.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 p-4 rounded-sm border border-line bg-surface/30">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Allow search indexing</p>
                  <p className="text-xs text-foreground/60 mt-0.5">
                    Turn off before launch. Leaving it off afterwards removes you from Google.
                  </p>
                </div>
                <Toggle
                  checked={seo.allowIndexing ?? true}
                  onChange={(v) => update("allowIndexing", v)}
                />
              </div>

              {/* Google result preview */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  How a result looks on Google
                </p>
                <div className="rounded-xl border border-line bg-white p-4">
                  <p className="text-[13px] text-[#202124] leading-tight truncate">
                    {previewUrl.replace(/^https?:\/\//, "")}
                  </p>
                  <p className="text-[18px] text-[#1a0dab] leading-snug mt-0.5 truncate">
                    {previewTitle}
                  </p>
                  <p className="text-[13px] text-[#4d5156] leading-snug mt-1 line-clamp-2">
                    {seo.defaultDescription || "Your meta description appears here."}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Social ── */}
        {tab === "social" && (
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
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
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        if (!f) return;
                        setOgFile(f);
                        setOgPreview(URL.createObjectURL(f));
                        setOgCleared(false);
                      }}
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
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      if (!f) return;
                      setOgFile(f);
                      setOgPreview(URL.createObjectURL(f));
                      setOgCleared(false);
                    }}
                    className="hidden"
                  />
                </label>
              )}
              <p className="text-[11px] text-foreground/50 mt-1.5">
                1200×630. This is what shows when someone pastes a link into WhatsApp or LinkedIn —
                the highest-impact field on this page.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">Share title</label>
                <CharCount value={seo.ogTitle ?? ""} limit={TITLE_LIMIT} />
              </div>
              <input
                type="text"
                placeholder="Falls back to the site title"
                value={seo.ogTitle ?? ""}
                onChange={(e) => update("ogTitle", e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">Share description</label>
                <CharCount value={seo.ogDescription ?? ""} limit={DESC_LIMIT} />
              </div>
              <textarea
                rows={3}
                placeholder="Falls back to the default description"
                value={seo.ogDescription ?? ""}
                onChange={(e) => update("ogDescription", e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Twitter card type
                </label>
                <select
                  value={seo.twitterCard ?? "summary_large_image"}
                  onChange={(e) => update("twitterCard", e.target.value)}
                  className={inputCls + " cursor-pointer"}
                >
                  <option value="summary_large_image">Large image</option>
                  <option value="summary">Small thumbnail</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Twitter handle
                </label>
                <input
                  type="text"
                  placeholder="@luvenex"
                  value={seo.twitterHandle ?? ""}
                  onChange={(e) => update("twitterHandle", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Robots & sitemap ── */}
        {tab === "robots" && (
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                robots.txt
              </label>
              <textarea
                rows={10}
                spellCheck={false}
                value={seo.robotsTxt ?? ""}
                onChange={(e) => update("robotsTxt", e.target.value)}
                className={inputCls + " font-mono text-xs leading-relaxed resize-y"}
              />
              <p className="text-[11px] text-foreground/50 mt-1.5">
                Served at <span className="font-mono">/robots.txt</span>. A stray{" "}
                <span className="font-mono">Disallow: /</span> here hides the entire site.
              </p>
            </div>

            <div className="pt-2 border-t border-line/60 space-y-3">
              <p className="text-xs font-semibold text-foreground">Include in the sitemap</p>

              {[
                { key: "sitemapIncludeBlog", label: "Blog posts" },
                { key: "sitemapIncludeProfiles", label: "Creator and brand profiles" },
                { key: "sitemapIncludeServices", label: "Services" },
              ].map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-4 p-3.5 rounded-sm border border-line bg-surface/30"
                >
                  <p className="text-sm text-foreground">{row.label}</p>
                  <Toggle
                    checked={seo[row.key] ?? true}
                    onChange={(v) => update(row.key, v)}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Change frequency
                </label>
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
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Default priority (0–1)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={seo.sitemapPriority ?? 0.7}
                  onChange={(e) => update("sitemapPriority", Number(e.target.value))}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Redirects ── */}
        {tab === "redirects" && (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-sm border border-line bg-surface/30 space-y-3">
              <p className="text-xs font-semibold text-foreground">Add a redirect</p>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2">
                <input
                  type="text"
                  placeholder="/old-page"
                  value={newFrom}
                  onChange={(e) => setNewFrom(e.target.value)}
                  className={inputCls + " font-mono text-xs"}
                />
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
                <select
                  value={newType}
                  onChange={(e) => setNewType(Number(e.target.value))}
                  className={inputCls + " cursor-pointer sm:w-auto"}
                >
                  <option value={301}>301</option>
                  <option value={302}>302</option>
                </select>
                <button
                  onClick={addRedirect}
                  disabled={addingRedirect}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 shrink-0"
                >
                  <FiPlus size={14} />
                  Add
                </button>
              </div>
              <p className="text-[11px] text-foreground/50">
                301 is permanent and passes ranking to the new URL. 302 is temporary and passes
                nothing — use it only when the move really is temporary.
              </p>
            </div>

            {redirects.length === 0 ? (
              <p className="text-xs text-foreground/50 text-center py-8">
                No redirects yet. Add one whenever you rename or remove a page.
              </p>
            ) : (
              <div className="border border-line rounded-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-surface/40">
                      <th className="px-4 py-3 text-[11px] font-semibold text-foreground/45">
                        From
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold text-foreground/45">To</th>
                      <th className="px-4 py-3 text-[11px] font-semibold text-foreground/45 w-[70px]">
                        Type
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold text-foreground/45 w-[70px] text-center">
                        Hits
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold text-foreground/45 w-[80px] text-center">
                        Active
                      </th>
                      <th className="px-4 py-3 w-[50px]" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {redirects.map((r) => (
                      <tr key={r._id} className="hover:bg-surface/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-foreground truncate max-w-0">
                          {r.from}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-primary truncate max-w-0">
                          {r.to}
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground/70">{r.type}</td>
                        <td className="px-4 py-3 text-xs text-foreground/70 text-center">
                          {r.hits || 0}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <Toggle checked={r.isActive} onChange={() => toggleRedirect(r)} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => removeRedirect(r._id)}
                            className="w-7 h-7 rounded-sm text-foreground/40 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition"
                            aria-label="Delete redirect"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Tracking ── */}
        {tab === "tracking" && (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Google Analytics / GTM ID
              </label>
              <input
                type="text"
                placeholder="G-XXXXXXXXXX or GTM-XXXXXXX"
                value={seo.googleAnalyticsId ?? ""}
                onChange={(e) => update("googleAnalyticsId", e.target.value)}
                className={inputCls + " font-mono text-xs"}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Facebook Pixel ID
              </label>
              <input
                type="text"
                placeholder="1234567890"
                value={seo.facebookPixelId ?? ""}
                onChange={(e) => update("facebookPixelId", e.target.value)}
                className={inputCls + " font-mono text-xs"}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Google Search Console verification
              </label>
              <input
                type="text"
                placeholder="The content value from the meta tag"
                value={seo.googleSiteVerification ?? ""}
                onChange={(e) => update("googleSiteVerification", e.target.value)}
                className={inputCls + " font-mono text-xs"}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Bing Webmaster verification
              </label>
              <input
                type="text"
                placeholder="The content value from the meta tag"
                value={seo.bingSiteVerification ?? ""}
                onChange={(e) => update("bingSiteVerification", e.target.value)}
                className={inputCls + " font-mono text-xs"}
              />
            </div>
            <p className="sm:col-span-2 text-[11px] text-foreground/50">
              Paste only the <span className="font-mono">content</span> value, not the whole meta
              tag. Both services also accept a DNS record if you&apos;d rather not use a tag.
            </p>
          </div>
        )}

        {tab !== "redirects" && (
          <div className="px-6 py-4 border-t border-line bg-surface/30 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}