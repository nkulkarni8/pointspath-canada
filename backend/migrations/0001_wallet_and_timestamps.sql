-- Run this against Neon BEFORE deploying the backend that ships this change.
-- Safe to run multiple times (IF NOT EXISTS guards).

ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS affiliate_url VARCHAR(500);
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();
ALTER TABLE routes       ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

CREATE TABLE IF NOT EXISTS saved_wallets (
    id                 SERIAL PRIMARY KEY,
    supabase_user_id   VARCHAR(64) NOT NULL UNIQUE,
    country            VARCHAR(10),
    data               TEXT NOT NULL DEFAULT '{}',
    created_at         TIMESTAMP NOT NULL DEFAULT now(),
    updated_at         TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_saved_wallets_supabase_user_id ON saved_wallets (supabase_user_id);

-- Backfill existing rows so last_updated doesn't show NULL until the next edit.
UPDATE credit_cards SET updated_at = now() WHERE updated_at IS NULL;
UPDATE routes       SET updated_at = now() WHERE updated_at IS NULL;
