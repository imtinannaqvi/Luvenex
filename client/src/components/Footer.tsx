"use client";

import React from "react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="relative w-full min-h-screen bg-background text-foreground flex flex-col justify-between p-6 sm:p-12 overflow-hidden selection:bg-white selection:text-black">
      {/* Background Subtle Pattern — currentColor follows the theme */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none text-foreground"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* SVG Arc Ring with Single Left-to-Right Moving Light Beam */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden text-foreground">
        <svg
          viewBox="0 0 1000 500"
          className="w-full max-w-6xl h-auto opacity-90"
          fill="none"
        >
          <defs>
            {/* Glow effect filter */}
            <filter id="lightGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Light streak gradient — follows currentColor (theme-aware) */}
            <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
              <stop offset="60%" stopColor="currentColor" stopOpacity="0.4" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
            </linearGradient>

            {/* Arc Path Definition */}
            <path
              id="centerArc"
              d="M 50,480 A 450,400 0 0,1 950,480"
            />
          </defs>

          {/* Base Static Ring Line */}
          <use
            href="#centerArc"
            stroke="currentColor"
            strokeOpacity="0.12"
            strokeWidth="1.5"
            fill="none"
          />

          {/* Single Animated Glowing Light Beam */}
          <use
            href="#centerArc"
            stroke="url(#beamGradient)"
            strokeWidth="3.5"
            fill="none"
            className="animate-light-beam"
            filter="url(#lightGlow)"
          />
        </svg>
      </div>

      {/* Top Header Placeholder */}
      <div className="w-full z-10 flex justify-between items-center min-h-[40px]" />

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 py-12">
        {/* Left Navigation */}
        <nav className="flex flex-col space-y-6 text-center md:text-left text-sm italic font-semibold  text-foreground/70">
          <Link href="/about" className="hover:text-foreground transition-colors">ABOUT US</Link>
          <Link href="/how-it-works" className="hover:text-foreground transition-colors">HOW IT WORKS</Link>
          <Link href="/discover" className="hover:text-foreground transition-colors">DISCOVER CREATORS</Link>
          <Link href="/brands" className="hover:text-foreground transition-colors">BRANDS</Link>
        </nav>

        {/* Center Brand Title & Info */}
        <div className="flex flex-col items-center justify-center text-center space-y-4 my-8 md:my-0 max-w-lg">
          <Link href="/" className="">
          <img
            src="/file_0000000089d482118329077f6e1cff4c.png"
            alt="Luvenex"
            className="h-7 sm:h-9 w-auto select-none dark:invert-0 invert transition-all"
          />
        </Link>
          <p className="text-xs sm:text-sm tracking-[0.18em] text-foreground/70 font-light leading-relaxed  max-w-md">
            Where Brands & Influencers Connect, Collaborate, & Close Deals.
            The all-in-one ecosystem for high-impact creator partnerships—featuring direct campaign discovery, smart negotiations, real-time performance analytics, and guaranteed secure escrow payouts.
          </p>
        </div>

        {/* Right Navigation */}
        <nav className="flex flex-col space-y-6 text-center md:text-right text-sm font-semibold italic text-foreground/70">
          <Link href="/services" className="hover:text-foreground transition-colors">SERVICES</Link>
          <Link href="/blog" className="hover:text-foreground transition-colors">BLOG</Link>
          <Link href="/videos" className="hover:text-foreground transition-colors">VIDEOS</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">CONTACT US</Link>
        </nav>
      </main>

      {/* Footer Section */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto pt-6 border-t border-border-color/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground/50">
        <div>
          <p className="tracking-wide">
            © <span className="text-foreground/70 font-medium">Luvenex LTD</span>. All Rights Reserved.
          </p>
        </div>

        {/* Quick Footer Policy Links */}
        <div className="flex items-center space-x-6 text-[11px] font-medium tracking-widest text-foreground/60 uppercase">
          <Link href="/privacy" className="hover:text-foreground italic transition-colors">Privacy Policy</Link>
          <span className="text-border-color">•</span>
          <Link href="/terms" className="hover:text-foreground italic transition-colors">Terms of Service</Link>
        </div>

        {/* Social Links */}
        <div className="flex items-center space-x-3">
          <a href="#" aria-label="Facebook" className="w-8 h-8 rounded-full border border-border-color flex items-center justify-center hover:border-foreground hover:text-foreground transition-colors">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
          <a href="#" aria-label="Instagram" className="w-8 h-8 rounded-full border border-border-color flex items-center justify-center hover:border-foreground hover:text-foreground transition-colors">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a href="#" aria-label="YouTube" className="w-8 h-8 rounded-full border border-border-color flex items-center justify-center hover:border-foreground hover:text-foreground transition-colors">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
          <a href="#" aria-label="Website" className="w-8 h-8 rounded-full border border-border-color flex items-center justify-center hover:border-foreground hover:text-foreground transition-colors">
            <svg className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </a>
        </div>
      </footer>

      {/* Standard CSS Styles to prevent hydration mismatch */}
      <style>{`
        @keyframes moveLightStreak {
          0% {
            stroke-dashoffset: 1400;
          }
          100% {
            stroke-dashoffset: -1400;
          }
        }
        .animate-light-beam {
          stroke-dasharray: 200 1400;
          animation: moveLightStreak 4s linear infinite;
        }
      `}</style>
    </div>
  );
}