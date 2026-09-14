"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { FiX, FiMail, FiInbox } from "react-icons/fi";

const STATUS_STYLES: Record<string, { wrap: string; dot: string; label: string }> = {
  new: {
    wrap: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    dot: "bg-amber-500",
    label: "New",
  },
  read: {
    wrap: "bg-blue-500/10 text-blue-400 border-blue-500/25",
    dot: "bg-blue-500",
    label: "Read",
  },
  resolved: {
    wrap: "bg-green-500/10 text-green-400 border-green-500/25",
    dot: "bg-green-500",
    label: "Resolved",
  },
};

const FILTERS = [
  { label: "All Messages", value: "" },
  { label: "New", value: "new" },
  { label: "Read", value: "read" },
  { label: "Resolved", value: "resolved" },
];

const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const fmtDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || {
    wrap: "bg-white/5 text-muted border-line",
    dot: "bg-muted",
    label: status,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${s.wrap}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}


function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide pt-0.5">
        {label}
      </span>
      <span className="text-sm text-foreground/90 break-words">{children}</span>
    </>
  );
}

export default function AdminContactMessagePage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [active, setActive] = useState<any>(null);

  const load = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const data = await apiFetch(`/api/contact?${params.toString()}`, {
        token: getToken()!,
      });
      setMessages(data.messages);
    } catch (error: any) {
      toast.error(error.message || "Failed to load messages");
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), 15000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await apiFetch(`/api/contact/${id}`, {
        method: "POST",
        token: getToken()!,
        body: { status },
      });
      setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, status } : m)));
      setActive((p: any) => (p && p._id === id ? { ...p, status } : p));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  /** Opening an unread message marks it read — that's what "view" means here. */
  const openMessage = (m: any) => {
    setActive(m);
    if (m.status === "new") updateStatus(m._id, "read");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-t-primary border-primary/20 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl px-4 sm:px-6 py-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground italic">Contact Messages</h1>
          <p className="text-sm text-foreground mt-1">Enquiries sent through the contact form.</p>
        </div>

        <div className="inline-flex p-1 bg-surface border border-line rounded-xl gap-1 self-start sm:self-auto">
          {FILTERS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                statusFilter === opt.value
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-foreground hover:text-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-background border border-line rounded-sm overflow-hidden">
        {messages.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="w-11 h-11 rounded-sm bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <FiInbox size={19} />
            </div>
            <p className="text-sm font-semibold text-foreground">No messages found</p>
            <p className="text-xs text-foreground mt-1">Nothing matches this filter.</p>
          </div>
        ) : (
          <>
            {/* ── Table, md and up ── */}
            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface/40">
                  <th className="pl-5 pr-3 py-3.5 text-xs font-semibold text-foreground w-[180px]">
                    Name
                  </th>
                  <th className="px-3 py-3.5 text-xs font-semibold text-foreground w-[200px]">Email</th>
                  <th className="px-3 py-3.5 text-xs font-semibold text-foreground">Message</th>
                  <th className="px-3 py-3.5 text-xs font-semibold text-foreground w-[120px]">Status</th>
                  <th className="px-3 py-3.5 text-xs font-semibold text-foreground w-[110px]">Date</th>
                  <th className="pl-3 pr-5 py-3.5 text-xs font-semibold text-foreground w-[90px] text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {messages.map((m) => (
                  <tr key={m._id} className="hover:bg-surface/50 transition-colors">
                    <td className="pl-5 pr-3 py-4">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Solid dot marks an unread message at a glance */}
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            m.status === "new" ? "bg-primary" : "bg-transparent"
                          }`}
                        />
                        <span className="text-sm font-semibold text-foreground truncate">
                          {m.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <Link
                        href={`mailto:${m.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-foreground/80 hover:text-primary transition truncate block"
                      >
                        {m.email}
                      </Link>
                    </td>
                    {/* max-w-0 is what makes truncate work inside a table cell */}
                    <td className="px-3 py-4 max-w-0">
                      <p className="text-sm text-foreground truncate">{m.message}</p>
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-3 py-4">
                      <span className="text-xs text-foreground whitespace-nowrap">
                        {fmtDate(m.createdAt)}
                      </span>
                    </td>
                    <td className="pl-3 pr-5 py-4 text-right">
                      <button
                        onClick={() => openMessage(m)}
                        className="px-3.5 py-1.5 rounded-sm border border-primary/40 text-primary text-xs font-semibold hover:bg-primary hover:text-white transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Stacked cards below md ── */}
            <div className="md:hidden divide-y divide-line">
              {messages.map((m) => (
                <div key={m._id} className="px-4 py-4">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          m.status === "new" ? "bg-primary" : "bg-transparent"
                        }`}
                      />
                      <span className="text-sm font-semibold text-foreground truncate">
                        {m.name}
                      </span>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                  <p className="text-xs text-foreground/70 truncate">{m.email}</p>
                  <p className="text-xs text-foreground mt-1 line-clamp-2">{m.message}</p>
                  <div className="flex items-center justify-between gap-3 mt-3">
                    <span className="text-[11px] text-foreground">{fmtDate(m.createdAt)}</span>
                    <button
                      onClick={() => openMessage(m)}
                      className="px-4 py-2 rounded-sm border border-primary/40 text-primary text-xs font-semibold hover:bg-primary hover:text-white transition"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Slide-over ── */}
      {active && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setActive(null)}
          />

          <div className="relative w-full sm:max-w-md h-full bg-background border-l border-line flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line shrink-0">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                Message Details
              </h2>
              <button
                onClick={() => setActive(null)}
                className="w-7 h-7 shrink-0 rounded-sm text-foreground hover:text-foreground hover:bg-surface flex items-center justify-center transition"
                aria-label="Close"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Body — every field as a label/value row in a fixed two-column
                grid, so nothing is rendered as one big block of text. */}
            <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4">
              <div className="grid grid-cols-[84px_1fr] gap-x-3 gap-y-3">
                <DetailRow label="Name">{active.name}</DetailRow>

                <DetailRow label="Email">
                  <Link
                    href={`mailto:${active.email}`}
                    className="hover:text-primary transition break-all"
                  >
                    {active.email}
                  </Link>
                </DetailRow>

                {active.phone && <DetailRow label="Phone">{active.phone}</DetailRow>}

                <DetailRow label="Date">{fmtDateTime(active.createdAt)}</DetailRow>

                {active.subject && <DetailRow label="Subject">{active.subject}</DetailRow>}
              </div>

              <div className="mt-5 pt-4 border-t border-line">
                <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide">
                  Message
                </span>
                <p className="mt-2 text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {active.message}
                </p>
              </div>
            </div>

            {/* Status + reply */}
            <div className="flex items-center gap-2 px-5 py-3 border-t border-line bg-surface/30 shrink-0">
              <select
                value={active.status}
                onChange={(e) => updateStatus(active._id, e.target.value)}
                disabled={updatingId === active._id}
                className="px-3 py-2 rounded-sm border border-line bg-background text-xs font-semibold text-foreground cursor-pointer focus:outline-none focus:border-primary transition disabled:opacity-50"
              >
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="resolved">Resolved</option>
              </select>

              <Link
                href={`mailto:${active.email}?subject=${encodeURIComponent(
                  `Re: your message to Luvenex`
                )}`}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-sm bg-primary text-white text-xs font-semibold hover:opacity-90 transition"
              >
                <FiMail size={13} />
                Reply by email
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}