import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getSupabaseBrowser } from "../lib/supabase-browser";
import { useAuth } from "../lib/auth-context";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LicenseKeyDisplay from "../components/LicenseKeyDisplay";
import PurchaseTrustLine from "../components/PurchaseTrustLine";
import { apiPath } from "../lib/site";

interface LicenseInfo {
  license_key: string;
  product_tier: string;
  subscription_status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  active: boolean;
  stripe_customer_id: string | null;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

function PlanBadge({ tier }: { tier: string }) {
  const isPro = tier === "pro";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      isPro
        ? "bg-accent/10 dark:bg-accent/20 text-accent"
        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
    }`}>
      {isPro && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
      {isPro ? "Pro" : "Free"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "active" || status === "trialing";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
      active
        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
        : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-amber-500"}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function Profile() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const [license, setLicense]     = useState<LicenseInfo | null>(null);
  const [fetching, setFetching]   = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError]     = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  // Fetch license info once we have a user
  useEffect(() => {
    if (!user) return;

    async function fetchLicense() {
      setFetching(true);
      try {
        const { data: { session } } = await getSupabaseBrowser().auth.getSession();
        if (!session) { setFetching(false); return; }

        const res = await fetch(apiPath("/api/auth/user"), {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLicense(data.license ?? null);
        }
      } finally {
        setFetching(false);
      }
    }

    fetchLicense();
  }, [user]);

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  async function openPortal() {
    setPortalError("");
    setPortalLoading(true);
    try {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) throw new Error("Your session has expired. Please sign in again.");

      // The email is no longer sent: the endpoint reads it from the token.
      const res = await fetch(apiPath("/api/manage/portal"), {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      window.location.href = data.url;
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : "Something went wrong.");
      setPortalLoading(false);
    }
  }

  if (loading || !user) return null;

  const renewDate = license?.current_period_end
    ? new Date(license.current_period_end).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  return (
    <>
      <Head>
        <title>Your Redock account</title>
      </Head>
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
        <Navbar />
        <main className="pt-32 pb-24 px-6">
          <div className="max-w-2xl mx-auto">

            {/* Header */}
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="mb-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-accent/10 dark:bg-accent/15 flex items-center justify-center text-accent text-xl font-bold flex-shrink-0">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-0.5">My Account</p>
                  <h1 className="text-xl font-semibold text-neutral-900 dark:text-white truncate">{user.email}</h1>
                </div>
              </div>
            </motion.div>

            {/* Plan & Status card */}
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show"
              className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.05)] p-6 mb-4"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">Licence</p>
              {fetching ? (
                <div className="flex flex-col gap-2 animate-pulse">
                  <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full w-1/3" />
                  <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full w-1/2" />
                </div>
              ) : license ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <PlanBadge tier={license.product_tier} />
                    <StatusBadge status={license.subscription_status} />
                    {license.cancel_at_period_end && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Cancels at period end</span>
                    )}
                  </div>
                  {renewDate && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {license.cancel_at_period_end ? "Access until" : "Renews"} <span className="font-medium text-neutral-700 dark:text-neutral-300">{renewDate}</span>
                    </p>
                  )}
                  {license.stripe_customer_id && (
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 mt-1">
                      {portalError && (
                        <p className="text-xs text-red-500 mb-2">{portalError}</p>
                      )}
                      <motion.button
                        onClick={openPortal}
                        disabled={portalLoading}
                        whileHover={{ scale: portalLoading ? 1 : 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-xl transition-all duration-150 disabled:opacity-60"
                      >
                        {portalLoading ? (
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                            <path d="M12 2a10 10 0 010 20" strokeOpacity="0.85" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        )}
                        Manage Licence
                      </motion.button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <PlanBadge tier="free" />
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">No active Pro licence found for this account.</p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-semibold rounded-xl shadow-sm shadow-accent/30 hover:bg-accent/90 transition-all duration-150 w-fit"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1.5a.75.75 0 01.75.75v4h4a.75.75 0 010 1.5h-4v4a.75.75 0 01-1.5 0v-4h-4a.75.75 0 010-1.5h4v-4A.75.75 0 018 1.5z" />
                    </svg>
                    Buy Redock, £19 once
                  </Link>
                  <PurchaseTrustLine />
                </div>
              )}
            </motion.div>

            {/* License key card */}
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show"
              className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.05)] p-6 mb-4"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">License Key</p>
              {fetching ? (
                <div className="h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
              ) : license ? (
                <div className="flex flex-col gap-4">
                  <LicenseKeyDisplay licenseKey={license.license_key} />
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed">
                    Your purchase email has a secure Open Redock link. This key remains available as a fallback.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  No license found. <Link href="/pricing" className="text-accent font-medium hover:underline">Get Pro</Link> to receive a license key.
                </p>
              )}
            </motion.div>

            {/* Account actions */}
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show"
              className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.05)] p-6 mb-4"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">Account</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email address</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</p>
                  </div>
                </div>
                <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-red-500 dark:text-red-400 font-medium hover:underline"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </motion.div>

          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
