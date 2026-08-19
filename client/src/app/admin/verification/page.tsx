"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { toast } from "react-toastify";

export default function AdminVerificationPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    apiFetch("/api/admin/verification-queue", { token: getToken()! })
      .then((data) => setUsers(data.users || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const review = async (userId: string, decision: string) => {
    try {
      await apiFetch(`/api/admin/verification/${userId}/review`, {
        method: "POST",
        token: getToken()!,
        body: { decision },
      });
      toast.success(`Verification ${decision}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return(
        <div className="flex items-center justify-center mb-3">
            <div className="w-8 h-8 border-t-primary border-2 border-primary rounded-full animate-spin"></div>
        </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground italic mb-6">Verification Requests</h1>
      {users.length === 0 ? (
        <div className="bg-background border border-line rounded-2xl p-8 text-center">
          <p className="text-muted text-sm">No pending requests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <div
              key={u._id}
              className="bg-background border border-line rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                  {u.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{u.name}</p>
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface border border-line text-muted capitalize mt-0.5">
                    {u.role}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-line/60 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-1">Reason</p>
                <p className="text-xs text-shadow-foreground/80 leading-relaxed line-clamp-4">
                  {u.verificationRequest?.reason || "No reason provided."}
                </p>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => review(u._id, "approved")}
                  className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg bg-primary text-foreground hover:bg-primary-dark transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => review(u._id, "rejected")}
                  className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg border border-line text-foreground hover:bg-surface transition"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}