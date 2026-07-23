-- Make customer email column nullable to allow customers without email
-- Previously, email was String @unique (NOT NULL), which caused a unique constraint
-- violation (P2002) when multiple customers were registered without an email
-- (empty string "" was stored, conflicting with the @unique constraint).

-- Step 1: Clean up existing empty string emails by converting them to NULL
-- This ensures the unique constraint won't be violated by historical data
UPDATE "customers" SET "email" = NULL WHERE "email" = '';

-- Step 2: Make the email column nullable
ALTER TABLE "customers" ALTER COLUMN "email" DROP NOT NULL;
