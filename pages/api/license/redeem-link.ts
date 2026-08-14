import type { NextApiRequest, NextApiResponse } from "next";
import { verifyActivationToken } from "../../../lib/activation-link";
import { clientIp } from "../../../lib/auth-server";
import { getLicenseById } from "../../../lib/db";
import { checkRateLimit } from "../../../lib/rateLimit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  if (!checkRateLimit(`redeem-link:${clientIp(req)}`, 12, 60_000).allowed) {
    return res.status(429).json({
      status: "rate_limited",
      error: "Too many activation attempts. Please try again shortly.",
    });
  }

  const token = (req.body as { token?: unknown })?.token;
  if (typeof token !== "string" || token.length < 40 || token.length > 2048) {
    return res.status(400).json({
      status: "invalid_link",
      error: "This activation link is invalid.",
    });
  }

  const payload = verifyActivationToken(token);
  if (!payload) {
    return res.status(400).json({
      status: "invalid_link",
      error: "This activation link is invalid or has expired. Use your licence key instead.",
    });
  }

  const license = await getLicenseById(payload.licenseId);
  if (
    !license ||
    !license.active ||
    !["active", "trialing"].includes(license.subscription_status)
  ) {
    return res.status(403).json({
      status: license?.subscription_status ?? "not_found",
      error: "This licence is no longer active.",
    });
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ license_key: license.license_key });
}
