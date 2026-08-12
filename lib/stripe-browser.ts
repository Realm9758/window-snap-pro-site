import type { Stripe } from "@stripe/stripe-js";

/**
 * Stripe.js, fetched at the moment someone commits to buying and not before.
 *
 * The import is a type-only import plus a dynamic one inside the function, and
 * that shape is the point: a top-level `import { loadStripe }` puts the wrapper
 * in the entry bundle of every page that so much as renders a Buy button, which
 * here is the homepage. Now nothing Stripe-shaped is parsed until the click,
 * and the pages that never sell anything carry none of it.
 *
 * Singleton: repeated clicks reuse the one script tag.
 *
 * Uses NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for PCI-compliant client-side Stripe.
 */
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = import("@stripe/stripe-js").then(({ loadStripe }) =>
      loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
    );
  }
  return stripePromise;
}
