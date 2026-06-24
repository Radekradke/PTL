import { prisma } from "../lib/prisma"
import { broadcastTicketChange } from "../lib/eventBus"

const INACTIVITY_HOURS = 24
const CHECK_INTERVAL_MS = 60 * 60 * 1000 // verifica a cada 1 hora

async function closeInactiveTickets() {
  const cutoff = new Date(Date.now() - INACTIVITY_HOURS * 60 * 60 * 1000)

  const tickets = await prisma.ticket.findMany({
    where: {
      status: { not: "Finalizado" },
      updatedAt: { lt: cutoff },
    },
    select: { id: true },
  })

  if (tickets.length === 0) return

  await prisma.$transaction(
    tickets.map((ticket) =>
      prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: "Finalizado",
          archived: true,
          timeline: {
            create: {
              action: "Chamado finalizado automaticamente por inatividade de 24 horas",
            },
          },
        },
      })
    )
  )

  console.log(`[AutoClose] ${tickets.length} chamado(s) finalizado(s) por inatividade.`)
  broadcastTicketChange()
}

export function startTicketAutoClose() {
  closeInactiveTickets().catch((err) => console.error("[AutoClose] Erro na verificação inicial:", err))
  setInterval(() => {
    closeInactiveTickets().catch((err) => console.error("[AutoClose] Erro:", err))
  }, CHECK_INTERVAL_MS)
}
