import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface License {
  id: string;
  email: string;
  license_key: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  stripe_checkout_session_id: string | null;
  subscription_status: string;
  product_tier: string;
  created_at: string;
  updated_at: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  last_validated_at: string | null;
  activation_count: number;
  max_activations: number;
  active: boolean;
}

export type LicenseInsert = Omit<License, "id" | "created_at" | "updated_at">;

export interface LicenseActivation {
  id: string;
  license_id: string;
  device_id: string | null;
  device_name: string | null;
  activated_at: string;
  last_seen_at: string;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getLicenseByKey(licenseKey: string): Promise<License | null> {
  const { data } = await supabase
    .from("licenses")
    .select("*")
    .eq("license_key", licenseKey)
    .single();
  return data ?? null;
}

export async function getLicenseByEmail(email: string): Promise<License | null> {
  const { data } = await supabase
    .from("licenses")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return data ?? null;
}

export async function getLicenseBySessionId(sessionId: string): Promise<License | null> {
  const { data } = await supabase
    .from("licenses")
    .select("*")
    .eq("stripe_checkout_session_id", sessionId)
    .single();
  return data ?? null;
}

export async function getLicenseBySubscriptionId(subscriptionId: string): Promise<License | null> {
  const { data } = await supabase
    .from("licenses")
    .select("*")
    .eq("stripe_subscription_id", subscriptionId)
    .single();
  return data ?? null;
}

export async function createLicense(data: Partial<LicenseInsert>): Promise<License | null> {
  const { data: created, error } = await supabase
    .from("licenses")
    .insert([{ ...data, updated_at: new Date().toISOString() }])
    .select()
    .single();
  if (error) {
    console.error("[db] createLicense error:", error);
    return null;
  }
  return created;
}

export async function updateLicense(id: string, updates: Partial<License>): Promise<void> {
  await supabase
    .from("licenses")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function updateLicenseBySubscriptionId(
  subscriptionId: string,
  updates: Partial<License>
): Promise<void> {
  await supabase
    .from("licenses")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscriptionId);
}

// ─── Activations ─────────────────────────────────────────────────────────────

export async function getActivationByDevice(
  licenseId: string,
  deviceId: string
): Promise<LicenseActivation | null> {
  const { data } = await supabase
    .from("license_activations")
    .select("*")
    .eq("license_id", licenseId)
    .eq("device_id", deviceId)
    .single();
  return data ?? null;
}

export async function upsertActivation(
  licenseId: string,
  deviceId: string,
  deviceName: string
): Promise<void> {
  const now = new Date().toISOString();
  const existing = await getActivationByDevice(licenseId, deviceId);

  if (existing) {
    await supabase
      .from("license_activations")
      .update({ last_seen_at: now, device_name: deviceName })
      .eq("id", existing.id);
  } else {
    await supabase.from("license_activations").insert([
      { license_id: licenseId, device_id: deviceId, device_name: deviceName, last_seen_at: now },
    ]);
    // Increment activation count
    await supabase.rpc("increment_activation_count", { license_id_param: licenseId });
  }

  // Update last_validated_at on the license
  await supabase
    .from("licenses")
    .update({ last_validated_at: now, updated_at: now })
    .eq("id", licenseId);
}
