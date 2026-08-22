"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function FeatureBlog() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch("/api/blogs?featured=true&limit=3")
      .then((data) => setBlogs(data.blogs || []))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!loading && blogs.length === 0) return null;

  const center = blogs[0];
  const left = blogs[1];
  const right = blogs[2];

  return (
    <section ref={sectionRef} className="relative bg-background py-16 sm:py-20 lg:py-28 overflow-hidden">
      <div
        className={`max-w-6xl mx-auto px-4 sm:px-6 mb-12 lg:mb-16 text-center transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <h2 className="text-3xl sm:text-4xl lg:text-5xl italic font-black text-foreground tracking-tight leading-[1.05]">
          Featured
          <span className="text-[#B90808]">  Blogs</span>
        </h2>
      </div>

      {loading ? (
        <div className="relative max-w-4xl mx-auto h-[460px] sm:h-[500px] flex items-center justify-center">
          <div className="w-72 sm:w-80 aspect-square rounded-sm bg-surface border border-border-color animate-pulse" />
        </div>
      ) : (
        <div className="relative max-w-4xl mx-auto h-[480px] sm:h-[520px] flex items-center justify-center px-4 select-none">
          {/* Left Card (Fans out on scroll) */}
          {left && (
            <Link
              href={`/blog/${left.slug}`}
              className={`absolute z-10 w-60 sm:w-72 rounded-sm border border-border-color bg-surface overflow-hidden shadow-2xl transition-all duration-700 ease-out group ${
                isVisible
                  ? "-translate-x-[150px] sm:-translate-x-[230px] lg:-translate-x-[280px] opacity-100 scale-100 rotate-[-4deg]"
                  : "translate-x-0 opacity-0 scale-75 pointer-events-none rotate-0"
              }`}
            >
              {left.image && (
                <div className="aspect-[16/10] overflow-hidden bg-background">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${left.image}`}
                    alt={left.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-4">
                {left.category && (
                  <span className="text-[11px] font-semibold text-[#B90808] uppercase tracking-wider block mb-1">
                    {left.category}
                  </span>
                )}
                <p className="text-xs sm:text-sm font-bold text-foreground line-clamp-2">{left.title}</p>
              </div>
            </Link>
          )}

          {/* Center Card (Main focal point) */}
          {center && (
            <Link
              href={`/blog/${center.slug}`}
              className={`relative z-20 w-72 sm:w-80 md:w-88 rounded-sm border border-border-color bg-surface overflow-hidden shadow-2xl transition-all duration-700 ease-out group hover:border-zinc-500 hover:shadow-black/40 ${
                isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-10"
              }`}
            >
              {center.image && (
                <div className="aspect-[16/10] overflow-hidden bg-background">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${center.image}`}
                    alt={center.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-5 lg:p-6">
                {center.category && (
                  <span className="text-xs font-semibold text-[#B90808] uppercase tracking-wider block mb-2">
                    {center.category}
                  </span>
                )}
                <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-[#B90808] transition-colors line-clamp-2">
                  {center.title}
                </h3>
                {center.shortDescription && (
                  <p className="text-xs lg:text-sm text-zinc-400 mt-2 line-clamp-2">
                    {center.shortDescription}
                  </p>
                )}
              </div>
            </Link>
          )}

          {/* Right Card (Fans out on scroll) */}
          {right && (
            <Link
              href={`/blog/${right.slug}`}
              className={`absolute z-10 w-60 sm:w-72 rounded-sm border border-border-color bg-surface overflow-hidden shadow-2xl transition-all duration-700 ease-out group ${
                isVisible
                  ? "translate-x-[150px] sm:translate-x-[230px] lg:translate-x-[280px] opacity-100 scale-100 rotate-[4deg]"
                  : "translate-x-0 opacity-0 scale-75 pointer-events-none rotate-0"
              }`}
            >
              {right.image && (
                <div className="aspect-[16/10] overflow-hidden bg-background">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${right.image}`}
                    alt={right.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-4">
                {right.category && (
                  <span className="text-[11px] font-semibold text-[#B90808] uppercase tracking-wider block mb-1">
                    {right.category}
                  </span>
                )}
                <p className="text-xs sm:text-sm font-bold text-foreground line-clamp-2">{right.title}</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Explore More button */}
      {!loading && (
        <div
          className={`flex justify-center mt-12 lg:mt-16 transition-all duration-500 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: "350ms" }}
        >
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 px-6 py-3 lg:px-8 lg:py-3.5 rounded-sm border border-border-color hover:border-border-color text-foreground text-xs lg:text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:bg-background hover:scale-105"
          >
            Explore More
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      )}
    </section>
  );
}