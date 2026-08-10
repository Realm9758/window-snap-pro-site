/**
 * Drag to snap, including the part a plain screen recording misses.
 *
 * The whole point of this feature is the preview: drag a window toward an edge
 * and Redock paints a translucent blue region showing exactly where it will
 * land. Triggering a snap by keyboard never shows that, which is why filming it
 * looked like ordinary macOS window movement.
 *
 * Loop: window drifts left, the preview appears on the left half, the window
 * lands in it, holds, then returns.
 */
export default function SnapAnimation({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 320 200"
        className="w-full"
        role="img"
        aria-label="A window is dragged toward the left edge of a screen. A translucent blue region appears over the left half showing where it will land, and the window snaps into it."
      >
        {/* Screen */}
        <rect x="4" y="4" width="312" height="176" rx="6"
              fill="none" stroke="var(--edge)" strokeWidth="1.6" />
        <rect x="140" y="184" width="40" height="4" rx="2" fill="var(--edge)" />

        {/* Menu bar hint */}
        <rect x="4" y="4" width="312" height="12" rx="6" fill="var(--hairline)" opacity="0.5" />
        <rect x="4" y="10" width="312" height="6" fill="var(--hairline)" opacity="0.5" />

        {/* The snap preview: the blue region Redock paints while dragging. */}
        <rect className="sn-preview" x="10" y="22" width="148" height="152" rx="4" />

        {/* The window being dragged */}
        <g className="sn-window">
          <rect x="0" y="0" width="150" height="104" rx="4"
                fill="var(--surface)" stroke="var(--edge)" strokeWidth="1.2" />
          <rect x="0" y="0" width="150" height="14" rx="4" fill="var(--hairline)" />
          <rect x="0" y="10" width="150" height="4" fill="var(--hairline)" />
          <circle cx="9" cy="7" r="2.4" fill="var(--edge)" />
          <circle cx="17" cy="7" r="2.4" fill="var(--edge)" />
          <circle cx="25" cy="7" r="2.4" fill="var(--edge)" />
          <rect x="10" y="26" width="86" height="4" rx="2" fill="var(--hairline)" />
          <rect x="10" y="36" width="120" height="4" rx="2" fill="var(--hairline)" />
          <rect x="10" y="46" width="104" height="4" rx="2" fill="var(--hairline)" />
        </g>

        {/* Pointer, so the drag reads as deliberate */}
        <g className="sn-cursor">
          <path d="M0 0 L0 12 L3.2 9.2 L5.4 13.6 L7.6 12.4 L5.4 8.2 L9.6 8.2 Z"
                fill="var(--ink)" stroke="var(--paper)" strokeWidth="0.9" strokeLinejoin="round" />
        </g>
      </svg>

      <style jsx>{`
        :global(.sn-preview) {
          fill: color-mix(in srgb, var(--signal) 26%, transparent);
          stroke: var(--signal);
          stroke-width: 1.4;
          opacity: 0;
          animation: sn-preview 7s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        :global(.sn-window) {
          animation: sn-window 7s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        :global(.sn-cursor) {
          animation: sn-cursor 7s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }

        /* Appears once the window nears the edge, disappears once it lands. */
        @keyframes sn-preview {
          0%, 22%   { opacity: 0; }
          32%, 50%  { opacity: 1; }
          58%, 100% { opacity: 0; }
        }

        /* Rest, drag toward the edge, snap to fill the left half, hold, return. */
        @keyframes sn-window {
          0%, 12%  { transform: translate(120px, 52px) scale(1); }
          40%      { transform: translate(26px, 34px) scale(1); }
          56%, 76% { transform: translate(10px, 22px) scale(0.987); }
          96%,100% { transform: translate(120px, 52px) scale(1); }
        }
        /* The cursor grips the title bar, so it tracks the same path. */
        @keyframes sn-cursor {
          0%, 12%  { transform: translate(180px, 58px); opacity: 1; }
          40%      { transform: translate(86px, 40px); opacity: 1; }
          56%      { transform: translate(70px, 28px); opacity: 1; }
          64%, 88% { transform: translate(70px, 28px); opacity: 0; }
          96%,100% { transform: translate(180px, 58px); opacity: 0; }
        }

        /* The left half is 148 wide against the window's 150, so the snap is a
           near-identity scale. Scaling the group would distort the title bar, so
           the landing frame is drawn by the preview instead. */

        @media (prefers-reduced-motion: reduce) {
          :global(.sn-preview) { animation: none; opacity: 1; }
          :global(.sn-window)  { animation: none; transform: translate(10px, 22px); }
          :global(.sn-cursor)  { animation: none; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
