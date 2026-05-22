-- Keep the legacy Sector.pin column invisible in the app while allowing sector creation without a PIN.
UPDATE "Sector" SET "pin" = '' WHERE "pin" IS NULL;
ALTER TABLE "Sector" ALTER COLUMN "pin" SET DEFAULT '';
