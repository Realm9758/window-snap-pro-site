import type { NextApiRequest, NextApiResponse } from "next";
import type { IncomingMessage } from "http";
import type Stripe from "stripe";
import { stripe } from "../../lib/stripe";
import {
  createLicense,
  getLicenseBySubscriptionId,
  updateLicenseBySubscriptionId,
} from "../../lib/db";
import { generateLicenseKey } from "../../lib/license";
import { sendLicenseEmail } from "../../lib/email";

// Disable body parsing — Stripe needs the raw body for signature verification
export const config = { api: { bodyParser: false } };

async function getRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
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
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const email = session.customer_details?.email ?? (session.customer_email as string);
        if (!email) {
          console.error("[webhook] No email found on session", session.id);
          break;
        }

        const licenseKey = generateLicenseKey();
        const now = new Date().toISOString();

        await createLicense({
          email: email.toLowerCase().trim(),
          license_key: licenseKey,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          stripe_price_id: STRIPE_PRICE_ID_FROM_SESSION(session),
          stripe_checkout_session_id: session.id,
          subscription_status: "active",
          product_tier: "pro",
          active: true,
          activation_count: 0,
          max_activations: 3,
          cancel_at_period_end: false,
          current_period_end: null,
          last_validated_at: null,
        });

        // Fire-and-forget email
        sendLicenseEmail(email, licenseKey).catch((e) =>
          console.error("[webhook] sendLicenseEmail error:", e)
        );
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

function STRIPE_PRICE_ID_FROM_SESSION(session: Stripe.Checkout.Session): string {
  // line_items might not be expanded; fall back to env var
  return process.env.STRIPE_PRICE_ID ?? "";
}
