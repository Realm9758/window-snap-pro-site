import { useState } from "react";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import ProductSchema from "../components/ProductSchema";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";
import PricingCard from "../components/PricingCard";
import { getStripe } from "../lib/stripe-browser";
import { apiPath, CONTACT_EMAIL } from "../lib/site";

const FREE_FEATURES = [
  { text: "Snap with keyboard shortcuts", included: true },
  { text: "Snap by dragging to an edge", included: true },
  { text: "Menu bar access", included: true },
  { text: "Clipboard history, 10 items", included: true },
  { text: "Saved workspaces", included: false },
  { text: "Auto-restore when you dock", included: false },
  { text: "App rules and drag zones", included: false },
];

const PRO_FEATURES = [
  { text: "Everything in Free", included: true },
  { text: "Saved workspaces, unlimited", included: true },
  { text: "Auto-restore when you dock", included: true },
  { text: "App rules and drag zones", included: true },
  { text: "Clipboard: 50 items, search, images", included: true },
  { text: "Three Macs, all future updates", included: true },
];

function Pricing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuy = async () => {
    setLoading(true);
    setError(null);
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
      if (!res.ok) throw new Error(data.error || "Checkout could not be opened.");
      void stripe; // preloaded so Stripe Radar can fingerprint the session
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("Checkout could not be opened.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Checkout could not be opened."
      );
      setLoading(false);
    }
  };

  return (
    <section id="pricing" className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-[clamp(1.6rem,3vw,2.25rem)] font-semibold tracking-[-0.03em] ink text-balance">
          Free to use. £19 once for the rest.
        </h2>
        <p className="measure mt-3 leading-relaxed ink-2 text-pretty">
          No subscription. Buy it once and it stays yours, on up to three Macs,
          including every future update. Pro is free to try for 14 days without
          a card.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
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
            onCtaClick={handleBuy}
            highlighted
            loading={loading}
          />
        </div>

        {error && (
          <p role="alert" className="mt-4 text-[14px]" style={{ color: "#c0392b" }}>
            {error} You can also{" "}
            <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
              email us
            </a>{" "}
            and we will sort it out.
          </p>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Seo
        title="Redock: save and restore Mac window layouts"
        description="Redock saves the position of every window on every display and puts them back when you reconnect your monitor. A window manager for macOS. £19 once, no subscription."
      />
      <ProductSchema />

      <Navbar />
      <main>
        <Hero />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
