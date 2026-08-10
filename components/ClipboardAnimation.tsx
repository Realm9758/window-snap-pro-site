/**
 * Copy, recall, paste. The full loop the screen recording never showed.
 *
 * A recording of the popup on its own proves nothing: you see a list, but not
 * where it came from or what it does. Here the sequence is explicit. Text is
 * selected and copied, it arrives at the top of the history, the popup opens on
 * the shortcut, an older entry is chosen, and it lands in the document.
 */
export default function ClipboardAnimation({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 320 200"
        className="w-full"
        role="img"
        aria-label="A line of text is selected and copied, then appears at the top of the Redock clipboard history. The history opens, an earlier item is chosen, and it is pasted into the document."
      >
        {/* Document */}
        <rect x="4" y="4" width="188" height="176" rx="5"
              fill="var(--surface)" stroke="var(--edge)" strokeWidth="1.4" />
        <rect x="4" y="4" width="188" height="13" rx="5" fill="var(--hairline)" />
        <rect x="4" y="11" width="188" height="6" fill="var(--hairline)" />

        {/* Static body lines */}
        <rect x="16" y="30" width="128" height="4" rx="2" fill="var(--hairline)" />
        <rect x="16" y="40" width="152" height="4" rx="2" fill="var(--hairline)" />

        {/* The line that gets copied, with a selection highlight */}
        <rect className="cb-select" x="14" y="52" width="120" height="11" rx="2.5" />
        <rect x="16" y="55" width="112" height="4.5" rx="2.25" fill="var(--ink-2)" />

        <rect x="16" y="74" width="140" height="4" rx="2" fill="var(--hairline)" />
        <rect x="16" y="84" width="96" height="4" rx="2" fill="var(--hairline)" />

        {/* Caret, then the pasted line appearing beneath it */}
        <rect className="cb-caret" x="16" y="106" width="1.6" height="11" rx="0.8" fill="var(--ink)" />
        <rect className="cb-pasted" x="16" y="108" width="104" height="4.5" rx="2.25" fill="var(--ink-2)" />

        {/* History popup */}
        <g className="cb-popup">
          <rect x="196" y="26" width="120" height="126" rx="6"
                fill="var(--surface)" stroke="var(--edge)" strokeWidth="1.2" />
          {/* Search field */}
          <rect x="204" y="34" width="104" height="13" rx="3" fill="var(--hairline)" />
          <circle cx="211" cy="40.5" r="2.6" fill="none" stroke="var(--ink-3)" strokeWidth="1" />
          <path d="M213 42.5 l2 2" stroke="var(--ink-3)" strokeWidth="1" strokeLinecap="round" />

          {/* Newest item, arriving from the copy */}
          <g className="cb-item-new">
            <rect x="204" y="53" width="104" height="20" rx="3"
                  fill="color-mix(in srgb, var(--signal) 16%, transparent)" />
            <rect x="210" y="60" width="72" height="4" rx="2" fill="var(--ink-2)" />
            <rect x="210" y="67" width="48" height="3" rx="1.5" fill="var(--ink-3)" />
          </g>

          {/* Older entries. The second is the one chosen. */}
          <g className="cb-item-pick">
            <rect x="204" y="77" width="104" height="20" rx="3" />
            <rect x="210" y="84" width="82" height="4" rx="2" fill="var(--ink-2)" />
            <rect x="210" y="91" width="40" height="3" rx="1.5" fill="var(--ink-3)" />
          </g>

          <rect x="210" y="108" width="66" height="4" rx="2" fill="var(--hairline)" />
          <rect x="210" y="118" width="88" height="4" rx="2" fill="var(--hairline)" />
          <rect x="210" y="128" width="54" height="4" rx="2" fill="var(--hairline)" />
        </g>

        {/* Shortcut caption, shown as the popup opens */}
        <g className="cb-keys">
          <rect x="222" y="162" width="68" height="16" rx="4"
                fill="var(--hairline)" stroke="var(--edge)" strokeWidth="0.8" />
          <text x="256" y="173" textAnchor="middle" fontSize="9"
                fill="var(--ink-2)" fontFamily="ui-monospace, monospace">⌘⇧V</text>
        </g>
      </svg>

      <style jsx>{`
        /* One 8s bar, every element phased against it. */
        :global(.cb-select) {
          fill: color-mix(in srgb, var(--signal) 30%, transparent);
          opacity: 0;
          animation: cb-select 8s linear infinite;
        }
        :global(.cb-popup)    { opacity: 0; animation: cb-popup 8s cubic-bezier(0.16,1,0.3,1) infinite; }
        :global(.cb-keys)     { opacity: 0; animation: cb-keys 8s linear infinite; }
        :global(.cb-item-new) { opacity: 0; animation: cb-new 8s cubic-bezier(0.16,1,0.3,1) infinite; }
        :global(.cb-item-pick) rect:first-child {
          fill: transparent;
          animation: cb-pick 8s linear infinite;
        }
        :global(.cb-caret)  { animation: cb-caret 8s steps(1) infinite; }
        :global(.cb-pasted) { opacity: 0; animation: cb-paste 8s cubic-bezier(0.16,1,0.3,1) infinite; }

        /* 0-15%: select the line. */
        @keyframes cb-select {
          0%, 3%    { opacity: 0; }
          8%, 20%   { opacity: 1; }
          26%, 100% { opacity: 0; }
        }
        /* 20%: it lands at the top of the history. */
        @keyframes cb-new {
          0%, 18%   { opacity: 0; transform: translateY(-6px); }
          26%, 100% { opacity: 1; transform: none; }
        }
        /* 30%: shortcut pressed, popup opens. */
        @keyframes cb-keys {
          0%, 26%   { opacity: 0; }
          32%, 44%  { opacity: 1; }
          52%, 100% { opacity: 0; }
        }
        @keyframes cb-popup {
          0%, 28%   { opacity: 0; transform: translateY(6px) scale(0.98); }
          38%, 74%  { opacity: 1; transform: none; }
          84%, 100% { opacity: 0; transform: translateY(4px) scale(0.99); }
        }
        /* 55%: an older entry is highlighted, then chosen. */
        @keyframes cb-pick {
          0%, 50%   { fill: transparent; }
          58%, 72%  { fill: color-mix(in srgb, var(--signal) 22%, transparent); }
          78%, 100% { fill: transparent; }
        }
        /* 78%: it appears in the document at the caret. */
        @keyframes cb-paste {
          0%, 74%   { opacity: 0; }
          82%, 96%  { opacity: 1; }
          99%, 100% { opacity: 0; }
        }
        @keyframes cb-caret {
          0%, 72%   { opacity: 1; }
          78%, 100% { opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          :global(.cb-select), :global(.cb-keys), :global(.cb-caret) { animation: none; opacity: 0; }
          :global(.cb-popup), :global(.cb-item-new), :global(.cb-pasted) {
            animation: none; opacity: 1; transform: none;
          }
          :global(.cb-item-pick) rect:first-child { animation: none; fill: transparent; }
        }
      `}</style>
    </div>
  );
}
