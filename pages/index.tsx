import Head from "next/head";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Download from "../components/Download";
import Footer from "../components/Footer";
import PricingCard from "../components/PricingCard";
import { motion } from "framer-motion";
import { getStripe } from "../lib/stripe-browser";

const FREE_FEATURES = [
  { text: "Basic window snapping", included: true },
  { text: "Keyboard shortcuts", included: true },
  { text: "Menu bar access", included: true },
  { text: "Clipboard history (up to 5 items)", included: true },
  { text: "App-specific rules", included: false },
  { text: "Custom drag zones", included: false },
  { text: "Advanced animations", included: false },
  { text: "Clipboard history limit (up to 50)", included: false },
];

const PRO_FEATURES = [
  { text: "Everything in Free", included: true },
  { text: "App-specific snap rules", included: true },
  { text: "Custom drag zones", included: true },
  { text: "Advanced animations", included: true },
  { text: "Premium settings", included: true },
  { text: "Clipboard history limit (up to 50)", included: true },
  { text: "All future updates", included: true },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

function PricingPreview() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const [stripe, res] = await Promise.all([
        getStripe(),
        fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }),
      ]);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      // stripe is preloaded for PCI-compliance/Radar fraud detection
      void stripe;
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <section id="pricing" className="py-28 px-6 bg-neutral-50 dark:bg-neutral-900/40">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <motion.p
            custom={0} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-sm font-semibold text-accent tracking-widest uppercase mb-4"
          >
            Pricing
          </motion.p>
          <motion.h2
            custom={1} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-[clamp(2rem,5vw,3rem)] font-bold tracking-tight text-neutral-900 dark:text-white mb-4"
          >
            Free to start. Pro when you need it.
          </motion.h2>
          <motion.p
            custom={2} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto"
          >
            Redock is free forever. Unlock everything with a single £19 purchase — no subscription.
          </motion.p>
        </div>

        <motion.div
          custom={3} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto"
        >
          <PricingCard
            name="Free"
            price="£0"
            description="Solid window snapping for everyday use."
            features={FREE_FEATURES}
            cta="Download Free"
            ctaHref="/download"
          />
          <PricingCard
            name="Pro"
            price="£19"
            period="one-time"
            description="Full control over your window workflow."
            features={PRO_FEATURES}
            cta="Subscribe to Pro"
            onCtaClick={handleSubscribe}
            highlighted
            badge="Most Popular"
            loading={loading}
          />
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Head>
        <title>Redock — Snap Windows. Stay Focused.</title>
        <meta name="description" content="The fastest, most intuitive window manager for macOS. Snap, arrange, and organize your workspace with a single drag." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="vibecoded-verification" content="03b85dd2db8db10a50dc193bf1493531f32f" />
      </Head>
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
        <Navbar />
        <main>
          <Hero />
          <Features />
          <PricingPreview />
          <Download />
        </main>
        <Footer />
      </div>
    </>
  );
}
