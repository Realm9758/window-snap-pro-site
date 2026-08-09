import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LicenseKeyDisplay from "../components/LicenseKeyDisplay";
import { apiPath } from "../lib/site";

type State = "loading" | "found" | "timeout" | "error";

const STEPS = [
  "Download Redock from the button below",
  "Open Redock on your Mac",
  "Open the app menu → Settings",
  'Select the "Pro" tab',
  'Paste your license key and click "Activate Pro"',
];

export default function Success() {
  const router = useRouter();
  const { session_id } = router.query;

  const [state, setState] = useState<State>("loading");
  const [licenseKey, setLicenseKey] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    if (!session_id || typeof session_id !== "string") return;

    let attempts = 0;
    const MAX_ATTEMPTS = 12;
    const INTERVAL_MS = 1500;

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(apiPath(`/api/license/by-session?session_id=${session_id}`));
        const data = await res.json();
        if (data.found) {
          setLicenseKey(data.license_key);
          setEmail(data.email ?? "");
          setState("found");
          return;
        }
      } catch {
        // network error — keep trying
      }

      if (attempts >= MAX_ATTEMPTS) {
        setState("timeout");
        return;
      }

      setTimeout(poll, INTERVAL_MS);
    };

    poll();
  }, [session_id]);

  return (
    <>
      <Head>
        <title>Purchase Confirmed — Redock</title>
      </Head>
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
        <Navbar />
        <main className="pt-32 pb-24 px-6">
          <div className="max-w-2xl mx-auto">

            <AnimatePresence mode="wait">

              {/* Loading state */}
              {state === "loading" && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-center py-20"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-6">
                    <svg className="w-7 h-7 text-neutral-400 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  </div>
                  <h1 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Confirming your purchase…</h1>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">This takes just a moment.</p>
                </motion.div>
              )}

              {/* Success state */}
              {state === "found" && (
                <motion.div
                  key="found"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                  className="flex flex-col gap-8"
                >
                  {/* Header */}
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6"
                    >
                      <svg className="w-8 h-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </motion.div>
                    <h1 className="text-[clamp(1.8rem,4vw,2.5rem)] font-bold tracking-tight text-neutral-900 dark:text-white mb-3">
                      Purchase Confirmed!
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Welcome to Redock Pro.
                      {email && (
                        <> Your license key has been sent to{" "}
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">{email}</span>.
                        </>
                      )}
                    </p>
                  </div>

                  {/* License key */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                  >
                    <LicenseKeyDisplay licenseKey={licenseKey} large />
                  </motion.div>

                  {/* Steps */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                    className="rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-7"
                  >
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-5">
                      Activate your license
                    </h2>
                    <ol className="flex flex-col gap-4">
                      {STEPS.map((step, i) => (
                        <li key={step} className="flex items-start gap-4">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed pt-0.5">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </motion.div>

                  {/* Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.5 }}
                    className="flex flex-col sm:flex-row items-center gap-3"
                  >
                    <Link
                      href="/download"
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm rounded-2xl hover:bg-neutral-700 dark:hover:bg-neutral-100 transition-colors duration-150"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      Download Redock
                    </Link>
                    <Link
                      href="/manage-license"
                      className="w-full sm:w-auto flex items-center justify-center px-6 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 rounded-2xl hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-150"
                    >
                      Manage License
                    </Link>
                  </motion.div>

                  <p className="text-center text-xs text-neutral-400 dark:text-neutral-600">
                    Didn&apos;t receive the email?{" "}
                    <Link href="/manage-license" className="underline hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors">
                      Resend it from the Manage License page.
                    </Link>
                  </p>
                </motion.div>
              )}

              {/* Timeout state */}
              {(state === "timeout" || state === "error") && (
                <motion.div
                  key="timeout"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center py-12"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-6">
                    <svg className="w-7 h-7 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
                    Still processing…
                  </h1>
                  <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mb-8 leading-relaxed">
                    Your payment was received but it&apos;s taking a little longer than usual to generate your license. Check your email in a few minutes, or retrieve your key below.
                  </p>
                  <Link
                    href="/manage-license"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm rounded-2xl"
                  >
                    Retrieve License Key
                  </Link>
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
