"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useContactPanel } from "./ContactPanel";
import { getToken } from "@/lib/auth";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact Us" },
];

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { open } = useContactPanel();

  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    const readAuth = () => setLoggedIn(!!getToken());
    readAuth();

    window.addEventListener("storage", readAuth);
    window.addEventListener("auth-change", readAuth);
    return () => {
      window.removeEventListener("storage", readAuth);
      window.removeEventListener("auth-change", readAuth);
    };
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("luvenex_token");
    localStorage.removeItem("luvenex_refresh");
    localStorage.removeItem("luvenex_user");
    setLoggedIn(false);
    window.dispatchEvent(new Event("auth-change"));
    router.push("/");
  };

  if (pathname.startsWith("/admin") || pathname.startsWith("/app")) return null;

  return (
    <header className="w-full bg-background text-foreground z-30 relative border-b border-border-color transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-5">
        {/* Top row: logo + login + hamburger — always inline, never wraps */}
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="shrink-0">
            <img
              src="/luvenex-logo-black.png"
              alt="Luvenex"
              className="h-7 sm:h-10 w-auto select-none dark:invert-0 invert transition-all"
            />
          </Link>

          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {mounted &&
              (loggedIn ? (
                <button
                  onClick={handleLogout}
                  aria-label="Log out"
                  title="Log out"
                  className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-2 sm:px-4 rounded-full text-foreground/80 hover:text-foreground hover:bg-foreground/10 transition cursor-pointer"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="sm:w-5 sm:h-5"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span className="hidden sm:inline text-sm font-semibold">Logout</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  aria-label="Log in"
                  title="Log in"
                  className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-2 sm:px-4 rounded-full text-foreground/80 hover:text-foreground hover:bg-foreground/10 transition"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="sm:w-5 sm:h-5"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="hidden sm:inline text-sm font-semibold">Login</span>
                </Link>
              ))}

            <button
              onClick={open}
              aria-label="Menu"
              className="group flex flex-col gap-1.5 sm:gap-2 items-end justify-center w-9 h-9 sm:w-10 sm:h-10 cursor-pointer"
            >
              <span className="block w-6 sm:w-8 h-[2px] bg-foreground transition-all duration-300" />
              <span className="block w-6 sm:w-8 h-[2px] bg-foreground opacity-100 scale-x-100 group-hover:opacity-0 group-hover:scale-x-0 origin-right transition-all duration-300" />
              <span className="block w-3.5 sm:w-4 h-[2px] bg-foreground transition-all duration-300 group-hover:-mt-2" />
            </button>
          </div>
        </div>

        {/* Nav links row — horizontally scrollable on mobile, centered on desktop */}
        <div className="mt-3 sm:mt-4 flex items-center gap-5 sm:gap-8 lg:gap-12 overflow-x-auto sm:overflow-visible sm:justify-center [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap shrink-0 text-xs sm:text-sm font-semibold tracking-wide uppercase text-foreground/80 hover:text-foreground transition"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Navbar;