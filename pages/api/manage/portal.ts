import type { NextApiRequest, NextApiResponse } from "next";
import { stripe, APP_URL } from "../../../lib/stripe";
import { getLicenseByEmail } from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body as { email?: string };
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required." });
  }

  const license = await getLicenseByEmail(email);

  if (!license || !license.stripe_customer_id) {
    return res.status(404).json({ error: "No subscription found for that email address." });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: license.stripe_customer_id,
      return_url: `${APP_URL}/manage-license`,
    });
    return res.status(200).json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create billing portal session";
    console.error("[portal] error:", message);
    return res.status(500).json({ error: message });
  }
}
