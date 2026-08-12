import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * The one browser-side Supabase client. Uses the anon key, never service role.
 *
 * Singleton on purpose, and it matters more than it looks: two clients built
 * from the same URL share one localStorage key, so both refresh the session on
 * their own timer. Whichever loses the race sends a refresh token the other has
 * already rotated, the auth server answers 400 "Invalid Refresh Token", and the
 * user is signed out mid-task. Every module goes through this function.
 */
let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowser() {
  if (!url || !key) {
    // These are inlined at build time, so empty here means the deployment was
    // built without them. A configuration fault, not something a visitor did:
    // callers catch this and say so rather than blaming the credentials.
    throw new Error(
      "Supabase is not configured: NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY were missing when this site was built."
    );
  }
  if (!client) client = createClient(url, key);
  return client;
}
