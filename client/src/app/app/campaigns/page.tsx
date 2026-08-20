"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { toast } from "react-toastify";
import Link from "next/link";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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

  const load = async() => {
    setLoading(true);

    try {
        // Scoped to the logged-in brand — do NOT use "/api/campaigns" here,
        // that endpoint is the public marketplace listing (all brands' open campaigns).
        const data = await apiFetch("/api/campaigns/my", { token: getToken()! });
        setCampaigns(data.campaigns || []);
    } finally {
        setLoading(false);
    }
  };

  useEffect(()=> {
    load()
  },[])

  const money = (minor?: number) => (minor ? `PKR ${(minor / 100).toLocaleString("en-PK")}` : "—");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/api/campaigns", {
        method: "POST",
        token: getToken()!,
        body: {
          title, goals, description,
          budgetMinMinor: budgetMin ? Number(budgetMin) * 100 : undefined,
          budgetMaxMinor: budgetMax ? Number(budgetMax) * 100 : undefined,
          category, deadline,
        },
      });
      setShowForm(false);
      setTitle(""); setGoals(""); setDescription(""); setBudgetMin(""); setBudgetMax(""); setCategory(""); setDeadline("");
      load();
    } catch (err: any) {
      toast(err.message);
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
  } catch (err: any) {
    toast(err.message);
  }
};
const addDeliverable = () => {
  if (!newDeliverableItem.trim()) return;
  setDeliverableItems((prev) => [...prev, { item: newDeliverableItem.trim(), quantity: Number(newDeliverableQty) || 1 }]);
  setNewDeliverableItem("");
  setNewDeliverableQty("1");
};

const removeDeliverable = (index: number) => {
  setDeliverableItems((prev) => prev.filter((_, i) => i !== index));
};



  if(loading) {
    return(
        <div className="min-h-[60vh] flex justify-center items-center">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
    )
  }

  return (
  <div>
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Campaigns</h1>
      <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg bg-primary text-paper text-sm font-medium hover:bg-primary-dark transition">
        {showForm ? "Cancel" : "+ Post campaign"}
      </button>
    </div>

    {showForm && (
      <form onSubmit={handleCreate} className="bg-surface border border-line rounded-2xl p-6 mb-6 space-y-3">
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3.5 py-2.5  bg-background rounded-xl border border-line text-sm" />
        <textarea placeholder="Goals" value={goals} onChange={(e) => setGoals(e.target.value)} rows={2} className="w-full px-3.5 py-2.5 rounded-xl  bg-background border border-line text-sm" />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3.5  bg-background py-2.5 rounded-xl border border-line text-sm" />
        <div className="flex gap-3">
          <input type="number" placeholder="Min budget (PKR)" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} className="flex-1  bg-background px-3.5 py-2.5 rounded-xl border border-line text-sm" />
          <input type="number" placeholder="Max budget (PKR)" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} className="flex-1  bg-background px-3.5 py-2.5 rounded-xl border border-line text-sm" />
        </div>
        <div className="flex gap-3">
          <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1  bg-background px-3.5 py-2.5 rounded-xl border border-line text-sm" />
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="flex-1  bg-background px-3.5 py-2.5 rounded-xl border border-line text-sm" />
        </div>

        {/* ✅ Deliverables section — added here */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Deliverables (optional)</label>
          <div className="space-y-2 mb-2">
            {deliverableItems.map((d, i) => (
              <div key={i} className="flex items-center justify-between bg-surface border border-line rounded-lg px-3 py-2">
                <span className="text-xs text-foreground">{d.quantity}× {d.item}</span>
                <button type="button" onClick={() => removeDeliverable(i)} className="text-xs text-primary">Remove</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Instagram Reel"
              value={newDeliverableItem}
              onChange={(e) => setNewDeliverableItem(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-background border border-line text-sm"
            />
            <input
              type="number"
              min="1"
              value={newDeliverableQty}
              onChange={(e) => setNewDeliverableQty(e.target.value)}
              className="w-16 px-2 py-2.5 rounded-xl border border-line text-sm"
            />
            <button
              type="button"
              onClick={addDeliverable}
              className="px-4 py-2.5 rounded-xl border border-line text-sm font-medium hover:bg-surface"
            >
              + Add
            </button>
          </div>
        </div>

        <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-black transition disabled:opacity-50">
          {submitting ? "Posting..." : "Post campaign"}
        </button>
      </form>
    )}

    {/* Campaign list — only shown when the form is closed */}
    {!showForm && (
      campaigns.length === 0 ? (
        <div className="bg-background border border-line rounded-2xl p-8 text-center">
          <p className="text-foreground text-sm">No campaigns posted yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c._id} className="bg-surface border border-line rounded-xl p-4  transition">
              <div className="flex justify-between items-start">
                <Link href={`/app/campaigns/${c._id}`} className="flex-1">
                  <p className="text-sm font-medium text-foreground transition">{c.title}</p>
                  <p className="text-xs text-foreground mt-1">
                    {money(c.budgetMinMinor)} – {money(c.budgetMaxMinor)} · {c.category || "—"}
                  </p>
                  {/* ✅ Deliverables display — added here */}
                  {c.deliverablesJson?.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {c.deliverablesJson.map((d: any, i: number) => (
                        <p key={i} className="text-xs text-muted">{d.quantity}× {d.item}</p>
                      ))}
                    </div>
                  )}
                </Link>
                <select
                  value={c.status}
                  onChange={(e) => updateStatus(c._id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface text-foreground capitalize cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 shrink-0"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="draft">Draft</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )
    )}
  </div>
);
}