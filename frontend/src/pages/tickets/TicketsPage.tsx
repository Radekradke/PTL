import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { TicketsTable } from "@/components/tickets/TicketsTable"
import { API_URL } from "@/services/api"
import { useNotifications } from "@/contexts/NotificationContext"

export function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const { setTickets: setGlobalTickets } = useNotifications()

  useEffect(() => {
    loadTickets()
    const interval = setInterval(loadTickets, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadTickets() {
    try {
      const response = await fetch(`${API_URL}/tickets`)
      const data = await response.json()

      const formattedTickets = data.map((ticket: any) => ({
        id: ticket.id,
        user: ticket.employee?.name || "Sem solicitante",
        sector: ticket.sector?.name || "Sem setor",
        category: ticket.category,
        status: ticket.status,
        origin: ticket.origin,
        priority: ticket.priority,
        description: ticket.description,
        technicalResponse: ticket.technicalResponse || "",
        createdAt: new Date(ticket.createdAt).toLocaleString("pt-BR"),
        timeline: ticket.timeline?.map((event: any) => ({
          date: new Date(event.createdAt).toLocaleString("pt-BR"),
          action: event.action,
        })) || [],
      }))

      setTickets(formattedTickets)
      setGlobalTickets(formattedTickets)
    } catch (error) {
      console.error("Erro ao carregar tickets:", error)
    }
  }

  const totalTickets = tickets.length
  const openTickets = tickets.filter((ticket) => ticket.status === "Aberto").length
  const progressTickets = tickets.filter((ticket) => ticket.status === "Em andamento").length
  const waitingUserTickets = tickets.filter((ticket) => ticket.status === "Aguardando usuário").length
  const finishedTickets = tickets.filter((ticket) => ticket.status === "Finalizado").length
  const offshoreTickets = tickets.filter((ticket) => ticket.origin === "Offshore").length
  const baseTickets = tickets.filter((ticket) => ticket.origin === "Base").length

  return (
    <AppLayout>
      <div className="ls-page-shell">
        <section className="ls-page-heading">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="ls-kicker">Operação técnica</p>
              <h1 className="ls-title">Chamados</h1>
              <p className="ls-description">Gerencie a fila, responda usuários e acompanhe o atendimento.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-2 sm:min-w-[360px]">
              <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Total</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{totalTickets}</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-600">Pendentes</p>
                <p className="mt-1 text-2xl font-black text-amber-700">{openTickets + waitingUserTickets}</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">Em atendimento</p>
                <p className="mt-1 text-2xl font-black text-blue-700">{progressTickets}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Status</h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatsCard title="Total" value={String(totalTickets)} tone="neutral" />
            <StatsCard title="Abertos" value={String(openTickets)} tone="warning" />
            <StatsCard title="Em andamento" value={String(progressTickets)} tone="info" />
            <StatsCard title="Aguardando usuário" value={String(waitingUserTickets)} tone="danger" />
            <StatsCard title="Finalizados" value={String(finishedTickets)} tone="success" />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Origem</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatsCard title="Offshore" value={String(offshoreTickets)} tone="danger" />
            <StatsCard title="Base" value={String(baseTickets)} tone="base" />
          </div>
        </section>

        <TicketsTable tickets={tickets} onTicketsChange={loadTickets} />
      </div>
    </AppLayout>
  )
}
