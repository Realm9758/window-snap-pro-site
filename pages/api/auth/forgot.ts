import type { NextApiRequest, NextApiResponse } from "next";
import { getServiceClient, normalizeEmail, clientIp } from "../../../lib/auth-server";
import { sendAuthEmail } from "../../../lib/email";
import { checkRateLimit } from "../../../lib/rateLimit";
import { CONTACT_EMAIL, SITE_URL } from "../../../lib/site";

/**
 * POST /api/auth/forgot  { email }
 *
 * There was no way back from a forgotten password. The login form asked for one
 * and offered nothing else, so a buyer who could not remember theirs had no
 * route to their own licence key short of writing to us.
 *
 * Same shape as signup: the link is generated with the admin API and delivered
 * through Resend, so it does not touch Supabase's rate-limited mailer.
 *
 * The response is identical whether or not the address has an account. A reply
 * that changed shape would turn this endpoint into a way of asking "does this
 * person own Redock", which is not a question a stranger gets to ask.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const rawEmail = typeof req.body?.email === "string" ? req.body.email : "";
  const email = normalizeEmail(rawEmail);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      error: "That does not look like an email address. Check it and try again.",
    });
  }

  const perEmail = checkRateLimit(`forgot:email:${email}`, 3, 15 * 60_000);
  const perIp = checkRateLimit(`forgot:ip:${clientIp(req)}`, 8, 15 * 60_000);
  const limited = !perEmail.allowed ? perEmail : !perIp.allowed ? perIp : null;
  if (limited) {
    const minutes = Math.max(1, Math.ceil((limited.resetAt - Date.now()) / 60_000));
    return res.status(429).json({
      error:
        `That is a few attempts in a row. Try again in ${minutes} ` +
        `minute${minutes === 1 ? "" : "s"}, or email ${CONTACT_EMAIL}.`,
    });
  }

  try {
    const { data, error } = await getServiceClient().auth.admin.generateLink({
      type: "recovery",
      email,
    });

    // No account for that address. Logged, not reported: see the note above.
    if (error) {
      console.warn("[forgot] generateLink:", error.status, error.code, error.message);
      return res.status(200).json({ ok: true });
    }

    const hashedToken = data?.properties?.hashed_token;
    if (hashedToken) {
      const link = `${SITE_URL}/confirm?token_hash=${encodeURIComponent(hashedToken)}&type=recovery`;
      await sendAuthEmail("reset", email, link);
    }
  } catch (err) {
    console.error("[forgot] threw:", err);
  }

  return res.status(200).json({ ok: true });
}
