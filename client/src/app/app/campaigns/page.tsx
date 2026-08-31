"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { toast } from "react-toastify";
import Link from "next/link";
import { FiEdit3, FiCheckCircle, FiXCircle, FiPauseCircle, FiTarget } from "react-icons/fi";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "open" | "draft" | "closed" | "cancelled">("all");
  
  const [title, setTitle] = useState("");
  const [goals, setGoals] = useState("");
  const [description, setDescription] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [category, setCategory] = useState("");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [deliverableItems, setDeliverableItems] = useState<{ item: string; quantity: number }[]>([]);
  const [newDeliverableItem, setNewDeliverableItem] = useState("");
  const [newDeliverableQty, setNewDeliverableQty] = useState("1");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/campaigns/my", { token: getToken()! });
      setCampaigns(data.campaigns || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const money = (minor?: number) => (minor ? `PKR ${(minor / 100).toLocaleString("en-PK")}` : "—");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/api/campaigns", {
        method: "POST",
        token: getToken()!,
        body: {
          title,
          goals,
          description,
          budgetMinMinor: budgetMin ? Number(budgetMin) * 100 : undefined,
          budgetMaxMinor: budgetMax ? Number(budgetMax) * 100 : undefined,
          category,
          deadline,
          deliverablesJson: deliverableItems,
        },
      });
      setShowForm(false);
      setTitle("");
      setGoals("");
      setDescription("");
      setBudgetMin("");
      setBudgetMax("");
      setCategory("");
      setDeadline("");
      setDeliverableItems([]);
      load();
      toast.success("Campaign created successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        token: getToken()!,
        body: { status },
      });
      load();
      toast.success(`Campaign status updated to ${status}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const addDeliverable = () => {
    if (!newDeliverableItem.trim()) return;
    setDeliverableItems((prev) => [
      ...prev,
      { item: newDeliverableItem.trim(), quantity: Number(newDeliverableQty) || 1 },
    ]);
    setNewDeliverableItem("");
    setNewDeliverableQty("1");
  };

  const removeDeliverable = (index: number) => {
    setDeliverableItems((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading && campaigns.length === 0) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredCampaigns = campaigns.filter((c) => {
    if (activeTab === "all") return true;
    return c.status === activeTab;
  });

  const counts = {
    all: campaigns.length,
    open: campaigns.filter((c) => c.status === "open").length,
    draft: campaigns.filter((c) => c.status === "draft").length,
    closed: campaigns.filter((c) => c.status === "closed").length,
    cancelled: campaigns.filter((c) => c.status === "cancelled").length,
  };

  const TAB_ICONS: Record<string, any> = {
    all: FiTarget,
    open: FiCheckCircle,
    draft: FiEdit3,
    closed: FiPauseCircle,
    cancelled: FiXCircle,
  };

  return (
    <div className="max-w-6xl pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">Campaigns</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage and track your brand partnership campaigns.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-sm bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition shadow-sm w-fit"
        >
          {showForm ? "Cancel" : "+ Post campaign"}
        </button>
      </div>

      {/* Campaign Creation Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface border border-border-color rounded-sm p-6 mb-8 space-y-4 shadow-lg">
          <h2 className="text-md font-bold text-foreground mb-2">Create New Campaign</h2>
          <input
            type="text"
            placeholder="Campaign Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-3 bg-background rounded-sm border border-border-color text-sm text-foreground placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary transition"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <textarea
              placeholder="Goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-sm bg-background border border-border-color text-sm text-foreground placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary transition"
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-sm bg-background border border-border-color text-sm text-foreground placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary transition"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Min budget (PKR)"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              className="bg-background px-4 py-3 rounded-sm border border-border-color text-sm text-foreground placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary transition"
            />
            <input
              type="number"
              placeholder="Max budget (PKR)"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              className="bg-background px-4 py-3 rounded-sm border border-border-color text-sm text-foreground placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary transition"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Category (e.g. Tech & Gadgets)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-background px-4 py-3 rounded-sm border border-border-color text-sm text-foreground placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary transition"
            />
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-background px-4 py-3 rounded-sm border border-border-color text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition"
            />
          </div>

          {/* Deliverables section */}
          <div className="pt-2">
            <label className="block text-sm font-bold text-foreground mb-2">Deliverables</label>
            <div className="space-y-2 mb-3">
              {deliverableItems.map((d, i) => (
                <div key={i} className="flex items-center justify-between bg-background border border-border-color rounded-sm px-4 py-2">
                  <span className="text-sm text-foreground font-medium">{d.quantity}× {d.item}</span>
                  <button type="button" onClick={() => removeDeliverable(i)} className="text-xs font-semibold text-primary hover:underline">Remove</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Instagram Reel"
                value={newDeliverableItem}
                onChange={(e) => setNewDeliverableItem(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-sm bg-background border border-border-color text-sm text-foreground placeholder-zinc-500 focus:outline-none"
              />
              <input
                type="number"
                min="1"
                value={newDeliverableQty}
                onChange={(e) => setNewDeliverableQty(e.target.value)}
                className="w-16 px-2 py-2.5 rounded-sm border border-border-color text-sm text-foreground bg-background text-center focus:outline-none"
              />
              <button
                type="button"
                onClick={addDeliverable}
                className="px-4 py-2.5 rounded-sm border border-border-color text-sm font-semibold text-foreground hover:bg-background transition"
              >
                + Add
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-sm bg-primary text-white text-sm font-bold hover:bg-primary/90 transition disabled:opacity-50 shadow-sm"
            >
              {submitting ? "Posting..." : "Save Post"}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      {!showForm && (
        <div className="flex items-center gap-2 border-b border-border-color pb-4 mb-6 overflow-x-auto">
          {(["all", "open", "draft", "closed", "cancelled"] as const).map((tab) => {
            const Icon = TAB_ICONS[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs font-bold capitalize transition shrink-0 ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface text-zinc-600 dark:text-zinc-400 hover:text-foreground border border-border-color"
                }`}
              >
                <Icon size={13} className={isActive ? "text-white" : "text-zinc-500"} />
                {tab}
                <span className={isActive ? "text-white/80" : "text-zinc-500"}>({counts[tab]})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Campaign List */}
      {!showForm && (
        filteredCampaigns.length === 0 ? (
          <div className="bg-surface border border-border-color rounded-sm p-12 text-center">
            <p className="text-foreground text-sm font-medium">No campaigns found in this view.</p>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Switch tabs or create a new campaign to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCampaigns.map((c) =>
              c.status === "draft" ? (
                <DraftCampaignCard key={c._id} c={c} money={money} updateStatus={updateStatus} />
              ) : (
                <CampaignCard key={c._id} c={c} money={money} updateStatus={updateStatus} />
              )
            )}
          </div>
        )
      )}
    </div>
  );
}

