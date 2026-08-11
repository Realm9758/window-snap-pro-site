import type { NextApiRequest, NextApiResponse } from "next";
import { getLicenseByEmail } from "../../../lib/db";
import { requireUser, normalizeEmail } from "../../../lib/auth-server";

// Verifies the Supabase access token and returns that user's own license info.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const user = await requireUser(req);
  if (!user?.email) return res.status(401).json({ error: "Invalid or expired session." });

  const license = await getLicenseByEmail(normalizeEmail(user.email));

  return res.status(200).json({
    email: user.email,
    license: license
      ? {
          license_key:         license.license_key,
          product_tier:        license.product_tier,
          subscription_status: license.subscription_status,
          current_period_end:  license.current_period_end,
          cancel_at_period_end: license.cancel_at_period_end,
          active:              license.active,
          stripe_customer_id:  license.stripe_customer_id ?? null,
        }
      : null,
  });
}
