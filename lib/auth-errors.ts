import type { AuthError } from "@supabase/supabase-js";
import { CONTACT_EMAIL } from "./site";

/**
 * Plain-English text for a failed Supabase auth call.
 *
 * Worth knowing before changing anything here: a wrong password answers with
 * HTTP 400 and the body "Invalid login credentials". That 400 is the correct,
 * documented response to bad credentials, not a fault in this site. What was
 * wrong is that the raw string went straight to the screen, so a mistyped
 * password read like a broken system and named no way forward.
 *
 * Three failures look identical to someone staring at the form, and they need
 * different instructions:
 *
 *   - wrong email or password        (400 invalid_credentials)
 *   - account never confirmed        (400 email_not_confirmed)
 *   - the deployment has no Supabase keys, or the network dropped
 *
 * The last one is ours, not theirs, so it says so and gives an address. Someone
 * who has paid and cannot reach their licence must never be left guessing.
 *
 * Matching is on `code` first. Message strings are not a stable API and have
 * been reworded across GoTrue releases; `status` is the fallback.
 */
export function authErrorMessage(err: unknown, form: "login" | "signup"): string {
  const configOrNetwork =
    `Sign-in is unavailable right now, and this one is on us rather than ` +
    `anything you typed. Try again in a moment. If it keeps failing, email ` +
    `${CONTACT_EMAIL} and we will sort out your licence directly.`;

  // Thrown, not returned: missing env vars, or fetch rejecting outright.
  if (!isAuthError(err)) return configOrNetwork;

  // supabase-js retries these itself before giving up, so arriving here means
  // the request never reached the auth server.
  if (err.name === "AuthRetryableFetchError" || !err.status || err.status >= 500) {
    return configOrNetwork;
  }

  switch (err.code) {
    case "invalid_credentials":
      return "That email and password do not match an account. Check both and try again.";

    case "email_not_confirmed":
      return (
        "This account has not been confirmed yet. Open the confirmation link " +
        "in the email we sent when the account was created, then log in."
      );

    case "user_already_exists":
    case "email_exists":
      return "An account with that email already exists. Log in instead.";

    case "weak_password":
      return "Pick a longer password: at least 8 characters.";

    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts in a row. Wait a minute, then try again.";

    case "user_banned":
      return `This account is locked. Email ${CONTACT_EMAIL} and we will look into it.`;

    case "signup_disabled":
      return `New accounts are closed at the moment. Email ${CONTACT_EMAIL} if you need one.`;

    case "validation_failed":
      return "Check the email address: that one is not a valid address.";
  }

  // 429 without a code, and anything else the auth server rejects on its own
  // terms. Falls back to the shape of the form so the wording still fits.
  if (err.status === 429) return "Too many attempts in a row. Wait a minute, then try again.";

  return form === "login"
    ? "Could not log you in. Check your email and password, then try again."
    : "Could not create the account. Check the details and try again.";
}

function isAuthError(err: unknown): err is AuthError {
  return (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    ("status" in err || "code" in err || "name" in err)
  );
}
