-- v1.3.2 — anexos gerais (chamados/sugestões) e Sugestões de Melhoria.
-- SQL idempotente (IF NOT EXISTS) para conviver com o ensureRuntimeSchema()
-- do servidor, que também garante estas estruturas em deploys sem migrate.

-- Novas colunas de anexo em chamados
ALTER TABLE "TicketAttachment" ADD COLUMN IF NOT EXISTS "storageKey" TEXT;
ALTER TABLE "TicketAttachment" ADD COLUMN IF NOT EXISTS "uploadedBy" TEXT;
ALTER TABLE "TicketAttachment" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "TicketAttachment" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

-- Sugestões
CREATE TABLE IF NOT EXISTS "Suggestion" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "improvement" TEXT,
    "category" TEXT NOT NULL,
    "sectorId" INTEGER,
    "sectorName" TEXT,
    "employeeId" INTEGER,
    "authorName" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Nova',
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Suggestion_status_idx" ON "Suggestion"("status");
CREATE INDEX IF NOT EXISTS "Suggestion_category_idx" ON "Suggestion"("category");
CREATE INDEX IF NOT EXISTS "Suggestion_employeeId_idx" ON "Suggestion"("employeeId");

CREATE TABLE IF NOT EXISTS "SuggestionAttachment" (
    "id" SERIAL NOT NULL,
    "suggestionId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuggestionAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SuggestionAttachment_suggestionId_idx" ON "SuggestionAttachment"("suggestionId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'SuggestionAttachment_suggestionId_fkey'
  ) THEN
    ALTER TABLE "SuggestionAttachment"
      ADD CONSTRAINT "SuggestionAttachment_suggestionId_fkey"
      FOREIGN KEY ("suggestionId") REFERENCES "Suggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
