"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  FiMoreVertical,
  FiGrid,
  FiTarget,
  FiFileText,
  FiCreditCard,
  FiMessageSquare,
  FiClipboard,
  FiUser,
  FiPackage,
  FiPower,
  FiVideo,
  FiCompass,
  FiGift,
  FiBookmark,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { getToken, getUser, clearSession } from "@/lib/auth";
import NotificationBell from "@/components/NotificationBell";
import {
  NotificationsProvider,
  useNotifications,
} from "@/context/Notificationscontext";

export default function UserAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [role, setRole] = useState<"brand" | "influencer" | null>(null);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) return router.push("/login");
    if (user.role === "admin") return router.push("/admin");
    setRole(user.role);
    setChecked(true);
  }, [router]);

  if (!checked || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Provider wraps the shell so both the sidebar badges and the
  // NotificationBell read from a single polling source.
  return (
    <NotificationsProvider>
      <AppShell role={role}>{children}</AppShell>
    </NotificationsProvider>
  );
}

/* Small badge shown on a nav item. Renders inline when the sidebar is
    open, and as a corner dot when collapsed. */
function NavBadge({ count, isOpen }: { count: number; isOpen: boolean }) {
  if (count <= 0) return null;
  const label = count > 9 ? "9+" : String(count);
  return isOpen ? (
    <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
      {label}
    </span>
  ) : (
    <span className="absolute right-1 top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-white">
      {label}
    </span>
  );
}

