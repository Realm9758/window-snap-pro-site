import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signup abuse checks.
 *
 * What prompted this. Six signups over 15 and 16 August 2026, four of them
 * shaped like cam.p.a.m.8.7.12@gmail.com, th.u.tch.ison.40@gmail.com and
 * h.ea.t.h.e.rw.o.lf.1.5@gmail.com. Not one was ever confirmed. Gmail ignores
 * dots in the local part, so each of those delivers to a plain inbox that
 * belongs to someone else: campam8712@gmail.com and so on. The script was not
 * trying to get accounts. It was using our form to post confirmation mail to
 * strangers, which is list bombing, and every message spent goes against the
 * sending reputation of the domain that also carries licence keys.
 *
 * Three independent checks, cheapest first, because each one catches a
 * different class of caller:
 *
 *   1. Form token. A signed timestamp handed out when the page renders. A
 *      script posting straight at /api/auth/signup has never loaded the page,
 *      so it has nothing to send. This is the check that stops the bulk of it.
 *   2. Honeypot and fill time. Catches a bot that does drive a real browser
 *      but fills every field it finds and submits at machine speed.
 *   3. Dotted Gmail. Catches the specific pattern above even if the first two
 *      are somehow satisfied.
 *
 * None of these needs a third-party service or a new account. If the volume
 * grows past what they hold, the next step is Cloudflare Turnstile, which is
 * free and drops in at the same two call sites.
 */

/** How fast a real person could fill three fields. Under this is a script. */
const MINIMUM_FILL_MS = 2_500;

/** A signup page left open in a tab is still good this long. */
const TOKEN_LIFETIME_MS = 2 * 60 * 60 * 1_000;

/**
 * Keyed on the service role key when nothing more specific is set. That key is
 * server-only and already mandatory for signup to work at all, so this adds no
 * new deployment step. Set SIGNUP_FORM_SECRET if you would rather the two
 * rotate separately.
 */
function formSecret(): string {
  return process.env.SIGNUP_FORM_SECRET
    ?? process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? "";
}

function sign(issuedAt: number, secret: string): string {
  return createHmac("sha256", secret).update(`signup:${issuedAt}`).digest("hex");
}

/**
 * Issued by getServerSideProps on /signup and posted back with the form.
 * Returns an empty string when there is no secret to sign with, which the
 * verifier reads as "not configured" and lets through rather than locking
 * every visitor out of a half-configured deployment.
 */
export function issueFormToken(now = Date.now()): string {
  const secret = formSecret();
  if (!secret) return "";
  return `${now}.${sign(now, secret)}`;
}

export type GuardVerdict = { ok: true } | { ok: false; code: string; message: string };

const PASS: GuardVerdict = { ok: true };

/**
 * A refusal a person can act on. Bots do not read these, so the only audience
 * is the rare legitimate visitor who trips a check, and they need to know
 * which move gets them past it.
 */
function refuse(code: string, message: string): GuardVerdict {
  return { ok: false, code, message };
}

function verifyFormToken(token: string, now: number): GuardVerdict {
  const secret = formSecret();
  if (!secret) return PASS;

  const [issuedRaw, provided] = token.split(".");
  const issuedAt = Number(issuedRaw);
  if (!issuedRaw || !provided || !Number.isFinite(issuedAt)) {
    return refuse(
      "stale_form",
      "This form was not loaded properly. Reload the page and try again.",
    );
  }

  const expected = sign(issuedAt, secret);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return refuse(
      "stale_form",
      "This form was not loaded properly. Reload the page and try again.",
    );
  }

  const age = now - issuedAt;
  if (age > TOKEN_LIFETIME_MS) {
    return refuse(
      "stale_form",
      "This page has been open a while. Reload it and try again.",
    );
  }
  // Clock skew between the rendering and receiving instances can make a fresh
  // token look slightly future-dated. Only a wildly negative age is a forgery.
  if (age < -60_000) {
    return refuse(
      "stale_form",
      "This form was not loaded properly. Reload the page and try again.",
    );
  }
  if (age < MINIMUM_FILL_MS) {
    return refuse(
      "too_fast",
      "That was submitted faster than the form can be filled in. Try again.",
    );
  }

  return PASS;
}

