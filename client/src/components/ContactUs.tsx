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
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

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
        body: JSON.stringify({ name, email, message, category: category || "general" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Failed to send message");
      setSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
      setCategory("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedLabel = CATEGORIES.find((c) => c.value === category)?.label;

  // Underline-only input style to match the reference "Get In Touch" layout.
  const underlineInput =
    "w-full bg-background border-0 border-b border-border-color rounded-none px-0 py-3 " +
    "text-foreground text-lg focus:outline-none focus:border-primary transition-colors " +
    "placeholder:text-zinc-500";

  const fieldLabel =
    "block text-lg uppercase tracking-widest text-zinc-400 font-semibold mb-8";

  return (
    <div
      ref={sectionRef}
      className="relative min-h-screen bg-background text-foreground flex flex-col justify-center py-16 px-6 lg:px-16 overflow-hidden"
    >
      <div className="relative max-w-4xl mx-auto w-full">
        {/* Heading */}
        <div
          className={`text-center mb-12 transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <h1 className="text-4xl sm:text-6xl font-semibold text-foreground tracking-tight">
            Get In Touch
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 mt-4">
            Contact us for a great collaboration &amp; beautiful brand moments
          </p>
        </div>

        {submitted ? (
          <div className="bg-background border border-border-color rounded-2xl p-8 text-center space-y-3 max-w-lg mx-auto animate-[fadeInScale_0.4s_ease-out_forwards]">
            <h3 className="text-lg font-bold text-foreground">Message Sent Successfully!</h3>
            <p className="text-sm text-zinc-400">
              Thank you for reaching out. We will get back to you soon.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-4 px-6 py-2.5 rounded-xl bg-background text-foreground font-semibold text-xs hover:bg-surface transition cursor-pointer border border-border-color"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-8">
            {/* Row 1: Name + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div
                className={`transition-all duration-700 ease-out ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: isVisible ? "150ms" : "0ms" }}
              >
                <label className={fieldLabel}>Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className={underlineInput}
                />
              </div>

              <div
                className={`transition-all duration-700 ease-out ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: isVisible ? "250ms" : "0ms" }}
              >
                <label className={fieldLabel}>Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail address"
                  className={underlineInput}
                />
              </div>
            </div>

            {/* Row 2: Subject (dropdown) — full width, underline style */}
            <div
              className={`relative z-30 transition-all duration-700 ease-out ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: isVisible ? "350ms" : "0ms" }}
              ref={categoryRef}
            >
              <label className={fieldLabel}>Subject</label>
              <div
                onClick={() => setCategoryOpen(!categoryOpen)}
                className="w-full bg-background border-0 border-b border-border-color rounded-none py-3 flex items-center justify-between cursor-pointer hover:border-zinc-500 transition-colors"
              >
                <span className={`text-lg ${category ? "text-foreground" : "text-zinc-500"}`}>
                  {selectedLabel || "Select a subject"}
                </span>
                <svg
                  className={`w-4 h-4 text-zinc-400 transition-transform ${
                    categoryOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {categoryOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border-color rounded-md z-30 overflow-hidden divide-y divide-border-color animate-[fadeInScale_0.2s_ease-out_forwards]">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        setCategory(cat.value);
                        setCategoryOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition hover:bg-surface cursor-pointer ${
                        category === cat.value
                          ? "text-foreground font-semibold bg-surface/50"
                          : "text-zinc-400"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Row 3: Message */}
            <div
              className={`transition-all duration-700 ease-out ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: isVisible ? "450ms" : "0ms" }}
            >
              <label className={fieldLabel}>Text Here</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your message"
                className="w-full bg-background border-0 border-b border-border-color rounded-none px-0 py-3 text-foreground text-lg focus:outline-none focus:border-primary transition-colors placeholder:text-zinc-500 resize-none"
              />
            </div>

            {/* Submit — centered like the reference */}
            <div
              className={`pt-4 flex justify-center transition-all duration-700 ease-out ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: isVisible ? "550ms" : "0ms" }}
            >
              <button
                type="submit"
                disabled={submitting}
                className="px-10 py-4 rounded-sm bg-primary text-white font-bold text-xs uppercase tracking-widest transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}