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
    apiFetch("/api/admin/referrals", { token: getToken()! })
      .then((data) => {
        setTopReferrers(data.topReferrers || []);
        setAllReferrals(data.allReferrals || []);
      })
      .finally(() => setLoading(false));
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
  const totalPaid = 0;
  const totalPending = 0;

  const stats = [
    { label: "Total Referred", value: totalReferred, accent: false },
    { label: "Total Paid", value: `Rs ${totalPaid}`, accent: false },
    { label: "Total Pending", value: `Rs ${totalPending}`, accent: true },
  ];

  return (
    <div className="max-w-7xl  px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div>
       
        <h1 className="text-2xl font-bold text-foreground italic">Referrals Overview</h1>
        <p className="text-sm text-foreground mt-1">Monitor influencer referrals, assignees, and payout balances.</p>
      </div>

      {/* Stat cards — flat, no per-card top bars */}
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

      {/* Activity table */}
      <div className={`${softCard} overflow-hidden`}>
        <div className="px-5 py-4 flex items-center justify-between border-b border-line">
          <h2 className="text-lg font-bold text-foreground ">Referral Activity</h2>
          <span className="text-[11px] font-semibold text-foreground bg-background/[0.04] px-2.5 py-0.5 rounded-full">
            {allReferrals.length} total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-foreground text-[11px]  bg-background/[0.015] border-b border-line">
                <th className="px-5 py-3 font-semibold">Influencer</th>
                <th className="px-5 py-3 font-semibold">Referrer</th>
                <th className="px-5 py-3 font-semibold">Status</th>
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
                allReferrals.map((u, idx) => {
                  const approved = idx % 2 === 0; // TODO: replace with real u.status
                  return (
                    <tr key={u._id} className="hover:bg-background/[0.015] transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-background text-foreground text-xs font-bold flex items-center justify-center shrink-0">
                            {u.name ? u.name[0].toUpperCase() : "I"}
                          </div>
                          <span>{u.name}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-muted">
                        {u.referredBy?.name ? (
                          <span className="font-medium text-foreground">{u.referredBy.name}</span>
                        ) : (
                          <span className="text-foreground">—</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            approved
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${approved ? "bg-emerald-500" : "bg-amber-500"}`} />
                          {approved ? "Approved" : "Pending"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-muted">
                        {new Date(u.createdAt).toLocaleDateString("en-PK", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}