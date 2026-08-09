"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="9" height="18" rx="2" />
        <rect x="13" y="3" width="9" height="18" rx="2" />
      </svg>
    ),
    title: "Instant Window Snapping",
    description: "Drag any window to a screen edge and watch it snap to a perfect half, third, or quarter — instantly, with zero configuration.",
    accent: "from-blue-500/10 to-blue-600/5",
    iconColor: "text-blue-500 dark:text-blue-400",
    border: "group-hover:border-blue-200 dark:group-hover:border-blue-800",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
        <path d="M14.12 9.88a3 3 0 0 1 0 4.24" />
        <path d="M9.88 9.88a3 3 0 0 0 0 4.24" />
      </svg>
    ),
    title: "App-Specific Rules",
    description: "Set custom snap rules per app. Finder always opens at the right. Terminal always goes to the bottom. Your workflow, your rules.",
    accent: "from-purple-500/10 to-purple-600/5",
    iconColor: "text-purple-500 dark:text-purple-400",
    border: "group-hover:border-purple-200 dark:group-hover:border-purple-800",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: "Drag Zone Customization",
    description: "Define exactly where your snap zones live. Adjust zone size, shape, and trigger sensitivity until it feels like second nature.",
    accent: "from-green-500/10 to-green-600/5",
    iconColor: "text-green-500 dark:text-green-400",
    border: "group-hover:border-green-200 dark:group-hover:border-green-800",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="9" height="13" rx="1.5" />
        <rect x="13" y="2" width="9" height="17" rx="1.5" />
        <path d="M2 20h9" />
      </svg>
    ),
    title: "Multi-Monitor Support",
    description: "Seamless snapping across multiple displays. Move windows between monitors and they snap perfectly on every screen.",
    accent: "from-orange-500/10 to-orange-600/5",
    iconColor: "text-orange-500 dark:text-orange-400",
    border: "group-hover:border-orange-200 dark:group-hover:border-orange-800",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: "Fluid Animations",
    description: "Every snap, resize, and move is animated with buttery-smooth spring physics — fast enough to be invisible, beautiful enough to notice.",
    accent: "from-yellow-500/10 to-yellow-600/5",
    iconColor: "text-yellow-500 dark:text-yellow-400",
    border: "group-hover:border-yellow-200 dark:group-hover:border-yellow-800",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M9 9h6M9 12h4M9 15h6" />
      </svg>
    ),
    title: "Menu Bar Control",
    description: "A minimal menu bar icon gives you instant access to layouts, preferences, and snap rules — always one click away.",
    accent: "from-pink-500/10 to-pink-600/5",
    iconColor: "text-pink-500 dark:text-pink-400",
    border: "group-hover:border-pink-200 dark:group-hover:border-pink-800",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M9 12h6M9 15h4" />
      </svg>
    ),
    title: "Clipboard History",
    description: "Instantly recall your last 5 copied items from the menu bar — text, links, or snippets. Pro users can expand the limit up to 50.",
    accent: "from-teal-500/10 to-teal-600/5",
    iconColor: "text-teal-500 dark:text-teal-400",
    border: "group-hover:border-teal-200 dark:group-hover:border-teal-800",
  },
];

const whyPoints = [
  { icon: "⚡", label: "Blazing Fast", desc: "Responds in milliseconds. Zero perceptible lag." },
  { icon: "🍎", label: "Truly Native", desc: "Built with Swift, not Electron. Feels like Apple made it." },
  { icon: "🧘", label: "Clean UI", desc: "No clutter. No settings overload. Just works." },
  { icon: "🪶", label: "Lightweight", desc: "Under 5 MB. Uses barely any memory or CPU." },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className={`group relative p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 ${feature.border} transition-all duration-200 hover:shadow-card cursor-default`}
    >
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="relative">
        <div className={`w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4 ${feature.iconColor} group-hover:scale-110 transition-transform duration-200`}>
          {feature.icon}
        </div>
        <h3 className="font-semibold text-[15px] text-neutral-900 dark:text-white mb-2">{feature.title}</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{feature.description}</p>
      </div>
    </motion.div>
  );
}

export default function Features() {
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { once: true, margin: "-60px" });
  const whyRef = useRef(null);
  const whyInView = useInView(whyRef, { once: true, margin: "-60px" });

  return (
    <>
      {/* Features Section */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <motion.div
            ref={titleRef}
            initial={{ opacity: 0, y: 24 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center mb-16"
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-neutral-400 dark:text-neutral-500 mb-3 block">
              Features
            </span>
            <h2 className="text-[clamp(2rem,5vw,3rem)] font-bold tracking-tight text-neutral-900 dark:text-white text-balance mb-4">
              Everything you need.
              <br />
              <span className="text-neutral-400 dark:text-neutral-500">Nothing you don't.</span>
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto text-balance">
              Redock packs powerful window management into a beautifully simple experience.
            </p>
          </motion.div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <FeatureCard key={f.title} feature={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Redock */}
      <section className="py-24 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            ref={whyRef}
            initial={{ opacity: 0, y: 24 }}
            animate={whyInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-neutral-400 dark:text-neutral-500 mb-3 block">
              Why Redock
            </span>
            <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-bold tracking-tight text-neutral-900 dark:text-white text-balance">
              Designed for power users.
              <br />Loved by everyone.
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {whyPoints.map((pt, i) => (
              <motion.div
                key={pt.label}
                initial={{ opacity: 0, y: 20 }}
                animate={whyInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="group p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:shadow-card transition-all duration-200 hover:-translate-y-1 text-center cursor-default"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200 inline-block">
                  {pt.icon}
                </div>
                <div className="font-semibold text-sm text-neutral-900 dark:text-white mb-1">{pt.label}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{pt.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
