import type { NextApiRequest, NextApiResponse } from "next";
import { getLicenseBySessionId } from "../../../lib/db";
import { checkRateLimit } from "../../../lib/rateLimit";
import { clientIp } from "../../../lib/auth-server";
import { createActivationURL } from "../../../lib/activation-link";

/**
 * GET /api/license/by-session?session_id=cs_xxx
 *
 * Called by the success page to retrieve the generated license key once the
 * Stripe webhook has fired and the record has been created in the database.
 *
 * The session id is the only thing standing between a caller and someone's
 * licence key, so it is treated as the secret it is: it is high-entropy and
 * issued by Stripe, but the route is rate limited anyway so the id space
 * cannot be walked, and the response carries nothing beyond what the buyer
 * who just paid already knows.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  if (!checkRateLimit(`by-session:${clientIp(req)}`, 30, 60_000).allowed) {
    return res.status(429).json({ error: "Too many requests. Please try again shortly." });
  }

  const { session_id } = req.query;
  if (!session_id || typeof session_id !== "string") {
    return res.status(400).json({ error: "Missing session_id" });
  }

  // Stripe checkout session ids look like cs_test_… / cs_live_…. Rejecting
  // anything else keeps malformed input away from the query entirely.
  if (!/^cs_[A-Za-z0-9_]{10,80}$/.test(session_id)) {
    return res.status(400).json({ error: "Invalid session_id" });
  }

  const license = await getLicenseBySessionId(session_id);

  if (!license) {
    // Webhook may not have fired yet — caller should retry
    return res.status(404).json({ found: false });
  }

  return res.status(200).json({
    found: true,
    license_key: license.license_key,
    activation_url: createActivationURL(license.id),
    email: license.email,
    plan: license.product_tier,
    status: license.subscription_status,
  });
}
