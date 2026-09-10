"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { FiX, FiSend, FiLifeBuoy, FiTrash2, FiSearch } from "react-icons/fi";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] as const;

const ROLE_OPTIONS = [
  { value: "", label: "All sources" },
  { value: "brand", label: "Brands" },
  { value: "influencer", label: "Influencers" },
] as const;

// Status buttons inside the modal — the four real states, no "all".
const STATUS_STEPS = ["open", "in_progress", "resolved", "closed"] as const;

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  resolved: "bg-green-500/10 text-green-400 border-green-500/25",
  closed: "bg-white/5 text-muted border-line",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-white/5 text-muted border-line",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  high: "bg-primary/15 text-primary border-primary/30",
};

const CATEGORY_LABELS: Record<string, string> = {
  payment: "Payments",
  deal: "Deals",
  account: "Account",
  technical: "Technical",
  other: "Other",
};

const fmtDate = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

const fmtDateTime = (iso: string) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // `search` is what's typed; `query` is what's actually been submitted.
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const [active, setActive] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  const load = () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (role) params.set("role", role);
    if (query) params.set("q", query);
    const qs = params.toString() ? `?${params.toString()}` : "";

    return apiFetch(`/api/support-tickets${qs}`, { token: getToken()! })
      .then((d: any) => setTickets(d.tickets || []))
      .catch((e: any) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [status, role, query]);

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

  const selectCls =
    "px-3.5 py-2.5 rounded-xl border border-line bg-background text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground italic">Support Tickets</h1>
        <p className="text-sm text-muted mt-1">
          {loading ? "Loading..." : `${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select value={role} onChange={(e) => setRole(e.target.value)} className={selectCls}>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <FiSearch
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setQuery(search.trim());
            }}
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-line bg-background text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>

        <button
          onClick={() => setQuery(search.trim())}
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition"
        >
          Search
        </button>

        {(status || role || query) && (
          <button
            onClick={() => {
              setStatus("");
              setRole("");
              setSearch("");
              setQuery("");
            }}
            className="text-xs font-semibold text-muted hover:text-foreground transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-background border border-line rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <FiLifeBuoy size={19} />
            </div>
            <p className="text-sm font-semibold text-foreground">No tickets found</p>
            <p className="text-xs text-muted mt-1">Nothing matches these filters.</p>
          </div>
        ) : (
          <>
            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface/40">
                  <th className="pl-5 pr-3 py-3.5 text-xs font-semibold text-muted w-[120px]">
                    Ticket #
                  </th>
                  <th className="px-3 py-3.5 text-xs font-semibold text-muted">Subject</th>
                  <th className="px-3 py-3.5 text-xs font-semibold text-muted w-[170px]">From</th>
                  <th className="px-3 py-3.5 text-xs font-semibold text-muted w-[100px]">
                    Priority
                  </th>
                  <th className="px-3 py-3.5 text-xs font-semibold text-muted w-[130px]">Status</th>
                  <th className="px-3 py-3.5 text-xs font-semibold text-muted w-[80px] text-center">
                    Replies
                  </th>
                  <th className="px-3 py-3.5 text-xs font-semibold text-muted w-[120px]">Date</th>
                  <th className="pl-3 pr-5 py-3.5 text-xs font-semibold text-muted w-[90px] text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-surface/50 transition-colors">
                    <td className="pl-5 pr-3 py-4">
                      <div className="flex items-center gap-2">
                        {/* Solid dot = user replied last, nobody has answered */}
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            t.awaitingAdminReply ? "bg-primary" : "bg-transparent"
                          }`}
                        />
                        <span className="text-xs font-mono text-primary">
                          {t.ticketNumber || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4 max-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{t.title}</p>
                      <p className="text-xs text-muted mt-0.5 truncate">
                        {CATEGORY_LABELS[t.category] || "Other"}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="text-sm text-foreground truncate">{t.createdBy?.name}</p>
                      <p className="text-xs text-muted capitalize">{t.createdByRole}</p>
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${PRIORITY_STYLES[t.priority]}`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${STATUS_STYLES[t.status]}`}
                      >
                        {STATUS_LABELS[t.status]}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span className="text-sm text-foreground/70">{t.messages?.length || 0}</span>
                    </td>
                    <td className="px-3 py-4">
                      <span className="text-xs text-muted whitespace-nowrap">
                        {fmtDate(t.createdAt)}
                      </span>
                    </td>
                    <td className="pl-3 pr-5 py-4 text-right">
                      <button
                        onClick={() => openTicket(t._id)}
                        className="px-3.5 py-1.5 rounded-lg border border-primary/40 text-primary text-xs font-semibold hover:bg-primary hover:text-white transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Stacked cards below md — eight columns don't fit a phone */}
            <div className="md:hidden divide-y divide-line">
              {tickets.map((t) => (
                <button
                  key={t._id}
                  onClick={() => openTicket(t._id)}
                  className="w-full text-left px-4 py-3.5 hover:bg-surface/50 transition"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          t.awaitingAdminReply ? "bg-primary" : "bg-transparent"
                        }`}
                      />
                      <span className="text-xs font-mono text-primary">{t.ticketNumber}</span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLES[t.status]}`}
                    >
                      {STATUS_LABELS[t.status]}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">{t.title}</p>
                  <p className="text-xs text-muted mt-1">
                    {t.createdBy?.name} · {t.createdByRole} · {t.priority} ·{" "}
                    {t.messages?.length || 0} replies · {fmtDate(t.createdAt)}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Slide-over panel ── */}
      {active && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setActive(null)}
          />

          <div className="relative w-full max-w-xl bg-background border-l border-line flex flex-col h-full shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-line shrink-0">
              <div className="min-w-0">
                <p className="text-lg font-bold font-mono text-foreground">
                  {active.ticketNumber}
                </p>
                <p className="text-sm text-muted mt-0.5 truncate">{active.title}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => removeTicket(active._id)}
                  className="w-8 h-8 rounded-lg text-muted hover:text-primary hover:bg-primary/10 flex items-center justify-center transition"
                  aria-label="Delete ticket"
                >
                  <FiTrash2 size={15} />
                </button>
                <button
                  onClick={() => setActive(null)}
                  className="w-8 h-8 rounded-lg text-muted hover:text-foreground hover:bg-surface flex items-center justify-center transition"
                  aria-label="Close"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Meta strip */}
            <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-line bg-surface/40 shrink-0">
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[active.status]}`}
              >
                {STATUS_LABELS[active.status]}
              </span>
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${PRIORITY_STYLES[active.priority]}`}
              >
                {active.priority}
              </span>
              <span className="text-xs text-muted ml-1 truncate">
                From:{" "}
                <span className="text-foreground/80 font-medium">{active.createdBy?.name}</span> (
                {active.createdByRole}) · {active.createdBy?.email}
              </span>
            </div>

            {/* Status buttons */}
            <div className="flex flex-wrap gap-2 px-6 py-3 border-b border-line shrink-0">
              {STATUS_STEPS.map((s) => {
                const isCurrent = active.status === s;
                return (
                  <button
                    key={s}
                    disabled={updating}
                    onClick={() => !isCurrent && patchTicket({ status: s })}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition disabled:opacity-50 ${
                      isCurrent
                        ? "bg-primary text-white border-primary"
                        : "border-line text-muted hover:text-foreground hover:border-foreground/25"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                );
              })}

              <select
                value={active.priority}
                disabled={updating}
                onChange={(e) => patchTicket({ priority: e.target.value })}
                className="ml-auto px-2.5 py-1.5 rounded-lg border border-line bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary cursor-pointer disabled:opacity-50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Thread */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0 bg-surface/20">
              <div className="rounded-xl border border-line bg-background px-4 py-3">
                <p className="text-xs text-muted mb-1">
                  <span className="font-semibold text-foreground/80">
                    {active.createdBy?.name}
                  </span>{" "}
                  · {fmtDateTime(active.createdAt)}
                </p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {active.description}
                </p>
              </div>

              {active.messages?.map((m: any) => {
                const fromAdmin = m.senderRole === "admin";
                return (
                  <div
                    key={m._id}
                    className={`rounded-xl px-4 py-3 border ${
                      fromAdmin
                        ? "ml-8 bg-primary/10 border-primary/25"
                        : "mr-8 bg-background border-line"
                    }`}
                  >
                    <p className="text-xs text-muted mb-1">
                      <span
                        className={`font-semibold ${
                          fromAdmin ? "text-primary" : "text-foreground/80"
                        }`}
                      >
                        {fromAdmin ? "Admin" : m.senderId?.name}
                      </span>{" "}
                      · {fmtDateTime(m.createdAt)}
                    </p>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                      {m.body}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Composer */}
            <div className="px-6 py-4 border-t border-line shrink-0">
              {active.status === "closed" ? (
                <p className="text-xs text-muted text-center py-2">
                  This ticket is closed. Reopen it above to reply.
                </p>
              ) : (
                <div className="flex items-end gap-2.5">
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
                    className="flex-1 px-4 py-3 rounded-xl border border-line bg-surface/40 text-sm text-foreground placeholder:text-muted resize-none focus:outline-none focus:border-primary focus:bg-background transition"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="shrink-0 w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition disabled:opacity-30 disabled:active:scale-100"
                    aria-label="Send reply"
                  >
                    <FiSend size={17} />
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