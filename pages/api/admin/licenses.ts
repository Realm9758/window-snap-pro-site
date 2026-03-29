import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../../../lib/db";
import { generateLicenseKey } from "../../../lib/license";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function verifyAdmin(req: NextApiRequest): Promise<string | null> {
  const token = req.headers.authorization?.replace("Bearer ", "").trim();
  if (!token) return null;

  const admin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user?.email) return null;
  if (user.email !== process.env.ADMIN_EMAIL) return null;

  return user.email;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const adminEmail = await verifyAdmin(req);
  if (!adminEmail) return res.status(403).json({ error: "Forbidden" });

  // GET — list all licenses
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("licenses")
      .select("id, license_key, email, product_tier, subscription_status, current_period_end, active, created_at")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ licenses: data });
  }

  // POST — create a license manually
  if (req.method === "POST") {
    const { email, plan, expires_at } = req.body as {
      email?: string;
      plan?: string;
      expires_at?: string;
    };

    const licenseKey = generateLicenseKey();
    const tier = plan === "pro" ? "pro" : "free";

    const { data, error } = await supabase
      .from("licenses")
      .insert([{
        license_key: licenseKey,
        email: email?.trim().toLowerCase() || "",
        product_tier: tier,
        subscription_status: tier === "pro" ? "active" : "free",
        active: true,
        current_period_end: expires_at || null,
        cancel_at_period_end: false,
        activation_count: 0,
        max_activations: 3,
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ license: data });
  }

  // DELETE — remove a license by id
  if (req.method === "DELETE") {
    const { id } = req.query as { id?: string };
    if (!id) return res.status(400).json({ error: "id is required" });

    const { error } = await supabase.from("licenses").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
