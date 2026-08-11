#!/usr/bin/env node
/**
 * Backfill `amount_total` and `currency` on licences bought before the webhook
 * started recording them.
 *
 * Revenue in the dashboard is summed from the licences table, so every row
 * predating that column reads as a £0 sale. This walks the existing rows, asks
 * Stripe what each one actually cost, and writes it back.
 *
 * Safe to run repeatedly:
 *   - It only reads from Stripe. Nothing is created, changed or refunded there.
 *   - It skips any licence that already has an amount, so a second run is a
 *     no-op over everything the first run fixed.
 *   - --dry-run prints what it would write and touches nothing.
 *
 * Usage, from the site directory:
 *   node scripts/backfill-stripe-amounts.mjs --dry-run
 *   node scripts/backfill-stripe-amounts.mjs
 */

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { readFileSync } from "node:fs";

// .env.local is not loaded automatically outside Next, so parse it here rather
// than requiring the caller to export four variables by hand.
function loadEnvLocal() {
  try {
    for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // Fine: the variables may already be in the environment.
  }
}

loadEnvLocal();

const DRY_RUN = process.argv.includes("--dry-run");

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY) {
  console.error("Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or STRIPE_SECRET_KEY.");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

/**
 * What a licence cost, from whichever Stripe object still knows.
 *
 * The checkout session is the best answer because it records the amount after
 * any promotion code. Sessions expire from the API after roughly 30 days
 * though, so older licences fall back to the customer's payment history.
 */
async function findAmount(license) {
  if (license.stripe_checkout_session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(license.stripe_checkout_session_id);
      if (session?.amount_total != null) {
        return { amount: session.amount_total, currency: session.currency, via: "session" };
      }
    } catch {
      // Expired or unknown session. Fall through.
    }
  }

  if (license.stripe_customer_id) {
    try {
      const charges = await stripe.charges.list({ customer: license.stripe_customer_id, limit: 10 });
      // Newest successful charge that was not fully refunded.
      const charge = charges.data.find((c) => c.paid && c.status === "succeeded");
      if (charge) {
        return { amount: charge.amount, currency: charge.currency, via: "charge" };
      }
    } catch {
      // Fall through.
    }
  }

  return null;
}

const { data: licenses, error } = await db
  .from("licenses")
  .select("id, email, license_key, stripe_checkout_session_id, stripe_customer_id, amount_total")
  .is("amount_total", null)
  .order("created_at", { ascending: true });

if (error) {
  console.error("Could not read licences:", error.message);
  process.exit(1);
}

if (!licenses.length) {
  console.log("Nothing to do: every licence already has an amount.");
  process.exit(0);
}

console.log(`${licenses.length} licence(s) without an amount.${DRY_RUN ? "  [dry run]" : ""}\n`);

let written = 0;
let skipped = 0;

for (const license of licenses) {
  const found = await findAmount(license);

  if (!found) {
    // Expected for manually issued licences, which never had a payment.
    console.log(`  skip   ${license.license_key}  ${license.email || "(no email)"}  no Stripe record`);
    skipped++;
    continue;
  }

  const pretty = `${(found.amount / 100).toFixed(2)} ${found.currency.toUpperCase()}`;
  console.log(`  ${DRY_RUN ? "would " : "write "} ${license.license_key}  ${pretty}  (via ${found.via})`);

  if (!DRY_RUN) {
    const { error: updateError } = await db
      .from("licenses")
      .update({ amount_total: found.amount, currency: found.currency })
      .eq("id", license.id);

    if (updateError) {
      console.error(`         failed: ${updateError.message}`);
      continue;
    }
  }
  written++;
}

console.log(
  `\n${DRY_RUN ? "Would write" : "Wrote"} ${written}, skipped ${skipped} with no Stripe record.`
);
if (DRY_RUN) console.log("Re-run without --dry-run to apply.");
