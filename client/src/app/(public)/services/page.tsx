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

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    apiFetch("/api/services")
      .then((data) => setServices(data.services || []))
      .finally(() => setLoading(false));
  }, []);

  // trigger entrance animations once content is ready
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const money = (minor?: number) =>
    minor ? `PKR ${(minor / 100).toLocaleString("en-PK")}` : null;

  const DefaultServiceIcon = () => (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  return (
    <div className="relative overflow-hidden bg-background text-foreground min-h-screen px-4 sm:px-6 lg:px-8 py-12 sm:py-16 selection:bg-red-600 selection:text-foreground">
      <div className="absolute -top-32 -left-32 w-80 h-80 sm:w-[500px] sm:h-[500px] bg-red-600/30 rounded-full blur-[100px] sm:blur-[150px] pointer-events-none z-0" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 sm:w-[500px] sm:h-[500px] bg-red-600/30 rounded-full blur-[100px] sm:blur-[150px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-10 sm:space-y-12">
        <div
          className={`text-center max-w-2xl mx-auto space-y-3 border-b border-border-color/80 pb-8 sm:pb-10 transition-all duration-700 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          <h1 className="text-3xl sm:text-2xl md:text-3xl font-extrabold italic text-foreground tracking-tight">
            Let us match you <span className="text-red-600">directly</span>
          </h1>
          <p className="text-foreground text-xs sm:text-sm md:text-base leading-relaxed px-2">
            Want Luvenex to handle it for you? Our team matches you with the right creator — no manual searching required.
          </p>
        </div>

        {/* ── Content Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-background border border-border-color rounded-3xl min-h-[300px] animate-pulse flex flex-col p-8 space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface" />
                <div className="h-6 bg-surface rounded w-32 mt-2" />
                <div className="space-y-2">
                  <div className="h-3 bg-surface rounded w-full" />
                  <div className="h-3 bg-surface rounded w-4/5" />
                </div>
                <div className="h-4 bg-surface rounded w-28 mt-auto" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="bg-surface/80 border border-border-color rounded-lg p-8 sm:p-12 text-center max-w-md mx-auto my-12 shadow-2xl backdrop-blur-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-800/50 flex items-center justify-center text-red-500 font-bold text-lg mx-auto">
              !
            </div>
            <h3 className="text-base font-bold text-foreground">No services available</h3>
            <p className="text-xs text-foreground">
              No services are listed right now. Please check back again soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s, i) => (
              <Link
                key={s._id}
                href={`/services/${s._id}`}
                className={`group relative bg-card border border-border-color/80 rounded-xl p-8 flex flex-col min-h-[300px] overflow-hidden
                           transition-all duration-300 ease-out hover:-translate-y-1 hover:border-red-600/60
                           hover:shadow-[0_20px_50px_-20px_rgba(220,38,38,0.5)] ${
                             mounted ? "opacity-100" : "opacity-0"
                           }`}
                style={
                  mounted
                    ? {
                        animation: "fade-up 0.6s ease-out forwards",
                        animationDelay: `${i * 80}ms`,
                      }
                    : undefined
                }
              >
                {/* red glow that fades in on hover */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-red-600/[0.12] via-transparent to-red-600/[0.08] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Icon — plain at rest, background tile reveals on hover */}
<div className="w-20 h-20 rounded-2xl bg-[#161616] flex items-center justify-center text-foreground transition-all duration-300 group-hover:-translate-y-1.5 group-hover:scale-110 overflow-hidden">                  {s.iconUrl ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}${s.iconUrl}`}
                      alt=""
                      className="w-22 h-32 object-contain"
                    />
                  ) : (
                    <DefaultServiceIcon />
                  )}
                </div>

                {/* Content */}
                <div className="relative mt-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-foreground tracking-tight leading-tight line-clamp-2 group-hover:text-red-500 transition-colors duration-300">
                    {s.title || "Uncategorized"}
                  </h3>
                  {s.shortDescription && (
                    <p className="text-sm text-foreground leading-relaxed line-clamp-3 mt-2 transition-colors duration-300">
                      {s.shortDescription}
                    </p>
                  )}
                  {/* Explore service cue */}
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-500 mt-auto pt-5">
                    Explore service
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}