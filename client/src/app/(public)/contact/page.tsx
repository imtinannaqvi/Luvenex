"use client";

import { getUser, getToken } from "@/lib/auth";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import Link from "next/link";

const CATEGORIES = [
  { value: "general", label: "General inquiry" },
  { value: "partnership", label: "Partnership" },
  { value: "press", label: "Press" },
  { value: "support", label: "Support" },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name, email, message, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Failed to send message");
      setSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedLabel = CATEGORIES.find((c) => c.value === category)?.label;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background text-foreground flex flex-col items-center justify-center px-4 sm:px-6 py-8 selection:bg-red-600 selection:text-white isolate">

      <div className="absolute top-1/2 -translate-y-1/2 left-0 -translate-x-1/3 w-72 sm:w-96 h-72 sm:h-96 bg-red-500/20 rounded-full blur-[50px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/3 w-72 sm:w-96 h-72 sm:h-96 bg-red-500/20 rounded-full blur-[50px] pointer-events-none -z-10" />

      <div className="relative w-full max-w-lg z-10">
        <div className="text-center mb-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold italic tracking-tight">
            Get in <span className="text-red-600">Touch</span>
          </h1>
        </div>

        {/* Deal-issue callout */}
        {user && (
          <div className="bg-red-950/20 border border-red-800/30 rounded-xl p-3 mb-4 text-center backdrop-blur-sm">
            <p className="text-xs sm:text-sm text-foreground font-medium">Having an issue with a specific deal?</p>
            <p className="text-xs text-foreground mt-0.5">
              File a complaint directly from your deal's page instead — it gives our team the full context.
            </p>
            <Link
              href="/app/deals"
              className="text-xs text-red-500 hover:underline mt-1.5 inline-block font-semibold transition-colors"
            >
              Go to my deals →
            </Link>
          </div>
        )}

        {submitted ? (
          <div className="bg-surface/80 border border-border-color rounded-2xl p-6 sm:p-8 text-center backdrop-blur-md shadow-xl">
            <p className="text-sm font-semibold text-foreground">Message sent!</p>
            <p className="text-xs text-zinc-400 mt-1">
              We'll get back to you within 1-2 business days.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-xs text-red-500 hover:underline mt-4 font-medium"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-surface/80 border border-border-color rounded-2xl p-6 sm:p-7 space-y-4 backdrop-blur-md shadow-2xl"
          >
            <div>
              <label className="block text-sm  font-semibold text-foreground mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
                className="w-full px-3.5 py-2 italic rounded-xl border border-border-color bg-background text-foreground text-base sm:text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm  font-semibold text-foreground mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full px-3.5 py-2 italic rounded-xl border border-border-color bg-background text-foreground text-base sm:text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>

            <div ref={categoryRef} className="relative">
              <label className="block text-sm  font-semibold text-foreground mb-1">About What?</label>
              <button
                type="button"
                onClick={() => setCategoryOpen((o) => !o)}
                className="w-full italic px-3.5 py-2 rounded-xl border border-border-color bg-background text-foreground text-base sm:text-sm  transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>{selectedLabel}</span>
                <svg
                  className={`w-4 h-4 text-foreground transition-transform ${categoryOpen ? "rotate-180 text-red-500" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Compact select list options */}
              {categoryOpen && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-border-color bg-card/95 shadow-xl overflow-hidden py-1 backdrop-blur-md">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        setCategory(c.value);
                        setCategoryOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-1 text-[11px] sm:text-xs transition-colors ${
                        category === c.value
                          ? "bg-red-600 text-white font-medium"
                          : "text-foreground hover:bg-red-600/20 hover:text-foreground"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm italic font-semibold text-foreground mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={3}
                placeholder="How can we help?"
                className="w-full px-3.5 py-2 italic rounded-xl border border-border-color bg-background text-foreground text-base sm:text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors resize-none"
              />
            </div>

            {/* Solid high-contrast red button with shadow */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 mt-1 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-sm font-semibold shadow-lg shadow-red-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Sending..." : "Send message"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}