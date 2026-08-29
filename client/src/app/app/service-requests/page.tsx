"use client";

import { useState, useEffect } from "react";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";
import Link from "next/link";

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/service-requests/me", {
        token: getToken()!,
      });
      setRequests(data.requests || []);
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
  load();
  const interval = setInterval(load, 15000);
  return () => clearInterval(interval);
}, []);

  const money = (minor?: number) =>
    minor ? `PKR ${(minor / 100).toLocaleString("en-PK")}` : "—";

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      matched: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      closed: "bg-gray-100 text-gray-600",
      cancelled: "bg-primary/10 text-primary",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/api/service-requests", {
        method: "POST",
        token: getToken()!,
        body: {
          title,
          description,
          category,
          budgetMinMinor: budgetMin ? Number(budgetMin) * 100 : undefined,
          budgetMaxMinor: budgetMax ? Number(budgetMax) * 100 : undefined,
          deadline,
        },
      });
      setShowForm(false);
      setTitle("");
      setDescription("");
      setCategory("");
      setBudgetMin("");
      setBudgetMax("");
      setDeadline("");
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await apiFetch(`/api/service-requests/${id}/cancel`, {
        method: "POST",
        token: getToken()!,
      });
      load();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl  px-4 sm:px-0 py-2 sm:py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground italic">
          Service Requests
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-primary text-paper text-sm font-medium hover:bg-primary-dark transition text-center"
        >
          {showForm ? "Cancel" : "+ New request"}
        </button>
      </div>

      <p className="text-xs sm:text-sm text-muted mb-6">
        Let our team match you directly with the right creator — no searching required.
      </p>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-paper border border-line bg-surface rounded-2xl p-4 sm:p-6 mb-6 space-y-3.5 shadow-2xs"
        >
          <input
            type="text"
            placeholder="What do you need?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-line text-sm focus:outline-none focus:border-primary transition"
          />
          <textarea
            placeholder="Describe your requirements..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border bg-background  border-line text-sm focus:outline-none focus:border-primary transition"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Min budget (PKR)"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border bg-background  border-line text-sm focus:outline-none focus:border-primary transition"
            />
            <input
              type="number"
              placeholder="Max budget (PKR)"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border bg-background  border-line text-sm focus:outline-none focus:border-primary transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border bg-background  border-line text-sm focus:outline-none focus:border-primary transition"
            />
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border bg-background  border-line text-sm focus:outline-none focus:border-primary transition"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-black transition disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit request"}
            </button>
          </div>
        </form>
      )}

      {/* Request List — only shown when the form is closed */}
      {!showForm && (
        requests.length === 0 ? (
          <div className="bg-background border border-line rounded-2xl p-6 sm:p-8 text-center shadow-2xs">
            <p className="text-muted text-xs sm:text-sm">
              You haven't submitted any requests yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r._id}
                className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <p className="text-sm font-bold text-foreground">{r.title}</p>
                      <span
                        className={`sm:hidden text-[10px] font-semibold px-2.5 py-0.5 rounded-full capitalize shrink-0 ${statusColor(
                          r.status
                        )}`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-foreground mt-1 leading-relaxed line-clamp-2">
                      {r.description}
                    </p>

                    <p className="text-xs text-foreground font-medium mt-2">
                      {money(r.budgetMinMinor)} – {money(r.budgetMaxMinor)} ·{" "}
                      {r.category || "—"}
                    </p>

                    {r.matchedInfluencerId && (
                      <p className="text-xs font-semibold text-green-700 mt-2">
                        Matched with: {r.matchedInfluencerId.name}
                      </p>
                    )}
                  </div>

                  {/* Status & Actions Column */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-line/60">
                    <span
                      className={`hidden sm:inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full capitalize shrink-0 ${statusColor(
                        r.status
                      )}`}
                    >
                      {r.status}
                    </span>

                    <div className="flex items-center gap-2.5 ml-auto sm:ml-0">
                      {r.status === "pending" && (
                        <button
                          disabled={cancellingId === r._id}
                          onClick={() => handleCancel(r._id)}
                          className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}

                      {r.conversationId && r.status === "matched" && (
                        <Link
                          href={`/app/messages`}
                          className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-line hover:bg-surface transition"
                        >
                          Message
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}