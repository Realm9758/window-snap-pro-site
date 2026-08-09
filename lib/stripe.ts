import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  typescript: true,
});

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID!;

/**
 * Public base URL, used for Stripe success/cancel/return URLs and every link in
 * the licence email.
 *
 * Derived from lib/site.ts rather than read straight from an env var, because
 * this site is served under a path (bhopstudio.com/mac-window-manager). Using a
 * bare origin here would drop the prefix and send buyers to a 404 the moment
 * they finish paying.
 */
export { SITE_URL as APP_URL } from "./site";
