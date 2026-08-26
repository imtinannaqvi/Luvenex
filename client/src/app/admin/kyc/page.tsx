"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { toast } from "react-toastify";

export default function AdminKycQueuePage() {
    const [users, setusers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const loadQueue = async () => {
        setLoading(true);
        try {
            const data = await apiFetch("/api/admin/kyc-queue", {
                token: getToken()!,
            });
            setusers(data.users);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQueue();
         const interval = setInterval(load, 15000);
  return () => clearInterval(interval);
    }, []);

 const reviewKyc = async (userId: string, decision: "verified" | "rejected", reason?: string) => {
    setActionLoadingId(userId);
    try {
      await apiFetch(`/api/kyc/${userId}/review`, {
    method: "POST",
    token: getToken()!,
    body: { decision, rejectionReason: reason }
});

        setusers((prev) => prev?.filter((u) => u._id !== userId));
        setRejectingId(null);
        setRejectionReason("");
    } catch (error: any) {
        setError(error.message);
        toast.error(error.message);
    } finally {
        setActionLoadingId(null);
    }
};

    return (
        <div className="w-full max-w-6xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">KYC Verification Queue</h1>
                    <p className="text-sm text-muted mt-1">Review and verify pending user identity submissions.</p>
                </div>
                <span className="px-3 py-1 rounded-sm bg-surface border border-line text-sm font-semibold text-foreground">
                    {users.length} Pending
                </span>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : users.length === 0 ? (
                <div className="bg-background border border-line rounded-sm p-12 text-center shadow-sm">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-surface border border-line flex items-center justify-center text-muted">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-foreground font-semibold text-sm">All caught up!</p>
                    <p className="text-muted text-xs mt-1">No pending KYC submissions to review right now.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {users.map((u) => (
                        <div key={u._id} className="bg-background border border-line rounded-sm p-6 shadow-sm transition-all hover:shadow-md">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                
                                {/* User Details Section */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-sm bg-surface border border-line flex items-center justify-center text-foreground font-bold text-base shrink-0 shadow-inner">
                                        {u.name?.[0]?.toUpperCase() || "?"}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2.5">
                                            <h3 className="font-bold text-foreground text-base">{u.name}</h3>
                                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-surface border border-line text-foreground capitalize">
                                                {u.role}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted font-medium">{u.email}</p>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-3 pt-3 border-t border-line/60 text-xs">
                                            <div>
                                                <span className="text-muted">Full name on ID: </span>
                                                <span className="font-semibold text-foreground">{u.kyc?.fullName || "—"}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted">CNIC number: </span>
                                                <span className="font-semibold text-foreground font-mono">{u.kyc?.cnicNumber || "—"}</span>
                                            </div>
                                            <div className="sm:col-span-2 text-muted text-[11px] mt-0.5">
                                                Submitted on {u.kyc?.submittedAt ? new Date(u.kyc.submittedAt).toLocaleDateString() : "—"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                                    <button
                                        disabled={actionLoadingId === u._id}
                                        onClick={() => reviewKyc(u._id, "verified")}
                                        className="text-xs font-semibold px-4 py-2 rounded-sm bg-background text-paper hover:bg-surface transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                                    >
                                        {actionLoadingId === u._id ? (
                                            <div className="w-3.5 h-3.5 border-2 border-paper/30 border-t-paper rounded-full animate-spin" />
                                        ) : null}
                                        <span>Verify</span>
                                    </button>
                                    <button
                                        disabled={actionLoadingId === u._id}
                                        onClick={() => setRejectingId(rejectingId === u._id ? null : u._id)}
                                        className={`text-xs font-semibold px-4 py-2 rounded-sm transition shadow-sm disabled:opacity-50 cursor-pointer ${
                                            rejectingId === u._id 
                                                ? "bg-surface border border-line text-foreground hover:bg-line/50" 
                                                : "bg-red-600 text-white hover:bg-red-700"
                                        }`}
                                    >
                                        {rejectingId === u._id ? "Cancel" : "Reject"}
                                    </button>
                                </div>
                            </div>

                            {/* Rejection Input Section */}
                            {rejectingId === u._id && (
                                <div className="mt-5 pt-4 border-t border-line flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        placeholder="Provide a clear reason for rejection..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="flex-1 px-4 py-2.5 rounded-sm border border-line text-xs bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                                    />
                                    <button
                                        disabled={actionLoadingId === u._id || !rejectionReason.trim()}
                                        onClick={() => reviewKyc(u._id, "rejected", rejectionReason)}
                                        className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition shadow-sm disabled:opacity-50 cursor-pointer shrink-0"
                                    >
                                        Confirm Reject
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