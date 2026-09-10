"use client";

import { useEffect, useState } from "react";
import { FiHeadphones, FiMessageCircle, FiX } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

const API = process.env.NEXT_PUBLIC_API_URL;

const ICON_MAP = {
  headset: FiHeadphones,
  "chat-bubble": FiMessageCircle,
  whatsapp: FaWhatsapp,
} as const;

type Support = {
  isEnabled: boolean;
  whatsappNumber: string;
  primaryColor: string;
  widgetPosition: "bottom-right" | "bottom-left";
  buttonIcon: keyof typeof ICON_MAP;
  headerTitle: string;
  headerSubtitle: string;
  greetingMessage: string;
};

/**
 * Renders wherever it's imported — no route checking. Mount it on the pages
 * that should have it: the public home page and the dashboard layout.
 */
export default function SupportWidget() {
  const [config, setConfig] = useState<Support | null>(null);
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/support`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.support) setConfig(data.support);
      })
      // A missing support config shouldn't break the page — fail silently.
      .catch(() => {});
  }, []);

  // Nudge the label open once, a few seconds after load, so the widget gets
  // noticed without demanding a click.
  useEffect(() => {
    if (!config?.isEnabled) return;
    const show = setTimeout(() => setShowLabel(true), 3000);
    const hide = setTimeout(() => setShowLabel(false), 11000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [config?.isEnabled]);

  if (!config?.isEnabled || !config.whatsappNumber) return null;

  const Icon = ICON_MAP[config.buttonIcon] ?? FiHeadphones;
  const isRight = config.widgetPosition === "bottom-right";

  // wa.me wants digits only, no + or spaces.
  const digits = config.whatsappNumber.replace(/\D/g, "");
  const href = `https://wa.me/${digits}${
    config.greetingMessage ? `?text=${encodeURIComponent(config.greetingMessage)}` : ""
  }`;

  return (
    <div
      className={`fixed bottom-5 z-30 flex items-end gap-2.5 ${
        isRight ? "right-5 flex-row-reverse" : "left-5"
      }`}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={config.headerTitle || "Chat with support on WhatsApp"}
        onMouseEnter={() => setShowLabel(true)}
        className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
        style={{ backgroundColor: config.primaryColor }}
      >
        <Icon size={26} />
      </a>

      {showLabel && (config.headerTitle || config.headerSubtitle) && (
        <div className="relative mb-1 max-w-[240px] rounded-xl bg-white px-3.5 py-2.5 shadow-lg border border-black/5">
          <button
            type="button"
            onClick={() => setShowLabel(false)}
            aria-label="Dismiss"
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-gray-900 transition"
          >
            <FiX size={11} />
          </button>
          {config.headerTitle && (
            <p className="text-sm font-bold text-gray-900 leading-tight">
              {config.headerTitle}
            </p>
          )}
          {config.headerSubtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{config.headerSubtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}