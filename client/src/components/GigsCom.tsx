"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/auth";

// Build a full URL for uploaded media (local paths need the API host prefixed).
const mediaSrc = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${process.env.NEXT_PUBLIC_API_URL || ""}${url}`;
};

export default function GigsCom() {
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBrand, setIsBrand] = useState(false);

  useEffect(() => {
    // Only brands see this section.
    const user = getUser();
    const brand = user?.role === "brand";
    setIsBrand(brand);

    if (!brand) {
      setLoading(false);
      return;
    }

    apiFetch("/api/gigs?limit=6")
      .then((data) => {
        const items = Array.isArray(data)
          ? data
          : data?.gigs || data?.data?.gigs || data?.data || data?.items || [];
        setGigs(Array.isArray(items) ? items.slice(0, 6) : []);
      })
      .catch(() => setGigs([]))
      .finally(() => setLoading(false));
  }, []);

  // Hidden entirely for non-brands, while loading, or when there are no gigs.
  if (!isBrand || loading || gigs.length === 0) return null;

  const money = (minor?: number) =>
    minor ? `PKR ${(minor / 100).toLocaleString("en-PK")}` : "—";

  // Try, in order: creator avatar → first portfolio image → gig's own cover.
  const creatorImage = (g: any): string => {
    const inf = g.influencerId || {};
    const portfolioFirst =
      Array.isArray(inf.portfolio) && inf.portfolio.length > 0
        ? inf.portfolio.find((p: any) => p.mediaType !== "video")?.mediaUrl ||
          inf.portfolio[0]?.mediaUrl
        : "";
    return mediaSrc(
      inf.avatarUrl || inf.avatar || portfolioFirst || g.coverImage || ""
    );
  };

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
          {gigs.map((g, i) => {
            const handle = g.influencerId?.handle || g.handle || "";
            const creatorName = g.influencerId?.name || g.name || "Creator";
            const initial =
              g.influencerId?.name?.[0]?.toUpperCase() ||
              g.name?.[0]?.toUpperCase() ||
              "?";
            const img = creatorImage(g);

            const cardContent = (
              <>
                <div className="flex flex-col items-center text-center">
                  {/* Avatar image (portfolio/avatar) — falls back to initial */}
                  <div className="w-16 h-16 rounded-full bg-surface border border-border-color overflow-hidden flex items-center justify-center text-[#B90808] font-bold text-xl mb-3">
                    {img ? (
                      <img
                        src={img}
                        alt={creatorName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // If the image fails, hide it so the initial shows.
                          const el = e.currentTarget;
                          el.style.display = "none";
                          if (el.parentElement) {
                            el.parentElement.textContent = initial;
                          }
                        }}
                      />
                    ) : (
                      initial
                    )}
                  </div>

                  {/* Creator name */}
                  <span className="text-base font-semibold text-foreground">
                    {creatorName}
                  </span>

                  {/* Category */}
                  {g.category && (
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B90808] mt-2">
                      {g.category}
                    </span>
                  )}

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold text-foreground mt-1 group-hover:text-[#B90808] transition-colors">
                    {g.title}
                  </h3>

                  {/* Description */}
                  {g.description && (
                    <p className="text-xs sm:text-sm text-zinc-400 mt-2.5 leading-relaxed line-clamp-3">
                      {g.description}
                    </p>
                  )}
                </div>

                {/* Amount + days at the bottom */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-color">
                  <span className="text-base font-bold text-[#B90808]">
                    {money(g.priceMinor)}
                  </span>
                  <span className="text-sm text-zinc-500">
                    Delivery in: {g.deliveryDays || 3} days
                  </span>
                </div>
              </>
            );

            const cardClass =
              "group bg-card/85 border border-border-color hover:border-[#B90808]/50 rounded-sm p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 shadow-sm";

            if (!handle) {
              return (
                <div key={g._id || g.id || i} className={cardClass}>
                  {cardContent}
                </div>
              );
            }

            return (
              <Link
                key={g._id || g.id || i}
                href={`/creator/${handle}`}
                className={cardClass}
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center mt-12">
        <Link
          href="/gigs"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-sm border border-border-color hover:border-[#B90808] text-foreground text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:bg-[#B90808] hover:text-white"
        >
          Explore Gigs
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
}