"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

interface Feature {
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
  badge?: string;
  loading?: boolean;
}

function CheckIcon({ included }: { included: boolean }) {
  return included ? (
    <svg
      className="w-4 h-4 text-accent flex-shrink-0"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
    </svg>
  ) : (
    <svg
      className="w-4 h-4 text-neutral-300 dark:text-neutral-600 flex-shrink-0"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
    </svg>
  );
}

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
  badge,
  loading = false,
}: PricingCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`relative flex flex-col rounded-[24px] p-8 ${
        highlighted
          ? "bg-neutral-900 dark:bg-white border border-neutral-800 dark:border-neutral-200 shadow-[0_24px_80px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.4)]"
          : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
      }`}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-white text-xs font-semibold shadow-lg shadow-accent/30">
            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
            {badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <p
          className={`text-sm font-semibold tracking-wide uppercase mb-3 ${
            highlighted ? "text-neutral-400 dark:text-neutral-500" : "text-neutral-400 dark:text-neutral-500"
          }`}
        >
          {name}
        </p>
        <div className="flex items-end gap-1.5 mb-3">
          <span
            className={`text-5xl font-bold tracking-tight ${
              highlighted ? "text-white dark:text-neutral-900" : "text-neutral-900 dark:text-white"
            }`}
          >
            {price}
          </span>
          {period && (
            <span
              className={`text-sm mb-2 ${
                highlighted ? "text-neutral-400 dark:text-neutral-500" : "text-neutral-400 dark:text-neutral-500"
              }`}
            >
              {period}
            </span>
          )}
        </div>
        <p
          className={`text-sm leading-relaxed ${
            highlighted ? "text-neutral-400 dark:text-neutral-500" : "text-neutral-500 dark:text-neutral-400"
          }`}
        >
          {description}
        </p>
      </div>

      {/* CTA */}
      <div className="mb-8">
        {ctaHref ? (
          <Link
            href={ctaHref}
            className={`block w-full py-3 px-6 rounded-2xl text-sm font-semibold text-center transition-all duration-150 ${
              highlighted
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                : "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-100"
            }`}
          >
            {cta}
          </Link>
        ) : (
          <button
            onClick={onCtaClick}
            disabled={loading}
            className={`w-full py-3 px-6 rounded-2xl text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 ${
              highlighted
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-60"
                : "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-100 disabled:opacity-60"
            }`}
          >
            {loading && (
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            )}
            {loading ? "Redirecting…" : cta}
          </button>
        )}
      </div>

      {/* Divider */}
      <div
        className={`border-t mb-6 ${
          highlighted ? "border-neutral-800 dark:border-neutral-200" : "border-neutral-100 dark:border-neutral-800"
        }`}
      />

      {/* Features */}
      <ul className="flex flex-col gap-3 flex-1">
        {features.map((feat) => (
          <li key={feat.text} className="flex items-center gap-3">
            <CheckIcon included={feat.included} />
            <span
              className={`text-sm ${
                feat.included
                  ? highlighted
                    ? "text-neutral-200 dark:text-neutral-700"
                    : "text-neutral-700 dark:text-neutral-200"
                  : "text-neutral-400 dark:text-neutral-600"
              }`}
            >
              {feat.text}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
