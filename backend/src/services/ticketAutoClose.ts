import { prisma } from "../lib/prisma"
import { broadcastTicketChange } from "../lib/eventBus"
import { sendPushToSector } from "./pushNotification"

const WARN_HOURS = 24 // aviso "foi finalizado?" após 24h sem resposta
const CLOSE_HOURS = 30 // fechamento automático após 30h sem resposta (6h de tolerância)
const CHECK_INTERVAL_MS = 60 * 60 * 1000 // verifica a cada 1 hora

type StaleTicket = {
  id: number
  category: string
  department: string
  updatedAt: Date
  autoCloseWarnedAt: Date | null
}

// Já foi avisado nesta rodada de inatividade? Um novo aviso só volta a ser
// necessário se o chamado recebeu atividade depois do último aviso.
function wasWarnedThisCycle(ticket: StaleTicket) {
  return !!ticket.autoCloseWarnedAt && ticket.autoCloseWarnedAt >= ticket.updatedAt
}

async function processStaleTickets() {
  const warnCutoff = new Date(Date.now() - WARN_HOURS * 60 * 60 * 1000)
  const closeCutoff = new Date(Date.now() - CLOSE_HOURS * 60 * 60 * 1000)

  const candidates: StaleTicket[] = await prisma.ticket.findMany({
    where: {
      status: { not: "Finalizado" },
      updatedAt: { lt: warnCutoff },
    },
    select: { id: true, category: true, department: true, updatedAt: true, autoCloseWarnedAt: true },
  })

  if (candidates.length === 0) return

  // ── Fase 1: avisar chamados parados há 24h+ ainda não avisados ──
  const toWarn = candidates.filter((ticket) => !wasWarnedThisCycle(ticket))
  const warnedIds = new Set(toWarn.map((ticket) => ticket.id))

  for (const ticket of toWarn) {
    // Marca o aviso via SQL puro para NÃO acionar o @updatedAt do Prisma —
    // assim o relógio de inatividade continua contando a partir da última resposta real.
    await prisma.$executeRaw`UPDATE "Ticket" SET "autoCloseWarnedAt" = NOW() WHERE "id" = ${ticket.id}`

    await prisma.timeline.create({
      data: { ticketId: ticket.id, action: "Aviso de inatividade enviado — 24h sem resposta" },
    })

    await sendPushToSector(ticket.department, {
      title: `Chamado #${ticket.id} parado há 24h`,
      body: `${ticket.category} está sem resposta há 24h. Foi finalizado? Responda ou finalize — será encerrado automaticamente em 6h.`,
      ticketId: ticket.id,
      url: "/tickets",
    })
  }

  // ── Fase 2: fechar chamados parados há 30h+ que já foram avisados numa rodada anterior ──
  const toClose = candidates.filter(
    (ticket) => ticket.updatedAt < closeCutoff && wasWarnedThisCycle(ticket) && !warnedIds.has(ticket.id)
  )

  if (toClose.length > 0) {
    await prisma.$transaction(
      toClose.map((ticket) =>
        prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            status: "Finalizado",
            archived: true,
            timeline: {
              create: {
                action: "Chamado finalizado automaticamente por inatividade de 30 horas",
              },
            },
          },
        })
      )
    )

    for (const ticket of toClose) {
      await sendPushToSector(ticket.department, {
        title: `Chamado #${ticket.id} encerrado`,
        body: `${ticket.category} foi encerrado automaticamente após 30h sem resposta.`,
        ticketId: ticket.id,
        url: "/tickets",
      })
    }

    console.log(`[AutoClose] ${toClose.length} chamado(s) finalizado(s) por inatividade.`)
  }

  if (toWarn.length > 0) {
    console.log(`[AutoClose] ${toWarn.length} chamado(s) avisado(s) por inatividade.`)
  }

  if (toWarn.length > 0 || toClose.length > 0) {
    broadcastTicketChange()
  }
}

export function startTicketAutoClose() {
  processStaleTickets().catch((err) => console.error("[AutoClose] Erro na verificação inicial:", err))
  setInterval(() => {
    processStaleTickets().catch((err) => console.error("[AutoClose] Erro:", err))
  }, CHECK_INTERVAL_MS)
}
