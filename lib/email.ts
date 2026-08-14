import { Resend } from "resend";
import { SITE_URL as APP_URL, CONTACT_EMAIL } from "./site";
import { createActivationURL } from "./activation-link";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Who the mail comes from.
 *
 * This was "Redock <onboarding@resend.dev>", Resend's shared sandbox sender,
 * left in place while bhopstudio.com was unverified. The catch nobody sees in
 * testing: the sandbox sender is only allowed to deliver to the address that
 * owns the Resend account. Every licence email to an actual buyer was being
 * refused, and the caller logged the refusal and returned as though it had
 * sent. bhopstudio.com has been verified on Resend since 11 August 2026, so
 * the from address moves onto it and delivery works for everyone.
 *
 * RESEND_FROM overrides it, so changing the sending domain is an environment
 * variable rather than a deploy.
 */
const FROM = process.env.RESEND_FROM ?? "Redock <redock@bhopstudio.com>";

export interface SendResult {
  ok: boolean;
  /** Present when ok is false. Safe to log; not safe to show to a visitor. */
  error?: string;
}

async function send(
  to: string,
  subject: string,
  html: string,
  label: string
): Promise<SendResult> {
  if (!process.env.RESEND_API_KEY) {
    console.error(`[email] ${label}: RESEND_API_KEY is not set`);
    return { ok: false, error: "Email is not configured." };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      reply_to: CONTACT_EMAIL,
      to,
      subject,
      html,
    });
    if (error) {
      console.error(`[email] ${label} error:`, error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    // Resend throws rather than returning on network faults and bad keys.
    console.error(`[email] ${label} threw:`, err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Returns the outcome instead of swallowing it. A caller that cannot tell a
 * delivered email from a rejected one will happily tell a buyer their key is
 * on the way when it never left the building.
 */
export async function sendLicenseEmail(
  email: string,
  licenseKey: string,
  licenseId: string
): Promise<SendResult> {
  const activationURL = createActivationURL(licenseId);
  return send(
    email,
    "Open Redock — your Pro licence is ready",
    buildLicenseEmailHtml(licenseKey, activationURL),
    "sendLicenseEmail"
  );
}

/**
 * Confirmation and password-reset mail, sent by us rather than by Supabase.
 *
 * Supabase's built-in email service is capped at a couple of messages an hour
 * and is documented as being for development only. That cap is what a reviewer
 * hit: two signups failed, the third came back "email rate limit exceeded".
 * The links are generated with the admin API and delivered through the same
 * Resend account as the licence email, which removes the cap entirely.
 */
export async function sendAuthEmail(
  kind: "confirm" | "reset",
  email: string,
  link: string
): Promise<SendResult> {
  const copy =
    kind === "confirm"
      ? {
          subject: "Confirm your Redock account",
          heading: "Confirm your email",
          body: "Click below to activate your Redock account. The link works once and expires in 24 hours.",
          button: "Confirm my email",
          footnote:
            "If you did not create a Redock account, ignore this email and nothing will happen.",
        }
      : {
          subject: "Reset your Redock password",
          heading: "Reset your password",
          body: "Click below to choose a new password. The link works once and expires in one hour.",
          button: "Choose a new password",
          footnote:
            "If you did not ask to reset your password, ignore this email. Your current password still works.",
        };

  return send(
    email,
    copy.subject,
    buildAuthEmailHtml(copy, link),
    `sendAuthEmail:${kind}`
  );
}

function buildAuthEmailHtml(
  copy: { heading: string; body: string; button: string; footnote: string },
  link: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${copy.heading}</title>
</head>
<body style="margin:0;padding:40px 20px;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.08);">

    <div style="background:#1d1d1f;padding:32px 40px;text-align:center;">
      <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0;letter-spacing:-0.3px;">Redock</h1>
    </div>

    <div style="padding:40px;">
      <h2 style="font-size:18px;font-weight:600;color:#1d1d1f;margin:0 0 10px;">${copy.heading}</h2>
      <p style="color:#6e6e73;font-size:14px;line-height:1.65;margin:0 0 28px;">${copy.body}</p>

      <div style="text-align:center;margin-bottom:28px;">
        <a href="${link}" style="display:inline-block;background:#0071E3;color:#fff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:980px;text-decoration:none;">
          ${copy.button}
        </a>
      </div>

      <!-- Some clients strip buttons, and some people will not click one. -->
      <p style="color:#8e8e93;font-size:12px;line-height:1.6;margin:0 0 24px;word-break:break-all;">
        Or paste this into your browser:<br>
        <a href="${link}" style="color:#0071E3;text-decoration:none;">${link}</a>
      </p>

      <div style="border-top:1px solid #e5e5ea;padding-top:20px;">
        <p style="font-size:12px;color:#8e8e93;line-height:1.6;margin:0;">${copy.footnote}</p>
      </div>
    </div>

    <div style="background:#f5f5f7;padding:20px 40px;text-align:center;border-top:1px solid #e5e5ea;">
      <p style="font-size:12px;color:#8e8e93;margin:0;">
        Stuck? Reply to this email or write to
        <a href="mailto:${CONTACT_EMAIL}" style="color:#0071E3;text-decoration:none;">${CONTACT_EMAIL}</a>.
      </p>
      <p style="font-size:12px;color:#aeaeb2;margin:10px 0 0;">
        &copy; ${new Date().getFullYear()} Redock &middot;
        <a href="${APP_URL}/privacy" style="color:#aeaeb2;text-decoration:none;">Privacy</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

function buildLicenseEmailHtml(licenseKey: string, activationURL: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your Redock License</title>
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
      <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;letter-spacing:-0.3px;">Redock</h1>
      <p style="color:rgba(255,255,255,0.45);font-size:14px;margin:6px 0 0;">Purchase confirmed — welcome to Pro</p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <h2 style="font-size:18px;font-weight:600;color:#1d1d1f;margin:0 0 8px;">Buy → Open Redock → Activated</h2>
      <p style="color:#6e6e73;font-size:14px;line-height:1.65;margin:0 0 28px;">
        Thanks for buying Redock Pro. Open Redock with the secure button below and this Mac will activate automatically.
      </p>

      <div style="text-align:center;margin-bottom:32px;">
        <a href="${activationURL}" style="display:inline-block;background:#0071E3;color:#fff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:980px;text-decoration:none;">
          Open Redock and activate
        </a>
        <p style="color:#8e8e93;font-size:12px;line-height:1.5;margin:12px 0 0;">The secure link expires after 30 days.</p>
      </div>

      <!-- The key remains a durable fallback for clients that block app links. -->
      <div style="background:#f5f5f7;border:1.5px solid #e5e5ea;border-radius:14px;padding:24px;text-align:center;margin-bottom:36px;">
        <p style="color:#8e8e93;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 10px;">Fallback licence key</p>
        <p style="font-size:24px;font-weight:700;letter-spacing:3px;color:#1d1d1f;font-family:'SF Mono','Fira Code','Courier New',monospace;margin:0;">${licenseKey}</p>
        <p style="color:#8e8e93;font-size:12px;line-height:1.5;margin:12px 0 0;">If the button is blocked, paste this in Redock → Settings → License.</p>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:36px;">
        <a href="${APP_URL}/download" style="display:inline-block;background:#0071E3;color:#fff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:980px;text-decoration:none;">
          Download Redock first
        </a>
      </div>

      <!-- Manage -->
      <div style="border-top:1px solid #e5e5ea;padding-top:24px;text-align:center;">
        <p style="font-size:13px;color:#8e8e93;margin:0 0 6px;">Need to look up or move your licence?</p>
        <a href="${APP_URL}/manage-license" style="font-size:13px;color:#0071E3;text-decoration:none;font-weight:500;">Manage License →</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f5f5f7;padding:24px 40px;text-align:center;border-top:1px solid #e5e5ea;">
      <p style="font-size:12px;color:#8e8e93;margin:0 0 10px;">
        Any trouble activating, reply to this email or write to
        <a href="mailto:${CONTACT_EMAIL}" style="color:#0071E3;text-decoration:none;">${CONTACT_EMAIL}</a>.
      </p>
      <p style="font-size:12px;color:#aeaeb2;margin:0;">
        &copy; ${new Date().getFullYear()} Redock · All rights reserved<br>
        <a href="${APP_URL}/privacy" style="color:#aeaeb2;text-decoration:none;">Privacy Policy</a>
        &nbsp;·&nbsp;
        <a href="${APP_URL}/manage-license" style="color:#aeaeb2;text-decoration:none;">Manage License</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}
