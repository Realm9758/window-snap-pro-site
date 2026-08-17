import type { NextApiRequest, NextApiResponse } from "next";
import { getServiceClient, normalizeEmail, clientIp } from "../../../lib/auth-server";
import { sendAuthEmail } from "../../../lib/email";
import { checkRateLimit } from "../../../lib/rateLimit";
import { inboxKey, inspectSignup } from "../../../lib/signupGuard";
import { CONTACT_EMAIL, SITE_URL } from "../../../lib/site";

/**
 * POST /api/auth/signup  { email, password }
 *
 * Creates the account and sends the confirmation email ourselves.
 *
 * The browser used to call supabase.auth.signUp directly, which made Supabase's
 * built-in email service responsible for delivering the confirmation. That
 * service is capped at a couple of messages an hour and Supabase documents it
 * as development-only. The auth logs for 13 August 2026 show exactly what that
 * looks like from the outside: two signups rejected, then
 * "429: email rate limit exceeded". Nothing about the form told anyone that the
 * failure was a mail quota rather than something they had typed.
 *
 * generateLink does not send anything. It returns a token, which we put in an
 * email through the same Resend account that carries licence keys, so the cap
 * is gone and the message is ours to write.
 *
 * The link points at our own /confirm page rather than Supabase's verify
 * endpoint, so it does not depend on the redirect allow-list in the Supabase
 * dashboard matching this site's basePath. One less remote setting to drift.
 */

interface Failure {
  status: number;
  code: string;
  message: string;
}

const GENERIC_FAULT: Failure = {
  status: 502,
  code: "unavailable",
  message:
    `We could not create the account just now, and this one is on us rather ` +
    `than anything you typed. Try again in a moment, or email ${CONTACT_EMAIL}.`,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const rawEmail = typeof req.body?.email === "string" ? req.body.email : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const email = normalizeEmail(rawEmail);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail(res, {
      status: 400,
      code: "email_invalid",
      message: "That does not look like an email address. Check it and try again.",
    });
  }
  if (password.length < 8) {
    return fail(res, {
      status: 400,
      code: "weak_password",
      message: "Pick a longer password: at least 8 characters.",
    });
  }

  // Bot checks come before the rate limiter and well before generateLink,
  // because the thing being abused is the sending of mail, and a refusal here
  // costs nothing to issue. See lib/signupGuard.ts for what each check is for.
  const verdict = inspectSignup({
    email,
    honeypot: req.body?.website,
    formToken: req.body?.formToken,
  });
  if (!verdict.ok) {
    return fail(res, { status: 400, code: verdict.code, message: verdict.message });
  }

  // Two buckets. The email one stops someone being mailed repeatedly by
  // whoever knows their address; the IP one stops a script working through a
  // list. The email bucket is keyed on the inbox rather than the spelling:
  // " A@x.com ", "a@x.com" and "a+test@x.com" are one inbox and must not be
  // three allowances.
  const perEmail = checkRateLimit(`signup:email:${inboxKey(email)}`, 3, 15 * 60_000);
  const perIp = checkRateLimit(`signup:ip:${clientIp(req)}`, 8, 15 * 60_000);
  const limited = !perEmail.allowed ? perEmail : !perIp.allowed ? perIp : null;
  if (limited) {
    const minutes = Math.max(1, Math.ceil((limited.resetAt - Date.now()) / 60_000));
    return fail(res, {
      status: 429,
      code: "rate_limited",
      message:
        `That is a few attempts in a row. Try again in ${minutes} ` +
        `minute${minutes === 1 ? "" : "s"}, or email ${CONTACT_EMAIL} and we ` +
        `will sort your licence out directly.`,
    });
  }

  let hashedToken: string;
  try {
    const { data, error } = await getServiceClient().auth.admin.generateLink({
      type: "signup",
      email,
      password,
    });

    if (error) return fail(res, translate(error));

    hashedToken = data?.properties?.hashed_token ?? "";
    if (!hashedToken) {
      console.error("[signup] generateLink returned no hashed_token");
      return fail(res, GENERIC_FAULT);
    }
  } catch (err) {
    console.error("[signup] generateLink threw:", err);
    return fail(res, GENERIC_FAULT);
  }

  const link = `${SITE_URL}/confirm?token_hash=${encodeURIComponent(hashedToken)}&type=signup`;
  const sent = await sendAuthEmail("confirm", email, link);

  if (!sent.ok) {
    return fail(res, {
      status: 502,
      code: "email_failed",
      message:
        `The account exists but the confirmation email would not send. Email ` +
        `${CONTACT_EMAIL} and we will confirm it by hand.`,
    });
  }

  return res.status(200).json({ ok: true });
}

/** Supabase admin errors, in words that name what to do next. */
function translate(error: { code?: string; status?: number; message?: string }): Failure {
  switch (error.code) {
    case "email_exists":
    case "user_already_exists":
      return {
        status: 409,
        code: "email_exists",
        message: "An account with that email already exists. Log in instead.",
      };

    /*
      The one that read as "unknown reason" to a reviewer. Supabase rejects
      addresses it considers undeliverable, and test@gmail.com is one of them.
      The old client-side mapper had no case for it, so it fell through to
      "Could not create the account. Check the details and try again." — which
      is true, useless, and looks like the site is broken.
    */
    case "email_address_invalid":
    case "validation_failed":
      return {
        status: 400,
        code: "email_invalid",
        message:
          "That address was rejected as undeliverable. Use an inbox you can " +
          "actually open, then try again.",
      };

    case "weak_password":
      return {
        status: 400,
        code: "weak_password",
        message: "Pick a longer password: at least 8 characters.",
      };

    case "signup_disabled":
      return {
        status: 403,
        code: "signup_disabled",
        message: `New accounts are closed at the moment. Email ${CONTACT_EMAIL} if you need one.`,
      };

    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return {
        status: 429,
        code: "rate_limited",
        message: "Too many attempts in a row. Wait a minute, then try again.",
      };
  }

  console.error("[signup] unmapped auth error:", error.status, error.code, error.message);
  return GENERIC_FAULT;
}

function fail(res: NextApiResponse, f: Failure) {
  return res.status(f.status).json({ error: f.message, code: f.code });
}