function DraftCampaignCard({ c, money, updateStatus }: { c: any; money: (m?: number) => string; updateStatus: (id: string, status: string) => void }) {
  return (
    <div className="bg-surface border border-dashed border-primary/40 rounded-sm p-5 transition hover:border-primary/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href={`/app/campaigns/${c._id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/30">
              <FiEdit3 size={11} />
              Draft
            </span>
            {c.category && <span className="text-xs text-zinc-500 dark:text-zinc-400">· {c.category}</span>}
          </div>
          <p className="text-sm font-bold text-foreground">
            {c.title || <span className="italic text-zinc-500 font-normal">Untitled campaign</span>}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {c.budgetMinMinor || c.budgetMaxMinor ? `${money(c.budgetMinMinor)} – ${money(c.budgetMaxMinor)}` : "No budget set"}
          </p>
        </Link>

        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            updateStatus(c._id, "open");
          }}
          className="shrink-0 text-xs font-bold px-4 py-2 rounded-sm bg-primary/10 text-primary border border-primary/40 hover:bg-primary hover:text-white transition"
        >
          Publish Campaign
        </button>
      </div>
    </div>
  );
}

function CampaignCard({ c, money, updateStatus }: { c: any; money: (m?: number) => string; updateStatus: (id: string, status: string) => void }) {
  const statusColors: Record<string, string> = {
    open: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    closed: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30",
    cancelled: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30",
  };

  const statusIcons: Record<string, any> = {
    open: FiCheckCircle,
    closed: FiPauseCircle,
    cancelled: FiXCircle,
  };
  const StatusIcon = statusIcons[c.status] || FiTarget;

  return (
    <div className="bg-surface border border-border-color rounded-sm p-5 transition hover:border-border-color/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href={`/app/campaigns/${c._id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-sm border ${statusColors[c.status] || ""}`}>
              <StatusIcon size={11} />
              {c.status}
            </span>
            {c.category && <span className="text-xs text-zinc-500 dark:text-zinc-400">· {c.category}</span>}
          </div>
          <p className="text-sm font-bold text-foreground">{c.title}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {money(c.budgetMinMinor)} – {money(c.budgetMaxMinor)}
          </p>

          {c.deliverablesJson?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.deliverablesJson.map((d: any, i: number) => (
                <span key={i} className="text-[11px] text-zinc-700 dark:text-zinc-300 bg-background border border-border-color rounded-sm px-2 py-0.5 font-medium">
                  {d.quantity}× {d.item}
                </span>
              ))}
            </div>
          )}
        </Link>

        <select
          value={c.status}
          onChange={(e) => updateStatus(c._id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-bold px-3 py-2 rounded-sm bg-background text-foreground capitalize cursor-pointer border border-border-color focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
        >
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="draft">Draft</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>
  );
}