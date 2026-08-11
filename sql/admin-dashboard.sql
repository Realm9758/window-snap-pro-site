-- Admin dashboard: revenue and version columns.
-- Run once in the Supabase SQL editor. Safe to run more than once.
--
-- See docs/superpowers/specs/2026-08-11-admin-dashboard-design.md

-- ─── Revenue ──────────────────────────────────────────────────────────────────
-- `licenses` has never recorded what anyone paid, so revenue was only knowable
-- by asking Stripe. Storing it at purchase time means the dashboard renders
-- without a network call, and the funnel can join against it locally.
--
-- Minor units (1900 = £19.00), matching how Stripe reports amounts. Storing a
-- decimal would invite rounding drift on a value that must reconcile exactly.

ALTER TABLE licenses ADD COLUMN IF NOT EXISTS amount_total INTEGER;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS currency     TEXT;

-- ─── Version telemetry ────────────────────────────────────────────────────────
-- On the activation, not the licence: someone with two Macs can be running two
-- different versions, and hanging this off the licence would record only
-- whichever one checked in most recently.
--
-- Both nullable forever. Builds shipped before this exists never send them, and
-- their rows must stay valid.

ALTER TABLE license_activations ADD COLUMN IF NOT EXISTS app_version TEXT;
ALTER TABLE license_activations ADD COLUMN IF NOT EXISTS os_version  TEXT;

-- ─── Indexes ──────────────────────────────────────────────────────────────────

-- Download breakdown groups by source.
CREATE INDEX IF NOT EXISTS idx_download_events_source
  ON download_events (source);

-- Revenue sums filter refunded and disputed rows out.
CREATE INDEX IF NOT EXISTS idx_licenses_subscription_status
  ON licenses (subscription_status);

-- Version adoption filters activations by recency.
CREATE INDEX IF NOT EXISTS idx_license_activations_last_seen_at
  ON license_activations (last_seen_at);
