"use client";

import { useEffect, useRef, useState } from "react";
import { getUser,getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import {
  FiCamera,
  FiEdit2,
  FiPlus,
  FiImage,
  FiUser,
  FiShare2,
  FiShield,
  FiTrash2,
  FiGlobe,
  FiAlertTriangle,
  FiArrowUpRight,
  FiLink,
  FiMail,
} from "react-icons/fi";
import { FaInstagram, FaFacebookF, FaTiktok, FaYoutube } from "react-icons/fa";
import { toast } from "react-toastify";

const PLATFORM_ICON: Record<string, any> = {
  instagram: FaInstagram,
  facebook: FaFacebookF,
  tiktok: FaTiktok,
  youtube: FaYoutube,
};

const VIDEO_EXTENSIONS = ["mp4", "mov", "webm", "m4v", "avi", "mkv"];

// external URLs are stored whole; local uploads need the API host prefixed
const mediaSrc = (url: string) =>
  url?.startsWith("http") ? url : `${process.env.NEXT_PUBLIC_API_URL}${url}`;

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"portfolio" | "edit" | "social" | "settings">("edit");

  // influencer fields
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [niches, setNiches] = useState("");

  // brand fields
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");

  // portfolio — URL based
const [portfolioTitle, setPortfolioTitle] = useState("");
const [portfolioDescription, setPortfolioDescription] = useState("");
const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
const [uploadingPortfolio, setUploadingPortfolio] = useState(false);

  // social accounts
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [newPlatform, setNewPlatform] = useState("instagram");
  const [newSocialHandle, setNewSocialHandle] = useState("");
  const [newSocialUrl, setNewSocialUrl] = useState("");
  const [newFollowers, setNewFollowers] = useState("");
  const [savingSocial, setSavingSocial] = useState(false);

  // deactivate account
 const [showDeactivate, setShowDeactivate] = useState(false);
const [deactivatePassword, setDeactivatePassword] = useState("");
const [deactivateReason, setDeactivateReason] = useState("");   // ← add this
const [deactivating, setDeactivating] = useState(false);
  const [hideFromSearch, setHideFromSearch] = useState(false)
  const [verificationReason, setVerificationReason] = useState("");
const [showVerifyForm, setShowVerifyForm] = useState(false);
const [submittingVerification, setSubmittingVerification] = useState(false);
const [completedDealsCount, setCompletedDealsCount] = useState(0);
const MIN_DEALS_REQUIRED = 10;

  const [skills,setSkills] = useState("");
  const [languages,setLanguages] = useState("")

  const formRef = useRef<HTMLFormElement>(null);

  const u = getUser();
  const isInfluencer = u?.role === "influencer";

  const load = async () => {
    setLoading(true);
    try {
      setUser(u);
      setEmail(u?.email || "");
      const endpoint = isInfluencer ? "/api/influencers/me" : "/api/brands/me";

      const data = await apiFetch(endpoint, { token: getToken()! });
      setProfile(data.profile);
      const dealsData = await apiFetch("/api/deals?status=completed", { token: getToken()! });
setCompletedDealsCount(dealsData.deals?.length || 0);
      if (isInfluencer) {
        setHandle(data.profile.handle || "");
        setBio(data.profile.bio || "");
        setNiches((data.profile.niches || []).join(", "));
        setSocialAccounts(data.profile.socialAccounts || []);
        setSkills((data.profile.skills || []).join(", "));
setLanguages((data.profile.languages || []).join(", "));
      } else {
        setHandle(data.profile.handle || "");
        setCompanyName(data.profile.companyName || "");
        setIndustry(data.profile.industry || "");
        setWebsite(data.profile.website || "");
        setBio(data.profile.bio || "");
      }
    } catch {
      // no profile yet — form just stays empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const savePrivacy = async () => {
  await apiFetch("/api/auth/privacy", {
    method: "PATCH",
    token: getToken()!,
    body: { hideFromSearch },
  });
  toast.success("Privacy settings updated");
};

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isInfluencer) {
        await apiFetch("/api/influencers/me", {
          method: "PATCH",
          token: getToken()!,
          body: {
            handle,
             email,
            bio,
            skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
            niches: niches.split(",").map((n) => n.trim()).filter(Boolean),
          },
        });
      } else {
        await apiFetch("/api/brands/me", {
          method: "PATCH",
          token: getToken()!,
          body: { handle, companyName, email, industry, website, bio },
        });
      }
      await load();
      setIsEditing(false);
      toast("Profile updated");
    } catch (err: any) {
      toast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!avatarFile) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message);
      setProfile(data.profile);
      setAvatarFile(null);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      toast("Avatar updated successfully");
    } catch (err: any) {
      toast(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

 const handlePortfolioAdd = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!portfolioFile || !portfolioTitle.trim()) return;
  setUploadingPortfolio(true);
  try {
    const formData = new FormData();
    formData.append("title", portfolioTitle);
    formData.append("description", portfolioDescription);
    formData.append("media", portfolioFile);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "Failed to add portfolio item");

    setProfile((prev: any) => ({ ...prev, portfolio: data.portfolio }));
    setPortfolioTitle("");
    setPortfolioDescription("");
    setPortfolioFile(null);
    toast.success("Portfolio item added");
  } catch (err: any) {
    toast.error(err.message);
  } finally {
    setUploadingPortfolio(false);
  }
};

  const addSocialAccount = () => {
    if (!newSocialHandle) return;
    setSocialAccounts((prev) => [
      ...prev,
      {
        platform: newPlatform,
        handle: newSocialHandle,
        url: newSocialUrl,
        followersCount: newFollowers ? Number(newFollowers) : 0,
      },
    ]);
    setNewSocialHandle("");
    setNewSocialUrl("");
    setNewFollowers("");
  };

  const removeSocialAccount = (index: number) => {
    setSocialAccounts((prev) => prev.filter((_, i) => i !== index));
  };

  const saveSocialAccounts = async () => {
    setSavingSocial(true);
    try {
      await apiFetch("/api/influencers/me", {
        method: "PATCH",
        token: getToken()!,
        body: { socialAccounts },
      });
      await load();
      toast("Social accounts saved");
    } catch (err: any) {
      toast(err.message);
    } finally {
      setSavingSocial(false);
    }
  };

 const handleDeactivate = async (e: React.FormEvent) => {
  e.preventDefault();
  setDeactivating(true);
  try {
    await apiFetch("/api/auth/deactivate", {
      method: "POST",
      token: getToken()!,
      body: { password: deactivatePassword, reason: deactivateReason },  // ← reason added
    });
    window.location.href = "/login";
  } catch (err: any) {
    toast(err.message);
  } finally {
    setDeactivating(false);
  }
};
  const requestVerification = async () => {
  if (!verificationReason.trim()) {
    toast.error("Please explain why you should be verified");
    return;
  }
  setSubmittingVerification(true);
  try {
    await apiFetch("/api/verification/request", {
      method: "POST",
      token: getToken()!,
      body: { reason: verificationReason },
    });
    toast.success("Verification request submitted");
    setShowVerifyForm(false);
    setVerificationReason("");
  } catch (err: any) {
    toast.error(err.message);
  } finally {
    setSubmittingVerification(false);
  }
};

