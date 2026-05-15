import { useEffect, useMemo, useState } from "react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { AppLayout } from "@/components/layout/AppLayout"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { useNotifications } from "@/contexts/NotificationContext"

export function Dashboard() {
  const { tickets } = useNotifications()
  const [sectorFilter, setSectorFilter] = useState("Todos")
  const [categoryFilter, setCategoryFilter] = useState("Todas")
  const [originFilter, setOriginFilter] = useState("Todas")
  const [statusFilter, setStatusFilter] = useState("Todos")

  useEffect(() => {
    console.log("Dashboard: Tickets atualizados no contexto:", tickets.length)
  }, [tickets])

  const filteredTickets = useMemo(() => tickets.filter((ticket) => {
    const matchesSector = sectorFilter === "Todos" || ticket.sector === sectorFilter
    const matchesCategory = categoryFilter === "Todas" || ticket.category === categoryFilter
    const matchesOrigin = originFilter === "Todas" || ticket.origin === originFilter
    const matchesStatus = statusFilter === "Todos" || ticket.status === statusFilter
    return matchesSector && matchesCategory && matchesOrigin && matchesStatus
  }), [tickets, sectorFilter, categoryFilter, originFilter, statusFilter])

  const totalTickets = filteredTickets.length
  const openTickets = filteredTickets.filter((ticket) => ticket.status === "Aberto").length
  const progressTickets = filteredTickets.filter((ticket) => ticket.status === "Em andamento").length
  const waitingUserTickets = filteredTickets.filter((ticket) => ticket.status === "Aguardando usuário").length
  const finishedTickets = filteredTickets.filter((ticket) => ticket.status === "Finalizado").length
  const offshoreTickets = filteredTickets.filter((ticket) => ticket.origin === "Offshore").length
  const baseTickets = filteredTickets.filter((ticket) => ticket.origin === "Base").length

  const uniqueSectors = useMemo(() => Array.from(new Set(tickets.map((t) => t.sector))).filter(Boolean), [tickets])
  const uniqueCategories = useMemo(() => Array.from(new Set(tickets.map((t) => t.category))).filter(Boolean), [tickets])

  const ticketsBySector = useMemo(() => uniqueSectors.map((sector) => ({
    name: sector,
    total: filteredTickets.filter((ticket) => ticket.sector === sector).length,
  })), [filteredTickets, uniqueSectors])

  const ticketsByCategory = useMemo(() => uniqueCategories.map((category) => ({
    name: category,
    total: filteredTickets.filter((ticket) => ticket.category === category).length,
  })), [filteredTickets, uniqueCategories])

  const ticketsByStatus = [
    { name: "Aberto", total: openTickets },
    { name: "Em andamento", total: progressTickets },
    { name: "Aguardando usuário", total: waitingUserTickets },
    { name: "Finalizado", total: finishedTickets },
  ]

  const ticketsByOrigin = [
    { name: "Base", total: baseTickets },
    { name: "Offshore", total: offshoreTickets },
  ]

  const tooltipStyle = {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    border: "1px solid #E5EAF1",
    color: "#0F172A",
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
  }

  return (
    <AppLayout>
      <div className="ls-page-shell">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2563EB]">
        Visão geral
      </p>

      <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] text-[#0F172A] sm:text-5xl">
        Dashboard
      </h1>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B] sm:text-base">
        Indicadores principais, filtros e gráficos para leitura rápida da
        operação.
      </p>
    </div>

    <div className="grid grid-cols-3 gap-3 sm:min-w-[390px]">
      <div className="rounded-3xl border border-slate-200 bg-[#F8FAFC] p-4 text-center shadow-sm transition hover:shadow-md">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
          Filtrados
        </p>

        <p className="mt-1 text-2xl font-black text-slate-900">
          {filteredTickets.length}
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-[#F8FAFC] p-4 text-center shadow-sm transition hover:shadow-md">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#2563EB]">
          Setores
        </p>

        <p className="mt-1 text-2xl font-black text-[#2563EB]">
          {uniqueSectors.length}
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-[#F8FAFC] p-4 text-center shadow-sm transition hover:shadow-md">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-600">
          Categorias
        </p>

        <p className="mt-1 text-2xl font-black text-cyan-700">
          {uniqueCategories.length}
        </p>
      </div>
    </div>
  </div>
</section>

        <section className="ls-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="ls-section-title text-xl">Filtros <span className="ls-help" title="Refina todos os cards e gráficos desta tela.">?</span></h2>
              <p className="text-sm text-slate-500">Segmentação rápida dos indicadores.</p>
            </div>
            <button onClick={() => { setSectorFilter("Todos"); setCategoryFilter("Todas"); setOriginFilter("Todas"); setStatusFilter("Todos") }} className="ls-button-secondary h-11 px-5 text-sm font-bold">Limpar filtros</button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="ls-input"><option value="Todos">Todos setores</option>{uniqueSectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}</select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="ls-input"><option value="Todas">Todas categorias</option>{uniqueCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
            <select value={originFilter} onChange={(e) => setOriginFilter(e.target.value)} className="ls-input"><option value="Todas">Todas origens</option><option value="Base">Base</option><option value="Offshore">Offshore</option></select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="ls-input"><option value="Todos">Todos status</option><option value="Aberto">Aberto</option><option value="Em andamento">Em andamento</option><option value="Aguardando usuário">Aguardando usuário</option><option value="Finalizado">Finalizado</option></select>
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

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="ls-card p-4 sm:p-6"><h2 className="ls-section-title text-xl">Por setor</h2><p className="text-sm text-slate-500">Volume por área.</p><div className="mt-5 h-[320px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={ticketsBySector}><XAxis dataKey="name" stroke="#94A3B8" tick={{ fill: "#475569", fontSize: 12 }} /><YAxis stroke="#94A3B8" tick={{ fill: "#475569", fontSize: 12 }} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="total" fill="#2563EB" radius={[12,12,4,4]} /></BarChart></ResponsiveContainer></div></div>
          <div className="ls-card p-4 sm:p-6"><h2 className="ls-section-title text-xl">Por categoria</h2><p className="text-sm text-slate-500">Tipos de demanda.</p><div className="mt-5 h-[320px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={ticketsByCategory}><XAxis dataKey="name" stroke="#94A3B8" tick={{ fill: "#475569", fontSize: 12 }} /><YAxis stroke="#94A3B8" tick={{ fill: "#475569", fontSize: 12 }} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="total" fill="#0EA5E9" radius={[12,12,4,4]} /></BarChart></ResponsiveContainer></div></div>
          <div className="ls-card p-4 sm:p-6"><h2 className="ls-section-title text-xl">Por status</h2><p className="text-sm text-slate-500">Distribuição da fila.</p><div className="mt-5 h-[320px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={ticketsByStatus} dataKey="total" nameKey="name" outerRadius={105} innerRadius={58} paddingAngle={4} label><Cell fill="#3B82F6" /><Cell fill="#F59E0B" /><Cell fill="#F97316" /><Cell fill="#10B981" /></Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer></div></div>
          <div className="ls-card p-4 sm:p-6"><h2 className="ls-section-title text-xl">Base x Offshore</h2><p className="text-sm text-slate-500">Origem dos chamados.</p><div className="mt-5 h-[320px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={ticketsByOrigin} dataKey="total" nameKey="name" outerRadius={105} innerRadius={58} paddingAngle={4} label><Cell fill="#0EA5E9" /><Cell fill="#E11D48" /></Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer></div></div>
        </div>
      </div>
    </AppLayout>
  )
}
