import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { TicketsTable } from "@/components/tickets/TicketsTable"
import { API_URL } from "@/services/api"
import { useNotifications } from "@/contexts/NotificationContext"

const metallicPanel = "rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_34%),linear-gradient(135deg,#07111F_0%,#0F2742_42%,#1E5B8F_100%)] shadow-[0_24px_80px_rgba(2,8,23,0.34)]"

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

  const openTickets = tickets.filter((ticket) => ticket.status === "Aberto").length
  const progressTickets = tickets.filter((ticket) => ticket.status === "Em andamento").length
  const waitingUserTickets = tickets.filter((ticket) => ticket.status === "Aguardando usuário").length
  const finishedTickets = tickets.filter((ticket) => ticket.status === "Finalizado").length
  const offshoreTickets = tickets.filter((ticket) => ticket.origin === "Offshore").length
  const baseTickets = tickets.filter((ticket) => ticket.origin === "Base").length
  const totalTickets = tickets.length

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl space-y-7 py-4">
        <section className={`${metallicPanel} p-5 text-white sm:p-8`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200/90">Operação técnica</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white sm:text-5xl">Chamados</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
                Gerencie a fila, atualize status e responda usuários com foco no atendimento.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[430px]">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Total</p>
                <p className="mt-2 text-3xl font-black text-white">{totalTickets}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Pendentes</p>
                <p className="mt-2 text-3xl font-black text-white">{openTickets + waitingUserTickets}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Em atendimento</p>
                <p className="mt-2 text-3xl font-black text-white">{progressTickets}</p>
              </div>
            </div>
          </div>

          <div className="mt-7 space-y-6">
            <div>
              <h3 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-white/75">Resumo por status</h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatsCard title="Total" value={String(totalTickets)} tone="neutral" />
                <StatsCard title="Abertos" value={String(openTickets)} tone="info" />
                <StatsCard title="Em andamento" value={String(progressTickets)} tone="warning" />
                <StatsCard title="Aguardando usuário" value={String(waitingUserTickets)} tone="danger" />
                <StatsCard title="Finalizados" value={String(finishedTickets)} tone="success" />
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-white/75">Resumo por origem</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <StatsCard title="Offshore" value={String(offshoreTickets)} tone="danger" />
                <StatsCard title="Base" value={String(baseTickets)} tone="base" />
              </div>
            </div>
          </div>
        </section>

        <TicketsTable tickets={tickets} onTicketsChange={loadTickets} />
      </div>
    </AppLayout>
  )
}
