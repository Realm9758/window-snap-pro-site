import type { NextApiRequest, NextApiResponse } from "next";
import { stripe, APP_URL } from "../../lib/stripe";
import { getLicenseByEmail } from "../../lib/db";
import { requireUser, normalizeEmail } from "../../lib/auth-server";

// POST /api/create-portal-session
// Requires: Authorization: Bearer <supabase_access_token>
// Returns: { url: string } — Stripe Customer Portal URL for the caller only.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const user = await requireUser(req);
  if (!user?.email) return res.status(401).json({ error: "Invalid or expired session." });

  const license = await getLicenseByEmail(normalizeEmail(user.email));
  if (!license?.stripe_customer_id) {
    return res.status(404).json({ error: "No purchase found for this account." });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: license.stripe_customer_id,
      return_url: `${APP_URL}/profile`,
    });
    return res.status(200).json({ url: session.url });
  } catch (err: unknown) {
    // Stripe's own message can name internal objects and account
    // configuration, so it is logged rather than handed to the browser.
    console.error("[create-portal-session]", err instanceof Error ? err.message : err);
    return res.status(500).json({ error: "Could not open the billing portal. Please try again." });
  }
}
