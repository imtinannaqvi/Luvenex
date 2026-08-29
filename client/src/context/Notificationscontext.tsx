"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";

/**
 * Map a notification `type` (whatever your notification.service.js sets)
 * to the sidebar href where its badge should appear.
 *
 * NOTE: the Messages badge is NOT driven from here — it comes from the
 * live /api/messages/unread-count endpoint below, so it goes up and down
 * as threads are read. `new_message` notifications only power the toast.
 */
const TYPE_TO_HREF: Record<string, string> = {
  campaign_created: "/app/discover-campaigns",
  campaign_updated: "/app/discover-campaigns",
  new_campaign: "/app/discover-campaigns",
  application_received: "/app/campaigns",
  new_application: "/app/campaigns",
  gig_created: "/app/gigs",
  new_gig: "/app/gigs",
};

const MESSAGES_HREF = "/app/messages";

type Noti = {
  _id: string;
  type?: string;
  title?: string;
  message?: string;
  isRead?: boolean;
  createdAt?: string;
};

type Ctx = {
  notifications: Noti[];
  unreadCount: number;
  messageUnread: number;
  badgeCounts: Record<string, number>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  reload: () => void;
};

const NotificationsContext = createContext<Ctx | null>(null);

// Notifications shown in the bell exclude message notifications (those have
// their own Messages badge). The bell count and the bell list must use the
// SAME filter, or the badge shows a number while the list looks empty.
const isBellNoti = (n: Noti) => n.type !== "new_message";

export function NotificationsProvider({
  children,
  pollMs = 30000,
}: {
  children: ReactNode;
  pollMs?: number;
}) {
  const [notifications, setNotifications] = useState<Noti[]>([]);
  const [messageUnread, setMessageUnread] = useState(0);
  const seen = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  const role = getUser()?.role as "brand" | "influencer" | undefined;

  // Route a notification (that isn't a message) to a sidebar href.
  const hrefFor = (n: Noti): string | undefined => {
    if (n.type && TYPE_TO_HREF[n.type]) return TYPE_TO_HREF[n.type];

    const text = `${n.title || ""} ${n.message || ""}`.toLowerCase();
    if (text.includes("appl")) {
      return role === "brand" ? "/app/campaigns" : "/app/applications";
    }
    if (text.includes("gig")) return "/app/gigs";
    if (text.includes("campaign")) {
      return role === "brand" ? "/app/campaigns" : "/app/discover-campaigns";
    }
    return undefined;
  };

  const load = async () => {
    // Guard: don't hit protected endpoints when logged out (avoids 401 spam).
    const token = getToken();
    if (!token) return;

    // Notifications (toasts + bell + non-message badges)
    try {
      const data = await apiFetch("/api/notifications", { token });
      const list: Noti[] = data.notifications || [];
      setNotifications(list);

      if (!primed.current) {
        list.forEach((n) => seen.current.add(n._id));
        primed.current = true;
      } else {
        list
          .filter((n) => !seen.current.has(n._id))
          .forEach((n) => {
            seen.current.add(n._id);
            if (n.isRead) return;
            const msg = n.title
              ? n.message
                ? `${n.title} — ${n.message}`
                : n.title
              : n.message || "New notification";
            toast.info(msg, { position: "top-center" });
          });
      }
    } catch {
      // ignore transient errors
    }

    // Live unread message count (drives the Messages badge)
    try {
      const mc = await apiFetch("/api/messages/unread-count", { token });
      setMessageUnread(mc.count || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, pollMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAsRead = async (id: string) => {
    if (!getToken()) return;
    try {
      await apiFetch(`/api/notifications/${id}/read`, {
        token: getToken()!,
        method: "PATCH",
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  const markAllAsRead = async () => {
    if (!getToken()) return;
    try {
      await apiFetch(`/api/notifications/read-all`, {
        token: getToken()!,
        method: "PATCH",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  // Count ONLY the notifications the bell actually shows, so the badge number
  // matches the visible list (message notifications are excluded here).
  const unreadCount = notifications.filter(
    (n) => isBellNoti(n) && !n.isRead
  ).length;

  // Per-href badge counts from notifications…
  const badgeCounts: Record<string, number> = {};
  for (const n of notifications) {
    if (n.isRead) continue;
    const href = hrefFor(n);
    if (!href || href === MESSAGES_HREF) continue; // messages handled below
    badgeCounts[href] = (badgeCounts[href] || 0) + 1;
  }
  // …then overlay the live message count.
  if (messageUnread > 0) badgeCounts[MESSAGES_HREF] = messageUnread;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        messageUnread,
        badgeCounts,
        markAsRead,
        markAllAsRead,
        reload: load,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used inside <NotificationsProvider>"
    );
  }
  return ctx;
}