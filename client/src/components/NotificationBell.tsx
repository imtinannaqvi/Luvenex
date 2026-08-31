"use client";

import { useState, useEffect, useRef } from "react";
import { useNotifications } from "@/context/Notificationscontext";

export default function NotificationBell() {
  const { notifications, unreadCount, messageUnread, markAsRead, markAllAsRead } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalUnread = unreadCount + messageUnread;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative w-9 h-9 rounded-full hover:bg-surface flex items-center justify-center transition"
      >
        <svg
          className="w-5 h-5 text-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-white flex items-center justify-center">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-background border border-line rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <h3 className="text-sm font-bold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-xs text-muted text-center py-8">
                No notifications yet.
              </p>
            ) : (
              notifications
                .filter((n) => n.type !== "new_message")
                .slice(0, 15)
                .map((n) => (
                  <button
                    key={n._id}
                    onClick={() => markAsRead(n._id)}
                    className={`w-full text-left px-4 py-3 border-b border-line hover:bg-surface transition ${
                      !n.isRead ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-muted mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-muted/70 mt-1">
                          {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}