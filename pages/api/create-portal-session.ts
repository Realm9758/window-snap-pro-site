import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { stripe, APP_URL } from "../../lib/stripe";
import { getLicenseByEmail } from "../../lib/db";

// POST /api/create-portal-session
// Requires: Authorization: Bearer <supabase_access_token>
// Returns: { url: string } — Stripe Customer Portal URL
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const token = req.headers.authorization?.replace("Bearer ", "").trim();
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const admin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user?.email) {
    return res.status(401).json({ error: "Invalid or expired session." });
  }

  const license = await getLicenseByEmail(user.email);
  if (!license?.stripe_customer_id) {
    return res.status(404).json({ error: "No subscription found for this account." });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: license.stripe_customer_id,
      return_url: `${APP_URL}/profile`,
    });
    return res.status(200).json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create portal session";
    console.error("[create-portal-session]", message);
    return res.status(500).json({ error: message });
  }
}
