import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { TicketsTable } from "@/components/tickets/TicketsTable"
import { apiFetch } from "@/services/api"
import { useNotifications } from "@/contexts/NotificationContext"

export function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const { setTickets: setGlobalTickets } = useNotifications()

  useEffect(() => {
    loadTickets()
    const interval = setInterval(loadTickets, 15000)
    return () => clearInterval(interval)
  }, [])

  async function loadTickets() {
    try {
      const response = await apiFetch("/tickets?includeArchived=true")
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
        archived: ticket.archived || false,
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

  const activeTickets = tickets.filter((ticket) => !ticket.archived)
  const openTickets = activeTickets.filter((ticket) => ticket.status === "Aberto").length
  const progressTickets = activeTickets.filter((ticket) => ticket.status === "Em andamento").length
  const waitingUserTickets = activeTickets.filter((ticket) => ticket.status === "Aguardando usuário").length
  const finishedTickets = tickets.filter((ticket) => ticket.status === "Finalizado").length
  const offshoreTickets = tickets.filter((ticket) => ticket.origin === "Offshore").length
  const baseTickets = tickets.filter((ticket) => ticket.origin === "Base").length
  const totalTickets = tickets.length

  return (
    <AppLayout>
      <div className="ls-page-shell">
        <section className="ls-hero-clean p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-black uppercase tracking-[0.22em] text-[#00A859]">Operação técnica</p>
              <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-[-0.06em] text-[#111827]">Chamados</h1>
              <p className="mt-2 sm:mt-3 max-w-2xl text-xs sm:text-sm leading-5 sm:leading-6 text-[#64748B]">
                Gerencie a fila, responda usuários e acompanhe atendimentos.
              </p>
            </div>

            <div className="grid gap-2 sm:gap-3 grid-cols-3 shrink-0">
              <div className="rounded-2xl sm:rounded-3xl border border-[#DDE8E2] bg-white p-3 sm:p-4 text-center shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Total</p>
                <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-black text-[#111827]">{totalTickets}</p>
              </div>
              <div className="rounded-2xl sm:rounded-3xl border border-amber-200 bg-amber-50 p-3 sm:p-4 text-center shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">Pendentes</p>
                <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-black text-amber-700">{openTickets + waitingUserTickets}</p>
              </div>
              <div className="rounded-2xl sm:rounded-3xl border border-[#DDE8E2] bg-[#ECFBF3] p-3 sm:p-4 text-center shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.14em] text-[#073B2A]">Em atendimento</p>
                <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-black text-[#00A859]">{progressTickets}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3 sm:space-y-4 lg:space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Status</h3>
          <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <StatsCard title="Total" value={String(totalTickets)} tone="neutral" />
            <StatsCard title="Abertos" value={String(openTickets)} tone="warning" />
            <StatsCard title="Em andamento" value={String(progressTickets)} tone="info" />
            <StatsCard title="Aguardando usuário" value={String(waitingUserTickets)} tone="danger" />
            <StatsCard title="Finalizados" value={String(finishedTickets)} tone="success" />
          </div>
        </section>

        <section className="space-y-3 sm:space-y-4 lg:space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Origem</h3>
          <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2">
            <StatsCard title="Offshore" value={String(offshoreTickets)} tone="danger" />
            <StatsCard title="Base" value={String(baseTickets)} tone="base" />
          </div>
        </section>

        <TicketsTable tickets={tickets} onTicketsChange={loadTickets} />
      </div>
    </AppLayout>
  )
}
