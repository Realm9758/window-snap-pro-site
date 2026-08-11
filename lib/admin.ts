import type { NextApiRequest } from "next";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared plumbing for /api/admin/* routes.
 *
 * The client is created lazily. A module-level createClient would throw while
 * the route module loads when env vars are missing, and Next turns that into an
 * HTML 500 page instead of a JSON error the dashboard can show.
 */
export function getAdminClient(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
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
 */
export async function verifyAdmin(req: NextApiRequest): Promise<string | null> {
  const token = req.headers.authorization?.replace("Bearer ", "").trim();
  if (!token) return null;

  const { data: { user }, error } = await getAdminClient().auth.getUser(token);
  if (error || !user?.email) return null;
  if (user.email !== process.env.ADMIN_EMAIL) return null;

  return user.email;
}
