import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getSupabaseBrowser } from "../lib/supabase-browser";
import { useAuth } from "../lib/auth-context";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
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

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active:   { label: "Active",       color: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30" },
  trialing: { label: "Trial",        color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30" },
  past_due: { label: "Payment Due",  color: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30" },
  canceled: { label: "Cancelled",    color: "text-neutral-500 bg-neutral-100 dark:bg-neutral-800" },
  inactive: { label: "Inactive",     color: "text-neutral-500 bg-neutral-100 dark:bg-neutral-800" },
};

export default function ManageLicense() {
  const { user, loading } = useAuth();

  const [license, setLicense]           = useState<LicenseInfo | null>(null);
  const [fetching, setFetching]         = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent]     = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError]               = useState("");

  // Logged-out recovery form. Most buyers check out without an account, so
  // this page cannot be a login wall: the FAQ and the licence email both
  // send people here to get their key back by purchase email alone.
  const [recoverEmail, setRecoverEmail]     = useState("");
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [recoverDone, setRecoverDone]       = useState(false);
  const [recoverError, setRecoverError]     = useState("");

  // Fetch own license via the authenticated /api/auth/user endpoint
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

  const handleResend = async () => {
    if (!user?.email) return;
    setResendLoading(true);
    setError("");
    try {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) {
        setError("Your session has expired. Please sign in again.");
        return;
      }

      // The address comes from the token now, not from this request.
      const res = await fetch(apiPath("/api/license/resend"), {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      /*
        This used to claim "Email sent!" no matter what came back, including a
        refusal. The key is already on this page, so a failure is survivable —
        but only if it is said out loud instead of being swallowed.
      */
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not send that email. Your key is on this page.");
        return;
      }

      setResendSent(true);
      setTimeout(() => setResendSent(false), 4000);
    } catch {
      setError("Could not send that email. Check your connection and try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverLoading(true);
    setRecoverError("");
    try {
      const res = await fetch(apiPath("/api/license/recover"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoverEmail }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setRecoverError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setRecoverDone(true);
    } catch {
      setRecoverError("Could not reach the server. Check your connection and try again.");
    } finally {
      setRecoverLoading(false);
    }
  };

  const handlePortal = async () => {
    if (!user?.email) return;
    setPortalLoading(true);
    setError("");
    try {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) {
        setError("Your session has expired. Please sign in again.");
        return;
      }

      // The email is no longer sent: the endpoint reads it from the token.
      const res = await fetch(apiPath("/api/manage/portal"), {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error ?? "Could not open billing portal.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) return null;

  if (!user) {
    return (
      <>
        <Seo
          title="Recover your Redock licence"
          description="Enter your purchase email and we'll send your Redock licence key straight to it. No account needed."
          noindex
        />
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
          <Navbar />
          <main className="pt-32 pb-24 px-6">
            <div className="max-w-lg mx-auto">
              <div className="text-center mb-12">
                <motion.h1
                  custom={0} variants={fadeUp} initial="hidden" animate="show"
                  className="text-[clamp(2rem,5vw,2.8rem)] font-bold tracking-tight text-neutral-900 dark:text-white mb-3"
                >
                  Get your license key
                </motion.h1>
                <motion.p
                  custom={1} variants={fadeUp} initial="hidden" animate="show"
                  className="text-neutral-500 dark:text-neutral-400 leading-relaxed"
                >
                  Enter the email you used at checkout and we&apos;ll send your
                  key to it. No account needed.
                </motion.p>
              </div>

              <motion.div
                custom={2} variants={fadeUp} initial="hidden" animate="show"
                className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.05)] p-6"
              >
                {recoverDone ? (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                      <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <p className="font-semibold text-neutral-900 dark:text-white mb-2">Check your inbox</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      If <span className="font-medium text-neutral-700 dark:text-neutral-300">{recoverEmail}</span> has
                      a Redock licence, the key is on its way. Give it a few
                      minutes and check spam too.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleRecover} className="flex flex-col gap-4">
                    <label className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500" htmlFor="recover-email">
                      Purchase email
                    </label>
                    <input
                      id="recover-email"
                      type="email"
                      required
                      value={recoverEmail}
                      onChange={(e) => setRecoverEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-150"
                    />
                    <button
                      type="submit"
                      disabled={recoverLoading}
                      className="w-full py-3 px-6 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-100 transition-colors duration-150 disabled:opacity-60"
                    >
                      {recoverLoading ? "Sending…" : "Email me my key"}
                    </button>
                    {recoverError && (
                      <p className="text-sm text-red-500 dark:text-red-400 text-center">{recoverError}</p>
                    )}
                  </form>
                )}
              </motion.div>

              <motion.p
                custom={3} variants={fadeUp} initial="hidden" animate="show"
                className="text-center text-sm text-neutral-400 dark:text-neutral-500 mt-8"
              >
                Want to see your devices or billing?{" "}
                <Link href="/login?redirect=/manage-license" className="text-accent hover:underline">
                  Log in
                </Link>{" "}
                with your purchase email.
              </motion.p>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  const statusInfo = license ? (STATUS_MAP[license.subscription_status] ?? STATUS_MAP["inactive"]) : null;
  const renewDate = license?.current_period_end
    ? new Date(license.current_period_end).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  return (
    <>
      <Seo
        title="Manage your Redock licence"
        description="Look up your Redock licence key and move it between Macs."
        noindex
      />
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
        <Navbar />
        <main className="pt-32 pb-24 px-6">
          <div className="max-w-lg mx-auto">

            {/* Header */}
            <div className="text-center mb-12">
              <motion.h1
                custom={0} variants={fadeUp} initial="hidden" animate="show"
                className="text-[clamp(2rem,5vw,2.8rem)] font-bold tracking-tight text-neutral-900 dark:text-white mb-3"
              >
                Manage License
              </motion.h1>
              <motion.p
                custom={1} variants={fadeUp} initial="hidden" animate="show"
                className="text-neutral-500 dark:text-neutral-400 leading-relaxed"
              >
                Logged in as <span className="font-medium text-neutral-700 dark:text-neutral-300">{user.email}</span>
              </motion.p>
            </div>

            <div className="flex flex-col gap-4">

              {/* Status card */}
              <motion.div
                custom={2} variants={fadeUp} initial="hidden" animate="show"
                className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.05)] p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">
                  Licence
                </p>
                {fetching ? (
                  <div className="flex flex-col gap-2 animate-pulse">
                    <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full w-1/3" />
                    <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full w-1/2" />
                  </div>
                ) : license ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-neutral-900 dark:text-white capitalize">
                        {license.product_tier}
                      </p>
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusInfo?.color}`}>
                        {statusInfo?.label}
                      </span>
                    </div>
                    {renewDate && (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {license.cancel_at_period_end ? "Access until" : "Renews"}{" "}
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">{renewDate}</span>
                      </p>
                    )}
                    {license.cancel_at_period_end && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        Cancels at period end
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      No Pro licence found for this account.
                    </p>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-sm font-semibold rounded-xl shadow-sm shadow-accent/30 hover:bg-accent/90 transition-all duration-150 w-fit"
                    >
                      Buy Redock, £19 once
                    </Link>
                    <PurchaseTrustLine />
                  </div>
                )}
              </motion.div>

              {/* License key card */}
              {!fetching && license && (
                <motion.div
                  custom={3} variants={fadeUp} initial="hidden" animate="show"
                  className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.05)] p-6"
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">
                    License Key
                  </p>
                  <LicenseKeyDisplay licenseKey={license.license_key} />
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed mt-4">
                    Your email includes a secure Open Redock link for one-click activation. This key is the fallback.
                  </p>
                </motion.div>
              )}

              {/* Actions */}
              {!fetching && license && (
                <motion.div
                  custom={4} variants={fadeUp} initial="hidden" animate="show"
                  className="flex flex-col gap-3"
                >
                  <button
                    onClick={handleResend}
                    disabled={resendLoading || resendSent}
                    className="w-full py-3 px-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {resendSent ? (
                      <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                        </svg>
                        Email sent!
                      </span>
                    ) : resendLoading ? "Sending…" : "Resend License Email"}
                  </button>

                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="w-full py-3 px-6 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-100 transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {portalLoading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                        Opening…
                      </>
                    ) : "Manage Licence"}
                  </button>

                  {error && <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>}
                </motion.div>
              )}

              {/* Account link */}
              <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show" className="text-center pt-2">
                <Link
                  href="/profile"
                  className="text-sm text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  ← Back to my account
                </Link>
              </motion.div>

            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
