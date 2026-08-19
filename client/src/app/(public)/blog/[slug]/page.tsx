"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DOMPurify from "dompurify";
import { apiFetch } from "@/lib/api";

export default function BlogArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/api/blogs/${slug}`)
      .then((data) => setPost(data.blog))
      .catch((err) => setError(err.message || "Post not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-center px-6">
        <div>
          <p className="text-white font-semibold">Post not found</p>
          <Link href="/blog" className="text-red-500 text-sm hover:underline mt-2 inline-block">
            ← Back to blog
          </Link>
        </div>
      </div>
    );
  }

  const cleanContent = DOMPurify.sanitize(post.content || "");

  return (
    <div className="bg-black text-white min-h-screen px-4 sm:px-6 py-12 sm:py-16 overflow-x-hidden">
      <article className="max-w-3xl mx-auto w-full">
        <Link href="/blog" className="text-xs text-zinc-500 hover:text-white transition">
          ← Back to blog
        </Link>

        {/* ── Featured image ── */}
        {post.image && (
          <div className="mt-6 w-full h-64 sm:h-80 lg:h-[420px] rounded-2xl overflow-hidden border border-zinc-800">
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}${post.image}`}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* ── Meta ── */}
        <div className="mt-8">
          {post.category && (
            <span className="text-xl  text-red-500 font-semibold">
              {post.category}
            </span>
          )}

          <h1 className="text-3xl sm:text-3xl font-semibold mt-3 leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400 mt-4">
            {post.author && (
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-white">
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

          {/* ── Tags ── */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${tag}`}
                  className="text-xs px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-red-600 hover:text-white transition"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Content (rendered HTML from the editor) ── */}
        <div
          className="mt-10 prose prose-invert max-w-none w-full break-words text-zinc-300 leading-relaxed
                     prose-headings:text-white prose-strong:text-white prose-a:text-red-500
                     prose-p:break-words prose-p:[overflow-wrap:anywhere]
                     prose-img:rounded-xl prose-img:border prose-img:border-zinc-800 prose-img:my-6
                     prose-img:max-h-[420px] prose-img:w-auto prose-img:max-w-full prose-img:mx-auto prose-img:block"
          style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
          dangerouslySetInnerHTML={{ __html: cleanContent }}
        />

        {/* ── Secondary images ── */}
        {post.secondaryImages?.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
            {post.secondaryImages.map((img: string, i: number) => (
              <div
                key={i}
                className="aspect-[4/3] rounded-xl overflow-hidden border border-zinc-800"
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
    </div>
  );
}