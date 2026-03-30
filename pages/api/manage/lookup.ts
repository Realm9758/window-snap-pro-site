import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { getLicenseByEmail } from "../../../lib/db";

// Requires a valid Supabase Bearer token.
// Returns license data only for the authenticated user's own email —
// callers cannot look up arbitrary accounts.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const token = req.headers.authorization?.replace("Bearer ", "").trim();
  if (!token) return res.status(401).json({ error: "Unauthorized" });

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

  if (!license) {
    return res.status(200).json({ found: false });
  }

  return res.status(200).json({
    found: true,
    license_key:         license.license_key,
    plan:                license.product_tier,
    status:              license.subscription_status,
    current_period_end:  license.current_period_end,
    cancel_at_period_end: license.cancel_at_period_end,
  });
}
