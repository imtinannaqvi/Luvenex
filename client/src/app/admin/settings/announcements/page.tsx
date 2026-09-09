"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { FiVolume2, FiPlus, FiEdit2, FiTrash2, FiX } from "react-icons/fi";

const TYPES = ["info", "success", "warning", "danger"] as const;
const AUDIENCES = ["all", "brands", "influencers"] as const;

type Announcement = {
  _id?: string;
  title: string;
  description: string;
  type: (typeof TYPES)[number];
  audience: string[];
  startAt: string | null;
  expiresAt: string | null;
  isDismissible: boolean;
  ctaLabel: string;
  ctaUrl: string;
  isActive: boolean;
};

const EMPTY: Announcement = {
  title: "",
  description: "",
  type: "info",
  audience: ["all"],
  startAt: null,
  expiresAt: null,
  isDismissible: true,
  ctaLabel: "",
  ctaUrl: "",
  isActive: true,
};

const TYPE_STYLES: Record<string, string> = {
  info: "bg-blue-50 text-blue-700 border-blue-200",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
};

// Status is derived, never stored — otherwise it goes stale the moment a date passes.
function statusOf(a: Announcement) {
  const now = Date.now();
  if (!a.isActive) return { label: "Draft", cls: "bg-surface text-muted border-line" };
  if (a.expiresAt && new Date(a.expiresAt).getTime() < now)
    return { label: "Expired", cls: "bg-surface text-muted border-line" };
  if (a.startAt && new Date(a.startAt).getTime() > now)
    return { label: "Scheduled", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: "Live", cls: "bg-green-50 text-green-700 border-green-200" };
}

