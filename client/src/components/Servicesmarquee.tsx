"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Service {
  _id: string;
  title: string;
}

// Fallback words shown until services load (edit or remove as you like)
const FALLBACK = ["Photography", "Branding", "Editing", "Consultancy", "Design"];

export default function ServicesMarquee() {
  const [names, setNames] = useState<string[]>(FALLBACK);

  useEffect(() => {
    apiFetch("/api/services")
      .then((data) => {
        const titles = (data.services || [])
          .map((s: Service) => s.title)
          .filter(Boolean);
        if (titles.length) setNames(titles);
      })
      .catch(() => {
        /* keep fallback on error */
      });
  }, []);

  // The sparkle/asterisk separator between words
  const Sparkle = () => (
    <span className="mx-6 sm:mx-10 text-2xl sm:text-4xl text-foreground/90 select-none">✳</span>
  );

  // One full pass of all the words (rendered twice for a seamless loop)
  const Row = () => (
    <div className="flex items-center shrink-0">
      {names.map((name, i) => (
        <div key={i} className="flex items-center">
          <span className="uppercase font-black italic tracking-tight text-transparent text-5xl sm:text-7xl lg:text-7xl [-webkit-text-stroke:1.5px_rgba(255,255,255,0.9)]">
            {name}
          </span>
          <Sparkle />
        </div>
      ))}
    </div>
  );

  return (
    <section className="relative overflow-hidden  py-16 sm:py-24">
      {/* wavy vector lines in the background */}
     <div className="pointer-events-none absolute inset-0 z-0  overflow-hidden">
  <img
    src="/images/vector4.webp"
    alt=""
    aria-hidden="true"
    className="w-[140%] max-w-none opacity-100 select-none [filter:brightness(5)_contrast(1.2)] animate-[moveLeftRight_20s_linear_infinite]"
  />
</div>

      {/* soft fade edges so text appears/disappears smoothly */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-40 bg-gradient-to-r from-black to-transparent z-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-40 bg-gradient-to-l from-black to-transparent z-20" />

      {/* the scrolling text */}
      <div className="relative z-10 flex w-max marquee-text">
        <Row />
        <Row />
      </div>
    </section>
  );
}