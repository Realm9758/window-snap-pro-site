import type { NextApiRequest, NextApiResponse } from "next";
import { getLicenseByEmail } from "../../../lib/db";
import { sendLicenseEmail } from "../../../lib/email";
import { checkRateLimit } from "../../../lib/rateLimit";
import { requireUser, normalizeEmail } from "../../../lib/auth-server";

/**
 * POST /api/license/resend
 * Requires: Authorization: Bearer <supabase_access_token>
 *
 * Re-sends the caller's own licence key to their own address.
 *
 * This used to accept any email in the body and send to it unauthenticated.
 * That made it a free mailer: the per-email rate limit keyed on the raw string
 * while the lookup trimmed and lowercased, so " Victim@x.com " and
 * "victim@x.com" were one licence but unlimited separate rate-limit buckets.
 * Taking the address from the verified token closes both the bypass and the
 * ability to aim the mail at anyone else.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const user = await requireUser(req);
  if (!user?.email) return res.status(401).json({ error: "Unauthorized" });

  const email = normalizeEmail(user.email);

  // Still rate limited, on the canonical address, so a compromised or
  // scripted session cannot mail-bomb its own owner.
  if (!checkRateLimit(`resend:${email}`, 3, 5 * 60_000).allowed) {
    return res.status(429).json({ error: "Please wait a few minutes before resending." });
  }

  const license = await getLicenseByEmail(email);

  // Same response either way. A signed-in user learns nothing about anyone
  // else, and nothing about whether a purchase exists under another address.
  if (!license) return res.status(200).json({ success: true });

  // A rejected send used to be logged and reported as a success, which left a
  // buyer refreshing an inbox that was never going to receive anything.
  const sent = await sendLicenseEmail(license.email, license.license_key, license.id);
  if (!sent.ok) {
    return res.status(502).json({
      error:
        "We could not send that email just now. Your key is on this page, and " +
        "you can copy it from here.",
    });
  }

  return res.status(200).json({ success: true });
}
