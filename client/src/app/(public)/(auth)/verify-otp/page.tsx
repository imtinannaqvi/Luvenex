"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const submitCode = async (code: string) => {
    setError("");
    setLoading(true);
    try {
      await apiFetch("/api/auth/verify-otp", {
        method: "POST",
        body: { email, code },
      });
      router.push("/login?verified=true");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    if (digit && index === 5) {
      const fullCode = next.join("");
      if (fullCode.length === 6) submitCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const next = [...digits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || "";
    }
    setDigits(next);

    const lastFilled = Math.min(pasted.length, 6) - 1;
    inputsRef.current[lastFilled]?.focus();

    if (pasted.length === 6) submitCode(pasted);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    try {
     
      await apiFetch("/api/auth/resend-otp", { method: "POST", body: { email } });
      setResendCooldown(45);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="relative w-full max-w-sm">
        <div className="absolute -top-16 -left-16 w-44 h-44 bg-primary/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-primary/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full bg-ink/50 rounded-2xl shadow-2xl p-8 backdrop-blur-xl">
          <div className="flex justify-center mb-4">
            <img src="/luvenex-logo-black.png" alt="Luvenex" className="h-12 w-auto" />
          </div>

          <p className="text-lg italic text-white mb-2 text-center">Verify your email</p>
          <p className="text-sm text-white/70 mb-8 text-center">
            We sent a 6-digit code to <span className="text-white font-medium">{email}</span>
          </p>

          <div className="flex justify-center gap-2 mb-6">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputsRef.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                disabled={loading}
                className="w-11 h-13 text-center text-xl font-semibold rounded-xl border border-line
                           bg-paper focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                           disabled:opacity-60"
              />
            ))}
          </div>

          {loading && <p className="text-center text-sm text-white/70 mb-4">Verifying...</p>}
          {error && (
            <p className="text-sm text-white bg-primary/40 rounded-lg px-3 py-2 mb-4 text-center">
              {error}
            </p>
          )}

          <p className="text-center text-sm text-white italic">
            Didn't get a code?{" "}
            {resendCooldown > 0 ? (
              <span className="text-white/50">Resend in {resendCooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-white font-medium hover:underline"
              >
                Resend code
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
      <VerifyOtpForm />
    </Suspense>
  );
}