"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function PublicGigsPage() {
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);

    apiFetch(`/api/gigs?${params.toString()}`)
      .then((data) => setGigs(data.gigs || []))
      .catch(() => setGigs([]))
      .finally(() => setLoading(false));
  }, [category]);

  const money = (minor?: number) => (minor ? `PKR ${(minor / 100).toLocaleString("en-PK")}` : "—");

  return (
    <div className="relative bg-background text-foreground min-h-screen px-4 sm:px-6 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold italic tracking-tight">
            Browse <span className="text-[#B90808]">Gigs</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-3">
            Pick exactly who and what you want — hire creators directly, at their own price.
          </p>
        </div>

        <div className="flex justify-center mb-10">
          <input
            type="text"
            placeholder="Filter by category..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-border-color bg-surface text-foreground text-sm focus:outline-none focus:border-[#B90808] max-w-xs w-full"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#B90808]/20 border-t-[#B90808] rounded-full animate-spin" />
          </div>
        ) : gigs.length === 0 ? (
          <p className="text-center text-zinc-500 text-sm">No gigs available right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {gigs.map((g) => (
              <Link
                key={g._id}
                href={`/creator/${g.influencerId?.handle || ""}`}
                className="group bg-surface border border-border-color hover:border-[#B90808]/50 rounded-2xl p-5 transition-all duration-300"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-[#B90808] font-bold text-xs">
                    {g.influencerId?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="text-lg text-foreground">{g.influencerId?.name}</span>
                </div>

                {g.category && (
                  <span className="text-[14px] font-semibold uppercase tracking-wide text-[#B90808]">
                   Category: {g.category}
                  </span>
                )}
                <h3 className="text-sm font-bold text-foreground mt-1.5 line-clamp-2 group-hover:text-[#B90808] transition-colors">
                  {g.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{g.description}</p>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-color">
                  <span className="text-sm font-bold text-[#B90808]">{money(g.priceMinor)}</span>
                  <span className="text-sm text-zinc-500"> Delivery in: {g.deliveryDays} days</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}