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

  const formatDate = (dateString: string) => {
    if (!dateString) return "AUG 17, 2026";
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();
  };

  return (
    <section ref={sectionRef} className="relative bg-background py-16 sm:py-20 lg:py-28 overflow-hidden">
      {/* Section Header */}
      <div
        className={`max-w-6xl mx-auto px-4 sm:px-6 mb-12 lg:mb-16 text-center transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <h2 className="text-3xl sm:text-4xl lg:text-5xl italic font-black text-foreground tracking-tight leading-[1.05]">
          Featured
          <span className="text-[#B90808]"> Blogs</span>
        </h2>
      </div>

      {loading ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="aspect-[4/3] rounded-sm bg-background border border-[#222222] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 select-none">
          {blogs.map((blog, index) => (
            <Link
              key={blog.slug || index}
              href={`/blog/${blog.slug}`}
              className={`group bg-background border border-[#222222] rounded-sm p-5 sm:p-6 shadow-2xl transition-all duration-700 ease-out hover:border-zinc-500 hover:-translate-y-2 flex flex-col ${
                isVisible
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-12 scale-95"
              }`}
              style={{ transitionDelay: `${index * 180}ms` }}
            >
              {blog.image && (
                <div className="w-full aspect-[4/3] overflow-hidden rounded-sm bg-background mb-5">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${blog.image}`}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="flex flex-col flex-grow justify-between space-y-12">
                <div className="space-y-3">
                  <span className="inline-block bg-[#B90808] text-foreground text-[11px] font-bold px-3 py-1 rounded-sm uppercase tracking-wider">
                    {formatDate(blog.createdAt || blog.date)}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-[#B90808] transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                </div>
                <p className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider pt-2 border-t border-[#222222]">
                  BY: {blog.author?.name || blog.author || "LUVENEXADMIN98"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Explore More button */}
      {!loading && (
        <div
          className={`flex justify-center mt-12 lg:mt-16 transition-all duration-500 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 px-6 py-3 lg:px-8 lg:py-3.5 rounded-sm border border-[#333] hover:border-[#B90808] text-foreground text-xs lg:text-sm font-bold uppercase transition-all duration-300 hover:bg-[#B90808] hover:scale-105"
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