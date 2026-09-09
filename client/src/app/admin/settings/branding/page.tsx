"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getToken } from "@/lib/auth";
import { FiImage, FiX, FiDroplet } from "react-icons/fi";

const API = process.env.NEXT_PUBLIC_API_URL;

type ImageKey = "logo" | "logoDark" | "favicon" | "ogImage";

const IMAGE_FIELDS: {
  key: ImageKey;
  label: string;
  hint: string;
  boxHeight: string;
  contain?: boolean;
}[] = [
  {
    key: "logo",
    label: "Primary logo",
    hint: "SVG or transparent PNG, around 240×64. Shown in the header and on invoices.",
    boxHeight: "h-28",
    contain: true,
  },
  {
    key: "logoDark",
    label: "Logo for dark backgrounds",
    hint: "Optional. Used on the footer and dark sections.",
    boxHeight: "h-28",
    contain: true,
  },
  {
    key: "favicon",
    label: "Favicon",
    hint: "Square PNG or ICO, 32×32 or larger.",
    boxHeight: "h-24",
    contain: true,
  },
  {
    key: "ogImage",
    label: "Social share image",
    hint: "1200×630. Shown when someone shares a link to your site.",
    boxHeight: "h-40",
  },
];

const SOCIALS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
] as const;

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/svg+xml", "image/x-icon", "image/webp"];

export default function BrandingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [platformName, setPlatformName] = useState("");
  const [tagline, setTagline] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#000000");
  const [primaryDark, setPrimaryDark] = useState("#000000");
  const [socials, setSocials] = useState<Record<string, string>>({});

  const [files, setFiles] = useState<Partial<Record<ImageKey, File | null>>>({});
  const [previews, setPreviews] = useState<Partial<Record<ImageKey, string | null>>>({});
  const [cleared, setCleared] = useState<ImageKey[]>([]);

  useEffect(() => {
    fetch(`${API}/api/branding`)
      .then((r) => r.json())
      .then((data) => {
        const b = data.branding ?? {};
        setPlatformName(b.platformName || "");
        setTagline(b.tagline || "");
        setPrimaryColor(b.primaryColor || "#000000");
        setPrimaryDark(b.primaryDark || "#000000");
        setSocials(b.socials || {});
        const next: Partial<Record<ImageKey, string | null>> = {};
        (["logo", "logoDark", "favicon", "ogImage"] as ImageKey[]).forEach((k) => {
          if (b[k]) next[k] = `${API}${b[k]}`;
        });
        setPreviews(next);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const pickFile = (key: ImageKey, file: File | null) => {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      toast.error("Use a PNG, JPG, SVG, WEBP or ICO file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("That image is over 2MB. Compress it and try again.");
      return;
    }
    setFiles((p) => ({ ...p, [key]: file }));
    setPreviews((p) => ({ ...p, [key]: URL.createObjectURL(file) }));
    setCleared((p) => p.filter((k) => k !== key));
  };

  const clearFile = (key: ImageKey) => {
    setFiles((p) => ({ ...p, [key]: null }));
    setPreviews((p) => ({ ...p, [key]: null }));
    setCleared((p) => (p.includes(key) ? p : [...p, key]));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("platformName", platformName);
      fd.append("tagline", tagline);
      fd.append("primaryColor", primaryColor);
      fd.append("primaryDark", primaryDark);
      fd.append("socials", JSON.stringify(socials));
      // Tells the API which stored images to delete.
      if (cleared.length) fd.append("removeImages", JSON.stringify(cleared));
      (Object.keys(files) as ImageKey[]).forEach((k) => {
        const f = files[k];
        if (f) fd.append(k, f);
      });

      const res = await fetch(`${API}/api/branding`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Failed to save");
      toast.success("Branding updated");
      setFiles({});
      setCleared([]);
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

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground italic">Branding</h1>
        <p className="text-sm text-muted mt-1">
          Your logo, colors, and links as they appear across the site.
        </p>
      </div>

      <div className="bg-background border border-line rounded-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-line bg-surface/40">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
            <FiDroplet size={17} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold italic text-foreground">Identity</h2>
            <p className="text-xs text-muted mt-0.5">Name, imagery, and accent colors</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Platform name
              </label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {IMAGE_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {f.label}
                </label>
                {previews[f.key] ? (
                  <div
                    className={`relative w-full ${f.boxHeight} rounded-xl overflow-hidden border border-line group bg-surface/40`}
                  >
                    <img
                      src={previews[f.key]!}
                      className={`w-full h-full ${f.contain ? "object-contain p-4" : "object-cover"}`}
                      alt=""
                    />
                    <label className="absolute inset-0 group-hover:bg-background/40 transition flex items-center justify-center cursor-pointer">
                      <span className="opacity-0 group-hover:opacity-100 text-foreground text-xs font-semibold transition">
                        Change image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => pickFile(f.key, e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => clearFile(f.key)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-sm bg-background/60 hover:bg-background/80 text-foreground flex items-center justify-center transition"
                    >
                      <FiX size={13} />
                    </button>
                  </div>
                ) : (
                  <label
                    className={`flex flex-col items-center justify-center gap-1.5 w-full ${f.boxHeight} border-2 border-dashed border-line hover:border-primary hover:bg-primary/5 rounded-sm cursor-pointer transition`}
                  >
                    <FiImage size={18} className="text-foreground" />
                    <p className="text-xs text-foreground">Click to upload</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => pickFile(f.key, e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-[11px] text-muted mt-1.5">{f.hint}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Primary color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-11 h-11 rounded-xl border border-line cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Primary hover color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryDark}
                  onChange={(e) => setPrimaryDark(e.target.value)}
                  className="w-11 h-11 rounded-xl border border-line cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={primaryDark}
                  onChange={(e) => setPrimaryDark(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">Social links</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SOCIALS.map((s) => (
                <div key={s.key}>
                  <input
                    type="url"
                    placeholder={`${s.label} URL`}
                    value={socials[s.key] || ""}
                    onChange={(e) => setSocials((p) => ({ ...p, [s.key]: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-line bg-surface/30 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary text-foreground text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50 shadow-sm"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}