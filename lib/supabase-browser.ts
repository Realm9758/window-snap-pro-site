import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton — safe to import on the client side (uses anon key, never service role).
let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowser() {
  if (!client) client = createClient(url, key);
  return client;
}
