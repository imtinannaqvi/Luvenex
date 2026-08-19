"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface CreatorProfile {
  _id: string;
  handle: string;
  bio?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  niches?: string[];
  avgRating?: number;
  followersCount?: number;
  completedDeals?: number;
}

interface PaginationData {
  totalPages: number;
  currentPage: number;
  totalProfiles?: number;
}

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [q, setQ] = useState<string>("");
  const [niche, setNiche] = useState<string>("");
  const [minRating, setMinRating] = useState<string>("");
  const [sort, setSort] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [page, setPage] = useState<number>(1);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (niche) params.set("niche", niche);
      if (minRating) params.set("minRating", minRating);
      if (sort) params.set("sort", sort);
      params.set("page", String(page));
      params.set("limit", "12");

      const data = await apiFetch(`/api/influencers?${params.toString()}`);
      setProfiles(data.profiles || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch influencers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleReset = () => {
    setQ("");
    setNiche("");
    setMinRating("");
    setSort("");
    setPage(1);
  };

  const formatFollowers = (n?: number) => {
    if (!n) return "0";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  const hasActiveFilters = Boolean(q || niche || minRating || sort);

  return (
    <div className="relative overflow-hidden bg-black text-white min-h-screen px-4 sm:px-6 lg:px-8 py-8 sm:py-12 selection:bg-red-600 selection:text-white">
      <div className="absolute -top-32 -left-32 w-80 h-80 sm:w-[500px] sm:h-[500px] bg-red-600/30 rounded-full blur-[100px] sm:blur-[160px] pointer-events-none z-0" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 sm:w-[500px] sm:h-[500px] bg-red-600/30 rounded-full blur-[100px] sm:blur-[160px] pointer-events-none z-0" />


      <div className="relative z-10 max-w-7xl mx-auto space-y-8 sm:space-y-10">
        
        <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3 border-b border-zinc-800/80 pb-6 sm:pb-8">
      
          <h1 className="text-3xl sm:text-4xl font-extrabold italic text-white tracking-tight">
            Discover <span className="text-red-600">Creators</span>
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm md:text-base px-2">
            Connect with vetted creators for your brand — backed by  transparent metrics, <br /> real reviews, and trackable deals.
          </p>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3 sm:p-5 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search creator handle or bio..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-800 bg-black text-white text-xs sm:text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex gap-3">
              <input
                type="text"
                placeholder="Niche (e.g. tech)"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-black text-white text-xs sm:text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600 transition w-full lg:w-40"
              />

              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-black text-white text-xs sm:text-sm focus:outline-none focus:border-red-600 transition w-full cursor-pointer"
              >
                <option value="">Any rating</option>
                <option value="4">★ 4.0 & above</option>
                <option value="3">★ 3.0 & above</option>
              </select>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-black text-white text-xs sm:text-sm focus:outline-none focus:border-red-600 transition w-full cursor-pointer"
              >
                <option value="">Newest</option>
                <option value="rating"> Highest rated</option>
                <option value="followers">Most followers</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 lg:flex-none px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold transition active:scale-95"
              >
                Search
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-lg border border-zinc-800 hover:border-zinc-600 bg-black text-zinc-400 hover:text-white text-xs sm:text-sm font-medium transition active:scale-95"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── Content Grid Section ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-6 flex flex-col items-center animate-pulse space-y-4">
                <div className="w-16 h-16 rounded-full bg-zinc-800" />
                <div className="h-4 bg-zinc-800 rounded w-1/2" />
                <div className="h-3 bg-zinc-900 rounded w-1/3" />
                <div className="h-3 bg-zinc-900 rounded w-full" />
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-8 sm:p-12 text-center space-y-4 max-w-md mx-auto my-12 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-800/50 flex items-center justify-center text-red-500 font-bold text-lg mx-auto">
              !
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No creators found</h3>
              <p className="text-xs text-zinc-400">
                No creators matched your search criteria. Try adjusting your parameters.
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg bg-red-600/10 border border-red-600/30 text-red-500 text-xs font-semibold hover:bg-red-600/20 transition"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {profiles.map((p) => (
                <Link
                  key={p._id}
                  href={`/creator/${p.handle}`}
                  className="group relative bg-zinc-950/80 border border-zinc-800 hover:border-red-600 border-t-2 hover:border-t-red-600 transition-all duration-300 rounded-xl p-5 sm:p-6 flex flex-col items-center text-center justify-between backdrop-blur-sm"
                >
                  {p.isVerified && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-red-950/60 border border-red-800/40 text-red-400 text-[10px] font-semibold flex items-center gap-1">
                      <svg className="w-3 h-3 fill-red-500" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Verified</span>
                    </div>
                  )}

                  <div className="flex flex-col items-center w-full">
                    <div className="relative mb-3">
                      {p.avatarUrl ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL}${p.avatarUrl}`}
                          alt={p.handle}
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-zinc-800 group-hover:ring-red-600 transition duration-300"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500 font-bold text-lg group-hover:border-red-600 transition duration-300">
                          {p.handle?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>

                    <p className="font-bold text-base text-white truncate max-w-full group-hover:text-red-500 transition-colors">
                      @{p.handle}
                    </p>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mt-1 mb-4 min-h-[2.5rem]">
                      {p.bio || "No bio summary provided."}
                    </p>
                  </div>

                  <div className="w-full pt-4 border-t border-zinc-900 flex flex-col items-center space-y-3">
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {(p.niches || []).slice(0, 2).map((n: string) => (
                        <span
                          key={n}
                          className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-red-950/40 text-red-400 border border-red-800/40"
                        >
                          {n}
                        </span>
                      ))}
                      {(p.niches || []).length > 2 && (
                        <span className="text-[10px] text-zinc-500 px-1 py-0.5">
                          +{(p.niches || []).length - 2}
                        </span>
                      )}
                    </div>

                    <div className="w-full grid grid-cols-3 gap-1 pt-3 border-t border-zinc-900/80 text-center">
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider text-zinc-500 font-medium">Rating</span>
                        <span className="text-xs font-semibold text-white flex items-center justify-center gap-0.5 mt-0.5">
                          <span className="text-amber-400 text-[10px]">★</span>
                          {p.avgRating ? p.avgRating.toFixed(1) : "—"}
                        </span>
                      </div>
                      <div className="border-x border-zinc-900">
                        <span className="block text-[9px] uppercase tracking-wider text-zinc-500 font-medium">Followers</span>
                        <span className="text-xs font-semibold text-white mt-0.5 block">
                          {formatFollowers(p.followersCount)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider text-zinc-500 font-medium">Deals</span>
                        <span className="text-xs font-semibold text-white mt-0.5 block">
                          {p.completedDeals ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-2 sm:px-3.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-medium text-white hover:border-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1.5 px-1 overflow-x-auto max-w-full py-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition shrink-0 ${
                        p === page
                          ? "bg-red-600 text-white"
                          : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                  disabled={page === pagination.totalPages}
                  className="px-3 py-2 sm:px-3.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-medium text-white hover:border-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}