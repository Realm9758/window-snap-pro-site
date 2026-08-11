-- Window Snap Pro — Supabase Schema
-- Run this in the Supabase SQL editor

-- ─── Licenses ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS licenses (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                     TEXT NOT NULL,
  license_key               TEXT UNIQUE NOT NULL,

  -- Stripe identifiers
  stripe_customer_id        TEXT,
  stripe_subscription_id    TEXT UNIQUE,
  stripe_price_id           TEXT,
  stripe_checkout_session_id TEXT UNIQUE,

  -- Subscription state
  subscription_status       TEXT NOT NULL DEFAULT 'pending',
  product_tier              TEXT NOT NULL DEFAULT 'pro',
  active                    BOOLEAN NOT NULL DEFAULT FALSE,

  -- Billing period
  current_period_end        TIMESTAMPTZ,
  cancel_at_period_end      BOOLEAN NOT NULL DEFAULT FALSE,

  -- Activation tracking
  activation_count          INTEGER NOT NULL DEFAULT 0,
  max_activations           INTEGER NOT NULL DEFAULT 3,
  last_validated_at         TIMESTAMPTZ,

  -- Timestamps
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── License Activations ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS license_activations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id   UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  device_id    TEXT,
  device_name  TEXT,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (license_id, device_id)
);

-- ─── Download Events ──────────────────────────────────────────────────────────
-- One row per .dmg download served through /api/download. No IP or other
-- personal data is stored; user_agent and referer are kept so obvious bot
-- traffic can be filtered out later if the numbers ever look off.

CREATE TABLE IF NOT EXISTS download_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source      TEXT,          -- which button: 'hero', 'download-page', …
  user_agent  TEXT,
  referer     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_licenses_email
  ON licenses (email);

CREATE INDEX IF NOT EXISTS idx_licenses_license_key
  ON licenses (license_key);

CREATE INDEX IF NOT EXISTS idx_licenses_stripe_subscription_id
  ON licenses (stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_licenses_stripe_checkout_session_id
  ON licenses (stripe_checkout_session_id);

CREATE INDEX IF NOT EXISTS idx_license_activations_license_id
  ON license_activations (license_id);

CREATE INDEX IF NOT EXISTS idx_download_events_created_at
  ON download_events (created_at);

-- ─── Helper Function ──────────────────────────────────────────────────────────
-- Called by db.ts to atomically increment activation count

CREATE OR REPLACE FUNCTION increment_activation_count(license_id_param UUID)
RETURNS VOID
LANGUAGE SQL
AS $$
  UPDATE licenses
  SET activation_count = activation_count + 1,
      updated_at       = NOW()
  WHERE id = license_id_param;
$$;

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Service role key bypasses RLS; anon/public keys should not access these tables.

ALTER TABLE licenses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_activations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_events       ENABLE ROW LEVEL SECURITY;

-- Allow only service_role (backend) to read/write; deny everything else by default.
-- No additional policies needed since the backend uses the service role key.
