"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function Download() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="download" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative overflow-hidden rounded-[28px] bg-neutral-900 dark:bg-neutral-900 border border-neutral-800 text-white px-8 py-16 md:py-20 text-center"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(0,113,227,0.25),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_120%,rgba(52,170,220,0.1),transparent)]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />

          {/* Content */}
          <div className="relative flex flex-col items-center gap-6">
            {/* App icon placeholder */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-accent to-[#34aadc] flex items-center justify-center shadow-[0_8px_32px_rgba(0,113,227,0.4)]"
            >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="4" y="4" width="14" height="14" rx="3" fill="white" />
                <rect x="22" y="4" width="14" height="14" rx="3" fill="white" opacity="0.7" />
                <rect x="4" y="22" width="14" height="14" rx="3" fill="white" opacity="0.7" />
                <rect x="22" y="22" width="14" height="14" rx="3" fill="white" opacity="0.4" />
              </svg>
            </motion.div>

            <div>
              <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-tight mb-2 text-balance">
                Download Redock
              </h2>
              <p className="text-neutral-400 max-w-md mx-auto text-balance">
                Take control of your workspace today. Free to download, no account required.
              </p>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-neutral-400">
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Version 1.0
              </div>
              <div className="w-px h-4 bg-neutral-700" />
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                4.2 MB
              </div>
              <div className="w-px h-4 bg-neutral-700" />
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                March 2026
              </div>
            </div>

            {/* Download button */}
            <motion.a
              href="#"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-neutral-900 font-semibold text-[15px] rounded-2xl shadow-[0_8px_32px_rgba(255,255,255,0.15)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.2)] transition-shadow duration-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Download for macOS
            </motion.a>

            <span className="text-xs text-neutral-500">Requires macOS Ventura 13.0 or later · Apple Silicon &amp; Intel</span>

            {/* Optional App Store placeholder */}
            <div className="flex flex-wrap gap-3 items-center justify-center pt-2">
              <span className="text-xs text-neutral-600">Also available on</span>
              <motion.a
                href="#"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white text-xs font-medium rounded-xl transition-all duration-150"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Mac App Store
                <span className="text-neutral-600 text-[10px]">Coming soon</span>
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
