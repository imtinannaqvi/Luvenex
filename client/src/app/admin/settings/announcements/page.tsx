"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { FiVolume2, FiPlus, FiEdit2, FiTrash2, FiX } from "react-icons/fi";

const TYPES = [
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "danger", label: "Danger" },
] as const;

const AUDIENCES = [
  { value: "all", label: "All" },
  { value: "brands", label: "Brands" },
  { value: "influencers", label: "Influencers" },
] as const;

type Announcement = {
  _id?: string;
  title: string;
  message: string;
  type: string;
  audience: string;
  expiresAt: string | null;
  isActive: boolean;
};

const EMPTY: Announcement = {
  title: "",
  message: "",
  type: "info",
  audience: "all",
  expiresAt: null,
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
  if (!a.isActive) return { label: "Inactive", cls: "bg-surface text-muted border-line" };
  if (a.expiresAt && new Date(a.expiresAt).getTime() < Date.now())
    return { label: "Expired", cls: "bg-surface text-muted border-line" };
  return { label: "Live", cls: "bg-green-50 text-green-700 border-green-200" };
}

// <input type="date"> wants YYYY-MM-DD; the API returns a full ISO timestamp.
const toDateInput = (v: string | null) => (v ? v.slice(0, 10) : "");

const labelFor = (list: readonly { value: string; label: string }[], value: string) =>
  list.find((o) => o.value === value)?.label ?? value;

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

  const handleSave = async () => {
    if (!draft) return;
    if (!draft.title.trim()) return toast.error("Give the announcement a title.");
    if (!draft.message.trim()) return toast.error("Add a message.");

    setSaving(true);
    try {
      const isEdit = Boolean(draft._id);
      await apiFetch(isEdit ? `/api/announcements/${draft._id}` : "/api/announcements", {
        method: isEdit ? "PATCH" : "POST",
        token: getToken()!,
        body: {
          title: draft.title,
          message: draft.message,
          type: draft.type,
          audience: draft.audience,
          expiresAt: draft.expiresAt,
          isActive: draft.isActive,
        },
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
    if (!confirm("Delete this announcement? Users will stop seeing it right away.")) return;
    try {
      await apiFetch(`/api/announcements/${id}`, { method: "DELETE", token: getToken()! });
      toast.success("Announcement deleted");
      setItems((p) => p.filter((a) => a._id !== id));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground border border-line text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground italic">Announcements</h1>
          <p className="text-sm text-muted mt-1">
            Banners shown to brands and influencers across the site.
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
              Create one to show a banner to brands, influencers, or both.
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
                        {labelFor(TYPES, a.type)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm border ${status.cls}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1 line-clamp-1">{a.message}</p>
                    <p className="text-[11px] text-muted mt-1.5">
                      {labelFor(AUDIENCES, a.audience)}
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
            <div className="flex items-center justify-between px-6 py-5">
              <h2 className="text-xl font-bold text-foreground">
                {draft._id ? "Edit Announcement" : "New Announcement"}
              </h2>
              <button
                onClick={() => setDraft(null)}
                className="w-8 h-8 rounded-sm text-muted hover:text-foreground hover:bg-surface flex items-center justify-center transition"
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="px-6 pb-2 space-y-4">
              <input
                type="text"
                placeholder="Title *"
                value={draft.title}
                onChange={(e) => setField("title", e.target.value)}
                className={inputCls}
              />

              <textarea
                rows={4}
                placeholder="Message *"
                value={draft.message}
                onChange={(e) => setField("message", e.target.value)}
                className={inputCls}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Type
                  </label>
                  <select
                    value={draft.type}
                    onChange={(e) => setField("type", e.target.value)}
                    className={inputCls}
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Audience
                  </label>
                  <select
                    value={draft.audience}
                    onChange={(e) => setField("audience", e.target.value)}
                    className={inputCls}
                  >
                    {AUDIENCES.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Expires At (optional)
                </label>
                <input
                  type="date"
                  value={toDateInput(draft.expiresAt)}
                  onChange={(e) => setField("expiresAt", e.target.value || null)}
                  className={inputCls}
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(e) => setField("isActive", e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-foreground">Active (visible to users)</span>
              </label>
            </div>

            <div className="px-6 py-5 flex justify-end gap-2">
              <button
                onClick={() => setDraft(null)}
                className="px-5 py-2.5 rounded-xl border border-line text-sm font-semibold text-foreground hover:bg-surface transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-primary text-foreground text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50 shadow-sm"
              >
                {saving ? "Saving..." : draft._id ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}