if (loading) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-border-color border-t-primary rounded-full animate-spin" />
    </div>
  );
}

  const TABS = [
    { key: "edit", label: "Personal Info", icon: FiUser },
    { key: "portfolio", label: "Portfolio", icon: FiImage },
    ...(isInfluencer ? [{ key: "social", label: "Social Accounts", icon: FiShare2 }] : []),
    { key: "settings", label: "Security & Privacy", icon: FiShield },
  ] as const;

return (
    <div className="w-full min-h-screen  text-gray-900 flex justify-start py-10 px-4 sm:px-6 md:px-10 lg:px-16 sm:pl-10 md:pl-12 lg:pl-16 font-sans">
      <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl w-full space-y-6">
        
   {/* ── Header Card ── */}
        <div className="bg-background border border-gray-200/80 rounded-sm p-6 sm:p-8 md:p-10 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shadow-sm flex items-center justify-center text-xl sm:text-2xl font-bold text-gray-700">
              {profile?.avatarUrl ? (
                <img
                  src={mediaSrc(profile.avatarUrl)}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                (profile?.handle || u?.name || "?")[0]?.toUpperCase()
              )}
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-foreground border border-gray-200 text-gray-600 flex items-center justify-center cursor-pointer shadow-sm hover:bg-gray-50 transition-colors"
              title="Change photo"
            >
              <FiCamera size={13} />
            </label>
            <input
              ref={avatarInputRef}
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                {u?.name || profile?.companyName || (handle ? `@${handle}` : "User Profile")}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-sm bg-background text-foreground capitalize">
                {u?.role || (isInfluencer ? "Influencer" : "Brand")}
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("edit");
                  setIsEditing(true);
                }}
                className="w-7 h-7 rounded-full bg-background border border-gray-200 text-foreground flex items-center justify-center  transition-colors"
                title="Edit profile"
              >
                <FiEdit2 size={13} />
              </button>
            </div>
            <p className="text-sm md:text-base text-foreground font-medium">
              {u?.email || "user@example.com"}
            </p>
            <p className="text-xs md:text-sm text-foreground font-medium">
              {isInfluencer ? `@${handle || "no-handle"}` : (industry || "Account Overview")}
            </p>
          </div>
        </div>

        {/* ── Avatar Pending Upload Banner ── */}
        {avatarFile && (
          <div className="flex flex-col sm:flex-row items-center justify-between bg-background border border-gray-200/80 rounded-2xl px-5 py-3 shadow-sm gap-3">
            <span className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-xs">
              Selected photo: {avatarFile.name}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAvatarFile(null);
                  if (avatarInputRef.current) avatarInputRef.current.value = "";
                }}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground hover:text-gray-900 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAvatarUpload()}
                disabled={uploadingAvatar}
                className="px-4 py-1.5 rounded-sm bg-background text-white text-xs sm:text-sm font-semibold hover:bg-gray-800 transition shadow-sm disabled:opacity-50"
              >
                {uploadingAvatar ? "Uploading…" : "Save Avatar"}
              </button>
            </div>
          </div>
        )}

       {/* ── Segmented Control Tab Bar ── */}
        <div className="bg-background p-1.5 rounded-sm flex flex-col sm:flex-row items-center gap-1.5">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`w-full sm:flex-1 flex justify-center sm:justify-start items-center gap-2 py-2.5 px-3 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-foreground hover:text-foreground hover:bg-surface"
                }`}
              >
                <Icon size={15} className={isActive ? "text-foreground" : "text-gray-500"} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        <div className="bg-background border border-line rounded-2xl p-5 mt-6">
  <h2 className="text-sm font-bold text-foreground mb-2">Verification Badge</h2>
  {profile?.isVerified ? (
    <p className="text-xs text-green-700">✓ Your profile is verified.</p>
  ) : completedDealsCount < MIN_DEALS_REQUIRED ? (
    <div>
      <p className="text-xs text-muted">
        Complete {MIN_DEALS_REQUIRED - completedDealsCount} more deal{MIN_DEALS_REQUIRED - completedDealsCount !== 1 ? "s" : ""} to unlock verification eligibility.
      </p>
      <div className="w-full h-1.5 bg-surface rounded-full mt-2 overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${Math.min((completedDealsCount / MIN_DEALS_REQUIRED) * 100, 100)}%` }}
        />
      </div>
      <p className="text-[11px] text-muted mt-1">{completedDealsCount} / {MIN_DEALS_REQUIRED} completed deals</p>
    </div>
  ) : !showVerifyForm ? (
    <button
      onClick={() => setShowVerifyForm(true)}
      className="text-xs text-primary hover:underline"
    >
      Request verification badge
    </button>
  ) : (
    <div className="space-y-2">
      <textarea
        placeholder="Why should you be verified? (e.g. established track record, notable following, quality work)"
        value={verificationReason}
        onChange={(e) => setVerificationReason(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 rounded-lg border border-line text-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={() => setShowVerifyForm(false)}
          className="px-4 py-2 rounded-lg text-xs text-muted"
        >
          Cancel
        </button>
        <button
          onClick={requestVerification}
          disabled={submittingVerification}
          className="px-4 py-2 rounded-lg bg-primary text-paper text-xs font-semibold disabled:opacity-50"
        >
          {submittingVerification ? "Submitting..." : "Submit request"}
        </button>
      </div>
    </div>
  )}
</div>

        {/* ── Main Section Card ── */}
        <div className="bg-background border border-gray-200/80 rounded-sm p-6 sm:p-8 md:p-10 shadow-sm">
          
          {/* TAB: Personal Info (Edit Profile) */}
          {activeTab === "edit" && (
            <form ref={formRef} onSubmit={handleSave} className="space-y-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-foreground">Personal Information</h2>
                  <p className="text-sm sm:text-sm text-gray-500 mt-0.5">
                    Update your personal details and contact information
                  </p>
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm border border-gray-200 text-xs sm:text-sm font-semibold text-foreground hover:bg-surface transition-colors shrink-0"
                  >
                    <FiEdit2 size={14} /> Edit
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Handle Input */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Handle</label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g. johndoe"
                    className="w-full px-4 py-3 rounded-sm bg-background border border-transparent text-sm text-foreground placeholder-background focus:outline-none focus:bg-background focus:border-gray-300 focus:ring-2 focus:ring-gray-900/10 transition-all disabled:cursor-not-allowed"
                  />
                </div>

               <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Email Address</label>
                  <div className="relative">
                    <FiMail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!isEditing}
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-3 rounded-sm bg-background border border-transparent text-sm text-foreground placeholder-background focus:outline-none focus:bg-background focus:border-gray-300 focus:ring-2 focus:ring-gray-900/10 transition-all disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {isInfluencer ? (
                  <>
                    {/* Niches Input */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Niches</label>
                      <input
                        type="text"
                        value={niches}
                        onChange={(e) => setNiches(e.target.value)}
                        disabled={!isEditing}
                        placeholder="fashion, lifestyle, tech"
                        className="w-full px-4 py-3 rounded-sm bg-background border border-transparent text-sm text-foreground placeholder-background focus:outline-none focus:bg-background focus:border-gray-300 focus:ring-2 focus:ring-gray-900/10 transition-all disabled:cursor-not-allowed"
                      />
                      <p className="text-[11px] text-foreground mt-1">Separate multiple niches with commas.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">Company Name</label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 rounded-sm bg-background border border-transparent text-sm text-foreground placeholder-background focus:outline-none focus:bg-background focus:border-gray-300 focus:ring-2 focus:ring-gray-900/10 transition-all disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">Industry</label>
                        <input
                          type="text"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 rounded-sm bg-background border border-transparent text-sm text-foreground placeholder-background focus:outline-none focus:bg-background focus:border-gray-300 focus:ring-2 focus:ring-gray-900/10 transition-all disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Website</label>
                      <div className="relative">
                        <FiGlobe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground" />
                        <input
                          type="text"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          disabled={!isEditing}
                          placeholder="https://example.com"
                          className="w-full pl-11 pr-4 py-3 rounded-sm bg-background border border-transparent text-sm text-foreground placeholder-background focus:outline-none focus:bg-background focus:border-gray-300 focus:ring-2 focus:ring-gray-900/10 transition-all disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Bio Textarea */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="w-full p-4 rounded-sm bg-background border border-transparent text-sm text-foreground placeholder-background focus:outline-none focus:bg-background focus:border-gray-300 focus:ring-2 focus:ring-gray-900/10 transition-all resize-none disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-foreground mb-1 font-semibold">Skills</label>
                  <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} disabled={!isEditing} placeholder="video editing, copywriting" className="w-full px-3.5 py-2.5 rounded-md border border-line text-sm text-foreground disabled:cursor-not-allowed bg-background md:bg-transparent" />
                </div>
                <div>
                  <label className="block text-xs text-ink mb-1 font-semibold">Languages</label>
                  <input type="text" value={languages} onChange={(e) => setLanguages(e.target.value)} disabled={!isEditing} placeholder="English, Urdu" className="w-full px-3.5 py-2.5 rounded-md border border-line text-sm text-foreground disabled:cursor-not-allowed bg-background md:bg-transparent" />
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      load();
                    }}
                    className="px-5 py-2.5 rounded-sm border border-gray-200 text-xs sm:text-sm font-semibold text-foreground hover:bg-background transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-sm bg-background text-foreground text-xs sm:text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              )}
            </form>
          )}

        {activeTab === "portfolio" && (
          <form onSubmit={handlePortfolioAdd} className="space-y-3">
            <input
              type="text"
              placeholder="Title"
              value={portfolioTitle}
              onChange={(e) => setPortfolioTitle(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-sm bg-background border border-transparent text-sm text-foreground placeholder-gray-400 focus:outline-none focus:bg-background focus:border-gray-300 focus:ring-2 focus:ring-gray-900/10 transition-all"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={portfolioDescription}
              onChange={(e) => setPortfolioDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-sm bg-background border border-transparent text-sm text-foreground placeholder-gray-400 focus:outline-none focus:bg-background focus:border-gray-300 focus:ring-2 focus:ring-gray-900/10 transition-all"
            />
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setPortfolioFile(e.target.files?.[0] || null)}
                required
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
              <button
                type="submit"
                disabled={uploadingPortfolio || !portfolioFile || !portfolioTitle}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-sm bg-background text-foreground text-xs sm:text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50 shrink-0"
              >
                <FiPlus size={16} />
                {uploadingPortfolio ? "Adding…" : "Add Item"}
              </button>
            </div>
          </form>
        )}
          {/* TAB: Social Accounts */}
          {activeTab === "social" && isInfluencer && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-foreground">Social Accounts</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Connect your social media presence to your profile
                </p>
              </div>

              {socialAccounts.length > 0 ? (
                <div className="space-y-3">
                  {socialAccounts.map((acc, i) => {
                    const Icon = PLATFORM_ICON[acc.platform] || FiShare2;
                    return (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-background border border-gray-200/80 rounded-sm px-4 py-3 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-sm bg-background text-foreground flex items-center justify-center shrink-0">
                            <Icon size={15} />
                          </div>
                          <div className="text-xs sm:text-sm min-w-0">
                            <span className="font-semibold text-foreground capitalize">{acc.platform}</span>
                            <span className="text-gray-500 font-medium"> · @{acc.handle}</span>
                            {acc.followersCount > 0 && (
                              <span className="text-gray-400 font-medium block sm:inline">
                                {" "}
                                · {acc.followersCount.toLocaleString()} followers
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                          {acc.url && (
                            <a
                              href={acc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-white p-2 rounded-sm transition-colors"
                              title="Open profile"
                            >
                              <FiArrowUpRight size={16} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => removeSocialAccount(i)}
                            className="text-gray-400 hover:text-red-600 p-2 rounded-sm transition-colors"
                            title="Remove"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl bg-gray-50 border border-dashed border-gray-200 text-gray-500 text-xs sm:text-sm font-medium">
                  No social accounts linked yet.
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 space-y-4">
                <h3 className="text-sm font-semibold text-foreground ">Add an Account</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    className="px-4 py-3 rounded-sm bg-background border border-transparent text-sm text-foreground font-medium focus:outline-none focus:bg-background focus:border-gray-300 transition-all"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Handle (e.g. johndoe)"
                    value={newSocialHandle}
                    onChange={(e) => setNewSocialHandle(e.target.value)}
                    className="px-4 py-3 rounded-sm bg-background border border-transparent text-sm text-foreground placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Profile URL"
                    value={newSocialUrl}
                    onChange={(e) => setNewSocialUrl(e.target.value)}
                    className="px-4 py-3 rounded-sm bg-background border border-transparent text-sm text-foreground placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Follower count"
                    value={newFollowers}
                    onChange={(e) => setNewFollowers(e.target.value)}
                    className="px-4 py-3 rounded-sm bg-background border border-transparent text-sm text-foreground placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition-all"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={addSocialAccount}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-sm border border-gray-200 text-xs sm:text-sm font-semibold text-foreground hover:bg-surface/30 transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <FiPlus size={16} /> Add to list
                  </button>
                  <button
                    type="button"
                    onClick={saveSocialAccounts}
                    disabled={savingSocial}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-sm bg-background text-foreground text-xs sm:text-sm font-semibold hover:bg-gray-400 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {savingSocial ? "Saving…" : "Save Accounts"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-foreground">Security & Privacy</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Manage your account status and credentials
                </p>
              </div>

              <div className="border border-red-200 rounded-sm overflow-hidden bg-background">
                <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                  <FiAlertTriangle size={15} className="text-red-600" />
                  <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Danger Zone</span>
                </div>

                {!showDeactivate ? (
                  <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Deactivate Account</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Temporarily disable your profile. You will be logged out immediately.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeactivate(true)}
                      className="px-4 py-2 rounded-sm bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm shrink-0"
                    >
                      Deactivate Account
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleDeactivate} className="p-5 space-y-4">
  <div>
    <label className="block text-xs text-foreground font-medium mb-1.5">
      Reason for leaving (optional)
    </label>
    <select
      value={deactivateReason}
      onChange={(e) => setDeactivateReason(e.target.value)}
      className="w-full px-4 py-2.5 rounded-sm bg-background border border-gray-300 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20"
    >
      <option value="">Select a reason…</option>
      <option value="Not useful anymore">Not useful anymore</option>
      <option value="Found another platform">Found another platform</option>
      <option value="Privacy concerns">Privacy concerns</option>
      <option value="Taking a break">Taking a break</option>
      <option value="Too many emails / notifications">Too many emails / notifications</option>
      <option value="Other">Other</option>
    </select>
  </div>

  <div>
    <label className="block text-xs text-foreground font-medium mb-1.5">
      Enter your password to confirm deactivation
    </label>
    <input
      type="password"
      required
      placeholder="Your Password"
      value={deactivatePassword}
      onChange={(e) => setDeactivatePassword(e.target.value)}
      className="w-full px-4 py-2.5 rounded-sm bg-background border border-gray-300 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20"
    />
  </div>

  <div className="flex items-center justify-end gap-2">
    <button
      type="button"
      onClick={() => setShowDeactivate(false)}
      className="px-4 py-2 rounded-sm border border-gray-200 text-xs font-semibold text-foreground hover:bg-surface"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={deactivating}
      className="px-4 py-2 rounded-sm bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
    >
      {deactivating ? "Deactivating…" : "Confirm Deactivation"}
    </button>
  </div>
</form>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideFromSearch}
                  onChange={(e) => setHideFromSearch(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500/20"
                />
                Hide my profile from Discover search
              </label>

              <div>
                <button
                  onClick={savePrivacy}
                  className="w-full sm:w-auto px-5 py-3 rounded-sm bg-background text-foreground text-xs font-semibold hover:bg-gray-400 transition-colors shadow-sm"
                >
                  Save privacy settings
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}