"use client";
import { motion } from "framer-motion";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

// Animated macOS-style window mockup
function WindowMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.55, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative w-full max-w-[680px] mx-auto"
    >
      {/* Glow behind */}
      <div className="absolute inset-0 -bottom-8 bg-accent/10 dark:bg-accent/15 blur-3xl rounded-full scale-90" />

      {/* Main screen chrome */}
      <div className="relative rounded-[18px] overflow-hidden border border-neutral-200 dark:border-neutral-700/60 shadow-[0_32px_80px_rgba(0,0,0,0.12)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.5)] bg-white dark:bg-neutral-900">
        {/* Title bar */}
        <div className="h-10 bg-neutral-100 dark:bg-neutral-800 flex items-center px-4 gap-2 border-b border-neutral-200 dark:border-neutral-700/60">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="w-48 h-4 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
          </div>
        </div>

        {/* Desktop with snapped windows */}
        <div className="bg-[#F0F2F5] dark:bg-[#141414] p-4 h-[340px] grid grid-cols-2 gap-3">
          {/* Left window - active */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.5, ease: "easeOut" }}
            className="rounded-[12px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-card overflow-hidden flex flex-col"
          >
            <div className="h-8 bg-neutral-50 dark:bg-neutral-700/50 border-b border-neutral-200 dark:border-neutral-700 flex items-center px-3 gap-1.5">
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
              </div>
              <div className="flex-1 mx-2 h-3 bg-neutral-200 dark:bg-neutral-600 rounded-full" />
            </div>
            <div className="flex-1 p-3 flex flex-col gap-2">
              <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full w-3/4" />
              <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full w-full" />
              <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full w-5/6" />
              <div className="h-2.5 bg-neutral-100 dark:bg-neutral-700/50 rounded-full w-2/3 mt-1" />
              <div className="h-2.5 bg-neutral-100 dark:bg-neutral-700/50 rounded-full w-4/5" />
              <div className="flex-1 mt-2 bg-neutral-50 dark:bg-neutral-700/30 rounded-lg border border-neutral-100 dark:border-neutral-700/50" />
            </div>
          </motion.div>

          {/* Right column — two stacked windows */}
          <div className="flex flex-col gap-3">
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.5, ease: "easeOut" }}
              className="flex-1 rounded-[12px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-card overflow-hidden flex flex-col"
            >
              <div className="h-8 bg-neutral-50 dark:bg-neutral-700/50 border-b border-neutral-200 dark:border-neutral-700 flex items-center px-3 gap-1.5">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                </div>
              </div>
              <div className="flex-1 p-3 flex flex-col gap-2">
                <div className="h-2 bg-accent/20 rounded-full w-1/2" />
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full w-full" />
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full w-4/5" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0, duration: 0.5, ease: "easeOut" }}
              className="flex-1 rounded-[12px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-card overflow-hidden flex flex-col"
            >
              <div className="h-8 bg-neutral-50 dark:bg-neutral-700/50 border-b border-neutral-200 dark:border-neutral-700 flex items-center px-3 gap-1.5">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                </div>
              </div>
              <div className="flex-1 p-3 flex flex-col gap-2">
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full w-3/4" />
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full w-1/2" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Snap overlay indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ delay: 1.2, duration: 1.8, times: [0, 0.2, 0.8, 1], repeat: Infinity, repeatDelay: 4 }}
          className="absolute inset-x-4 top-12 bottom-4 border-2 border-accent/60 rounded-xl bg-accent/5 pointer-events-none"
        />
      </div>

      {/* Snap indicator badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.4 }}
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-medium px-3 py-1 rounded-full shadow-lg shadow-accent/30 whitespace-nowrap"
      >
        ✦ Snap to left half
      </motion.div>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden hero-gradient">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative w-full max-w-6xl mx-auto flex flex-col items-center text-center gap-6">
        {/* Badge */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 dark:bg-accent/15 text-accent text-xs font-semibold tracking-wide border border-accent/20">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Version 1.2 — Now Available
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-[clamp(2.8rem,8vw,5.5rem)] font-bold tracking-tight leading-[1.05] text-neutral-900 dark:text-white text-balance"
        >
          Snap Windows.
          <br />
          <span className="gradient-text">Stay Focused.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="max-w-lg text-[clamp(1rem,2.5vw,1.2rem)] text-neutral-500 dark:text-neutral-400 leading-relaxed text-balance"
        >
          The fastest, most intuitive window manager for macOS. Snap, arrange, and organize your workspace with a single drag — built natively for macOS Ventura and later.
        </motion.p>

        {/* CTA */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center gap-4 mt-2"
        >
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <motion.a
              href="/Redock.zip"
              download
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-[15px] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)] transition-shadow duration-200"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Download for macOS
            </motion.a>
            <motion.a
              href="/pricing"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-accent text-white font-semibold text-[15px] rounded-2xl shadow-[0_8px_24px_rgba(0,113,227,0.3)] hover:shadow-[0_12px_32px_rgba(0,113,227,0.4)] hover:bg-accent/90 transition-all duration-200"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1.5a.75.75 0 01.75.75v4h4a.75.75 0 010 1.5h-4v4a.75.75 0 01-1.5 0v-4h-4a.75.75 0 010-1.5h4v-4A.75.75 0 018 1.5z" />
              </svg>
              Get Pro — £19 once
            </motion.a>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">Version 1.2 · Free to download</span>
            <span className="text-xs text-neutral-400 dark:text-neutral-600">Requires macOS Ventura or later</span>
          </div>
        </motion.div>

        {/* Window mockup */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="w-full mt-10"
        >
          <WindowMockup />
        </motion.div>
      </div>
    </section>
  );
}
