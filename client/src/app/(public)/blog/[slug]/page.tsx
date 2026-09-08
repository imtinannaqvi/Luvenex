"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DOMPurify from "dompurify";
import { apiFetch } from "@/lib/api";
import { FiFacebook, FiTwitter, FiLinkedin, FiLink, FiCheck } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

export default function BlogArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [morePosts, setMorePosts] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    apiFetch(`/api/blogs/${slug}`)
      .then((data) => setPost(data.blog))
      .catch((err) => setError(err.message || "Post not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  // Fetch recent blogs for the "More Articles" sidebar
  useEffect(() => {
    apiFetch(`/api/blogs`)
      .then((data) => {
        const list = data.blogs || data.posts || [];
        setMorePosts(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") setShareUrl(window.location.href);
  }, [slug]);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const enc = (s: string) => encodeURIComponent(s);
  const shareTitle = post?.title || "";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center px-6">
        <div>
          <p className="text-foreground font-semibold">Post not found</p>
          <Link href="/blog" className="text-red-500 text-sm hover:underline mt-2 inline-block">
            ← Back to blog
          </Link>
        </div>
      </div>
    );
  }

  const rawFixed = (post.content || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00A0/g, " ");

  const cleanContent = DOMPurify.sanitize(rawFixed, {
    FORBID_TAGS: ["script", "style"],
    FORBID_ATTR: ["style"],
  });

  // Exclude the current post from "More Articles"
  const otherPosts = morePosts.filter((p) => p.slug !== slug).slice(0, 6);

  return (
    <div className="bg-background text-foreground min-h-screen px-4 sm:px-6 py-12 sm:py-16 overflow-x-hidden">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <article className="lg:col-span-8 w-full min-w-0">
          <Link href="/blog" className="text-xs text-foreground hover:text-red-500 transition">
            ← Back to blog
          </Link>

          <div className="mt-6">
            
            <h1 className="text-3xl sm:text-4xl font-black mt-2 leading-tight break-words">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted mt-4">
              {post.author && (
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-card flex items-center justify-center text-[11px] font-bold text-foreground">
                    {post.author[0]?.toUpperCase()}
                  </span>
                  {post.author}
                </span>
              )}
              <span>
                {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
           {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {post.tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${tag}`}
                  className="text-xs px-3 py-1 rounded-full bg-surface border border-border-color text-foreground hover:border-red-600 transition"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Featured image */}
          {post.image && (
            <div className="mt-6 w-full h-64 sm:h-80 lg:h-[420px] rounded-sm overflow-hidden border border-border-color">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}${post.image}`}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

         

          {/* Content */}
          <div
            className="mt-8 prose prose-invert w-full min-w-0 max-w-full text-foreground leading-relaxed
                       prose-headings:text-foreground prose-strong:text-foreground prose-a:text-red-500
                       prose-p:break-words prose-headings:break-words prose-li:break-words
                       prose-img:rounded-xl prose-img:border prose-img:border-border-color prose-img:my-6
                       prose-img:max-h-[420px] prose-img:w-auto prose-img:max-w-full prose-img:mx-auto prose-img:block"
            style={{
              overflowWrap: "break-word",
              wordBreak: "normal",
              hyphens: "none",
              WebkitHyphens: "none",
              textAlign: "left",
              maxWidth: "100%",
            } as React.CSSProperties}
            dangerouslySetInnerHTML={{ __html: cleanContent }}
          />

          {/* Secondary images */}
          {post.secondaryImages?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
              {post.secondaryImages.map((img: string, i: number) => (
                <div
                  key={i}
                  className="aspect-[4/3] rounded-xl overflow-hidden border border-border-color"
                >
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${img}`}
                    className="w-full h-full object-cover"
                    alt={`${post.title} — ${i + 1}`}
                  />
                </div>
              ))}
            </div>
          )}
        </article>
{/* ── RIGHT: sticky sidebar ── */}
<aside className="lg:col-span-3 w-full min-w-0">
  <div className="lg:sticky lg:top-24 space-y-6">
    {/* Share box */}
    <div className="bg-card border border-border-color rounded-sm p-5">
      <h3 className="text-sm font-bold text-foreground mb-4">Share</h3>
      <div className="grid grid-cols-2 gap-2.5">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#1877F2] text-foreground text-xs font-semibold hover:opacity-90 transition"
        >
          <FiFacebook size={14} /> Facebook
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${enc(shareUrl)}&text=${enc(shareTitle)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#1DA1F2] text-foreground text-xs font-semibold hover:opacity-90 transition"
        >
          <FiTwitter size={14} /> Twitter
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#0A66C2] text-foreground text-xs font-semibold hover:opacity-90 transition"
        >
          <FiLinkedin size={14} /> LinkedIn
        </a>
        <a
          href={`https://wa.me/?text=${enc(shareTitle + " " + shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2 rounded-lg bg-[#25D366] text-foreground text-xs font-semibold hover:opacity-90 transition"
        >
          <FaWhatsapp size={14} /> WhatsApp
        </a>
      </div>
      <button
        onClick={copyLink}
        className="w-full mt-2.5 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-foreground/90 text-background text-xs font-semibold hover:bg-foreground transition"
      >
        {copied ? <FiCheck size={14} /> : <FiLink size={14} />}
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>

    {/* More Articles */}
    <div className="bg-card border border-border-color rounded-sm p-5">
      <h3 className="text-lg font-bold text-foreground mb-4">More Articles</h3>
      {otherPosts.length === 0 ? (
        <p className="text-xs text-muted">No other articles yet.</p>
      ) : (
        <div className="space-y-4">
          {otherPosts.map((p) => (
            <Link
              key={p._id || p.slug}
              href={`/blog/${p.slug}`}
              className="flex items-center gap-3.5 group"
            >
              <div className="w-20 h-16 rounded-sm overflow-hidden border border-border-color shrink-0 bg-surface">
                {p.image ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${p.image}`}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted">
                    No img
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-red-500 transition">
                  {p.title}
                </p>
                <p className="text-xs text-muted mt-1">
                  {new Date(p.publishedAt || p.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  </div>
</aside>
      </div>
    </div>
  );
}