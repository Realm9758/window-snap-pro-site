import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import Footer from "../components/Footer";
import PricingCard from "../components/PricingCard";
import { getStripe } from "../lib/stripe-browser";
import { apiPath } from "../lib/site";

const FREE_FEATURES = [
  { text: "Snap with keyboard shortcuts", included: true },
  { text: "Snap by dragging to an edge", included: true },
  { text: "Menu bar access", included: true },
  { text: "Clipboard history, 10 items", included: true },
  { text: "File shelf, 3 files", included: true },
  { text: "Saved workspaces", included: false },
  { text: "Auto-restore when you dock", included: false },
  { text: "App rules and drag zones", included: false },
  { text: "Clipboard search, pinning and images", included: false },
];

const PRO_FEATURES = [
  { text: "Everything in Free", included: true },
  { text: "Saved workspaces, unlimited", included: true },
  { text: "Auto-restore when you dock or undock", included: true },
  { text: "App rules and drag zones", included: true },
  { text: "Clipboard: 50 items, search, pinning, images", included: true },
  { text: "File shelf, 20 files", included: true },
  { text: "Three Macs", included: true },
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

export default function Pricing() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const [stripe, res] = await Promise.all([
        getStripe(),
        fetch(apiPath("/api/create-checkout-session"), {
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
      <Seo
        title="Redock pricing"
        description="Redock is free to use. Pro is £19 once, for three Macs, with every future update included. No subscription."
      />
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
                No subscription to cancel.
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
                description="Snapping, shortcuts and a short clipboard history."
                features={FREE_FEATURES}
                cta="Download"
                ctaHref="/download"
              />
              <PricingCard
                name="Pro"
                price="£19"
                period="one time"
                description="Saved layouts that come back when you reconnect a display."
                features={PRO_FEATURES}
                cta="Buy Redock"
                onCtaClick={handleSubscribe}
                highlighted
                loading={loading}
              />
            </motion.div>

            {/*
              Reassurance row.

              neutral-400 measured 2.5:1 on white, under the 4.5:1 floor for
              text this size; neutral-600 is 7.5:1, and neutral-400 is 8.9:1
              against the dark page.

              "Cancel any time" used to sit in this list. There is nothing to
              cancel: it is a one-time purchase, and saying otherwise on the
              pricing page implies a subscription we do not sell.
            */}
            <motion.div
              custom={4} variants={fadeUp} initial="hidden" animate="show"
              className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-neutral-600 dark:text-neutral-400"
            >
              {[
                { icon: "🔒", text: "Secure checkout via Stripe" },
                { icon: "↩️", text: "14-day trial, no card" },
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
                    q: "How do I activate Pro after buying?",
                    a: "After you buy, you'll receive a license key by email. Open Redock, go to Settings → Pro, paste your key, and click Activate.",
                  },
                  {
                    q: "Can I use my license on multiple Macs?",
                    a: "Yes. One licence covers three Macs. You can free a slot by deactivating a device from the Manage licence page.",
                  },
                  {
                    q: "What happens if I cancel?",
                    a: "Nothing to cancel. Pro is a one-time purchase, so it does not expire. If you ever remove the licence, the app returns to the free feature set and your settings, layouts and clipboard are kept.",
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
