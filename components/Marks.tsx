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
