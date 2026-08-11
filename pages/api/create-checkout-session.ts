import type { NextApiRequest, NextApiResponse } from "next";
import { stripe, STRIPE_PRICE_ID, APP_URL } from "../../lib/stripe";
import { checkRateLimit } from "../../lib/rateLimit";
import { clientIp } from "../../lib/auth-server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  // Buying is deliberately open to anonymous visitors, so the only brake on
  // someone scripting this into Stripe's API rate limits is per-IP.
  if (!checkRateLimit(`checkout:${clientIp(req)}`, 10, 60_000).allowed) {
    return res.status(429).json({ error: "Too many requests. Please try again shortly." });
  }

  try {
    const { email } = req.body as { email?: string };

    // One-time purchase, not a subscription.
    //
    // Utilities in this category (Rectangle Pro, Moom, Dropover, Yoink) all sell
    // a single lifetime licence, and buyers actively resent a monthly fee for a
    // window manager. STRIPE_PRICE_ID must therefore point at a *one-time* Price
    // — a recurring Price will make Stripe reject `mode: "payment"`.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/pricing`,
      ...(email ? { customer_email: email } : {}),
      // `payment` mode has no subscription object, so metadata rides on the
      // PaymentIntent. The webhook reads it from there.
      payment_intent_data: {
        metadata: { product: "window_snap_pro", license_type: "lifetime" },
      },
      metadata: { product: "window_snap_pro", license_type: "lifetime" },
      allow_promotion_codes: true,
    });

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (err: unknown) {
    // Logged, not returned: Stripe errors quote price ids and account settings.
    console.error("[checkout] error:", err instanceof Error ? err.message : err);
    return res.status(500).json({ error: "Could not start checkout. Please try again." });
  }
}
