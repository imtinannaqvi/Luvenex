"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  FiMoreVertical,
  FiGrid,
  FiUsers,
  FiBriefcase,
  FiBook,
  FiShield,
  FiDollarSign,
  FiInbox,
  FiTag,
  FiEdit3,
  FiFlag,
  FiAlertCircle,
  FiMail,
  FiCheckCircle,
  FiGift,
  FiSettings,
  FiPower,
  FiMenu,
  FiX,
  FiChevronDown,
} from "react-icons/fi";
import { getToken, getUser, clearSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

type NavItem = {
  href: string;
  label: string;
  icon: any;
  children?: { href: string; label: string }[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: FiGrid },
  { href: "/admin/users", label: "Users", icon: FiUsers },
  { href: "/admin/deals", label: "Deals", icon: FiBriefcase },
  { href: "/admin/ledger", label: "Ledger", icon: FiBook },
  { href: "/admin/kyc", label: "KYC Queue", icon: FiShield },
  { href: "/admin/payouts", label: "Payout Queue", icon: FiDollarSign },
  { href: "/admin/service-requests", label: "Service Requests", icon: FiInbox },
  { href: "/admin/service", label: "Services", icon: FiTag },
  { href: "/admin/blog", label: "Blog", icon: FiEdit3 },
  { href: "/admin/messages", label: "Flagged Messages", icon: FiFlag },
  { href: "/admin/complaints", label: "Complaints", icon: FiAlertCircle },
  { href: "/admin/contact-messages", label: "Contact Messages", icon: FiMail },
  {
    href: "/admin/verification",
    label: "Verification Requests",
    icon: FiCheckCircle,
  },
  { href: "/admin/referrals", label: "Referrals", icon: FiGift },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: FiSettings,
    children: [
      { href: "/admin/settings/platform", label: "Platform" },
      { href: "/admin/settings/branding", label: "Branding" },
      { href: "/admin/settings/announcements", label: "Announcements" },
      { href: "/admin/settings/support", label: "Support" },
    ],
  },
];

