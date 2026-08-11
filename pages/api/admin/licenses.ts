import type { NextApiRequest, NextApiResponse } from "next";
import { generateLicenseKey } from "../../../lib/license";
import { adminEnvError, getAdminClient, verifyAdmin } from "../../../lib/admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const envError = adminEnvError();
    if (envError) return res.status(500).json({ error: envError });

    const adminEmail = await verifyAdmin(req);
    if (!adminEmail) return res.status(403).json({ error: "Forbidden" });

    const db = getAdminClient();

    // GET — one page of licenses, newest first.
    //
    // This used to select every row with no limit and filter in the browser,
    // which is fine at a few hundred licences and a growing liability after
    // that. Searching now happens in the database too, so a search reaches
    // matches beyond whatever the first page happened to contain.
    if (req.method === "GET") {
      const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
      const perPage = Math.min(100, Math.max(1, parseInt(String(req.query.per_page ?? "50"), 10) || 50));
      const search = typeof req.query.q === "string" ? req.query.q.trim() : "";

      let query = db
        .from("licenses")
        .select(
          "id, license_key, email, product_tier, subscription_status, current_period_end, active, created_at, amount_total, currency, activation_count, max_activations",
          { count: "exact" }
        );

      if (search) {
        // Escape the PostgREST or() delimiters: an unescaped comma or paren in
        // the search box would otherwise be parsed as extra filter syntax.
        const safe = search.replace(/[,()]/g, " ");
        query = query.or(
          `license_key.ilike.%${safe}%,email.ilike.%${safe}%,product_tier.ilike.%${safe}%`
        );
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1);

      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({
        licenses: data,
        page,
        perPage,
        total: count ?? 0,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / perPage)),
      });
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

      const { data, error } = await db
        .from("licenses")
        .insert([{
          license_key:         licenseKey,
          email:               email?.trim().toLowerCase() || "",
          product_tier:        tier,
          subscription_status: tier === "pro" ? "active" : "free",
          active:              true,
          current_period_end:  expires_at || null,
          cancel_at_period_end: false,
          activation_count:    0,
          max_activations:     3,
          updated_at:          new Date().toISOString(),
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

      const { error } = await db.from("licenses").delete().eq("id", id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[admin/licenses]", message);
    return res.status(500).json({ error: message });
  }
}
