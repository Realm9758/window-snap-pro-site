import { SnapMark } from "./Marks";
import SnapAnimation from "./SnapAnimation";
import ClipboardAnimation from "./ClipboardAnimation";

/**
 * Not a grid of equal cards. Workspaces is the reason to pay, so it leads at
 * full width; the two mechanics worth showing get animated cards; everything
 * else is a compact list. Weighting is what tells the reader what matters.
 */

const SECONDARY = [
  {
    name: "Snap with the keyboard",
    body: "Control-Option and an arrow key sends the front window to a half, a corner, or full screen. Rebind any of it.",
    tier: "Free",
  },
  {
    name: "Clipboard, expanded",
    body: "Pro raises the history to fifty items and adds search, pinning and copied images.",
    tier: "Pro",
  },
  {
    name: "Rules per app",
    body: "Send an app to the same position every time you launch it. Mail on the left, Terminal bottom right.",
    tier: "Pro",
  },
  {
    name: "Drag zones",
    body: "Set how large the edge and corner targets are, and how long a window must hover before it snaps.",
    tier: "Pro",
  },
  {
    name: "File shelf",
    body: "Drop files into the popup to hold them while you navigate somewhere else, then drag them out.",
    tier: "Pro",
  },
];

export default function Features() {
  return (
    <section id="features" className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        {/* Lead feature */}
        <div
          className="overflow-hidden rounded-xl border"
          style={{ borderColor: "var(--hairline)", background: "var(--surface)" }}
        >
          <div className="p-7 sm:p-10">
            <div>
              <h2 className="text-[clamp(1.5rem,2.6vw,2rem)] font-semibold leading-tight tracking-[-0.025em] ink text-balance">
                Workspaces
              </h2>
              <p className="measure mt-3 leading-relaxed ink-2 text-pretty">
                Arrange your windows once and save the layout. Redock records
                every window, which display it sits on, and the fraction of the
                screen it fills, so the layout survives a change of resolution.
              </p>
              <p className="measure mt-3 leading-relaxed ink-2 text-pretty">
                Bind a layout to a monitor setup and it restores itself when you
                reconnect. No hotkey, no menu.
              </p>
              <p className="mt-5 text-[13.5px] ink-3">
                Rectangle, Magnet and the tiling built into macOS all snap
                windows. None of them save layouts.
              </p>
            </div>
          </div>
        </div>

        {/* Two mechanics that are clearer shown than described. */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div
            className="rounded-xl border p-6"
            style={{ borderColor: "var(--hairline)", background: "var(--surface)" }}
          >
            <SnapAnimation className="w-full" />
            <h3 className="mt-5 text-[15.5px] font-medium ink">Drag to an edge</h3>
            <p className="mt-1.5 text-[14px] leading-relaxed ink-2 text-pretty">
              A translucent preview shows exactly where the window will land
              before you let go. Corners and halves, on any display.
            </p>
          </div>

          <div
            className="rounded-xl border p-6"
            style={{ borderColor: "var(--hairline)", background: "var(--surface)" }}
          >
            <ClipboardAnimation className="w-full" />
            <h3 className="mt-5 text-[15.5px] font-medium ink">Recall what you copied</h3>
            <p className="mt-1.5 text-[14px] leading-relaxed ink-2 text-pretty">
              Press Command-Shift-V for the last ten things on your clipboard.
              Pick one and it pastes where your cursor is.
            </p>
            {/* Reviewer point: Raycast and Maccy users see this as redundant.
                The off switch already exists in the app; saying so here is the fix. */}
            <p className="mt-2 text-[13px] ink-3">
              Already use Raycast or Maccy? Turn this off in Settings and keep
              the rest.
            </p>
          </div>
        </div>

        {/* Everything else, deliberately quieter */}
        <h3 className="mt-16 text-[13px] font-semibold uppercase tracking-[0.14em] ink-3">
          Also included
        </h3>
        <ul className="mt-5 grid gap-x-12 gap-y-8 sm:grid-cols-2">
          {SECONDARY.map((f) => (
            <li key={f.name}>
              <div className="flex items-baseline gap-2.5">
                <h4 className="text-[15.5px] font-medium ink">{f.name}</h4>
                {f.tier === "Pro" && (
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] signal">
                    Pro
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[14.5px] leading-relaxed ink-2 text-pretty">
                {f.body}
              </p>
            </li>
          ))}
        </ul>

        {/* Honest constraints, stated rather than buried */}
        <div className="mt-16 flex flex-col gap-3">
          <div
            className="flex items-start gap-3 rounded-lg border px-4 py-3.5"
            style={{ borderColor: "var(--hairline)" }}
          >
            <SnapMark className="mt-0.5 h-4 w-4 shrink-0 ink-3" />
            <p className="text-[13.5px] leading-relaxed ink-2">
              Redock needs macOS Accessibility permission, because moving another
              app&apos;s windows is not possible without it. Nothing leaves your
              Mac, and you can revoke it at any time in System Settings.
            </p>
          </div>
          {/* Reviewer point: Spaces behaviour was unstated. Redock has no Spaces
              handling in code, so the honest move is to say so, not imply it. */}
          <div
            className="flex items-start gap-3 rounded-lg border px-4 py-3.5"
            style={{ borderColor: "var(--hairline)" }}
          >
            <SnapMark className="mt-0.5 h-4 w-4 shrink-0 ink-3" />
            <p className="text-[13.5px] leading-relaxed ink-2">
              Redock works with displays, not macOS Spaces. It restores each
              window&apos;s size and position, and the window stays on whichever
              Space it is already on. Moving windows between Spaces is not
              something macOS lets apps do reliably, so Redock does not claim to.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