const toLocalInput = (v: string | null) => (v ? v.slice(0, 16) : "");

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

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Announcement | null>(null);

  const load = () =>
    apiFetch("/api/announcements", { token: getToken()! })
      .then((data: any) => setItems(data.announcements || []))
      .catch((err: any) => toast.error(err.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const setField = (key: keyof Announcement, value: any) =>
    setDraft((p) => (p ? { ...p, [key]: value } : p));

  const toggleAudience = (aud: string) => {
    if (!draft) return;
    if (aud === "all") return setField("audience", ["all"]);
    const without = draft.audience.filter((a) => a !== "all");
    const next = without.includes(aud)
      ? without.filter((a) => a !== aud)
      : [...without, aud];
    setField("audience", next.length ? next : ["all"]);
  };

  const handleSave = async () => {
    if (!draft) return;
    if (!draft.title.trim()) return toast.error("Give the announcement a title.");
    if (draft.startAt && draft.expiresAt && draft.expiresAt <= draft.startAt)
      return toast.error("The expiry date has to be after the start date.");

    setSaving(true);
    try {
      const isEdit = Boolean(draft._id);
      await apiFetch(isEdit ? `/api/announcements/${draft._id}` : "/api/announcements", {
        method: isEdit ? "PATCH" : "POST",
        token: getToken()!,
        body: draft,
      });
      toast.success(isEdit ? "Announcement updated" : "Announcement created");
      setDraft(null);
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement? Visitors will stop seeing it right away.")) return;
    try {
      await apiFetch(`/api/announcements/${id}`, { method: "DELETE", token: getToken()! });
      toast.success("Announcement deleted");
      setItems((p) => p.filter((a) => a._id !== id));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground italic">Announcements</h1>
          <p className="text-sm text-muted mt-1">
            Banners shown across the site, targeted by audience and date.
          </p>
        </div>
        <button
          onClick={() => setDraft({ ...EMPTY })}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-foreground text-sm font-semibold hover:bg-primary-dark transition shadow-sm shrink-0"
        >
          <FiPlus size={15} />
          New announcement
        </button>
      </div>

      <div className="bg-background border border-line rounded-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <FiVolume2 size={19} />
            </div>
            <p className="text-sm font-semibold text-foreground">No announcements yet</p>
            <p className="text-xs text-muted mt-1">
              Create one to show a banner to brands, creators, or everyone.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {items.map((a) => {
              const status = statusOf(a);
              return (
                <div key={a._id} className="flex items-start gap-4 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">{a.title}</p>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm border ${TYPE_STYLES[a.type]}`}
                      >
                        {a.type}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm border ${status.cls}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1 line-clamp-1">{a.description}</p>
                    <p className="text-[11px] text-muted mt-1.5">
                      {a.audience.join(", ")}
                      {a.expiresAt
                        ? ` · expires ${new Date(a.expiresAt).toLocaleDateString()}`
                        : " · no expiry"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setDraft({ ...EMPTY, ...a })}
                      className="w-8 h-8 rounded-sm text-muted hover:text-foreground hover:bg-surface flex items-center justify-center transition"
                      aria-label="Edit"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(a._id!)}
                      className="w-8 h-8 rounded-sm text-muted hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition"
                      aria-label="Delete"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background border border-line rounded-xl shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface/40 sticky top-0">
              <h2 className="text-lg font-bold italic text-foreground">
                {draft._id ? "Edit announcement" : "New announcement"}
              </h2>
              <button
                onClick={() => setDraft(null)}
                className="w-8 h-8 rounded-sm text-muted hover:text-foreground hover:bg-surface flex items-center justify-center transition"
              >
                <FiX size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Title</label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => setField("title", e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setField("description", e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Type</label>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setField("type", t)}
                      className={`px-3 py-1.5 rounded-sm text-xs font-semibold border transition ${
                        draft.type === t
                          ? TYPE_STYLES[t]
                          : "border-line text-muted hover:text-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Show to
                </label>
                <p className="text-[11px] text-muted mb-2">
                  &quot;All&quot; covers both brands and influencers. Admins never see banners.
                </p>
                <div className="flex flex-wrap gap-2">
                  {AUDIENCES.map((aud) => (
                    <button
                      key={aud}
                      type="button"
                      onClick={() => toggleAudience(aud)}
                      className={`px-3 py-1.5 rounded-sm text-xs font-semibold border transition ${
                        draft.audience.includes(aud)
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "border-line text-muted hover:text-foreground"
                      }`}
                    >
                      {aud}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Starts at
                  </label>
                  <input
                    type="datetime-local"
                    value={toLocalInput(draft.startAt)}
                    onChange={(e) => setField("startAt", e.target.value || null)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Expires at
                  </label>
                  <input
                    type="datetime-local"
                    value={toLocalInput(draft.expiresAt)}
                    onChange={(e) => setField("expiresAt", e.target.value || null)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Button label
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={draft.ctaLabel}
                    onChange={(e) => setField("ctaLabel", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Button link
                  </label>
                  <input
                    type="url"
                    placeholder="Optional"
                    value={draft.ctaUrl}
                    onChange={(e) => setField("ctaUrl", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 p-4 rounded-sm border border-line bg-surface/30">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Let users dismiss it</p>
                  <p className="text-xs text-muted mt-0.5">
                    Adds a close button. Turn off for critical notices.
                  </p>
                </div>
                <Toggle
                  checked={draft.isDismissible}
                  onChange={(v) => setField("isDismissible", v)}
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-4 rounded-sm border border-line bg-surface/30">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Active</p>
                  <p className="text-xs text-muted mt-0.5">
                    Turn off to keep it as a draft without deleting it.
                  </p>
                </div>
                <Toggle checked={draft.isActive} onChange={(v) => setField("isActive", v)} />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-line bg-surface/30 flex justify-end gap-2 sticky bottom-0">
              <button
                onClick={() => setDraft(null)}
                className="px-5 py-2.5 rounded-xl border border-line text-sm font-semibold text-muted hover:text-foreground transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-primary text-foreground text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50 shadow-sm"
              >
                {saving ? "Saving..." : draft._id ? "Save changes" : "Create announcement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}