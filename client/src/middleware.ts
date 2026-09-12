
import { NextResponse, type NextRequest } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  try {
    const res = await fetch(
      `${API}/api/seo/redirects/resolve?path=${encodeURIComponent(path)}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return NextResponse.next();

    const { redirect } = await res.json();
    if (!redirect?.to) return NextResponse.next();

    const url = /^https?:\/\//i.test(redirect.to)
      ? redirect.to
      : new URL(redirect.to, request.url);

    return NextResponse.redirect(url, redirect.type === 302 ? 302 : 301);
  } catch {
    return NextResponse.next();
  }
}

export const config = {

  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads|admin|app).*)"],
};