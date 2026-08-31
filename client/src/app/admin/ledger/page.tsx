"use client"
import { useState, useEffect } from "react"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"

type User = {
    _id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState("")
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Derived Metrics for the Ledger Header
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const flaggedUsers = users.filter(u => u.status === 'suspended' || u.status === 'banned').length;

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadUsers = async (isInitial = false) => {
  if (isInitial) setLoading(true);
          setError("");
        try {
            const params = new URLSearchParams();
            if (search) params.set('q', search);
            if (roleFilter) params.set('role', roleFilter);
            const data = await apiFetch(`/api/admin/users?${params.toString()}`, {
                token: getToken()!,
            });
            setUsers(data.users);
            if (isInitial) setLoading(false);
        } catch (err: any) {
            setError(err.message);
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers(true)
         const interval = setInterval(() => loadUsers(false), 15000);
  return () => clearInterval(interval);
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadUsers();
    }

    const updateStatus = async (userId: string, status: string) => {
        setActionLoadingId(userId);
        try {
            await apiFetch(`/api/admin/users/${userId}/status`, {
                method: "POST",
                body: { status },
                token: getToken()!,
            });
            setUsers((prev) =>
                prev.map((u) => (u._id === userId ? { ...u, status } : u))
            );
            showToast(`User baseline privileges modified to ${status}.`);
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setActionLoadingId(null)
        }
    }

    const statusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: "bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-emerald-600/10",
            pending: "bg-amber-50 text-amber-700 border-amber-200/80 ring-amber-600/10",
            suspended: "bg-orange-50 text-orange-700 border-orange-200/80 ring-orange-600/10",
            banned: "bg-rose-50 text-rose-700 border-rose-200/80 ring-rose-600/10",
        };
        return (
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border capitalize tracking-wide shadow-xs ${styles[status] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${status === 'active' ? 'bg-emerald-500' : status === 'pending' ? 'bg-amber-500' : status === 'suspended' ? 'bg-orange-500' : 'bg-rose-500'
                    }`} />
                {status}
            </span>
        );
    };

    return (
        <div className="max-w-7xl mx-auto  py-8 relative antialiased selection:bg-slate-900 selection:text-white">

            {/* Premium Floating Notification Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-sm font-semibold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300 ${toast.type === 'error'
                    ? 'bg-slate-950 text-rose-200 border-rose-800/40 shadow-rose-950/10'
                    : 'bg-slate-950 text-slate-100 border-slate-800 shadow-slate-950/20'
                    }`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${toast.type === 'error' ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`} />
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Header Layout */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-slate-200/60">
                <div>
                    <h1 className="text-2xl sm:text-2xl italic font-bold text-foreground tracking-tight">
                        System Users Ledger
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                        Manage account authorizations, operational roles.
                    </p>
                </div>
            </div>

            {/* Quick Metrics Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-background border text-center border-slate-200 p-4 rounded-md shadow-xs">
                    <p className="text-sm font-semibold  text">Total Cataloged</p>
                    <p className="text-2xl font-bold text-foreground italic mt-1">{loading && totalUsers === 0 ? "..." : totalUsers}</p>
                </div>
                <div className="bg-background border border-slate-200 p-4 text-center rounded-md shadow-xs">
                    <p className="text-md font-semibold italic text-foreground">Active Profiles</p>
                    <p className="text-2xl font-bold italic text-emerald-600 mt-1">{loading && totalUsers === 0 ? "..." : activeUsers}</p>
                </div>
                <div className="bg-background border border-slate-200 p-4 text-center rounded-md shadow-xs">
                    <p className="text-md font-semibold  text-foreground">Restrictions / Flagged</p>
                    <p className="text-2xl font-bold italic text-rose-600 mt-1">{loading && totalUsers === 0 ? "..." : flaggedUsers}</p>
                </div>
            </div>

            {/* Search Controls Dashboard */}
            <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-3 mb-6 bg-background border border-slate-200 rounded-md p-3 shadow-xs">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search index by name, identity, or metadata..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-md border border-slate-200 text-sm bg-background text-foreground shadow-2xs
                                   focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-400 placeholder-foreground transition font-medium"
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5 lg:w-auto w-full">
                    <div className="relative flex-1 sm:w-52">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full pl-3 pr-10 py-2.5 rounded-md border border-slate-200 text-sm bg-background text-foreground font-semibold
                                       focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-400 transition cursor-pointer appearance-none shadow-2xs"
                        >
                            <option value="">All Account Profiles</option>
                            <option value="brand">Brand Unit</option>
                            <option value="influencer">Creator Unit</option>
                            <option value="admin">Admin Console</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                            </svg>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="sm:w-36 w-full px-5 py-2.5 rounded-md bg-surface text-foreground text-sm font-semibold hover:bg-primary 
                                   transition active:scale-[0.99] disabled:opacity-50 shadow-sm shrink-0 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : "Query Index"}
                    </button>
                </div>
            </form>

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl px-4 py-3 mb-6 flex items-center gap-2 animate-in fade-in duration-200">
                    <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Core Ledger Table */}
            <div className="bg-background border border-slate-200 rounded-md overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap border-collapse">
                        <thead>
                            <tr className="text-foreground border-b border-slate-200 bg-background font-bold text-md  select-none">
                                <th className="px-6 py-4">Identity Profile</th>
                                <th className="px-6 py-4">Network Route</th>
                                <th className="px-6 py-4">Operational Role</th>
                                <th className="px-6 py-4">System State</th>
                                <th className="px-6 py-4">Registration Date</th>
                                <th className="px-6 py-4 text-right">Ledger Overrides</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {loading && users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary-dark rounded-full animate-spin" />
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-medium tracking-wide bg-slate-50/30">
                                        No structural index records match the applied criteria.
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u._id} className="hover:bg-surface transition-colors duration-100">
                                        <td className="px-6 py-4 font-bold text-foreground">
                                            <a href={`/admin/users/${u._id}`} className="hover:text-slate-700 transition-colors underline-offset-4 decoration-slate-200 hover:underline">
                                                {u.name}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-normal">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center text-xs font-bold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 capitalize tracking-wide">
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{statusBadge(u.status)}</td>
                                        <td className="px-6 py-4 text-slate-400 font-normal">
                                            {new Date(u.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {u.role === "admin" ? (
                                                <span className="text-xs text-slate-300 font-normal pr-4 tracking-wide select-none">Protected Console</span>
                                            ) : (
                                                <div className="flex gap-2 justify-end items-center">
                                                    {u.status !== "active" && (
                                                        <button
                                                            disabled={actionLoadingId === u._id}
                                                            onClick={() => updateStatus(u._id, "active")}
                                                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 transition shadow-3xs disabled:opacity-50"
                                                        >
                                                            Restore Access
                                                        </button>
                                                    )}
                                                    {u.status !== "suspended" && (
                                                        <button
                                                            disabled={actionLoadingId === u._id}
                                                            onClick={() => updateStatus(u._id, "suspended")}
                                                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition shadow-3xs disabled:opacity-50"
                                                        >
                                                            Suspend
                                                        </button>
                                                    )}
                                                    {u.status !== "banned" && (
                                                        <button
                                                            disabled={actionLoadingId === u._id}
                                                            onClick={() => {
                                                                if (confirm(`Terminate workspace credentials permanently for ${u.name}?`)) {
                                                                    updateStatus(u._id, "banned");
                                                                }
                                                            }}
                                                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 transition shadow-3xs disabled:opacity-50"
                                                        >
                                                            Revoke
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
