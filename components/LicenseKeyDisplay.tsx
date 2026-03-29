"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LicenseKeyDisplayProps {
  licenseKey: string;
  large?: boolean;
}

export default function LicenseKeyDisplay({ licenseKey, large = false }: LicenseKeyDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = licenseKey;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Split key into segments for coloured display: WSP | A92K | F3L2 | 9XK1
  const parts = licenseKey.split("-");

  return (
    <div className="relative rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col items-center gap-4">
      {/* Label */}
      <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400 dark:text-neutral-500">
        License Key
      </p>

      {/* Key display */}
      <div className={`flex items-center gap-2 flex-wrap justify-center ${large ? "gap-3" : "gap-2"}`}>
        {parts.map((segment, i) => (
          <span key={i} className="flex items-center gap-2">
            <span
              className={`font-mono font-bold tracking-[0.18em] select-all ${
                large ? "text-3xl" : "text-xl"
              } ${
                i === 0
                  ? "text-accent"
                  : "text-neutral-900 dark:text-white"
              }`}
            >
              {segment}
            </span>
            {i < parts.length - 1 && (
              <span className="text-neutral-300 dark:text-neutral-600 font-mono font-light text-xl">
                –
              </span>
            )}
          </span>
        ))}
      </div>

      {/* Copy button */}
      <motion.button
        onClick={handleCopy}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
          copied
            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
            : "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-100"
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
              </svg>
              Copied!
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="4" y="4" width="8" height="10" rx="1.5" />
                <path d="M4 4V3a1 1 0 011-1h6a1 1 0 011 1v1" />
              </svg>
              Copy License Key
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
