"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { X, Mail, MapPin, Phone } from "lucide-react";

/* ── Edit these to your real assets / details ── */
const INSTA_IMAGES = [
  "/images/con1.jpg",
  "/images/con2.jpg",
  "/images/con3.jpg",
  "/images/con4.jpg",
  "/images/con5.jpg",
  "/images/con6.jpg",
];
const INSTA_HANDLE = "Luvenex_insta";
const INSTA_URL = "https://instagram.com/";
const EMAIL = "inquiry@luvenex.com";
const ADDRESS_LINE_1 = "183, Bilton Way Hayes Middlesex";
const ADDRESS_LINE_2 = "UB3 3NF";
const PHONE = "+447414686498";

/* Inline Instagram glyph (lucide removed the built-in export) */
const InstagramIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

/* ── Shared open/close state so navbar AND slider can both trigger it ── */
interface ContactPanelCtx {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const Ctx = createContext<ContactPanelCtx | null>(null);

export function useContactPanel(): ContactPanelCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useContactPanel must be used inside <ContactPanelProvider>");
  return ctx;
}

export function ContactPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  // Close on Escape + lock body scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <Ctx.Provider value={{ isOpen, open, close }}>
      {children}
      <ContactPanel isOpen={isOpen} onClose={close} />
    </Ctx.Provider>
  );
}

/* ── The panel UI ── */
function ContactPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />

      {/* panel — slides in from the RIGHT */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-[#171717] text-white shadow-2xl overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-transform duration-500 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="px-8 py-8 flex flex-col min-h-full">

          {/* Close */}
          <button
            onClick={onClose}
            className="group self-end flex items-center gap-2 text-white font-bold tracking-widest text-sm hover:text-red-500 transition-colors cursor-pointer"
          >
            <span>Close</span>
            <X size={22} className="transition-transform duration-300 group-hover:rotate-90 group-hover:scale-125" />
          </button>

          {/* Logo — swap for <img src="/images/logo.png" /> if you have one */}
          <div className="text-center mt-2 mb-12">
            <span className="text-4xl font-serif italic tracking-wide">Luvenex</span>
          </div>

          {/* Instagram */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-extrabold tracking-wider">
              <span className="text-red-600">//</span> INSTAGRAM
            </h3>
            <a
              href={INSTA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-lg italic font-medium text-zinc-200 hover:text-red-500 transition-colors"
            >
              <InstagramIcon size={20} />
              {INSTA_HANDLE}
            </a>
          </div>

          {/* Photo grid */}
          <div className="grid grid-cols-3 gap-2 mb-12">
            {INSTA_IMAGES.map((src, i) => (
              <a
                key={i}
                href={INSTA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square overflow-hidden rounded-md group"
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </a>
            ))}
          </div>

          {/* Contact details */}
          <div className="space-y-6 mt-auto">
            <a href={`mailto:${EMAIL}`} className="flex items-center gap-4 text-zinc-300 hover:text-white transition-colors">
              <span className="w-9 h-9 rounded-full border border-zinc-700 flex items-center justify-center shrink-0">
                <Mail size={16} />
              </span>
              <span className="text-sm">{EMAIL}</span>
            </a>

            <div className="flex items-start gap-4 text-zinc-300">
              <span className="w-9 h-9 rounded-full border border-zinc-700 flex items-center justify-center shrink-0">
                <MapPin size={16} />
              </span>
              <span className="text-sm leading-relaxed">
                {ADDRESS_LINE_1}
                <br />
                {ADDRESS_LINE_2}
              </span>
            </div>

            <a href={`tel:${PHONE}`} className="flex items-center gap-4 text-zinc-300 hover:text-white transition-colors">
              <span className="w-9 h-9 rounded-full border border-zinc-700 flex items-center justify-center shrink-0">
                <Phone size={16} />
              </span>
              <span className="text-sm">{PHONE}</span>
            </a>
          </div>

        </div>
      </aside>
    </>
  );
}