function AppShell({
  role,
  children,
}: {
  role: "brand" | "influencer";
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // Desktop collapse (icons vs full). Only affects md+.
  const [isOpen, setIsOpen] = useState(true);
  // Mobile drawer open/closed. Only affects < md.
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const { badgeCounts } = useNotifications();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Messages page renders its own full-bleed panel — skip the shell's
  // default page padding for that route only.
  const isFullBleedPage = pathname === "/app/messages";

  // On mobile the drawer is always the expanded (labelled) sidebar;
  // the icon-collapse only applies on md+.
  const sidebarExpanded = mobileOpen || isOpen;

  const navItems =
    role === "brand"
      ? [
          { href: "/app", label: "Overview", icon: FiGrid },
          { href: "/app/campaigns", label: "Campaigns", icon: FiTarget },
          { href: "/app/deals", label: "Deals", icon: FiFileText },
          { href: "/app/wallet", label: "Wallet", icon: FiCreditCard },
          { href: "/app/messages", label: "Messages", icon: FiMessageSquare },
          {
            href: "/app/service-requests",
            label: "Service Requests",
            icon: FiClipboard,
          },
          { href: "/app/Appvideos", label: "Videos", icon: FiVideo },
          {
            href: "/app/saved-videos",
            label: "Saved Videos",
            icon: FiBookmark,
          },
          { href: "/app/profile", label: "Profile", icon: FiUser },
        ]
      : [
          { href: "/app", label: "Overview", icon: FiGrid },
          { href: "/app/gigs", label: "Gigs", icon: FiPackage },
          {
            href: "/app/applications",
            label: "Applications",
            icon: FiClipboard,
          },
          { href: "/app/deals", label: "Deals", icon: FiFileText },
          { href: "/app/messages", label: "Messages", icon: FiMessageSquare },
          { href: "/app/profile", label: "Profile", icon: FiUser },
          { href: "/app/Appvideos", label: "Videos", icon: FiVideo },
          {
            href: "/app/saved-videos",
            label: "Saved Videos",
            icon: FiBookmark,
          },
          {
            href: "/app/discover-campaigns",
            label: "Browse Campaigns",
            icon: FiCompass,
          },
          { href: "/app/referrals", label: "Referrals", icon: FiGift },
        ];

  const renderNavItem = (item: (typeof navItems)[number]) => {
    const Icon = item.icon;
    const active = pathname === item.href;
    const count = badgeCounts[item.href] || 0;
    return (
      <Link
        key={item.href}
        href={item.href}
        title={item.label}
        onClick={() => setMobileOpen(false)}
        className={`relative flex items-center gap-3 py-2.5 rounded-xl transition-colors ${
          sidebarExpanded ? "px-3" : "px-0 justify-center"
        } ${
          active
            ? "bg-white/10 text-paper font-medium"
            : "text-white/55 hover:bg-white/5 hover:text-white/90"
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-primary" />
        )}
        <Icon size={17} className="shrink-0" />
        <span
          className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
            sidebarExpanded
              ? "opacity-100 max-w-[160px]"
              : "opacity-0 max-w-0"
          }`}
        >
          {item.label}
        </span>
        <NavBadge count={count} isOpen={sidebarExpanded} />
      </Link>
    );
  };

  const SidebarInner = (
    <>
      <div
        className={`flex items-center mb-6 shrink-0 ${
          sidebarExpanded ? "justify-between px-5" : "justify-center px-3"
        }`}
      >
        <h2
          className={`font-bold text-lg tracking-tight overflow-hidden whitespace-nowrap transition-all duration-300 ${
            sidebarExpanded ? "opacity-100" : "opacity-0 w-0"
          }`}
        >
          <span className="text-primary">Luvenex</span>
        </h2>

        {/* Desktop collapse toggle (md+ only) */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-paper transition shrink-0"
        >
          <FiMoreVertical size={17} />
        </button>

        {/* Mobile close button (< md only) */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          title="Close menu"
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-paper transition shrink-0"
        >
          <FiX size={18} />
        </button>
      </div>

      <nav
        className={`flex flex-col gap-0.5 text-sm flex-1 overflow-y-auto overflow-x-hidden pr-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none] ${
          sidebarExpanded ? "px-4" : "px-3"
        }`}
      >
        {navItems.slice(0, 4).map(renderNavItem)}

        {role === "influencer" && (
          <div>
            <button
              onClick={() => setWalletMenuOpen((prev) => !prev)}
              className={`w-full relative flex items-center gap-3 py-2.5 rounded-xl transition-colors ${
                sidebarExpanded ? "px-3" : "px-0 justify-center"
              } ${
                pathname.startsWith("/app/wallet")
                  ? "bg-white/10 text-paper font-medium"
                  : "text-white/55 hover:bg-white/5 hover:text-white/90"
              }`}
            >
              {pathname.startsWith("/app/wallet") && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-primary" />
              )}
              <FiCreditCard size={17} className="shrink-0" />
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-200 flex-1 text-left ${
                  sidebarExpanded
                    ? "opacity-100 max-w-[160px]"
                    : "opacity-0 max-w-0"
                }`}
              >
                Wallet & Payouts
              </span>
              {sidebarExpanded && (
                <svg
                  className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                    walletMenuOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </button>

            {walletMenuOpen && sidebarExpanded && (
              <div className="ml-6 mt-0.5 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                <Link
                  href="/app/wallet"
                  onClick={() => setMobileOpen(false)}
                  className={`text-xs py-2 px-2 rounded-lg transition-colors ${
                    pathname === "/app/wallet"
                      ? "text-paper font-medium"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  Wallet
                </Link>
                <Link
                  href="/app/wallet/withdrawals"
                  onClick={() => setMobileOpen(false)}
                  className={`text-xs py-2 px-2 rounded-lg transition-colors ${
                    pathname === "/app/wallet/withdrawals"
                      ? "text-paper font-medium"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  Withdrawal Requests
                </Link>
              </div>
            )}
          </div>
        )}

        {navItems.slice(4).map(renderNavItem)}
      </nav>

      <div className={sidebarExpanded ? "px-4" : "px-3"}>
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          title="Visit Luvenex"
          className={`mt-4 shrink-0 w-full flex items-center gap-2 border border-white/15 text-white/70 text-sm py-2.5 rounded-xl hover:bg-white/5 hover:text-paper transition ${
            sidebarExpanded ? "px-3 justify-start" : "justify-center"
          }`}
        >
          <FiCompass size={16} className="shrink-0 text-primary" />
          <span
            className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
              sidebarExpanded
                ? "opacity-100 max-w-[120px]"
                : "opacity-0 max-w-0"
            }`}
          >
            Visit Luvenex
          </span>
        </Link>

        <button
          onClick={() => {
            setMobileOpen(false);
            clearSession();
            router.push("/login");
          }}
          title="Log out"
          className={`mt-2 shrink-0 w-full flex items-center gap-2 border border-white/15 text-white/70 text-sm py-2.5 rounded-xl hover:bg-white/5 hover:text-paper transition ${
            sidebarExpanded ? "px-3 justify-start" : "justify-center"
          }`}
        >
          <FiPower size={16} className="shrink-0" />
          <span
            className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
              sidebarExpanded
                ? "opacity-100 max-w-[120px]"
                : "opacity-0 max-w-0"
            }`}
          >
            Log out
          </span>
        </button>
      </div>
    </>
  );

  return (
    <div
      className="fixed inset-0 md:grid overflow-hidden"
      style={{
        gridTemplateColumns: isOpen ? "15rem 1fr" : "76px 1fr",
        transition: "grid-template-columns 300ms ease-in-out",
      }}
    >
      {/* ── Desktop sidebar (in the grid, md+) ── */}
      <aside className="hidden md:flex bg-ink text-paper flex-col h-full py-6 overflow-hidden">
        {SidebarInner}
      </aside>

      {/* ── Mobile drawer + backdrop (< md) ── */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`md:hidden fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          mobileOpen
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-[15rem] bg-ink text-paper flex flex-col py-6 overflow-hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {SidebarInner}
      </aside>

      {/* ── Main content ── */}
      <main className="min-w-0 h-full bg-surface overflow-y-auto overflow-x-hidden flex flex-col">
        {/* ── Topbar with hamburger + Notification Bell ── */}
        <div className="h-16 shrink-0 border-b border-border-color bg-background flex items-center justify-between px-4 sm:px-6">
          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            title="Open menu"
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-surface transition"
          >
            <FiMenu size={20} />
          </button>

          {/* Spacer keeps the bell right-aligned on desktop */}
          <div className="hidden md:block" />

          <NotificationBell />
        </div>

        <div
          className={
            isFullBleedPage
              ? "flex-1 flex flex-col overflow-hidden"
              : "flex-1 p-4 sm:p-6 lg:p-8"
          }
        >
          {children}
        </div>
      </main>
    </div>
  );
}