"use client";

import { useState, useEffect } from "react";
import { getToken, getUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { FiFileText, FiChevronRight, FiUser } from "react-icons/fi";
import Link from "next/link";

export default function DealsListPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [users, setUsers] = useState<any>(null);

  const statuses = [
    "",
    "draft",
    "agreed",
    "funded",
    "in_progress",
    "delivered",
    "approved",
    "completed",
    "auto_released",
    "disputed",
    "cancelled",
    "refunded",
  ];

 const load = async (isInitial = false) => {
  if (isInitial) setLoading(true);
  setError("");
  try {
    const data = await apiFetch("/api/deals", {
      token: getToken()!,
    });
    setDeals(data.deals || []);
  } catch (error: any) {
    setError(error.message);
  } finally {
    if (isInitial) setLoading(false);
  }
};

useEffect(() => {
  setUsers(getUser());
  load(true);
  const interval = setInterval(() => load(false), 15000);
  return () => clearInterval(interval);
}, []);

  const money = (minor: number) => `PKR ${(minor / 100).toLocaleString("en-PK")}`;

  const statusStyleMap: Record<string, { bg: string; dot: string }> = {
    completed: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30", dot: "bg-emerald-500" },
    approved: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30", dot: "bg-emerald-500" },
    auto_released: { bg: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30", dot: "bg-amber-500" },
    in_progress: { bg: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30", dot: "bg-blue-500" },
    funded: { bg: "bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30", dot: "bg-indigo-500" },
    delivered: { bg: "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/30", dot: "bg-purple-500" },
    disputed: { bg: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30", dot: "bg-rose-500" },
    cancelled: { bg: "bg-surface text-foreground/60 border-border-color", dot: "bg-foreground/40" },
    refunded: { bg: "bg-surface text-foreground/60 border-border-color", dot: "bg-foreground/40" },
  };

  const getStatusStyle = (status: string) => {
    return (
      statusStyleMap[status] || {
        bg: "bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30",
        dot: "bg-sky-500",
      }
    );
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ");
  };

  const filtered = statusFilter ? deals.filter((d) => d.status === statusFilter) : deals;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 lg:mb-8 pb-4 lg:pb-5 border-b border-border-color/60">
        {/* Left */}
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 lg:h-6 bg-primary rounded-full" />
          <h1 className="text-xl lg:text-2xl font-bold italic text-foreground tracking-tight">
            Deals
          </h1>
        </div>

        {/* Right */}
        <div className="w-full sm:w-auto sm:ml-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-4 lg:px-5 py-2 lg:py-2.5 rounded-sm border border-border-color bg-background text-foreground text-xs lg:text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer capitalize"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "" ? "All Statuses" : formatStatus(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-primary/10 border border-primary/20 text-primary text-xs lg:text-sm font-medium rounded-xl p-3.5 lg:p-4 mb-5">
          {error}
        </div>
      )}

      {/* Deals List / Table */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border-color rounded-3xl p-8 sm:p-12 lg:p-16 text-center shadow-2xs">
          <div className="w-11 h-11 lg:w-14 lg:h-14 rounded-2xl bg-surface border border-border-color/60 flex items-center justify-center mx-auto mb-3 text-foreground/40">
            <FiFileText size={20} className="lg:hidden" />
            <FiFileText size={24} className="hidden lg:block" />
          </div>
          <p className="text-sm lg:text-base font-semibold italic text-foreground">No deals found</p>
          <p className="text-xs lg:text-sm text-muted mt-1 max-w-xs lg:max-w-sm mx-auto">
            {statusFilter
              ? "Try selecting a different status filter to view other deals."
              : "You don't have any active or past deals yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border-color bg-card shadow-sm">
          <div className="min-w-[640px]">
            {/* Table Header Row */}
            <div className="bg-surface text-foreground px-4 sm:px-6 lg:px-8 py-3.5 lg:py-4 grid grid-cols-12 text-xs sm:text-sm lg:text-base italic font-semibold items-center">
              <div className="col-span-4">Title</div>
              <div className="col-span-3">Party</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            {/* Table Data Rows */}
            <div className="divide-y divide-border-color/60">
              {filtered.map((d) => {
                const otherParty = users?.role === "brand" ? d.influencerId : d.brandId;
                const style = getStatusStyle(d.status);

                return (
                  <Link
                    key={d._id}
                    href={`/app/deals/${d._id}`}
                    className="group grid grid-cols-12 items-center px-4 sm:px-6 lg:px-8 py-4 lg:py-5 text-xs lg:text-sm hover:bg-foreground/[0.03] transition-colors duration-150"
                  >
                    {/* 1. Title */}
                    <div className="col-span-4 min-w-0 pr-3">
                      <p className="font-bold text-foreground  transition truncate text-xs sm:text-sm lg:text-base">
                        {d.title}
                      </p>
                    </div>

                    {/* 2. Name / Party */}
                    <div className="col-span-3 flex items-center gap-2.5 min-w-0 pr-3">
                      <span className="font-semibold text-foreground truncate lg:text-base">
                        {otherParty?.name || "—"}
                      </span>
                    </div>

                    {/* 3. Amount */}
                    <div className="col-span-2 font-bold text-foreground text-xs sm:text-sm lg:text-base">
                      {money(d.priceMinor)}
                    </div>

                    {/* 4. Status */}
                    <div className="col-span-2">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] lg:text-xs font-semibold px-2.5 lg:px-3 py-0.5 lg:py-1 rounded-full border capitalize ${style.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {formatStatus(d.status)}
                      </span>
                    </div>

                    {/* 5. Chevron / Action */}
                    <div className="col-span-1 flex justify-end">
                      <FiChevronRight
                        size={18}
                        className="text-muted group-hover:text-primary group-hover:translate-x-1 transition-all"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}