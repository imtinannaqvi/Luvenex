"use client";
import { useState,  } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) =>{

        e.preventDefault();
        setError('')
        setLoading(true)

        try {
            await apiFetch('/api/auth/forgot-password', {
                method:"POST",
                body:{ email}

            });
            setSubmitted(true);

        } catch (error: any) {
            setError(error.message)
            
        }finally{
            setLoading(false)
        }


    }
    return(

    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
  <div className="relative w-full max-w-sm">

    <div className="absolute -top-16 -left-16 w-44 h-44 bg-primary/50 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-primary/50 rounded-full blur-3xl pointer-events-none" />

    <div className="relative z-10 w-full bg-background rounded-2xl shadow-2xl p-8 backdrop-blur-xl">
      <div className="flex justify-center mb-4">
        <img
          src="/luvenex-logo-black.png"
          alt="Luvenex"
          className="h-12 w-auto "
        />
      </div>


     {!submitted ? (
            <>
              <p className="text-lg italic text-foreground mb-2 text-center">Forgot your password?</p>
              <p className="text-sm text-foreground mb-7 text-center">
                Enter your email and we&apos;ll send you a reset code.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium te mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm bg-background
                               focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                {error && (
                  <p className="text-sm text-white bg-primary/40 rounded-lg px-3 py-2">{error}</p>
                )}

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-16 py-3.5 rounded-xl bg-primary/40 text-paper font-semibold text-sm
                               hover:bg-primary-dark transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending..." : "Send reset code"}
                  </button>
                </div>

                <p className="text-center text-sm text-white italic">
                  Remembered it?{" "}
                  <a href="/login" className="text-white font-medium hover:underline">
                    Log in
                  </a>
                </p>
              </form>
            </>
          ) : (
            <div className="text-center">
              <p className="text-lg italic text-white mb-2">Check your email</p>
              <p className="text-sm text-white/70 mb-7">
                If an account exists for <span className="text-white font-medium">{email}</span>,
                a reset code has been sent.
              </p>
              <button
                onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
                className="px-16 py-3.5 rounded-xl bg-primary/40 text-paper font-semibold text-sm
                           hover:bg-primary-dark transition"
              >
                Enter reset code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}