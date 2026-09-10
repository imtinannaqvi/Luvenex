"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { FiX, FiSend, FiLifeBuoy, FiTrash2 } from "react-icons/fi";

const STATUSES = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] as const;

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

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-surface text-muted border-line",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

const CATEGORY_LABELS: Record<string, string> = {
  payment: "Payments",
  deal: "Deals",
  account: "Account",
  technical: "Technical",
  other: "Other",
};

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

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const [active, setActive] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  const load = () => {
    const qs = statusFilter ? `?status=${statusFilter}` : "";
    return apiFetch(`/api/support-tickets${qs}`, { token: getToken()! })
      .then((d: any) => {
        setTickets(d.tickets || []);
        setCounts(d.counts || {});
      })
      .catch((e: any) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [statusFilter]);

  const openTicket = async (id: string) => {
    try {
      const d = await apiFetch(`/api/support-tickets/${id}`, { token: getToken()! });
      setActive(d.ticket);
    } catch (e: any) {
      toast.error(e.message);
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

  const patchTicket = async (patch: any) => {
    if (!active) return;
    setUpdating(true);
    try {
      const d = await apiFetch(`/api/support-tickets/${active._id}`, {
        method: "PATCH",
        token: getToken()!,
        body: patch,
      });
      setActive((p: any) => ({ ...p, ...d.ticket }));
      toast.success("Ticket updated");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const removeTicket = async (id: string) => {
    if (!confirm("Delete this ticket permanently?")) return;
    try {
      await apiFetch(`/api/support-tickets/${id}`, { method: "DELETE", token: getToken()! });
      toast.success("Ticket deleted");
      setActive(null);
      setTickets((p) => p.filter((t) => t._id !== id));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-line bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground italic">Support Tickets</h1>
        <p className="text-sm text-muted mt-1">Issues raised by brands and influencers.</p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap items-center gap-2 mb-6 p-1.5 bg-surface border border-line rounded-sm overflow-x-auto">
        {STATUSES.map((s) => {
          const isActive = statusFilter === s.value;
          const count = s.value ? counts[s.value] : undefined;
          return (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-sm transition whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-background text-foreground shadow-sm border border-line"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {s.label}
              {count !== undefined && count > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-background border border-line rounded-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <FiLifeBuoy size={19} />
            </div>
            <p className="text-sm font-semibold text-foreground">No tickets here</p>
            <p className="text-xs text-muted mt-1">Nothing matches this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {tickets.map((t) => (
              <button
                key={t._id}
                onClick={() => openTicket(t._id)}
                className="w-full text-left px-5 py-4 hover:bg-surface/50 transition flex items-start gap-4"
              >
                {/* Unanswered marker */}
                <span
                  className={`mt-2 w-2 h-2 rounded-full shrink-0 ${
                    t.awaitingAdminReply ? "bg-primary" : "bg-transparent"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono text-muted">{ticketRef(t._id)}</span>
                    <p className="text-sm font-semibold text-foreground truncate">{t.title}</p>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm border ${STATUS_STYLES[t.status]}`}
                    >
                      {STATUS_LABELS[t.status]}
                    </span>
                    {t.priority === "high" && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm border ${PRIORITY_STYLES.high}`}
                      >
                        High
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-1 line-clamp-1">{t.description}</p>
                  <p className="text-[11px] text-muted mt-1.5">
                    {t.createdBy?.name} · {t.createdByRole} · {CATEGORY_LABELS[t.category]} ·{" "}
                    {timeAgo(t.updatedAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Ticket thread ── */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl bg-background border border-line rounded-xl shadow-xl flex flex-col max-h-[88vh]">
            <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-line shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono text-muted">{ticketRef(active._id)}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm border ${STATUS_STYLES[active.status]}`}
                  >
                    {STATUS_LABELS[active.status]}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground mt-1 truncate">{active.title}</h2>
                <p className="text-[11px] text-muted mt-0.5">
                  {active.createdBy?.name} · {active.createdBy?.email} · {active.createdByRole}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => removeTicket(active._id)}
                  className="w-8 h-8 rounded-sm text-muted hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition"
                  aria-label="Delete ticket"
                >
                  <FiTrash2 size={15} />
                </button>
                <button
                  onClick={() => setActive(null)}
                  className="w-8 h-8 rounded-sm text-muted hover:text-foreground hover:bg-surface flex items-center justify-center transition"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Status + priority controls */}
            <div className="px-6 py-3 border-b border-line bg-surface/30 shrink-0 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-muted">Status</label>
                <select
                  value={active.status}
                  disabled={updating}
                  onChange={(e) => patchTicket({ status: e.target.value })}
                  className="px-2.5 py-1.5 rounded-sm border border-line bg-background text-xs font-semibold focus:outline-none focus:border-primary"
                >
                  {STATUSES.filter((s) => s.value).map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-muted">Priority</label>
                <select
                  value={active.priority}
                  disabled={updating}
                  onChange={(e) => patchTicket({ priority: e.target.value })}
                  className="px-2.5 py-1.5 rounded-sm border border-line bg-background text-xs font-semibold focus:outline-none focus:border-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <span className="text-[11px] text-muted ml-auto">
                {CATEGORY_LABELS[active.category]}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
              {/* The original description reads as the first message */}
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-xl rounded-bl-sm bg-surface border border-line px-3.5 py-2.5">
                  <p className="text-[11px] font-semibold text-foreground/70 mb-0.5">
                    {active.createdBy?.name}
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-line">
                    {active.description}
                  </p>
                  <p className="text-[10px] text-muted mt-1.5">{timeAgo(active.createdAt)}</p>
                </div>
              </div>

              {active.messages?.map((m: any) => {
                const fromAdmin = m.senderRole === "admin";
                return (
                  <div
                    key={m._id}
                    className={`flex ${fromAdmin ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-3.5 py-2.5 rounded-xl ${
                        fromAdmin
                          ? "rounded-br-sm bg-primary/10 border border-primary/20"
                          : "rounded-bl-sm bg-surface border border-line"
                      }`}
                    >
                      <p className="text-[11px] font-semibold text-foreground/70 mb-0.5">
                        {fromAdmin ? "You" : m.senderId?.name}
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-line">{m.body}</p>
                      <p
                        className={`text-[10px] text-muted mt-1.5 ${fromAdmin ? "text-right" : ""}`}
                      >
                        {timeAgo(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-3 border-t border-line shrink-0">
              {active.status === "closed" ? (
                <p className="text-xs text-muted text-center py-2">
                  This ticket is closed. Reopen it above to reply.
                </p>
              ) : (
                <div className="flex items-end gap-2">
                  <textarea
                    rows={2}
                    placeholder="Reply to the user..."
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