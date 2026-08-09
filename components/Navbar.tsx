"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../lib/auth-context";

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [dark, setDark]           = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const router   = useRouter();
  const isHome   = router.pathname === "/";
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const navLinks = [
    { label: "Features",  href: isHome ? "#features" : "/#features" },
    { label: "Pricing",   href: "/pricing" },
    { label: "Changelog", href: "/changelog" },
    { label: "Download",  href: "/download" },
  ];

  async function handleSignOut() {
    setDropdownOpen(false);
    setMenuOpen(false);
    await signOut();
    router.push("/");
  }

  const avatar = user?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 dark:bg-[#0a0a0a]/80 bg-glass border-b border-neutral-200/60 dark:border-neutral-800/60 shadow-soft"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-[8px] bg-accent flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" />
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.7" />
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.7" />
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.4" />
            </svg>
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-neutral-900 dark:text-white">
            Redock
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-4 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-all duration-150"
            aria-label="Toggle dark mode"
          >
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Auth controls — hidden while loading to avoid flicker */}
          {!loading && (
            <>
              {user ? (
                /* Profile avatar + dropdown */
                <div className="relative hidden md:block" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="w-8 h-8 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center hover:bg-accent/90 transition-all duration-150 shadow-sm shadow-accent/30"
                    aria-label="Account menu"
                  >
                    {avatar}
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-10 w-52 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden z-50"
                      >
                        {/* Email header */}
                        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">{user.email}</p>
                        </div>
                        {/* Menu items */}
                        <div className="py-1.5">
                          {[
                            { label: "Profile",           href: "/profile" },
                            { label: "Manage License",    href: "/profile" },
                            { label: "Manage Subscription", href: "/profile" },
                          ].map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-100"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                        <div className="border-t border-neutral-100 dark:border-neutral-800 py-1.5">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center w-full px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-100"
                          >
                            Log out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* Login + Get Pro buttons */
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/pricing"
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-accent text-white text-sm font-semibold rounded-full hover:bg-accent/90 transition-all duration-150 shadow-sm shadow-accent/25"
                  >
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1.5a.75.75 0 01.75.75v4h4a.75.75 0 010 1.5h-4v4a.75.75 0 01-1.5 0v-4h-4a.75.75 0 010-1.5h4v-4A.75.75 0 018 1.5z" />
                    </svg>
                    Get Pro
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-full text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              ) : (
                <><line x1="3" y1="8" x2="21" y2="8" /><line x1="3" y1="16" x2="21" y2="16" /></>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-neutral-200/60 dark:border-neutral-800/60 bg-white/95 dark:bg-[#0a0a0a]/95 bg-glass"
          >
            <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all duration-150"
                >
                  {link.label}
                </Link>
              ))}
              {!loading && (
                <>
                  <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />
                  {user ? (
                    <>
                      <Link href="/profile" onClick={() => setMenuOpen(false)} className="px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all duration-150">
                        My Account
                      </Link>
                      <button onClick={handleSignOut} className="px-4 py-2.5 text-sm font-medium text-red-500 dark:text-red-400 text-left hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-150">
                        Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setMenuOpen(false)} className="px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all duration-150">
                        Log in
                      </Link>
                      <Link href="/signup" onClick={() => setMenuOpen(false)} className="px-4 py-2.5 text-sm font-semibold text-accent hover:bg-accent/5 rounded-xl transition-all duration-150">
                        Create account
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
