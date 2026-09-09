"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getToken } from "@/lib/auth";
import { FiImage, FiX, FiDroplet } from "react-icons/fi";

const API = process.env.NEXT_PUBLIC_API_URL;

type ImageKey = "logo" | "favicon";

const FIELDS: {
  key: ImageKey;
  label: string;
  hint: string;
  boxHeight: string;
}[] = [
  {
    key: "logo",
    label: "Logo",
    hint: "SVG or transparent PNG, around 240×64. Shown in the site header.",
    boxHeight: "h-32",
  },
  {
    key: "favicon",
    label: "Favicon",
    hint: "Square PNG or ICO, 32×32 or larger. Shown in the browser tab.",
    boxHeight: "h-32",
  },
];

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
];

export default function BrandingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [files, setFiles] = useState<Partial<Record<ImageKey, File | null>>>({});
  const [previews, setPreviews] = useState<Partial<Record<ImageKey, string | null>>>({});
  const [cleared, setCleared] = useState<ImageKey[]>([]);

  useEffect(() => {
    fetch(`${API}/api/branding`)
      .then(async (r) => {
        if (!r.ok) {
          throw new Error(
            r.status === 404
              ? "Branding endpoint not found — check that /api/branding is mounted."
              : `Request failed (${r.status})`
          );
        }
        return r.json();
      })
      .then((data) => {
        const b = data.branding ?? {};
        const next: Partial<Record<ImageKey, string | null>> = {};
        (["logo", "favicon"] as ImageKey[]).forEach((k) => {
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
      toast.error("Use a PNG, JPG, WEBP, SVG or ICO file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("That image is over 5MB. Compress it and try again.");
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground italic">Branding</h1>
        <p className="text-sm text-muted mt-1">Your logo and favicon.</p>
      </div>

      <div className="bg-background border border-line rounded-sm overflow-hidden max-w-2xl">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-line bg-surface/40">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
            <FiDroplet size={17} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold italic text-foreground">Images</h2>
            <p className="text-xs text-muted mt-0.5">Shown across the public site</p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                {f.label}
              </label>
              {previews[f.key] ? (
                <div
                  className={`relative w-full ${f.boxHeight} rounded-xl overflow-hidden border border-line group bg-surface/40`}
                >
                  <img
                    src={previews[f.key]!}
                    className="w-full h-full object-contain p-4"
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
                    aria-label={`Remove ${f.label}`}
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