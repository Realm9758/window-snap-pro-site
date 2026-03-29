import type { NextApiRequest, NextApiResponse } from "next";
import { getLicenseBySessionId } from "../../../lib/db";

/**
 * GET /api/license/by-session?session_id=cs_xxx
 *
 * Called by the success page to retrieve the generated license key once the
 * Stripe webhook has fired and the record has been created in the database.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const { session_id } = req.query;
  if (!session_id || typeof session_id !== "string") {
    return res.status(400).json({ error: "Missing session_id" });
  }

  const license = await getLicenseBySessionId(session_id);

  if (!license) {
    // Webhook may not have fired yet — caller should retry
    return res.status(404).json({ found: false });
  }

  return res.status(200).json({
    found: true,
    license_key: license.license_key,
    email: license.email,
    plan: license.product_tier,
    status: license.subscription_status,
  });
}
