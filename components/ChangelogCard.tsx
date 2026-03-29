"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface ChangelogEntry {
  version: string;
  date: string;
  tag?: "latest" | "stable" | "beta";
  changes: {
    type: "added" | "improved" | "fixed" | "removed";
    text: string;
  }[];
}

const typeConfig = {
  added: {
    label: "Added",
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    dot: "bg-green-500",
  },
  improved: {
    label: "Improved",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  fixed: {
    label: "Fixed",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  removed: {
    label: "Removed",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
  },
};

export default function ChangelogCard({
  entry,
  index,
}: {
  entry: ChangelogEntry;
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative"
    >
      {/* Timeline connector */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-800 ml-[5px] hidden md:block" />

      {/* Timeline dot */}
      <div className="absolute left-0 top-7 w-[11px] h-[11px] rounded-full border-2 border-white dark:border-[#0a0a0a] bg-neutral-400 dark:bg-neutral-600 hidden md:block z-10" />

      <div className="md:pl-10">
        <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:shadow-card transition-all duration-200">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                Version {entry.version}
              </h3>
              {entry.tag && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
                    entry.tag === "latest"
                      ? "bg-accent/10 text-accent border border-accent/20"
                      : entry.tag === "beta"
                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  {entry.tag === "latest" ? "Latest" : entry.tag === "beta" ? "Beta" : "Stable"}
                </span>
              )}
            </div>
            <span className="text-sm text-neutral-400 dark:text-neutral-500 font-medium">{entry.date}</span>
          </div>

          {/* Changes */}
          <ul className="space-y-3">
            {entry.changes.map((change, i) => {
              const cfg = typeConfig[change.type];
              return (
                <li key={i} className="flex items-start gap-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0 mt-0.5 ${cfg.bg} ${cfg.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {change.text}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

export type { ChangelogEntry };
