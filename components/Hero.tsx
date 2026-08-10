import Link from "next/link";
import { SnapMark, AppleGlyph } from "./Marks";

/**
 * The hero sells the one thing no competitor does: layouts coming back when you
 * reconnect a display. Snapping is a free commodity and is deliberately not the
 * headline.
 *
 * Motion is one authored moment. Elements settle downward into place, which is
 * the product's own gesture, and nothing else on the page animates on scroll.
 */
export default function Hero() {
  return (
    <section className="relative px-6 pt-20 pb-14 sm:pt-28 sm:pb-20">
      <div className="mx-auto max-w-5xl">
        <h1 className="settle settle-1 max-w-[19ch] text-[clamp(2.4rem,6.4vw,4.25rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-balance ink">
          Plug in your monitor. Everything goes back where it was.
        </h1>

        <p className="settle settle-2 measure mt-6 text-[clamp(1.02rem,1.6vw,1.2rem)] leading-relaxed ink-2 text-pretty">
          Redock saves the size and position of every open window on every
          display. Reconnect that setup later and it puts them all back, without
          you touching anything.
        </p>

        <div className="settle settle-3 mt-9 flex flex-wrap items-center gap-3">
          <a
            href="/Redock.zip"
            download
            className="group inline-flex items-center gap-2.5 rounded-lg px-5 py-3 text-[15px] font-medium transition-transform duration-150 active:scale-[0.985]"
            style={{ background: "var(--signal)", color: "var(--signal-ink)" }}
          >
            <AppleGlyph className="h-4 w-4" />
            Download for macOS
          </a>

          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-[15px] font-medium ink transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_5%,transparent)]"
            style={{ borderColor: "var(--edge)" }}
          >
            Buy Redock
            <span className="tabular ink-2">£19</span>
          </Link>
        </div>

        <p className="settle settle-3 mt-4 text-[13px] ink-3">
          <span className="tabular">Version 1.2</span>. Free to use, with a
          14&#8209;day trial of everything in Pro. Requires macOS 13 or later.
        </p>
      </div>

      {/* Proof: the real app, not a mockup. */}
      <div className="settle settle-4 mx-auto mt-14 max-w-5xl sm:mt-20">
        <figure
          className="overflow-hidden rounded-xl border shadow-[0_24px_70px_-30px_rgba(10,14,22,0.45)]"
          style={{ borderColor: "var(--edge)" }}
        >
          <picture>
            <source
              srcSet="/redock/shots/app-settings-dark.webp"
              media="(prefers-color-scheme: dark)"
              type="image/webp"
            />
            <source srcSet="/redock/shots/app-settings-light.webp" type="image/webp" />
            <img
              src="/redock/shots/app-settings-light.png"
              alt="Redock settings window on macOS, showing the General pane with window snapping, launch at login and snap preview options, and a sidebar listing Shortcuts, Snapping, Clipboard, Workspaces, App Rules, Drag Zones and License."
              width={1560}
              height={1064}
              className="block w-full"
            />
          </picture>
        </figure>
        <figcaption className="mt-3 text-center text-[12.5px] ink-3">
          Redock 1.2 on macOS 26.
        </figcaption>
      </div>
    </section>
  );
}

export { SnapMark };
