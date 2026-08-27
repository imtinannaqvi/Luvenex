"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

/* soft, borderless card — matches the rest of admin */
const softCard =
  "bg-background rounded-3xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-16px_rgba(0,0,0,0.10)]";

export default function AdminReferralsPage() {
  const [topReferrers, setTopReferrers] = useState<any[]>([]);
  const [allReferrals, setAllReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReferrals = () => {
      apiFetch("/api/admin/referrals", { token: getToken()! })
        .then((data) => {
          setTopReferrers(data.topReferrers || []);
          setAllReferrals(data.allReferrals || []);
        })
        .finally(() => setLoading(false));
    };

    loadReferrals();
    const interval = setInterval(loadReferrals, 15000);
    return () => clearInterval(interval);
  }, []);

  const money = (minor: number) => `PKR ${(minor / 100).toLocaleString("en-PK")}`;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-line border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const totalReferred = allReferrals.length;
  // Real numbers from the data the controller actually returns.
  const totalPaidMinor = topReferrers.reduce(
    (sum, r) => sum + (r.referralRewardsEarnedMinor || 0),
    0
  );
  const activeReferrers = topReferrers.length;

  const stats = [
    { label: "Total Referred", value: totalReferred, accent: false },
    { label: "Total Paid Out", value: money(totalPaidMinor), accent: false },
    { label: "Active Referrers", value: activeReferrers, accent: true },
  ];

  return (
    <div className="max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground italic">Referrals Overview</h1>
        <p className="text-sm text-foreground mt-1">
          Monitor influencer referrals, top referrers, and payout balances.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`${softCard} p-5`}>
            <p className={`text-[14px] font-bold italic text-center ${s.accent ? "text-primary" : "text-foreground"}`}>
              {s.label}
            </p>
            <p className={`text-xl font-semibold italic mt-2 text-center tabular-nums ${s.accent ? "text-primary" : "text-foreground"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Top Referrers leaderboard */}
      <div className={`${softCard} overflow-hidden`}>
        <div className="px-5 py-4 flex items-center justify-between border-b border-line">
          <h2 className="text-lg font-bold text-foreground">Top Referrers</h2>
          <span className="text-[11px] font-semibold text-foreground bg-background/[0.04] px-2.5 py-0.5 rounded-full">
            {topReferrers.length} earning
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-foreground text-[11px] bg-background/[0.015] border-b border-line">
                <th className="px-5 py-3 font-semibold">#</th>
                <th className="px-5 py-3 font-semibold">Referrer</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Referral Code</th>
                <th className="px-5 py-3 font-semibold text-right">Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background text-sm text-foreground">
              {topReferrers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-foreground italic">
                    No one has earned referral rewards yet.
                  </td>
                </tr>
              ) : (
                topReferrers.map((r, idx) => (
                  <tr key={r._id} className="hover:bg-background/[0.015] transition-colors">
                    <td className="px-5 py-3.5 font-bold text-muted tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-background text-foreground text-xs font-bold flex items-center justify-center shrink-0">
                          {r.name ? r.name[0].toUpperCase() : "U"}
                        </div>
                        <span>{r.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 capitalize text-muted">{r.role || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs bg-background/[0.04] px-2 py-0.5 rounded-md text-foreground">
                        {r.referralCode || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-primary tabular-nums">
                      {money(r.referralRewardsEarnedMinor || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referral Activity table — Status column removed (no real status in data) */}
      <div className={`${softCard} overflow-hidden`}>
        <div className="px-5 py-4 flex items-center justify-between border-b border-line">
          <h2 className="text-lg font-bold text-foreground">Referral Activity</h2>
          <span className="text-[11px] font-semibold text-foreground bg-background/[0.04] px-2.5 py-0.5 rounded-full">
            {allReferrals.length} total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-foreground text-[11px] bg-background/[0.015] border-b border-line">
                <th className="px-5 py-3 font-semibold">Referred User</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Referred By</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background text-sm text-foreground">
              {allReferrals.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-foreground italic">
                    No referrals found yet.
                  </td>
                </tr>
              ) : (
                allReferrals.map((u) => (
                  <tr key={u._id} className="hover:bg-background/[0.015] transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-background text-foreground text-xs font-bold flex items-center justify-center shrink-0">
                          {u.name ? u.name[0].toUpperCase() : "U"}
                        </div>
                        <span>{u.name}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 capitalize text-muted">{u.role || "—"}</td>

                    <td className="px-5 py-3.5 text-muted">
                      {u.referredBy?.name ? (
                        <span className="font-medium text-foreground">{u.referredBy.name}</span>
                      ) : (
                        <span className="text-foreground">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-muted">
                      {new Date(u.createdAt).toLocaleDateString("en-PK", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}