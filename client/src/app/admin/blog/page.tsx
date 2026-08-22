"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

// toolbar config — bold, italic, lists, links, image, etc.
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

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [publishNow, setPublishNow] = useState(true);
  const [scheduledFor, setScheduledFor] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/blogs/admin/all", { token: getToken()! });
      setPosts(data?.blogs || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const slugPreview = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const handleImageSelect = (file: File | null) => {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const resetForm = () => {
    setTitle(""); setShortDescription(""); setContent(""); setAuthor("");
    setCategory(""); setTags(""); setIsFeatured(false); setPublishNow(true);
    setScheduledFor(""); setImageFile(null); setImagePreview(null);
    setSeoTitle(""); setSeoDescription("");
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowEditor(false);
  };

  const startEdit = (post: any) => {
    setEditingId(post._id);
    setTitle(post.title || "");
    setShortDescription(post.shortDescription || "");
    setContent(post.content || "");
    setAuthor(post.author || "");
    setCategory(post.category || "");
    setTags((post.tags || []).join(", "));
    setIsFeatured(post.isFeatured || false);
    setPublishNow(post.status === "published");
    setScheduledFor(post.scheduledFor ? post.scheduledFor.slice(0, 16) : "");
    setSeoTitle(post.seoTitle || "");
    setSeoDescription(post.seoDescription || "");
    setImagePreview(post.image ? `${process.env.NEXT_PUBLIC_API_URL}${post.image}` : null);
    setImageFile(null);
    setShowEditor(true);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("author", author);
      formData.append("category", category);
      formData.append("tags", tags);
      formData.append("shortDescription", shortDescription);
      formData.append("isFeatured", String(isFeatured));
      formData.append("seoTitle", seoTitle);
      formData.append("seoDescription", seoDescription);

      if (publishNow) {
        formData.append("status", "published");
      } else if (scheduledFor) {
        formData.append("scheduledFor", scheduledFor);
        formData.append("status", "draft");
      } else {
        formData.append("status", "draft");
      }

      if (imageFile) formData.append("image", imageFile);

      const url = editingId ? `/api/blogs/${editingId}` : `/api/blogs`;
      const method = editingId ? "PATCH" : "POST";

      const data = await apiFetch(url, { method, body: formData, token: getToken()! });
      if (!data) return; // apiFetch redirected to /login after a failed refresh

      toast.success(editingId ? "Post updated" : "Post saved successfully");

      if (editingId) {
        setPosts((prev) => prev.map((p) => (p._id === editingId ? data.blog : p)));
      } else {
        setPosts((prev) => [data.blog, ...prev]);
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/blogs/${id}`, { method: "DELETE", token: getToken()! });
      setPosts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Post deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete post");
    } finally {
      setDeletingId(null);
    }
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      published: "bg-emerald-100 text-emerald-800 border border-emerald-200",
      scheduled: "bg-sky-100 text-sky-800 border border-sky-200",
      draft: "bg-zinc-100 text-zinc-700 border border-zinc-200",
    };
    return map[status] || "bg-zinc-100 text-zinc-700 border border-zinc-200";
  };

  return (
    <div className="max-w-7xl  px-4 sm:px-6 md:px-10 lg:px-12 py-8 space-y-6 relative z-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground italic">Blog</h1>
        <button
          onClick={() => (showEditor ? resetForm() : setShowEditor(true))}
          className="px-4 py-2 rounded-lg bg-primary text-paper text-sm font-medium hover:bg-primary-dark transition shadow-sm cursor-pointer relative z-20"
        >
          {showEditor ? "Close" : "+ New post"}
        </button>
      </div>

      {showEditor && (
        <form onSubmit={handlePublish} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* ── LEFT: main content ── */}
          <div className="lg:col-span-2 bg-background border border-line rounded-2xl p-6 sm:p-8 space-y-4">
            <div>
              <input
                type="text"
                placeholder="Post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full text-lg md:text-xl font-bold px-0 py-1 border-0 border-b border-line focus:outline-none focus:border-primary bg-transparent"
              />
              {slugPreview && (
                <p className="text-xs text-muted mt-2">
                  Permalink:{" "}
                  <span className="text-primary">
                    yourdomain.com/blog/<span className="font-medium">{slugPreview}</span>
                  </span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Description</label>
              <textarea
                placeholder="A short summary shown on the blog listing..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Content</label>
              <div className="rounded-xl border border-line overflow-hidden bg-background">
                <ReactQuill
                  key={editingId ?? "new"}
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={quillModules}
                  placeholder="Write your post..."
                  className="[&_.ql-editor]:min-h-[260px] [&_.ql-toolbar]:border-line [&_.ql-container]:border-line"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-line text-sm"
              />
              <input
                type="text"
                placeholder="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-line text-sm"
              />
            </div>
            <input
              type="text"
              placeholder="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm"
            />
          </div>

          {/* ── RIGHT: sidebar ── */}
          <div className="space-y-6">
            <div className="bg-background border border-line rounded-2xl p-5 sm:p-6">
              <h3 className="text-md font-bold text-foreground italic mb-3">Publish</h3>

              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={publishNow}
                    onChange={() => setPublishNow(true)}
                  />
                  Publish now
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!publishNow}
                    onChange={() => setPublishNow(false)}
                  />
                  Schedule for later
                </label>
              </div>

              {!publishNow && (
                <div className="mt-3">
                  <label className="block text-xs text-muted mb-1">Publish date & time</label>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-line text-sm"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 mt-4 pt-4 border-t border-line text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                Mark as Featured
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 py-2.5 rounded-xl bg-primary text-paper text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50 cursor-pointer"
              >
                {submitting
                  ? "Saving..."
                  : editingId
                  ? "Update post"
                  : publishNow
                  ? "Publish"
                  : scheduledFor
                  ? "Schedule"
                  : "Save draft"}
              </button>
            </div>

            <div className="bg-background border border-line rounded-2xl p-5 sm:p-6">
              <h3 className="text-md font-bold text-foreground italic mb-3">Featured Image</h3>
              <label
                htmlFor="blog-image"
                className="block border-2 border-dashed border-line hover:border-primary rounded-xl cursor-pointer overflow-hidden transition"
              >
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-32 object-cover" alt="Preview" />
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-xs text-muted">Click to upload</p>
                  </div>
                )}
                <input
                  id="blog-image"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            {/* ── SEO ── */}
            <div className="bg-background border border-line rounded-2xl p-5 sm:p-6">
              <h3 className="text-md font-bold text-foreground italic mb-3">SEO</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">SEO Title</label>
                  <input
                    type="text"
                    placeholder="Title shown in search results"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    maxLength={60}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm"
                  />
                  <p className="text-[11px] text-muted mt-1">
                    {seoTitle.length}/60 — falls back to the post title if empty
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">SEO Description</label>
                  <textarea
                    placeholder="Meta description shown under the title in Google..."
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={3}
                    maxLength={160}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm"
                  />
                  <p className="text-[11px] text-muted mt-1">
                    {seoDescription.length}/160 — falls back to the short description
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── TABLE VIEW CONTAINER — hidden while editor is open ── */}
      {!showEditor &&
        (loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-line border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-background border border-line rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px] md:min-w-full">
                <thead>
                  <tr className="border-b border-line text-sm font-bold text-foreground bg-background">
                    <th className="py-4 px-4 sm:px-6">Image</th>
                    <th className="py-4 px-4 sm:px-6">Title</th>
                    <th className="py-4 px-4 sm:px-6">Category</th>
                    <th className="py-4 px-4 sm:px-6">Status</th>
                    <th className="py-4 px-4 sm:px-6">Author</th>
                    <th className="py-4 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-sm">
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted text-sm">
                        No blogs added yet
                      </td>
                    </tr>
                  ) : (
                    posts.map((p) => (
                      <tr key={p._id} className="hover:bg-line/5 transition-colors">
                        <td className="py-3 px-4 sm:px-6">
                          {p.image ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL}${p.image}`}
                              alt={p.title}
                              className="w-12 h-12 object-cover rounded-lg border border-line"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-line/20 border border-line flex items-center justify-center text-[10px] text-muted font-medium text-center">
                              No Img
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 sm:px-6 font-semibold text-foreground max-w-[200px] sm:max-w-xs truncate">
                          {p.title}
                        </td>

                        <td className="py-3 px-4 sm:px-6 text-muted">
                          {p.category || "—"}
                        </td>

                        <td className="py-3 px-4 sm:px-6">
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor(
                              p.status
                            )}`}
                          >
                            {p.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 sm:px-6 text-muted">
                          {p.author || "Admin"}
                        </td>

                        <td className="py-3 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-3 font-semibold text-xs">
                            <button
                              onClick={() => startEdit(p)}
                              className="text-primary hover:text-foreground cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(p._id)}
                              disabled={deletingId === p._id}
                              className="text-red-600 hover:text-foreground disabled:opacity-50 cursor-pointer"
                            >
                              {deletingId === p._id ? "..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
    </div>
  );
}