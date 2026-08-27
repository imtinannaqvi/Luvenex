"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { toast } from "react-toastify";

export default function AdminPayoutQueuePage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/admin/payout-queue", { token: getToken()! });
      setPayouts(data.payouts);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 15000);
  return () => clearInterval(interval);
  }, []);

  const money = (minor: number) => `PKR ${(minor / 100).toLocaleString("en-PK")}`;

  const complete = async (id: string) => {
    setActionLoadingId(id);
    try {
      await apiFetch(`/api/payouts/${id}/complete`, { method: "POST", token: getToken()! });
      setPayouts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Payout marked as sent.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const reject = async (id: string) => {
    setActionLoadingId(id);
    try {
      await apiFetch(`/api/payouts/${id}/reject`, {
        method: "POST",
        token: getToken()!,
        body: { rejectionReason },
      });
      setPayouts((prev) => prev.filter((p) => p._id !== id));
      setRejectingId(null);
      setRejectionReason("");
      toast.success("Payout rejected.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-6">Payout Queue</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : payouts.length === 0 ? (
        <div className="bg-background border border-line rounded-sm p-8 text-center">
          <p className="text-muted text-sm">No pending payouts. All caught up.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payouts.map((p) => (
            <div key={p._id} className="bg-background border border-line rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{p.userId?.name}</p>
                  <p className="text-sm text-muted">{p.userId?.email}</p>
                  <p className="text-lg font-bold text-foreground mt-2">{money(p.amountMinor)}</p>
                  <p className="text-sm text-muted capitalize">via {p.method}</p>
                  <div className="text-xs text-muted mt-2">
                    <p>Account: {p.accountDetails?.accountTitle} — {p.accountDetails?.accountNumber}</p>
                    {p.accountDetails?.bankName && <p>Bank: {p.accountDetails.bankName}</p>}
                  </div>
                  <p className="text-xs text-muted mt-2">
                    Requested {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={actionLoadingId === p._id}
                    onClick={() => complete(p._id)}
                    className="text-xs px-3 py-1.5 rounded-md bg-background text-paper hover:bg-surface transition disabled:opacity-50"
                  >
                    Mark sent
                  </button>
                  <button
                    disabled={actionLoadingId === p._id}
                    onClick={() => setRejectingId(rejectingId === p._id ? null : p._id)}
                    className="text-xs px-3 py-1.5 rounded-md bg-primary text-paper hover:bg-primary-dark transition disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {rejectingId === p._id && (
                <div className="mt-4 pt-4 border-t border-line flex gap-2">
                  <input
                    type="text"
                    placeholder="Reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-line text-sm bg-paper
                               focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <button
                    disabled={actionLoadingId === p._id || !rejectionReason}
                    onClick={() => reject(p._id)}
                    className="px-4 py-2 rounded-lg bg-primary text-paper text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50"
                  >
                    Confirm reject
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

