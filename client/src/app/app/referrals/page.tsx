"use client";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function ReferralPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      toast.error("Please sign in to view your referrals.");
      setLoading(false);
      return;
    }

    apiFetch("/api/auth/referrals/me", { token })
      .then((res) => {
        if (res && typeof res === "object") setData(res);
      })
      .catch((error) => toast.error(error?.message ?? "Something went wrong"))
      .finally(() => setLoading(false));
  }, []);

  const money = (minor: number) => `PKR ${(minor / 100).toLocaleString("en-PK")}`;

  const copyLink = () => {
    if (!data?.referralLink) return;
    navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-red-600 border-2 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12 bg-card border border-border-color rounded-2xl shadow-sm">
        <p className="text-sm text-zinc-400">Unable to load referral info. Please try again later.</p>
      </div>
    );
  }

  const referredUsers = data.referredUsers ?? [];

  return (
    <div className="max-w-6xl space-y-6 pb-12 text-foreground">
      {/* Header Section */}
      <div className="flex gap-4 px-1">
        <div className="w-12 h-12 rounded-xl bg-[#B90808] border border-red-500/30 flex items-center justify-center text-white shrink-0 shadow-xs">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 12v10H4V12" />
            <path d="M2 7h20v5H2z" />
            <path d="M12 22V7" />
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl sm:text-xl font-bold text-foreground italic">Refer & Earn</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Invite creators to Luvenex and earn PKR 500 when they complete their first deal.
          </p>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-card border border-border-color rounded-xl p-6 sm:p-8 shadow-sm">
        <p className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase mb-5">How It Works</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {/* Step 1 */}
          <div className="flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-lg bg-[#B90808]/10 text-[#B90808] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Share your link</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Send your unique referral link to sellers, creators, or brands looking to collaborate.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-lg bg-[#B90808]/10 text-[#B90808] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">They sign up & deal</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                When they register using your link and complete their first deal, they become your referral.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-lg bg-[#B90808]/10 text-[#B90808] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">You earn rewards</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                You receive PKR 500 directly in rewards every time a referral completes their deal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link Box */}
      <div className="bg-gradient-to-r from-[#B90808] to-[#8a0606] rounded-xl p-5 sm:p-6 text-white shadow-md space-y-3">
        <div>
          <h2 className="text-base font-bold text-white">Your Referral Link</h2>
          <p className="text-xs text-red-100 mt-0.5">
            Share this link anywhere — WhatsApp, email, or social media.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md border border-white/20 rounded-xl p-1.5 pl-4 focus-within:border-white/50 transition-all">
          <input
            readOnly
            value={data.referralLink ?? ""}
            className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-red-200 outline-none select-all font-mono py-1.5"
          />
          <button
            onClick={copyLink}
            className="px-4 py-2 rounded-lg bg-white hover:bg-red-50 text-[#B90808] text-xs font-bold transition shrink-0 shadow-sm flex items-center gap-1.5 active:scale-95 disabled:opacity-80 cursor-pointer"
            disabled={copied}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-[#B90808]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Earned */}
        <div className="bg-card border border-border-color rounded-xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#B90808]/10 text-[#B90808] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-400">Total Earned</p>
            <p className="text-lg font-bold text-foreground mt-0.5 italic">{money(data.rewardsEarnedMinor ?? 0)}</p>
          </div>
        </div>

        {/* Total Referrals */}
        <div className="bg-card border border-border-color rounded-xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#B90808]/10 text-[#B90808] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-400">Total Referrals</p>
            <p className="text-lg font-bold text-foreground mt-0.5 italic">{data.totalReferred ?? 0}</p>
          </div>
        </div>

        {/* Referral Code */}
        <div className="bg-card border border-border-color rounded-xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#B90808]/10 text-[#B90808] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400">Referral Code</p>
            <p className="text-base font-bold text-foreground mt-0.5 tracking-wider font-mono bg-surface px-2.5 py-0.5 rounded-md border border-border-color inline-block">
              {data.referralCode ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {/* People Referred Section */}
      <div className="bg-card border border-border-color rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground">People you've referred</h2>
          <span className="text-xs text-zinc-400 font-medium">Total: {referredUsers.length}</span>
        </div>

        {referredUsers.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border-color rounded-xl bg-surface">
            <p className="text-xs text-zinc-400">
              No one yet — share your link to start earning.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-color border border-border-color rounded-xl overflow-hidden">
            {referredUsers.map((u: any) => (
              <div key={u._id} className="flex items-center justify-between py-3 px-4 hover:bg-surface transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface border border-border-color text-[#B90808] font-bold text-xs flex items-center justify-center uppercase">
                    {u.name ? u.name[0] : "U"}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-foreground">{u.name}</p>
                    <p className="text-[10px] text-zinc-400 capitalize">{u.role}</p>
                  </div>
                </div>
                <span className="text-xs text-zinc-400 font-mono">
                  {new Date(u.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}