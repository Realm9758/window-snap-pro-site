import type { NextApiRequest, NextApiResponse } from "next";
import { adminEnvError, getAdminClient, verifyAdmin } from "../../../lib/admin";
import { normalizeEmail } from "../../../lib/auth-server";
import { sendLicenseEmail } from "../../../lib/email";

/**
 * The three things support actually needs to do to a licence.
 *
 * POST /api/admin/customer-action  { email, action }
 *   resend             email the licence key to its owner again
 *   reset_activations  free every device slot
 *   revoke             turn the licence off
 *   reactivate         turn it back on
 *
 * A read-only support page can tell you what is wrong and not fix it, which
 * means every real problem still ends in hand-editing the database.
 *
 * All four act on the licence found by email, never on an id supplied by the
 * caller, so a mistyped request cannot reach a licence the admin was not
 * looking at.
 */

type Action = "resend" | "reset_activations" | "revoke" | "reactivate";

const ACTIONS: Action[] = ["resend", "reset_activations", "revoke", "reactivate"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).end();

    const envError = adminEnvError();
    if (envError) return res.status(500).json({ error: envError });

    const adminEmail = await verifyAdmin(req);
    if (!adminEmail) return res.status(403).json({ error: "Forbidden" });

    const { email, action } = req.body as { email?: string; action?: string };

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email is required" });
    }
    if (!action || !ACTIONS.includes(action as Action)) {
      return res.status(400).json({ error: `action must be one of: ${ACTIONS.join(", ")}` });
    }

    const db = getAdminClient();
    const normalized = normalizeEmail(email);

    const { data: license, error: lookupError } = await db
      .from("licenses")
      .select("id, email, license_key, active, activation_count")
      .eq("email", normalized)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupError) return res.status(500).json({ error: lookupError.message });
    if (!license) return res.status(404).json({ error: "No licence found for that address." });

    switch (action as Action) {
      case "resend": {
        await sendLicenseEmail(license.email, license.license_key);
        console.log(`[admin] ${adminEmail} resent licence to ${license.email}`);
        return res.status(200).json({ ok: true, message: `Licence key sent to ${license.email}.` });
      }

      case "reset_activations": {
        // The fix for the commonest dead end: someone replaced their Mac, the
        // old one still holds a slot, and they cannot activate the new one.
        // Nothing in the app can release a slot from the outside.
        const { error: deleteError } = await db
          .from("license_activations")
          .delete()
          .eq("license_id", license.id);
        if (deleteError) return res.status(500).json({ error: deleteError.message });

        const { error: updateError } = await db
          .from("licenses")
          .update({ activation_count: 0, updated_at: new Date().toISOString() })
          .eq("id", license.id);
        if (updateError) return res.status(500).json({ error: updateError.message });

        console.log(`[admin] ${adminEmail} reset activations for ${license.email}`);
        return res.status(200).json({
          ok: true,
          message: "Activations reset. Every device slot is free.",
        });
      }

      case "revoke":
      case "reactivate": {
        const active = action === "reactivate";
        const { error } = await db
          .from("licenses")
          .update({
            active,
            subscription_status: active ? "active" : "revoked",
            updated_at: new Date().toISOString(),
          })
          .eq("id", license.id);
        if (error) return res.status(500).json({ error: error.message });

        console.log(`[admin] ${adminEmail} ${action}d licence for ${license.email}`);
        return res.status(200).json({
          ok: true,
          message: active ? "Licence reactivated." : "Licence revoked.",
        });
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[admin/customer-action]", message);
    return res.status(500).json({ error: message });
  }
}
