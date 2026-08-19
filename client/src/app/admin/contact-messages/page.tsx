"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";

export default function AdminContactMessagePage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const data = await apiFetch(`/api/contact?${params.toString()}`, {
        token: getToken()!,
      });
      setMessages(data.messages);
    } catch (error: any) {
      toast.error(error.message || "Failed to load message");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await apiFetch(`/api/contact/${id}`, {
        method: "POST",
        token: getToken()!,
        body: { status },
      });
      setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, status } : m)));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; dot: string; text: string }> = {
      new: { bg: "bg-amber-500/10 text-amber-600 border-amber-500/20", dot: "bg-amber-500", text: "New" },
      read: { bg: "bg-blue-500/10 text-blue-600 border-blue-500/20", dot: "bg-blue-500", text: "Read" },
      resolved: { bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", dot: "bg-emerald-500", text: "Resolved" },
    };
    const style = map[status] || { bg: "bg-gray-500/10 text-gray-600 border-gray-500/20", dot: "bg-gray-400", text: status };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${style.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
        {style.text}
      </span>
    );
  };

  const filterOptions = [
    { label: "All Messages", value: "" },
    { label: "New", value: "new" },
    { label: "Read", value: "read" },
    { label: "Resolved", value: "resolved" },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-t-primary border-primary/20 rounded-full animate-spin" />
        <p className="text-xs text-muted font-medium">Loading inbox…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl px-4 sm:px-6 py-8 space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground italic">Contact Details</h1>
        </div>

        {/* Tab filters — right aligned */}
        <div className="inline-flex p-1 bg-background/[0.03] border border-line rounded-xl gap-1 self-start sm:self-auto">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                statusFilter === opt.value
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message List Table */}
      {messages.length === 0 ? (
        <div className="bg-background rounded-3xl border border-background/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-16px_rgba(0,0,0,0.10)] p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-background/[0.04] text-muted flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
            </svg>
          </div>
          <h3 className="text-foreground font-semibold text-sm">No messages found</h3>
          <p className="text-background text-xs mt-1">There are no submissions matching your current filter.</p>
        </div>
      ) : (
        <div className="bg-background rounded-3xl border border-background/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-16px_rgba(0,0,0,0.10)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line bg-background/[0.02] text-xs font-semibold text-foreground uppercase tracking-wider">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Message</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background text-sm">
                {messages.map((m) => (
                  <tr key={m._id} className="hover:bg-background/[0.01] transition-colors">
                    <td className="py-4 px-6 font-semibold text-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{m.name}</span>
                        {statusBadge(m.status)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-foreground whitespace-nowrap">
                      <Link href={`mailto:${m.email}`} className="hover:text-primary transition-colors">
                        {m.email}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-foreground max-w-xs truncate">
                      <p className="truncate">{m.message}</p>
                    </td>
                    <td className="py-4 px-6 text-foreground text-xs whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <select
                          value={m.status}
                          onChange={(e) => updateStatus(m._id, e.target.value)}
                          disabled={updatingId === m._id}
                          className="px-3 py-1.5 text-xs font-medium rounded-xl border border-line bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition cursor-pointer disabled:opacity-50"
                        >
                          <option value="new">New</option>
                          <option value="read">Read</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}