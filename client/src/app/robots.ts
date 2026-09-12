import type { MetadataRoute } from "next";

const API = process.env.NEXT_PUBLIC_API_URL;

export const revalidate = 300;

export default async function robots(): Promise<MetadataRoute.Robots> {
    try {
        const res = await fetch(`${API}/api/seo`,{ next:{ revalidate: 300}});

        const { seo} = await res.json();

        if(!seo?.allowIndexing){
            return { rules:{ userAgent:"*", disallow:"/"}}
        }

   return {
      rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/app", "/api"] },
      sitemap: seo?.canonicalBaseUrl ? `${seo.canonicalBaseUrl}/sitemap.xml` : undefined,
    };
  } catch {
    return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/app", "/api"] } };
  }
}