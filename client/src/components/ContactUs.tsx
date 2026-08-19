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
<div
  ref={sectionRef}
  style={{ background: "linear-gradient(180deg, #151515 0%, #3e3a3a 100%)" }}
  className="relative min-h-screen text-foreground flex flex-col justify-center py-16 px-6 lg:px-16 overflow-hidden"
>    {/* ambient glow, fades in with the section */}
    <div
      className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px]  rounded-full blur-[150px] pointer-events-none transition-opacity duration-1500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    />

    <div className="relative max-w-3xl mx-auto w-full">
      
      {/* Header Section — scales + fades in */}
      <div
        className={`text-center mb-16 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-6"
        }`}
      >
        <h1 className="text-3xl sm:text-3xl font-black italic text-foreground mb-4">
          Get In Touch
        </h1>
        <p className="text-zinc-400 text-md sm:text-base">
          Contact us for any inquiries, partnerships, or support needs.
        </p>
      </div>

      {/* Contact Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-12">
        {submitted ? (
          <div className="bg-surface border border-border-color rounded-2xl p-8 text-center space-y-3 animate-[fadeInScale_0.4s_ease-out_forwards]">
            <h3 className="text-lg font-bold text-foreground">Message Sent Successfully!</h3>
            <p className="text-sm text-zinc-400">Thank you for reaching out. We will get back to you soon.</p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-4 px-6 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-surface transition cursor-pointer"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Name Field — staggered entrance */}
              <div
                className={`space-y-2 transition-all duration-700 ease-out ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: isVisible ? "150ms" : "0ms" }}
              >
                <label className="block text-md uppercase tracking-wide font-semibold">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-transparent border-0 border-b border-border-color focus:border-foreground text-foreground text-sm px-0 py-3 focus:outline-none transition-colors placeholder:text-zinc-600"
                />
              </div>

              {/* Email Field — staggered entrance */}
              <div
                className={`space-y-2 transition-all duration-700 ease-out ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: isVisible ? "250ms" : "0ms" }}
              >
                <label className="block text-md uppercase tracking-wide font-semibold">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-transparent border-0 border-b border-border-color focus:border-foreground text-foreground text-sm px-0 py-3 focus:outline-none transition-colors placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Category Selector — staggered entrance */}
            <div
              className={`space-y-2 relative z-30 transition-all duration-700 ease-out ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: isVisible ? "350ms" : "0ms" }}
              ref={categoryRef}
            >
              <label className="block text-md uppercase tracking-wide font-semibold ">
                Category
              </label>
              <div
                onClick={() => setCategoryOpen(!categoryOpen)}
                className="w-full bg-transparent border-0 border-b border-border-color hover:border-zinc-600 text-foreground text-sm px-0 py-3 flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>{selectedLabel}</span>
                <svg className={`w-4 h-4 text-zinc-400 transition-transform ${categoryOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {categoryOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border-color rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-surface animate-[fadeInScale_0.2s_ease-out_forwards]">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        setCategory(cat.value);
                        setCategoryOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-xs transition hover:bg-surface cursor-pointer ${
                        category === cat.value ? "text-foreground font-semibold bg-surface/50" : "text-zinc-400"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Message Field — staggered entrance */}
            <div
              className={`space-y-2 transition-all duration-700 ease-out ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: isVisible ? "450ms" : "0ms" }}
            >
              <label className="block text-md uppercase tracking-wide font-semibold ">
                Type Here
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                className="w-full bg-transparent border-0 border-b border-border-color focus:border-foreground text-foreground text-sm px-0 py-3 focus:outline-none transition-colors placeholder:text-zinc-600 resize-none"
              />
            </div>

            {/* Submit Button — staggered entrance */}
            <div
              className={`pt-6 flex justify-center transition-all duration-700 ease-out ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: isVisible ? "550ms" : "0ms" }}
            >
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-surface border border-border-color hover:border-primary text-foreground font-bold text-xs uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-2xl disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </div>
          </>
        )}
      </form>

    </div>
  </div>
);
}