/**
 * True when a Gmail local part is dotted in a way no one types about
 * themselves. Gmail delivers cam.p.a.m.8.7.12@ and campam8712@ to the same
 * inbox, so refusing the dotted spelling costs a real owner nothing: they
 * retype it without the dots and arrive in the same place. That is what makes
 * this safe to enforce, and it is why the message below says so.
 *
 * Calibrated against the addresses actually seen. wesley.weems@ and
 * rafael.henning@ carry one dot. first.m.last@, a middle initial, carries two
 * with a single one-character run. The abusive four carried four, five, six
 * and nine.
 */
function dottedGmail(local: string, domain: string): boolean {
  if (domain !== "gmail.com" && domain !== "googlemail.com") return false;

  const dots = (local.match(/\./g) ?? []).length;
  if (dots >= 3) return true;

  const shortRuns = local.split(".").filter((part) => part.length === 1).length;
  return dots >= 2 && shortRuns >= 2;
}

/**
 * Throwaway inbox providers. Deliberately short: this list is a speed bump for
 * the laziest case, not a wall, and a long one goes stale and starts refusing
 * real people. The form token above is what does the real work.
 */
const THROWAWAY_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
  "temp-mail.org", "throwawaymail.com", "yopmail.com", "trashmail.com",
  "sharklasers.com", "getnada.com", "dispostable.com", "maildrop.cc",
]);

export interface SignupAttempt {
  email: string;
  /** Hidden field. Empty when a person filled the form, set when a bot did. */
  honeypot?: unknown;
  /** Signed timestamp issued when the page rendered. */
  formToken?: unknown;
}

/**
 * The whole gate. Runs before the account is created and before any mail goes
 * out, because sending is the thing being abused.
 */
export function inspectSignup(attempt: SignupAttempt, now = Date.now()): GuardVerdict {
  // A person never sees this field, so anything in it settles the question.
  if (typeof attempt.honeypot === "string" && attempt.honeypot.trim() !== "") {
    return refuse("rejected", "That signup was not accepted.");
  }

  const token = typeof attempt.formToken === "string" ? attempt.formToken : "";
  const tokenVerdict = verifyFormToken(token, now);
  if (!tokenVerdict.ok) return tokenVerdict;

  const at = attempt.email.lastIndexOf("@");
  if (at < 1) return PASS; // Shape is the caller's job; it already checked.
  const local = attempt.email.slice(0, at);
  const domain = attempt.email.slice(at + 1);

  if (THROWAWAY_DOMAINS.has(domain)) {
    return refuse(
      "email_invalid",
      "That looks like a disposable address. Use an inbox you can still open " +
        "when your licence key needs to reach you.",
    );
  }

  if (dottedGmail(local, domain)) {
    return refuse(
      "email_invalid",
      "Gmail ignores dots, so that address and the same one without them are " +
        "the same inbox. Type it without the dots and try again.",
    );
  }

  return PASS;
}

/**
 * One key per inbox rather than per spelling. Gmail ignores dots and every
 * major provider ignores a +tag, so a.b+x@gmail.com and ab@gmail.com must
 * share a rate-limit allowance or the limit counts spellings, not people.
 *
 * For lookups only. Never store this or mail it: the address the person typed
 * is the one that belongs to them.
 */
export function inboxKey(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 1) return email;

  let local = email.slice(0, at);
  const domain = email.slice(at + 1);

  const plus = local.indexOf("+");
  if (plus > 0) local = local.slice(0, plus);
  if (domain === "gmail.com" || domain === "googlemail.com") {
    local = local.replace(/\./g, "");
  }
  return `${local}@${domain}`;
}
