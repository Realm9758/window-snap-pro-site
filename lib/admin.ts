import type { NextApiRequest } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceClient, requireUser } from "./auth-server";

/**
 * Shared plumbing for /api/admin/* routes.
 *
 * Admin is a single address held in ADMIN_EMAIL, compared against the email on
 * a verified Supabase session. It is deliberately not a flag in the database or
 * anything a request can assert about itself.
 */

export function getAdminClient(): SupabaseClient {
  return getServiceClient();
}

/** Returns a JSON error message if required env vars are missing, else null. */
export function adminEnvError(): string | null {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return "Server misconfiguration: missing Supabase env vars.";
  }
  if (!process.env.ADMIN_EMAIL) {
    return "Server misconfiguration: ADMIN_EMAIL not set.";
  }
  return null;
}

/**
 * Resolves the bearer token to a Supabase user and checks it is the admin.
 * Returns the admin email, or null for anything short of that.
 *
 * Fails closed on a blank ADMIN_EMAIL: without that guard an unset variable
 * would make the comparison pass for any user whose email was also blank.
 */
export async function verifyAdmin(req: NextApiRequest): Promise<string | null> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return null;

  const user = await requireUser(req);
  if (!user?.email) return null;
  if (user.email.trim().toLowerCase() !== adminEmail) return null;

  return user.email;
}
