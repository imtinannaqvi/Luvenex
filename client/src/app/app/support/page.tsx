"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { FiPlus, FiX, FiSend, FiLifeBuoy } from "react-icons/fi";

const CATEGORIES = [
  { value: "payment", label: "Payments & payouts" },
  { value: "deal", label: "Deals & campaigns" },
  { value: "account", label: "Account & profile" },
  { value: "technical", label: "Technical problem" },
  { value: "other", label: "Something else" },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  payment: "Payments",
  deal: "Deals",
  account: "Account",
  technical: "Technical",
  other: "Other",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-surface text-muted border-line",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

// Short human reference derived from the id — no counter collection needed.
const ticketRef = (id: string) => `#${id.slice(-6).toUpperCase()}`;

const timeAgo = (iso: string) => {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function SupportPage() {
  const user = getUser();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");

  const [active, setActive] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = () =>
    apiFetch("/api/support-tickets/mine", { token: getToken()! })
      .then((d: any) => setTickets(d.tickets || []))
      .catch((e: any) => toast.error(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const openTicket = async (id: string) => {
    try {
      const d = await apiFetch(`/api/support-tickets/${id}`, { token: getToken()! });
      setActive(d.ticket);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const submitTicket = async () => {
    if (!title.trim()) return toast.error("Give your issue a short title.");
    if (!description.trim()) return toast.error("Describe what's going wrong.");

    setSubmitting(true);
    try {
      await apiFetch("/api/support-tickets", {
        method: "POST",
        token: getToken()!,
        body: { title, description, category },
      });
      toast.success("Ticket submitted — we'll get back to you.");
      setTitle("");
      setDescription("");
      setCategory("other");
      setCreating(false);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !active) return;
    setSending(true);
    try {
      const d = await apiFetch(`/api/support-tickets/${active._id}/messages`, {
        method: "POST",
        token: getToken()!,
        body: { body: reply },
      });
      setActive(d.ticket);
      setReply("");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-border-color bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Raise an issue and track our replies here.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition shrink-0"
        >
          <FiPlus size={15} />
          New ticket
        </button>
      </div>

      <div className="bg-card border border-border-color rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <FiLifeBuoy size={19} />
            </div>
            <p className="text-sm font-semibold text-foreground">No tickets yet</p>
            <p className="text-xs text-foreground/50 mt-1">
              Raise one and our team will pick it up.
            </p>
          </div>
        ) : (
          <>
            {/* ── Table, md and up ── */}
            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-color bg-surface/40">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-foreground/45 w-[110px]">
                    Ticket
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-foreground/45">
                    Issue
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-foreground/45 w-[120px]">
                    Category
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-foreground/45 w-[120px]">
                    Status
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-foreground/45 w-[90px] text-center">
                    Replies
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-foreground/45 w-[120px] text-right">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {tickets.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => openTicket(t._id)}
                    className="group cursor-pointer hover:bg-surface/60 transition-colors"
                  >
                    <td className="px-5 py-4 align-top">
                      <span className="text-xs font-mono text-foreground/45 group-hover:text-primary transition-colors">
                        {ticketRef(t._id)}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top max-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{t.title}</p>
                      <p className="text-xs text-foreground/50 mt-0.5 truncate">{t.description}</p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className="text-xs text-foreground/60">
                        {CATEGORY_LABELS[t.category] || "Other"}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-sm border whitespace-nowrap ${STATUS_STYLES[t.status]}`}
                      >
                        {STATUS_LABELS[t.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top text-center">
                      <span
                        className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-sm text-[11px] font-bold ${
                          t.messages?.length
                            ? "bg-primary/10 text-primary"
                            : "text-foreground/30"
                        }`}
                      >
                        {t.messages?.length || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top text-right">
                      <span className="text-[11px] text-foreground/45 whitespace-nowrap">
                        {timeAgo(t.updatedAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Stacked cards, below md ── */}
            <div className="md:hidden divide-y divide-border-color">
              {tickets.map((t) => (
                <button
                  key={t._id}
                  onClick={() => openTicket(t._id)}
                  className="w-full text-left px-4 py-3.5 hover:bg-surface transition"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-mono text-foreground/45">
                      {ticketRef(t._id)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm border shrink-0 ${STATUS_STYLES[t.status]}`}
                    >
                      {STATUS_LABELS[t.status]}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">{t.title}</p>
                  <p className="text-xs text-foreground/50 mt-0.5 line-clamp-1">{t.description}</p>
                  <p className="text-[11px] text-foreground/40 mt-1.5">
                    {CATEGORY_LABELS[t.category] || "Other"} · {t.messages?.length || 0} replies ·{" "}
                    {timeAgo(t.updatedAt)}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── New ticket modal ── */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg bg-card border border-border-color rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5">
              <h2 className="text-xl font-bold text-foreground">New Ticket</h2>
              <button
                onClick={() => setCreating(false)}
                className="w-8 h-8 rounded-sm text-foreground/50 hover:text-foreground hover:bg-surface flex items-center justify-center transition"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="px-6 pb-2 space-y-4">
              <input
                type="text"
                placeholder="Title *"
                maxLength={160}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
              />

              <textarea
                rows={5}
                maxLength={4000}
                placeholder="Describe the issue *  — what you did, what happened, and what you expected."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputCls}
              />

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputCls}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 py-5 flex justify-end gap-2">
              <button
                onClick={() => setCreating(false)}
                className="px-5 py-2.5 rounded-xl border border-border-color text-sm font-semibold text-foreground hover:bg-surface transition"
              >
                Cancel
              </button>
              <button
                onClick={submitTicket}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Ticket thread ── */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl bg-card border border-border-color rounded-xl shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border-color shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono text-foreground/40">
                    {ticketRef(active._id)}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm border ${STATUS_STYLES[active.status]}`}
                  >
                    {STATUS_LABELS[active.status]}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground mt-1 truncate">{active.title}</h2>
              </div>
              <button
                onClick={() => setActive(null)}
                className="w-8 h-8 shrink-0 rounded-sm text-foreground/50 hover:text-foreground hover:bg-surface flex items-center justify-center transition"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
              {/* The original description reads as the first message */}
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-xl rounded-br-sm bg-primary/10 border border-primary/20 px-3.5 py-2.5">
                  <p className="text-sm text-foreground whitespace-pre-line">
                    {active.description}
                  </p>
                  <p className="text-[10px] text-foreground/40 mt-1.5 text-right">
                    {timeAgo(active.createdAt)}
                  </p>
                </div>
              </div>

              {active.messages?.map((m: any) => {
                const mine = m.senderRole === "user";
                return (
                  <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] px-3.5 py-2.5 rounded-xl ${
                        mine
                          ? "rounded-br-sm bg-primary/10 border border-primary/20"
                          : "rounded-bl-sm bg-surface border border-border-color"
                      }`}
                    >
                      {!mine && (
                        <p className="text-[11px] font-semibold text-primary mb-0.5">
                          Support team
                        </p>
                      )}
                      <p className="text-sm text-foreground whitespace-pre-line">{m.body}</p>
                      <p
                        className={`text-[10px] text-foreground/40 mt-1.5 ${mine ? "text-right" : ""}`}
                      >
                        {timeAgo(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-3 border-t border-border-color shrink-0">
              {active.status === "closed" ? (
                <p className="text-xs text-foreground/50 text-center py-2">
                  This ticket is closed. Raise a new one if you still need help.
                </p>
              ) : (
                <div className="flex items-end gap-2">
                  <textarea
                    rows={2}
                    placeholder="Write a reply..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                    className={inputCls + " resize-none"}
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="shrink-0 w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center hover:opacity-90 transition disabled:opacity-40"
                    aria-label="Send reply"
                  >
                    <FiSend size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}