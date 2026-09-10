"use client";

import { useEffect, useState } from "react";
import { FiInfo, FiCheckCircle, FiAlertTriangle, FiAlertOctagon, FiX } from "react-icons/fi";
import { getToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL;

type Announcement = {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "danger";
  updatedAt: string;
};

const STYLES: Record<string, { wrap: string; icon: any }> = {
  info: { wrap: "bg-blue-50 border-blue-200 text-blue-900", icon: FiInfo },
  success: { wrap: "bg-green-50 border-green-200 text-green-900", icon: FiCheckCircle },
  warning: { wrap: "bg-amber-50 border-amber-200 text-amber-900", icon: FiAlertTriangle },
  danger: { wrap: "bg-red-50 border-red-200 text-red-900", icon: FiAlertOctagon },
};

// Keyed on updatedAt as well as id, so editing an announcement makes it
// reappear for people who already dismissed the old version.
const dismissKey = (a: Announcement) => `ann:${a._id}:${a.updatedAt}`;

export default function AnnouncementBanner() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    fetch(`${API}/api/announcements/active`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.announcements) setItems(data.announcements);
      })
      // A banner failing to load shouldn't break the dashboard.
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      setDismissed(JSON.parse(localStorage.getItem("dismissedAnnouncements") || "[]"));
    } catch {
      setDismissed([]);
    }
  }, []);

  const dismiss = (a: Announcement) => {
    const next = [...dismissed, dismissKey(a)];
    setDismissed(next);
    try {
      localStorage.setItem("dismissedAnnouncements", JSON.stringify(next.slice(-50)));
    } catch {
      // Private browsing or full storage — the banner just comes back next load.
    }
  };

  const visible = items.filter((a) => !dismissed.includes(dismissKey(a)));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-5">
      {visible.map((a) => {
        const style = STYLES[a.type] ?? STYLES.info;
        const Icon = style.icon;
        return (
          <div
            key={a._id}
            className={`flex items-start gap-3 px-4 py-3 rounded-sm border ${style.wrap}`}
          >
            <Icon size={17} className="shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">{a.title}</p>
              <p className="text-xs mt-1 opacity-90">{a.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(a)}
              aria-label="Dismiss announcement"
              className="shrink-0 w-6 h-6 rounded-sm flex items-center justify-center hover:bg-black/5 transition"
            >
              <FiX size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}