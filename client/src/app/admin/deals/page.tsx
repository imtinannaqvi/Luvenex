"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiFileText, FiZap } from "react-icons/fi";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [releaseReason, setReleaseReason] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const statuses = [
    "", "draft", "agreed", "funded", "in_progress",
    "delivered", "approved", "completed", "auto_released",
    "disputed", "cancelled", "refunded",
  ];

  const RELEASABLE_STATUSES = ["funded", "in_progress", "delivered", "disputed"];

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const data = await apiFetch(`/api/admin/deals?${params.toString()}`, {
        token: getToken()!,
      });
      setDeals(data.deals);
    } catch (err: any) {
      toast.error(err.message || "Failed to load deals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     const interval = setInterval(load, 15000);
  return () => clearInterval(interval);
  }, [statusFilter]);

  const money = (minor: number) => `PKR ${(minor / 100).toLocaleString("en-PK")}`;

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      completed: "bg-green-100 text-green-700",
      approved: "bg-green-100 text-green-700",
      auto_released: "bg-yellow-100 text-yellow-700",
      disputed: "bg-primary/10 text-primary",
      cancelled: "bg-gray-100 text-gray-600",
      refunded: "bg-gray-100 text-gray-600",
    };
    return map[status] || "bg-blue-100 text-blue-700";
  };

  const handleForceRelease = async (id: string) => {
    if (!confirm("Force release this deal's escrow? This cannot be undone.")) return;
    setSubmittingId(id);
    try {
      await apiFetch(`/api/admin/deals/${id}/release`, {
        method: "POST",
        token: getToken()!,
        body: { reason: releaseReason },
      });
      toast.success("Escrow released successfully");
      setReleasingId(null);
      setReleaseReason("");
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to release escrow");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-6">Deals</h1>

      <div className="flex gap-3 mb-5">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 rounded-lg border border-line text-sm bg-background"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === "" ? "All statuses" : s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-surface border border-line rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
<tr className="bg-surface text-foreground text-left border-b border-line">
                <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Brand</th>
              <th className="px-4 py-3 font-medium">Influencer</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center">
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : deals.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">No deals found.</td></tr>
            ) : (
              deals.map((d) => (
                <React.Fragment key={d._id}>
                  <tr className="border-t border-line">
                    <td className="px-4 py-3 font-medium text-foreground">{d.title}</td>
                    <td className="px-4 py-3 text-muted">{d.brandId?.name || "—"}</td>
                    <td className="px-4 py-3 text-muted">{d.influencerId?.name || "—"}</td>
                    <td className="px-4 py-3">{money(d.priceMinor)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColor(d.status)}`}>
                        {d.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(d.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {RELEASABLE_STATUSES.includes(d.status) && (
                        <button
                          onClick={() => setReleasingId(releasingId === d._id ? null : d._id)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition"
                        >
                          <FiZap size={12} />
                          Force release
                        </button>
                      )}
                    </td>
                  </tr>

                  {releasingId === d._id && (
                    <tr className="bg-surface border-t border-line">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Reason for manual release..."
                            value={releaseReason}
                            onChange={(e) => setReleaseReason(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg border border-line text-xs bg-background"
                          />
                          <button
                            onClick={() => handleForceRelease(d._id)}
                            disabled={submittingId === d._id}
                            className="px-4 py-2 rounded-lg bg-primary text-paper text-xs font-semibold hover:bg-primary-dark transition disabled:opacity-50"
                          >
                            {submittingId === d._id ? "Releasing..." : "Confirm release"}
                          </button>
                          <button
                            onClick={() => { setReleasingId(null); setReleaseReason(""); }}
                            className="px-3 py-2 rounded-lg border border-line text-xs font-semibold hover:bg-surface transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}