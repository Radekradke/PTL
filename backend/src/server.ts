import express from "express"
import cors from "cors"
import dotenv from "dotenv"

import { sectorsRoutes } from "./routes/sectors.routes"
import { employeesRoutes } from "./routes/employees.routes"
import { ticketsRoutes } from "./routes/tickets.routes"
import { authRoutes } from "./routes/auth.routes"
import { ouvidoriaRoutes } from "./routes/ouvidoria.routes"
import { pushRoutes } from "./routes/push.routes"
import { departmentEmailsRoutes } from "./routes/departmentEmails.routes"
import { suggestionsRoutes } from "./routes/suggestions.routes"
import { assertAuthConfig } from "./lib/auth"
import { prisma } from "./lib/prisma"
import { addSseClient } from "./lib/eventBus"
import { requireAuth } from "./middlewares/auth.middleware"

dotenv.config()
assertAuthConfig()

const app = express()
const isProduction = process.env.NODE_ENV === "production"
const configuredOrigins = String(process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
const allowedOrigins = isProduction
  ? configuredOrigins
  : [...configuredOrigins, "http://localhost:5173", "http://127.0.0.1:5173"]

if (isProduction && allowedOrigins.length === 0) {
  throw new Error("FRONTEND_URL deve ser configurado em produção.")
}

// Permite qualquer subdomínio *.vercel.app para facilitar previews do Vercel
function isAllowedOrigin(origin: string) {
  if (allowedOrigins.includes(origin)) return true
  if (/^https:\/\/[\w-]+-andres-projects-[\w]+\.vercel\.app$/.test(origin)) return true
  if (/^https:\/\/lifting[\w-]*\.vercel\.app$/.test(origin)) return true
  return false
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        return callback(null, true)
      }

      return callback(new Error("Origem não permitida pelo CORS."))
    },
    credentials: true,
  })
)
// Rotas que aceitam anexos em base64 usam um limite maior; o restante segue enxuto.
// 5 arquivos × 10 MB viram ~67 MB de base64 no corpo, por isso ~75 MB de folga.
const jsonDefault = express.json({ limit: "20kb" })
const jsonWithFiles = express.json({ limit: "75mb" })

app.use((req, res, next) => {
  const acceptsFiles =
    req.method === "POST" &&
    (req.path === "/tickets" ||
      /^\/tickets\/\d+\/messages$/.test(req.path) ||
      req.path === "/suggestions")

  return (acceptsFiles ? jsonWithFiles : jsonDefault)(req, res, next)
})

app.get("/", (_req, res) => {
  res.json({ message: "Lifting Support API online" })
})

app.get("/events", requireAuth, (_req, res) => {
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.flushHeaders()
  res.write(": connected\n\n")
  addSseClient(res)
})

app.use("/auth", authRoutes)
app.use("/sectors", sectorsRoutes)
app.use("/employees", employeesRoutes)
app.use("/tickets", ticketsRoutes)
app.use("/ouvidoria", ouvidoriaRoutes)
app.use("/push", pushRoutes)
app.use("/department-emails", departmentEmailsRoutes)
app.use("/suggestions", suggestionsRoutes)

const PORT = process.env.PORT || 3333

// Garantia idempotente para deploys que não rodam `prisma migrate deploy`:
// o Prisma Client gerado espera a coluna "color" em Sector.
async function ensureRuntimeSchema() {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Sector" ADD COLUMN IF NOT EXISTS "color" TEXT NOT NULL DEFAULT '#00A859'`
    )
  } catch (error) {
    console.error("Falha ao garantir coluna Sector.color:", error)
  }

  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "autoCloseWarnedAt" TIMESTAMP(3)`
    )
  } catch (error) {
    console.error("Falha ao garantir coluna Ticket.autoCloseWarnedAt:", error)
  }

  try {
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "TicketAttachment" (
        "id" SERIAL PRIMARY KEY,
        "ticketId" INTEGER NOT NULL REFERENCES "Ticket"("id") ON DELETE CASCADE,
        "messageId" INTEGER REFERENCES "TicketMessage"("id") ON DELETE CASCADE,
        "filename" TEXT NOT NULL,
        "mimeType" TEXT NOT NULL,
        "size" INTEGER NOT NULL,
        "data" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    )
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "TicketAttachment_ticketId_idx" ON "TicketAttachment"("ticketId")`
    )
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "TicketAttachment_messageId_idx" ON "TicketAttachment"("messageId")`
    )
  } catch (error) {
    console.error("Falha ao garantir tabela TicketAttachment:", error)
  }

  // Novas colunas de anexo (v1.3.2): storageKey, uploadedBy, remoção lógica.
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "TicketAttachment" ADD COLUMN IF NOT EXISTS "storageKey" TEXT`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "TicketAttachment" ADD COLUMN IF NOT EXISTS "uploadedBy" TEXT`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "TicketAttachment" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3)`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "TicketAttachment" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT`)
  } catch (error) {
    console.error("Falha ao garantir colunas de anexo:", error)
  }

  // Sugestões de melhoria (v1.3.2).
  try {
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "Suggestion" (
        "id" SERIAL PRIMARY KEY,
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    )
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Suggestion_status_idx" ON "Suggestion"("status")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Suggestion_category_idx" ON "Suggestion"("category")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Suggestion_employeeId_idx" ON "Suggestion"("employeeId")`)
  } catch (error) {
    console.error("Falha ao garantir tabela Suggestion:", error)
  }

  try {
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "SuggestionAttachment" (
        "id" SERIAL PRIMARY KEY,
        "suggestionId" INTEGER NOT NULL REFERENCES "Suggestion"("id") ON DELETE CASCADE,
        "filename" TEXT NOT NULL,
        "storageKey" TEXT,
        "mimeType" TEXT NOT NULL,
        "size" INTEGER NOT NULL,
        "data" TEXT NOT NULL,
        "uploadedBy" TEXT,
        "deletedAt" TIMESTAMP(3),
        "deletedBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    )
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "SuggestionAttachment_suggestionId_idx" ON "SuggestionAttachment"("suggestionId")`
    )
  } catch (error) {
    console.error("Falha ao garantir tabela SuggestionAttachment:", error)
  }

  try {
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "DepartmentEmail" (
        "id" SERIAL PRIMARY KEY,
        "department" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    )
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "DepartmentEmail_department_idx" ON "DepartmentEmail"("department")`
    )
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "DepartmentEmail_department_email_key" ON "DepartmentEmail"("department", "email")`
    )
  } catch (error) {
    console.error("Falha ao garantir tabela DepartmentEmail:", error)
  }
}

app.listen(PORT, async () => {
  console.log(`API rodando em http://localhost:${PORT}`)
  await ensureRuntimeSchema()
})
