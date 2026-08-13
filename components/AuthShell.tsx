import Head from "next/head";
import Link from "next/link";
import { ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * The frame around every account form: log in, create account, confirm, reset.
 *
 * It exists because there are now four of these pages and the logo lockup, the
 * card and the entrance animation were being copied into each one. Four copies
 * is four places for them to drift apart, which is how the reset page ends up
 * looking like a phishing attempt of the login page.
 */
export default function AuthShell({
  title,
  heading,
  intro,
  children,
  footer,
}: {
  /** Browser tab text. */
  title: string;
  /** Card heading. Omit on pages that draw their own, like a success state. */
  heading?: string;
  intro?: ReactNode;
  children: ReactNode;
  /** Sits under the card, outside it. Usually the link to the other form. */
  footer?: ReactNode;
}) {
  return (
    <>
      <Head>
        <title>{title}</title>
        {/* None of these are pages a search result should ever land on. */}
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-sm"
        >
          <Link href="/" className="flex items-center gap-2.5 justify-center mb-10 group">
            <div className="w-8 h-8 rounded-[10px] bg-accent flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" />
                <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.7" />
                <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.7" />
                <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.4" />
              </svg>
            </div>
            <span className="font-semibold text-base tracking-tight text-neutral-900 dark:text-white">
              Redock
            </span>
          </Link>

          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-8">
            {heading && (
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">
                {heading}
              </h1>
            )}
            {intro && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-7 leading-relaxed">
                {intro}
              </p>
            )}
            {children}
          </div>

          {footer && (
            <div className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-5">
              {footer}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}

/** The one input style these forms use. Exported so no page re-types it. */
export const authInput =
  "w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border " +
  "border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 " +
  "dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 " +
  "focus:ring-accent/40 focus:border-accent transition-all duration-150";

export const authLabel = "text-xs font-medium text-neutral-600 dark:text-neutral-400";

export const authButton =
  "w-full py-3 bg-accent text-white font-semibold text-sm rounded-xl " +
  "shadow-sm shadow-accent/30 hover:bg-accent/90 transition-all duration-150 " +
  "disabled:opacity-60 mt-1";

/**
 * Failure text.
 *
 * role="alert" because the message appears below the fields, after focus has
 * moved on, and is otherwise silent to a screen reader. red-600 rather than
 * red-500 clears 4.5:1 against the tinted background at this size.
 */
export function AuthError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <motion.p
      role="alert"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-sm leading-relaxed text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2.5 rounded-lg"
    >
      {children}
    </motion.p>
  );
}
