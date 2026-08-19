"use client"
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
} from "react-icons/fi";
import { getToken, getUser, clearSession } from "@/lib/auth";

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: FiGrid },
  { href: '/admin/users', label: 'Users', icon: FiUsers },
  { href: '/admin/deals', label: 'Deals', icon: FiBriefcase },
  { href: '/admin/ledger', label: 'Ledger', icon: FiBook },
  { href: '/admin/kyc', label: 'KYC Queue', icon: FiShield },
  { href: '/admin/payouts', label: 'Payout Queue', icon: FiDollarSign },
  { href: '/admin/service-requests', label: 'Service Requests', icon: FiInbox },
  { href: '/admin/service', label: 'Service', icon: FiTag },
  { href: '/admin/blog', label: 'Blog', icon: FiEdit3 },
  { href: '/admin/messages', label: 'Flagged Messages', icon: FiFlag },
  { href: '/admin/complaints', label: 'Complaints', icon: FiAlertCircle },
  { href: '/admin/contact-messages', label: 'Contact Messages', icon: FiMail },
  { href: '/admin/verification', label: 'Verification Requests', icon: FiCheckCircle },
  { href: '/admin/referrals', label: 'Referrals', icon: FiGift },
  { href: '/admin/settings', label: 'Settings', icon: FiSettings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) return router.push('/login');
    if (user.role !== 'admin') return router.push('/');
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside
        className={`bg-ink text-paper flex flex-col h-screen sticky top-0 py-6 shrink-0 transition-all duration-300 ease-in-out ${
          isOpen ? "w-56 px-5" : "w-20 px-3"
        }`}
      >
        <div className={`flex items-center mb-6 shrink-0 ${isOpen ? "justify-between" : "justify-center"}`}>
          <h2 className={`font-bold text-lg tracking-tight overflow-hidden whitespace-nowrap transition-all duration-300 ${
            isOpen ? "opacity-100" : "opacity-0 w-0"
          }`}>
            <span className="text-primary">Luvenex</span> Admin
          </h2>

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-paper transition shrink-0"
          >
            <FiMoreVertical size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 text-sm flex-1 overflow-y-auto overflow-x-hidden pr-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center py-2 rounded-lg transition whitespace-nowrap overflow-hidden ${
                  isOpen ? "px-3 gap-3" : "px-0 justify-center"
                } ${
                  active
                    ? 'bg-primary text-paper font-medium'
                    : 'text-white/70 hover:bg-white/10 hover:text-paper'
                }`}
              >
                <Icon size={18} className="shrink-0" aria-hidden="true" />
                <span className={isOpen ? "" : "sr-only"}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => { clearSession(); router.push('/login'); }}
          title="Log out"
          className={`mt-4 shrink-0 flex items-center border border-white/20 text-white/80 text-sm py-2 rounded-lg hover:bg-white/10 transition ${
            isOpen ? "px-3 gap-3 justify-center" : "px-0 justify-center"
          }`}
        >
          <FiPower size={16} className="shrink-0" aria-hidden="true" />
          {isOpen && <span>Log out</span>}
        </button>
      </aside>
      <main className="flex-1 bg-surface p-8 overflow-y-auto">{children}</main>
    </div>
  );
}