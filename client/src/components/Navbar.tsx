"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useContactPanel } from "./ContactPanel";
import { getToken } from "@/lib/auth";

const navLinks = [
  { href: "/discover", label: "Discover " },
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4">
        {/* Logo */}
         <Link href="/" className="">
          <img
            src="/file_0000000089d482118329077f6e1cff4c.png"
            alt="Luvenex"
            className="h-7 sm:h-9 w-auto select-none dark:invert-0 invert transition-all"
          />
        </Link>

        {/* Desktop Navigation Links — perfectly centered inline */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs lg:text-sm font-semibold tracking-wide uppercase text-foreground/80 hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions: Dashboard + Login/Logout + Hamburger Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Dashboard icon — only shown once logged in, sized larger than the auth icon, with label */}
          {mounted && loggedIn && (
            <Link
              href="/app"
              aria-label="Go to Dashboard"
              title="Go to Dashboard"
              className="flex items-center gap-1.5 sm:gap-2 h-9 px-2 sm:px-3 rounded-full text-foreground/80 hover:text-foreground hover:bg-foreground/10 transition"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="w-6 h-6 sm:w-7 sm:h-7"
              >
                <rect x="3" y="3" width="7" height="9" rx="1.5" />
                <rect x="14" y="3" width="7" height="5" rx="1.5" />
                <rect x="14" y="12" width="7" height="9" rx="1.5" />
                <rect x="3" y="16" width="7" height="5" rx="1.5" />
              </svg>
              <span className="hidden sm:inline text-xs sm:text-sm font-semibold">Dashboard</span>
            </Link>
          )}

          {mounted &&
            (loggedIn ? (
              <button
                onClick={handleLogout}
                aria-label="Log out"
                title="Log out"
                className="flex items-center gap-1.5 sm:gap-2 h-9 px-3 sm:px-4 rounded-full text-foreground/80 hover:text-foreground hover:bg-foreground/10 transition cursor-pointer"
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
                  className="w-4 h-4 sm:w-5 sm:h-5"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="hidden sm:inline text-xs sm:text-sm font-semibold">Logout</span>
              </button>
            ) : (
              <Link
                href="/login"
                aria-label="Log in"
                title="Log in"
                className="flex items-center gap-1.5 sm:gap-2 h-9 px-3 sm:px-4 rounded-full text-foreground/80 hover:text-foreground hover:bg-foreground/10 transition"
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
                  className="w-4 h-4 sm:w-5 sm:h-5"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="hidden sm:inline text-xs sm:text-sm font-semibold">Login</span>
              </Link>
            ))}

          <button
            onClick={open}
            aria-label="Menu"
            className="group flex flex-col gap-1.5 items-end justify-center w-9 h-9 sm:w-10 sm:h-10 cursor-pointer"
          >
            <span className="block w-6 sm:w-7 h-[2px] bg-foreground transition-all duration-300" />
            <span className="block w-6 sm:w-7 h-[2px] bg-foreground opacity-100 scale-x-100 group-hover:opacity-0 group-hover:scale-x-0 origin-right transition-all duration-300" />
            <span className="block w-3.5 sm:w-4 h-[2px] bg-foreground transition-all duration-300 group-hover:-mt-2" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Links Row — clean horizontal scroll inline */}
      <div className="md:hidden border-t border-border-color/50 px-4 py-2 flex items-center justify-between gap-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap text-[11px] font-semibold tracking-wide uppercase text-foreground/80 hover:text-foreground transition-colors px-1 py-0.5"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
};

export default Navbar;