import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import Footer from "../components/Footer";
import ChangelogCard, { ChangelogEntry } from "../components/ChangelogCard";
import Link from "next/link";

const changelog: ChangelogEntry[] = [
  {
    version: "1.9.1",
    date: "August 2026",
    tag: "latest",
    changes: [
      { type: "improved", text: "Redock checks for signed updates when it launches if the previous check is more than a day old. The update prompt is brought to the front instead of hiding behind another app." },
      { type: "improved", text: "Launch at Login is enabled for new installs so Redock is ready after every login. It remains an ordinary toggle in General Settings and an existing opt-out is always preserved." },
    ],
  },
  {
    version: "1.9",
    date: "August 2026",
    tag: "stable",
    changes: [
      { type: "added", text: "Snap windows to thirds, two-thirds, or an almost-maximized frame. Center sizing is configurable, and repeated Left or Right Half shortcuts can cycle through half, third, and two-thirds sizes." },
      { type: "added", text: "Move the current window to the next or previous display while preserving its relative size and position, then restore its pre-snap frame when you need it back." },
      { type: "improved", text: "Workspaces can be renamed and report how many windows moved or which apps were skipped. App rules can be edited without deleting and recreating them." },
      { type: "improved", text: "Clipboard history supports Cmd+1–9 selection and Delete, while File Shelf limits, disabled state, stale files, and cached icons now behave consistently." },
      { type: "fixed", text: "Snapping is verified after each final Accessibility write, with a second pass for apps that clamp window sizes. Electron apps now snap instantly and accurately across displays." },
      { type: "fixed", text: "Permission revocation, refused workspace shortcuts, launch-at-login failures, rule timeouts, and corrupted saved layouts no longer fail invisibly." },
      { type: "improved", text: "Redock 1.8 settings migrate automatically to stable action IDs. This preference upgrade is one-way, so downgrading after opening 1.9 is not supported." },
    ],
  },
  {
    version: "1.8",
    date: "August 2026",
    tag: "stable",
    changes: [
      { type: "improved", text: "The installer window now shows what to do, including the step everyone missed: open Redock from your Applications folder, not from the disk image." },
      { type: "fixed", text: "Redock refuses to run from the disk image instead of starting up and quietly failing later. macOS discards permissions granted to an app opened that way, which is why window snapping appeared broken for some people after they had granted it correctly." },
      { type: "improved", text: "If you already dragged Redock to Applications, it offers to open that copy for you rather than making you find it." },
    ],
  },
  {
    version: "1.7",
    date: "August 2026",
    tag: "stable",
    changes: [
      { type: "added", text: "Redock updates itself. New versions are found in the background and installed with one click, so you no longer have to download and reinstall by hand." },
      { type: "fixed", text: "Dragging a window to the screen edge did nothing for new users. The permission was fine: macOS decides whether an app may watch for drags when that app starts, so granting it to an already-running Redock left dragging dead until a restart, and nothing said so. Redock now detects this and offers the restart." },
      { type: "fixed", text: "Opening Redock from the disk image instead of the Applications folder made every permission you granted worthless, because macOS runs it from a temporary location. Redock now spots this and tells you before you grant anything." },
      { type: "fixed", text: "Drag snapping no longer gives up when an app is slow to respond or uses a non-standard title bar." },
    ],
  },
  {
    version: "1.5",
    date: "August 2026",
    tag: "stable",
    changes: [
      { type: "fixed", text: "Upgrading from an older version no longer resets your drag zone settings back to defaults." },
      { type: "fixed", text: "Lowering the clipboard history size, or reaching the end of a trial, no longer silently deletes everything over the limit the next time you copy something." },
      { type: "fixed", text: "The clipboard item counter counts the entries the limit actually applies to, so pinning things no longer makes it read past the maximum." },
      { type: "improved", text: "Colours come from one set of tokens across the whole app, so warnings, successes and Pro markers look the same everywhere and adapt properly to light and dark." },
      { type: "improved", text: "The Pro pane no longer relies on a white icon that disappeared against a light system accent colour." },
      { type: "improved", text: "You can buy Redock straight from the upgrade screen instead of having to start a trial or find the licence pane first." },
    ],
  },
  {
    version: "1.4",
    date: "August 2026",
    tag: "stable",
    changes: [
      { type: "fixed", text: "Layouts now restore after you unplug and replug the same monitor, or when a display sleeps and wakes. Previously only a change in which displays were connected counted." },
      { type: "fixed", text: "Dragging a window between displays snaps it where the preview showed. It could land on the display it came from instead." },
      { type: "fixed", text: "App rules resize the app that launched, rather than whatever window happened to take focus while Redock waited for it." },
      { type: "fixed", text: "Activating a licence unlocks the app straight away. Settings used to keep showing padlocks until you relaunched." },
      { type: "fixed", text: "Reinstalling macOS or clearing preferences no longer spends one of your three activations." },
      { type: "fixed", text: "A system clock that was wrong and then corrected can no longer end a trial early." },
      { type: "added", text: "Redock now tells you when macOS refuses one of its shortcuts, which happens when Rectangle or Magnet already owns the same keys." },
      { type: "added", text: "Pin or delete individual clipboard entries and shelf files from a right-click menu." },
      { type: "improved", text: "The permission screen states what Redock actually reads, names the publisher, discloses clipboard history, and offers a restart if macOS does not pick up the change." },
      { type: "improved", text: "Licences are re-checked once a day instead of only when the Pro settings pane is opened." },
    ],
  },
  {
    version: "1.3",
    date: "August 2026",
    tag: "stable",
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
              className="inline-flex items-center gap-1.5 min-h-[44px] text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors duration-150 mb-2 group"
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

            <span className="text-xs font-semibold tracking-widest uppercase text-neutral-600 dark:text-neutral-400 mb-3 block">
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
            {/*
              Was /#download, an anchor the homepage no longer has, so the
              button scrolled nowhere. The download page is the destination.
            */}
            <Link
              href="/download"
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
