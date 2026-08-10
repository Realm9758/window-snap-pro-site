/**
 * Drawn marks. No emoji, no icon font, one stroke weight throughout.
 * SnapMark is the product's own idea drawn literally: a screen with a region
 * filled. It is the app icon, the wordmark lockup and the section marker.
 */

export function SnapMark({
  className = "",
  filled = "left",
}: {
  className?: string;
  filled?: "left" | "topLeft" | "topRight" | "bottomRight";
}) {
  const cell: Record<string, { x: number; y: number; w: number; h: number }> = {
    left:        { x: 3.2, y: 3.2, w: 8.6,  h: 15.6 },
    topLeft:     { x: 3.2, y: 3.2, w: 8.6,  h: 7.4  },
    topRight:    { x: 12.2, y: 3.2, w: 8.6, h: 7.4  },
    bottomRight: { x: 12.2, y: 11.4, w: 8.6, h: 7.4 },
  };
  const r = cell[filled];
  return (
    <svg viewBox="0 0 24 22" fill="none" className={className} aria-hidden="true">
      <rect
        x="1" y="1" width="22" height="20" rx="3.4"
        stroke="currentColor" strokeWidth="1.6" opacity="0.45"
      />
      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="1.8" fill="currentColor" />
    </svg>
  );
}

export function AppleGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

export function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 8.4l3.2 3.2L13 4.8"
        stroke="currentColor" strokeWidth="1.9"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export function Dash({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M4 8h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Two display arrangements side by side, showing the same windows landing in
 * the same places on reconnect. Diagram, not a fake screenshot.
 */
export function RestoreDiagram({ className = "" }: { className?: string }) {
  const win = (x: number, y: number, w: number, h: number, solid = false) => (
    <rect
      x={x} y={y} width={w} height={h} rx="2"
      fill={solid ? "var(--signal)" : "color-mix(in srgb, var(--ink) 12%, transparent)"}
      stroke={solid ? "none" : "color-mix(in srgb, var(--ink) 22%, transparent)"}
      strokeWidth="0.8"
    />
  );
  return (
    <svg viewBox="0 0 320 120" className={className} role="img"
         aria-label="Laptop alone with two windows, then the same laptop docked to an external display with the windows back in their saved positions.">
      {/* Laptop only */}
      <rect x="8" y="26" width="96" height="62" rx="4"
            fill="none" stroke="var(--edge)" strokeWidth="1.4" />
      <rect x="44" y="90" width="24" height="3" rx="1.5" fill="var(--edge)" />
      {win(14, 32, 40, 50, true)}
      {win(58, 32, 40, 24)}
      {win(58, 60, 40, 22)}

      {/* Connector */}
      <path d="M116 58 h28" stroke="var(--edge)" strokeWidth="1.4" strokeDasharray="3 4" />
      <path d="M140 54 l6 4 -6 4" fill="none" stroke="var(--edge)" strokeWidth="1.4"
            strokeLinecap="round" strokeLinejoin="round" />

      {/* Docked: external + laptop, same windows restored */}
      <rect x="156" y="10" width="120" height="76" rx="4"
            fill="none" stroke="var(--edge)" strokeWidth="1.4" />
      <rect x="204" y="88" width="24" height="3" rx="1.5" fill="var(--edge)" />
      {win(162, 16, 54, 64, true)}
      {win(220, 16, 50, 30)}
      {win(220, 50, 50, 30)}

      <rect x="284" y="46" width="30" height="22" rx="2.5"
            fill="none" stroke="var(--edge)" strokeWidth="1.2" />
      {win(287, 49, 24, 16)}
    </svg>
  );
}
