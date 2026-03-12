-- AlterTable: settings - add missing columns
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "chatwoot_bot_token" TEXT;
ALTER TABLE "settings" ALTER COLUMN "chatwoot_account_id" SET DEFAULT '1';

-- AlterTable: leads - add missing columns
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "attributes" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "tags" JSONB NOT NULL DEFAULT '[]';
