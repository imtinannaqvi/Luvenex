"use client";

import { useEffect, useState, useRef } from "react";

type Card = { heading: string; bodyHtml: string };

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

  // Split the rich About HTML into cards: each <h1>/<h2>/<h3> starts a new card
  // (its text is the card heading); everything after it, up to the next heading,
  // becomes that card's body. Content before the first heading becomes an intro card.
  const buildCards = (html: string): Card[] => {
    if (typeof window === "undefined" || !html) return [];
    const cleaned = html.replace(/&nbsp;/gi, " ").replace(/\u00A0/g, " ");
    const doc = new DOMParser().parseFromString(cleaned, "text/html");
    const nodes = Array.from(doc.body.childNodes);

    const cards: Card[] = [];
    let current: Card | null = null;

    const isHeading = (node: ChildNode) =>
      node.nodeType === 1 && /^H[1-3]$/.test((node as HTMLElement).tagName);

    for (const node of nodes) {
      if (isHeading(node)) {
        if (current) cards.push(current);
        current = { heading: (node as HTMLElement).textContent?.trim() || "", bodyHtml: "" };
      } else {
        const piece =
          node.nodeType === 1 ? (node as HTMLElement).outerHTML : node.textContent || "";
        if (!current) current = { heading: "", bodyHtml: "" };
        current.bodyHtml += piece;
      }
    }
    if (current) cards.push(current);

    return cards.filter(
      (c) => c.heading || c.bodyHtml.replace(/<[^>]*>/g, "").trim() || /<img/i.test(c.bodyHtml)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  const cards = page?.content ? buildCards(page.content) : [];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-red-600 selection:text-white">
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
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50 pointer-events-none" />
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

      <div
        className={`max-w-6xl mx-auto px-6 sm:px-8 py-16 sm:py-24 transition-all duration-1000 ease-out delay-200 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {cards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {cards.map((card, i) => (
              <div key={i} className="min-w-0">
                {card.heading && (
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
                    {card.heading}
                  </h2>
                )}
                <div
                  className="about-card-content text-foreground
                    [&_p]:mb-3 [&_p]:leading-relaxed [&_p]:text-foreground [&_p]:text-sm sm:[&_p]:text-base
                    [&_h1]:text-foreground [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2
                    [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2
                    [&_h3]:text-red-500 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:my-2 [&_li]:text-foreground
                    [&_a]:text-red-500 [&_a]:no-underline hover:[&_a]:underline
                    [&_img]:rounded-xl [&_img]:my-4 [&_img]:w-full [&_img]:object-cover [&_img]:border [&_img]:border-border-color"
                  style={{
                    overflowWrap: "break-word",
                    wordBreak: "normal",
                    hyphens: "none",
                    maxWidth: "100%",
                  } as React.CSSProperties}
                  dangerouslySetInnerHTML={{ __html: card.bodyHtml }}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-foreground text-center text-base">Content coming soon.</p>
        )}
      </div>
    </div>
  );
}