"use client";

import { useState } from "react";

export default function HowItWorksPage() {
  const [tab, setTab] = useState<"brand" | "influencer">("brand");

  const brandSteps = [
    {
      title: "Post or Browse",
      text: "Post a campaign brief with your requirements or browse verified creator gigs to hire directly.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      title: "Review & Agree",
      text: "Review applicant proposals, check portfolio metrics, or send custom direct offers.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Fund Escrow",
      text: "Pay the agreed price + 5% fee. Luvenex holds your funds safely in escrow until work is delivered.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      title: "Review Delivery",
      text: "Inspect the delivered content. Request revisions effortlessly if adjustments are required.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      title: "Approve & Release",
      text: "Approve the final submission to trigger immediate payment release to the creator.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  const influencerSteps = [
    {
      title: "Build Your Profile",
      text: "Highlight your portfolio, niche, rates, and listed gigs. Complete profiles stand out to brands.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      title: "Apply or Get Hired",
      text: "Submit tailored proposals to active campaign briefs, or receive direct hire offers from brands.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A2.5 2.5 0 013 11.2V8.8A2.5 2.5 0 015.436 6.317" />
        </svg>
      ),
    },
    {
      title: "Accept the Offer",
      text: "Confirm campaign scope, deliverables, pricing, and deadlines before starting work.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    {
      title: "Deliver Your Work",
      text: "Upload content and attach delivery notes directly through the portal before the deadline.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
    },
    {
      title: "Get Paid",
      text: "Once approved (or auto-released), earnings deposit straight into your wallet for easy withdrawal.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ];

  const steps = tab === "brand" ? brandSteps : influencerSteps;

  return (
    <div className="bg-background text-foreground min-h-screen selection:bg-red-600 selection:text-background">
      {/* Hero Section with Background Image + Header Content */}
      <div className="relative w-full h-[380px] sm:h-[440px] overflow-hidden flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-cover bg-center animate-hero-zoom"
          style={{ backgroundImage: `url(/images/pexels-burst-373892.jpg)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />

        <div className="relative z-10 text-center space-y-3 sm:space-y-4 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-3xl font-extrabold italic text-white drop-shadow-lg opacity-0 animate-fade-up [animation-delay:0.1s]">
            How <span className="text-red-600">Luvenex</span> Works
          </h1>
          <p className="text-white text-sm sm:text-base leading-relaxed px-2 drop-shadow opacity-0 animate-fade-up [animation-delay:0.3s]">
            A secure escrow platform connecting visionary brands with top-tier creators.
          </p>

          {/* Toggle Pills */}
          <div className="inline-flex p-1 bg-surface backdrop-blur-sm border border-border-color rounded-full shadow-inner mt-4 opacity-0 animate-fade-up [animation-delay:0.5s]">
            <button
              onClick={() => setTab("brand")}
              className={`px-5 sm:px-7 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                tab === "brand"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "text-zinc-400 hover:text-foreground"
              }`}
            >
              For Brands
            </button>
            <button
              onClick={() => setTab("influencer")}
              className={`px-5 sm:px-7 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                tab === "influencer"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "text-zinc-400 hover:text-foreground"
              }`}
            >
              For Creators
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto space-y-12 sm:space-y-16">

          {/* Connected Steps Vertical Timeline */}
          <div className="relative pl-4 sm:pl-8 space-y-6 sm:space-y-8 before:absolute before:left-[27px] sm:before:left-[43px] before:top-6 before:bottom-6 before:w-0.5 before:bg-gradient-to-b before:from-red-600 before:via-border-color before:to-transparent">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="relative flex items-start gap-4 sm:gap-6 group opacity-0 animate-fade-up"
                style={{ animationDelay: `${0.1 * i}s` }}
              >
                {/* Step Number Circle */}
                <div className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface border-2 border-red-600 group-hover:border-red-500 text-red-500 group-hover:text-white group-hover:bg-red-600 font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 transition-all duration-300 shadow-lg shadow-black/20">
                  {i + 1}
                </div>

                {/* Step Content Card */}
                <div className="flex-1 bg-surface/80 border border-border-color/80 group-hover:border-border-color rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 shadow-xl backdrop-blur-sm space-y-2 group-hover:-translate-y-0.5">
                  <div className="flex items-center gap-2 sm:gap-3 text-foreground">
                    <span className="p-1.5 sm:p-2 rounded-lg bg-red-950/40 text-red-500 border border-red-900/30">
                      {s.icon}
                    </span>
                    <h3 className="font-bold text-base sm:text-lg tracking-tight">
                      {s.title}
                    </h3>
                  </div>
                  <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                    {s.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust & Guarantee Callout Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/30 via-surface to-card border border-red-900/40 p-6 sm:p-8 text-center space-y-3 shadow-2xl opacity-0 animate-fade-up [animation-delay:0.6s]">
            <div className="w-10 h-10 rounded-full bg-red-600/10 border border-red-600/30 text-red-500 flex items-center justify-center mx-auto animate-pulse-soft">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="text-foreground font-bold text-sm sm:text-base tracking-wide">
              100% Escrow Protection
            </h4>
            <p className="text-zinc-400 text-xs sm:text-sm italic leading-relaxed max-w-xl mx-auto">
              Your money is never at risk... it never just disappears
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}