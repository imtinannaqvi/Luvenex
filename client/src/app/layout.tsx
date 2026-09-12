import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { ContactPanelProvider } from "@/components/ContactPanel";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "next-themes";
import { NotificationsProvider } from "@/context/Notificationscontext";
import SplashScreen from "@/components/SplashScreen";
import ScrollToTop from "@/components/ScrollToTop";
import { getBranding, brandingUrl } from "@/lib/branding";
import { getSeo, seoUrl } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Everything here comes from Settings → SEO Manager and Settings → Branding,
 * so copy can change without a redeploy. Both helpers cache for 5 minutes and
 * fall back to safe defaults if the API is unreachable.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [seo, branding] = await Promise.all([getSeo(), getBranding()]);

  const favicon = brandingUrl(branding.favicon);
  const ogImage = seoUrl(seo.ogImage);
  const base = seo.canonicalBaseUrl || undefined;


  const shareTitle = seo.ogTitle || seo.siteName;
  const shareDescription = seo.ogDescription || seo.defaultDescription;

  return {
    ...(base && { metadataBase: new URL(base) }),

    title: {
      default: seo.siteName,
      template: seo.titleTemplate || `%s | ${seo.siteName}`,
    },
    description: seo.defaultDescription || undefined,
    keywords: seo.defaultKeywords || undefined,

    icons: favicon ? { icon: favicon } : undefined,

    robots: seo.allowIndexing
      ? { index: true, follow: true }
      : { index: false, follow: false },

    alternates: base ? { canonical: "/" } : undefined,

    openGraph: {
      type: "website",
      siteName: seo.siteName,
      title: shareTitle,
      description: shareDescription || undefined,
      ...(base && { url: base }),
      ...(ogImage && {
        images: [{ url: ogImage, width: 1200, height: 630, alt: seo.siteName }],
      }),
    },

    twitter: {
      card: seo.twitterCard,
      title: shareTitle,
      description: shareDescription || undefined,
      ...(seo.twitterHandle && { creator: seo.twitterHandle, site: seo.twitterHandle }),
      ...(ogImage && { images: [ogImage] }),
    },

    verification: {
      ...(seo.googleSiteVerification && { google: seo.googleSiteVerification }),
      ...(seo.bingSiteVerification && { other: { "msvalidate.01": seo.bingSiteVerification } }),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const seo = await getSeo();
  const ga = seo.googleAnalyticsId?.trim();
  const pixel = seo.facebookPixelId?.trim();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ScrollToTop/>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SplashScreen />
          <NotificationsProvider>
            <ContactPanelProvider>
              <Navbar />
              {children}
            </ContactPanelProvider>
            <ToastContainer position="top-center" theme="dark" autoClose={4000} limit={3} newestOnTop />
          </NotificationsProvider>
        </ThemeProvider>


        {ga && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga}');
              `}
            </Script>
          </>
        )}

        {pixel && (
          <Script id="fb-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${pixel}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </body>
    </html>
  );
}