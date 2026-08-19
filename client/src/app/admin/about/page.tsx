"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getToken } from "@/lib/auth";

export default function AdminAboutPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [heroImage, setHeroImage] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/about`)
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.page.title || "");
        setContent(data.page.content || "");
        if (data.page.heroImage) setHeroPreview(`${process.env.NEXT_PUBLIC_API_URL}${data.page.heroImage}`);
        if (editorRef.current) editorRef.current.innerHTML = data.page.content || "";
      })
      .finally(() => setLoading(false));
  }, []);

  const applyFormat = (command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", editorRef.current?.innerHTML || "");
      if (heroImage) formData.append("heroImage", heroImage);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/about`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Failed to save");

      toast.success("About page updated");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-ink tracking-tight mb-6">About Page</h1>

      <div className="bg-paper border border-line rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5">Page Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5">Hero Image</label>
          <label className="block border-2 border-dashed border-line hover:border-primary rounded-xl cursor-pointer overflow-hidden transition">
            {heroPreview ? (
              <img src={heroPreview} className="w-full h-40 object-cover" />
            ) : (
              <div className="py-8 text-center">
                <p className="text-xs text-muted">Click to upload hero image</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setHeroImage(file);
                setHeroPreview(file ? URL.createObjectURL(file) : heroPreview);
              }}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5">Content</label>
          <div className="flex gap-1 mb-2 border border-line rounded-lg p-1 w-fit">
            <button type="button" onClick={() => applyFormat("bold")} className="px-3 py-1.5 rounded-md hover:bg-surface font-bold text-sm">B</button>
            <button type="button" onClick={() => applyFormat("italic")} className="px-3 py-1.5 rounded-md hover:bg-surface italic text-sm">I</button>
            <button type="button" onClick={() => applyFormat("insertUnorderedList")} className="px-3 py-1.5 rounded-md hover:bg-surface text-sm">• List</button>
            <button type="button" onClick={() => applyFormat("underline")} className="px-3 py-1.5 rounded-md hover:bg-surface underline text-sm">U</button>
          </div>
          <div
            ref={editorRef}
            contentEditable
            className="w-full min-h-[300px] px-4 py-3 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition prose prose-sm max-w-none"
            suppressContentEditableWarning
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-primary text-paper text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save About Page"}
        </button>
      </div>
    </div>
  );
}