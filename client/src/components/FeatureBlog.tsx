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
        className={`max-w-6xl mx-auto px-4 sm:px-6 mb-14 lg:mb-20 text-center transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <h2 className="text-3xl sm:text-4xl lg:text-5xl italic font-black text-foreground tracking-tight leading-[1.05]">
          Featured
          <span className="text-[#B90808]">  Blogs</span>
        </h2>
      </div>

      {loading ? (

        <div className="relative max-w-4xl lg:max-w-5xl mx-auto px-4 flex items-end justify-center gap-4 sm:gap-6 lg:gap-10">
          <div className="hidden sm:block w-40 md:w-48 lg:w-56 aspect-[3/4] rounded-2xl bg-surface animate-pulse shrink-0" />
          <div className="w-56 sm:w-72 md:w-80 lg:w-96 aspect-square rounded-2xl bg-surface animate-pulse shrink-0 sm:-translate-y-6 md:-translate-y-8 lg:-translate-y-10" />
          <div className="hidden sm:block w-40 md:w-48 lg:w-56 aspect-[3/4] rounded-2xl bg-surface animate-pulse shrink-0" />
        </div>
      ) : (
        <div className="relative max-w-4xl lg:max-w-5xl mx-auto px-4 flex items-end justify-center gap-4 sm:gap-6 lg:gap-10">
          {/* Left card — sits lower at rest, rises up to meet center on hover */}
          {left && (
            <Link
              href={`/blog/${left.slug}`}
              className={`group hidden sm:block relative w-40 md:w-48 lg:w-56 rounded-2xl overflow-hidden border border-border-color bg-background shrink-0 transition-all duration-500 ease-out hover:-translate-y-6 md:hover:-translate-y-8 lg:hover:-translate-y-10 hover:opacity-100 hover:border-zinc-600 hover:shadow-xl hover:shadow-black/50 hover:z-10 ${
                isVisible ? "opacity-70 translate-x-0 scale-95" : "opacity-0 -translate-x-20 scale-90"
              }`}
              style={{ transitionDelay: isVisible ? "150ms" : "0ms" }}
            >
              {left.image && (
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${left.image}`}
                    alt={left.title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                </div>
              )}
              <div className="p-3">
                <p className="text-xs lg:text-sm font-bold text-foreground line-clamp-2">{left.title}</p>
              </div>
            </Link>
          )}
{/* Center card — permanently raised above the row, most prominent */}
          {center && (
            <Link
              href={`/blog/${center.slug}`}
              className={`group relative w-56 sm:w-72 md:w-80 lg:w-96 rounded-2xl overflow-hidden z-10 sm:-translate-y-6 md:-translate-y-8 lg:-translate-y-10 transition-all duration-700 ease-out ${
                isVisible ? "opacity-100 scale-100" : "opacity-0 translate-y-16 scale-90"
              }`}
            >
              {center.image && (
                <div className="aspect-[2/2] overflow-hidden">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${center.image}`}
                    alt={center.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                </div>
              )}
              <div className="p-4 lg:p-5">
                {center.category && (
                  <span className="text-[15px] lg:text-base font-semibold text-[#B90808]">
                    {center.category}
                  </span>
                )}
                <p className="text-sm sm:text-base lg:text-lg font-bold text-foreground mt-1 line-clamp-2">{center.title}</p>
                {center.shortDescription && (
                  <p className="text-xs lg:text-sm text-zinc-400 mt-2 line-clamp-2">{center.shortDescription}</p>
                )}
              </div>
            </Link>
          )}

          {/* Right card — sits lower at rest, rises up to meet center on hover */}
          {right && (
            <Link
              href={`/blog/${right.slug}`}
              className={`group hidden sm:block relative w-40 md:w-48 lg:w-56 rounded-2xl overflow-hidden border border-border-color bg-surface shrink-0 transition-all duration-500 ease-out hover:-translate-y-6 md:hover:-translate-y-8 lg:hover:-translate-y-10 hover:opacity-100 hover:border-zinc-600 hover:shadow-xl hover:shadow-black/50 hover:z-10 ${
                isVisible ? "opacity-70 translate-x-0 scale-95" : "opacity-0 translate-x-20 scale-90"
              }`}
              style={{ transitionDelay: isVisible ? "150ms" : "0ms" }}
            >
              {right.image && (
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${right.image}`}
                    alt={right.title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                </div>
              )}
              <div className="p-3">
                <p className="text-xs lg:text-sm font-bold text-foreground line-clamp-2">{right.title}</p>
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
          style={{ transitionDelay: isVisible ? "350ms" : "0ms" }}
        >
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 px-6 py-3 lg:px-8 lg:py-3.5 rounded-xl border border-border-color hover:border-border-color text-foreground text-xs lg:text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:bg-background hover:scale-105"
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