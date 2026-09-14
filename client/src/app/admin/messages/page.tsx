"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";
import { FiX, FiFlag } from "react-icons/fi";

/* soft card shell — matches the rest of admin */
const softCard =
  "bg-card rounded-sm border border-border-color shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-16px_rgba(0,0,0,0.10)]";

const fmtDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

/** One label/value row in the detail sidebar — same shape for every field
 *  instead of a wall of paragraph text. */
function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <span className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wide pt-0.5">
        {label}
      </span>
      <span className="text-sm text-foreground break-words">{children}</span>
    </>
  );
}

function getMeta(m: any) {
  const senderName = m.senderId?.name || m.user?.name || "Unknown User";
  const senderRole = m.senderId?.role || m.senderRole || m.role || "User";
  const senderInitial = senderName.charAt(0).toUpperCase();

  const recipientName = m.recipientId?.name || m.receiver?.name || m.targetUser?.name;
  const recipientRole = m.recipientId?.role || m.receiver?.role;

  return { senderName, senderRole, senderInitial, recipientName, recipientRole };
}

export default function AdminFlaggedMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<any>(null);

  useEffect(() => {
    const loadMessages = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      try {
        const data = await apiFetch("/api/messages/Flagged", {
          token: getToken()!,
        });
        setMessages(data.messages || []);
        if (isInitial) setLoading(false);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    loadMessages(true);
    const interval = setInterval(() => loadMessages(false), 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl px-4 sm:px-6 py-8 space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Flagged Messages</h1>
          <p className="text-xs text-foreground mt-1">Review reported content and participant context</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`${softCard} p-5 animate-pulse space-y-3`}>
              <div className="h-4 bg-surface rounded w-1/3" />
              <div className="h-10 bg-surface rounded-lg" />
              <div className="h-3 bg-surface rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className={`${softCard} p-12 text-center`}>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-foreground text-sm font-semibold">All clear</p>
          <p className="text-foreground text-xs mt-0.5">No flagged messages found in conversations.</p>
        </div>
      ) : (
        <div className={`${softCard} overflow-hidden`}>
          {/* ── Table, md and up ── */}
          <table className="hidden md:table w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-color bg-surface/60">
                <th className="pl-5 pr-3 py-3.5 text-xs font-semibold text-foreground w-[200px]">
                  Sender
                </th>
                <th className="px-3 py-3.5 text-xs font-semibold text-foreground">Message</th>
                <th className="px-3 py-3.5 text-xs font-semibold text-foreground w-[220px]">
                  Flag Reasons
                </th>
                <th className="px-3 py-3.5 text-xs font-semibold text-foreground w-[140px]">Date</th>
                <th className="pl-3 pr-5 py-3.5 text-xs font-semibold text-foreground w-[90px] text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {messages.map((m) => {
                const { senderName, senderRole, senderInitial } = getMeta(m);
                return (
                  <tr key={m._id} className="hover:bg-surface/50 transition-colors">
                    <td className="pl-5 pr-3 py-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-surface text-foreground font-bold text-xs flex items-center justify-center shrink-0 border border-border-color">
                          {senderInitial}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-foreground truncate block">
                            {senderName}
                          </span>
                          <span className="text-[10px] text-foreground capitalize">{senderRole}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 max-w-0">
                      <p className="text-sm text-foreground truncate">{m.body}</p>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(m.flagReasons || []).slice(0, 2).map((r: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs font-semibold  text-foreground px-2 py-0.5 "
                          >
                            {r}
                          </span>
                        ))}
                        {(m.flagReasons?.length || 0) > 2 && (
                          <span className="text-[10px] text-foreground/50">
                            +{m.flagReasons.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <span className="text-xs text-foreground whitespace-nowrap">
                        {fmtDateTime(m.createdAt)}
                      </span>
                    </td>
                    <td className="pl-3 pr-5 py-4 text-right">
                      <button
                        onClick={() => setActive(m)}
                        className="px-3.5 py-1.5 rounded-sm border border-red-500/30 text-red-500 text-xs font-semibold hover:bg-red-500 hover:text-white transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ── Stacked cards below md ── */}
          <div className="md:hidden divide-y divide-border-color">
            {messages.map((m) => {
              const { senderName, senderRole, senderInitial } = getMeta(m);
              return (
                <div key={m._id} className="px-4 py-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-surface text-foreground font-bold text-xs flex items-center justify-center shrink-0 border border-border-color">
                      {senderInitial}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-foreground truncate block">
                        {senderName}
                      </span>
                      <span className="text-[10px] text-foreground/60 capitalize">{senderRole}</span>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/70 line-clamp-2">{m.body}</p>
                  <div className="flex items-center justify-between gap-3 mt-3">
                    <span className="text-[11px] text-foreground/60">{fmtDateTime(m.createdAt)}</span>
                    <button
                      onClick={() => setActive(m)}
                      className="px-4 py-2 rounded-sm border border-red-500/30 text-red-500 text-xs font-semibold hover:bg-red-500 hover:text-white transition"
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Detail sidebar ── */}
      {active && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-background backdrop-blur-sm"
            onClick={() => setActive(null)}
          />

          <div className="relative w-full sm:max-w-md h-full bg-card border-l border-border-color flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border-color shrink-0">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground ">
                <FiFlag className="text-red-500" size={14} />
                Flagged Message
              </h2>
              <button
                onClick={() => setActive(null)}
                className="w-7 h-7 shrink-0 rounded-sm text-foreground/60 hover:text-foreground hover:bg-surface flex items-center justify-center transition"
                aria-label="Close"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4">
              <div className="grid grid-cols-[84px_1fr] gap-x-3 gap-y-3">
                <DetailRow label="Sender">
                  {getMeta(active).senderName}{" "}
                  <span className="text-foreground">({getMeta(active).senderRole})</span>
                </DetailRow>

                {getMeta(active).recipientName && (
                  <DetailRow label="Recipient">
                    {getMeta(active).recipientName}{" "}
                    {getMeta(active).recipientRole && (
                      <span className="text-foreground/50 capitalize">
                        ({getMeta(active).recipientRole})
                      </span>
                    )}
                  </DetailRow>
                )}

                <DetailRow label="Date">{fmtDateTime(active.createdAt)}</DetailRow>
              </div>

              {active.flagReasons && active.flagReasons.length > 0 && (
                <div className="mt-5 pt-4 border-t border-border-color">
                  <span className="text-[14px] font-semibold text-foreground">
                    Flag Reasons
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {active.flagReasons.map((r: string, i: number) => (
                      <span
                        key={i}
                        className="text-[13px] font-medium bg-background text-foreground px-2.5 py-2.5 rounded-sm border border-border-color"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-border-color">
                <span className="text-[14px] font-semibold text-foreground">
                  Message
                </span>
                <div className="relative  mt-2">
                  <p className="text-sm text-foreground leading-relaxed pl-4">{active.body}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}