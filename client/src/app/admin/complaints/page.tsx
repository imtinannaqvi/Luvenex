"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { toast } from "react-toastify";
import { FiX, FiEye } from "react-icons/fi";

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);

  const load = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const data = await apiFetch("/api/complaints", { token: getToken()! });
      setComplaints(data.complaints);
      if (isInitial) setLoading(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), 15000);
    return () => clearInterval(interval);
  }, []);

  const review = async (id: string, status: "reviewed" | "dismissed") => {
    setActionLoadingId(id);
    try {
      await apiFetch(`/api/complaints/${id}/review`, {
        method: "POST",
        body: { status },
        token: getToken()!,
      });
      setComplaints((prev) => prev.map((c) => (c._id === id ? { ...c, status } : c)));
      setSelected((cur: any) => (cur && cur._id === id ? { ...cur, status } : cur));
      toast.success(`Complaint ${status}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const statusPill = (status: string) =>
    status === "open"
      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
      : status === "reviewed"
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      : "bg-gray-500/10 text-gray-600 border-gray-500/20";

  return (
    <div className="max-w-6xl px-4 sm:px-8 py-8">
      <h1 className="text-2xl font-bold text-foreground italic mb-6">Complaints</h1>

      {error && <p className="text-primary text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-background border border-line rounded-2xl p-8 text-center">
          <p className="text-muted text-sm">No complaints filed.</p>
        </div>
      ) : (
        <div className="bg-background border border-line rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[820px]">
              <thead>
                <tr className="border-b border-line bg-surface/50 text-[13px] font-bold text-foreground italic">
                  <th className="px-5 py-3.5">From</th>
                  <th className="px-5 py-3.5">Against</th>
                  <th className="px-5 py-3.5">Reason</th>
                  <th className="px-5 py-3.5">Deal</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-surface/60 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-foreground whitespace-nowrap">
                      {c.filedBy?.name || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-foreground whitespace-nowrap">
                      {c.against?.name || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-muted capitalize whitespace-nowrap">
                      {c.reason?.replace(/_/g, " ") || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-muted max-w-[180px] truncate">
                      {c.dealId?.title || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${statusPill(
                          c.status
                        )}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {/* View button — opens the drawer */}
                        <button
                          onClick={() => setSelected(c)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-line text-foreground hover:bg-surface transition"
                        >
                          <FiEye size={13} /> View
                        </button>

                        {/* Status dropdown — only actionable while open */}
                        {c.status === "open" ? (
                          <select
                            value=""
                            disabled={actionLoadingId === c._id}
                            onChange={(e) => {
                              const val = e.target.value as "reviewed" | "dismissed";
                              if (val) review(c._id, val);
                            }}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-line bg-background text-foreground cursor-pointer focus:outline-none focus:border-primary disabled:opacity-50"
                          >
                            <option value="">Set status…</option>
                            <option value="reviewed">Mark reviewed</option>
                            <option value="dismissed">Dismiss</option>
                          </select>
                        ) : (
                          <span className="text-xs text-muted italic px-2">Closed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Detail drawer ── */}
      {selected && (
        <>
          <div
            onClick={() => setSelected(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <div className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-background border-l border-line z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-line px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground italic">Complaint details</h2>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface transition"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <span
                  className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border capitalize ${statusPill(
                    selected.status
                  )}`}
                >
                  {selected.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-1">From</p>
                  <p className="text-sm font-bold text-foreground">{selected.filedBy?.name || "—"}</p>
                  {selected.filedBy?.email && (
                    <p className="text-xs text-muted mt-0.5">{selected.filedBy.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-1">Against</p>
                  <p className="text-sm font-bold text-foreground">{selected.against?.name || "—"}</p>
                  {selected.against?.email && (
                    <p className="text-xs text-muted mt-0.5">{selected.against.email}</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-1">Reason</p>
                <p className="text-sm text-foreground capitalize">
                  {selected.reason?.replace(/_/g, " ") || "—"}
                </p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-1">Description</p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {selected.description || "No description provided."}
                </p>
              </div>

              {selected.dealId?.title && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-1">Related deal</p>
                  <p className="text-sm text-foreground">{selected.dealId.title}</p>
                </div>
              )}

              {selected.createdAt && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-1">Filed on</p>
                  <p className="text-sm text-foreground">
                    {new Date(selected.createdAt).toLocaleString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}

              {selected.status === "open" && (
                <div className="flex items-center gap-2 pt-4 border-t border-line">
                  <button
                    disabled={actionLoadingId === selected._id}
                    onClick={() => review(selected._id, "reviewed")}
                    className="flex-1 text-sm px-4 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
                  >
                    {actionLoadingId === selected._id ? "..." : "Mark reviewed"}
                  </button>
                  <button
                    disabled={actionLoadingId === selected._id}
                    onClick={() => review(selected._id, "dismissed")}
                    className="flex-1 text-sm px-4 py-2.5 rounded-xl bg-background border border-line text-foreground font-medium hover:bg-surface transition disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}