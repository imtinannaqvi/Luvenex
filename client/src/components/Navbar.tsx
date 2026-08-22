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

    // stay in sync across tabs (storage) and within the same tab (custom event)
    window.addEventListener("storage", readAuth);
    window.addEventListener("auth-change", readAuth);
    return () => {
      window.removeEventListener("storage", readAuth);
      window.removeEventListener("auth-change", readAuth);
    };
  }, [pathname]); // re-check on every route change (e.g. after login redirect)

  const handleLogout = () => {
    localStorage.removeItem("luvenex_token");
    localStorage.removeItem("luvenex_refresh");
    localStorage.removeItem("luvenex_user");
    setLoggedIn(false);
    window.dispatchEvent(new Event("auth-change"));
    router.push("/");
  };

  // hide the public navbar on admin and app pages (they have their own sidebars)
  if (pathname.startsWith("/admin") || pathname.startsWith("/app")) return null;

  return (
    <header className="w-full bg-background text-foreground z-30 relative border-b border-border-color transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-3 py-4 sm:py-5 px-4 sm:px-6">


        {/* Logo (center) */}
        <Link href="/" className="shrink-0">
          <img
            src="/luvenex-logo-black.png"
            alt="Luvenex"
            className="h-8 sm:h-10 w-auto select-none dark:invert-0 invert transition-all"
          />
        </Link>

        {/* Nav links — wrap under logo on mobile, inline on desktop */}
        <div className="order-3 w-full md:order-none md:w-auto flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-12">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-foreground/80 hover:text-foreground transition"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right cluster: auth + menu */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Login (person) when logged out — Logout when logged in */}
          {mounted &&
            (loggedIn ? (
              <button
                onClick={handleLogout}
                aria-label="Log out"
                title="Log out"
                className="flex items-center gap-2 h-10 px-3 sm:px-4 rounded-full text-foreground/80 hover:text-foreground hover:bg-foreground/10 transition cursor-pointer"
              >
                {/* log-out icon */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="text-sm font-semibold ">
                  Logout
                </span>
              </button>
            ) : (
              <Link
                href="/login"
                aria-label="Log in"
                title="Log in"
                className="flex items-center gap-2 h-10 px-3 sm:px-4 rounded-full text-foreground/80 hover:text-foreground hover:bg-foreground/10 transition"
              >
                {/* person icon */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="text-sm font-semibold ">
                  Login
                </span>
              </Link>
            ))}

          {/* Hamburger icon */}
          <button
            onClick={open}
            aria-label="Menu"
            className="group flex flex-col gap-2 items-end justify-center w-10 h-10 cursor-pointer"
          >
            <span className="block w-8 h-[2px] bg-foreground transition-all duration-300" />
            <span className="block w-8 h-[2px] bg-foreground opacity-100 scale-x-100 group-hover:opacity-0 group-hover:scale-x-0 origin-right transition-all duration-300" />
            <span className="block w-4 h-[2px] bg-foreground transition-all duration-300 group-hover:-mt-2" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;