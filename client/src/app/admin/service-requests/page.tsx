"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { toast } from "react-toastify";
import { FiX, FiInbox } from "react-icons/fi";

const Spinner = ({ className = "" }: { className?: string }) => (
  <div
    className={`border-2 border-line border-t-ink rounded-full animate-spin ${className}`}
    role="status"
    aria-label="Loading"
  />
);

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  matched: "bg-green-500/10 text-green-400 border-green-500/25",
  closed: "bg-white/5 text-muted border-line",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/25",
};

const money = (minor?: number) =>
  minor ? `PKR ${(minor / 100).toLocaleString("en-PK")}` : "—";

const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function AdminServiceRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [influencers, setInfluencers] = useState<any[]>([]);

  // The request open in the slide-over.
  const [active, setActive] = useState<any>(null);
  const [influencerId, setInfluencerId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const load = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const data = await apiFetch(`/api/service-requests?${params.toString()}`, {
        token: getToken()!,
      });
      setRequests(data.requests);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), 15000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  useEffect(() => {
    apiFetch("/api/influencers?limit=100", {})
      .then((data) => {
        const valid = (data.profiles || []).filter((p: any) => p.userId?._id);
        setInfluencers(valid);
      })
      .catch(() => setInfluencers([]));
  }, []);

  // Each request gets its own match form, so clear it when switching.
  const openRequest = (r: any) => {
    setActive(r);
    setInfluencerId("");
    setAdminNotes("");
  };

  const match = async (id: string) => {
    if (!influencerId) return toast("Please select an influencer to match.");
    setActionLoadingId(id);
    try {
      await apiFetch(`/api/service-requests/${id}/match`, {
        method: "POST",
        token: getToken()!,
        body: { influencerId, adminNotes },
      });
      toast.success("Request matched");
      setRequests((prev) => prev.filter((r) => r._id !== id));
      setActive(null);
      setInfluencerId("");
      setAdminNotes("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-sm border border-line text-sm bg-background text-foreground placeholder:text-foreground focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/40 transition";

  return (
    <div className="max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground italic">Service Requests</h1>
        <p className="text-sm text-foreground mt-1">Match brand requests with the right creators.</p>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-5">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 pr-9 rounded-sm border border-line text-sm bg-background text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/40 transition"
          >
            <option value="pending">Pending</option>
            <option value="matched">Matched</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
            <option value="">All</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-foreground">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-background border border-line rounded-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="w-11 h-11 rounded-sm bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <FiInbox size={19} />
            </div>
            <p className="text-sm font-semibold text-foreground">No requests here</p>
            <p className="text-xs text-foreground mt-1">Nothing matches this filter.</p>
          </div>
        ) : (
          <>
            {/* ── Table, md and up ── */}
            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface/40">
                  <th className="pl-5 pr-3 py-3.5 text-xs font-semibold text-foreground">Request</th>
                  <th className="px-3 py-3.5 text-xs font-semibold text-foreground w-[170px]">Budget</th>
                  <th className="px-3 py-3.5 text-xs font-semibold text-foreground w-[150px]">Brand</th>
                  <th className="px-3 py-3.5 text-xs font-semibold text-foreground w-[120px]">Status</th>
                  <th className="px-3 py-3.5 text-xs font-semibold text-foreground w-[110px]">Created</th>
                  <th className="pl-3 pr-5 py-3.5 text-xs font-semibold text-foreground w-[90px] text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {requests.map((r) => (
                  <tr key={r._id} className="hover:bg-surface/50 transition-colors">
                    <td className="pl-5 pr-3 py-4 max-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{r.title}</p>
                      {/* <p className="text-xs text-foreground mt-0.5 truncate">
                        {r.description || "No description"}
                      </p>
                      {r.category && (
                        <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-primary/10 border border-primary/20 text-primary capitalize">
                          {r.category}
                        </span>
                      )} */}
                    </td>
                    <td className="px-3 py-4">
                      <span className="text-sm text-foreground whitespace-nowrap">
                        {money(r.budgetMinMinor)}
                      </span>
                      <span className="block text-[11px] text-foreground whitespace-nowrap">
                        to {money(r.budgetMaxMinor)}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <p className="text-sm text-foreground truncate">{r.brandId?.name || "—"}</p>
                      {r.matchedInfluencerId && (
                        <p className="text-[11px] text-green-400 truncate mt-0.5">
                          → {r.matchedInfluencerId.name}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize whitespace-nowrap ${
                          STATUS_STYLES[r.status] || STATUS_STYLES.closed
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <span className="text-xs text-foreground whitespace-nowrap">
                        {fmtDate(r.createdAt)}
                      </span>
                    </td>
                    <td className="pl-3 pr-5 py-4 text-right">
                      <button
                        onClick={() => openRequest(r)}
                        className="px-3.5 py-1.5 rounded-sm border border-primary/40 text-primary text-xs font-semibold hover:bg-primary hover:text-white transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Stacked cards below md ── */}
            <div className="md:hidden divide-y divide-line">
              {requests.map((r) => (
                <div key={r._id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-semibold text-foreground">{r.title}</p>
                    <span
                      className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                        STATUS_STYLES[r.status] || STATUS_STYLES.closed
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-foreground line-clamp-2">{r.description}</p>
                  <p className="text-[11px] text-foreground mt-2">
                    {money(r.budgetMinMinor)} – {money(r.budgetMaxMinor)} ·{" "}
                    {r.brandId?.name || "—"} · {fmtDate(r.createdAt)}
                  </p>
                  <button
                    onClick={() => openRequest(r)}
                    className="mt-3 px-4 py-2 rounded-sm border border-primary/40 text-primary text-xs font-semibold hover:bg-primary hover:text-white transition"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Slide-over ── */}
      {active && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setActive(null)}
          />

          <div className="relative w-full sm:max-w-xl bg-background sm:border-l border-line flex flex-col h-full shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-line shrink-0">
              <div className="min-w-0">
                <span
                  className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${
                    STATUS_STYLES[active.status] || STATUS_STYLES.closed
                  }`}
                >
                  {active.status}
                </span>
                <h2 className="text-lg font-bold text-foreground mt-2">{active.title}</h2>
              </div>
              <button
                onClick={() => setActive(null)}
                className="w-8 h-8 shrink-0 rounded-sm text-foreground hover:text-foreground hover:bg-surface flex items-center justify-center transition"
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Details */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">
              {active.description && (
                <div>
                  <p className="text-[14px] font-semibold  text-foreground mb-1.5">
                    Description
                  </p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {active.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[14px] font-semibold  text-foreground mb-1">
                    Budget
                  </p>
                  <p className="text-sm text-foreground">
                    {money(active.budgetMinMinor)} – {money(active.budgetMaxMinor)}
                  </p>
                </div>
                <div>
                  <p className="text-[14px] font-semibold  text-foreground mb-1">
                    Category
                  </p>
                  <p className="text-sm text-foreground capitalize">{active.category || "—"}</p>
                </div>
                <div>
                  <p className="text-[14px] font-semibold  text-foreground mb-1">
                    Created
                  </p>
                  <p className="text-sm text-foreground">{fmtDate(active.createdAt)}</p>
                </div>
                {active.serviceId?.title && (
                  <div>
                    <p className="text-[14px] font-semibold  text-foreground mb-1">
                      Catalog service
                    </p>
                    <p className="text-sm text-foreground">{active.serviceId.title}</p>
                  </div>
                )}
              </div>

              <div className="p-4  bg-surface/30">
                <p className="text-[14px] font-semibold  text-foreground mb-1.5">
                  Brand
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {active.brandId?.name || "—"}
                </p>
                {active.brandId?.email && (
                  <p className="text-xs text-foreground mt-0.5">{active.brandId.email}</p>
                )}
              </div>

              {active.matchedInfluencerId && (
                <div className="p-4 rounded-sm border border-green-500/25 bg-green-500/10">
                  <p className="text-[14px] font-semibold  text-green-400 mb-1.5">
                    Matched creator
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {active.matchedInfluencerId.name}
                  </p>
                  {active.adminNotes && (
                    <p className="text-xs text-foreground mt-2 leading-relaxed">{active.adminNotes}</p>
                  )}
                </div>
              )}
            </div>

            {/* Match form — only while the request is still open */}
            {active.status === "pending" && (
              <div className="px-6 py-5 border-t border-line bg-surface/30 shrink-0 space-y-2.5">
                <p className="text-xs font-semibold text-foreground">Match a creator</p>

                <select
                  value={influencerId}
                  onChange={(e) => setInfluencerId(e.target.value)}
                  className={inputCls + " cursor-pointer"}
                >
                  <option value="">Select an influencer…</option>
                  {influencers.map((inf) => (
                    <option key={inf.userId?._id || inf._id} value={inf.userId?._id}>
                      {inf.userId?.name || inf.handle}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Admin notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className={inputCls}
                />
                <div className="flex justify-center items-center">
                  
                <button
                  disabled={actionLoadingId === active._id || !influencerId}
                  onClick={() => match(active._id)}
                  className=" inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm bg-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40"
                >
                  {actionLoadingId === active._id && (
                    <Spinner className="w-4 h-4 border-white border-t-transparent" />
                  )}
                  {actionLoadingId === active._id ? "Matching…" : "Confirm match"}
                </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}