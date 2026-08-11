import type { NextApiRequest, NextApiResponse } from "next";
import { stripe, APP_URL } from "../../../lib/stripe";
import { getLicenseByEmail } from "../../../lib/db";
import { requireUser } from "../../../lib/auth-server";

/**
 * POST /api/manage/portal
 * Requires: Authorization: Bearer <supabase_access_token>
 * Returns: { url } — a Stripe Customer Portal session for the caller.
 *
 * This route used to take an email from the request body and open a portal for
 * whatever customer that email resolved to, with no authentication at all.
 * Anyone who knew or guessed a customer's email address could read their
 * invoices and billing address, change the payment method, and cancel the
 * purchase. The email now comes from the verified token and the body is
 * ignored entirely.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const user = await requireUser(req);
  if (!user?.email) return res.status(401).json({ error: "Unauthorized" });

  const license = await getLicenseByEmail(user.email);
  if (!license?.stripe_customer_id) {
    return res.status(404).json({ error: "No purchase found for this account." });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: license.stripe_customer_id,
      return_url: `${APP_URL}/manage-license`,
    });
    return res.status(200).json({ url: session.url });
  } catch (err: unknown) {
    // Stripe's message can name internal objects and configuration, so it is
    // logged rather than returned.
    console.error("[manage/portal]", err instanceof Error ? err.message : err);
    return res.status(500).json({ error: "Could not open the billing portal. Please try again." });
  }
}
