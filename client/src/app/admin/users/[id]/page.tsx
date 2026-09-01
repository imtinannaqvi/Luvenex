"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { getToken } from "@/lib/auth";
import { toast } from "react-toastify";

/* soft card shell — matches dashboard + users list */
const softCard =
  "bg-card rounded-3xl border border-border-color shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-16px_rgba(0,0,0,0.10)]";

const Spinner = ({ className = "" }: { className?: string }) => (
  <div
    className={`border-2 border-white border-t-primary rounded-full animate-spin ${className}`}
    role="status"
    aria-label="Loading"
  />
);

const statusDot = (status: string) =>
  status === "active" ? "bg-emerald-500"
  : status === "pending" ? "bg-amber-500"
  : status === "suspended" ? "bg-orange-500"
  : status === "banned" ? "bg-rose-500" : "bg-muted";

const statusPill = (status: string) => {
  const styles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
    pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
    suspended: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/30",
    banned: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize tracking-wide ${styles[status] || "bg-surface text-muted border-border-color"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${statusDot(status)}`} />
      {status}
    </span>
  );
};

export default function AdminuserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/api/admin/users/${userId}`, {
        token: getToken()!,
      });
      setUser(data.user);
      setActivity(data.activity);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [userId]);

  const updateStatus = async (status: string) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/admin/users/${userId}/status`, {
        method: "POST",
        token: getToken()!,
        body: { status },
      });
      setUser((prev: any) => ({ ...prev, status }));
    } catch (err: any) {
      toast(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const money = (minor: number) => `PKR ${(minor / 100).toLocaleString("en-PK")}`;

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner className="w-6 h-6" />
      </div>
    );

  if (error)
    return (
      <div className="max-w-md mx-auto mt-16">
        <div className="bg-primary/[0.06] border border-primary/20 text-primary text-sm font-medium rounded-2xl px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );

  if (!user) return null;

  const initial = user.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="max-w-6xl  px-4 sm:px-6 py-8">
      <button
        onClick={() => router.push("/admin/users")}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition mb-5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to users
      </button>

      {/* ── ONE unified card ── */}
      <div className={`${softCard} overflow-hidden`}>
        {/* Header section (with faint red wash) */}
        <div className="relative p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-transparent" />
          <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-surface text-foreground flex items-center justify-center text-xl font-bold shrink-0">
                {initial}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-foreground truncate">{user.name}</h1>
                <p className="text-sm text-muted truncate">{user.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-surface border border-border-color text-foreground capitalize">
                    {user.role}
                  </span>
                  {statusPill(user.status)}
                  <span className="text-[11px] text-muted">
                    Joined {new Date(user.createdAt).toLocaleDateString("en-PK", { dateStyle: "medium" })}
                  </span>
                </div>
              </div>
            </div>

            {user.role !== "admin" && (
              <div className="flex gap-2 shrink-0">
                {user.status !== "active" && (
                  <button
                    disabled={actionLoading}
                    onClick={() => updateStatus("active")}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-card border border-border-color hover:bg-surface text-foreground transition disabled:opacity-50"
                  >
                    Activate
                  </button>
                )}
                {user.status !== "suspended" && (
                  <button
                    disabled={actionLoading}
                    onClick={() => updateStatus("suspended")}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-card border border-border-color hover:bg-surface text-muted hover:text-foreground transition disabled:opacity-50"
                  >
                    Suspend
                  </button>
                )}
                {user.status !== "banned" && (
                  <button
                    disabled={actionLoading}
                    onClick={() => {
                      if (confirm(`Ban ${user.name}? This is a serious action.`)) {
                        updateStatus("banned");
                      }
                    }}
                    className="text-xs font-semibold px-6 py-2 rounded-xl bg-primary text-white hover:bg-primary-dark transition disabled:opacity-50"
                  >
                    Ban
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stat strip — 3 inline cells split by dividers */}
        <div className="grid grid-cols-3 border-t border-border-color divide-x divide-border-color">
          <div className="px-5 sm:px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Total deals</p>
            <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{activity?.dealCount ?? 0}</p>
          </div>
          <div className="px-5 sm:px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">KYC status</p>
            <p className="text-sm font-semibold text-foreground mt-2 capitalize truncate">
              {user.kyc?.status?.replace(/_/g, " ") || "Not submitted"}
            </p>
            {user.kyc?.fullName && (
              <p className="text-[11px] text-muted mt-0.5 truncate">On file: {user.kyc.fullName}</p>
            )}
          </div>
          <div className="px-5 sm:px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Account role</p>
            <p className="text-sm font-semibold text-foreground mt-2 capitalize">{user.role}</p>
          </div>
        </div>

        {/* Recent payouts section */}
        <div className="border-t border-border-color p-5 sm:p-6">
          <h2 className="text-sm font-bold text-foreground mb-3">Recent payouts</h2>
          {activity?.recentPayouts?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead>
                  <tr className="text-muted border-b border-border-color text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 pr-4 font-semibold">Amount</th>
                    <th className="py-2.5 pr-4 font-semibold">Method</th>
                    <th className="py-2.5 pr-4 font-semibold">Status</th>
                    <th className="py-2.5 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color text-foreground">
                  {activity.recentPayouts.map((p: any) => (
                    <tr key={p._id}>
                      <td className="py-2.5 pr-4 font-semibold">{money(p.amountMinor)}</td>
                      <td className="py-2.5 pr-4 capitalize text-muted">{p.method}</td>
                      <td className="py-2.5 pr-4">{statusPill(p.status)}</td>
                      <td className="py-2.5 text-muted">{new Date(p.createdAt).toLocaleDateString("en-PK", { dateStyle: "medium" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted italic">No payouts yet.</p>
          )}
        </div>

        {/* Recent ledger section */}
        <div className="border-t border-border-color p-5 sm:p-6">
          <h2 className="text-sm font-bold text-foreground mb-3">Recent ledger entries</h2>
          {activity?.recentLedger?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead>
                  <tr className="text-muted border-b border-border-color text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 pr-4 font-semibold">Type</th>
                    <th className="py-2.5 pr-4 font-semibold">Amount</th>
                    <th className="py-2.5 pr-4 font-semibold">Description</th>
                    <th className="py-2.5 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color text-foreground">
                  {activity.recentLedger.map((l: any) => (
                    <tr key={l._id}>
                      <td className="py-2.5 pr-4 capitalize font-medium">{l.type}</td>
                      <td className="py-2.5 pr-4 font-semibold">{money(l.amountMinor)}</td>
                      <td className="py-2.5 pr-4 text-muted">{l.description}</td>
                      <td className="py-2.5 text-muted">{new Date(l.createdAt).toLocaleDateString("en-PK", { dateStyle: "medium" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted italic">No ledger entries yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}