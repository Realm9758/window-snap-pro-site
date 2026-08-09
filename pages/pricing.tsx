import Head from "next/head";
import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PricingCard from "../components/PricingCard";
import { getStripe } from "../lib/stripe-browser";

const FREE_FEATURES = [
  { text: "Basic window snapping (halves & corners)", included: true },
  { text: "Keyboard shortcut support", included: true },
  { text: "Menu bar quick-access", included: true },
  { text: "Standard snap zones", included: true },
  { text: "Clipboard history (up to 5 items)", included: true },
  { text: "App-specific snap rules", included: false },
  { text: "Custom drag zones", included: false },
  { text: "Advanced animations", included: false },
  { text: "Premium settings panel", included: false },
  { text: "Clipboard history limit (up to 50)", included: false },
  { text: "Priority support", included: false },
];

const PRO_FEATURES = [
  { text: "Everything in Free", included: true },
  { text: "App-specific snap rules", included: true },
  { text: "Custom drag zones", included: true },
  { text: "Advanced animations", included: true },
  { text: "Premium settings panel", included: true },
  { text: "Multi-monitor profiles", included: true },
  { text: "Clipboard history limit (up to 50)", included: true },
  { text: "Priority support", included: true },
  { text: "All future Pro updates", included: true },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export default function Pricing() {
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
    <>
      <Head>
        <title>Pricing — Redock</title>
        <meta name="description" content="Simple, honest pricing for Redock. Free forever, or buy Pro once for £19 — no subscription." />
      </Head>
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
        <Navbar />
        <main className="pt-32 pb-24 px-6">
          <div className="max-w-5xl mx-auto">

            {/* Header */}
            <div className="text-center mb-16">
              <motion.p
                custom={0} variants={fadeUp} initial="hidden" animate="show"
                className="text-sm font-semibold text-accent tracking-widest uppercase mb-4"
              >
                Pricing
              </motion.p>
              <motion.h1
                custom={1} variants={fadeUp} initial="hidden" animate="show"
                className="text-[clamp(2.4rem,6vw,3.8rem)] font-bold tracking-tight text-neutral-900 dark:text-white leading-[1.08] mb-5"
              >
                Simple, honest pricing.
              </motion.h1>
              <motion.p
                custom={2} variants={fadeUp} initial="hidden" animate="show"
                className="text-lg text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto leading-relaxed"
              >
                Start for free. Upgrade to Pro when you need more power.
                Cancel any time — no questions asked.
              </motion.p>
            </div>

            {/* Cards */}
            <motion.div
              custom={3} variants={fadeUp} initial="hidden" animate="show"
              className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto"
            >
              <PricingCard
                name="Free"
                price="£0"
                description="Everything you need to get started with smarter window management."
                features={FREE_FEATURES}
                cta="Download Free"
                ctaHref="/download"
              />
              <PricingCard
                name="Pro"
                price="£19"
                period="one-time"
                description="Pay once. Yours forever, on up to 3 Macs, including every future update."
                features={PRO_FEATURES}
                cta="Buy Pro — £19"
                onCtaClick={handleSubscribe}
                highlighted
                badge="One-time purchase"
                loading={loading}
              />
            </motion.div>

            {/* Reassurance */}
            <motion.div
              custom={4} variants={fadeUp} initial="hidden" animate="show"
              className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-neutral-400 dark:text-neutral-500"
            >
              {[
                { icon: "🔒", text: "Secure checkout via Stripe" },
                { icon: "↩️", text: "Cancel any time" },
                { icon: "📧", text: "License key emailed instantly" },
                { icon: "🖥️", text: "Up to 3 Mac activations" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </motion.div>

            {/* FAQ */}
            <motion.div
              custom={5} variants={fadeUp} initial="hidden" animate="show"
              className="mt-20 max-w-2xl mx-auto"
            >
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-8 text-center">
                Frequently asked questions
              </h2>
              <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
                {[
                  {
                    q: "How do I activate Pro after subscribing?",
                    a: "After subscribing you'll receive a license key by email. Open Redock, go to Settings → Pro, paste your key, and click Activate.",
                  },
                  {
                    q: "Can I use my license on multiple Macs?",
                    a: "Yes — each Pro license supports up to 3 Mac activations. You can deactivate a device via the Manage License page to free up a slot.",
                  },
                  {
                    q: "What happens if I cancel?",
                    a: "You keep Pro access until the end of your billing period. After that, the app reverts to the free feature set — your settings are preserved.",
                  },
                  {
                    q: "I lost my license key. Can I recover it?",
                    a: "Yes. Visit the Manage License page, enter your purchase email, and we'll resend your key immediately.",
                  },
                ].map((faq) => (
                  <div key={faq.q} className="py-5">
                    <p className="font-medium text-neutral-900 dark:text-white mb-2">{faq.q}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
