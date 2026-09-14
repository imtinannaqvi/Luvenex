"use client";

import { useEffect, useState } from "react";
import {
  FiHeadphones,
  FiMessageCircle,
  FiX,
  FiChevronRight,
  FiChevronLeft,
} from "react-icons/fi";
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
 * Quick-answer topics shown before handing off to WhatsApp.
 * Hardcoded for now — move to an admin-editable settings page later if this
 * needs to change often without a redeploy.
 */
const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "What is Luvenex?",
    answer:
      "Luvenex connects brands with creators for sponsored content and campaigns. Brands post deals or gigs, creators apply or get matched, and payments move through secure escrow until the work is delivered.",
  },
  {
    question: "How do I start a deal?",
    answer:
      "Brands: go to Campaigns → New Campaign, or message a creator directly from their profile. Creators: browse Discover or Gigs, apply to one that fits, and wait for the brand to accept. Once accepted, a deal opens in your dashboard.",
  },
  {
    question: "How do I log in or create an account?",
    answer:
      "Tap Login in the top right and sign in with your email and password. New here? Tap Sign Up, choose Brand or Creator, and verify your email to get started.",
  },
  {
    question: "How does payment work?",
    answer:
      "Brands fund the deal upfront into escrow. Luvenex holds the money securely until the creator delivers, then releases payment to their wallet. Withdrawals can be requested from Wallet & Payouts.",
  },
  {
    question: "How do I become verified?",
    answer:
      "Complete a set number of deals successfully, then apply for verification from your profile. An admin reviews the request and approves the badge.",
  },
];

export default function SupportWidget() {
  const [config, setConfig] = useState<Support | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API}/api/support`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.support) setConfig(data.support);
      })
      // A missing support config shouldn't break the page — fail silently.
      .catch(() => {});
  }, []);

  if (!config?.isEnabled || !config.whatsappNumber) return null;

  const Icon = ICON_MAP[config.buttonIcon] ?? FiHeadphones;
  const isRight = config.widgetPosition === "bottom-right";

  // wa.me wants digits only, no + or spaces.
  const digits = config.whatsappNumber.replace(/\D/g, "");
  const whatsappHref = `https://wa.me/${digits}${
    config.greetingMessage ? `?text=${encodeURIComponent(config.greetingMessage)}` : ""
  }`;

  const toggle = () => {
    setOpen((o) => !o);
    setSelected(null);
  };

  return (
        <div
      className={`fixed bottom-24 z-30 flex flex-col items-end gap-3 ${
        isRight ? "right-5" : "left-5 items-start"
      }`}
    >
      {/* ── Panel ── */}
      {open && (
        <div className="w-[350px] max-h-[70vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-black/5 overflow-hidden">
          {/* Header */}
          <div
            className="shrink-0 px-4 py-3.5 flex items-center justify-between text-white"
            style={{ backgroundColor: config.primaryColor }}
          >
            <div className="min-w-0">
              {selected !== null ? (
                <button
                  onClick={() => setSelected(null)}
                  className="flex items-center gap-1 text-xs font-semibold opacity-90 hover:opacity-100 transition"
                >
                  <FiChevronLeft size={14} />
                  Back
                </button>
              ) : (
                <>
                  {config.headerTitle && (
                    <p className="text-sm font-bold leading-tight truncate">
                      {config.headerTitle}
                    </p>
                  )}
                  {config.headerSubtitle && (
                    <p className="text-[11px] opacity-90 mt-0.5 truncate">
                      {config.headerSubtitle}
                    </p>
                  )}
                </>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/15 transition"
            >
              <FiX size={14} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {selected === null ? (
              <div className="py-1.5">
                <p className="px-4 pt-2.5 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  Common questions
                </p>
                {FAQ_ITEMS.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-gray-50 transition border-t border-gray-100 first:border-t-0"
                  >
                    <span className="text-sm text-gray-800">{item.question}</span>
                    <FiChevronRight size={15} className="shrink-0 text-gray-300" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <p className="text-sm font-bold text-gray-900 mb-2">
                  {FAQ_ITEMS[selected].question}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {FAQ_ITEMS[selected].answer}
                </p>
              </div>
            )}
          </div>

          {/* Footer — always available regardless of which screen is showing */}
          <div className="shrink-0 border-t border-gray-100 p-3">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: config.primaryColor }}
            >
              <FaWhatsapp size={15} />
              Need help? Chat on WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* ── Launcher ── */}
      <button
        onClick={toggle}
        aria-label={open ? "Close support menu" : config.headerTitle || "Open support menu"}
        className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
        style={{ backgroundColor: config.primaryColor }}
      >
        {open ? <FiX size={22} /> : <Icon size={26} />}
      </button>
    </div>
  );
}