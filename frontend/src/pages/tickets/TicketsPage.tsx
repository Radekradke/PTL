import { useEffect, useRef, useState } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { TicketsTable } from "@/components/tickets/TicketsTable"
import { PageLoader } from "@/components/ui/PageLoader"
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
  const offshoreTickets = tickets.filter((ticket) => ticket.origin === "Operacional").length
  const baseTickets = tickets.filter((ticket) => ticket.origin === "Administrativo").length
  const totalTickets = tickets.length

  return (
    <AppLayout>
      <div className="ls-page-shell">
        <section className="ls-hero-clean p-3 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-3 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-[-0.045em] text-[color:var(--foreground)] sm:text-3xl sm:tracking-[-0.055em] lg:text-4xl">Chamados</h1>
              <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[color:var(--muted-foreground)] sm:mt-2.5 sm:text-sm sm:leading-6">
                Gerencie a fila, responda usuários e acompanhe atendimentos.
              </p>
            </div>

            <div className="grid gap-2 sm:gap-3 grid-cols-3 shrink-0">
              <div className="rounded-xl border border-[color:var(--hairline)] bg-white p-3 sm:p-4 text-center shadow-[var(--shadow-sm)]">
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--muted-foreground)]">Total</p>
                <p className="ls-num mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-[color:var(--foreground)]">{totalTickets}</p>
              </div>
              <div className="rounded-xl border border-amber-200/70 bg-amber-50 p-3 sm:p-4 text-center shadow-[var(--shadow-sm)]">
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-700">Pendentes</p>
                <p className="ls-num mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-amber-700">{openTickets + waitingUserTickets}</p>
              </div>
              <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--accent)] p-3 sm:p-4 text-center shadow-[var(--shadow-sm)]">
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0B3D29]">Em atendimento</p>
                <p className="ls-num mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-[#00A859]">{progressTickets}</p>
              </div>
            </div>
          </div>
        </section>

        {isLoadingTickets ? (
          <div className="rounded-3xl border border-[#DDE8E2] bg-white/90 shadow-sm">
            <PageLoader message="Carregando chamados..." />
          </div>
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
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Administrativo</p>
                  <p className="mt-1 text-2xl font-black text-cyan-700">{baseTickets}</p>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-[#FFF7F8] px-3 py-3 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-rose-600">Operacional</p>
                  <p className="mt-1 text-2xl font-black text-rose-700">{offshoreTickets}</p>
                </div>
              </div>
              <div className="hidden gap-2 sm:grid sm:gap-3 lg:gap-4 sm:grid-cols-2">
                <StatsCard title="Operacional" value={String(offshoreTickets)} tone="danger" />
                <StatsCard title="Administrativo" value={String(baseTickets)} tone="base" />
              </div>
            </section>

            <TicketsTable tickets={tickets} onTicketsChange={loadTickets} />
          </>
        )}
      </div>
    </AppLayout>
  )
}
