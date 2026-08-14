import type { NextApiRequest, NextApiResponse } from "next";
import { getLicenseByEmail } from "../../../lib/db";
import { sendLicenseEmail } from "../../../lib/email";
import { checkRateLimit } from "../../../lib/rateLimit";
import { clientIp, normalizeEmail } from "../../../lib/auth-server";

/**
 * POST /api/license/recover  { email: string }
 *
 * Anonymous licence recovery. Checkout is open to anyone, and most buyers
 * never create an account, so key recovery cannot live behind a login. This
 * works like a password reset: the caller names an address, and the key is
 * sent to that address only. Nothing about the licence ever comes back in
 * the response, so the only person who can read the key is whoever owns the
 * inbox that paid.
 *
 * The response is identical whether or not a licence exists, and identical
 * whether or not the send succeeded; anything else would let a stranger
 * probe which addresses have bought. Delivery failures are logged for the
 * admin instead. /api/license/resend (authenticated, from the token's own
 * address) still exists for the logged-in path, which can afford honest
 * error reporting because the caller already sees their key on the page.
 *
 * Rate limits are keyed on the *normalised* address. The bug that killed
 * the old unauthenticated resend was keying on the raw string, which made
 * " Victim@x.com " and "victim@x.com" one licence but unlimited buckets.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const raw = (req.body as { email?: string })?.email;
  if (typeof raw !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim())) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  const email = normalizeEmail(raw);

  // Per-IP first so one machine cannot spray many addresses, then per-address
  // so many machines cannot bomb one inbox.
  if (
    !checkRateLimit(`recover-ip:${clientIp(req)}`, 5, 10 * 60_000).allowed ||
    !checkRateLimit(`recover:${email}`, 3, 15 * 60_000).allowed
  ) {
    return res.status(429).json({ error: "Too many requests. Please try again in a few minutes." });
  }

  const license = await getLicenseByEmail(email);
  if (license) {
    const sent = await sendLicenseEmail(license.email, license.license_key);
    if (!sent.ok) console.error("[recover] send failed for licence", license.id, sent.error);
  }

  return res.status(200).json({ success: true });
}
