"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getUser, getToken } from "@/lib/auth";
import { toast } from "react-toastify";

export default function PublicVideoPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const isScrollingRef = useRef(false);
  const [sortMode, setSortMode] = useState<"latest" | "trending">("latest");
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const distance = e.touches[0].clientY - touchStartY.current;
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      await load();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  };

  const user = getUser();

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/videos?page=${page}&limit=12&sort=${sortMode}`);
      setVideos(data.videos || []);
      setPagination(data.pagination);
      setActiveIndex(0);
    } catch (error: any) {
      toast.error(error.message || "Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (videoId: string) => {
    try {
      const data = await apiFetch(`/api/videos/${videoId}/comments`);
      const list = data.comments || [];
      setComments(list);
      setVideos((prev) =>
        prev.map((vid) => (vid._id === videoId ? { ...vid, commentCount: list.length } : vid))
      );
    } catch {
      setComments([]);
    }
  };

  const openComments = (videoId: string) => {
    setShowComments(true);
    loadComments(videoId);
  };

  const submitComment = async (videoId: string) => {
    if (!user) return requireLogin();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await apiFetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        token: getToken()!,
        body: { body: commentText, parentCommentId: replyingTo || undefined },
      });

      setVideos((prev) =>
        prev.map((vid) =>
          vid._id === videoId ? { ...vid, commentCount: (vid.commentCount || 0) + 1 } : vid
        )
      );

      setCommentText("");
      setReplyingTo(null);
      loadComments(videoId);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const saveEditComment = async (commentId: string, videoId: string) => {
    try {
      await apiFetch(`/api/videos/comments/${commentId}`, {
        method: "PATCH",
        token: getToken()!,
        body: { body: editCommentText },
      });
      setEditingCommentId(null);
      loadComments(videoId);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteComment = async (commentId: string, videoId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await apiFetch(`/api/videos/comments/${commentId}`, {
        method: "DELETE",
        token: getToken()!,
      });
      loadComments(videoId);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    load();
    document.title = "Explore Videos | Luvenex";
  }, [page, sortMode]);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, [activeIndex, videos]);

  useEffect(() => {
    const checkFollow = async () => {
      const poster = videos[activeIndex]?.postedBy;
      if (!user || !poster) {
        setIsFollowing(false);
        return;
      }
      try {
        const data = await apiFetch(`/api/follow/${poster._id}/status`, { token: getToken()! });
        setIsFollowing(data.isFollowing);
      } catch {
        setIsFollowing(false);
      }
    };
    checkFollow();
  }, [activeIndex, videos]);

  const requireLogin = () => {
    router.push("/login");
  };

  const goNext = () => {
    if (activeIndex < videos.length - 1) {
      setActiveIndex((i) => i + 1);
    } else if (pagination && page < pagination.totalPages) {
      setPage((p) => p + 1);
    }
  };

  const goPrev = () => {
    if (activeIndex > 0) {
      setActiveIndex((i) => i - 1);
    } else if (page > 1) {
      setPage((p) => p - 1);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (isScrollingRef.current) return;

    if (e.deltaY > 30) {
      isScrollingRef.current = true;
      goNext();
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 600);
    } else if (e.deltaY < -30) {
      isScrollingRef.current = true;
      goPrev();
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 600);
    }
  };

  const toggleLike = async (videoId: string) => {
    if (!user) return requireLogin();
    try {
      const data = await apiFetch(`/api/videos/${videoId}/like`, {
        method: "POST",
        token: getToken()!,
      });
      setVideos((prev) =>
        prev.map((v) =>
          v._id === videoId
            ? {
                ...v,
                likes: data.liked
                  ? [...v.likes, user.id]
                  : v.likes.filter((id: string) => id !== user.id),
              }
            : v
        )
      );
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleSave = async (videoId: string) => {
    if (!user) return requireLogin();
    try {
      const data = await apiFetch(`/api/videos/${videoId}/save`, {
        method: "POST",
        token: getToken()!,
      });
      setVideos((prev) =>
        prev.map((v) =>
          v._id === videoId
            ? {
                ...v,
                savedBy: data.saved
                  ? [...v.savedBy, user.id]
                  : v.savedBy.filter((id: string) => id !== user.id),
              }
            : v
        )
      );
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleFollow = async () => {
    if (!user) return requireLogin();
    const poster = videos[activeIndex]?.postedBy;
    if (!poster) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await apiFetch(`/api/follow/${poster._id}`, { method: "DELETE", token: getToken()! });
        setIsFollowing(false);
      } else {
        await apiFetch(`/api/follow/${poster._id}`, { method: "POST", token: getToken()! });
        setIsFollowing(true);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setFollowLoading(false);
    }
  };

  const getShareUrl = () => {
    const video = videos[activeIndex];
    return `${window.location.origin}/videos?v=${video?._id}`;
  };

  const shareToWhatsApp = () => {
    const url = getShareUrl();
    const text = encodeURIComponent(`Check this out on Luvenex: ${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setShowShareMenu(false);
  };

  const shareToInstagram = async () => {
    await navigator.clipboard.writeText(getShareUrl());
    toast.success("Link copied — paste it into your Instagram story or DM");
    setShowShareMenu(false);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(getShareUrl());
    toast.success("Link copied to clipboard");
    setShowShareMenu(false);
  };

  const handleDownload = async (video: any) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}${video.videoUrl}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `luvenex-video-${video._id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      toast.error("Failed to download video");
    }
  };

  const isLiked = (v: any) => user && v.likes?.includes(user.id);
  const isSaved = (v: any) => user && v.savedBy?.includes(user.id);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-center px-6">
        <div>
          <p className="text-sm font-semibold text-foreground">No videos yet</p>
          <p className="text-xs text-foreground/50 mt-1">Check back soon for new content.</p>
        </div>
      </div>
    );
  }

  const v = videos[activeIndex];
  const profileHref =
    v.postedByRole === "brand" ? `/brands/${v.postedBy?.handle}` : `/creator/${v.postedBy?.handle}`;
  const isOwnVideo = user && user.id === v.postedBy?._id;

  return (
    <div
      className="h-screen bg-background flex items-center justify-center overflow-hidden relative"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* pull-to-refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center transition-all"
          style={{ transform: `translateY(${Math.min(pullDistance, 60)}px)` }}
        >
          <div
            className={`w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full ${
              isRefreshing ? "animate-spin" : ""
            }`}
          />
        </div>
      )}

      {/* the single active video, centered, portrait-framed */}
      <div className="relative h-full max-h-screen w-full max-w-[420px] mt-4 flex items-center justify-center">
        <video
          key={v._id}
          ref={videoRef}
          src={`${process.env.NEXT_PUBLIC_API_URL}${v.videoUrl}`}
          className="w-full h-full object-cover"
          loop={false}
          controls
          playsInline
          muted={isMuted}
          onEnded={goNext}
        />

        <button
          onClick={() => setIsMuted((prev) => !prev)}
          className="absolute top-6 right-4 z-20 w-9 h-9 rounded-full bg-background backdrop-blur-md border border-border-color flex items-center justify-center text-foreground hover:bg-surface transition"
        >
          {isMuted ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2 2m0 0l2 2m-2-2l2-2m-2 2l-2 2M9 9l4-4v14l-4-4H5a1 1 0 01-1-1v-4a1 1 0 011-1h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M9 9l4-4v14l-4-4H5a1 1 0 01-1-1v-4a1 1 0 011-1h4z" />
            </svg>
          )}
        </button>

        {/* caption, bottom-left over the video */}
        <div className="absolute bottom-8 left-0 right-16 p-4 bg-gradient-to-t from-background to-transparent">
          <Link href={profileHref} className="flex items-center gap-2 mb-2 w-fit">
            <span className="text-sm font-bold text-foreground drop-shadow hover:text-primary transition">
              {v.postedBy?.name}
            </span>
          </Link>
          {v.caption && (
            <p className="text-xs text-foreground leading-relaxed drop-shadow">{v.caption}</p>
          )}
        </div>

        <div className="absolute right-3 bottom-8 flex flex-col items-center gap-5 z-10">
          <div className="relative">
            <Link href={profileHref} className="block">
              <div className="w-12 h-12 rounded-full bg-primary/20 backdrop-blur-md border-2 border-foreground/20 flex items-center justify-center text-foreground font-bold text-sm overflow-hidden">
                {v.postedBy?.name?.[0]?.toUpperCase() || "?"}
              </div>
            </Link>

            {/* follow badge — overlaps the bottom-right corner of the avatar */}
            {!isOwnVideo && (
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border-2 border-background transition disabled:opacity-50 ${
                  isFollowing ? "bg-background text-foreground" : "bg-primary text-foreground"
                }`}
                title={isFollowing ? "Unfollow" : "Follow"}
              >
                {isFollowing ? "✓" : "+"}
              </button>
            )}
          </div>

          {/* like */}
          <button onClick={() => toggleLike(v._id)} className="flex flex-col items-center gap-1 text-foreground">
            <div
              className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition ${
                isLiked(v) ? "bg-primary" : "bg-background hover:bg-surface"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill={isLiked(v) ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <span className="text-[10px] font-semibold drop-shadow">{v.likes?.length || 0}</span>
          </button>

          {/* comments */}
          <button onClick={() => openComments(v._id)} className="flex flex-col items-center gap-1 text-foreground">
            <div className="w-11 h-11 rounded-full bg-background hover:bg-surface flex items-center justify-center transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <span className="text-[10px] font-semibold drop-shadow">{v.commentCount || 0}</span>
          </button>

          {/* save */}
          <button onClick={() => toggleSave(v._id)} className="flex flex-col items-center gap-1 text-foreground">
            <div
              className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition ${
                isSaved(v) ? "bg-primary" : "bg-background hover:bg-surface"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill={isSaved(v) ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
            <span className="text-[10px] font-semibold drop-shadow">Save</span>
          </button>

          {/* share — opens a small menu with WhatsApp / Instagram / Copy link / Download */}
          <div className="relative">
            <button onClick={() => setShowShareMenu((prev) => !prev)} className="flex flex-col items-center gap-1 text-foreground">
              <div className="w-11 h-11 rounded-full bg-background backdrop-blur-md hover:bg-surface flex items-center justify-center transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.684 13.342a4 4 0 100-2.684m0 2.684a4 4 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a4 4 0 105.367-5.933 4 4 0 00-5.367 5.933zm0 9.316a4 4 0 105.368 5.933 4 4 0 00-5.368-5.933z"
                  />
                </svg>
              </div>
              <span className="text-[10px] font-semibold drop-shadow">Share</span>
            </button>

            {showShareMenu && (
              <div className="absolute right-14 bottom-0 bg-background border border-border-color rounded-2xl p-2 flex flex-col gap-1 shadow-xl min-w-[160px] z-20">
                <button
                  onClick={shareToWhatsApp}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface transition text-left"
                >
                  <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12.001 2.001c-5.514 0-9.984 4.469-9.984 9.984 0 1.761.463 3.416 1.271 4.849L2.001 22l5.283-1.253a9.94 9.94 0 004.717 1.202c5.514 0 9.984-4.469 9.984-9.984 0-5.514-4.47-9.984-9.984-9.984zm0 18.049a8.052 8.052 0 01-4.101-1.121l-.294-.174-3.038.809.812-3.006-.191-.309a8.038 8.038 0 01-1.239-4.284c0-4.452 3.622-8.074 8.074-8.074 4.452 0 8.074 3.622 8.074 8.074-.001 4.452-3.623 8.085-8.097 8.085z" />
                  </svg>
                  <span className="text-foreground text-xs font-medium whitespace-nowrap">WhatsApp</span>
                </button>

                <button
                  onClick={shareToInstagram}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface transition text-left"
                >
                  <svg className="w-5 h-5 text-pink-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <span className="text-foreground text-xs font-medium whitespace-nowrap">Instagram</span>
                </button>

                <button
                  onClick={copyLink}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface transition text-left"
                >
                  <svg className="w-5 h-5 text-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" />
                  </svg>
                  <span className="text-foreground text-xs font-medium whitespace-nowrap">Copy link</span>
                </button>

                {/* Download — only shown if this video allows downloading */}
                {v.allowDownload && (
                  <button
                    onClick={() => {
                      handleDownload(v);
                      setShowShareMenu(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface transition text-left"
                  >
                    <svg className="w-5 h-5 text-foreground/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-foreground text-xs font-medium whitespace-nowrap">Download</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="absolute -right-14 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
          <button
            onClick={goPrev}
            disabled={activeIndex === 0 && page === 1}
            className="w-9 h-9 rounded-full bg-background backdrop-blur-md border border-border-color flex items-center justify-center text-foreground hover:bg-surface transition disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={goNext}
            disabled={activeIndex === videos.length - 1 && (!pagination || page === pagination.totalPages)}
            className="w-9 h-9 rounded-full bg-background backdrop-blur-md border border-border-color flex items-center justify-center text-foreground hover:bg-surface transition disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {showComments && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            onClick={() => setShowComments(false)}
          >
            <div
              className="bg-card w-full sm:max-w-md sm:rounded-2xl max-h-[70vh] flex flex-col border border-border-color shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border-color">
                <h3 className="text-sm font-bold text-foreground">Comments ({comments.length})</h3>
                <button onClick={() => setShowComments(false)} className="text-foreground/50 hover:text-foreground">
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {comments.filter((c) => !c.parentCommentId).length === 0 ? (
                  <p className="text-xs text-foreground/60 text-center py-6">No comments yet — be the first.</p>
                ) : (
                  comments
                    .filter((c) => !c.parentCommentId)
                    .map((c) => (
                      <div key={c._id}>
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-foreground">{c.userId?.name}</p>
                            {editingCommentId === c._id ? (
                              <div className="mt-1 space-y-1">
                                <textarea
                                  value={editCommentText}
                                  onChange={(e) => setEditCommentText(e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg bg-surface text-foreground text-xs border border-border-color"
                                  rows={2}
                                />
                                <button
                                  onClick={() => saveEditComment(c._id, c.videoId)}
                                  className="text-[10px] text-primary font-semibold"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs text-foreground/80 mt-0.5">{c.body}</p>
                            )}
                          </div>
                          {user?.id === c.userId?._id && editingCommentId !== c._id && (
                            <div className="flex gap-2 text-[10px] shrink-0">
                              <button
                                onClick={() => {
                                  setEditingCommentId(c._id);
                                  setEditCommentText(c.body);
                                }}
                                className="text-foreground/50 hover:text-foreground"
                              >
                                Edit
                              </button>
                              <button onClick={() => deleteComment(c._id, c.videoId)} className="text-primary">
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setReplyingTo(c._id)}
                          className="text-[10px] text-foreground/40 hover:text-foreground mt-1"
                        >
                          Reply
                        </button>

                        {/* replies to this comment */}
                        {comments
                          .filter((r) => r.parentCommentId === c._id)
                          .map((r) => (
                            <div key={r._id} className="ml-4 mt-2 pl-3 border-l border-border-color">
                              <p className="text-xs font-semibold text-foreground">{r.userId?.name}</p>
                              <p className="text-xs text-foreground/70">{r.body}</p>
                            </div>
                          ))}
                      </div>
                    ))
                )}
              </div>

              <div className="p-3 border-t border-border-color flex gap-2 bg-card">
                <input
                  type="text"
                  placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-surface text-foreground text-xs placeholder:text-foreground/40 border border-border-color"
                />
                <button
                  onClick={() => submitComment(videos[activeIndex]?._id || videos[0]?._id)}
                  disabled={submittingComment || !commentText.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-foreground text-xs font-semibold disabled:opacity-50 hover:opacity-90 transition"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}