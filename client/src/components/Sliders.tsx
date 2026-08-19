"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useContactPanel } from "./ContactPanel";

const slides = [
  { src: "/images/new.webp", title: ["DESERT", "LONLINESS"] },
  { src: "/images/new1.webp", title: ["OCEAN", "SILENCE"] },
  { src: "/images/new2.webp", title: ["URBAN", "SOLITUDE"] },
];



const Sliders = () => {
  const [active, setActive] = useState(0);
  const { open } = useContactPanel();

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const slide = slides[active];
  return (
    <div className="relative w-full bg-background text-foreground overflow-hidden py-8 sm:py-12">

      {/* ── Background image layer ── */}
      {/* <div
        className="absolute inset-0 z-0 opacity-150 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: "url('/images/layer-1.png')" }}
      /> */}

      {/* ── Fixed left sidebar: logo, hamburger, vertical dot nav ── */}
      <div className="hidden md:flex absolute left-0 top-0 bottom-0 w-16 lg:w-20 flex-col items-center justify-between py-8 z-20 border-r border-border-color">

        <span
          className="text-2xl font-bold tracking-wide select-none"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Luvenex
        </span>

        {/* Hamburger icon */}
        <button
          onClick={open}
          aria-label="Menu"
          className="group flex flex-col gap-2 items-end justify-center w-10 h-10 cursor-pointer"
        >
          <span className="block w-8 h-[2px] bg-foreground transition-all duration-300" />
          <span className="block w-8 h-[2px] bg-foreground opacity-100 scale-x-100 group-hover:opacity-0 group-hover:scale-x-0 origin-right transition-all duration-300" />
          <span className="block w-4 h-[2px] bg-foreground transition-all duration-300 group-hover:-mt-2" />
        </button>

        {/* Vertical numbered dot navigation */}
        <div className="flex flex-col items-center gap-5">
          <span className="text-xl lg:text-2xl font-bold text-red-500 tracking-wider">
            {String(active + 1).padStart(2, "0")}
          </span>
          <div className="flex flex-col items-center gap-3.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === active
                    ? "w-3.5 h-3.5 bg-red-500"
                    : "w-2 h-2 bg-foreground/40 hover:bg-foreground/70"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

   

      <div className="relative z-10 max-w-7xl mx-auto flex items-stretch min-h-[420px] sm:min-h-[520px] md:pl-16 lg:pl-20">

        {/* ── Left: vertical FOLIO + stacked title ── */}
        <div className="relative z-10 flex items-end gap-4 sm:gap-8 pl-4 sm:pl-8 pr-4">
          <span
            className="hidden sm:block text-transparent text-6xl lg:text-8xl font-black tracking-tight select-none"
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              WebkitTextStroke: "1px color-mix(in srgb, var(--foreground) 40%, transparent)",
            }}
          >
            FOLIO
          </span>

          <h2
            className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight drop-shadow-lg"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {slide.title.map((word, i) => (
              <span
                key={`${active}-${i}`}
                className="block animate-[wordIn_0.6s_ease-out_forwards] opacity-0"
                style={{ animationDelay: `${i * 0.25}s` }}
              >
                {word}
              </span>
            ))}
          </h2>
        </div>

        {/* ── Right: image panel with pattern behind the photos ── */}
        <div className="relative flex-1 ml-2 sm:ml-4 p-2 sm:p-3 rounded-2xl sm:rounded-3xl overflow-hidden">
          <div className="relative w-full h-full rounded-sm overflow-hidden">
            {slides.map((s, i) => (
              <img
                key={`${active}-${i}`}
                src={s.src}
                alt={s.title.join(" ")}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                  i === active
                    ? "opacity-100 animate-[riseUp_1.6s_ease-out_forwards]"
                    : "opacity-0"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Dots (mobile, horizontal) ── */}
      <div className="relative z-10 flex md:hidden justify-center gap-2 mt-6">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? "w-8 bg-foreground" : "w-1.5 bg-foreground/30 hover:bg-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Sliders;