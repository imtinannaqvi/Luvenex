"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getToken,getUser } from "@/lib/auth";
import { toast } from "react-toastify";

export default function SavedVideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    apiFetch("/api/videos/saved/me", { token: getToken()! })
      .then((data) => setVideos(data.videos || []))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleSave = async (videoId: string) => {
    try {
      await apiFetch(`/api/videos/${videoId}/save`, {
        method: "POST",
        token: getToken()!,
      });
      // remove it from this list immediately since it's now un-saved
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
    } catch (err: any) {
      toast.error(err.message);
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
    <div className="max-w-4xl ">
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Saved Videos</h1>

      {videos.length === 0 ? (
        <div className="bg-background border border-line rounded-2xl p-8 text-center">
          <p className="text-muted text-sm">No saved videos yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-3">
          {videos.map((v) => {
            const profileHref =
              v.postedByRole === "brand"
                ? `/brands/${v.postedBy?.handle}`
                : `/creator/${v.postedBy?.handle}`;
            return (
              <div
                key={v._id}
                className="group bg-paper border border-line rounded-md overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                {/* Custom Video Height Frame */}
                <div className="relative bg-black w-full h-44 sm:h-[400px] overflow-hidden">
                  <video
                    src={`${process.env.NEXT_PUBLIC_API_URL}${v.videoUrl}`}
                    className="w-full h-full object-cover"
                    muted
                    controls
                  />
                </div>

                {/* Footer Section: Name on Left, Delete Icon directly on Right */}
                {/* <div className="p-3.5 flex items-center justify-between gap-2 bg-paper">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={profileHref}
                      className="text-lg font-bold text-ink italic hover:text-primary transition block leading-snug"
                    >
                      {v.postedBy?.name || "Anonymous"}
                    </Link>
                   
                  </div>

                  <button
                    onClick={() => toggleSave(v._id)}
                    title="Remove from saved"
                    className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-xl transition shrink-0"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div> */}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}