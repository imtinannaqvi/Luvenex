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
    <div className="relative min-h-screen w-full bg-background text-foreground flex items-center justify-center px-4 sm:px-8 lg:px-16 py-12 selection:bg-red-600 selection:text-white overflow-x-hidden">
      
      {/* Main Split Layout Container */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center z-10">
        
       {/* Left Side: Contact Info & Typography (5 columns) */}
<div className="lg:col-span-5 space-y-8">
  <div>
    <div className="flex items-center space-x-2 text-lg font-mono font-bold tracking-widest text-foreground mb-3">
      <span className="text-foreground tracking-[0.2em]">CONTACT US</span>
    </div>
    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
      Feel Free To Ask Us
    </h1>
    <p className="text-4xl sm:text-5xl lg:text-6xl font-serif italic font-normal text-foreground mt-1">
      Anything
    </p>
  </div>

  <div className="space-y-6 pt-2">
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">
        CALL US FOR QUERY
      </p>
      <a
        href="tel:+447414686498"
        className="text-xl sm:text-2xl font-bold text-foreground hover:text-red-500 transition-colors"
      >
        +923098987636
      </a>
    </div>

    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">
        SEND US EMAIL
      </p>
      <a
        href="mailto:inquiry@luvenex.com"
        className="text-xl sm:text-2xl font-bold text-red-600 hover:underline"
      >
        inquiry@luvenex.com
      </a>
    </div>
  </div>

 
</div>

        {/* Right Side: Form Inputs (7 columns) */}
        <div className="lg:col-span-7 w-full">
          {submitted ? (
            <div className="bg-background border border-[#262626] rounded-3xl p-8 sm:p-10 text-center shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-600 text-foreground flex items-center justify-center mx-auto shadow-lg shadow-red-600/40">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base font-bold text-foreground">Message sent successfully!</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                We'll get back to you within 1-2 business days.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs text-red-500 hover:underline mt-2 font-medium cursor-pointer inline-block"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your full name"
                    className="w-full px-4 py-3.5  border border-[#262626] bg-background text-foreground text-xl placeholder:text-zinc-500 focus:outline-none focus:border-red-600 transition-colors"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="E-mail address"
                    className="w-full px-4 py-3.5  border border-[#262626] bg-background text-foreground text-xl placeholder:text-zinc-500 focus:outline-none focus:border-red-600 transition-colors"
                  />
                </div>
              </div>

              <div ref={categoryRef} className="relative">
                <button
                  type="button"
                  onClick={() => setCategoryOpen((o) => !o)}
                  className="w-full px-4 py-3.5  border border-[#262626] bg-background text-foreground text-xl transition-colors cursor-pointer flex items-center justify-between text-left"
                >
                  <span className={category ? "text-foreground" : "text-zinc-500"}>
                    {selectedLabel || "Subject"}
                  </span>
                  <svg
                    className={`w-4 h-4 text-zinc-400 transition-transform ${categoryOpen ? "rotate-180 text-red-500" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {categoryOpen && (
                  <div className="absolute z-20 mt-1 w-full  border border-[#262626] bg-background shadow-xl overflow-hidden py-1 backdrop-blur-md">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => {
                          setCategory(c.value);
                          setCategoryOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm transition-colors ${
                          category === c.value
                            ? "bg-surface text-foreground font-medium"
                            : "text-foreground hover:bg-surface"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  placeholder="Message"
                  className="w-full px-4 py-3.5  border border-[#262626] bg-background text-foreground text-xl placeholder:text-zinc-500 focus:outline-none focus:border-red-600 transition-colors resize-none"
                />
              </div>

             <button
  type="submit"
  disabled={submitting}
  className="group py-4 px-10 bg-primary active:scale-[0.98] hover:text-black text-white text-md font-semibold transition-all disabled:opacity-50 cursor-pointer"
>
  <span className="inline-flex gap-1.5">
    {(submitting ? "SUBMITTING..." : "SUBMIT NOW").split(" ").map((word, i) => (
      <span
        key={i}
        className="inline-block transition-all duration-300 ease-out opacity-70 group-hover:opacity-100 group-hover:-translate-y-0.5"
        style={{ transitionDelay: `${i * 90}ms` }}
      >
        {word}
      </span>
    ))}
  </span>
</button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}