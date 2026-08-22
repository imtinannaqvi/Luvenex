"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { toast } from "react-toastify";

export default function BrandProfilePage() {
  const params = useParams();
  const router = useRouter();
  const handle = params.handle as string;

  const [profile, setProfile] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [workHistory, setWorkHistory] = useState<any[]>([]);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "campaigns" | "workhistory" | "portfolio" | "reviews">("about");

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const profileData = await apiFetch(`/api/brands/${handle}`);
        setProfile(profileData.profile);

        const brandUserId = profileData.profile.userId._id;

        const [campaignsData, videosData, reviewsData, workData] =
          await Promise.all([
            apiFetch(`/api/campaigns?brandId=${brandUserId}`),
            apiFetch(`/api/videos?postedBy=${brandUserId}&limit=9`),
            apiFetch(`/api/users/${brandUserId}/reviews`),
            apiFetch(`/api/deals/work-history/${handle}`).catch(() => ({
              workHistory: [],
            })),
          ]);

        setCampaigns(
          (campaignsData.campaigns || []).filter(
            (c: any) => c.status === "open"
          )
        );
        setVideos(videosData.videos || []);
        setReviews(reviewsData.reviews || []);
        setWorkHistory(workData.workHistory || []);

        const currentUser = getUser();
        if (currentUser) {
          const followData = await apiFetch(
            `/api/follow/${brandUserId}/status`,
            { token: getToken()! }
          );
          setIsFollowing(followData.isFollowing);
          setFollowerCount(followData.followerCount);
          setFollowingCount(followData.followingCount);
        } else {
          const followersData = await apiFetch(
            `/api/follow/${brandUserId}/followers`
          );
          setFollowerCount((followersData.followers || []).length);
        }
      } catch (err: any) {
        setError(err.message || "Brand not found");
      } finally {
        setLoading(false);
      }
    };
    if (handle) load();
  }, [handle]);

  const money = (minor?: number) =>
    minor ? `PKR ${(minor / 100).toLocaleString("en-PK")}` : "—";

  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-PK", {
          month: "short",
          year: "numeric",
        })
      : "";

  const getMediaUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || ""}${url}`;
  };

  const websiteUrl = (w?: string) =>
    !w ? "" : w.startsWith("http") ? w : `https://${w}`;

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
      toast.error(err.message || "Failed to start conversation");
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
      toast.error(err.message || "Action failed");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-border-color border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center px-6">
        <div>
          <p className="text-foreground font-bold text-lg">Brand not found</p>
          <p className="text-zinc-500 text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = user && user.id === profile.userId._id;

  const bio = profile.bio || "No bio available.";
  const isLongBio = bio.length > 220;
  const shownBio = bioExpanded || !isLongBio ? bio : `${bio.slice(0, 220)}…`;

  const tabs: {
    id: "about" | "campaigns" | "workhistory" | "portfolio" | "reviews";
    label: string;
    show: boolean;
  }[] = [
    { id: "about", label: "About", show: true },
    { id: "campaigns", label: "Campaigns", show: true },
    { id: "workhistory", label: "Work history", show: true },
    { id: "portfolio", label: "Portfolio", show: profile.portfolio?.length > 0 },
    { id: "reviews", label: "Reviews", show: true },
  ];

  /* ── Reusable pieces ── */
  const BigStat = ({ value, label }: { value: string; label: string }) => (
    <div className="rounded-2xl border border-border-color bg-surface/50 px-4 py-4 text-center">
      <span className="block text-2xl font-black leading-none text-foreground">
        {value}
      </span>
      <span className="mt-1.5 block text-[11px] font-semibold text-zinc-500">
        {label}
      </span>
    </div>
  );

  const InfoBox = ({ value, label }: { value: string; label: string }) => (
    <div className="rounded-xl border border-border-color bg-surface/50 px-4 py-3">
      <span className="block text-sm font-bold text-foreground">{value}</span>
      <span className="mt-0.5 block text-[11px] font-medium text-zinc-500">
        {label}
      </span>
    </div>
  );

  const VideoGrid = ({ items }: { items: any[] }) => (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {items.map((v) => (
        <Link
          key={v._id}
          href="/videos"
          className="group relative aspect-[9/16] overflow-hidden rounded-md border border-border-color bg-surface block"
        >
          <video
            src={getMediaUrl(v.videoUrl)}
            className="h-full w-full object-cover"
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center bg-background/20 transition group-hover:bg-background/40">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/90 text-foreground shadow-lg transition-transform group-hover:scale-110">
              <svg className="h-5 w-5 translate-x-0.5 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  const EmptyState = ({ text }: { text: string }) => (
    <div className="rounded-md border border-dashed border-border-color py-12 text-center">
      <p className="text-xs text-zinc-500">{text}</p>
    </div>
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="mb-3 text-[11px] font-black text-zinc-500">
      {children}
    </h2>
  );

  const Bullet = ({ children }: { children: React.ReactNode }) => (
    <li className="flex items-start gap-2.5 text-sm text-zinc-300">
      <span className="mt-0.5 text-red-500">🏅</span>
      <span>{children}</span>
    </li>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans text-foreground selection:bg-red-600 selection:text-foreground">
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
          {/* ══════════ LEFT SIDEBAR ══════════ */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border-color bg-card/80 p-6">
              {/* Avatar */}
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-md border-2 border-border-color bg-surface">
                    {profile.avatarUrl ? (
                      <img
                        src={getMediaUrl(profile.avatarUrl)}
                        alt={profile.handle}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-black text-foreground">
                        {profile.companyName?.[0]?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div className="mt-4 flex items-center gap-1.5">
                  <h1 className="text-2xl font-black tracking-tight text-foreground">
                    {profile.companyName || profile.handle}
                  </h1>
                  {profile.isVerified && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-red-600 text-[11px] font-black text-foreground">
                      ✓
                    </span>
                  )}
                </div>

                {/* Tagline */}
                <p className="mt-1 text-xs font-semibold text-zinc-400">
                  {profile.industry || "Brand"}
                  {profile.niches?.length
                    ? ` · ${profile.niches.slice(0, 3).map((n: string) => `#${n}`).join(" ")}`
                    : ""}
                </p>

                {/* Badges row: verified + rating */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  {profile.isVerified && (
                    <span className="rounded-md border border-border-color bg-surface/70 px-3 py-1 text-[11px] font-bold text-zinc-300">
                      Verified
                    </span>
                  )}
                  {profile.avgRating ? (
                    <span className="flex items-center gap-1 rounded-md border border-border-color bg-surface/70 px-3 py-1 text-[11px] font-bold text-foreground">
                      <span className="text-red-500">★</span>
                      {profile.avgRating.toFixed(1)}
                      <span className="font-medium text-zinc-500">
                        ({reviews.length})
                      </span>
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Two big stats */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <BigStat value={String(campaigns.length)} label="Campaigns" />
                <BigStat value={followerCount.toLocaleString()} label="Followers" />
              </div>

              {/* Buttons */}
              {!isOwnProfile && (
                <div className="mt-4 space-y-2.5">
                  <button
                    onClick={toggleFollow}
                    disabled={followLoading}
                    className={`w-full rounded-md py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 ${
                      isFollowing
                        ? "border border-border-color bg-surface text-foreground hover:bg-zinc-800"
                        : "bg-red-600 text-foreground hover:bg-red-700"
                    }`}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                  <button
                    onClick={startConversation}
                    className="w-full rounded-md border border-border-color bg-transparent py-3 text-sm font-bold text-foreground transition-all hover:bg-surface active:scale-[0.98]"
                  >
                    Message
                  </button>
                  <p className="pt-1 text-center text-[11px] text-zinc-600">
                    {followingCount.toLocaleString()} following
                  </p>
                </div>
              )}

              {/* Website */}
              {profile.website && (
                <a
                  href={websiteUrl(profile.website)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block truncate text-center text-xs font-medium text-red-500 hover:underline"
                >
                  🔗 {profile.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </aside>

          {/* ══════════ RIGHT CONTENT ══════════ */}
          <main>
            {/* Tabs */}
            <div className="no-scrollbar mb-6 flex items-center gap-1 overflow-x-auto rounded-md border border-border-color bg-card/80 p-1">
              {tabs
                .filter((t) => t.show)
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`whitespace-nowrap rounded-md px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
                      activeTab === t.id
                        ? "bg-red-600 text-foreground"
                        : "text-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
            </div>

            {/* ── ABOUT ── */}
            {activeTab === "about" && (
              <div className="space-y-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <h2 className="text-xl font-black text-foreground">
                    About {profile.companyName || `@${profile.handle}`}
                  </h2>
                  <div className="flex shrink-0 gap-2">
                    <InfoBox
                      value={profile.industry || "Brand"}
                      label="Industry"
                    />
                    <InfoBox
                      value={
                        profile.avgRating
                          ? `★ ${profile.avgRating.toFixed(1)}`
                          : "New"
                      }
                      label="Rating"
                    />
                  </div>
                </div>

                {/* Highlights */}
                <ul className="space-y-2.5">
                  {profile.isVerified && (
                    <Bullet>Verified brand on the platform</Bullet>
                  )}
                  {profile.industry && (
                    <Bullet>Industry — {profile.industry}</Bullet>
                  )}
                  {profile.avgRating ? (
                    <Bullet>
                      {profile.avgRating.toFixed(1)}★ average from{" "}
                      {reviews.length} review
                      {reviews.length === 1 ? "" : "s"}
                    </Bullet>
                  ) : null}
                  <Bullet>
                    {campaigns.length} open campaign
                    {campaigns.length === 1 ? "" : "s"} right now
                  </Bullet>
                  {workHistory.length > 0 && (
                    <Bullet>
                      {workHistory.length} completed collaboration
                      {workHistory.length === 1 ? "" : "s"}
                    </Bullet>
                  )}
                </ul>

                {/* Bio with Show more */}
                <div>
                  <p className="text-sm leading-relaxed text-zinc-400">
                    {shownBio}
                  </p>
                  {isLongBio && (
                    <button
                      onClick={() => setBioExpanded((v) => !v)}
                      className="mt-2 text-xs font-bold text-red-500 hover:underline"
                    >
                      {bioExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>

                {/* Niches as chips */}
                {profile.niches?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.niches.map((n: string) => (
                      <span
                        key={n}
                        className="rounded-md border border-border-color bg-surface/70 px-3 py-1 text-xs font-semibold text-red-500"
                      >
                        #{n}
                      </span>
                    ))}
                  </div>
                )}

                {/* Videos preview */}
                <div>
                  <SectionTitle>Videos</SectionTitle>
                  {videos.length === 0 ? (
                    <EmptyState text="No videos posted yet." />
                  ) : (
                    <VideoGrid items={videos} />
                  )}
                </div>
              </div>
            )}

            {/* ── CAMPAIGNS ── */}
            {activeTab === "campaigns" && (
              <div className="space-y-3">
                {campaigns.length === 0 ? (
                  <EmptyState text="No open campaigns right now." />
                ) : (
                  campaigns.map((c) => (
                    <div
                      key={c._id}
                      className="rounded-md border border-border-color bg-surface/60 p-4 transition-all hover:border-border-color"
                    >
                      <p className="text-sm font-bold text-foreground">{c.title}</p>
                      <p className="mt-1 text-xs font-medium text-zinc-400">
                        {money(c.budgetMinMinor)} – {money(c.budgetMaxMinor)} ·{" "}
                        <span className="text-red-500">
                          {c.category || "General"}
                        </span>
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── WORK HISTORY ── */}
            {activeTab === "workhistory" && (
              <div className="space-y-3">
                {workHistory.length === 0 ? (
                  <EmptyState text="No completed work yet." />
                ) : (
                  workHistory.map((w, i) => (
                    <div
                      key={i}
                      className="rounded-md border border-border-color bg-surface/60 p-4 transition-all hover:border-border-color"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {w.title}
                          </p>
                          <p className="mt-1 text-xs font-medium text-zinc-400">
                            with{" "}
                            <span className="text-red-500">{w.brandName}</span>
                          </p>
                        </div>
                        <span className="shrink-0 rounded-md border border-border-color bg-background/40 px-2.5 py-1 text-[11px] font-semibold text-zinc-500">
                          {formatDate(w.completedAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── PORTFOLIO ── */}
            {activeTab === "portfolio" && profile.portfolio?.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {profile.portfolio.map((item: any) => (
                  <div
                    key={item._id}
                    className="aspect-square overflow-hidden rounded-md border border-border-color bg-surface"
                  >
                    {item.mediaType === "video" ? (
                      <video
                        src={getMediaUrl(item.mediaUrl)}
                        className="h-full w-full object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={getMediaUrl(item.mediaUrl)}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── REVIEWS ── */}
            {activeTab === "reviews" && (
              <div className="space-y-3">
                {reviews.length === 0 ? (
                  <EmptyState text="No reviews yet — creators who work with this brand will leave feedback here." />
                ) : (
                  reviews.map((r) => (
                    <div
                      key={r._id}
                      className="rounded-md border border-border-color bg-surface/40 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          {r.reviewerId?.name || "Anonymous Creator"}
                        </span>
                        <span className="text-xs font-bold text-red-500">
                          {"★".repeat(r.rating)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                        {r.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}