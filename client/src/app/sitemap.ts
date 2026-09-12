
import type { MetadataRoute } from "next";

const API = process.env.NEXT_PUBLIC_API_URL;

export const revalidate = 3600; // hourly

const STATIC_PATHS = [
  "",
  "/about",
  "/services",
  "/discover",
  "/explore",
  "/blog",
  "/contact",
  "/how-it-works",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let seo: any = {};
  try {
    const res = await fetch(`${API}/api/seo`, { next: { revalidate: 300 } });
    seo = (await res.json()).seo || {};
  } catch {
  }

  const base = (seo.canonicalBaseUrl || "").replace(/\/+$/, "");
  if (!base || seo.allowIndexing === false) return [];

  const changeFrequency = (seo.sitemapChangeFreq || "weekly") as any;
  const priority = typeof seo.sitemapPriority === "number" ? seo.sitemapPriority : 0.7;

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency,
    priority: p === "" ? 1 : priority,
  }));

  if (seo.sitemapIncludeBlog) {
    try {
      const res = await fetch(`${API}/api/blogs?limit=500`, { next: { revalidate: 3600 } });
      const { blogs = [] } = await res.json();
      blogs.forEach((b: any) => {
        if (!b.slug) return;
        entries.push({
          url: `${base}/blog/${b.slug}`,
          lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(),
          changeFrequency,
          priority,
        });
      });
    } catch {}
  }

  if (seo.sitemapIncludeServices) {
    try {
      const res = await fetch(`${API}/api/services?limit=500`, { next: { revalidate: 3600 } });
      const { services = [] } = await res.json();
      services.forEach((s: any) => {
        if (!s._id) return;
        entries.push({
          url: `${base}/services/${s._id}`,
          lastModified: s.updatedAt ? new Date(s.updatedAt) : new Date(),
          changeFrequency,
          priority,
        });
      });
    } catch {}
  }

  if (seo.sitemapIncludeProfiles) {
    try {
      const res = await fetch(`${API}/api/profiles/public?limit=500`, {
        next: { revalidate: 3600 },
      });
      const { profiles = [] } = await res.json();
      profiles.forEach((p: any) => {
        if (!p.handle) return;
        entries.push({
          url: `${base}/${p.role === "brand" ? "brands" : "creator"}/${p.handle}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          changeFrequency,
          priority,
        });
      });
    } catch {}
  }

  return entries;
}