"use client";

import { useEffect, useState, useRef } from "react";

export default function AboutPage() {
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/about`)
      .then((res) => res.json())
      .then((data) => setPage(data.page))
      .finally(() => setLoading(false));
  }, []);

  // trigger entrance animations once content is ready
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-red-600 selection:text-white">
      {/* Hero — full-width image, complete height shown (top anchored, no crop) */}
      {page?.heroImage && (
        <div
  ref={heroRef}
  onMouseMove={handleMouseMove}
  onMouseLeave={handleMouseLeave}
  className="relative w-full h-[50vh] sm:h-[70vh] overflow-hidden cursor-pointer bg-black"
>
  <img
    src={`${process.env.NEXT_PUBLIC_API_URL}${page.heroImage}`}
    alt={page.title || "About Luvenex"}
    style={{
      transform: `translate(${mousePos.x * 10}px, ${mousePos.y * 8}px) scale(1.03)`,
      transformOrigin: "center top",
      transition: "transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)",
    }}
    className="block w-full h-full object-cover object-top"
  />
          {/* gradient overlay — keeps the title readable without hiding the image */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50 pointer-events-none" />

         {/* Title — was: items-center  →  now lower area with breathing room */}
<div className="absolute inset-0 flex items-end justify-center px-4 pb-16 sm:pb-20 pointer-events-none">
  <div
    className={`transition-all duration-700 ease-out text-center ${
      mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
    }`}
  >
   
  </div>
</div>
        </div>
      )}

      {/* Fallback title if no hero image */}
      {!page?.heroImage && (
        <div
          className={`pt-24 pb-8 text-center transition-all duration-700 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight inline-block border-b-2 border-red-600 pb-2">
            {page?.title || "About Luvenex"}
          </h1>
        </div>
      )}

      {/* Content — single flowing paragraph block */}
      <div
        className={`max-w-3xl mx-auto px-6 sm:px-8 py-16 sm:py-24 transition-all duration-1000 ease-out delay-200 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {page?.content ? (
          <div
            className="about-content max-w-none text-foreground break-normal whitespace-normal [overflow-wrap:normal] [word-break:normal] [white-space:normal] [&_*]:!whitespace-normal [&_*]:![word-break:normal] [&_*]:![overflow-wrap:normal]
              [&_h1]:text-foreground [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-0
              [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2
              [&_h3]:text-red-500 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
              [&_p]:mb-3 [&_p]:leading-relaxed [&_p]:text-foreground [&_p]:text-base sm:[&_p]:text-lg [&_p]:break-normal [&_p]:whitespace-normal [&_p]:[overflow-wrap:normal] [&_p]:[word-break:normal] [&_p]:[white-space:normal]
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ul]:my-3 [&_li]:text-foreground [&_li]:leading-relaxed
              [&_a]:text-red-500 [&_a]:no-underline hover:[&_a]:underline
              [&_img]:rounded-2xl [&_img]:my-6 [&_img]:w-full [&_img]:object-cover [&_img]:shadow-2xl [&_img]:border [&_img]:border-border-color"
            dangerouslySetInnerHTML={{
              __html: page.content
                .replace(/&nbsp;/gi, " ")   // stored content has literal &nbsp; entities from a Word/Docs paste — these block line-wrapping
                .replace(/\u00A0/g, " "),   // also strip actual non-breaking space characters, just in case
            }}
          />
        ) : (
          <p className="text-foreground text-center text-base">Content coming soon.</p>
        )}
      </div>

    </div>
  );
}