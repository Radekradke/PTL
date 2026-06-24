import "dotenv/config"
import { mkdirSync, writeFileSync, readdirSync, statSync, rmSync } from "fs"
import { join } from "path"
import { prisma } from "../src/lib/prisma"

/**
 * Backup completo do banco em um snapshot JSON.
 *
 * Portátil: usa o próprio Prisma (não precisa do pg_dump instalado), então
 * roda igual no Windows local e no Linux do Render.
 *
 * Uso:
 *   npm run backup
 *
 * Recomendado rodar da sua máquina apontando para o DATABASE_URL de produção,
 * assim o dump fica salvo localmente (fora do servidor). Veja o README.
 */

const BACKUP_DIR = join(__dirname, "..", "backups")
const RETENTION = 30 // mantém os 30 backups mais recentes

async function main() {
  mkdirSync(BACKUP_DIR, { recursive: true })

  const [sectors, employees, tickets, messages, timeline, pushSubscriptions] = await Promise.all([
    prisma.sector.findMany(),
    prisma.employee.findMany(),
    prisma.ticket.findMany(),
    prisma.ticketMessage.findMany(),
    prisma.timeline.findMany(),
    prisma.pushSubscription.findMany(),
  ])

  const snapshot = {
    meta: {
      createdAt: new Date().toISOString(),
      version: 1,
      counts: {
        sectors: sectors.length,
        employees: employees.length,
        tickets: tickets.length,
        messages: messages.length,
        timeline: timeline.length,
        pushSubscriptions: pushSubscriptions.length,
      },
    },
    data: { sectors, employees, tickets, messages, timeline, pushSubscriptions },
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  const file = join(BACKUP_DIR, `backup-${stamp}.json`)
  writeFileSync(file, JSON.stringify(snapshot, null, 2), "utf-8")

  console.log(`✓ Backup salvo em: ${file}`)
  console.log(`  ${JSON.stringify(snapshot.meta.counts)}`)

  // Rotação: remove os backups além da retenção configurada.
  const olderFiles = readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("backup-") && f.endsWith(".json"))
    .map((f) => ({ f, t: statSync(join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)
    .slice(RETENTION)

  for (const { f } of olderFiles) {
    rmSync(join(BACKUP_DIR, f))
    console.log(`  removido backup antigo: ${f}`)
  }
}

main()
  .catch((err) => {
    console.error("Falha no backup:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
