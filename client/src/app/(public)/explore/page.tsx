"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function ExplorePage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);

    apiFetch(`/api/videos?${params.toString()}`)
      .then((data) => setVideos(data.videos || []))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, [category]);

  // Live filter of the loaded videos by title, creator name, or category
  const filteredVideos = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter((v) => {
      const title = (v.title || "").toLowerCase();
      const name = (v.postedBy?.name || "").toLowerCase();
      const cat = (v.category || "").toLowerCase();
      return title.includes(q) || name.includes(q) || cat.includes(q);
    });
  }, [videos, query]);

  return (
    <div className="min-h-screen bg-background text-foreground px-4 sm:px-6 py-12">
      {/* Centered search bar */}
      <div className="max-w-xl mx-auto text-center mb-10">
        <h1 className="text-xl sm:text-3xl font-black italic tracking-tight mb-6">
          Explore <span className="text-[#B90808]">More</span>
        </h1>

        {category && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs text-zinc-400">Filtering videos by:</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#B90808]/10 text-[#B90808] border border-[#B90808]/30">
              {category}
              <button onClick={() => setCategory("")} className="hover:text-white transition">✕</button>
            </span>
          </div>
        )}

        <div className="relative">
          <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search videos by title, creator, or category"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-sm bg-zinc-950 border border-zinc-800 text-foreground text-sm focus:outline-none focus:border-[#B90808] transition"
          />
        </div>
      </div>

      {/* Video grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#B90808]/20 border-t-[#B90808] rounded-full animate-spin" />
        </div>
      ) : filteredVideos.length === 0 ? (
        <p className="text-center text-zinc-500 text-sm">
          {query.trim() ? `No videos match “${query}”.` : "No videos found."}
        </p>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredVideos.map((v) => (
            <Link
              key={v._id}
              href={`/videos?v=${v._id}`}
              className="group relative aspect-[9/16] rounded-sm overflow-hidden bg-zinc-900 border border-border-color transition"
            >
              <video
                src={`${process.env.NEXT_PUBLIC_API_URL}${v.videoUrl}`}
                className="w-full h-full object-cover"
                muted
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                <p className="text-[10px] font-semibold text-foreground truncate">{v.postedBy?.name}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}