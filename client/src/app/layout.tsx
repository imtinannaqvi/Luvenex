import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Replaces the static `metadata` export — the favicon now comes from the
// Branding settings page, with a fallback to /favicon.ico.
export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBranding();
  const favicon = brandingUrl(branding.favicon);

  return {
    title: "Luvenex",
    description: "Connecting brands and creators.",
    icons: favicon ? { icon: favicon } : undefined,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      </body>
    </html>
  );
}