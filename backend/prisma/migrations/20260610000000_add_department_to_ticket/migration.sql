-- AlterTable: add department column to Ticket
ALTER TABLE "Ticket" ADD COLUMN "department" TEXT NOT NULL DEFAULT 'TI';
