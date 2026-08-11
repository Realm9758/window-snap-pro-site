import type { NextApiRequest, NextApiResponse } from "next";
import { adminEnvError, getAdminClient, verifyAdmin } from "../../../lib/admin";
import { normalizeEmail } from "../../../lib/auth-server";

/**
 * Everything known about one person, for answering a support email.
 *
 * GET /api/admin/customer?q=someone@example.com   full detail for one address
 * GET /api/admin/customer?q=some&list=1           matching addresses, for search
 *
 * The pieces live in three places: the account in Supabase Auth, the licence
 * and its devices in Postgres, and the payment in Stripe. Answering "what is
 * going on with this person" meant opening all three by hand.
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") return res.status(405).end();

    const envError = adminEnvError();
    if (envError) return res.status(500).json({ error: envError });

    const adminEmail = await verifyAdmin(req);
    if (!adminEmail) return res.status(403).json({ error: "Forbidden" });

    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q) return res.status(400).json({ error: "A search term is required." });

    const db = getAdminClient();

    // ── Search mode: just the matching addresses ──────────────────────────
    if (req.query.list === "1") {
      const safe = q.replace(/[,()]/g, " ");
      const { data, error } = await db
        .from("licenses")
        .select("email, license_key, product_tier, active, created_at")
        .or(`email.ilike.%${safe}%,license_key.ilike.%${safe}%`)
        .order("created_at", { ascending: false })
        .limit(25);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ results: data ?? [] });
    }

    // ── Detail mode ───────────────────────────────────────────────────────
    const email = normalizeEmail(q);

    // Newest licence wins if somebody bought twice under one address.
    const { data: license } = await db
      .from("licenses")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Auth has no lookup-by-email, so this pages until it finds a match.
    // Bounded at 10 pages for the same reason the stats endpoint is: a cap
    // that cannot be reached in practice is still better than an open loop.
    let account: { id: string; email: string; created_at: string; last_sign_in_at: string | null } | null = null;
    for (let page = 1; page <= 10 && !account; page++) {
      const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) break;
      const match = data.users.find((u) => u.email?.toLowerCase() === email);
      if (match) {
        account = {
          id: match.id,
          email: match.email ?? email,
          created_at: match.created_at,
          last_sign_in_at: match.last_sign_in_at ?? null,
        };
      }
      if (data.users.length < 1000) break;
    }

    let devices: unknown[] = [];
    if (license) {
      const { data } = await db
        .from("license_activations")
        .select("id, device_id, device_name, activated_at, last_seen_at, app_version, os_version")
        .eq("license_id", license.id)
        .order("last_seen_at", { ascending: false });
      devices = data ?? [];
    }

    if (!license && !account) {
      return res.status(404).json({ found: false, email });
    }

    return res.status(200).json({
      found: true,
      email,
      account,
      license,
      devices,
      // Deep link rather than an embedded Stripe call: the dashboard is the
      // right place to act on a payment, and pulling the charge in here would
      // add a slow request for something rarely needed.
      stripeUrl: license?.stripe_customer_id
        ? `https://dashboard.stripe.com/customers/${license.stripe_customer_id}`
        : null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[admin/customer]", message);
    return res.status(500).json({ error: message });
  }
}
