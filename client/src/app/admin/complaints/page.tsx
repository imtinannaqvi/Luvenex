"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { toast } from "react-toastify";

export default function AdminComplaintsPage(){
    const [complaints,setComplaints] = useState<any []>([])
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoadingId,setActionLoadingId] = useState<string | null>(null);



const load = async () => {
    setLoading(true);
    try {
        const data = await apiFetch("/api/complaints", {
            token: getToken()!
        });
        setComplaints(data.complaints);
    } catch (error: any) {
        toast.error(error.message);
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
    load();
     const interval = setInterval(load, 15000);
  return () => clearInterval(interval);
}, []);

    const review = async(id:string, status:"reviewed" | "dismissed") => {
        setActionLoadingId(id)
        try {
            await apiFetch(`/api/complaints/${id}/review`,{
                method:"POST",
                body:{status},
                token: getToken()!
            });
             setComplaints((prev) => prev.map((c) => (c._id === id ? { ...c, status } : c)));
            
        } catch (error: any) {
            toast(error.message)
            
        }finally{
            setActionLoadingId(null)
        }
    }

return (
  <div className="space-y-5 max-w-3xl px-6 sm:px-10 py-8">
    <h1 className="text-2xl font-bold text-foreground italic mb-6">Complaints</h1>

    {error && <p className="text-primary text-sm mb-4">{error}</p>}

    {loading ? (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    ) : complaints.length === 0 ? (
      <div className="bg-background border border-background/[0.06] rounded-3xl p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-16px_rgba(0,0,0,0.10)]">
        <p className="text-muted text-sm">No complaints filed.</p>
      </div>
    ) : (
      <div className="space-y-3.5">
        {complaints.map((c) => (
          <div
            key={c._id}
            className="bg-background rounded-3xl border border-background/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-16px_rgba(0,0,0,0.10)] p-5 hover:border-primary/25 transition-colors duration-200"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1 min-w-0">
                <p className="text-sm text-muted">
                  <span className="font-bold text-foreground">{c.filedBy?.name}</span> filed against{" "}
                  <span className="font-bold text-foreground">{c.against?.name}</span>
                </p>
                <p className="text-xs text-muted capitalize">
                  <span className="font-semibold text-foreground">Reason:</span> {c.reason?.replace("_", " ")}
                </p>
                <p className="text-sm text-foreground pt-1 leading-relaxed">{c.description}</p>
                {c.dealId?.title && (
                  <p className="text-xs text-muted pt-1">
                    <span className="font-medium text-foreground">Deal:</span> {c.dealId.title}
                  </p>
                )}
              </div>

              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize shrink-0 ${
                  c.status === "open"
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    : c.status === "reviewed"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                }`}
              >
                {c.status}
              </span>
            </div>

            {c.status === "open" && (
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-line">
                <button
                  disabled={actionLoadingId === c._id}
                  onClick={() => review(c._id, "reviewed")}
                  className="text-xs px-3.5 py-1.5 rounded-xl bg-primary text-foreground font-semibold hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
                >
                  Mark reviewed
                </button>
                <button
                  disabled={actionLoadingId === c._id}
                  onClick={() => review(c._id, "dismissed")}
                  className="text-sm px-3.5 py-1.5 rounded-xl bg-background border border-line text-foreground font-medium hover:bg-primary transition disabled:opacity-50"
                >
                  Dismiss
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