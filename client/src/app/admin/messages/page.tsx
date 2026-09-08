"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";

/* soft card shell — matches the rest of admin */
const softCard =
  "bg-card rounded-3xl border border-border-color shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-16px_rgba(0,0,0,0.10)]";

export default function AdminFlaggedMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-3xl px-4 sm:px-6 py-8 space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Flagged Messages</h1>
          <p className="text-xs text-zinc-500 mt-1">Review reported content and participant context</p>
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
          <p className="text-zinc-500 text-xs mt-0.5">No flagged messages found in conversations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => {
            const senderName = m.senderId?.name || m.user?.name || "Unknown User";
            const senderRole = m.senderId?.role || m.senderRole || m.role || "User";
            const senderInitial = senderName.charAt(0).toUpperCase();

            const recipientName = m.recipientId?.name || m.receiver?.name || m.targetUser?.name;
            const recipientRole = m.recipientId?.role || m.receiver?.role;
            const recipientInitial = recipientName ? recipientName.charAt(0).toUpperCase() : null;

            const formattedDateTime = new Date(m.createdAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            const isExpanded = expandedId === m._id;

            return (
              <div
                key={m._id}
                className={`${softCard} transition-all border overflow-hidden ${
                  isExpanded ? "border-zinc-400/50 shadow-md" : "hover:border-zinc-400/30"
                }`}
              >
                {/* Collapsed Header / Trigger Bar */}
                <div
                  onClick={() => toggleExpand(m._id)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none bg-card hover:bg-surface/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-surface text-foreground font-bold text-xs flex items-center justify-center shrink-0 border border-border-color shadow-sm">
                      {senderInitial}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">{senderName}</span>
                        <span className="text-[10px] font-medium bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded capitalize">
                          {senderRole}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 truncate mt-0.5 max-w-xs sm:max-w-md">
                        "{m.body}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">
                      {formattedDateTime}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full bg-surface border border-border-color flex items-center justify-center text-zinc-500 transition-transform duration-200 ${
                        isExpanded ? "rotate-180 bg-zinc-200/40 dark:bg-zinc-800 text-foreground" : ""
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 space-y-4 border-t border-border-color/60 bg-surface/20 animate-fadeIn">
                    {/* Participant Context Info */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Sender info pill */}
                        <div className="flex items-center gap-2 bg-card px-2.5 py-1.5 rounded-xl border border-border-color shadow-sm">
                          <span className="font-semibold text-foreground">{senderName}</span>
                          <span className="text-[10px] text-zinc-500 capitalize">({senderRole})</span>
                        </div>

                        {recipientName && (
                          <>
                            <span className="text-zinc-400 font-medium">sent to</span>
                            {/* Recipient info pill */}
                            <div className="flex items-center gap-2 bg-card px-2.5 py-1.5 rounded-xl border border-border-color shadow-sm">
                              <span className="font-semibold text-foreground">{recipientName}</span>
                              {recipientRole && (
                                <span className="text-[10px] text-zinc-500 capitalize">({recipientRole})</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <span className="text-[11px] text-zinc-500 font-medium sm:hidden">
                        {formattedDateTime}
                      </span>
                    </div>

                    {/* Flagged Message Highlight Box */}
                    <div className="relative bg-red-500/[0.04] border border-red-500/20 rounded-2xl p-3.5 shadow-xs">
                      <div className="absolute top-3.5 left-3.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <p className="text-xs sm:text-sm text-foreground leading-relaxed pl-4 font-normal">
                        "{m.body}"
                      </p>
                    </div>

                    {/* Flag Reasons */}
                    {m.flagReasons && m.flagReasons.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-medium text-zinc-500 mr-1">Flag reasons:</span>
                        {m.flagReasons.map((r: string, i: number) => (
                          <span
                            key={i}
                            className="text-[11px] font-medium bg-red-500/10 text-red-500 px-2.5 py-0.5 rounded-lg border border-red-500/20"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}