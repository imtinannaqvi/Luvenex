"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getToken,getUser } from "@/lib/auth";

export default function VideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [allowDownload, setAllowDownload] = useState(false);

  const user = getUser();

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/videos", { token: getToken()! });
      // only show MY OWN videos on this management page
      setVideos((data.videos || []).filter((v: any) => v.postedBy?._id === user?.id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFileSelect = (file: File | null) => {
    setVideoFile(file);
    if (file) {
      setVideoPreview(URL.createObjectURL(file));
    } else {
      setVideoPreview(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("category", category);
      formData.append("video", videoFile);
      formData.append("allowDownload", String(allowDownload));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/videos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message);

      setVideos((prev) => [data.video, ...prev]);
      setShowForm(false);
      setCaption("");
      setCategory("");
      setVideoFile(null);
      setVideoPreview(null);
      setAllowDownload(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm("Delete this video? This cannot be undone.")) return;
    setDeletingId(videoId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/videos/${videoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-0 py-6 space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-surface rounded-xl w-40" />
          <div className="h-10 bg-surface rounded-full w-32" />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[9/14] bg-surface rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl px-4 sm:px-6 py-3 sm:py-6 space-y-6">
      {/* Top Bar Header */}
      <div className="w-full flex items-center justify-between gap-4 pb-4 border-b border-line/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground italic tracking-tight">
            My Videos
          </h1>
          <Link
            href="/videos"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
          >
            View public feed <span>→</span>
          </Link>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-1.5 rounded-md bg-primary text-paper text-xs sm:text-sm font-medium hover:bg-primary-dark transition shadow-2xs shrink-0 flex items-center gap-1.5"
        >
          {showForm ? (
            "Close"
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>New video</span>
            </>
          )}
        </button>
      </div>

     {/* Conditionally render ONLY the Upload Form OR the Video Grid */}
{showForm ? (
  /* ── Upload Studio Section ── */
  <div className="max-w-2xl mx-auto bg-surface border border-line rounded-md p-5 sm:p-6 shadow-2xs space-y-4">
    <div className="border-b border-line/60 pb-3">
      <h2 className="text-sm font-bold text-foreground  ">
        Upload New Video
      </h2>
      <p className="text-xs text-muted mt-0.5">
        Share high quality video clips with brands and your audience.
      </p>
    </div>

    <form onSubmit={handleUpload} className="space-y-4">
      <label
        htmlFor="video-upload"
        className="block border-2 border-dashed border-line hover:border-primary/60 bg-surface/50 rounded-xl cursor-pointer transition overflow-hidden group"
      >
        {videoPreview ? (
          <div className="relative bg-background">
            <video
              src={videoPreview}
              className="w-full max-h-80 object-contain mx-auto"
              controls
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="w-12 h-12 rounded-md bg-background flex items-center justify-center text-primary group-hover:scale-105 transition duration-200 mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-foreground font-semibold">
              Click to select a video clip
            </p>
            <p className="text-[11px] text-muted mt-1">MP4, WebM, or MOV formats</p>
          </div>
        )}
        <input
          id="video-upload"
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          required
          className="hidden"
        />
      </label>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1">Caption</label>
          <textarea
            placeholder="Write a descriptive caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-md  border border-line bg-background text-ink text-sm placeholder:text-muted/60 focus:outline-none focus:border-primary transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1">Category</label>
          <input
            type="text"
            placeholder="e.g. fashion, fitness, tech..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-md border border-line bg-background text-foreground text-sm placeholder:text-muted/60 focus:outline-none focus:border-primary transition"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={allowDownload}
            onChange={(e) => setAllowDownload(e.target.checked)}
          />
          Allow others to download this video
        </label>
      </div>

      {/* Reduced button size and centered */}
      <div className="flex justify-center pt-2">
        <button
          type="submit"
          disabled={uploading || !videoFile}
          className="px-6 py-2 rounded-md bg-red-700 text-paper hover:bg-primary-dark text-xs font-semibold  transition disabled:opacity-50 shadow-2xs"
        >
          {uploading ? "Uploading Video..." : "Post Video"}
        </button>
      </div>
    </form>
  </div>
) : (
        /* ── Video grid ── */
        videos.length === 0 ? (
          <div className="bg-paper border border-line/80 rounded-2xl p-10 text-center shadow-2xs">
            <p className="text-xs text-muted">No videos posted yet — share your first one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {videos.map((v) => (
              <div
                key={v._id}
                className="group relative bg-ink rounded-md overflow-hidden border border-line aspect-[9/14]"
              >
                <video
                  src={`${process.env.NEXT_PUBLIC_API_URL}${v.videoUrl}`}
                  className="w-full h-full object-cover"
                  muted
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                />

                {/* stats overlay, bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-ink/90 to-transparent">
                  <div className="flex items-center gap-2 text-paper text-[10px] font-semibold">
                    <span className="flex items-center gap-0.5">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {v.likes?.length || 0}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {v.viewCount || 0}
                    </span>
                  </div>
                </div>

                {/* delete button — appears on hover */}
                <button
                  onClick={() => handleDelete(v._id)}
                  disabled={deletingId === v._id}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-ink/70 backdrop-blur-md flex items-center justify-center text-paper opacity-0 group-hover:opacity-100 transition hover:bg-primary disabled:opacity-50"
                  title="Delete video"
                >
                  {deletingId === v._id ? (
                    <div className="w-3 h-3 border-2 border-paper/30 border-t-paper rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>

              
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}