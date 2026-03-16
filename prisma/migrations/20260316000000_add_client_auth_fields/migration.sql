-- AlterTable
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "pin" VARCHAR(6);
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "settings" JSONB DEFAULT '{"notifications": {"email": true, "push": true, "sms": false}}';
