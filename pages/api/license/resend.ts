import type { NextApiRequest, NextApiResponse } from "next";
import { getLicenseByEmail } from "../../../lib/db";
import { sendLicenseEmail } from "../../../lib/email";
import { checkRateLimit } from "../../../lib/rateLimit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body as { email?: string };
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required." });
  }

  // Rate limit: 3 resend requests per 5 minutes per email
  const rl = checkRateLimit(`resend:${email.toLowerCase()}`, 3, 5 * 60_000);
  if (!rl.allowed) {
    return res.status(429).json({ error: "Please wait a few minutes before resending." });
  }

  const license = await getLicenseByEmail(email);

  // Always respond with success to prevent email enumeration
  if (!license) {
    return res.status(200).json({ success: true });
  }

  await sendLicenseEmail(license.email, license.license_key);

  return res.status(200).json({ success: true });
}
