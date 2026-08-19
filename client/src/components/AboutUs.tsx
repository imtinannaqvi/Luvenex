"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AboutUs = () => {
  const router = useRouter();
  const [satisfactionCount, setSatisfactionCount] = useState(1);
  const [mounted, setMounted] = useState(false);

  // States to track active touch/click for mobile toggle
  const [leftActive, setLeftActive] = useState(false);
  const [rightActive, setRightActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Counter animation from 1 to 100% on load
  useEffect(() => {
    let start = 1;
    const end = 100;
    const duration = 2000;
    const incrementTime = 25;
    const step = (end - start) / (duration / incrementTime);

    const timer = setInterval(() => {
      start += step;

      if (start >= end) {
        setSatisfactionCount(end);
        clearInterval(timer);
      } else {
        setSatisfactionCount(Math.floor(start));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden text-foreground min-h-screen py-16 px-6 lg:px-16 flex flex-col justify-center">

      {/* ── Full-width background vector behind all three columns ── */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        <img
          src="/images/vector4.webp"
          alt=""
          aria-hidden="true"
          className="w-[130%] max-w-none opacity-100 select-none [filter:brightness(3)_contrast(1.4)] animate-[moveLeftRight_12s_ease-in-out_infinite]"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-18 items-center">

        {/* Left Column with Image and Counter */}
        <div className="flex flex-col space-y-8">
          <div 
            onClick={() => setLeftActive(!leftActive)}
            className="relative group w-full h-[400px] overflow-hidden rounded-sm border border-white/10 shadow-2xl cursor-pointer"
          >
            {/* Image 1 */}
            <img
              src="/images/pexels-edmond-dantes-4339472.jpg"
              alt="Luvenex"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                leftActive ? "opacity-0 scale-110" : "group-hover:opacity-0 group-hover:scale-110"
              }`}
            />

            {/* Image 2 */}
            <img
              src="/images/pexels-edmond-dantes-4339474.jpg"
              alt="Luvenex"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 scale-110 ${
                leftActive ? "opacity-100 scale-100" : "opacity-0 scale-110 group-hover:opacity-100 group-hover:scale-100"
              }`}
            />

            {/* Glass Blur */}
            <div className={`absolute inset-0 transition-all duration-700 backdrop-blur-[2px] bg-white/10 ${
              leftActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}></div>
          </div>

          {/* Counter Display */}
          <div className="flex items-center space-x-4">
            <span className="text-5xl lg:text-6xl font-black tracking-tight">
              {satisfactionCount}%
            </span>
            <span className="text-gray-400 text-sm font-medium uppercase tracking-wider max-w-[120px]">
              Customer Satisfaction
            </span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-14 sm:py-16 overflow-hidden">
          <div className={mounted ? "animate-[flipUp_0.8s_ease-out_forwards]" : "opacity-0"}>
            <div className="about-content text-foreground [&_h1]:text-foreground [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-foreground [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-4 [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:text-foreground [&_p]:mb-3">
              <h2 className="italic">About Luvenex</h2>
              <p>
                Luvenex is Pakistan's premier all-in-one ecosystem built specifically to revolutionize the creator economy. Historically, brands and influencers have had to rely on informal DMs, screenshots, and uncertainty to coordinate collaborations, often leading to delayed payments and mismanaged expectations. Luvenex introduces the missing trust layer by providing secure infrastructure designed to make digital partnerships seamless, transparent, and secure from start to finish.
                <br /><br />
                At its core, the platform operates on the principle that trust is infrastructure. By integrating robust upfront escrow protection—where funds are safely locked before work begins and only released upon milestone approval—Luvenex ensures that creators never have to chase invoices or wait on goodwill, while providing brands with authentic proof of work through verified portfolios, real ratings, and transparent metrics.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div 
          onClick={() => setRightActive(!rightActive)}
          className="relative group w-full h-[550px] overflow-hidden rounded-sm border border-white/10 shadow-2xl cursor-pointer"
        >
          <img
            src="/images/pexels-edmond-dantes-4345990.jpg"
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
              rightActive ? "opacity-0 scale-110" : "group-hover:opacity-0 group-hover:scale-110"
            }`}
          />

          <img
            src="/images/pexels-edmond-dantes-4347017.jpg"
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 scale-110 ${
              rightActive ? "opacity-100 scale-100" : "opacity-0 scale-110 group-hover:opacity-100 group-hover:scale-100"
            }`}
          />

          {/* Frosted Glass */}
          <div className={`absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 backdrop-blur-[2px] transition-all duration-700 ${
            rightActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}></div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push("/about");
            }}
            className="absolute bottom-0 right-1 z-30 w-32 h-32 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold flex flex-col items-center justify-center shadow-[0_20px_60px_rgba(239,68,68,.45)] transition-all duration-300 hover:scale-105 border-4 border-black cursor-pointer"
          >
            <span className="text-sm">Explore Us</span>
            <span className="text-xl mt-1">↗</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default AboutUs;