import Link from "next/link";
import { AppleGlyph } from "./Marks";
import RestoreAnimation from "./RestoreAnimation";
import { apiPath } from "../lib/site";


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
            href={apiPath("/api/download?source=hero")}
            download
            className="group inline-flex items-center gap-2.5 rounded-lg px-5 py-3 text-[15px] font-medium transition-transform duration-150 active:scale-[0.985]"
            style={{ background: "var(--signal-fill)", color: "var(--signal-ink)" }}
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
          <span className="tabular">Version 1.5</span>. Free to use, with a
          14&#8209;day trial of everything in Pro. Requires macOS 13 or later.
        </p>
      </div>

      {/*
        The dock moment, shown immediately. A settings screenshot used to sit
        here: it proved the app exists but said nothing about why anyone would
        want it, and configuration panels are not the pitch.
      */}
      <div className="settle settle-4 mx-auto mt-12 max-w-3xl sm:mt-16">
        <RestoreAnimation className="w-full" />
      </div>
    </section>
  );
}
