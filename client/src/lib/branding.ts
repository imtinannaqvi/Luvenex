const API = process.env.NEXT_PUBLIC_API_URL;

export type Branding = {
  logo: string | null;
  favicon: string | null;
};


export async function getBranding(): Promise<Branding> {
  try {
    const res = await fetch(`${API}/api/branding`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    return {
      logo: data.branding?.logo ?? null,
      favicon: data.branding?.favicon ?? null,
    };
  } catch {
    return { logo: null, favicon: null };
  }
}

export const brandingUrl = (path: string | null) => (path ? `${API}${path}` : null);