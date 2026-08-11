import type { NextApiRequest, NextApiResponse } from "next";
import type { IncomingMessage } from "http";
import type Stripe from "stripe";
import { stripe } from "../../lib/stripe";
import {
  createLicense,
  getLicenseByCustomerId,
  getLicenseBySessionId,
  getLicenseBySubscriptionId,
  updateLicense,
  updateLicenseBySubscriptionId,
} from "../../lib/db";
import { generateLicenseKey } from "../../lib/license";
import { sendLicenseEmail } from "../../lib/email";

// Disable body parsing — Stripe needs the raw body for signature verification
export const config = { api: { bodyParser: false } };

/**
 * The endpoint is public — the signature is checked after the body is read, so
 * anyone can make this function buffer bytes. Without a ceiling a single
 * request can stream until the instance runs out of memory. Real Stripe events
 * are a few KB; 1 MB is far above the largest and far below dangerous.
 */
const MAX_BODY_BYTES = 1_048_576;

async function getRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error("[webhook] signature error:", msg);
    return res.status(400).send(`Webhook Error: ${msg}`);
  }

  try {
    switch (event.type) {
      // ── Checkout completed → create license + send email ──────────────────
      //
      // Handles BOTH modes. `payment` is the current one-time £19 licence;
      // `subscription` is kept so historical subscribers still resolve. The old
      // code bailed out unless mode was "subscription", which meant a one-time
      // checkout completed, took the money, and never issued a key.
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "payment" && session.mode !== "subscription") break;

        // A one-time payment can complete as unpaid (e.g. delayed methods).
        if (session.payment_status === "unpaid") {
          console.warn("[webhook] session unpaid, skipping:", session.id);
          break;
        }

        // Stripe retries on any non-2xx and can deliver duplicates. Without this
        // guard a retry either creates a second licence or trips the UNIQUE
        // constraint and silently sends no email.
        const existing = await getLicenseBySessionId(session.id);
        if (existing) {
          console.log("[webhook] session already provisioned:", session.id);
          break;
        }

        const email = session.customer_details?.email ?? (session.customer_email as string);
        if (!email) {
          console.error("[webhook] No email found on session", session.id);
          break;
        }

        const isLifetime = session.mode === "payment";
        const licenseKey = generateLicenseKey();

        const created = await createLicense({
          email: email.toLowerCase().trim(),
          license_key: licenseKey,
          stripe_customer_id: (session.customer as string) ?? null,
          // Null for lifetime. The column is UNIQUE, but Postgres permits many
          // NULLs, so every lifetime licence coexists happily.
          stripe_subscription_id: isLifetime ? null : (session.subscription as string),
          stripe_price_id: await priceIdFromSession(session),
          stripe_checkout_session_id: session.id,
          // The macOS app treats "active" (or "trialing") plus active=true as a
          // valid licence; lifetime simply never leaves that state.
          subscription_status: "active",
          product_tier: isLifetime ? "pro_lifetime" : "pro",
          active: true,
          activation_count: 0,
          max_activations: 3,
          cancel_at_period_end: false,
          // No renewal date for a lifetime licence — the app hides the
          // "Renews" row when this is null.
          current_period_end: null,
          last_validated_at: null,
        });

        if (!created) {
          console.error("[webhook] createLicense failed for session", session.id);
          break;
        }

        // Fire-and-forget email
        sendLicenseEmail(email, licenseKey).catch((e) =>
          console.error("[webhook] sendLicenseEmail error:", e)
        );
        break;
      }

      // ── Refund / dispute on a one-time purchase → revoke ──────────────────
      //
      // A subscription can be cancelled; a lifetime licence can only be undone
      // by a refund. Without this a refunded customer keeps Pro forever.
      case "charge.refunded":
      case "charge.dispute.created": {
        const charge =
          event.type === "charge.refunded"
            ? (event.data.object as Stripe.Charge)
            : ((event.data.object as Stripe.Dispute).charge as Stripe.Charge | string);

        const customerId =
          typeof charge === "string"
            ? null
            : ((charge.customer as string) ?? null);
        if (!customerId) break;

        // Partial refunds shouldn't revoke access.
        if (event.type === "charge.refunded" && typeof charge !== "string") {
          if (charge.amount_refunded < charge.amount) {
            console.log("[webhook] partial refund, licence left active:", charge.id);
            break;
          }
        }

        const licence = await getLicenseByCustomerId(customerId);
        if (!licence) break;
        await updateLicense(licence.id, {
          subscription_status: event.type === "charge.refunded" ? "refunded" : "disputed",
          active: false,
        });
        console.log("[webhook] revoked licence", licence.id, "due to", event.type);
        break;
      }

      // ── Subscription updated (renewals, upgrades, cancellation scheduled) ──
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await updateLicenseBySubscriptionId(sub.id, {
          subscription_status: sub.status,
          current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
          active: sub.status === "active" || sub.status === "trialing",
        });
        break;
      }

      // ── Subscription cancelled ────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await updateLicenseBySubscriptionId(sub.id, {
          subscription_status: "canceled",
          active: false,
        });
        break;
      }

      // ── Invoice paid → refresh period_end ────────────────────────────────
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string | null;
        if (!subscriptionId) break;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        await updateLicenseBySubscriptionId(subscriptionId, {
          subscription_status: sub.status,
          current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
          active: true,
        });
        break;
      }

      // ── Payment failed → mark inactive (grace period can be added here) ──
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string | null;
        if (!subscriptionId) break;
        const existing = await getLicenseBySubscriptionId(subscriptionId);
        if (existing) {
          await updateLicenseBySubscriptionId(subscriptionId, {
            subscription_status: "past_due",
            active: false,
          });
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[webhook] handler error:", err);
    // Still return 200 so Stripe does not retry endlessly for bugs in our code
  }

  return res.status(200).json({ received: true });
}

/**
 * The price actually purchased.
 *
 * Webhook payloads never include `line_items`, so the previous version just
 * returned the current env var — which records the wrong price the moment the
 * price changes, and misattributes every historical sale. Fetch the real one
 * and only fall back to the env var if that lookup fails.
 */
async function priceIdFromSession(session: Stripe.Checkout.Session): Promise<string | null> {
  try {
    const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
    const priceId = items.data[0]?.price?.id;
    if (priceId) return priceId;
  } catch (err) {
    console.error("[webhook] listLineItems failed:", err);
  }
  return process.env.STRIPE_PRICE_ID ?? null;
}
