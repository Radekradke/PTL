-- Preserve support history by deactivating employees/sectors instead of deleting them.
ALTER TABLE "Sector" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Sector" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Sector" DROP COLUMN "pin";
ALTER TABLE "Employee" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Employee" DROP CONSTRAINT IF EXISTS "Employee_sectorId_fkey";
ALTER TABLE "Ticket" DROP CONSTRAINT IF EXISTS "Ticket_employeeId_fkey";
ALTER TABLE "Ticket" DROP CONSTRAINT IF EXISTS "Ticket_sectorId_fkey";

ALTER TABLE "Employee"
  ADD CONSTRAINT "Employee_sectorId_fkey"
  FOREIGN KEY ("sectorId") REFERENCES "Sector"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Ticket"
  ADD CONSTRAINT "Ticket_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Ticket"
  ADD CONSTRAINT "Ticket_sectorId_fkey"
  FOREIGN KEY ("sectorId") REFERENCES "Sector"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
