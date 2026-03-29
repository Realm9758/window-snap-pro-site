import type { NextApiRequest, NextApiResponse } from "next";
import { getLicenseByEmail } from "../../../lib/db";
import { checkRateLimit } from "../../../lib/rateLimit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body as { email?: string };
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required." });
  }

  // Rate limit: 5 lookups per minute per email
  const rl = checkRateLimit(`lookup:${email.toLowerCase()}`, 5, 60_000);
  if (!rl.allowed) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }

  const license = await getLicenseByEmail(email);

  if (!license) {
    return res.status(200).json({ found: false });
  }

  return res.status(200).json({
    found: true,
    license_key: license.license_key,
    email: license.email,
    plan: license.product_tier,
    status: license.subscription_status,
    current_period_end: license.current_period_end,
    cancel_at_period_end: license.cancel_at_period_end,
  });
}
