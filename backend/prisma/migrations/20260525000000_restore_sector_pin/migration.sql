-- Restore Sector.pin for deployments that still require a sector PIN during creation.
ALTER TABLE "Sector" ADD COLUMN IF NOT EXISTS "pin" TEXT;
UPDATE "Sector" SET "pin" = '' WHERE "pin" IS NULL;
ALTER TABLE "Sector" ALTER COLUMN "pin" SET DEFAULT '';
ALTER TABLE "Sector" ALTER COLUMN "pin" SET NOT NULL;
