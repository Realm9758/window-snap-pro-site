import { useState } from "react";

/**
 * The small set of pieces every admin page is built from.
 *
 * One card style, one stat style, one chart. Kept together so the three pages
 * cannot slowly grow three different-looking versions of the same box.
 */

export const cardClass =
  "rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.04)]";

export function Card({
  title,
  aside,
  children,
  className = "",
}: {
  title?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${cardClass} p-5 ${className}`}>
      {(title || aside) && (
        <div className="flex items-baseline justify-between gap-3 mb-4">
          {title && (
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</h2>
          )}
          {aside && (
            <span className="text-xs text-neutral-400 dark:text-neutral-500">{aside}</span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <div className={`${cardClass} p-5`}>
      <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 mb-1">{label}</p>
      {loading ? (
        <div className="h-8 w-20 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
      ) : (
        <p className="text-2xl font-semibold text-neutral-900 dark:text-white tabular-nums">{value}</p>
      )}
      {sub && !loading && (
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{sub}</p>
      )}
    </div>
  );
}

/** Money, from minor units. Never does float arithmetic on the stored value. */
export function formatMoney(minorUnits: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: minorUnits % 100 === 0 ? 0 : 2,
  }).format(minorUnits / 100);
}

export function formatDate(iso: string | null | undefined, withYear = true): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

export function formatDay(isoDate: string): string {
  // Buckets are UTC days, so they are formatted in UTC too. Formatting in
  // local time shifts a label onto the wrong day for anyone west of London.
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function relativeDays(iso: string | null | undefined): string {
  if (!iso) return "never";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

/**
 * Daily bar chart.
 *
 * Zero days keep a faint 2px stub rather than disappearing, so a gap reads as
 * "nothing happened" instead of "no data here".
 */
export function MiniBarChart({
  data,
  format = (n: number) => String(n),
  unit = "",
}: {
  data: { date: string; count: number }[];
  format?: (n: number) => string;
  unit?: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 0);
  const peakIndex = max > 0 ? data.findIndex((d) => d.count === max) : -1;

  if (!data.length) {
    return <div className="h-28 flex items-center justify-center text-xs text-neutral-400">No data yet.</div>;
  }

  return (
    <div>
      <div className="flex items-end gap-[3px] h-28 border-b border-neutral-100 dark:border-neutral-800">
        {data.map((d, i) => (
          <div key={d.date} className="relative flex-1 h-full flex items-end justify-center group">
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-lg bg-neutral-900 dark:bg-neutral-700 text-white text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-100 z-10">
              {format(d.count)}{unit} · {formatDay(d.date)}
            </div>
            {i === peakIndex && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0.5 text-[10px] font-medium text-neutral-500 dark:text-neutral-400 tabular-nums group-hover:opacity-0 transition-opacity duration-100">
                {format(d.count)}
              </span>
            )}
            <div
              className="w-full rounded-t-[4px] bg-accent"
              style={
                d.count === 0
                  ? { height: "2px", opacity: 0.15 }
                  : { height: `${Math.max((d.count / max) * 100, 4)}%` }
              }
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{formatDay(data[0].date)}</span>
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
          {formatDay(data[data.length - 1].date)}
        </span>
      </div>
    </div>
  );
}

/** Horizontal breakdown, for things ranked by count rather than by time. */
export function BreakdownList({
  rows,
  empty = "Nothing recorded yet.",
}: {
  rows: { label: string; count: number }[];
  empty?: string;
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  if (!rows.length) {
    return <p className="text-xs text-neutral-400 dark:text-neutral-500">{empty}</p>;
  }
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate">{row.label}</span>
            <span className="text-xs font-medium text-neutral-900 dark:text-white tabular-nums">
              {row.count}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.max((row.count / max) * 100, 2)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
      active ? "text-green-600 dark:text-green-400" : "text-neutral-400"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-neutral-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function PlanBadge({ tier }: { tier: string }) {
  const isPro = tier?.startsWith("pro");
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
      isPro
        ? "bg-accent/10 dark:bg-accent/20 text-accent"
        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
    }`}>
      {tier === "pro_lifetime" ? "Lifetime" : isPro ? "Pro" : "Free"}
    </span>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-xs text-neutral-400 hover:text-accent transition-colors duration-100 ml-2"
      title="Copy"
    >
      {copied ? (
        <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="8" height="10" rx="1.5"/>
          <path d="M4 4V3a1 1 0 011-1h6a1 1 0 011 1v1"/>
        </svg>
      )}
    </button>
  );
}
