"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function GigsCom() {
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/gigs?limit=6")
      .then((data) => {
        console.log("RAW GIGS API RESPONSE:", data);
        const items = Array.isArray(data) 
          ? data 
          : data?.gigs || data?.data?.gigs || data?.data || data?.items || [];
          
        setGigs(Array.isArray(items) ? items.slice(0, 6) : []);
      })
      .catch((err) => {
        console.error("Gigs fetch error:", err);
        setGigs([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || gigs.length === 0) return null;

  const money = (minor?: number) => (minor ? `PKR ${(minor / 100).toLocaleString("en-PK")}` : "—");

  return (
    <section className="relative bg-background py-16 sm:py-20 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-12 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl italic font-black text-foreground tracking-tight leading-[1.05]">
          Pick exactly
          <br />
          <span className="text-[#B90808]">who you want.</span>
        </h2>
        <p className="text-zinc-400 text-sm sm:text-base mt-4 max-w-md mx-auto">
          Browse gigs from creators, priced and ready to hire — no waiting on a match.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gigs.map((g, i) => (
            <Link
              key={g._id || g.id || i}
              href={`/creator/${g.influencerId?.handle || g.handle || ""}`}
              className="group bg-card/85 border border-border-color hover:border-[#B90808]/50 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-[#B90808] font-bold text-sm">
                    {g.influencerId?.name?.[0]?.toUpperCase() || g.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="text-lg font-medium text-foreground">
                    {g.influencerId?.name || g.name || "Creator"}
                  </span>
                </div>

                {g.category && (
                  <span className="text-md font-semibold uppercase tracking-wider text-[#B90808] block mb-1">
                    Category: {g.category}
                  </span>
                )}
                <h3 className="text-base sm:text-lg font-bold text-foreground mt-1 group-hover:text-[#B90808] transition-colors">
                  {g.title}
                </h3>
                {g.description && (
                  <p className="text-xs sm:text-sm text-zinc-400 mt-2.5 leading-relaxed">
                    {g.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-color">
                <span className="text-base font-bold text-[#B90808]">{money(g.priceMinor)}</span>
                <span className="text-sm text-zinc-500">Delivery in: {g.deliveryDays || 3} days</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-12">
        <Link
          href="/gigs"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border-color hover:border-[#B90808] text-foreground text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:bg-[#B90808] hover:text-white"
        >
          Explore All Gigs
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
}