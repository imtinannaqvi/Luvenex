"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { toast } from "react-toastify";

export default function WithdrawalHistoryPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/payouts", { token: getToken()! })
      .then((data) => setPayouts(data.payouts || []))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const money = (minor: number) => `PKR ${(minor / 100).toLocaleString("en-PK")}`;

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      completed: "bg-green-100 text-green-700",
      rejected: "bg-primary/10 text-primary",
      pending: "bg-yellow-100 text-yellow-700",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <div className="w-7 h-7 border-2 border-t-primary border-primary/20 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl ">
      <h1 className="text-2xl font-bold text-foreground italic mb-1">Withdrawal History</h1>
      <p className="text-sm text-muted mb-6">All your past payout requests.</p>

      {payouts.length === 0 ? (
        <div className="bg-background border border-line rounded-2xl p-8 text-center">
          <p className="text-muted text-sm">No withdrawal requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payouts.map((p) => (
            <div key={p._id} className="bg-background border border-line rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-foreground">{money(p.amountMinor)}</p>
                  <p className="text-xs text-muted capitalize mt-0.5">
                    {p.method?.replace("_", " ")} · {p.accountDetails?.accountTitle}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    Requested {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                  {p.status === "rejected" && p.rejectionReason && (
                    <p className="text-xs text-primary mt-1">Reason: {p.rejectionReason}</p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColor(p.status)}`}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}