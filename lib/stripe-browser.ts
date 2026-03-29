import { loadStripe, Stripe } from "@stripe/stripe-js";

// Singleton — safe to call multiple times; only loads Stripe.js once.
// Uses NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for PCI-compliant client-side Stripe.
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
}
