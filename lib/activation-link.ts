import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_VERSION = 1;
const DEFAULT_LIFETIME_SECONDS = 30 * 24 * 60 * 60;

interface ActivationPayload {
  v: number;
  licenseId: string;
  exp: number;
}

function signingSecret(): string {
  const secret =
    process.env.ACTIVATION_LINK_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) throw new Error("Activation-link signing secret is not configured");
  return secret;
}

function signature(body: string): string {
  return createHmac("sha256", signingSecret()).update(body).digest("base64url");
}

/**
 * Creates a bearer token containing only the database id of the licence. The
 * licence key never appears in a URL, analytics log, email-link scanner, or
 * browser history. Tokens expire, and every redemption still goes through the
 * app's normal activation-limit validation.
 */
export function createActivationToken(
  licenseId: string,
  lifetimeSeconds = DEFAULT_LIFETIME_SECONDS
): string {
  const payload: ActivationPayload = {
    v: TOKEN_VERSION,
    licenseId,
    exp: Math.floor(Date.now() / 1000) + lifetimeSeconds,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${signature(body)}`;
}

export function createActivationURL(licenseId: string): string {
  return `redock://activate?token=${encodeURIComponent(createActivationToken(licenseId))}`;
}

export function verifyActivationToken(token: string): ActivationPayload | null {
  const [body, suppliedSignature, extra] = token.split(".");
  if (!body || !suppliedSignature || extra) return null;

  const expected = Buffer.from(signature(body));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as ActivationPayload;
    if (
      payload.v !== TOKEN_VERSION ||
      typeof payload.licenseId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(payload.licenseId) ||
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
