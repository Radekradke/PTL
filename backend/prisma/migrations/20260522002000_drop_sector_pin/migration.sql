-- Sector PINs are no longer part of the product model.
ALTER TABLE "Sector" DROP COLUMN IF EXISTS "pin";
