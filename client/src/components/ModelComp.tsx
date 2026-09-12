"use client";

import { useEffect, useRef, useState } from "react";

const MODELS = [
  { name: "Sara", role: "Fashion Creator", image: "/images/pexels-eric-quinones-2149843819-38221227.jpg" },
  { name: "Noman", role: "Lifestyle Creator", image: "/images/pexels-zandatsu-29889408.jpg" },
  { name: "Ayesha", role: "Beauty Creator", image: "/images/pexels-yash-singh-407281087-19919589.jpg" },
  { name: "Bilal", role: "Fitness Creator", image: "/images/pexels-manzano-13198414.jpg" },
];

export default function ModelCom() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-background py-16 sm:py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-black italic text-foreground tracking-tight">
            Featured <span className="text-[#B90808]">Creators</span>
          </h2>
          <p className="text-sm sm:text-base text-foreground mt-3 max-w-md mx-auto">
            A look at some of the talent already growing on Luvenex.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {MODELS.map((m, i) => (
            <div
              key={m.name}
              className={`group relative aspect-[4/7] rounded-sm overflow-hidden bg-zinc-900 transition-all duration-700 ease-out ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: isVisible ? `${i * 120}ms` : "0ms" }}
            >
              <img
                src={m.image}
                alt={m.name}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />

              {/* Caption overlay — fades in on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <p className="text-sm sm:text-base font-bold text-foreground leading-tight">{m.name}</p>
                <p className="text-[11px] sm:text-xs text-foreground/70">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}