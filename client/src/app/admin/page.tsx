"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { toast } from "react-toastify";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Line,
  Area,
} from "recharts";

/* ── palette ──
   INK / GRID use currentColor so they follow text-foreground and flip per theme.
   RED and AXIS (mid-gray) read fine in both light and dark. */
const INK = "currentColor";
const RED = "#B90808";
const GRID = "currentColor";
const AXIS = "#9A9A9E";
const DONUT = [INK, RED, "#9CA3AF"];

/* soft card shell — rounded, hairline border, layered shadow */
const softCard =
  "bg-card rounded-3xl border border-border-color shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-16px_rgba(0,0,0,0.10)]";

function StatCard({
  value,
  label,
  alert = false,
  loading = false,
}: {
  value?: string | number;
  label: string;
  alert?: boolean;
  loading?: boolean;
}) {
  return (
    <div className={`${softCard} px-4 py-3.5 w-full`}>
      {loading ? (
        <div className="animate-pulse">
          <div className="h-5 w-14 bg-surface rounded-lg" />
          <div className="h-3 w-24 bg-surface rounded-lg mt-2" />
        </div>
      ) : (
        <>
          <div className={`text-lg sm:text-xl font-bold tabular-nums ${alert ? "text-primary" : "text-foreground"}`}>
            {value}
          </div>
          <div className="text-[11px] leading-snug text-muted mt-1">{label}</div>
        </>
      )}
    </div>
  );
}

function ChartCard({
  title,
  loading,
  children,
  className = "",
  height = "h-56",
}: {
  title: string;
  loading: boolean;
  children: React.ReactNode;
  className?: string;
  height?: string;
}) {
  return (
    <div className={`${softCard} p-5 ${className}`}>
      {title && <h3 className="text-sm font-bold text-foreground mb-3">{title}</h3>}
      {loading ? (
        <div className={`${height} rounded-2xl bg-surface animate-pulse`} />
      ) : (
        <div className={height}>{children}</div>
      )}
    </div>
  );
}

