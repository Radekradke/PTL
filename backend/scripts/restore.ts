import "dotenv/config"
import { readFileSync } from "fs"
import { prisma } from "../src/lib/prisma"

/**
 * Restaura um snapshot JSON gerado pelo backup.ts.
 *
 * Uso:
 *   npm run restore -- ./backups/backup-2026-06-11T12-00-00-000Z.json
 *
 * Faz upsert por id respeitando as foreign keys e reajusta as sequences do
 * Postgres no final. Idealmente restaure em um banco vazio/novo.
 */

type AnyRow = { id: number; [k: string]: unknown }

async function main() {
  const file = process.argv[2]
  if (!file) {
    console.error("Uso: npm run restore -- <caminho-do-backup.json>")
    process.exit(1)
  }

  const snapshot = JSON.parse(readFileSync(file, "utf-8"))
  const { sectors, employees, tickets, messages, timeline, pushSubscriptions } = snapshot.data as {
    sectors: AnyRow[]
    employees: AnyRow[]
    tickets: AnyRow[]
    messages: AnyRow[]
    timeline: AnyRow[]
    pushSubscriptions: AnyRow[]
  }

  console.log(`Restaurando backup de ${snapshot.meta?.createdAt}...`)

  // Ordem importa por causa das foreign keys.
  for (const s of sectors) await prisma.sector.upsert({ where: { id: s.id }, update: s as any, create: s as any })
  for (const e of employees) await prisma.employee.upsert({ where: { id: e.id }, update: e as any, create: e as any })
  for (const t of tickets) await prisma.ticket.upsert({ where: { id: t.id }, update: t as any, create: t as any })
  for (const m of messages) await prisma.ticketMessage.upsert({ where: { id: m.id }, update: m as any, create: m as any })
  for (const tl of timeline) await prisma.timeline.upsert({ where: { id: tl.id }, update: tl as any, create: tl as any })
  for (const p of pushSubscriptions) await prisma.pushSubscription.upsert({ where: { id: p.id }, update: p as any, create: p as any })

  // Reajusta as sequences de autoincremento para o maior id de cada tabela.
  const tables: [string, AnyRow[]][] = [
    ["Sector", sectors],
    ["Employee", employees],
    ["Ticket", tickets],
    ["TicketMessage", messages],
    ["Timeline", timeline],
    ["PushSubscription", pushSubscriptions],
  ]

  for (const [table, rows] of tables) {
    if (!rows.length) continue
    const maxId = Math.max(...rows.map((r) => r.id))
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), ${maxId})`
    )
  }

  console.log("✓ Restauração concluída.")
}

main()
  .catch((err) => {
    console.error("Falha na restauração:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
