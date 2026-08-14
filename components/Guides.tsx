import Link from "next/link";

const GUIDES = [
  {
    title: "Redock vs built-in macOS tiling",
    body: "When Apple's free controls are enough—and when a saved workspace changes the equation.",
    href: "/compare/macos-window-tiling",
  },
  {
    title: "Best manager for multiple monitors",
    body: "A fair look at Redock, macOS, Rectangle Pro and Moom for multi-display work.",
    href: "/guides/best-window-manager-multiple-monitors",
  },
  {
    title: "Restore windows after reconnecting",
    body: "Save a whole desk and bind it to the displays that should bring it back.",
    href: "/guides/restore-window-positions-after-reconnecting-monitor",
  },
  {
    title: "Redock vs Rectangle",
    body: "Workspace recovery and adjacent tools versus deeper window gestures and custom actions.",
    href: "/compare/redock-vs-rectangle",
  },
  {
    title: "Ultrawide window layouts",
    body: "Five practical arrangements using thirds, two-thirds, centre and saved workspaces.",
    href: "/guides/ultrawide-window-layouts",
  },
];

export default function Guides() {
  return (
    <section id="guides" className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] signal">Guides</p>
        <h2 className="mt-3 text-[clamp(1.6rem,3vw,2.25rem)] font-semibold tracking-[-0.03em] ink text-balance">
          Choose for the problem you actually have.
        </h2>
        <p className="measure mt-3 leading-relaxed ink-2 text-pretty">
          Straight comparisons, honest limits and repeatable setups for displays that change through the week.
        </p>
        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {GUIDES.map((guide, index) => (
            <Link
              key={guide.href}
              href={guide.href}
              className={`group rounded-xl border p-5 transition-colors hover:border-[var(--signal)] ${index === GUIDES.length - 1 ? "sm:col-span-2" : ""}`}
              style={{ borderColor: "var(--hairline)", background: "var(--surface)" }}
            >
              <h3 className="text-[15.5px] font-medium ink group-hover:signal">{guide.title} →</h3>
              <p className="mt-2 text-[14px] leading-relaxed ink-2">{guide.body}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
