"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function VideoCom() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch("/api/videos?limit=6&sort=latest")
      .then((data) => setVideos(data.videos || []))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (videos.length === 0) return;
    const interval = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % videos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [videos]);

  // Trigger the entrance animation once the section scrolls into view
  useEffect(() => {
    if (!sectionRef.current || videos.length === 0) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [videos]);

  if (loading || videos.length === 0) return null;

  const center = (videos.length - 1) / 2;

  return (
    <section
      ref={sectionRef}
      className="relative bg-background py-8 sm:py-10 overflow-hidden"
      style={{ perspective: "1200px" }}
    >
      {/* ── Header ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-12 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl italic font-black text-foreground tracking-tight leading-[1.05]">
          Real Work,
          <br />
          <span className="text-[#B90808]">From Creators.</span>
        </h2>

        <p className="text-zinc-400 text-sm sm:text-base mt-4 max-w-md mx-auto leading-relaxed">
          A live look at what brands and creators are Uploading together on Luvenex right now.
        </p>
      </div>

     
      <div className="relative flex items-center sm:justify-center gap-3 sm:gap-6 px-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">        {videos.map((v, i) => {
          const isSpotlight = i === spotlightIndex;

       
          const distFromCenter = i - center;
          const entranceX = inView ? 0 : distFromCenter * 60; 
          const entranceZ = inView ? 0 : -400;
          const entranceOpacity = inView ? 1 : 0;
          const entranceScale = inView ? 1 : 0.7;
          const delay = inView ? i * 220 : 0; 

          return (
            <div
              key={v._id}
                           className={`relative rounded-2xl overflow-hidden border shrink-0 snap-center ${
                isSpotlight
                  ? "w-32 sm:w-56 md:w-64 aspect-[9/16] scale-105 z-10"
                  : "w-24 sm:w-36 md:w-44 aspect-[9/16] scale-95"
              }`}
              style={{
                transform: `translateX(${entranceX}px) translateZ(${entranceZ}px) scale(${entranceScale})`,
                opacity: entranceOpacity,
                transitionProperty: "transform, opacity",
                transitionDuration: "1600ms",
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                transitionDelay: `${delay}ms`,
              }}
            >
              <video
                src={`${process.env.NEXT_PUBLIC_API_URL}${v.videoUrl}`}
                className="w-full h-full object-cover transition-all duration-700 ease-out"
                muted
                loop
                autoPlay={isSpotlight}
                playsInline
              />
            </div>
          );
        })}
      </div>

      {/* ── Explore more button ── */}
      <div className="flex justify-center mt-10">
        <Link
          href="/videos"
          className="inline-flex items-center gap-2 px-6 py-4 rounded-sm border border-border-color hover:border-border-color text-foreground text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:bg-primary"
        >
          Explore More
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
}