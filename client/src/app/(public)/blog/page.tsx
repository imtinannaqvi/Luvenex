"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

function BlogImage({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-zinc-900 via-zinc-950 to-black flex items-center justify-center`}
      >
        <span className="text-red-600 text-3xl font-black">L</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setErrored(true)}
      className={`${className} object-cover`}
    />
  );
}

export default function BlogListingPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (q) {
        params.set("q", q);
      }

      const [allData, featuredData] = await Promise.all([
        apiFetch(`/api/blogs?${params.toString()}`),
        apiFetch(`/api/blogs?featured=true&limit=3`),
      ]);

      setPosts(allData.blogs || []);
      setFeaturedPosts(featuredData.blogs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const getExcerpt = (content: string) => {
    if (!content) {
      return "Discover the latest insights, ideas, and stories from Luvenex.";
    }

    return content
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto">


        <div className="text-center max-w-2xl mx-auto mb-10">

       

          <h1 className="text-xl sm:text-3xl lg:text-3xl font-black tracking-tight">
            Luvenex{" "}
            <span className="text-red-600">
              Blog
            </span>
          </h1>

          <p className="text-zinc-500 text-sm sm:text-base mt-4 italic leading-relaxed">
            Insights, ideas, and stories about creators, brands, <br /> digital
            marketing, and building meaningful collaborations.
          </p>

        </div>

        {/* ================= SEARCH ================= */}

        <form
          onSubmit={handleSearch}
          className="max-w-lg mx-auto mb-12"
        >
          <div className="flex gap-2">

            <input
              type="text"
              placeholder="Search articles..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="
                flex-1
                px-4
                py-3
                rounded-xl
                border
                border-zinc-800
                bg-zinc-950
                text-white
                text-sm
                placeholder:text-zinc-600
                focus:outline-none
                focus:border-red-600
                focus:ring-1
                focus:ring-red-600/30
                transition
              "
            />

            <button
              type="submit"
              className="
                px-6
                py-3
                rounded-xl
                bg-red-600
                hover:bg-red-700
                text-white
                text-sm
                font-bold
                transition
                shadow-lg
                shadow-red-950/30
              "
            >
              Search
            </button>

          </div>
        </form>

        {/* ================= LOADING ================= */}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">

            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="
                  bg-white
                  rounded-2xl
                  overflow-hidden
                  shadow-xl
                  animate-pulse
                "
              >
                <div className="h-56 bg-zinc-800" />

                <div className="p-5">

                  <div className="h-3 w-20 bg-zinc-300 rounded mb-4" />

                  <div className="h-5 w-full bg-zinc-300 rounded mb-2" />

                  <div className="h-5 w-4/5 bg-zinc-300 rounded mb-5" />

                  <div className="h-3 w-24 bg-zinc-300 rounded" />

                </div>
              </div>
            ))}

          </div>
        ) : (
          <>
            {/* ================= NO POSTS ================= */}

            {posts.length === 0 ? (
              <div className="max-w-md mx-auto bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center">

                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-red-950/30 border border-red-900/50 flex items-center justify-center">
                  <span className="text-red-600 text-xl font-black">
                    L
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                  No posts found
                </h3>

                <p className="text-sm text-zinc-500">
                  Try searching with a different keyword.
                </p>

              </div>
            ) : (
              <>

                {/* ================= SECTION TITLE ================= */}

                <div className="flex items-center justify-between mb-6">

                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {q ? "Search Results" : "Latest Articles"}
                    </h2>

                    <div className="mt-2 w-10 h-1 bg-red-600 rounded-full" />
                  </div>

                  <span className="text-xs text-zinc-600">
                    {posts.length} {posts.length === 1 ? "article" : "articles"}
                  </span>

                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">

                  {posts.map((post) => (

                    <Link
                      key={post._id}
                      href={`/blog/${post.slug}`}
                      className="
                        group
                        flex
                        flex-col
                        bg-ink
                        rounded-md
                        overflow-hidden
                        border
                        border-zinc-800
                        shadow-xl
                        shadow-black/40
                        transition-all
                        duration-300
                        hover:-translate-y-1
                      
                        hover:shadow-primary/20
                      "
                    >

                      {/* ================= IMAGE ================= */}

                      <div className="relative w-full h-56 overflow-hidden bg-zinc-900">

                        <BlogImage
                          src={
                            post.image
                              ? `${process.env.NEXT_PUBLIC_API_URL}${post.image}`
                              : undefined
                          }
                          alt={post.title}
                          className="
                            w-full
                            h-full
                            object-cover
                            transition-transform
                            duration-700
                            group-hover:scale-105
                          "
                        />

                        {/* Image Overlay */}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70" />


                      </div>

                      {/* ================= CARD CONTENT ================= */}

                      <div className="p-5 sm:p-6 flex flex-col flex-1">

                        {/* Author + Date */}

                        <div className="flex items-center gap-3 textwhite text-md mb-4">

                          {post.author && (
                            <div className="flex items-center gap-1.5">

                              <div
                                className="
                                  w-6
                                  h-6
                                  rounded-full
                                  bg-black
                                  text-white
                                  flex
                                  items-center
                                  justify-center
                                  text-[9px]
                                  font-bold
                                "
                              >
                                {post.author[0]?.toUpperCase()}
                              </div>

                              <span className="truncate max-w-[120px]">
                                {post.author}
                              </span>

                            </div>
                          )}

                          {post.author && (
                            <span className="text-zinc-300">
                              •
                            </span>
                          )}

                          <div className="flex items-center gap-1.5">
                            <span className="text-red-600">
                              ▣
                            </span>

                            <span>
                              {formatDate(
                                post.publishedAt || post.createdAt
                              )}
                            </span>
                          </div>

                        </div>

                        {/* Title */}

                        <h3
                          className="
                            text-md
                            sm:text-lg
                            font-black
                            leading-tight
                            text-white
                            transition-colors
                            italic
                            duration-200
                            line-clamp-2
                          "
                        >
                          {post.title}
                        </h3>

                        {/* Excerpt */}

                        <p
                          className="
                            mt-4
                            text-sm
                            text-zinc-500
                            leading-6
                            line-clamp-3
                          "
                        >
                          {getExcerpt(post.content)}
                        </p>

                        {/* Read More */}

                        <div
                          className="
                            mt-auto
                            pt-5
                            flex
                            items-center
                            gap-2
                            text-sm
                            font-semibold
                            text-red-600
                            group-hover:text-red-700
                            transition
                          "
                        >
                          <span>
                            Read more
                          </span>

                          <span
                            className="
                              text-lg
                              transition-transform
                              duration-300
                              group-hover:translate-x-1
                            "
                          >
                            →
                          </span>
                        </div>

                      </div>

                    </Link>

                  ))}

                </div>

              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}