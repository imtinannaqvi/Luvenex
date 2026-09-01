"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { getToken } from "@/lib/auth";
import dynamic from "next/dynamic";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    ["blockquote"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link", "image"],
    ["clean"],
  ],
};

type Section = { title: string; description: string };

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priceMinor, setPriceMinor] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [iconLoadError, setIconLoadError] = useState(false);

  const load = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setServices(data.services || []);
    } catch {
      toast.error("Failed to load services");
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), 15000);
    return () => clearInterval(interval);
  }, []);

  const resetForm = () => {
    setTitle("");
    setShortDescription("");
    setCategory("");
    setPriceMinor("");
    setSections([]);
    setCoverFile(null);
    setCoverPreview(null);
    setGalleryFiles([]);
    setVideoFiles([]);
    setIconFile(null);
    setIconPreview(null);
    setIconLoadError(false);
    setEditingId(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
    setShowForm(false);
  };

  const startEdit = (s: any) => {
    setEditingId(s._id);
    setTitle(s.title || "");
    setShortDescription(s.shortDescription || "");
    setCategory(s.category || "");
    setPriceMinor(s.priceMinor ? String(s.priceMinor / 100) : "");
    setSections(Array.isArray(s.sections) ? s.sections : []);
    setCoverPreview(s.coverImage ? `${process.env.NEXT_PUBLIC_API_URL}${s.coverImage}` : null);
    setCoverFile(null);
    setIconPreview(s.iconUrl ? `${process.env.NEXT_PUBLIC_API_URL}${s.iconUrl}` : null);
    setIconFile(null);
    setIconLoadError(false);
    setGalleryFiles([]);
    setVideoFiles([]);
    setShowForm(true);
  };

  // ── Section helpers ──
  const addSection = () =>
    setSections((prev) => [...prev, { title: "", description: "" }]);

  const removeSection = (index: number) =>
    setSections((prev) => prev.filter((_, i) => i !== index));

  const updateSectionTitle = (index: number, value: string) =>
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, title: value } : s)));

  const updateSectionDescription = (index: number, value: string) =>
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, description: value } : s)));

  const handleCoverSelect = (file: File | null) => {
    setCoverFile(file);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sections.length === 0) {
      toast.error("Add at least one section.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("shortDescription", shortDescription);
      // Backend still requires `description`. We no longer show that editor,
      // so we derive it from the first section's content to satisfy the model.
      const derivedDescription =
        sections.find((s) => s.description && s.description.replace(/<[^>]*>/g, "").trim())
          ?.description || sections[0]?.description || "<p></p>";
      formData.append("description", derivedDescription);
      formData.append("category", category);
      // Sections travel as a JSON string; the controller parses them.
      formData.append("sections", JSON.stringify(sections));
      if (priceMinor) formData.append("priceMinor", String(Number(priceMinor) * 100));
      if (coverFile) formData.append("cover", coverFile);
      if (iconFile) formData.append("icon", iconFile);
      galleryFiles.forEach((f) => formData.append("gallery", f));
      videoFiles.forEach((f) => formData.append("videos", f));

      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/services/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/services`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Failed to save service");

      toast.success(editingId ? "Service updated" : "Service created");

      if (editingId) {
        setServices((prev) => prev.map((s) => (s._id === editingId ? data.service : s)));
      } else {
        setServices((prev) => [data.service, ...prev]);
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed to delete service");
      setServices((prev) => prev.filter((s) => s._id !== id));
      toast.success("Service deleted");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground italic">Services</h1>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark hover:text-foreground transition"
        >
          {showForm ? "Close" : " New service"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* LEFT: main fields */}
          <div className="lg:col-span-2 bg-background border border-line rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Title</label>
              <input
                type="text"
                placeholder="e.g. Full Influencer Campaign Management"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Short Description</label>
              <textarea
                placeholder="One-liner shown on the catalog card and at the top of the service page..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={2}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm"
              />
            </div>

            {/* ── Sections builder (this is now the main content) ── */}
            <div className="pt-2 border-t border-line/60">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-sm font-bold text-foreground">Detail Sections</label>
                  <p className="text-[11px] text-muted mt-0.5">
                    Each section is a tab on the service page — its title shows on the left, its content on the right.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addSection}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition"
                >
                  <FiPlus size={14} /> Add section
                </button>
              </div>

              {sections.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-line rounded-xl">
                  <p className="text-xs text-muted">No sections yet. Click “Add section” to create the first one.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {sections.map((sec, i) => (
                    <div key={i} className="border border-line rounded-xl p-4 bg-surface/40 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <input
                          type="text"
                          placeholder="Section title (e.g. Photography Training)"
                          value={sec.title}
                          onChange={(e) => updateSectionTitle(i, e.target.value)}
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-line text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeSection(i)}
                          className="shrink-0 p-2 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition"
                          title="Remove section"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                      <div className="rounded-xl border border-line overflow-hidden bg-background">
                        <ReactQuill
                          theme="snow"
                          value={sec.description}
                          onChange={(val) => updateSectionDescription(i, val)}
                          modules={quillModules}
                          placeholder="This section's content — add text, headings, and images..."
                          className="[&_.ql-editor]:min-h-[160px] [&_.ql-toolbar]:border-line [&_.ql-container]:border-line"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-foreground mb-1.5">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Campaign Management"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-foreground mb-1.5">Price (PKR, optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={priceMinor}
                  onChange={(e) => setPriceMinor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm"
                />
              </div>
            </div>
          </div>

          {/* RIGHT: media uploads */}
          <div className="space-y-4">
            <div className="bg-background border border-line rounded-2xl p-5">
              <h3 className="text-sm font-bold text-foreground italic mb-3">Cover Image</h3>
              <label
                htmlFor="cover-upload"
                className="block border-2 border-dashed border-line hover:border-primary rounded-xl cursor-pointer overflow-hidden transition"
              >
                {coverPreview ? (
                  <img src={coverPreview} className="w-full h-32 object-cover" alt="Cover preview" />
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-xs text-muted">Click to upload cover image</p>
                  </div>
                )}
                <input
                  id="cover-upload"
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCoverSelect(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            <div className="bg-background border border-line rounded-2xl p-5">
              <h3 className="text-sm font-bold text-foreground italic mb-3">Service Icon</h3>
              <p className="text-xs text-muted mb-3">
                Shown on the public services grid — keep it simple, square works best.
              </p>
              <label
                htmlFor="icon-upload"
                className="block border-2 border-dashed border-line hover:border-primary rounded-xl cursor-pointer overflow-hidden transition"
              >
                {iconPreview && !iconLoadError ? (
                  <div className="p-6 flex flex-col items-center gap-2">
                    <img
                      src={iconPreview}
                      className="w-16 h-16 object-contain"
                      alt="Icon preview"
                      onError={() => setIconLoadError(true)}
                    />
                    {iconFile && (
                      <p className="text-[11px] text-muted truncate max-w-full">{iconFile.name}</p>
                    )}
                  </div>
                ) : iconPreview && iconLoadError ? (
                  <div className="py-6 text-center px-4">
                    <svg className="w-6 h-6 mx-auto mb-1.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-muted">
                      {iconFile ? iconFile.name : "Icon selected, but couldn't preview it"}
                    </p>
                    <p className="text-[10px] text-muted/70 mt-0.5">Click to replace</p>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-xs text-muted">Click to upload icon</p>
                  </div>
                )}
                <input
                  id="icon-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setIconFile(file);
                    setIconPreview(file ? URL.createObjectURL(file) : null);
                    setIconLoadError(false);
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <div className="bg-background border border-line rounded-2xl p-5">
              <h3 className="text-sm font-bold text-foreground italic mb-3">Gallery Images</h3>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))}
                className="text-xs"
              />
              {galleryFiles.length > 0 && (
                <p className="text-[11px] text-muted mt-2">{galleryFiles.length} image(s) selected</p>
              )}
            </div>

            <div className="bg-background border border-line rounded-2xl p-5">
              <h3 className="text-sm font-bold text-foreground italic mb-3">Videos</h3>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                onChange={(e) => setVideoFiles(Array.from(e.target.files || []))}
                className="text-xs"
              />
              {videoFiles.length > 0 && (
                <p className="text-[11px] text-muted mt-2">{videoFiles.length} video(s) selected</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-primary text-paper text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50"
            >
              {submitting ? "Saving..." : editingId ? "Update service" : "Create service"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        !showForm &&
        (services.length === 0 ? (
          <div className="bg-background border border-line rounded-2xl p-8 text-center">
            <p className="text-muted text-sm">No services created yet.</p>
          </div>
        ) : (
          <div className="bg-background border border-line rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-foreground border-collapse">
                <thead>
                  <tr className="border-b border-line bg-background text-[14px] font-bold text-foreground italic">
                    <th scope="col" className="px-6 py-4">Image</th>
                    <th scope="col" className="px-6 py-4">Title</th>
                    <th scope="col" className="px-6 py-4">Category</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4">Uploaded By</th>
                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {services.map((s) => (
                    <tr key={s._id} className="hover:bg-surface transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {s.coverImage ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_URL}${s.coverImage}`}
                            alt={s.title}
                            className="w-10 h-10 object-cover rounded-lg border border-line"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-line flex items-center justify-center text-[10px] text-muted">
                            No img
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 max-w-xs">
                        <div className="font-bold text-foreground line-clamp-1">{s.title}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-primary">
                        {s.category || "Uncategorized"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                            s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {s.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-muted font-medium">
                        {s.author?.name || s.author || "Admin"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium space-x-2">
                        <button
                          onClick={() => startEdit(s)}
                          className="w-20 py-2 px-3 text-white bg-primary font-semibold rounded-lg hover:bg-primary-dark transition inline-flex items-center justify-center"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          disabled={deletingId === s._id}
                          className="w-20 py-2 px-3 text-foreground bg-background border border-ink font-semibold rounded-lg hover:bg-background/30 transition disabled:opacity-50 inline-flex items-center justify-center"
                        >
                          {deletingId === s._id ? "..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}