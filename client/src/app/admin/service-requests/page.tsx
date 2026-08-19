"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { toast } from "react-toastify";

/* soft card shell — matches dashboard + users pages */
const softCard =
  "bg-background rounded-3xl border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-16px_rgba(0,0,0,0.10)]";

const Spinner = ({ className = "" }: { className?: string }) => (
  <div
    className={`border-2 border-line border-t-ink rounded-full animate-spin ${className}`}
    role="status"
    aria-label="Loading"
  />
);

export default function AdminServiceRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState("pending");
  const [matchingId, setMatchingId] = useState<string | null>(null);
  const [influencerId, setInfluencerId] = useState('');
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [influencers, setInfluencers] = useState<any[]>([])

  const load = async () => {
    setLoading(true);
    setError("");
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
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  useEffect(() => {
  apiFetch("/api/influencers?limit=100", {})
    .then((data) => setInfluencers(data.profiles || []))
    .catch(() => setInfluencers([]));
}, []);

  const money = (minor?: number) => (minor ? `PKR ${(minor / 100).toLocaleString("en-PK")}` : "—");

 const match = async (id: string) => {
  if (!influencerId) return toast("Please select an influencer to match.");
  setActionLoadingId(id);
  try {
    await apiFetch(`/api/service-requests/${id}/match`, {
      method: "POST",
      token: getToken()!,
      body: { influencerId, adminNotes },
    });
    setRequests((prev) => prev.filter((r) => r._id !== id));
    setMatchingId(null);
    setInfluencerId("");
    setAdminNotes("");
  } catch (err: any) {
    toast(err.message);
  } finally {
    setActionLoadingId(null);
  }
};

  return (
    <div className="max-w-6xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground italic">Service Requests</h1>
        <p className="text-sm text-muted mt-1">Match brand requests with the right creators.</p>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-5">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 pr-9 rounded-2xl border border-line text-sm bg-background text-foreground appearance-none cursor-pointer
                       focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/40 transition"
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

      {error && (
        <div className="bg-primary/[0.06] border border-primary/20 text-primary text-sm font-medium rounded-2xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className={`${softCard} py-16 px-6 flex items-center justify-center`}>
          <Spinner className="w-5 h-5" />
        </div>
      ) : requests.length === 0 ? (
        <div className={`${softCard} p-8`}>
          <p className="text-muted text-sm italic">No requests here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((r) => (
            <div key={r._id} className={`${softCard} p-5 flex flex-col`}>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">{r.title}</p>
                {r.description && (
                  <p className="text-sm text-muted mt-1 leading-relaxed line-clamp-3">{r.description}</p>
                )}

                {/* meta pills */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-background border border-line text-foreground">
                    {money(r.budgetMinMinor)} – {money(r.budgetMaxMinor)}
                  </span>
                  {r.category && (
                    <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/[0.06] border border-primary/20 text-primary capitalize">
                      {r.category}
                    </span>
                  )}
                  {r.matchedInfluencerId && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Matched: {r.matchedInfluencerId.name}
                    </span>
                  )}
                </div>

                {/* brand / catalog rows */}
                <div className="text-xs text-muted mt-3 space-y-1 border-t border-line pt-3">
                  <p>
                    <span className="font-bold text-foreground">Brand:</span>{" "}
                    {r.brandId?.name || "—"}{r.brandId?.email ? ` (${r.brandId.email})` : ""}
                  </p>
                  {r.serviceId?.title && (
                    <p>
                      <span className="font-bold text-foreground">Catalog service:</span> {r.serviceId.title}
                    </p>
                  )}
                </div>
              </div>

              {r.status === "pending" && (
                <button
                  onClick={() => setMatchingId(matchingId === r._id ? null : r._id)}
                  className="mt-4 text-sm font-semibold px-4 py-2 rounded-xl bg-surface border border-line text-foreground hover:bg-primary hover:text-white hover:border-primary transition self-start"
                >
                  {matchingId === r._id ? "Close" : "Match"}
                </button>
              )}

             {matchingId === r._id && (
  <div className="mt-4 pt-4 border-t border-line space-y-2.5">
    <select
      value={influencerId}
      onChange={(e) => setInfluencerId(e.target.value)}
      className="w-full px-3.5 py-2.5 rounded-2xl border border-line text-sm bg-background text-foreground
                 focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/40 transition"
    >
      <option value="">Select an influencer…</option>
      {influencers.map((inf) => (
        <option key={inf.userId?._id} value={inf.userId?._id}>
          {inf.userId?.name || inf.handle}
        </option>
      ))}
    </select>
    <input
      type="text"
      placeholder="Admin notes (optional)"
      value={adminNotes}
      onChange={(e) => setAdminNotes(e.target.value)}
      className="w-full px-3.5 py-2.5 rounded-2xl border border-line text-sm bg-background text-foreground
                 focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/40 transition"
    />
    <button
      disabled={actionLoadingId === r._id || !influencerId}
      onClick={() => match(r._id)}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50"
    >
      {actionLoadingId === r._id && (
        <Spinner className="w-4 h-4 border-white border-t-transparent" />
      )}
      {actionLoadingId === r._id ? "Matching…" : "Confirm match"}
    </button>
  </div>
)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}