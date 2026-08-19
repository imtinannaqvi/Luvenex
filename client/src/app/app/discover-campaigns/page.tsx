"use client";

import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";
import { getToken } from "@/lib/auth";
import { useState, useEffect } from "react";

export default function DiscoverCampaignPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");

  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [proposalText, setProposalText] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [proposedDeliveryDays, setProposedDeliveryDays] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [attachedPortfolioItemId, setAttachedPortfolioItemId] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      const data = await apiFetch(`/api/campaigns?${params.toString()}`);
      setCampaigns(data.campaigns || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [category]);

  useEffect(() => {
    if (applyingId) {
      apiFetch("/api/influencers/me", { token: getToken()! })
        .then((data) => setPortfolioItems(data.profile.portfolio || []))
        .catch(() => setPortfolioItems([]));
    }
  }, [applyingId]);

  const money = (minor?: number) =>
    minor ? `PKR ${(minor / 100).toLocaleString("en-PK")}` : "—";

  const startApply = (id: string) => {
    setApplyingId(applyingId === id ? null : id);
    setProposalText("");
    setProposedPrice("");
    setProposedDeliveryDays("");
  };

  const submitApplication = async (campaignId: string) => {
    if (!proposalText) {
      toast.error("Please write a proposal");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch(`/api/campaigns/${campaignId}/apply`, {
        method: "POST",
        token: getToken()!,
        body: {
          proposalText,
          proposedPriceMinor: proposedPrice ? Number(proposedPrice) * 100 : undefined,
          proposedDeliveryDays: proposedDeliveryDays ? Number(proposedDeliveryDays) : undefined,
          attachedPortfolioItemId: attachedPortfolioItemId || undefined,
        },
      });
      toast.success("Application submitted!");
      setAppliedIds((prev) => [...prev, campaignId]);
      setApplyingId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to apply");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl md:max-w-3xl lg:max-w-4xl mx-4 md:mx-8 lg:mx-10">
      <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mb-1">
        Browse Campaigns
      </h1>
      <p className="text-sm md:text-base text-muted mb-6">
        Find open campaigns and pitch your proposal.
      </p>

      <div className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="Filter by category..."
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3.5 py-2 md:py-2.5 rounded-md border border-line text-sm bg-background flex-1 max-w-xs md:max-w-sm"
        />
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-paper border border-line rounded-2xl p-8 text-center">
          <p className="text-muted text-sm md:text-base">
            No open campaigns right now — check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => {
            const alreadyApplied = appliedIds.includes(c._id);
            return (
              <div
                key={c._id}
                className="bg-background border border-line rounded-sm p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-base font-semibold text-foreground">{c.title}</p>
                    <p className="text-xs md:text-sm text-muted mt-1">
                      by {c.brandId?.name || "—"}
                    </p>
                    {c.description && (
                      <p className="text-xs md:text-sm text-foreground mt-2.5 leading-relaxed line-clamp-2">
                        {c.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <span className="text-xs md:text-sm font-semibold text-foreground bg-surface px-3 py-1 rounded-full">
                        {money(c.budgetMinMinor)} – {money(c.budgetMaxMinor)}
                      </span>
                      {c.category && (
                        <span className="text-xs md:text-sm text-foreground px-3 py-1 rounded-full bg-surface border border-line">
                          {c.category}
                        </span>
                      )}
                      {c.deadline && (
                        <span className="text-xs md:text-sm text-foreground px-3 py-1 rounded-full bg-surface border border-line">
                          Due {new Date(c.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {alreadyApplied ? (
                    <span className="text-xs md:text-sm font-medium px-3.5 py-1.5 rounded-sm bg-green-100 text-green-700 shrink-0 self-start sm:self-auto">
                      Applied ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => startApply(c._id)}
                      className="text-xs md:text-sm font-semibold px-4 py-2 rounded-sm bg-primary text-paper hover:bg-primary-dark transition shrink-0 self-start sm:self-auto"
                    >
                      {applyingId === c._id ? "Cancel" : "Apply"}
                    </button>
                  )}
                </div>

                {applyingId === c._id && (
                  <div className="mt-4 pt-4 border-t border-line space-y-3">
                    <textarea
                      placeholder="Write your proposal..."
                      value={proposalText}
                      onChange={(e) => setProposalText(e.target.value)}
                      rows={4}
                      className="w-full px-3.5 py-2.5 rounded-sm border bg-background border-line text-sm md:text-base"
                    />
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="number"
                        placeholder="Your price (PKR)"
                        value={proposedPrice}
                        onChange={(e) => setProposedPrice(e.target.value)}
                        className="flex-1 px-3.5 py-2 md:py-2.5 rounded-sm border bg-background border-line text-sm md:text-base"
                      />
                      <input
                        type="number"
                        placeholder="Delivery days"
                        value={proposedDeliveryDays}
                        onChange={(e) => setProposedDeliveryDays(e.target.value)}
                        className="flex-1 px-3.5 py-2 md:py-2.5 rounded-sm border bg-background border-line text-sm md:text-base"
                      />
                    </div>

                    {portfolioItems.length > 0 && (
                      <select
                        value={attachedPortfolioItemId}
                        onChange={(e) => setAttachedPortfolioItemId(e.target.value)}
                        className="w-full px-3.5 py-2 md:py-2.5 rounded-sm border bg-background border-line text-sm md:text-base"
                      >
                        <option value="">Attach a portfolio item (optional)</option>
                        {portfolioItems.map((item: any) => (
                          <option key={item._id} value={item._id}>
                            {item.title}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      onClick={() => submitApplication(c._id)}
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-sm bg-primary text-paper text-sm md:text-base font-semibold hover:bg-primary-dark transition disabled:opacity-50"
                    >
                      {submitting ? "Submitting..." : "Submit application"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}