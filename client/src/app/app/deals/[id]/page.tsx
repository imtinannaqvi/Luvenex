"use client";

import { useState, useEffect } from "react";
import { getToken,getUser } from "@/lib/auth";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiMessageSquare,
  FiCheck,
  FiClock,
  FiShield,
  FiSend,
  FiUser,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiXCircle,
  FiPackage,
  FiStar,
} from "react-icons/fi";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";

const STEPS = ["funded", "agreed", "in_progress", "delivered", "approved", "completed"];

const STEP_LABELS: Record<string, string> = {
  funded: "Funded",
  agreed: "Agreed",
  in_progress: "In Progress",
  delivered: "Delivered",
  approved: "Approved",
  completed: "Completed",
};

export default function DealWorkSpacePage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;

  const [deal, setDeal] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState("");
  const [showDeliverForm, setShowDeliverForm] = useState(false);
  const [activity, setActivity] = useState<any[]>([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewBody, setReviewBody] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasComplained, setHasComplained] = useState(false);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintReason, setComplaintReason] = useState("no_response");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [deliveryFiles, setDeliveryFiles] = useState<File[]>([]);
  const [showCancelForm, setShowCancelForm] = useState(false);
const [cancelReason, setCancelReason] = useState("");
const [submittingCancel, setSubmittingCancel] = useState(false);
const [showRevisionForm, setShowRevisionForm] = useState(false);
const [revisionNote, setRevisionNote] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(`/api/deals/${dealId}`, { token: getToken()! });
      setDeal(data.deal);

      const activityData = await apiFetch(`/api/deals/${dealId}/activity`, { token: getToken()! });
      setActivity(activityData.activity || []);

      if (data.deal.status === "completed") {
        const reviewStatus = await apiFetch(`/api/deals/${dealId}/my-review-status`, { token: getToken()! });
        setHasReviewed(reviewStatus.hasReviewed);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUser(getUser());
    load();
  }, [dealId]);

  const money = (minor: number) => `PKR ${(minor / 100).toLocaleString("en-PK")}`;
  const formatEventType = (type: string) => type.replace(/_/g, " ");

  // percentage next to "Platform Fee", derived from the actual stored fee
  const feePercent = (feeMinor: number) =>
    deal && deal.priceMinor > 0 && feeMinor > 0
      ? ` (${Math.round((feeMinor / deal.priceMinor) * 100)}%)`
      : "";

  const doAction = async (action: string, body?: any) => {
    setActionLoading(true);
    setError("");
    try {
      await apiFetch(`/api/deals/${dealId}/${action}`, {
        method: "POST",
        token: getToken()!,
        body,
      });

      // After the deal is started, take the user to the conversation with the
      // other party. The deal id is passed so the messages page can offer a way back.
      if (action === "start") {
        router.push(`/app/messages?with=${otherParty?._id}&deal=${dealId}`);
        return;
      }

      await load();
      setShowDeliverForm(false);
      setDeliveryNote("");
    } catch (err: any) {
      toast(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const submitDelivery = async () => {
  setActionLoading(true);
  try {
    const formData = new FormData();
    formData.append("deliveryNote", deliveryNote);
    deliveryFiles.forEach((f) => formData.append("files", f));

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/deals/${dealId}/deliver`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message);

    setDeal(data.deal);
    setShowDeliverForm(false);
  } catch (err: any) {
    alert(err.message);
  } finally {
    setActionLoading(false);
  }
};
  const submitReview = async () => {
    if (!reviewRating) {
      toast("Please select a star rating");
      return;
    }
    setSubmittingReview(true);
    try {
      await apiFetch(`/api/deals/${dealId}/review`, {
        method: "POST",
        token: getToken()!,
        body: { rating: reviewRating, body: reviewBody },
      });
      setHasReviewed(true);
      setShowReviewForm(false);
    } catch (err: any) {
      toast(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const submitComplaint = async () => {
    if (!complaintDescription.trim()) {
      toast("Please describe what happened");
      return;
    }
    setSubmittingComplaint(true);
    try {
      await apiFetch(`/api/deals/${dealId}/complaint`, {
        method: "POST",
        token: getToken()!,
        body: { reason: complaintReason, description: complaintDescription },
      });
      setHasComplained(true);
      setShowComplaintForm(false);
    } catch (err: any) {
      toast(err.message);
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const handleDeliver = async () => {
  setActionLoading(true);
  try {
    const formData = new FormData();
    formData.append("deliveryNote", deliveryNote);
    deliveryFiles.forEach((f) => formData.append("files", f));

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/deals/${dealId}/deliver`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message);

    setDeal(data.deal);
    setShowDeliverForm(false);
  } catch (err: any) {
    alert(err.message);
  } finally {
    setActionLoading(false);
  }
};

const submitRevisionRequest = async () => {
  setActionLoading(true);
  try {
    await apiFetch(`/api/deals/${dealId}/request-revision`, {
      method: "POST",
      token: getToken()!,
      body: { revisionNote },
    });
    setShowRevisionForm(false);
    setRevisionNote("");
    await load();
  } catch (err: any) {
    toast(err.message);
  } finally {
    setActionLoading(false);
  }
};


const submitCancellationRequest = async () => {
  if (!cancelReason.trim()) {
    toast("Please provide a reason");
    return;
  }
  setSubmittingCancel(true);
  try {
    await apiFetch(`/api/deals/${dealId}/request-cancellation`, {
      method: "POST",
      token: getToken()!,
      body: { reason: cancelReason },
    });
    setShowCancelForm(false);
    setCancelReason("");
    await load();
  } catch (err: any) {
    toast(err.message);
  } finally {
    setSubmittingCancel(false);
  }
};

const respondToCancellation = async (agree: boolean) => {
  setActionLoading(true);
  try {
    await apiFetch(`/api/deals/${dealId}/respond-cancellation`, {
      method: "POST",
      token: getToken()!,
      body: { agree },
    });
    await load();
  } catch (err: any) {
    toast(err.message);
  } finally {
    setActionLoading(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error)
    return (
      <div className="bg-primary/10 border border-primary/20 text-primary text-xs font-medium rounded-xl p-4 max-w-3xl mx-auto my-6 flex items-center gap-2">
        <FiAlertCircle size={16} className="shrink-0" />
        <span>{error}</span>
      </div>
    );

  if (!deal) return null;

  const isBrand = user?.role === "brand";
  const isInfluencer = user?.role === "influencer";
  const stepIndex = STEPS.indexOf(deal.status);
  const otherParty = isBrand ? deal.influencerId : deal.brandId;
  const isTerminalState = ["cancelled", "disputed", "refunded"].includes(deal.status);

 return (
    <div className="max-w-6xl  px-4 sm:px-0 py-4 sm:py-6 space-y-5">
      {/* Back Button */}
      <button
        onClick={() => router.push("/app/deals")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition duration-150 group"
      >
        <FiArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to deals
      </button>

      {/* Main Workspace Card */}
      <div className="bg-background border border-line rounded-sm p-5 sm:p-7 shadow-xs relative overflow-hidden">
        {/* Deal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line/60">
          <div className="flex items-start gap-3.5 min-w-0">
            {/* Party Avatar / Initial Badge */}
            <div className="w-12 h-12 rounded-sm bg-surface border border-line/70 flex items-center justify-center shrink-0 text-foreground font-bold text-sm shadow-2xs">
              {otherParty?.avatar ? (
                <img
                  src={otherParty.avatar}
                  alt={otherParty.name || "User"}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                otherParty?.name?.charAt(0).toUpperCase() || <FiUser size={18} />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-md sm:text-md font-bold text-foreground truncate ">
                  {deal.title}
                </h1>
              </div>
             
 
              <p className="text-xs sm:text-sm text-muted mt-0.5 italic flex items-center gap-1.5">
                <span>Working with</span>
                <span className="font-semibold text-foreground">{otherParty?.name || "Partner"}</span>
                <span className="text-xs px-2 py-0.5 rounded-sm bg-surface border border-line/60 font-medium text-foreground capitalize">
                  {isBrand ? "Influencer" : "Brand"}
                </span>
              </p>
            </div>
          </div>

          <Link
            href={`/app/messages?with=${otherParty?._id}&deal=${dealId}`}
            className="inline-flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2.5 rounded-md border border-line bg-surface hover:bg-surface hover:border-primary/40 text-foreground transition shadow-2xs shrink-0"
          >
            <FiMessageSquare size={14} className="text-primary-dark" />
            Message
          </Link>
        </div>

        {/* Stepper Status Bar */}
        {!isTerminalState ? (
          <div className="py-6 border-b border-line/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold  text-foreground flex items-center gap-1.5">
                <FiClock size={12} /> Progress Tracker
              </span>
              <span className="text-sm px-2.5 py-1.5 rounded-sm  border bg-primary text-white border-primary">
                {deal.status.replace(/_/g, " ")}
              </span>
            </div>

            {/* Visual Stepper */}
            <div className="relative pt-2 pb-1">
              <div className="flex items-center justify-between relative z-10">
                {STEPS.map((step, i) => {
                  const isPassed = i < stepIndex;
                  const isCurrent = i === stepIndex;

                  return (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border ${isPassed
                            ? "bg-primary text-paper border-primary/20 shadow-2xs"
                            : isCurrent
                              ? "bg-background text-primary border-primary ring-4 ring-primary/15 font-extrabold"
                              : "bg-surface text-muted/60 border-line"
                          }`}
                      >
                        {isPassed ? <FiCheck size={14} /> : i + 1}
                      </div>
                      <span
                        className={`text-[11px] sm:text-[11px] font-medium mt-1.5 text-center hidden sm:block ${isCurrent
                            ? "text-primary font-bold"
                            : isPassed
                              ? "text-foreground"
                              : "text-muted/60"
                          }`}
                      >
                        {STEP_LABELS[step]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Connecting Progress Line */}
              <div className="absolute top-5 sm:top-6 left-[8%] right-[8%] h-0.5 bg-line/80 z-0 -translate-y-1/2">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, (stepIndex / (STEPS.length - 1)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 border-b border-line/60 flex items-center gap-2">
            <span className="text-xs font-semibold text-muted">Status:</span>
            <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border bg-rose-50 text-rose-700 border-rose-200">
              {deal.status.replace(/_/g, " ")}
            </span>
          </div>
        )}

        {/* Escrow Financial Summary */}
        <div className="my-6 bg-background border border-line/80 rounded-md p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-line/40">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <FiShield className="text-primary" size={15} />
              <span>Escrow Payment Summary</span>
            </div>
            <span className="text-[10px] font-semibold text-white bg-primary border px-3 py-1.5 rounded-md">
              Protected
            </span>
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between items-center text-muted">
              <span>Agreed Deal Amount</span>
              <span className="text-foreground font-medium">{money(deal.priceMinor)}</span>
            </div>
            {isBrand && (
              <div className="flex justify-between items-center text-muted">
                <span>Platform Fee{feePercent(deal.brandFeeMinor)}</span>
                <span className="text-foreground font-medium">{money(deal.brandFeeMinor)}</span>
              </div>
            )}
            {isInfluencer && (
              <div className="flex justify-between items-center text-muted">
                <span>Platform Fee{feePercent(deal.influencerFeeMinor)}</span>
                <span className="text-rose-600 font-medium">
                  -{money(deal.influencerFeeMinor)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2.5 mt-1 border-t border-line/60 text-sm font-bold">
              <span className="text-foreground">{isBrand ? "Total Payable Amount" : "Net Earnings"}</span>
              <span className="text-base text-primary font-bold">
                {isBrand
                  ? money(deal.priceMinor + deal.brandFeeMinor)
                  : money(deal.priceMinor - deal.influencerFeeMinor)}
              </span>
            </div>
          </div>
        </div>

        {/* Deal Description */}
        {deal.description && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
              <FiFileText size={13} /> Description 
            </h3>
            <div className="p-4 rounded-sm bg-background border border-line/60 text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line">
              {deal.description}
            </div>
          </div>
        )}
     

{(deal.deliveryNote || deal.deliveryFiles?.length > 0) && (
  <div className="mb-6">
    <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
      <FiPackage size={13} className="text-foreground" /> Submitted Delivery Note
    </h3>
    {deal.deliveryNote && (
      <div className="p-4 rounded-xl bg-background border border-border-color text-xs sm:text-sm text-foreground leading-relaxed">
        {deal.deliveryNote}
      </div>
    )}

    {deal.deliveryFiles?.length > 0 && (
      <div className="grid grid-cols-3 gap-2 mt-3">
        {deal.deliveryFiles.map((f: string, i: number) => {
          const isVideo = f.match(/\.(mp4|webm|mov)$/i);
          return isVideo ? (
            <video key={i} src={`${process.env.NEXT_PUBLIC_API_URL}${f}`} controls className="rounded-sm border border-line w-full" />
          ) : (
            <img key={i} src={`${process.env.NEXT_PUBLIC_API_URL}${f}`} className="rounded-sm border border-line w-full object-cover" alt="" />
          );
        })}
      </div>
    )}
  </div>
)}

        {/* Role-Aware Actions Bar */}
        <div className="pt-4 border-t border-line/60 flex flex-wrap items-center gap-2.5">
          {isInfluencer && deal.status === "draft" && (
            <button
              disabled={actionLoading}
              onClick={() => doAction("accept")}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-sm bg-primary text-paper text-xs font-semibold hover:opacity-90 transition shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <FiCheckCircle size={14} /> Accept Offer
            </button>
          )}

          {isBrand && deal.status === "agreed" && (
            <button
              disabled={actionLoading}
              onClick={() => doAction("fund")}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-primary text-paper text-xs font-semibold hover:opacity-90 transition shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <FiShield size={14} /> Fund Escrow
            </button>
          )}

          {deal.status === "funded" && (
            <button
              disabled={actionLoading}
              onClick={() => doAction("start")}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-sm bg-background text-paper text-xs font-semibold hover:bg-surface transition shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <FiClock size={14} /> Start Work
            </button>
          )}

          {isInfluencer && deal.status === "in_progress" && !showDeliverForm && (
            <button
              onClick={() => setShowDeliverForm(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-sm bg-primary text-paper text-xs font-semibold hover:opacity-90 transition shadow-2xs cursor-pointer"
            >
              <FiSend size={14} /> Deliver Work
            </button>
          )}

         {isBrand && deal.status === "delivered" && (
  <button
    disabled={actionLoading}
    onClick={() => doAction("approve")}
    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-surface text-foreground text-xs font-semibold hover:bg-primary transition shadow-2xs disabled:opacity-50 cursor-pointer"
  >
    <FiCheckCircle size={14} /> Approve & Release Funds
  </button>
)}

          {isBrand && deal.status === "approved" && (
            <button
              disabled={actionLoading}
              onClick={() => doAction("complete")}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-sm bg-surface text-foreground text-xs font-semibold hover:bg-primary transition shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <FiCheckCircle size={14} /> Mark Completed
            </button>
          )}
        </div>

        {/* Request Revision — brand only, and only after the influencer delivers */}
        {isBrand && deal.status === "delivered" && (
          <div className="pt-4">
            {!showRevisionForm ? (
              <button
                disabled={actionLoading}
                onClick={() => setShowRevisionForm(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-sm border border-line bg-surface text-foreground text-xs font-semibold hover:border-primary/40 hover:text-primary transition shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <FiRefreshCw size={14} /> Request Revision
              </button>
            ) : (
              <div className="bg-surface/40 border border-line/40 rounded-2xl p-4 space-y-3">
                <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <FiRefreshCw size={13} className="text-amber-600" /> Request a Revision
                </label>
                <textarea
                  placeholder="What needs to be revised?"
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowRevisionForm(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground transition">
                    Cancel
                  </button>
                  <button
                    disabled={actionLoading || !revisionNote.trim()}
                    onClick={submitRevisionRequest}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-paper text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                  >
                    <FiSend size={13} /> Submit Revision Request
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Revision requested — shown to the influencer while they rework the delivery */}
        {deal.revisionNote && deal.status === "in_progress" && (
          <div className="pt-4">
            <h3 className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-1.5">
              <FiRefreshCw size={13} /> Revision Requested
            </h3>
            <div className="p-4 rounded-md bg-amber-50/60 border border-amber-200/70 text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-line">
              {deal.revisionNote}
            </div>
          </div>
        )}

        {/* Cancellation controls */}
        <div className="pt-4">
          {deal.cancellationRequest?.status === "pending" ? (
            deal.cancellationRequest.requestedBy === user?.id ? (
              <div className="text-xs font-semibold text-amber-700 bg-background border border-amber-200/80 px-4 py-3 rounded-xl">
                Cancellation requested — waiting for the other party to respond.
              </div>
            ) : (
              <div className="bg-surface/40 border border-line/40 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-foreground">
                  The other party wants to cancel this deal.
                </p>
                <p className="text-xs text-muted">Reason: {deal.cancellationRequest.reason}</p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => respondToCancellation(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-primary text-paper text-xs font-semibold disabled:opacity-50"
                  >
                    Agree to cancel
                  </button>
                  <button
                    onClick={() => respondToCancellation(false)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl border border-line text-xs font-semibold disabled:opacity-50"
                  >
                    Reject request
                  </button>
                </div>
              </div>
            )
          ) : !["completed", "cancelled", "refunded"].includes(deal.status) && !showCancelForm ? (
            <button
              onClick={() => setShowCancelForm(true)}
              className="px-5 py-2 rounded-sm border border-line text-white bg-primary hover:bg-primary/90 text-xs font-semibold transition"
            >
              Request Cancellation
            </button>
          ) : showCancelForm ? (
            <div className="bg-surface/40 border border-line/40 rounded-2xl p-4 space-y-3">
              <textarea
                placeholder="Why do you want to cancel this deal?"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs bg-background"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCancelForm(false)} className="px-4 py-2 rounded-xl text-xs text-muted">
                  Cancel
                </button>
                <button
                  onClick={submitCancellationRequest}
                  disabled={submittingCancel}
                  className="px-4 py-2 rounded-xl bg-primary text-paper text-xs font-semibold disabled:opacity-50"
                >
                  Submit request
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {deal.status === "completed" && (
          <div className="mt-5 pt-5 border-t border-line/60">
            {hasReviewed ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-background border border-emerald-200/80 px-4 py-3 rounded-xl">
                <FiCheckCircle size={15} />
                <span>You've reviewed this deal — thank you for your feedback.</span>
              </div>
            ) : !showReviewForm ? (
              <button
                onClick={() => setShowReviewForm(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-paper text-xs font-semibold hover:opacity-90 transition shadow-2xs cursor-pointer"
              >
                <FiStar size={14} /> Leave a Review
              </button>
            ) : (
              <div className="bg-surface/40 border border-line/40 rounded-2xl p-4 space-y-3">
                <label className="block text-xs font-bold text-foreground">
                  How was your experience with {otherParty?.name}?
                </label>

                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-0.5"
                    >
                      <FiStar
                        size={24}
                        className={star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-line"}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  placeholder="Share details about your experience (optional)..."
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground transition"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={submittingReview || !reviewRating}
                    onClick={submitReview}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-paper text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                  >
                    <FiSend size={13} /> Submit Review
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {deal.status === "auto_released" && isInfluencer && (
          <div className="mt-5 pt-5 border-t border-line/60">
            {hasComplained ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-4 py-3 rounded-xl">
                <FiAlertCircle size={15} />
                <span>Your complaint has been filed and is under review by our team.</span>
              </div>
            ) : !showComplaintForm ? (
              <button
                onClick={() => setShowComplaintForm(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/10 transition cursor-pointer"
              >
                <FiAlertCircle size={14} /> File a Complaint
              </button>
            ) : (
              <div className="bg-surface/40 border border-line/40 rounded-2xl p-4 space-y-3">
                <label className="block text-xs font-bold text-foreground">
                  What went wrong with this deal?
                </label>

                <select
                  value={complaintReason}
                  onChange={(e) => setComplaintReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs bg-background"
                >
                  <option value="no_response">Brand never responded</option>
                  <option value="poor_communication">Poor communication</option>
                  <option value="unfair_rejection">Unfair rejection of delivered work</option>
                  <option value="other">Other</option>
                </select>

                <textarea
                  placeholder="Describe what happened..."
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowComplaintForm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground transition"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={submittingComplaint || !complaintDescription.trim()}
                    onClick={submitComplaint}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-paper text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                  >
                    <FiSend size={13} /> Submit Complaint
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

{showDeliverForm && (
  <div className="mt-5 pt-5 border-t border-line/60 space-y-3 bg-surface/40 p-4 rounded-2xl border border-line/40">
    <label className="block text-xs font-bold text-foreground">Delivery Notes & Links</label>
    <textarea
      placeholder="Provide link to content, draft material, or proof of completion..."
      value={deliveryNote}
      onChange={(e) => setDeliveryNote(e.target.value)}
      rows={3}
      className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
    />

   <div className="space-y-2">
  <label className="block text-sm font-bold text-foreground">
    Attach files
  </label>

  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-background hover:bg-surface hover:border-black transition-all group">
    <div className="flex flex-col items-center justify-center text-center p-3">
      <svg
        className="w-5 h-5 text-foreground group-hover:text-foreground mb-1.5 transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
      </svg>
      <p className="text-xs font-semibold text-gray-700">
        <span className="text-red-600 font-bold">Upload files</span> or drag and drop
      </p>
      <p className="text-[10px] text-foreground mt-0.5">Images or videos</p>
    </div>
    <input
      type="file"
      accept="image/*,video/*"
      multiple
      onChange={(e) => setDeliveryFiles(Array.from(e.target.files || []))}
      className="hidden"
    />
  </label>

  {deliveryFiles.length > 0 && (
    <p className="text-xs font-medium text-gray-600">
      {deliveryFiles.length} file(s) selected
    </p>
  )}
</div>
    <div className="flex gap-2 justify-end">
      <button
        type="button"
        onClick={() => setShowDeliverForm(false)}
        className="px-4 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground transition"
      >
        Cancel
      </button>
      <button
        disabled={actionLoading || !deliveryNote.trim()}
        onClick={submitDelivery}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-paper text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
      >
        <FiSend size={13} /> Confirm Delivery
      </button>
    </div>
  </div>
)}
      </div>

      {activity.length > 0 && (
        <div className="bg-background border border-line rounded-sm p-5 sm:p-6 shadow-2xs">
          <h3 className="text-sm font-bold text-foreground  mb-5 flex items-center gap-2">
            <FiClock size={14} className="text-primary" /> Activity History
          </h3>
          <div className="relative pl-3 space-y-5 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-line/70">
            {activity.map((a) => (
              <div key={a._id} className="relative flex gap-3 text-xs z-10">
                <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-foreground mt-1 shrink-0" />
                <div className="flex-1 bg-background border border-line/40 rounded-sm p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-foreground font-bold capitalize">
                      {formatEventType(a.type)}
                    </p>
                    <span className="text-[10px] text-foreground">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {a.message && (
                    <p className="text-xs text-foreground mt-1 leading-relaxed">{a.message}</p>
                  )}
                  {a.actorId?.name && (
                    <p className="text-[10px] text-foreground mt-1">
                      Action by <span className="font-semibold text-foreground">{a.actorId.name}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}