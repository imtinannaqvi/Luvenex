"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";

/* soft card shell — matches the rest of admin (border keeps cards defined in dark mode) */
const softCard =
  "bg-background rounded-3xl border border-line shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-16px_rgba(0,0,0,0.10)]";

export default function AdminFlaggedMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const data = await apiFetch("/api/messages/Flagged", {
          token: getToken()!,
        });
        setMessages(data.messages || []);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, []);

  return (
    <div className="max-w-3xl  px-4 sm:px-6 py-8 space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>

          <h1 className="text-2xl font-bold text-foreground italic">Flagged Messages</h1>
        </div>
        {/* {!loading && messages.length > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/[0.06] text-primary border border-primary/20">
            {messages.length} open
          </span>
        )} */}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`${softCard} p-5 animate-pulse space-y-3`}>
              <div className="h-4 bg-line rounded w-1/3" />
              <div className="h-10 bg-line rounded-lg" />
              <div className="h-3 bg-line rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className={`${softCard} p-10 text-center`}>
          <p className="text-foreground text-sm italic">No flagged messages. Clean conversations.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {messages.map((m, idx) => {
            const senderName = m.senderId?.name || m.user?.name || "Unknown User";
            const senderRole = m.senderId?.role || m.senderRole || m.role || "User";
            const initial = senderName.charAt(0).toUpperCase();

            const formattedDateTime = new Date(m.createdAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div key={m._id} className={`${softCard} p-5`}>
                {/* sender row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-background/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 border border-primary/20">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{senderName}</p>
                      <span className="text-[11px] font-medium text-foreground capitalize">{senderRole}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-foreground shrink-0">{formattedDateTime}</span>
                </div>

                {/* flagged message body */}
                <div className="mt-3 pl-3 border-l-2 border-primary bg-primary/30 py-2.5 px-3 rounded-r-lg">
                  <p className="text-sm text-foreground leading-relaxed italic">"{m.body}"</p>
                </div>

                {/* flag reasons */}
                {m.flagReasons && m.flagReasons.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {m.flagReasons.map((r: string, i: number) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold bg-primary/[0.06] text-primary px-2 py-0.5 rounded-md border border-primary/20"
                      >
                        {r}
                      </span>
                    ))}
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