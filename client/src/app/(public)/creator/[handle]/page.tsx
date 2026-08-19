"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getToken, getUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";
import Link from "next/link";
import { FaInstagram, FaFacebookF, FaTiktok, FaYoutube } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";

const PLATFORM_ICON: Record<string, any> = {
  instagram: FaInstagram,
  facebook: FaFacebookF,
  tiktok: FaTiktok,
  youtube: FaYoutube,
};

// external URLs (portfolio) are stored whole; local uploads (avatar/video) need the API host
const mediaSrc = (url: string) =>
  url?.startsWith("http") ? url : `${process.env.NEXT_PUBLIC_API_URL}${url}`;

export default function CreatorProfilePage() {
  const params = useParams();
  const handle = params.handle as string;

  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"about" | "feedback" | "history" | "portfolio" | "skills">("about");
  const [workHistory, setWorkHistory] = useState<any[]>([]);
  const user = getUser();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const profileData = await apiFetch(`/api/influencers/${handle}`);
        setProfile(profileData.profile);

        const userId = profileData.profile.userId._id;

        const [reviewsData, gigsData, videosData] = await Promise.all([
          apiFetch(`/api/users/${userId}/reviews`),
          apiFetch(`/api/gigs?influencerId=${userId}`),
          apiFetch(`/api/videos?postedBy=${userId}&limit=9`),
        ]);
        setReviews(reviewsData.reviews || []);
        setGigs(gigsData.gigs || []);
        setVideos(videosData.videos || []);

        // work history is optional — a missing/404 route must NOT break the page
        try {
          const workHistoryData = await apiFetch(`/api/deals/work-history/${handle}`);
          setWorkHistory(workHistoryData.workHistory || []);
        } catch {
          setWorkHistory([]);
        }

        if (user) {
          const followData = await apiFetch(`/api/follow/${userId}/status`, {
            token: getToken()!,
          });
          setIsFollowing(followData.isFollowing);
          setFollowerCount(followData.followerCount);
          setFollowingCount(followData.followingCount);
        } else {
          const followersData = await apiFetch(`/api/follow/${userId}/followers`);
          setFollowerCount((followersData.followers || []).length);
        }
      } catch (err: any) {
        setError(err.message || "Creator not found");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [handle]);

  const money = (minor: number) => `PKR ${(minor / 100).toLocaleString("en-PK")}`;

  const startConversation = async () => {
    if (!user) return (window.location.href = "/login");
    try {
      await apiFetch("/api/conversations", {
        method: "POST",
        token: getToken()!,
        body: { otherUserId: profile.userId._id },
      });
      window.location.href = `/app/messages`;
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleFollow = async () => {
    if (!user) return (window.location.href = "/login");
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await apiFetch(`/api/follow/${profile.userId._id}`, {
          method: "DELETE",
          token: getToken()!,
        });
        setIsFollowing(false);
        setFollowerCount((c) => Math.max(c - 1, 0));
      } else {
        await apiFetch(`/api/follow/${profile.userId._id}`, {
          method: "POST",
          token: getToken()!,
        });
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-zinc-800 border-t-[#B90808] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-center px-6">
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-8 max-w-md w-full space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-[#B90808]/10 border border-[#B90808]/30 rounded-2xl flex items-center justify-center text-[#B90808] mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Creator Not Found</h2>
            <p className="text-zinc-500 text-xs mt-1">{error || "The profile you are looking for does not exist or has been moved."}</p>
          </div>
          <Link href="/" className="inline-block px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-white transition">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const portfolioLinkToShow =
    profile.portfolioLink || (profile.portfolio && profile.portfolio.length > 0 ? profile.portfolio[0].mediaUrl : null);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1)
      : null;

  const TABS = [
    { id: "about", label: "About" },
    { id: "feedback", label: "Client feedback" },
    { id: "history", label: "Work history" },
    { id: "portfolio", label: "Portfolio" },
    { id: "skills", label: "Skills" },
  ] as const;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#B90808] selection:text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* ambient red glows */}
      <div className="absolute top-1/4 -left-40 w-80 h-80 bg-[#B90808]/20 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-[#B90808]/15 rounded-full blur-[140px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 lg:gap-8 items-start">

        {/* ───────── LEFT: profile sidebar ───────── */}
        <aside className="bg-zinc-950/60 border border-zinc-900 rounded-md p-6 lg:sticky lg:top-8 space-y-6">
          {/* avatar + name */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              {profile.avatarUrl ? (
                <img
                  src={mediaSrc(profile.avatarUrl)}
                  alt={profile.handle}
                  className="w-28 h-28 rounded-full object-cover"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white font-black text-3xl">
                  {profile.handle?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl font-black text-white">{profile.title || profile.handle}</h1>
              {profile.isVerified && (
                <svg className="w-5 h-5 fill-[#B90808]" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed">
              {profile.caption || profile.headline || "Content Creator & Influencer"}
            </p>
          </div>

          {/* rating + rate row */}
          <div className="flex items-center justify-center gap-4 text-sm">
            {avgRating && (
              <span className="flex items-center gap-1 text-white font-semibold">
                <span className="text-amber-400">★</span> {avgRating}
                <span className="text-zinc-500">({reviews.length})</span>
              </span>
            )}
            <span className="text-zinc-600">·</span>
            <span className="text-[#B90808] font-bold">@{profile.handle}</span>
          </div>
             {/* socials */}
          {profile.socialAccounts && profile.socialAccounts.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center pt-2 border-t border-zinc-900">
              {profile.socialAccounts.map((acc: any, i: number) => {
                const Icon = PLATFORM_ICON[acc.platform] || FiShare2;
                const content = (
                  <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-full pl-2 pr-3 py-1.5 hover:border-[#B90808]/60 transition">
                    <span className="w-5 h-5 rounded-full bg-black flex items-center justify-center text-white shrink-0">
                      <Icon size={11} />
                    </span>
                    <span className="text-[11px] font-semibold text-white">@{acc.handle}</span>
                  </div>
                );
                return acc.url ? (
                  <a key={i} href={acc.url} target="_blank" rel="noopener noreferrer">{content}</a>
                ) : (
                  <div key={i}>{content}</div>
                );
              })}
            </div>
          )}

          {/* stat cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-md py-1 text-center">
              <span className="block text-md font-black text-white">{videos.length}</span>
              <span className="text-[11px] italic text-zinc-500 font-medium">Videos</span>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-md py-1 text-center">
              <span className="block text-md font-black text-white">{followerCount}</span>
              <span className="text-[11px] italic text-zinc-500 font-medium">Followers</span>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-md py-1 text-center">
              <span className="block text-md font-black text-white">{followingCount}</span>
              <span className="text-[11px] italic text-zinc-500 font-medium">Following</span>
            </div>
          </div>

          {/* action buttons */}
          <div className="space-y-2.5">
            <button
              onClick={toggleFollow}
              disabled={followLoading}
              className={`w-full py-3 rounded-md text-sm font-bold transition active:scale-95 disabled:opacity-50 ${
                isFollowing
                  ? "bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800"
                  : "bg-[#B90808] text-white hover:bg-[#a10707]"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
            <button
              onClick={startConversation}
              className="w-full py-3 rounded-md bg-transparent hover:bg-zinc-900 text-white text-sm font-bold border border-zinc-700 transition active:scale-95"
            >
              Message
            </button>
          </div>

       
        </aside>

        {/* ───────── RIGHT: tabs + content ───────── */}
        <section className="space-y-5">
          {/* tab bar */}
          <div className="flex flex-wrap items-center gap-1 bg-zinc-950/60 border border-zinc-900 rounded-md p-1.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-[#B90808] text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* content card */}
          <div className="bg-zinc-950/60 border border-zinc-900 rounded-md p-6 sm:p-8 min-h-[400px]">

            {/* ── ABOUT ── */}
            {activeTab === "about" && (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <h2 className="text-md font-black text-white">
                    About {profile.title || profile.handle}
                  </h2>
                 
                </div>

                {profile.bio ? (
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{profile.bio}</p>
                ) : (
                  <p className="text-sm text-zinc-500">No bio added yet.</p>
                )}

                {profile.niches && profile.niches.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {profile.niches.map((n: string) => (
                      <span key={n} className="text-xs text-[#B90808] font-semibold bg-[#B90808]/10 border border-[#B90808]/20 rounded-md px-3 py-1">
                        #{n}
                      </span>
                    ))}
                  </div>
                )}

                {/* videos preview */}
                {videos.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h3 className="text-md font-bold text-white">Recent Videos</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {videos.slice(0, 3).map((v) => (
                        <Link key={v._id} href="/videos" className="group relative rounded-lg overflow-hidden bg-zinc-950 aspect-[9/16]">
                          <video src={mediaSrc(v.videoUrl)} className="w-full h-full object-cover" muted />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition">
                            <div className="w-7 h-7 rounded-full bg-[#B90808]/90 text-white flex items-center justify-center">
                              <svg className="w-3 h-3 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── CLIENT FEEDBACK ── */}
            {activeTab === "feedback" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-white">Client feedback</h2>
                  {avgRating && (
                    <span className="text-sm text-amber-400 font-semibold">★ {avgRating} · {reviews.length} reviews</span>
                  )}
                </div>
                {reviews.length === 0 ? (
                  <div className="text-center py-12 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl">
                    <p className="text-sm text-zinc-500">No feedback yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((r) => (
                      <div key={r._id} className="bg-zinc-900/60 border border-zinc-800 rounded-md p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">{r.reviewerId?.name || "Anonymous Client"}</span>
                          <div className="text-sm text-amber-400">
                            {"★".repeat(r.rating || 5)}
                            <span className="text-zinc-700">{"★".repeat(5 - (r.rating || 5))}</span>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">{r.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── WORK HISTORY ── */}
            {activeTab === "history" && (
              <div className="space-y-4">
                <h2 className="text-xl font-black text-white">Work history</h2>
                {workHistory.length > 0 ? (
                  <div className="space-y-3">
                    {workHistory.map((w, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-zinc-900/60 border border-zinc-800 rounded-md px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">{w.title}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">with {w.brandName}</p>
                        </div>
                        <span className="text-xs text-zinc-500 shrink-0">
                          {new Date(w.completedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-md">
                    <p className="text-sm text-zinc-500">No work history added yet.</p>
                    <p className="text-xs text-zinc-600 mt-1">Completed jobs will appear here.</p>
                  </div>
                )}
              </div>
            )}

   {/* ── PORTFOLIO ── */}
{activeTab === "portfolio" && (
  <div className="space-y-4">
    <h2 className="text-xl font-black text-white">Portfolio</h2>

    {profile?.portfolio?.filter((item: any) => item.mediaUrl).length > 0 && (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {profile.portfolio
          .filter((item: any) => item.mediaUrl)
          .map((item: any) => (
            <div
              key={item._id}
              className="relative rounded-md overflow-hidden border border-zinc-800 bg-zinc-900 aspect-square group"
            >
              {item.mediaType === "video" ? (
                <video
                  src={`${process.env.NEXT_PUBLIC_API_URL}${item.mediaUrl}`}
                  className="w-full h-full object-cover"
                  controls
                />
              ) : (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}${item.mediaUrl}`}
                  alt={item.title || "Portfolio item"}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-xs font-bold text-white truncate">{item.title}</p>
                {item.description && (
                  <p className="text-[11px] text-zinc-300 truncate mt-0.5">{item.description}</p>
                )}
              </div>
            </div>
          ))}
      </div>
    )}

    {gigs.length > 0 && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {gigs.map((g) => (
          <div key={g._id} className="bg-zinc-900/60 border border-zinc-800 rounded-md p-4 space-y-2.5">
            <div className="space-y-1">
              <span className="inline-block text-[13px] font-bold text-[#B90808] ">
                {g.category || "General"}
              </span>
              <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">{g.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                {g.description || "No description provided."}
              </p>
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800 gap-2">
              <span className="text-sm font-extrabold text-[#B90808]">{money(g.priceMinor)}</span>
              <button
                onClick={startConversation}
                className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#B90808] hover:bg-[#a10707] px-3 py-1.5 rounded-md transition active:scale-95"
              >
                Order
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    )}

    {(!profile?.portfolio || profile.portfolio.filter((item: any) => item.mediaUrl).length === 0) && gigs.length === 0 && (
      <div className="text-center py-12 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-md">
        <p className="text-sm text-zinc-500 mb-3">No portfolio items yet.</p>
      </div>
    )}
  </div>
)}

            {/* ── SKILLS ── */}
            {activeTab === "skills" && (
              <div className="space-y-4">
                <h2 className="text-md font-black text-white">Skills</h2>
                {profile.niches && profile.niches.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.niches.map((n: string) => (
                      <span key={n} className="text-sm text-white font-semibold bg-zinc-900 border border-zinc-800 rounded-md px-4 py-2 hover:border-[#B90808]/60 transition">
                        {n}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl">
                    <p className="text-sm text-zinc-500">No skills added yet.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </section>
      </div>
    </div>
  );
}