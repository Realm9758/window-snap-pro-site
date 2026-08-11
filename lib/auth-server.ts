import type { NextApiRequest } from "next";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

/**
 * Server-side identity for API routes.
 *
 * The rule this file exists to enforce: an API route must derive the caller's
 * identity from their access token, never from a field in the request body.
 * A route that trusts `body.email` is an open door, because the body is written
 * by whoever is calling — /api/manage/portal used to do exactly that and would
 * hand out a Stripe billing portal for any email address supplied to it.
 */

/**
 * Service-role client. Bypasses RLS, so it must never be handed anything the
 * caller controls without an identity check first.
 *
 * Created per call rather than at module load: a module-level factory throws
 * while the route is being imported when env vars are missing, which Next turns
 * into an HTML 500 page instead of a JSON error the frontend can read.
 */
export function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Resolves the Authorization bearer token to a Supabase user.
 * Returns null for a missing, malformed, expired or revoked token, and for any
 * user without an email, since email is the key every licence lookup uses.
 */
export async function requireUser(req: NextApiRequest): Promise<User | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;

  const { data: { user }, error } = await getServiceClient().auth.getUser(token);
  if (error || !user?.email) return null;

  return user;
}

/** Canonical form for an email used as a lookup or rate-limit key. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Best-effort client IP, for rate-limit keys. */
export function clientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return first?.trim() || req.socket.remoteAddress || "unknown";
}
