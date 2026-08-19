"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

type Role = "brand" | "influencer" | null;

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialRole = searchParams.get("role") as Role;
  const [role, setRole] = useState<Role>(initialRole);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  if (!role) {
    setError("Please choose whether you're a brand or a creator.");
    return;
  }

  if (!agreedToTerms) {
    setError("Please agree to the Terms & Conditions to continue.");
    return;
  }

  setLoading(true);
  try {
    const data = await apiFetch("/api/auth/signup", {
      method: "POST",
      body: { name, email, password, role, agreedToTerms },
    });

    saveSession(data.accessToken, data.user, data.refreshToken);
    router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  return (

<div className="min-h-screen flex items-center justify-center bg-background px-6 py-12 overflow-hidden">
      <div className="relative w-full max-w-sm">

      <div className="absolute -top-16 -left-16 w-44 h-44 bg-primary/50 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-primary/50 rounded-full blur-3xl pointer-events-none" />

      
        <div className="relative z-10 w-full bg-ink/50 rounded-2xl shadow-2xl p-8 backdrop-blur-xl">
          <div className="flex justify-center mb-4">
            <img src="/luvenex-logo-black.png" alt="Luvenex" className="h-12 w-auto" />
          </div>

          <p className="text-lg italic text-white mb-6 text-center">Create your account</p>

         <div className="grid grid-cols-2 gap-4 mb-7">
  {/* Brand Button */}
  <button
    type="button"
    onClick={() => setRole("brand")}
    className={`group relative rounded-2xl p-5 text-center border transition-all duration-300 backdrop-blur-sm ${
      role === "brand"
        ? "bg-primary/90 border-primary shadow-[0_0_25px_rgba(185,8,8,0.4)] scale-[1.02]"
        : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10"
    }`}
  >
    {role === "brand" && (
      <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-white flex items-center justify-center animate-in fade-in zoom-in-75 duration-200">
        <svg className="w-2.5 h-2.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    )}
    
    {/* Real-time Responsive Brand Icon */}
    <div className="flex justify-center mb-3">
      <svg 
        className={`w-7 h-7 transition-all duration-300 ${role === 'brand' ? 'text-white scale-110' : 'text-white/60 group-hover:text-white group-hover:scale-110'}`} 
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </div>
    
    <div className="text-white font-semibold text-sm tracking-wide">Brand</div>
    
  </button>

  {/* Creator Button */}
  <button
    type="button"
    onClick={() => setRole("influencer")}
    className={`group relative rounded-2xl p-5 text-center border transition-all duration-300 backdrop-blur-sm ${
      role === "influencer"
        ? "bg-primary/90 border-primary shadow-[0_0_25px_rgba(185,8,8,0.4)] scale-[1.02]"
        : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10"
    }`}
  >
    {role === "influencer" && (
      <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-white flex items-center justify-center animate-in fade-in zoom-in-75 duration-200">
        <svg className="w-2.5 h-2.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    )}
    
    <div className="flex justify-center mb-3">
      <svg 
        className={`w-7 h-7 transition-all duration-300 ${role === 'influencer' ? 'text-white scale-110' : 'text-white/60 group-hover:text-white group-hover:scale-110'}`} 
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </div>
    
    <div className="text-white font-semibold text-sm tracking-wide">Creator</div>
    
  </button>
</div>

          <form onSubmit={handleSubmit} className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm bg-paper
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm bg-paper
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm bg-paper
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
  <label className="block text-sm font-medium text-white mb-1.5">Password</label>
  <input
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
    minLength={6}
    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm bg-paper
               focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
  />
</div>

<label className="flex items-start gap-2 text-xs text-white/70 pt-1">
  <input
    type="checkbox"
    checked={agreedToTerms}
    onChange={(e) => setAgreedToTerms(e.target.checked)}
    className="mt-0.5 shrink-0"
  />
  <span>
    I agree to the{" "}
    <a href="/terms" target="_blank" className="text-white underline hover:text-primary">
      Terms & Conditions
    </a>
  </span>
</label>

{error && <p className="text-sm text-primary">{error}</p>}

            {error && <p className="text-sm text-primary">{error}</p>}

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="px-16 py-3.5 rounded-xl mt-2 bg-primary/40 text-paper font-semibold text-sm
                           hover:bg-primary-dark transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account..." : "Sign up"}
              </button>
            </div>

            <p className="text-center text-sm text-white italic">
              Already have an account?{" "}
              <a href="/login" className="text-white font-medium hover:underline">
                Log in
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}