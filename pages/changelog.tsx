import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import Footer from "../components/Footer";
import ChangelogCard, { ChangelogEntry } from "../components/ChangelogCard";
import Link from "next/link";

const changelog: ChangelogEntry[] = [
  {
    version: "1.3",
    date: "August 2026",
    tag: "latest",
    changes: [
      { type: "added", text: "Workspaces: arrange your windows, save the layout, and restore it whenever you want." },
      { type: "added", text: "Bind a workspace to a monitor arrangement and it restores itself when you reconnect that setup." },
      { type: "added", text: "A 14-day trial of every Pro feature, with no card required to start it." },
      { type: "improved", text: "Window Snap Pro is now Redock. New name, new icon, and a rebuilt interface throughout." },
      { type: "improved", text: "The app follows your system light and dark appearance instead of forcing a dark theme." },
      { type: "improved", text: "Clipboard history keeps 10 items on Free and 50 on Pro, with search and pinning on Pro." },
      { type: "improved", text: "Now a universal build, so it runs natively on both Apple Silicon and Intel Macs." },
      { type: "fixed", text: "Clipboard and workspace shortcuts could trigger the wrong action when several were registered." },
    ],
  },
  {
    version: "1.2",
    date: "March 2026",
    tag: "stable",
    changes: [
      { type: "added", text: "Clipboard history: recall your last copied items from the menu bar." },
      { type: "added", text: "Pro users can raise the clipboard history limit via Settings → Clipboard." },
      { type: "improved", text: "Clipboard entries support rich previews for text, URLs, and code snippets." },
    ],
  },
  {
    version: "1.1",
    date: "March 2026",
    tag: "stable",
    changes: [
      { type: "added", text: "App rules: assign a default snap position for any app." },
      { type: "added", text: "Drag zones: resize and reposition the snap trigger areas." },
      { type: "added", text: "Custom keyboard shortcuts for every snap action." },
      { type: "improved", text: "Snap animations are now significantly smoother using spring physics." },
      { type: "improved", text: "Reduced CPU and memory use." },
      { type: "improved", text: "Multi-monitor support is now more reliable with mismatched display resolutions." },
      { type: "fixed", text: "Fixed a bug where windows would occasionally snap to the wrong position on secondary displays." },
      { type: "fixed", text: "Resolved a rare crash when rapidly dragging windows across monitor boundaries." },
    ],
  },
  {
    version: "1.0.1",
    date: "February 2026",
    tag: "stable",
    changes: [
      { type: "fixed", text: "Fixed an issue where the menu bar icon would not appear after system restart on Apple Silicon Macs." },
      { type: "fixed", text: "Resolved incorrect window sizing on displays with non-standard DPI settings." },
      { type: "improved", text: "Improved compatibility with Stage Manager on macOS Ventura." },
      { type: "improved", text: "Better handling of windows with minimum size constraints." },
    ],
  },
  {
    version: "1.0",
    date: "January 2026",
    changes: [
      { type: "added", text: "Initial release of Redock." },
      { type: "added", text: "Drag-to-edge window snapping: snap to left half, right half, top half, bottom half, and all four corners." },
      { type: "added", text: "Menu bar app for quick access to layouts and preferences." },
      { type: "added", text: "Multi-monitor support: snap windows on any connected display." },
      { type: "added", text: "Native macOS Ventura design with light and dark mode support." },
      { type: "added", text: "Built-in onboarding walkthrough for first-time setup." },
    ],
  },
];

export default function Changelog() {
  return (
    <>
      <Seo
        title="Redock changelog"
        description="Release notes and version history for Redock, the macOS window manager."
      />
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
        <Navbar />

        <main className="max-w-3xl mx-auto px-6 pt-32 pb-20">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-14"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors duration-150 mb-6 group"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:-translate-x-0.5 transition-transform duration-150"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to home
            </Link>

            <span className="text-xs font-semibold tracking-widest uppercase text-neutral-400 dark:text-neutral-500 mb-3 block">
              Release Notes
            </span>
            <h1 className="text-[clamp(2rem,6vw,3rem)] font-bold tracking-tight text-neutral-900 dark:text-white mb-3">
              Changelog
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-lg">
              Every update, improvement and fix.
            </p>
          </motion.div>

          {/* Changelog entries */}
          <div className="relative flex flex-col gap-6 md:gap-8 md:ml-4">
            {changelog.map((entry, i) => (
              <ChangelogCard key={entry.version} entry={entry} index={i} />
            ))}

            {/* Timeline end dot */}
            <div className="absolute left-0 bottom-0 w-[11px] h-[11px] rounded-full border-2 border-white dark:border-[#0a0a0a] bg-neutral-300 dark:bg-neutral-700 hidden md:block" />
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-16 p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <div className="font-semibold text-neutral-900 dark:text-white mb-0.5">Ready to try it?</div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">Download Redock for free.</div>
            </div>
            <Link
              href="/#download"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-semibold rounded-xl hover:bg-neutral-700 dark:hover:bg-neutral-100 transition-colors duration-150 whitespace-nowrap"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Download for macOS
            </Link>
          </motion.div>
        </main>

        <Footer />
      </div>
    </>
  );
}
