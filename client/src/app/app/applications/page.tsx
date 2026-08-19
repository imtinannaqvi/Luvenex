"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  FiFileText,
  FiEdit2,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiX,
  FiCheck,
  FiBriefcase,
  FiArrowRight,
} from "react-icons/fi";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import Link from "next/link";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDeliveryDays, setEditDeliveryDays] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = () => {
    setLoading(true);
    apiFetch("/api/applications/me", { token: getToken()! })
      .then((data) => setApplications(data.applications || []))
      .catch((err) => {
        toast.error(err.message || "Failed to load applications");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (a: any) => {
    setEditingId(a._id);
    setEditText(a.proposalText || "");
    setEditPrice(a.proposedPriceMinor ? String(a.proposedPriceMinor / 100) : "");
    setEditDeliveryDays(a.proposedDeliveryDays ? String(a.proposedDeliveryDays) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditPrice("");
    setEditDeliveryDays("");
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      await apiFetch(`/api/applications/${id}`, {
        method: "PATCH",
        token: getToken()!,
        body: {
          proposalText: editText,
          proposedPriceMinor: editPrice ? Number(editPrice) * 100 : undefined,
          proposedDeliveryDays: editDeliveryDays ? Number(editDeliveryDays) : undefined,
        },
      });
      toast.success("Application updated successfully");
      cancelEdit();
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to update application");
    } finally {
      setSaving(false);
    }
  };

  const money = (minor: number) => `PKR ${(minor / 100).toLocaleString("en-PK")}`;

  const statusConfig: Record<string, { bg: string; dot: string; icon: any }> = {
    accepted: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
      dot: "bg-emerald-500",
      icon: FiCheckCircle,
    },
    rejected: {
      bg: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30",
      dot: "bg-rose-500",
      icon: FiXCircle,
    },
    pending: {
      bg: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
      dot: "bg-amber-500",
      icon: FiAlertCircle,
    },
  };

  const getStatusStyle = (status: string) => {
    return (
      statusConfig[status] || {
        bg: "bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30",
        dot: "bg-sky-500",
        icon: FiAlertCircle,
      }
    );
  };

  const filteredApplications =
    statusFilter === "all"
      ? applications
      : applications.filter((a) => a.status === statusFilter);

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl  px-4 sm:px-0 lg:px-6 py-3 sm:py-6 lg:py-8 space-y-5 lg:space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-4 lg:pb-5 border-b border-border-color/60">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 lg:h-6 bg-primary rounded-full" />
          <h1 className="text-xl lg:text-2xl font-bold text-foreground italic tracking-tight">Applications</h1>
        </div>
        <span className="text-xs lg:text-sm font-semibold px-3 lg:px-4 py-1 lg:py-1.5 rounded-full bg-surface text-foreground border border-border-color">
          {applications.length} {applications.length === 1 ? "Application" : "Applications"}
        </span>
      </div>

     {/* Stats Quick Overview */}
      {applications.length > 0 && (
        <div className="grid grid-cols-2 min-[420px]:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-2 py-2.5 lg:py-3 rounded-lg border text-center transition ${
              statusFilter === "all"
                ? "bg-surface border-primary shadow-2xs ring-1 ring-primary/20"
                : "bg-surface/60 border-border-color/60 hover:bg-background"
            }`}
          >
            <p className="text-xs sm:text-sm lg:text-base font-medium text-foreground">All</p>
            <p className="text-base sm:text-lg lg:text-2xl italic font-bold text-foreground mt-0.5">{stats.total}</p>
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-2 py-2.5 lg:py-3 rounded-lg border text-center transition ${
              statusFilter === "pending"
                ? "bg-surface border-amber-500 shadow-2xs ring-1 ring-amber-500/20"
                : "bg-surface/60 border-border-color/60 hover:bg-background"
            }`}
          >
            <p className="text-xs sm:text-sm lg:text-base font-bold text-amber-700 dark:text-amber-400 truncate">Pending</p>
            <p className="text-base sm:text-lg lg:text-2xl font-bold italic text-foreground mt-0.5">{stats.pending}</p>
          </button>
          <button
            onClick={() => setStatusFilter("accepted")}
            className={`px-2 py-2.5 lg:py-3 rounded-lg border text-center transition ${
              statusFilter === "accepted"
                ? "bg-surface border-emerald-500 shadow-2xs ring-1 ring-emerald-500/20"
                : "bg-surface/60 border-border-color/60 hover:bg-background"
            }`}
          >
            <p className="text-xs sm:text-sm lg:text-base font-bold text-emerald-700 dark:text-emerald-400 truncate">Accepted</p>
            <p className="text-base sm:text-lg lg:text-2xl font-bold italic text-foreground mt-0.5">{stats.accepted}</p>
          </button>
          <button
            onClick={() => setStatusFilter("rejected")}
            className={`px-2 py-2.5 lg:py-3 rounded-lg border text-center transition ${
              statusFilter === "rejected"
                ? "bg-surface border-rose-500 shadow-2xs ring-1 ring-rose-500/20"
                : "bg-surface/60 border-border-color/60 hover:bg-background"
            }`}
          >
            <p className="text-xs sm:text-sm lg:text-base font-bold text-rose-700 dark:text-rose-400 truncate">Rejected</p>
            <p className="text-base sm:text-lg lg:text-2xl font-bold text-foreground mt-0.5">{stats.rejected}</p>
          </button>
        </div>
      )}

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-card border border-border-color rounded-sm p-6 sm:p-8 lg:p-12 text-center shadow-2xs">
          <div className="w-11 h-11 lg:w-14 lg:h-14 rounded-md bg-surface border border-border-color/60 flex items-center justify-center mx-auto mb-3 text-foreground/40">
            <FiFileText size={20} className="lg:hidden" />
            <FiFileText size={24} className="hidden lg:block" />
          </div>
          <p className="text-sm lg:text-base font-semibold italic text-foreground">
            {statusFilter === "all" ? "No applications submitted yet" : `No ${statusFilter} applications`}
          </p>
          <p className="text-xs lg:text-sm text-muted mt-1 max-w-xs lg:max-w-sm mx-auto leading-relaxed">
            {statusFilter === "all"
              ? "You haven't applied to any campaign proposals. Explore open campaigns to pitch your services!"
              : `You currently don't have any applications marked as ${statusFilter}.`}
          </p>
          {statusFilter === "all" && (
            <Link
              href="/app/campaigns"
              className="inline-flex items-center gap-2 mt-4 px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl bg-primary text-white text-xs lg:text-sm font-semibold hover:opacity-90 transition shadow-2xs"
            >
              <FiBriefcase size={14} /> Browse Campaigns <FiArrowRight size={13} />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3.5 lg:space-y-4">
          {filteredApplications.map((a) => {
            const statusInfo = getStatusStyle(a.status);
            const StatusIcon = statusInfo.icon;
            const isEditing = editingId === a._id;

            return (
              <div
                key={a._id}
                className="bg-card border border-border-color/80 rounded-sm p-4 sm:p-5 lg:p-6 hover:border-primary/40 transition duration-200 shadow-2xs relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 lg:gap-4">
                  {/* Left: Campaign & Proposal Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-sm bg-surface border border-border-color/60 flex items-center justify-center shrink-0 text-primary">
                        <FiBriefcase size={15} />
                      </div>
                      <h3 className="text-sm lg:text-base font-bold text-foreground tracking-tight truncate">
                        {a.campaignId?.title || "Untitled Campaign"}
                      </h3>
                    </div>

                    {isEditing ? (
                      /* Inline Edit Form */
                      <div className="mt-4 p-3.5 lg:p-5 bg-surface/50 border border-border-color/60 rounded-sm space-y-3 lg:space-y-4 lg:max-w-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] lg:text-xs font-bold text-foreground">Edit Proposal Terms</span>
                          <button
                            onClick={cancelEdit}
                            className="text-muted hover:text-foreground transition"
                          >
                            <FiX size={15} />
                          </button>
                        </div>

                        <div>
                          <label className="block text-md lg:text-sm font-bold text-muted mb-1">
                            Pitch / Proposal Text
                          </label>
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            placeholder="Explain why you're a great fit..."
                            className="w-full px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl border border-border-color text-xs lg:text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 lg:gap-3">
                          <div>
                            <label className="block text-[10px] lg:text-xs font-bold text-muted  mb-1">
                              Price (PKR)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g. 15000"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-full px-3 lg:px-4 py-2 lg:py-2.5 rounded-sm border border-border-color text-xs lg:text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] lg:text-xs font-bold text-muted  mb-1">
                              Delivery (Days)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g. 5"
                              value={editDeliveryDays}
                              onChange={(e) => setEditDeliveryDays(e.target.value)}
                              className="w-full px-3 lg:px-4 py-2 lg:py-2.5 rounded-sm border border-border-color text-xs lg:text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => saveEdit(a._id)}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 px-4 lg:px-5 py-2 lg:py-2.5 rounded-md bg-primary text-white text-xs lg:text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                          >
                            <FiCheck size={14} />
                            {saving ? "Saving..." : "Save Changes"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-4 lg:px-5 py-2 lg:py-2.5 rounded-sm border border-border-color text-xs lg:text-sm font-semibold text-muted hover:text-foreground hover:bg-surface transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {a.proposalText && (
                          <div className="mt-3 relative pl-3.5 border-l-2 border-primary/40 text-xs lg:text-sm text-foreground/80 leading-relaxed bg-surface/40 p-2.5 lg:p-3.5 rounded-r-xl">
                            <p className="line-clamp-3">{a.proposalText}</p>
                          </div>
                        )}

                        {/* Proposed Chips */}
                        {(a.proposedPriceMinor || a.proposedDeliveryDays) && (
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            {a.proposedPriceMinor && (
                              <span className="inline-flex items-center gap-1 text-[11px] lg:text-xs font-bold px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30">
                                {money(a.proposedPriceMinor)}
                              </span>
                            )}
                            {a.proposedDeliveryDays && (
                              <span className="inline-flex items-center gap-1 text-[11px] lg:text-xs font-semibold px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-sm bg-surface text-foreground/70 border border-border-color/60">
                                <FiClock size={12} className="text-muted" />
                                {a.proposedDeliveryDays} {a.proposedDeliveryDays === 1 ? "day" : "days"} delivery
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Right: Status Pill & Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-2 lg:gap-3 justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-border-color/40">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] lg:text-xs font-semibold px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-full capitalize border shrink-0 ${statusInfo.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                        <StatusIcon size={12} />
                        {a.status}
                      </span>

                      {a.status === "pending" && (
                        <button
                          onClick={() => startEdit(a)}
                          className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl border border-border-color/80 bg-surface/50 hover:bg-card hover:border-primary/40 flex items-center justify-center text-foreground/70 hover:text-primary transition shrink-0 cursor-pointer shadow-2xs"
                          title="Edit application proposal"
                        >
                          <FiEdit2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}