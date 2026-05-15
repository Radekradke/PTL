import { useEffect, useMemo, useState } from "react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

import { AppLayout } from "@/components/layout/AppLayout"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { useNotifications } from "@/contexts/NotificationContext"

const chartTooltip = {
  backgroundColor: "#ffffff",
  borderRadius: 14,
  border: "1px solid #dfe7e2",
  color: "#17221c",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
}

function Help({ text }: { text: string }) {
  return (
    <span
      title={text}
      className="ml-2 inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-[11px] font-bold text-emerald-700"
    >
      ?
    </span>
  )
}

function ChartCard({ title, help, children, badge }: { title: string; help: string; badge?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold tracking-[-0.02em] text-slate-900 sm:text-lg">
            {title}
            <Help text={help} />
          </h2>
          <p className="mt-1 text-sm text-slate-500">Leitura rápida da operação.</p>
        </div>
        {badge && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {badge}
          </span>
        )}
      </div>
      <div className="h-[280px] min-h-[280px] w-full sm:h-[320px] sm:min-h-[320px]">
        {children}
      </div>
    </section>
  )
}

export function Dashboard() {
  const { tickets } = useNotifications()

  const [sectorFilter, setSectorFilter] = useState("Todos")
  const [categoryFilter, setCategoryFilter] = useState("Todas")
  const [originFilter, setOriginFilter] = useState("Todas")
  const [statusFilter, setStatusFilter] = useState("Todos")

  useEffect(() => {
    console.log("Dashboard: Tickets atualizados no contexto:", tickets.length)
  }, [tickets])

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSector = sectorFilter === "Todos" || ticket.sector === sectorFilter
      const matchesCategory = categoryFilter === "Todas" || ticket.category === categoryFilter
      const matchesOrigin = originFilter === "Todas" || ticket.origin === originFilter
      const matchesStatus = statusFilter === "Todos" || ticket.status === statusFilter

      return matchesSector && matchesCategory && matchesOrigin && matchesStatus
    })
  }, [tickets, sectorFilter, categoryFilter, originFilter, statusFilter])

  const totalTickets = filteredTickets.length
  const openTickets = filteredTickets.filter((ticket) => ticket.status === "Aberto").length
  const progressTickets = filteredTickets.filter((ticket) => ticket.status === "Em andamento").length
  const waitingUserTickets = filteredTickets.filter(
    (ticket) => ticket.status === "Aguardando usuário" || ticket.status === "Aguardando"
  ).length
  const finishedTickets = filteredTickets.filter((ticket) => ticket.status === "Finalizado").length
  const offshoreTickets = filteredTickets.filter((ticket) => ticket.origin === "Offshore").length
  const baseTickets = filteredTickets.filter((ticket) => ticket.origin === "Base").length

  const uniqueSectors = useMemo(() => Array.from(new Set(tickets.map((t) => t.sector))).filter(Boolean), [tickets])
  const uniqueCategories = useMemo(() => Array.from(new Set(tickets.map((t) => t.category))).filter(Boolean), [tickets])

  const ticketsBySector = useMemo(() => {
    return uniqueSectors.map((sector) => ({
      name: sector,
      total: filteredTickets.filter((ticket) => ticket.sector === sector).length,
    }))
  }, [filteredTickets, uniqueSectors])

  const ticketsByCategory = useMemo(() => {
    return uniqueCategories.map((category) => ({
      name: category,
      total: filteredTickets.filter((ticket) => ticket.category === category).length,
    }))
  }, [filteredTickets, uniqueCategories])

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

  const currentFilters = [
    sectorFilter !== "Todos" ? `Setor: ${sectorFilter}` : null,
    categoryFilter !== "Todas" ? `Categoria: ${categoryFilter}` : null,
    originFilter !== "Todas" ? `Origem: ${originFilter}` : null,
    statusFilter !== "Todos" ? `Status: ${statusFilter}` : null,
  ].filter(Boolean)

  return (
    <AppLayout>
      <div className="w-full space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Visão geral</p>
              <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Operação, status e origem dos chamados em uma tela.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-[11px] font-semibold uppercase text-slate-500">Filtrados</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{filteredTickets.length}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-center">
                <p className="text-[11px] font-semibold uppercase text-emerald-700">Setores</p>
                <p className="mt-2 text-2xl font-bold text-emerald-800">{uniqueSectors.length}</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-center">
                <p className="text-[11px] font-semibold uppercase text-blue-700">Categorias</p>
                <p className="mt-2 text-2xl font-bold text-blue-800">{uniqueCategories.length}</p>
              </div>
            </div>
          </div>

          {currentFilters.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {currentFilters.map((filter) => (
                <span key={filter} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  {filter}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Filtros
                <Help text="Refina os cards e gráficos do dashboard." />
              </h2>
              <p className="text-sm text-slate-500">Use apenas quando precisar segmentar.</p>
            </div>
            <button
              onClick={() => {
                setSectorFilter("Todos")
                setCategoryFilter("Todas")
                setOriginFilter("Todas")
                setStatusFilter("Todos")
              }}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
            >
              Limpar filtros
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-600">Setor</span>
              <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-800 outline-none focus:border-emerald-400">
                <option value="Todos">Todos</option>
                {uniqueSectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-600">Categoria</span>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-800 outline-none focus:border-emerald-400">
                <option value="Todas">Todas</option>
                {uniqueCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-600">Origem</span>
              <select value={originFilter} onChange={(e) => setOriginFilter(e.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-800 outline-none focus:border-emerald-400">
                <option value="Todas">Todas</option>
                <option value="Base">Base</option>
                <option value="Offshore">Offshore</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-600">Status</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-800 outline-none focus:border-emerald-400">
                <option value="Todos">Todos</option>
                <option value="Aberto">Aberto</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Aguardando usuário">Aguardando usuário</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Status</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatsCard title="Total" value={String(totalTickets)} tone="neutral" />
            <StatsCard title="Abertos" value={String(openTickets)} tone="info" />
            <StatsCard title="Em andamento" value={String(progressTickets)} tone="warning" />
            <StatsCard title="Aguardando" value={String(waitingUserTickets)} tone="danger" />
            <StatsCard title="Finalizados" value={String(finishedTickets)} tone="success" />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Origem</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatsCard title="Offshore" value={String(offshoreTickets)} tone="danger" />
            <StatsCard title="Base" value={String(baseTickets)} tone="base" />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ChartCard title="Por setor" help="Mostra quais setores mais abriram chamados." badge={`${filteredTickets.length} itens`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketsBySector}>
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#475569", fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: "#475569", fontSize: 12 }} />
                <Tooltip contentStyle={chartTooltip} labelStyle={{ color: "#17221c", fontWeight: 700 }} />
                <Bar dataKey="total" fill="#2FA866" radius={[10, 10, 3, 3]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Por categoria" help="Ajuda a enxergar os tipos de problema mais recorrentes." badge={`${uniqueCategories.length} tipos`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketsByCategory}>
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#475569", fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: "#475569", fontSize: 12 }} />
                <Tooltip contentStyle={chartTooltip} labelStyle={{ color: "#17221c", fontWeight: 700 }} />
                <Bar dataKey="total" fill="#2563EB" radius={[10, 10, 3, 3]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Por status" help="Distribuição da fila de atendimento." >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ticketsByStatus} dataKey="total" nameKey="name" outerRadius={100} innerRadius={58} paddingAngle={3} label>
                  <Cell fill="#2563EB" />
                  <Cell fill="#F59E0B" />
                  <Cell fill="#EF4444" />
                  <Cell fill="#2FA866" />
                </Pie>
                <Tooltip contentStyle={chartTooltip} labelStyle={{ color: "#17221c", fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Base x Offshore" help="Compara a origem dos chamados filtrados.">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ticketsByOrigin} dataKey="total" nameKey="name" outerRadius={100} innerRadius={58} paddingAngle={3} label>
                  <Cell fill="#14B8A6" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip contentStyle={chartTooltip} labelStyle={{ color: "#17221c", fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>
      </div>
    </AppLayout>
  )
}
