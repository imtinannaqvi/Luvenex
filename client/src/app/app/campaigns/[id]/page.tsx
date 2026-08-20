"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
export default function CampaignApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [campaignData, applicationsData] = await Promise.all([
        apiFetch(`/api/campaigns/${id}`),
        apiFetch(`/api/campaigns/${id}/applications`, { token: getToken()! }),
      ]);
      setCampaign(campaignData.campaign);
      setApplications(applicationsData.applications || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load applicants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const money = (minor?: number) => (minor ? `PKR ${(minor / 100).toLocaleString("en-PK")}` : "—");

 const handleAccept = async (applicationId: string) => {
  setActionLoadingId(applicationId);
  try {
    const data = await apiFetch(`/api/applications/${applicationId}/accept`, {
      method: "POST",
      token: getToken()!,
    });
    toast.success("Applicant accepted — deal created!");
    router.push(`/app/deals/${data.deal._id}`);
  } catch (err: any) {
    toast.error(err.message);
  } finally {
    setActionLoadingId(null);
  }
};

  const handleReject = async (applicationId: string) => {
    setActionLoadingId(applicationId);
    try {
      await apiFetch(`/api/applications/${applicationId}/reject`, {
        method: "POST",
        token: getToken()!,
      });
      toast.success("Applicant rejected");
      setApplications((prev) =>
        prev.map((a) => (a._id === applicationId ? { ...a, status: "rejected" } : a))
      );
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      accepted: "bg-green-100 text-green-700",
      rejected: "bg-primary/10 text-primary",
      pending: "bg-yellow-100 text-yellow-700",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

 return (
  <div className="max-w-3xl w-full space-y-5">
    {/* Back Navigation */}
    <button
      onClick={() => router.push("/app/campaigns")}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors px-3 py-1.5 rounded-xl hover:bg-surface border border-transparent hover:border-line"
    >
      <span>←</span> Back to campaigns
    </button>

    {/* Campaign Header Card
    {campaign && (
      <div className="bg-paper border border-line rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            {campaign.category && (
              <span className="inline-block text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-md px-2.5 py-0.5 uppercase tracking-wide">
                {campaign.category}
              </span>
            )}
            <h1 className="text-lg sm:text-xl font-bold text-ink italic tracking-tight leading-normal">
              {campaign.title}
            </h1>
          </div>

          <div className="sm:text-right shrink-0 pt-0.5">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-0.5">
              Budget
            </span>
            <p className="text-sm font-extrabold text-ink">
              {money(campaign.budgetMinMinor)} – {money(campaign.budgetMaxMinor)}
            </p>
          </div>
        </div>
      </div>
    )} */}

    {/* Section Title */}
    <div className="flex items-center justify-between pt-1">
      <h2 className="text-sm sm:text-base font-bold text-foreground italic tracking-tight">
        Applicants <span className="text-muted font-normal text-xs">({applications.length})</span>
      </h2>
    </div>

    {/* Applicants List */}
    {applications.length === 0 ? (
      <div className="bg-background border border-line/80 rounded-2xl p-8 text-center shadow-2xs">
        <p className="text-xs text-muted font-medium">No applications received yet.</p>
      </div>
    ) : (
      <div className="space-y-3">
        {applications.map((a) => (
          <div
            key={a._id}
            className="bg-background border border-line rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-line/80 transition-all space-y-3.5"
          >
            {/* Applicant Header & Status */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Avatar / Initial Bubble */}
                <div className="w-9 h-9 rounded-xl bg-surface border border-line/60 flex items-center justify-center shrink-0 text-foreground font-bold text-xs">
                  {a.influencerId?.avatar ? (
                    <img
                      src={a.influencerId.avatar}
                      alt={a.influencerId?.name}
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    a.influencerId?.name?.[0]?.toUpperCase() || "U"
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate leading-snug">
                    {a.influencerId?.name || "Unknown Applicant"}
                  </p>
                  <p className="text-[11px] text-muted truncate">
                    {a.influencerId?.email || "—"}
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full capitalize border shrink-0 ${statusColor(
                  a.status
                )}`}
              >
                {a.status}
              </span>
            </div>

            {/* Proposal Text Card */}
            {a.proposalText && (
              <div className="bg-background border border-line/60 rounded-xl p-3 text-xs text-foreground leading-relaxed break-words">
                {a.proposalText}
              </div>
            )}

            {/* Bottom Meta & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                {a.proposedPriceMinor && (
                  <span className="inline-flex items-center text-xs font-bold text-foreground bg-surface border border-line/60 rounded-lg px-2.5 py-1">
                    {money(a.proposedPriceMinor)}
                  </span>
                )}
                {a.proposedDeliveryDays && (
                  <span className="inline-flex items-center text-xs font-medium text-foreground bg-surface border border-line/60 rounded-lg px-2.5 py-1">
                    ⚡ {a.proposedDeliveryDays} days delivery
                  </span>
                )}
              </div>

              {a.status === "pending" && (
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => handleReject(a._id)}
                    disabled={actionLoadingId === a._id}
                    className="text-xs font-semibold px-4.5 py-2.5 rounded-sm border border-line text-foreground hover:bg-primary transition disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAccept(a._id)}
                    disabled={actionLoadingId === a._id}
                    className="text-xs font-semibold px-4.5 py-2.5 rounded-sm bg-emerald-600 text-foreground hover:bg-emerald-700 transition shadow-2xs disabled:opacity-50"
                  >
                    Accept
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
}