import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { getLicenseByEmail } from "../../../lib/db";

// Verifies the Supabase access token and returns the user's license info.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const token = req.headers.authorization?.replace("Bearer ", "").trim();
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  // Use service-role client to verify the JWT
  const admin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user?.email) {
    return res.status(401).json({ error: "Invalid or expired session." });
  }

  const license = await getLicenseByEmail(user.email);

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
