// client/src/lib/seo.ts
const API = process.env.NEXT_PUBLIC_API_URL;

export type Seo = {
  siteName: string;
  titleTemplate: string;
  defaultDescription: string;
  defaultKeywords: string;
  canonicalBaseUrl: string;
  allowIndexing: boolean;
  ogImage: string | null;
  ogTitle: string;
  ogDescription: string;
  twitterCard: "summary" | "summary_large_image";
  twitterHandle: string;
  googleAnalyticsId: string;
  googleSiteVerification: string;
  bingSiteVerification: string;
  facebookPixelId: string;
};

const FALLBACK: Seo = {
  siteName: "Luvenex",
  titleTemplate: "%s | Luvenex",
  defaultDescription: "",
  defaultKeywords: "",
  canonicalBaseUrl: "",
  allowIndexing: true,
  ogImage: null,
  ogTitle: "",
  ogDescription: "",
  twitterCard: "summary_large_image",
  twitterHandle: "",
  googleAnalyticsId: "",
  googleSiteVerification: "",
  bingSiteVerification: "",
  facebookPixelId: "",
};


export async function getSeo(): Promise<Seo> {
  try {
    const res = await fetch(`${API}/api/seo`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    return { ...FALLBACK, ...(data.seo || {}) };
  } catch {
    return FALLBACK;
  }
}

export const seoUrl = (path: string | null) => (path ? `${API}${path}` : null);