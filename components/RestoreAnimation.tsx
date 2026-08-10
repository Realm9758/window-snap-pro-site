/**
 * The dock moment, drawn rather than filmed.
 *
 * One 9 second loop: laptop alone with windows crowded onto it, an external
 * display connects, the saved layout lands on it, then the display goes away
 * and the windows return to the laptop. It is a diagram, not a fake screenshot,
 * so it makes no claim about what the UI looks like.
 *
 * Everything is CSS keyframes on SVG geometry. No JS, no video, a few KB, and
 * it stays sharp at any size. Honours prefers-reduced-motion by holding the
 * docked state instead of animating.
 */
export default function RestoreAnimation({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 340 150"
        className="w-full"
        role="img"
        aria-label="A laptop with three crowded windows. An external display connects and the windows move into their saved positions across both screens. The display disconnects and the windows return to the laptop."
      >
        {/* External display, present only while docked */}
        <g className="rd-external">
          <rect x="6" y="14" width="150" height="96" rx="5"
                fill="none" stroke="var(--edge)" strokeWidth="1.5" />
          <rect x="70" y="112" width="22" height="4" rx="2" fill="var(--edge)" />
          <rect x="58" y="116" width="46" height="3" rx="1.5" fill="var(--edge)" />
        </g>

        {/* Laptop, always present */}
        <g>
          <rect x="196" y="40" width="132" height="76" rx="5"
                fill="none" stroke="var(--edge)" strokeWidth="1.5" />
          <path d="M188 120 h148 l-6 6 h-136 z" fill="var(--edge)" opacity="0.55" />
        </g>

        {/* Windows. Each travels between a crowded laptop spot and a saved slot. */}
        <rect className="rd-win rd-win-a" rx="2.5" />
        <rect className="rd-win rd-win-b" rx="2.5" />
        <rect className="rd-win rd-win-c" rx="2.5" />

        {/* Connector, drawn only during the docked phase */}
        <g className="rd-cable">
          <path d="M162 74 h28" stroke="var(--signal)" strokeWidth="1.6"
                strokeLinecap="round" strokeDasharray="2 5" opacity="0.7" />
        </g>
      </svg>

      <style jsx>{`
        /* Geometry is animated through x/y/width/height so the shapes travel
           between two real layouts rather than being scaled. */
        :global(.rd-win) {
          fill: color-mix(in srgb, var(--ink) 13%, transparent);
          stroke: color-mix(in srgb, var(--ink) 24%, transparent);
          stroke-width: 0.8;
        }
        :global(.rd-win-a) { fill: var(--signal); stroke: none; }

        :global(.rd-external),
        :global(.rd-cable) {
          animation: rd-dock 9s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }

        :global(.rd-win-a) { animation: rd-a 9s cubic-bezier(0.16, 1, 0.3, 1) infinite; }
        :global(.rd-win-b) { animation: rd-b 9s cubic-bezier(0.16, 1, 0.3, 1) infinite; }
        :global(.rd-win-c) { animation: rd-c 9s cubic-bezier(0.16, 1, 0.3, 1) infinite; }

        /* The display fades in, holds, then leaves. */
        @keyframes rd-dock {
          0%, 12%   { opacity: 0; }
          26%, 68%  { opacity: 1; }
          82%, 100% { opacity: 0; }
        }

        /* Crowded on the laptop, then the saved slot, then back. */
        @keyframes rd-a {
          0%, 14%   { x: 202px; y: 46px; width: 58px;  height: 30px; }
          30%, 66%  { x: 14px;  y: 22px; width: 78px;  height: 80px; }
          84%, 100% { x: 202px; y: 46px; width: 58px;  height: 30px; }
        }
        @keyframes rd-b {
          0%, 14%   { x: 264px; y: 46px; width: 58px;  height: 30px; }
          30%, 66%  { x: 98px;  y: 22px; width: 52px;  height: 80px; }
          84%, 100% { x: 264px; y: 46px; width: 58px;  height: 30px; }
        }
        /* This one stays on the laptop when docked. Sending every window to the
           external screen left the laptop blank, which no real desk looks like. */
        @keyframes rd-c {
          0%, 14%   { x: 202px; y: 82px; width: 120px; height: 28px; }
          30%, 66%  { x: 204px; y: 48px; width: 116px; height: 60px; }
          84%, 100% { x: 202px; y: 82px; width: 120px; height: 28px; }
        }

        @media (prefers-reduced-motion: reduce) {
          :global(.rd-external),
          :global(.rd-cable),
          :global(.rd-win-a),
          :global(.rd-win-b),
          :global(.rd-win-c) {
            animation: none;
          }
          /* Hold the docked state: the outcome, not the transition. */
          :global(.rd-external), :global(.rd-cable) { opacity: 1; }
          :global(.rd-win-a) { x: 14px;  y: 22px; width: 78px; height: 80px; }
          :global(.rd-win-b) { x: 98px;  y: 22px; width: 52px; height: 80px; }
          :global(.rd-win-c) { x: 204px; y: 48px; width: 116px; height: 60px; }
        }
      `}</style>
    </div>
  );
}
