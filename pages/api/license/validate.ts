import type { NextApiRequest, NextApiResponse } from "next";
import { getLicenseByKey, upsertActivation } from "../../../lib/db";
import { normalizeLicenseKey, isValidLicenseKeyFormat } from "../../../lib/license";
import { checkRateLimit } from "../../../lib/rateLimit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  // Rate limit: 20 requests / minute per IP
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.socket.remoteAddress ?? "unknown";
  const rl = checkRateLimit(`validate:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return res.status(429).json({
      valid: false,
      status: "rate_limited",
      message: "Too many requests. Please try again shortly.",
    });
  }

  // app_version and os_version are optional and always will be: every build
  // shipped before they existed omits them, and those licence checks must keep
  // working exactly as they did.
  const { license_key, device_id, device_name, app_version, os_version } = req.body as {
    license_key?: string;
    device_id?: string;
    device_name?: string;
    app_version?: string;
    os_version?: string;
  };

  // Short, bounded strings only. These are displayed in the admin dashboard and
  // grouped on, so a long or odd value is worth dropping rather than storing.
  const clean = (v: unknown): string | null =>
    typeof v === "string" && /^[\w. ()-]{1,32}$/.test(v.trim()) ? v.trim() : null;

  // Normalise and validate format
  const normalized = normalizeLicenseKey(license_key ?? "");
  if (!isValidLicenseKeyFormat(normalized)) {
    return res.status(422).json({
      valid: false,
      status: "invalid_format",
      message: "Invalid license key format. Keys look like WSP-XXXX-XXXX-XXXX.",
    });
  }

  const license = await getLicenseByKey(normalized);

  if (!license) {
    return res.status(404).json({
      valid: false,
      status: "not_found",
      message: "This license key could not be verified. Please check and try again.",
    });
  }

  if (!license.active || !["active", "trialing"].includes(license.subscription_status)) {
    return res.status(402).json({
      valid: false,
      status: license.subscription_status ?? "inactive",
      // Redock is a one-time purchase now; "subscription" in these messages
      // read as a bait-and-switch to lifetime buyers. The statuses themselves
      // stay, since legacy subscription-era licences still resolve here.
      message:
        license.subscription_status === "past_due"
          ? "The payment for this licence didn't go through. Please update your payment method."
          : license.subscription_status === "canceled"
          ? "This licence has been cancelled."
          : "This licence is not active. Visit the Manage License page for details.",
    });
  }

  // Track device activation if device_id provided
  if (device_id) {
    const { activation_count, max_activations, id: licenseId } = license;

    // Check if this device already activated
    const { getActivationByDevice } = await import("../../../lib/db");
    const existingActivation = await getActivationByDevice(licenseId, device_id);

    if (!existingActivation && activation_count >= max_activations) {
      return res.status(403).json({
        valid: false,
        status: "max_activations",
        message: `This license is activated on the maximum number of devices (${max_activations}). Deactivate a device to continue.`,
      });
    }

    await upsertActivation(licenseId, device_id, device_name ?? "Unknown Mac", {
      appVersion: clean(app_version),
      osVersion:  clean(os_version),
    });
  }

  return res.status(200).json({
    valid: true,
    plan: license.product_tier,
    status: license.subscription_status,
    expires_at: license.current_period_end,
    max_activations: license.max_activations,
    activation_count: license.activation_count,
  });
}