/* unified theme-aware tooltip */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card rounded-2xl px-3.5 py-2.5 shadow-xl border border-border-color">
      {label && <p className="text-[11px] font-bold text-foreground mb-1.5">{label}</p>}
      <div className="space-y-1">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
            <span className="text-foreground/55">{p.name}:</span>
            <span className="font-semibold text-foreground tabular-nums">
              {p.dataKey === "revenuePKR"
                ? `PKR ${Number(p.value).toLocaleString()}`
                : p.value?.toLocaleString?.() ?? p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    const startTime = Date.now();
    const minDuration = 1500;

    Promise.all([
      apiFetch("/api/admin/stats", { token: getToken()! }),
      apiFetch("/api/admin/stats/timeline", { token: getToken()! }),
    ])
      .then(([statsData, timelineData]) => {
        const delay = Math.max(minDuration - (Date.now() - startTime), 0);
        setTimeout(() => {
          if (cancelled) return;
          setStats(statsData.stats);
          setTimeline(timelineData.timeline || []);
        }, delay);
      })
      .catch((error) => {
        const delay = Math.max(minDuration - (Date.now() - startTime), 0);
        setTimeout(() => {
          if (cancelled) return;
          toast.error(error.message || "Failed to load dashboard stats");
        }, delay);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loading = !stats;

  const usersData = stats
    ? [
        { name: "Brands", value: stats.users.brands },
        { name: "Influencers", value: stats.users.influencers },
      ]
    : [];

  const dealsData = stats
    ? [
        { name: "Active", value: stats.deals.active },
        { name: "Completed", value: stats.deals.completed },
        {
          name: "Other",
          value: Math.max(stats.deals.total - stats.deals.active - stats.deals.completed, 0),
        },
      ]
    : [];

  const queuesData = stats
    ? [
        { name: "KYC", value: stats.queues.pendingKyc },
        { name: "Payouts", value: stats.queues.pendingPayouts },
        { name: "Flagged msgs", value: stats.queues.flaggedMessages },
        { name: "Service reqs", value: stats.queues.pendingServiceRequests },
      ]
    : [];

  const growthData = timeline.map((t) => ({
    month: new Date(t.month + "-01").toLocaleDateString("en-US", { month: "short" }),
    "New users": t.newUsers,
    "New deals": t.newDeals,
    revenuePKR: t.revenueMinor / 100,
  }));

  const nf = (n: number) => n.toLocaleString("en-PK");
  const totalUsers = growthData.reduce((s, d: any) => s + (d["New users"] || 0), 0);
  const totalDeals = growthData.reduce((s, d: any) => s + (d["New deals"] || 0), 0);
  const totalRevenue = growthData.reduce((s, d: any) => s + (d.revenuePKR || 0), 0);
  const totalDealsPie = dealsData.reduce((sum, d: any) => sum + d.value, 0);

  return (
    <div className="text-foreground">
      <h1 className="text-xl sm:text-2xl font-bold italic text-foreground mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          loading={loading}
          value={stats?.users.total}
          label={`Total users (${stats?.users.brands} brands, ${stats?.users.influencers} influencers)`}
        />
        <StatCard
          loading={loading}
          value={stats?.deals.total}
          label={`Total deals (${stats?.deals.active} active, ${stats?.deals.completed} completed)`}
        />
        <StatCard
          loading={loading}
          value={stats && `PKR ${(stats.commissionEarnedMinor / 100).toLocaleString("en-PK")}`}
          label="Commission earned"
        />
        <StatCard loading={loading} value={stats?.marketplace.gigs} label="Gigs listed" />
        <StatCard loading={loading} value={stats?.marketplace.campaigns} label="Campaigns posted" />
      </div>

      <h2 className="text-base font-bold text-foreground mt-8 mb-3">Needs attention</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard loading={loading} value={stats?.queues.pendingKyc} label="Pending KYC" alert />
        <StatCard loading={loading} value={stats?.queues.pendingPayouts} label="Pending payouts" alert />
        <StatCard loading={loading} value={stats?.queues.flaggedMessages} label="Flagged messages" alert />
        <StatCard loading={loading} value={stats?.queues.pendingServiceRequests} label="Pending service requests" alert />
      </div>

      {/* ════════════════ ANALYTICS — soft bento ════════════════ */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[17px] font-extrabold  text-primary">Analytics</span>
        </div>

        {/* Bento grid: hero(2) + donut(1) on top, users(1) + queues(2) below */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-min">
          {/* ── Hero growth (spans 2 cols) ── */}
<div className={`${softCard} p-4 sm:p-5 lg:col-span-2 relative overflow-hidden`}>
  {/* faint red wash anchoring the hero */}
  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-transparent" />

  <div className="relative">
    <div className="mb-4">
      <h2 className="text-sm font-bold text-foreground">Platform growth</h2>
      <p className="text-[11px] text-muted mt-0.5">
        New users, deals, and revenue — last 12 months
      </p>

      {/* pills: full-width 3-up on mobile, inline on larger */}
      <div className="mt-3 grid grid-cols-3 gap-2 sm:flex sm:mt-3">



      </div>
    </div>

    {loading ? (
      <div className="h-56 sm:h-72 rounded-2xl bg-surface animate-pulse" />
    ) : (
      <div className="h-56 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={growthData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={RED} stopOpacity={0.2} />
                <stop offset="95%" stopColor={RED} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} strokeOpacity={0.1} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: AXIS }}
              axisLine={false}
              tickLine={false}
              dy={4}
              minTickGap={14}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: AXIS }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={24}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: AXIS }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v / 1000}k`}
              width={30}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(185,8,8,0.04)" }} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
              iconType="circle"
              formatter={(value) => <span className="text-foreground text-[11px]">{value}</span>}
            />
            <Bar yAxisId="left" dataKey="New users" fill={INK} radius={[4, 4, 0, 0]} barSize={10} />
            <Bar yAxisId="left" dataKey="New deals" fill="#9CA3AF" radius={[4, 4, 0, 0]} barSize={10} />
            <Area yAxisId="right" type="monotone" dataKey="revenuePKR" fill="url(#revenueGradient)" stroke="none" legendType="none" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenuePKR"
              name="Revenue (PKR)"
              stroke={RED}
              strokeWidth={2.5}
              dot={{ r: 2, fill: RED, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: RED, strokeWidth: 2, stroke: "#fff" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
</div>

          {/* ── Deals donut (tall, spans full height of hero row) ── */}
          <ChartCard title="Deals by status" loading={loading} height="h-72">
            <div className="relative w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11 }}
                    iconType="circle"
                    formatter={(value) => <span className="text-foreground text-[11px]">{value}</span>}
                  />
                  <Pie
                    data={dealsData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {dealsData.map((_, i) => (
                      <Cell key={i} fill={DONUT[i % DONUT.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-5">
                <span className="text-2xl font-bold text-foreground tabular-nums">{totalDealsPie}</span>
                <span className="text-[9px] text-muted uppercase tracking-wide">Total deals</span>
              </div>
            </div>
          </ChartCard>

          {/* ── Users by type (narrow) ── */}
          <ChartCard title="Users by type" loading={loading} height="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usersData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} strokeOpacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(150,150,150,0.08)" }} />
                <Bar dataKey="value" name="Users" radius={[6, 6, 0, 0]} barSize={40}>
                  {usersData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? INK : RED} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* ── Queues (wide, spans 2 cols) ── */}
          <ChartCard title="Queues needing attention" loading={loading} className="lg:col-span-2" height="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={queuesData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} strokeOpacity={0.1} />
                <XAxis type="number" tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: INK }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(185,8,8,0.05)" }} />
                <Bar dataKey="value" name="Pending" fill={RED} radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </section>
    </div>
  );
}