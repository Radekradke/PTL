import { useEffect, useRef, useState } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { TicketsTable } from "@/components/tickets/TicketsTable"
import { Skeleton } from "@/components/ui/skeleton"
import { apiFetch } from "@/services/api"
import { useNotifications } from "@/contexts/NotificationContext"
import { TICKETS_CHANGED_EVENT } from "@/contexts/NotificationContext"

export function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(true)
  const hasLoadedTickets = useRef(false)
  const { setTickets: setGlobalTickets } = useNotifications()

  useEffect(() => {
    loadTickets()
    const handler = () => loadTickets()
    window.addEventListener(TICKETS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(TICKETS_CHANGED_EVENT, handler)
  }, [])

  async function loadTickets() {
    try {
      if (!hasLoadedTickets.current) {
        setIsLoadingTickets(true)
      }

      const response = await apiFetch("/tickets?includeArchived=true")
      const data = await response.json()
      const formattedTickets = data.map((ticket: any) => ({
        id: ticket.id,
        user: ticket.employee?.name || "Sem solicitante",
        sector: ticket.sector?.name || "Sem setor",
        category: ticket.category,
        status: ticket.status,
        origin: ticket.origin,
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
    } finally {
      hasLoadedTickets.current = true
      setIsLoadingTickets(false)
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
        <section className="ls-hero-clean p-3 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-3 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#00A859] sm:text-sm sm:tracking-[0.22em]">Operação técnica</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.045em] text-[#111827] sm:mt-2 sm:text-3xl sm:tracking-[-0.06em] lg:text-4xl">Chamados</h1>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-[#64748B] sm:mt-3 sm:text-sm sm:leading-6">
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

        {isLoadingTickets ? (
          <>
            <section className="space-y-3 sm:space-y-4 lg:space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Status</h3>
              <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 rounded-[1.15rem] bg-white/80 sm:h-32 sm:rounded-[1.5rem]" />
                ))}
              </div>
            </section>
            <Skeleton className="h-[420px] rounded-3xl bg-white/80" />
          </>
        ) : (
          <>
            <section className="space-y-3 sm:space-y-4 lg:space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Status</h3>
              <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                <div className="hidden sm:block">
                  <StatsCard title="Total" value={String(totalTickets)} tone="neutral" />
                </div>
                <StatsCard title="Abertos" value={String(openTickets)} tone="warning" />
                <StatsCard title="Em andamento" value={String(progressTickets)} tone="info" />
                <StatsCard title="Aguardando usuário" value={String(waitingUserTickets)} tone="danger" />
                <StatsCard title="Finalizados" value={String(finishedTickets)} tone="success" />
              </div>
            </section>

            <section className="space-y-3 sm:space-y-4 lg:space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Origem</h3>
              <div className="grid grid-cols-2 gap-2 sm:hidden">
                <div className="rounded-2xl border border-[#DDE8E2] bg-white px-3 py-3 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Base</p>
                  <p className="mt-1 text-2xl font-black text-cyan-700">{baseTickets}</p>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-[#FFF7F8] px-3 py-3 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-rose-600">Offshore</p>
                  <p className="mt-1 text-2xl font-black text-rose-700">{offshoreTickets}</p>
                </div>
              </div>
              <div className="hidden gap-2 sm:grid sm:gap-3 lg:gap-4 sm:grid-cols-2">
                <StatsCard title="Offshore" value={String(offshoreTickets)} tone="danger" />
                <StatsCard title="Base" value={String(baseTickets)} tone="base" />
              </div>
            </section>

            <TicketsTable tickets={tickets} onTicketsChange={loadTickets} />
          </>
        )}
      </div>
    </AppLayout>
  )
}
