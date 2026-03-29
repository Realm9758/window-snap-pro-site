import { Resend } from "resend";
import { APP_URL } from "./stripe";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Window Snap Pro <onboarding@resend.dev>";

export async function sendLicenseEmail(email: string, licenseKey: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Your Window Snap Pro License Key",
    html: buildLicenseEmailHtml(licenseKey),
  });
  if (error) {
    console.error("[email] sendLicenseEmail error:", error);
  }
}

function buildLicenseEmailHtml(licenseKey: string): string {
  const steps = [
    "Download Window Snap Pro from our website",
    "Open Window Snap Pro on your Mac",
    "Open Window Snap Pro → Settings",
    'Select the "Pro" tab',
    'Paste your license key and click "Activate Pro"',
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your Window Snap Pro License</title>
</head>
<body style="margin:0;padding:40px 20px;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#1d1d1f;padding:36px 40px;text-align:center;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;background:#0071E3;border-radius:14px;margin-bottom:16px;">
        <svg width="26" height="26" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white"/>
          <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.7"/>
          <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.7"/>
          <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.4"/>
        </svg>
      </div>
      <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;letter-spacing:-0.3px;">Window Snap Pro</h1>
      <p style="color:rgba(255,255,255,0.45);font-size:14px;margin:6px 0 0;">Purchase confirmed — welcome to Pro</p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <h2 style="font-size:18px;font-weight:600;color:#1d1d1f;margin:0 0 8px;">Your License Key</h2>
      <p style="color:#6e6e73;font-size:14px;line-height:1.65;margin:0 0 28px;">
        Thanks for subscribing to Window Snap Pro Pro. Copy the license key below and paste it into the app to unlock all Pro features.
      </p>

      <!-- Key box -->
      <div style="background:#f5f5f7;border:1.5px solid #e5e5ea;border-radius:14px;padding:24px;text-align:center;margin-bottom:36px;">
        <p style="color:#8e8e93;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 10px;">License Key</p>
        <p style="font-size:24px;font-weight:700;letter-spacing:3px;color:#1d1d1f;font-family:'SF Mono','Fira Code','Courier New',monospace;margin:0;">${licenseKey}</p>
      </div>

      <!-- Steps -->
      <h3 style="font-size:15px;font-weight:600;color:#1d1d1f;margin:0 0 16px;">Getting Started</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:36px;">
        ${steps
          .map(
            (step, i) => `
        <tr>
          <td style="width:32px;padding:0 12px 12px 0;vertical-align:top;">
            <div style="width:24px;height:24px;background:#0071E3;border-radius:50%;text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#fff;">${i + 1}</div>
          </td>
          <td style="padding:0 0 12px;vertical-align:middle;">
            <span style="font-size:14px;color:#1d1d1f;line-height:24px;">${step}</span>
          </td>
        </tr>`
          )
          .join("")}
      </table>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:36px;">
        <a href="${APP_URL}/download" style="display:inline-block;background:#0071E3;color:#fff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:980px;text-decoration:none;">
          Download Window Snap Pro
        </a>
      </div>

      <!-- Manage -->
      <div style="border-top:1px solid #e5e5ea;padding-top:24px;text-align:center;">
        <p style="font-size:13px;color:#8e8e93;margin:0 0 6px;">Need to manage your subscription?</p>
        <a href="${APP_URL}/manage-license" style="font-size:13px;color:#0071E3;text-decoration:none;font-weight:500;">Manage License →</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f5f5f7;padding:24px 40px;text-align:center;border-top:1px solid #e5e5ea;">
      <p style="font-size:12px;color:#aeaeb2;margin:0;">
        &copy; ${new Date().getFullYear()} Window Snap Pro · All rights reserved<br>
        <a href="${APP_URL}/privacy" style="color:#aeaeb2;text-decoration:none;">Privacy Policy</a>
        &nbsp;·&nbsp;
        <a href="${APP_URL}/manage-license" style="color:#aeaeb2;text-decoration:none;">Manage License</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}
