"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { toast } from "react-toastify";

export default function GigsPage() {
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceMinor, setPriceMinor] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [revisions, setRevisions] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deliverableItems, setDeliverableItems] = useState<{ item: string; quantity: number }[]>([]);
  const [newDeliverableItem, setNewDeliverableItem] = useState("");
  const [newDeliverableQty, setNewDeliverableQty] = useState("1");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/gigs?mine=true", { token: getToken()! });
      setGigs(data.gigs || []);
    } catch (err: any) {
      toast(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const money = (minor?: number) => (minor ? `PKR ${(minor / 100).toLocaleString("en-PK")}` : "—");

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setDescription("");
    setPriceMinor("");
    setDeliveryDays("");
    setRevisions("");
    setCategory("");
    setDeliverableItems([]);
    setNewDeliverableItem("");
    setNewDeliverableQty("1");
  };

  const handleStartEdit = (gig: any) => {
    setEditingId(gig._id);
    setTitle(gig.title || "");
    setDescription(gig.description || "");
    setPriceMinor(gig.priceMinor ? (gig.priceMinor / 100).toString() : "");
    setDeliveryDays(gig.deliveryDays ? gig.deliveryDays.toString() : "");
    setRevisions(gig.revisions ? gig.revisions.toString() : "");
    setCategory(gig.category || "");
    setDeliverableItems(gig.deliverableItems || []);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title,
        description,
        priceMinor: priceMinor ? Number(priceMinor) * 100 : undefined,
        deliveryDays: deliveryDays ? Number(deliveryDays) : undefined,
        revisions: revisions ? Number(revisions) : undefined,
        category,
        deliverableItems,
      };

      if (editingId) {
        await apiFetch(`/api/gigs/${editingId}`, {
          method: "PATCH",
          token: getToken()!,
          body: payload,
        });
      } else {
        await apiFetch("/api/gigs", {
          method: "POST",
          token: getToken()!,
          body: payload,
        });
      }

      resetForm();
      load();
    } catch (err: any) {
      toast(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/api/gigs/${id}`, {
        method: "PATCH",
        token: getToken()!,
        body: { status },
      });
      load();
    } catch (err: any) {
      toast(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!toast("Delete this gig? This cannot be undone.")) return;
    try {
      await apiFetch(`/api/gigs/${id}`, {
        method: "DELETE",
        token: getToken()!,
      });
      load();
    } catch (err: any) {
      toast(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-black text-white border-black focus:ring-black/20";
      case "paused":
        return "bg-neutral-100 text-black border-neutral-300 focus:ring-black/10";
      case "draft":
        return "bg-neutral-100 text-neutral-600 border-neutral-200 focus:ring-neutral-400/20";
      case "archived":
        return "bg-red-50 text-red-600 border-red-200 focus:ring-red-500/20";
      default:
        return "bg-white text-black border-neutral-200";
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-t-2 border-primary border-neutral-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl  px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-6 lg:space-y-8 text-zinc-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 lg:mb-8">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground italic">My Gigs</h1>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="self-start sm:self-auto px-4 lg:px-5 py-2 lg:py-2.5 rounded-sm bg-black text-white text-sm lg:text-base font-medium hover:bg-gray-400 transition shadow-sm"
        >
          {showForm ? "Cancel" : "+ New gig"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-sm p-4 sm:p-6 lg:p-10 mb-6 space-y-4 lg:space-y-5 shadow-sm lg:max-w-3xl">
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-black mb-2">
            {editingId ? "Edit Gig" : "Create Gig"}
          </h2>
          <input
            type="text"
            placeholder="Gig title (e.g. 1 Reel + 3 Stories)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3.5 lg:px-4 py-2.5 lg:py-3 rounded-sm border border-neutral-200 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-black/20"
          />
          <textarea
            placeholder="Describe what's included..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3.5 lg:px-4 py-2.5 lg:py-3 rounded-sm border border-neutral-200 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-black/20"
          />

          {/* Deliverables */}
          <div>
            <label className="block text-xs lg:text-sm font-semibold text-black mb-1.5">Deliverables</label>
            <div className="space-y-2 mb-2">
              {deliverableItems.map((d, i) => (
                <div key={i} className="flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-sm px-3 lg:px-4 py-2 lg:py-2.5">
                  <span className="text-xs lg:text-sm text-black">{d.quantity}× {d.item}</span>
                  <button
                    type="button"
                    onClick={() => removeDeliverable(i)}
                    className="text-xs lg:text-sm font-semibold text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="e.g. Instagram Reel"
                value={newDeliverableItem}
                onChange={(e) => setNewDeliverableItem(e.target.value)}
                className="flex-1 px-3 lg:px-4 py-2 lg:py-2.5 rounded-sm border border-neutral-200 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-black/20"
              />
              <input
                type="number"
                min="1"
                value={newDeliverableQty}
                onChange={(e) => setNewDeliverableQty(e.target.value)}
                className="w-full sm:w-20 lg:w-24 px-2 lg:px-3 py-2 lg:py-2.5 rounded-sm border border-neutral-200 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-black/20"
              />
              <button
                type="button"
                onClick={addDeliverable}
                className="px-4 lg:px-5 py-2 lg:py-2.5 rounded-sm border border-neutral-200 text-sm lg:text-base font-medium text-black hover:bg-neutral-50 transition"
              >
                + Add
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            <input
              type="number"
              placeholder="Price (PKR)"
              value={priceMinor}
              onChange={(e) => setPriceMinor(e.target.value)}
              required
              className="w-full px-3.5 lg:px-4 py-2.5 lg:py-3 rounded-sm border border-neutral-200 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-black/20"
            />
            <input
              type="number"
              placeholder="Delivery days"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(e.target.value)}
              required
              className="w-full px-3.5 lg:px-4 py-2.5 lg:py-3 rounded-sm border border-neutral-200 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-black/20"
            />
            <input
              type="number"
              placeholder="Revisions included"
              value={revisions}
              onChange={(e) => setRevisions(e.target.value)}
              className="w-full px-3.5 lg:px-4 py-2.5 lg:py-3 rounded-sm border border-neutral-200 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>
          <input
            type="text"
            placeholder="Category (e.g. fashion, fitness)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 lg:px-4 py-2.5 lg:py-3 rounded-sm border border-neutral-200 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-black/20"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-6 lg:px-8 py-2.5 lg:py-3 rounded-sm bg-black text-white text-sm lg:text-base font-medium hover:bg-slate-700 transition disabled:opacity-50"
          >
            {submitting ? "Saving..." : editingId ? "Update gig" : "Post gig"}
          </button>
        </form>
      )}

      {!showForm && (
        gigs.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-sm p-8 lg:p-14 text-center shadow-sm">
            <p className="text-neutral-500 text-sm lg:text-base">You haven't posted any gigs yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm lg:text-base min-w-[640px]">
                <thead>
                  <tr className="border-b border-neutral-200 text-sm sm:text-base font-semibold italic bg-neutral-50">
                    <th className="py-3.5 lg:py-4 px-4 sm:px-6 lg:px-8 text-black whitespace-nowrap">Title</th>
                    <th className="py-3.5 lg:py-4 px-4 sm:px-6 lg:px-8 text-black whitespace-nowrap">Category</th>
                    <th className="py-3.5 lg:py-4 px-4 sm:px-6 lg:px-8 text-black whitespace-nowrap">Price</th>
                    <th className="py-3.5 lg:py-4 px-4 sm:px-6 lg:px-8 text-black whitespace-nowrap">Status</th>
                    <th className="py-3.5 lg:py-4 px-4 sm:px-6 lg:px-8 text-right text-black whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {gigs.map((g) => (
                    <tr key={g._id} className="hover:bg-neutral-50/50 transition">
                      <td className="py-4 lg:py-5 px-4 sm:px-6 lg:px-8 text-black font-medium max-w-[160px] sm:max-w-[220px] lg:max-w-[280px] truncate" title={g.title}>
                        {g.title}
                      </td>
                      <td className="py-4 lg:py-5 px-4 sm:px-6 lg:px-8 text-neutral-700 whitespace-nowrap">
                        {g.category || "—"}
                      </td>
                      <td className="py-4 lg:py-5 px-4 sm:px-6 lg:px-8 font-semibold text-black whitespace-nowrap">
                        {money(g.priceMinor)}
                      </td>
                      <td className="py-4 lg:py-5 px-4 sm:px-6 lg:px-8 whitespace-nowrap">
                        <select
                          value={g.status}
                          onChange={(e) => updateStatus(g._id, e.target.value)}
                          className={`text-xs lg:text-sm font-bold px-3 lg:px-4 py-1 lg:py-1.5 rounded-full capitalize cursor-pointer border focus:outline-none focus:ring-2 transition ${getStatusColor(
                            g.status
                          )}`}
                        >
                          <option value="active" className="text-white">Active</option>
                          <option value="paused" className="text-white">Paused</option>
                          <option value="draft" className="text-white">Draft</option>
                          <option value="archived" className="text-white">Archived</option>
                        </select>
                      </td>
                      <td className="py-4 lg:py-5 px-4 sm:px-6 lg:px-8 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 lg:gap-3">
                          <button
                            onClick={() => handleStartEdit(g)}
                            className="px-3 lg:px-4 py-1 lg:py-1.5 rounded-sm text-xs lg:text-sm font-semibold text-black bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(g._id)}
                            className="px-3 lg:px-4 py-1 lg:py-1.5 rounded-sm text-xs lg:text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}