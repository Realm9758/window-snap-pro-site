import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.09, duration: 0.55, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export default function Download() {
  return (
    <>
      <Head>
        <title>Download — Window Snap Pro</title>
        <meta name="description" content="Download Window Snap Pro for macOS Ventura or later. Free to download, Pro available via subscription." />
      </Head>
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
        <Navbar />
        <main className="pt-32 pb-24 px-6">
          <div className="max-w-3xl mx-auto">

            {/* Hero */}
            <div className="text-center mb-16">
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-[22px] bg-accent shadow-[0_12px_40px_rgba(0,113,227,0.35)] mb-6">
                  <svg width="40" height="40" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" />
                    <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.7" />
                    <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.7" />
                    <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.4" />
                  </svg>
                </div>
              </motion.div>
              <motion.h1
                custom={1} variants={fadeUp} initial="hidden" animate="show"
                className="text-[clamp(2rem,5vw,3rem)] font-bold tracking-tight text-neutral-900 dark:text-white leading-tight mb-4"
              >
                Download Window Snap Pro
              </motion.h1>
              <motion.p
                custom={2} variants={fadeUp} initial="hidden" animate="show"
                className="text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xl mx-auto"
              >
                The fastest, most intuitive window manager for macOS. Free to download, Pro features available via subscription.
              </motion.p>
            </div>

            {/* Download card */}
            <motion.div
              custom={3} variants={fadeUp} initial="hidden" animate="show"
              className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden mb-8"
            >
              {/* Main section */}
              <div className="p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex-1">
                  <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400 dark:text-neutral-500 mb-1.5">macOS</p>
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">
                    Window Snap Pro
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400 dark:text-neutral-500">
                    <span>Version 1.0</span>
                    <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                    <span>~4.2 MB</span>
                    <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                    <span>Released Mar 2026</span>
                  </div>
                </div>
                <motion.a
                  href="/WindowSnapPro.zip"
                  download
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2.5 px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 flex-shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Download for macOS
                </motion.a>
              </div>

              {/* Meta row */}
              <div className="px-8 py-5 grid grid-cols-3 divide-x divide-neutral-100 dark:divide-neutral-800">
                {[
                  { label: "Version", value: "1.0" },
                  { label: "Requires", value: "macOS 13+" },
                  { label: "Architecture", value: "Apple Silicon + Intel" },
                ].map((item) => (
                  <div key={item.label} className="px-4 first:pl-0 last:pr-0 text-center">
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-0.5">{item.label}</p>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Release notes */}
            <motion.div
              custom={4} variants={fadeUp} initial="hidden" animate="show"
              className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 mb-8"
            >
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600 dark:text-green-400" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                  </svg>
                </span>
                What&apos;s new in 1.0
              </h3>
              <ul className="flex flex-col gap-2.5">
                {[
                  "Initial release with full window snapping engine",
                  "Menu bar access with quick-snap shortcuts",
                  "Support for halves, thirds, quarters, and corners",
                  "Drag-to-edge zone detection",
                  "Full macOS Ventura & Sonoma compatibility",
                  "Apple Silicon (M1–M4) native build",
                ].map((note) => (
                  <li key={note} className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                    <svg className="w-4 h-4 text-neutral-300 dark:text-neutral-600 flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="currentColor">
                      <circle cx="8" cy="8" r="2" />
                    </svg>
                    {note}
                  </li>
                ))}
              </ul>
              <Link
                href="/changelog"
                className="inline-flex items-center gap-1.5 text-sm text-accent font-medium mt-5 hover:underline"
              >
                Full changelog
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
                </svg>
              </Link>
            </motion.div>

            {/* Pro upsell */}
            <motion.div
              custom={5} variants={fadeUp} initial="hidden" animate="show"
              className="rounded-3xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 p-8 text-center"
            >
              <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                Already purchased Pro?
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                Open Window Snap Pro → Settings → Pro and paste your license key to activate.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/pricing"
                  className="text-sm font-semibold text-accent hover:underline"
                >
                  Get Pro for £4.99/month →
                </Link>
                <span className="hidden sm:block text-neutral-300 dark:text-neutral-700">·</span>
                <Link
                  href="/manage-license"
                  className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Manage license
                </Link>
              </div>
            </motion.div>

          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
