import Head from "next/head";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LicenseKeyDisplay from "../components/LicenseKeyDisplay";

type Step = "input" | "found" | "not_found";

interface LicenseInfo {
  license_key: string;
  email: string;
  plan: string;
  status: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30" },
  trialing: { label: "Trial", color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30" },
  past_due: { label: "Payment Due", color: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30" },
  canceled: { label: "Cancelled", color: "text-neutral-500 bg-neutral-100 dark:bg-neutral-800" },
  inactive: { label: "Inactive", color: "text-neutral-500 bg-neutral-100 dark:bg-neutral-800" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export default function ManageLicense() {
  const [step, setStep] = useState<Step>("input");
  const [email, setEmail] = useState("");
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLookupLoading(true);
    setError("");

    try {
      // We use the resend endpoint to check if a license exists
      // In production you might want a dedicated /api/license/lookup endpoint
      const res = await fetch("/api/license/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      // Always shows success (to prevent enumeration), so we rely on by-session
      // Instead, use a dedicated lookup endpoint that returns masked info
      const lookupRes = await fetch("/api/manage/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (lookupRes.ok) {
        const data = await lookupRes.json();
        if (data.found) {
          setLicenseInfo(data);
          setStep("found");
        } else {
          setStep("not_found");
        }
      } else {
        setStep("not_found");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await fetch("/api/license/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendSent(true);
      setTimeout(() => setResendSent(false), 4000);
    } catch {
      // silently ignore
    } finally {
      setResendLoading(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/manage/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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

  const statusInfo = licenseInfo ? (STATUS_MAP[licenseInfo.status] ?? STATUS_MAP["inactive"]) : null;

  return (
    <>
      <Head>
        <title>Manage License — Window Snap Pro</title>
        <meta name="description" content="Look up your Window Snap Pro license, resend your key, or manage your subscription." />
      </Head>
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
                Enter your purchase email to view your license, resend your key, or manage your subscription.
              </motion.p>
            </div>

            <AnimatePresence mode="wait">

              {/* Email input form */}
              {step === "input" && (
                <motion.div
                  key="input"
                  custom={2} variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, y: -12 }}
                >
                  <form onSubmit={handleLookup} className="flex flex-col gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Purchase email
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all text-sm"
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                    )}
                    <motion.button
                      type="submit"
                      disabled={lookupLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 px-6 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm rounded-2xl hover:bg-neutral-700 dark:hover:bg-neutral-100 transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {lookupLoading ? (
                        <>
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                          </svg>
                          Looking up…
                        </>
                      ) : "Look Up License"}
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* License found */}
              {step === "found" && licenseInfo && (
                <motion.div
                  key="found"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                  className="flex flex-col gap-5"
                >
                  {/* Status banner */}
                  <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Subscription</p>
                      <p className="font-semibold text-neutral-900 dark:text-white capitalize">{licenseInfo.plan}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusInfo?.color}`}>
                      {statusInfo?.label}
                    </span>
                  </div>

                  {/* License key */}
                  <LicenseKeyDisplay licenseKey={licenseInfo.license_key} />

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
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
                      ) : "Manage Subscription"}
                    </button>
                  </div>

                  {error && <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>}

                  <button
                    onClick={() => { setStep("input"); setLicenseInfo(null); setError(""); }}
                    className="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 text-center transition-colors"
                  >
                    ← Use a different email
                  </button>
                </motion.div>
              )}

              {/* Not found */}
              {step === "not_found" && (
                <motion.div
                  key="not_found"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center py-8"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-5">
                    <svg className="w-6 h-6 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No license found</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed max-w-xs mx-auto">
                    We couldn&apos;t find a license for <span className="font-medium text-neutral-700 dark:text-neutral-300">{email}</span>. Double-check the email you used to purchase.
                  </p>
                  <div className="flex flex-col gap-3 max-w-xs mx-auto">
                    <button
                      onClick={() => { setStep("input"); setError(""); }}
                      className="w-full py-3 px-6 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm rounded-2xl"
                    >
                      Try a different email
                    </button>
                    <a href="/pricing" className="text-sm text-accent font-medium text-center hover:underline">
                      Get Window Snap Pro →
                    </a>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
