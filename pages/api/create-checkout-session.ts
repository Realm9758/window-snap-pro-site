import type { NextApiRequest, NextApiResponse } from "next";
import { stripe, STRIPE_PRICE_ID, APP_URL } from "../../lib/stripe";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { email } = req.body as { email?: string };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/pricing`,
      ...(email ? { customer_email: email } : {}),
      subscription_data: {
        metadata: { product: "window_snap_pro" },
      },
      allow_promotion_codes: true,
    });

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[checkout] error:", message);
    return res.status(500).json({ error: message });
  }
}