const countKeyMap: Record<string, string> = {
  "/admin/complaints": "complaints",
  "/admin/messages": "flaggedMessages",
  "/admin/service-requests": "serviceRequests",
  "/admin/verification": "verificationRequests",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) return router.push("/login");
    if (user.role !== "admin") return router.push("/");
    setChecked(true);
  }, [router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Keep the group containing the current page expanded, including after a refresh.
  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      if (item.children && pathname.startsWith(item.href)) {
        setOpenGroups((prev) =>
          prev.includes(item.href) ? prev : [...prev, item.href]
        );
      }
    });
  }, [pathname]);

  useEffect(() => {
    if (!checked) return;

    const loadCounts = () => {
      apiFetch("/api/admin/pending-counts", { token: getToken()! })
        .then(setPendingCounts)
        .catch(() => {});
    };
    loadCounts();
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, [checked]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const sidebarExpanded = mobileOpen || isOpen;

  const toggleGroup = (href: string) =>
    setOpenGroups((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );

  const SidebarInner = (
    <>
      <div
        className={`flex items-center mb-6 shrink-0 ${
          sidebarExpanded ? "justify-between" : "justify-center"
        }`}
      >
        <h2
          className={`font-bold text-xl tracking-tight overflow-hidden whitespace-nowrap transition-all duration-300 ${
            sidebarExpanded ? "opacity-100" : "opacity-0 w-0"
          }`}
        >
          Admin
        </h2>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-paper transition shrink-0"
        >
          <FiMoreVertical size={18} />
        </button>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          title="Close menu"
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-sm text-white/60 hover:bg-white/10 hover:text-paper transition shrink-0"
        >
          <FiX size={18} />
        </button>
      </div>

      {/* Increased vertical gap between items from gap-1 to gap-2 */}
      <nav className="flex flex-col gap-2 text-sm flex-1 overflow-y-auto overflow-x-hidden pr-1 pb-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const countKey = countKeyMap[item.href];
          const count = countKey ? pendingCounts[countKey] || 0 : 0;

          /* ── Group with children (Settings) ── */
          if (item.children) {
            const inSection = pathname.startsWith(item.href);
            const groupOpen = openGroups.includes(item.href);
            const exactActive = pathname === item.href;

            if (!sidebarExpanded) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`flex items-center py-2.5 px-0 justify-center rounded-sm transition ${
                    inSection
                      ? "bg-primary text-paper font-medium"
                      : "text-white/70 hover:bg-white/10 hover:text-paper"
                  }`}
                >
                  <Icon size={18} className="shrink-0" aria-hidden="true" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              );
            }

            return (
              <div key={item.href} className="flex flex-col">
                <div
                  className={`w-full flex items-center rounded-sm transition overflow-hidden ${
                    exactActive
                      ? "bg-primary text-paper font-medium"
                      : inSection
                      ? "text-paper"
                      : "text-white/70 hover:bg-white/10 hover:text-paper"
                  }`}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 flex items-center gap-3 px-3 py-2.5"
                  >
                    <Icon size={18} className="shrink-0" aria-hidden="true" />
                    <span className="text-left">{item.label}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleGroup(item.href);
                    }}
                    aria-expanded={groupOpen}
                    className="px-2.5 py-2.5 hover:bg-white/10 transition"
                    title={groupOpen ? "Collapse submenu" : "Expand submenu"}
                  >
                    <FiChevronDown
                      size={14}
                      className={`shrink-0 transition-transform duration-200 ${
                        groupOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {groupOpen && (
                  <div className="mt-1.5 mb-1 ml-[26px] pl-3 border-l border-white/20 flex flex-col gap-1.5">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href;

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className={`px-3 py-2 text-xs rounded-sm transition whitespace-nowrap ${
                            childActive
                              ? "bg-primary text-paper font-medium"
                              : "text-white/60 hover:bg-white/10 hover:text-paper"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          /* ── Plain link ── */
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center py-2.5 rounded-sm transition whitespace-nowrap overflow-hidden ${
                sidebarExpanded ? "px-3 gap-3" : "px-0 justify-center"
              } ${
                active
                  ? "bg-primary text-paper font-medium"
                  : "text-white/70 hover:bg-white/10 hover:text-paper"
              }`}
            >
              <Icon size={18} className="shrink-0" aria-hidden="true" />
              <span className={sidebarExpanded ? "flex-1" : "sr-only"}>
                {item.label}
              </span>
              {sidebarExpanded && count > 0 && (
                <span className="w-5 h-5 rounded-sm bg-white/20 text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-3 border-t border-white/10 shrink-0" />

      <button
        onClick={() => {
          setMobileOpen(false);
          clearSession();
          router.push("/login");
        }}
        title="Log out"
        className={`mt-4 pt-2 shrink-0 flex items-center border border-white/20 text-white/80 text-sm py-2 rounded-sm hover:bg-white/10 transition ${
          sidebarExpanded ? "px-3 gap-3 justify-center" : "px-0 justify-center"
        }`}
      >
        <FiPower size={16} className="shrink-0" aria-hidden="true" />
        {sidebarExpanded && <span>Log out</span>}
      </button>
    </>
  );

  return (
    <div className="flex min-h-screen">
      <aside
        className={`hidden md:flex bg-ink text-paper flex-col h-screen sticky top-0 py-6 shrink-0 transition-all duration-300 ease-in-out ${
          isOpen ? "w-64 px-5" : "w-20 px-3"
        }`}
      >
        {SidebarInner}
      </aside>

      <div
        onClick={() => setMobileOpen(false)}
        className={`md:hidden fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-ink text-paper flex flex-col py-6 px-5 overflow-hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {SidebarInner}
      </aside>

      <main className="flex-1 min-w-0 bg-surface overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Mobile topbar — hamburger only */}
        <div className="md:hidden h-14 shrink-0 border-b border-border-color bg-background flex items-center px-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            title="Open menu"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-surface transition"
          >
            <FiMenu size={20} />
          </button>
          <span className="ml-3 font-bold text-foreground">
            <span className="text-primary">Luvenex</span> Admin
          </span>
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}