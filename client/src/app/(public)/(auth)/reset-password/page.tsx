"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { FiEye, FiEyeOff } from "react-icons/fi";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: { email, code, newPassword },
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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

          {success ? (
            <div className="text-center">
              <p className="text-lg italic text-white mb-2">Password reset!</p>
              <p className="text-sm text-white/70">Redirecting you to log in...</p>
            </div>
          ) : (
            <>
              <p className="text-lg italic text-white mb-2 text-center">Reset your password</p>
              <p className="text-sm text-white/70 mb-7 text-center">
                Enter the code we sent you and choose a new password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm bg-background
                               focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Reset code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    maxLength={6}
                    inputMode="numeric"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm bg-background
                               focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary tracking-widest"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">New password</label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-3.5 py-2.5 pr-11 rounded-xl border border-line text-sm bg-background
                                 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      aria-label={showNew ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition"
                    >
                      {showNew ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-3.5 py-2.5 pr-11 rounded-xl border border-line text-sm bg-background
                                 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition"
                    >
                      {showConfirm ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-white bg-primary/40 rounded-lg px-3 py-2">{error}</p>
                )}

                <div className="flex justify-center pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-16 py-3.5 rounded-xl bg-primary/40 text-paper font-semibold text-sm
                               hover:bg-primary-dark transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Resetting..." : "Reset password"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}