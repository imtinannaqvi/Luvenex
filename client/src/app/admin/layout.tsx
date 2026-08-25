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
} from "react-icons/fi";
import { getToken, getUser, clearSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

const NAV_ITEMS = [
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
  { href: "/admin/settings", label: "Settings", icon: FiSettings },
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

  const SidebarInner = (
    <>
      <div
        className={`flex items-center mb-6 shrink-0 ${
          sidebarExpanded ? "justify-between" : "justify-center"
        }`}
      >
        <h2
          className={`font-bold text-lg tracking-tight overflow-hidden whitespace-nowrap transition-all duration-300 ${
            sidebarExpanded ? "opacity-100" : "opacity-0 w-0"
          }`}
        >
          <span className="text-primary">Luvenex</span> Admin
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
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-paper transition shrink-0"
        >
          <FiX size={18} />
        </button>
      </div>

      <nav className="flex flex-col gap-1 text-sm flex-1 overflow-y-auto overflow-x-hidden pr-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const countKey = countKeyMap[item.href];
          const count = countKey ? pendingCounts[countKey] || 0 : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center py-2 rounded-lg transition whitespace-nowrap overflow-hidden ${
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
                <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => {
          setMobileOpen(false);
          clearSession();
          router.push("/login");
        }}
        title="Log out"
        className={`mt-4 shrink-0 flex items-center border border-white/20 text-white/80 text-sm py-2 rounded-lg hover:bg-white/10 transition ${
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
          isOpen ? "w-56 px-5" : "w-20 px-3"
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
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-56 bg-ink text-paper flex flex-col py-6 px-5 overflow-hidden transition-transform duration-300 ease-in-out ${
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