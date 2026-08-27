"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

type Slide = { src?: string; poster?: string; caption?: string };

const SLIDES: Slide[] = [
  { src: "/videos/istockphoto-2149199638-640_adpp_is.mp4", caption: "human-vetted" },
  { src: "/videos/istockphoto-2167055507-640_adpp_is.mp4", caption: "viewsss" },
  { src: "/videos/istockphoto-1992011732-640_adpp_is.mp4" },
  { src: "/videos/istockphoto-1989763073-640_adpp_is.mp4" },
  { src: "/videos/istockphoto-1721110440-640_adpp_is.mp4" },
  { src: "/videos/istockphoto-1572185399-640_adpp_is.mp4", caption: "AI analysed" },
  { src: "/videos/istockphoto-1477915083-640_adpp_is.mp4" },
  { src: "/videos/istockphoto-1470765116-640_adpp_is.mp4" },
  { src: "/videos/istockphoto-2223963097-640_adpp_is.mp4" },
  { src: "/videos/istockphoto-2182018031-640_adpp_is.mp4" },
  { src: "/videos/istockphoto-2170908941-640_adpp_is.mp4" },
];

/* ── EXACT 7-CARD CIRCULAR ARC CONFIGURATION (3 Left + 1 Center Deep + 3 Right) ── */
const VISIBLE = 3;        
const PERSPECTIVE = 950;  
const SPACING = 100;        
const CARD_W = 230;
const CARD_H = 350;

const VideoSlider = () => {
  const [active, setActive] = useState(Math.floor(SLIDES.length / 2));
  const [drag, setDrag] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);

  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "150px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((v, idx) => {
      if (!v) return;
      const N = SLIDES.length;
      let d = ((idx - active) % N + N) % N;
      if (d > N / 2) d -= N;
      const visible = Math.abs(d) <= VISIBLE;
      if (inView && visible) {
        const p = v.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [active, inView]);

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setDrag(e.clientX - startX.current);
  };

  const onUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    setDrag((d) => {
      const steps = Math.round(-d / SPACING);
      setActive((a) => a + steps);
      return 0;
    });
  }, []);

  const current = active + -drag / SPACING;

  return (
    <section ref={sectionRef} className="relative w-full pt-12 pb-6 overflow-hidden select-none">
      <div className="relative z-10 max-w-3xl mx-auto text-center px-4 mb-6">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl italic font-black text-foreground tracking-tight leading-tight whitespace-nowrap">
          Run your creator  <br /> <span className="text-[#B90808]"> marketing here</span>
        </h2>

        <p className="mt-4 max-w-xl mx-auto text-base sm:text-md text-zinc-400 leading-relaxed">
          Discover vetted creators, launch campaigns, and close brand deals — all managed
          securely on one platform, from first message to final payment.
        </p>
      </div>

      {/* ── 3D perspective container displaying all 7 cards in a circular arc ── */}
      <div
        className="relative mx-auto mt-20 h-[500px] w-full max-w-7xl touch-none cursor-grab active:cursor-grabbing"
        style={{ perspective: `${PERSPECTIVE}px`, transformStyle: "preserve-3d" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        {SLIDES.map((slide, i) => {
          const N = SLIDES.length;
          let offset = ((i - current) % N + N) % N;
          if (offset > N / 2) offset -= N;
          const abs = Math.abs(offset);

          // ── Circular Arc Cylindrical Math with slight spacing buffer ──
          const angle = offset * 0.34; // slightly increased from 0.32 to add a small gap
          const x = Math.sin(angle) * 780; // slightly increased horizontal spread for card separation
          // Center card (offset 0) is recessed deep in background (-850), outer cards curve forward (+Z)
          const z = -850 + (Math.abs(angle) * 650) + (Math.pow(abs, 1.2) * 60);
          const rotateY = -angle * (180 / Math.PI) * 1.15; // natural rotation matching the cylinder

          const opacity = abs > VISIBLE ? 0 : 1;
          const zIndex = 1000 + Math.round(z);

          return (
            <div
              key={i}
              onClick={() => {
                if (!drag) setActive(i);
              }}
              className="absolute left-1/2 top-[70px]"
              style={{
                width: `${CARD_W}px`,
                height: `${CARD_H}px`,
                marginLeft: `-${CARD_W / 2}px`,
                marginTop: `-${CARD_H / 2}px`,
                transform: `translateX(${x}px) translateZ(${z}px) rotateY(${rotateY}deg)`,
                transformStyle: "preserve-3d",
                zIndex,
                opacity,
                transition: dragging.current ? "none" : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease",
              }}
            >
              {/* card */}
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-card ring-1 ring-black/15">
                {slide.src ? (
                  <video
                    ref={(el) => {
                      videoRefs.current[i] = el;
                    }}
                    src={slide.src}
                    poster={slide.poster}
                    className="w-full h-full object-cover pointer-events-none"
                    muted
                    loop
                    playsInline
                    preload={abs <= VISIBLE ? "auto" : "none"}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-500">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                      <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                    <span className="text-[11px] font-medium">Add video</span>
                  </div>
                )}
              </div>

              {/* caption */}
              {slide.caption && (
                <p className="absolute left-1/2 -translate-x-1/2 top-full mt-3 whitespace-nowrap text-center text-lg font-serif italic text-foreground">
                  {slide.caption}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* drag handle hint */}
      <div className="mt-4 flex justify-center">
        <div className="w-10 h-5 rounded-full border border-border-color flex items-center justify-center">
          <div className="w-4 h-1 rounded-full bg-card/80" />
        </div>
      </div>
    </section>
  );
};

export default VideoSlider;