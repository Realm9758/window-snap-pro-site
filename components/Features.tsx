import { RestoreDiagram, SnapMark } from "./Marks";

/**
 * Not a grid of equal cards. Workspaces is the reason to pay, so it gets the
 * full width and the diagram; everything else is a compact list underneath.
 * Weighting the layout is what tells the reader which feature matters.
 */

const SECONDARY = [
  {
    name: "Snap with the keyboard",
    body: "Control-Option and an arrow key sends the front window to a half, a corner, or full screen. Rebind any of it.",
    tier: "Free",
  },
  {
    name: "Snap by dragging",
    body: "Drag a window to an edge or corner and a preview shows where it will land. Release to place it.",
    tier: "Free",
  },
  {
    name: "Clipboard history",
    body: "The last ten things you copied, one keystroke away. Pro raises it to fifty and adds search, pinning and images.",
    tier: "Free",
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
          <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
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

            <RestoreDiagram className="w-full" />
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

        {/* Honest constraint, stated rather than buried */}
        <div
          className="mt-16 flex items-start gap-3 rounded-lg border px-4 py-3.5"
          style={{ borderColor: "var(--hairline)" }}
        >
          <SnapMark className="mt-0.5 h-4 w-4 shrink-0 ink-3" />
          <p className="text-[13.5px] leading-relaxed ink-2">
            Redock needs macOS Accessibility permission, because moving another
            app&apos;s windows is not possible without it. Nothing leaves your
            Mac, and you can revoke it at any time in System Settings.
          </p>
        </div>
      </div>
    </section>
  );
}
