"use client";
import Link from "next/link";
import { Check, Dash } from "./Marks";
import PurchaseTrustLine from "./PurchaseTrustLine";

export interface Feature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: Feature[];
  cta: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  highlighted?: boolean;
  loading?: boolean;
}

/**
 * Two plans, no badge. A "Most Popular" tag on a two-option table where the
 * other option is free says nothing true, so it is gone. The paid column earns
 * attention through the signal border and filled button instead.
 */
export default function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  ctaHref,
  onCtaClick,
  highlighted = false,
  loading = false,
}: PricingCardProps) {
  return (
    <div
      className="flex flex-col rounded-xl border p-7"
      style={{
        background: "var(--surface)",
        borderColor: highlighted ? "var(--signal)" : "var(--hairline)",
      }}
    >
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] ink-3">
        {name}
      </h3>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="tabular text-[2.6rem] font-semibold leading-none tracking-[-0.03em] ink">
          {price}
        </span>
        {period && <span className="text-[14px] ink-3">{period}</span>}
      </div>

      <p className="mt-3 text-[14.5px] leading-relaxed ink-2 text-pretty">
        {description}
      </p>

      <ul className="mt-7 flex-1 space-y-2.5">
        {features.map((f) => (
          <li key={f.text} className="flex items-start gap-2.5 text-[14.5px]">
            {f.included ? (
              <Check className="mt-[3px] h-4 w-4 shrink-0 signal" />
            ) : (
              <Dash className="mt-[3px] h-4 w-4 shrink-0 ink-3" />
            )}
            <span className={f.included ? "ink" : "ink-3"}>{f.text}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {ctaHref ? (
          <Link
            href={ctaHref}
            className="block rounded-lg border px-5 py-3 text-center text-[15px] font-medium ink transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_5%,transparent)]"
            style={{ borderColor: "var(--edge)" }}
          >
            {cta}
          </Link>
        ) : (
          <button
            onClick={onCtaClick}
            disabled={loading}
            className="w-full rounded-lg px-5 py-3 text-[15px] font-medium transition-transform duration-150 active:scale-[0.985] disabled:opacity-60"
            style={{ background: "var(--signal-fill)", color: "var(--signal-ink)" }}
          >
            {loading ? "Opening checkout" : cta}
          </button>
        )}
        {highlighted && (
          <PurchaseTrustLine className="mt-3 text-center" />
        )}
      </div>
    </div>
  );
}
