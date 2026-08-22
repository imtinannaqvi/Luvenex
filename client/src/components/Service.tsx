"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Service {
  _id: string;
  title: string;
  shortDescription?: string;
  category?: string;
  coverImage?: string;
  iconUrl?: string;
  priceMinor?: number;
}

export default function HomeServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    apiFetch("/api/services")
      .then((data) => setServices(data.services || []))
      .finally(() => setLoading(false));
  }, []);

  const DefaultServiceIcon = () => (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

const Card = ({ s }: { s: Service }) => (
    <Link
      href={`/services/${s._id}`}
      className="group relative flex-none w-[280px] sm:w-[320px] bg-card border border-border-color rounded-3xl p-8 flex flex-col min-h-[320px] overflow-hidden
                 transition-all duration-300 ease-out hover:-translate-y-1 dark:hover:border-red-600/60
                 dark:hover:shadow-[0_20px_50px_-20px_rgba(220,38,38,0.5)]"
    >
      {/* red glow that fades in on hover — dark mode only */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-red-600/[0.12] via-transparent to-red-600/[0.08] opacity-0 dark:group-hover:opacity-100 transition-opacity duration-300" />

      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-foreground transition-all duration-300 group-hover:-translate-y-1.5 group-hover:scale-110 overflow-hidden">
        {s.iconUrl ? (
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}${s.iconUrl}`}
            alt=""
            className="w-full h-full object-contain invert dark:invert-0 transition-transform duration-700 ease-in-out group-hover:rotate-[360deg]"
          />
        ) : (
          <div className="transition-transform duration-700 ease-in-out group-hover:rotate-[360deg]">
            <DefaultServiceIcon />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative mt-auto flex flex-col">
        <h3 className="text-xl font-bold text-foreground tracking-tight leading-tight line-clamp-2 dark:group-hover:text-red-500 transition-colors duration-300">
          {s.title || "Uncategorized"}
        </h3>

        {s.shortDescription && (
          <p className="text-sm text-muted leading-relaxed line-clamp-2 mt-2 group-hover:text-foreground/70 transition-colors duration-300">
            {s.shortDescription}
          </p>
        )}
      </div>
    </Link>
  );

  // Background parallax images — prefers coverImage, falls back to iconUrl,
  // skips services with neither.
  const bgImages = services
    .map((s) => s.coverImage || s.iconUrl)
    .filter(Boolean) as string[];

  return (
    <section className="relative overflow-hidden  text-foreground px-4 sm:px-6 lg:px-8 py-8 sm:py-16 selection:bg-red-600 selection:text-foreground">

      <div className="relative z-10 max-w-7xl mx-auto">
      
     <div className="mb-12 sm:mb-16">
  <div className="text-center mb-6">
    <h1 className="text-4xl italic font-bold">
      Services
    </h1>
  </div>
  
  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
    <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground italic tracking-tight leading-[1.05]">
      Let us match you <span className="text-red-600 italic">directly</span>
    </h2>
    <p className="text-muted text-sm sm:text-base leading-relaxed max-w-md lg:text-right">
      Want our team to handle it for you? We match you with the right
      option — no manual searching required.
    </p>
  </div>
</div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex gap-5 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-none w-[280px] sm:w-[280px] bg-card border border-border-color rounded-3xl min-h-[320px] animate-pulse flex flex-col p-8 space-y-4"
              >
                <div className="w-20 h-20 rounded-2xl bg-surface" />
                <div className="mt-auto space-y-3">
                  <div className="h-6 bg-surface rounded w-32" />
                  <div className="h-3 bg-surface rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="bg-surface border border-border-color rounded-lg p-8 sm:p-12 text-center max-w-md mx-auto my-12 shadow-2xl backdrop-blur-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-800/50 flex items-center justify-center text-red-500 font-bold text-lg mx-auto">
              !
            </div>
            <h3 className="text-base font-bold text-foreground">No services available</h3>
            <p className="text-xs text-muted">
              No services are listed right now. Please check back again soon.
            </p>
          </div>
        ) : (
          /* ── Marquee: cards flow right → left after a short pause ── */
          <div className="marquee relative w-full overflow-x-hidden overflow-y-visible rounded-3xl">

            {/* Background parallax strip — one continuous layer behind everything,
                clipped to the marquee bounds so it never peeks through card gaps */}
            {bgImages.length > 0 && (
              <div className="absolute inset-0 z-0 overflow-hidden opacity-[0.06] dark:opacity-[0.08]">
                <div className="absolute inset-0 flex items-center animate-[marquee-scroll_40s_linear_infinite_reverse]">
                  {[...bgImages, ...bgImages].map((src, i) => (
                    <img
                      key={i}
                      src={`${process.env.NEXT_PUBLIC_API_URL}${src}`}
                      alt=""
                      className="h-full w-[280px] sm:w-[320px] shrink-0 object-cover grayscale"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* soft fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-background to-transparent z-10" />

            <div className="marquee-track relative z-10 flex gap-5 w-max pt-3 pb-1">
              {/* first copy */}
              {services.map((s) => (
                <Card key={`a-${s._id}`} s={s} />
              ))}
              {/* second copy for seamless loop */}
              {services.map((s) => (
                <Card key={`b-${s._id}`} s={s} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}