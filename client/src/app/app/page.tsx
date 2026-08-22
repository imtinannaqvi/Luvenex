"use client";

import { useState, useEffect } from "react";
import { getToken, getUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import {
  ResponsiveContainer,
  Line,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import Link from "next/link";

export default function AppDashboard() {
  const [user, setUser] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [timeLine, setTimeLine] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    setUser(u);

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const profileEndpoint = u?.role === "brand" ? "/api/brands/me" : "/api/influencers/me";

        const [dealsData, walletData, notifData, timeLineData, profileData] =
          await Promise.all([
            apiFetch("/api/deals", { token: getToken()! }),
            apiFetch("/api/wallet", { token: getToken()! }),
            apiFetch("/api/notifications", { token: getToken()! }),
            apiFetch("/api/deals/stats/timeline", { token: getToken()! }),
            apiFetch(profileEndpoint, { token: getToken()! }).catch(() => null),
          ]);
        setDeals(dealsData.deals || []);
        setWallet(walletData.wallet);
        setNotifications((notifData.notifications || []).slice(0, 5));
        setTimeLine(timeLineData.timeline || []);
        setProfile(profileData?.profile || null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const money = (minor: number) =>
    `PKR ${(minor / 100).toLocaleString("en-PK")}`;
  const isBrand = user?.role === "brand";

  const activeDeals = deals.filter((d) =>
    ["agreed", "funded", "in_progress", "delivered"].includes(d.status)
  );

  const totalVolumePKR = timeLine.reduce(
    (acc, curr) => acc + curr.moneyMinor / 100,
    0
  );

  const chartData = timeLine.map((t) => ({
    month: new Date(t.month + "-01").toLocaleDateString("en-US", {
      month: "short",
    }),
    moneyPKR: t.moneyMinor / 100,
    deals: t.dealVolume,
  }));

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      agreed:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30",
      funded:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30",
      in_progress: "bg-surface text-foreground border-border-color",
      delivered: "bg-foreground text-background border-foreground",
      completed: "bg-foreground text-background border-foreground",
      cancelled:
        "bg-red-100 text-red-800 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",
    };
    return map[status] || "bg-surface text-foreground border-border-color";
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300 p-4 rounded-2xl text-sm font-medium mx-4 sm:mx-6 lg:mx-8">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 pb-8 text-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground italic">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
        </div>

        {profile?.handle ? (
          <Link
            href={isBrand ? `/brands/${profile.handle}` : `/creator/${profile.handle}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 rounded-sm bg-surface border border-border-color text-xs sm:text-sm font-semibold text-foreground hover:border-red-400/60 hover:text-red-500 transition-all duration-200 shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Public Profile
          </Link>
        ) : (
          <Link
            href="/app/profile"
            className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-2 rounded-sm bg-surface border  border-border-color text-xs sm:text-sm font-semibold text-zinc-500 hover:border-red-400/60 hover:text-red-500 transition-all duration-200 shrink-0"
          >
            Set Profile →
          </Link>
        )}
      </div>

      {/* Stats — breakpoints bumped up one step to allow for the sidebar width */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <div className="bg-background border border-border-color rounded-sm text-center p-3 sm:p-4">
          <p className="text-[13px] sm:text-[14px] font-semibold text-foreground">
            Active Deals
          </p>
          <div className="text-xl sm:text-2xl font-bold italic text-foreground mt-1.5">
            {activeDeals.length}
          </div>
          <p className="text-[12px] sm:text-[13px] text-zinc-400 mt-1">
            In progress & pending
          </p>
        </div>

        <div className="bg-background border border-border-color rounded-sm text-center p-3 sm:p-4">
          <p className="text-[13px] sm:text-[14px] font-semibold text-foreground">
            Wallet Balance
          </p>
          <div className="text-lg sm:text-2xl font-bold italic text-foreground mt-1.5 break-words">
            {money(wallet?.balanceMinor || 0)}
          </div>
          <p className="text-[12px] sm:text-[13px] text-zinc-400 mt-1">
            Available for payout
          </p>
        </div>

        {wallet?.escrowMinor > 0 && (
          <div className="bg-background border border-border-color rounded-sm text-center p-3 sm:p-4">
            <p className="text-[13px] font-semibold text-red-600">InEscrow</p>
            <div className="text-lg sm:text-2xl font-bold italic text-foreground mt-1.5 break-words">
              {money(wallet.escrowMinor)}
            </div>
            <p className="text-[12px] sm:text-[13px] text-zinc-400 mt-1">
              Held until delivery
            </p>
          </div>
        )}

        <div className="bg-background border border-border-color rounded-sm text-center p-3 sm:p-4 col-span-2 md:col-span-1">
          <p className="text-[13px] font-semibold text-foreground">
            12M {isBrand ? "Spent" : "Earned"}
          </p>
          <div className="text-lg sm:text-2xl font-bold italic text-foreground mt-1.5 break-words">
            PKR {totalVolumePKR.toLocaleString()}
          </div>
          <p className="text-[12px] sm:text-[14px] text-zinc-400 mt-1">
            Across completed deals
          </p>
        </div>
      </div>

      {/* ── Earnings/Spending Chart ── */}
      <div className="bg-background border border-border-color rounded-sm p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Header with Live Overview Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                {isBrand ? "Spending" : "Earnings"} over time
              </h2>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Performance tracking over the last 12 months
            </p>
          </div>

          {/* Metric Badge */}
          <div className="self-start sm:self-auto px-3.5 py-1.5 rounded-sm bg-surface border border-border-color flex items-center gap-3">
            <div>
              <span className="text-[10px] sm:text-xs font-medium text-zinc-500 block italic">
                Total {isBrand ? "Spent" : "Earned"}
              </span>
              <p className="text-xs sm:text-sm font-black text-foreground">
                PKR{" "}
                {chartData
                  .reduce((acc, curr) => acc + (curr.moneyPKR || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="w-full h-[240px] sm:h-[320px] lg:h-[360px] relative z-10 text-foreground">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 15, right: 8, left: -22, bottom: 0 }}
            >
              <defs>
                {/* Gradient Area Fill */}
                <linearGradient id="glowRedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="60%" stopColor="#ef4444" stopOpacity={0.05} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 4"
                stroke="currentColor"
                strokeOpacity={0.12}
                vertical={false}
              />

              <XAxis
                dataKey="month"
                stroke="#71717a"
                fontSize={11}
                fontWeight={500}
                tickLine={false}
                axisLine={false}
                dy={8}
                interval="preserveStartEnd"
                minTickGap={8}
              />
              <YAxis
                yAxisId="left"
                stroke="#71717a"
                fontSize={11}
                fontWeight={500}
                tickLine={false}
                axisLine={false}
                width={44}
                tickFormatter={(v) =>
                  `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                }
              />

              <Tooltip
                cursor={{
                  stroke: "#ef4444",
                  strokeWidth: 1.5,
                  strokeDasharray: "4 4",
                }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const index = chartData.findIndex((d) => d.month === label);
                  const current = payload[0].payload;
                  const prev = index > 0 ? chartData[index - 1] : null;
                  const diff = prev ? current.moneyPKR - prev.moneyPKR : 0;
                  const isUp = diff >= 0;

                  return (
                    <div className="bg-background border border-border-color rounded-2xl p-3.5 text-xs shadow-xl text-foreground space-y-1.5 min-w-[160px] max-w-[80vw]">
                      <div className="flex items-center justify-between border-b border-border-color pb-1.5">
                        <span className="font-bold text-foreground">{label}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            isUp
                              ? "bg-surface text-foreground"
                              : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"
                          }`}
                        >
                          {isUp
                            ? `+${diff.toLocaleString()}`
                            : `${diff.toLocaleString()}`}
                        </span>
                      </div>

                      <div className="pt-0.5">
                        <span className="text-[10px] text-zinc-500 block font-medium">
                          Amount
                        </span>
                        <p className="font-extrabold text-sm text-foreground">
                          PKR {current.moneyPKR.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-border-color text-[11px] text-foreground">
                        <span>Completed Deals:</span>
                        <span className="font-bold text-foreground">
                          {current.deals}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />

              {/* Gradient Area */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="moneyPKR"
                fill="url(#glowRedGradient)"
                stroke="none"
              />

              {/* Main Line */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="moneyPKR"
                stroke="#dc2626"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#ffffff", stroke: "#dc2626", strokeWidth: 2 }}
                activeDot={{
                  r: 7,
                  fill: "#dc2626",
                  stroke: "#ffffff",
                  strokeWidth: 2.5,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Two Column Layout — single column until lg to allow for sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Recent Deals */}
        <div className="bg-background border border-border-color rounded-sm p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-foreground">
                  Recent Deals
                </h2>
              </div>
              <Link
                href="/app/deals"
                className="text-xs sm:text-sm font-semibold text-foreground hover:text-red-500 transition"
              >
                View all →
              </Link>
            </div>

            {deals.length === 0 ? (
              <div className="p-8 text-center bg-surface border border-border-color rounded-2xl">
                <p className="text-xs sm:text-sm text-zinc-500">
                  No active or historical deals yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {deals.slice(0, 5).map((d) => (
                  <Link
                    key={d._id}
                    href={`/app/deals/${d._id}`}
                    className="flex items-center justify-between p-3.5 rounded-sm bg-surface border border-border-color hover:border-red-400/60 hover:bg-red-500/5 transition-all duration-200 group gap-2"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-red-600 transition truncate">
                        {d.title}
                      </p>
                      <p className="text-[11px] sm:text-xs font-semibold text-zinc-500 mt-0.5">
                        {money(d.priceMinor)}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-sm capitalize border shrink-0 ${getStatusBadge(
                        d.status
                      )}`}
                    >
                      {d.status.replace("_", " ")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-background border border-border-color rounded-sm p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-foreground">
                  Recent Activity
                </h2>
              </div>
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-sm bg-surface border border-border-color text-zinc-500">
                Latest {notifications.length}
              </span>
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center bg-surface border border-border-color rounded-2xl">
                <p className="text-xs sm:text-sm text-zinc-500">
                  No recent notifications.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    className="p-3.5 rounded-sm bg-surface border border-border-color hover:border-red-400/60 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                        {n.title}
                      </p>
                      <span className="text-[10px] sm:text-xs font-medium text-zinc-400 shrink-0">
                        {new Date(n.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-zinc-500 line-clamp-2 mt-1 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}