"use client"
import { useState, useEffect } from "react"
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import Link from "next/link";

type User = {
    _id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
}

/* soft card shell — matches the dashboard */
const softCard =
    "bg-paper rounded-3xl border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-16px_rgba(0,0,0,0.10)]";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState("")
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<{ userId: string; status: string; userName: string } | null>(null);
    const [statusReason, setStatusReason] = useState("");

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadUsers = async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            if (search) params.set('q', search);
            if (roleFilter) params.set('role', roleFilter);
            const data = await apiFetch(`/api/admin/users?${params.toString()}`, {
                token: getToken()!,
            });
            setUsers(data.users);
        } catch (err: any) {
            setError(err.message);
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers()
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadUsers();
    }

    const updateStatus = async (userId: string, status: string, reason?: string) => {
        setActionLoadingId(userId);
        try {
            await apiFetch(`/api/admin/users/${userId}/status`, {
                method: "POST",
                body: { status, reason },
                token: getToken()!,
            });
            setUsers((prev) =>
                prev.map((u) => (u._id === userId ? { ...u, status } : u))
            );
            showToast(`${users.find(u => u._id === userId)?.name ?? "User"} set to ${status}.`);
            setPendingAction(null);
            setStatusReason("");
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setActionLoadingId(null)
        }
    }

    const statusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: "bg-emerald-50 text-emerald-700 border-emerald-200",
            pending: "bg-amber-50 text-amber-700 border-amber-200",
            suspended: "bg-orange-50 text-orange-700 border-orange-200",
            banned: "bg-rose-50 text-rose-700 border-rose-200",
        };
        return (
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize tracking-wide ${styles[status] || "bg-black/[0.04] text-muted border-line"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                    status === "active" ? "bg-emerald-500"
                    : status === "pending" ? "bg-amber-500"
                    : status === "suspended" ? "bg-orange-500"
                    : status === "banned" ? "bg-rose-500" : "bg-muted"
                }`} />
                {status}
            </span>
        );
    };

    /* action buttons — shared between table row and mobile card */
    const actions = (u: User) =>
        u.role === "admin" ? (
            <span className="text-xs text-muted/60 font-normal select-none">—</span>
        ) : (
            <div className="flex gap-2 justify-end items-center flex-wrap">
                {u.status !== "active" && (
                    <button
                        disabled={actionLoadingId === u._id}
                        onClick={() => updateStatus(u._id, "active")}
                        className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-paper border border-line hover:bg-surface text-ink transition disabled:opacity-50"
                    >
                        Activate
                    </button>
                )}
                {u.status !== "suspended" && (
                    <button
                        disabled={actionLoadingId === u._id}
                        onClick={() => setPendingAction({ userId: u._id, status: "suspended", userName: u.name })}
                        className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-paper border border-line hover:bg-surface text-muted hover:text-ink transition disabled:opacity-50"
                    >
                        Suspend
                    </button>
                )}
                {u.status !== "banned" && (
                    <button
                        disabled={actionLoadingId === u._id}
                        onClick={() => setPendingAction({ userId: u._id, status: "banned", userName: u.name })}
                        className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary/[0.06] border border-primary/20 hover:bg-primary/10 text-primary transition disabled:opacity-50"
                    >
                        Ban
                    </button>
                )}
            </div>
        );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold shadow-2xl backdrop-blur-md ${
                    toast.type === 'error'
                        ? 'bg-primary text-white'
                        : 'bg-ink text-white'
                }`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${toast.type === 'error' ? 'bg-white/80 animate-pulse' : 'bg-emerald-400'}`} />
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
              
                <h1 className="text-2xl italic font-bold text-foreground tracking-tight">System Users</h1>
                <p className="text-sm text-muted mt-1">Manage account access and platform roles.</p>
            </div>

            {/* Search controls */}
            <form onSubmit={handleSearch} className={`${softCard} flex flex-col lg:flex-row gap-3 p-3.5 mb-5`}>
                <input
                    type="text"
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-2xl border border-line text-sm bg-background text-foreground
                               focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/40 placeholder-muted transition"
                />
                <div className="flex flex-col sm:flex-row gap-2.5 lg:w-auto w-full">
                    <div className="relative flex-1 sm:w-48">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-2xl border border-line text-sm bg-background text-foreground
                                       focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/40 transition cursor-pointer appearance-none"
                        >
                            <option value="">All roles</option>
                            <option value="brand">Brands</option>
                            <option value="influencer">Influencers</option>
                            <option value="admin">Admins</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="sm:w-32 w-full px-5 py-2.5 rounded-2xl bg-background text-white text-sm font-semibold hover:bg-primary
                                   transition active:scale-[0.98] disabled:opacity-50 shrink-0"
                    >
                        {loading ? "Searching…" : "Search"}
                    </button>
                </div>
            </form>

            {error && (
                <div className="bg-primary/[0.06] border border-primary/20 text-primary text-sm font-medium rounded-2xl px-4 py-3 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* ── Desktop table ── */}
            <div className={`${softCard} overflow-hidden hidden md:block`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap border-collapse">
                        <thead>
                            <tr className="text-foreground border-b border-line bg-background font-semibold text-[11px] uppercase tracking-wider">
                                <th className="px-5 py-3.5">Name</th>
                                <th className="px-5 py-3.5">Email</th>
                                <th className="px-5 py-3.5">Role</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5">Joined</th>
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-background text-foreground">
                            {loading && users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-6 h-6 border-2 border-line border-t-ink rounded-full animate-spin" />
                                            <span className="text-sm text-muted">Loading users…</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-16 text-center text-muted italic">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u._id} className="hover:bg-black/[0.015] transition-colors">
                                        <td className="px-5 py-4 font-semibold text-ink">
                                           <Link
  href={`/admin/users/${u._id}`}
  className="hover:text-primary transition-colors underline-offset-4 hover:underline"
>
  {u.name}
</Link>
                                        </td>
                                        <td className="px-5 py-4 text-muted">{u.email}</td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center text-[11px] font-semibold bg-black/[0.04] px-2.5 py-0.5 rounded-md border border-line capitalize text-ink">
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">{statusBadge(u.status)}</td>
                                        <td className="px-5 py-4 text-muted">
                                            {new Date(u.createdAt).toLocaleDateString("en-PK", { dateStyle: "medium" })}
                                        </td>
                                        <td className="px-5 py-4 text-right">{actions(u)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Mobile cards ── */}
            <div className="md:hidden space-y-3">
                {loading && users.length === 0 ? (
                    <div className={`${softCard} py-16 flex flex-col items-center gap-3`}>
                        <div className="w-6 h-6 border-2 border-line border-t-ink rounded-full animate-spin" />
                        <span className="text-sm text-muted">Loading users…</span>
                    </div>
                ) : users.length === 0 ? (
                    <div className={`${softCard} py-14 text-center text-muted italic`}>No users found.</div>
                ) : (
                    users.map((u) => (
                        <div key={u._id} className={`${softCard} p-4`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                   <Link
  href={`/admin/users/${u._id}`}
  className="font-bold text-ink hover:text-primary transition-colors block truncate"
>
  {u.name}
</Link>
                                    <p className="text-xs text-muted truncate mt-0.5">{u.email}</p>
                                </div>
                                {statusBadge(u.status)}
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="inline-flex items-center text-[11px] font-semibold bg-black/[0.04] px-2.5 py-0.5 rounded-md border border-line capitalize text-ink">
                                    {u.role}
                                </span>
                                <span className="text-[11px] text-muted">
                                    Joined {new Date(u.createdAt).toLocaleDateString("en-PK", { dateStyle: "medium" })}
                                </span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-line">{actions(u)}</div>
                        </div>
                    ))
                )}
            </div>

            {/* Reason modal for Suspend/Ban */}
            {pendingAction && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-paper rounded-3xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-base font-bold text-ink mb-1 italic">
                            {pendingAction.status === "banned" ? "Ban" : "Suspend"} {pendingAction.userName}?
                        </h3>
                        <p className="text-xs text-muted mb-4">
                            This reason will be shown to the user when they try to log in.
                        </p>
                        <textarea
                            placeholder="Type reason…"
                            value={statusReason}
                            onChange={(e) => setStatusReason(e.target.value)}
                            rows={3}
                            className="w-full px-3.5 py-2.5 rounded-2xl border border-line text-sm bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/40"
                        />
                        <div className="flex gap-2 justify-end mt-4">
                            <button
                                onClick={() => { setPendingAction(null); setStatusReason(""); }}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-ink transition"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!statusReason.trim() || actionLoadingId === pendingAction.userId}
                                onClick={() => updateStatus(pendingAction.userId, pendingAction.status, statusReason)}
                                className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-ink transition disabled:opacity-50"
                            >
                                Confirm {pendingAction.status === "banned" ? "ban" : "suspension"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}