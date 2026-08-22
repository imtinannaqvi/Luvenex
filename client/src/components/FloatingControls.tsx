// components/FloatingControls.tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function FloatingControls() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!mounted) return null;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3">
      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
        className="group w-13 h-13 rounded-full flex items-center justify-center bg-card border border-border-color shadow-lg hover:border-[#B90808]/60 hover:scale-105 active:scale-95 transition-all duration-300"
      >
        <span className="relative w-5 h-5 block">
          {/* Sun — visible in dark mode (tap to go light) */}
          <svg
            className={`absolute inset-0 w-5 h-5 text-foreground/80 group-hover:text-[#B90808] transition-all duration-300 ${
              theme === "dark" ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4l1.4-1.4M18 6l1.4-1.4" />
          </svg>
          {/* Moon — visible in light mode (tap to go dark) */}
          <svg
            className={`absolute inset-0 w-5 h-5 text-foreground/80 group-hover:text-[#B90808] transition-all duration-300 ${
              theme === "dark" ? "opacity-0 scale-50 rotate-90" : "opacity-100 scale-100 rotate-0"
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        </span>
      </button>

      {/* Scroll to top — only shown once the user has scrolled down */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`group w-13 h-13 rounded-full flex items-center justify-center bg-card border border-border-color shadow-lg hover:border-[#B90808]/60 hover:scale-105 active:scale-95 transition-all duration-300 ${
          showScrollTop ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <svg
          className="w-5 h-5 text-foreground/80 group-hover:text-[#B90808] transition-colors duration-300"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}