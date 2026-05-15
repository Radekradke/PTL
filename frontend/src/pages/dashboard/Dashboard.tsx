import { useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { AppLayout } from "@/components/layout/AppLayout"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { useNotifications } from "@/contexts/NotificationContext"

function chartTooltip() {
  return {
    cursor: { fill: "rgba(23, 74, 58, 0.04)" },
    contentStyle: {
      backgroundColor: "#ffffff",
      borderRadius: 16,
      border: "1px solid #DFE7E2",
      color: "#17221C",
      boxShadow: "0 16px 34px rgba(23,34,28,0.12)",
    },
    labelStyle: {
      color: "#17221C",
      fontWeight: 700,
    },
  }
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
  const waitingUserTickets = filteredTickets.filter((ticket) => ticket.status === "Aguardando usuário").length
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

  const activeFilters = [
    sectorFilter !== "Todos" ? `Setor: ${sectorFilter}` : null,
    categoryFilter !== "Todas" ? `Categoria: ${categoryFilter}` : null,
    originFilter !== "Todas" ? `Origem: ${originFilter}` : null,
    statusFilter !== "Todos" ? `Status: ${statusFilter}` : null,
  ].filter(Boolean)

  function clearFilters() {
    setSectorFilter("Todos")
    setCategoryFilter("Todas")
    setOriginFilter("Todas")
    setStatusFilter("Todos")
  }

  return (
    <AppLayout>
      <div className="space-y-5 sm:space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-[#DFE7E2] bg-white shadow-[0_16px_40px_rgba(23,34,28,0.07)]">
          <div className="bg-gradient-to-r from-[#174A3A] via-[#1E6B4E] to-[#2FA866] p-5 text-white sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Operação</p>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-5xl">Dashboard</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/76 sm:text-base">
                  Indicadores da fila técnica em tempo real.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:min-w-[390px]">
                <div className="rounded-2xl bg-white/14 p-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase text-white/65">Filtrados</p>
                  <p className="mt-1 text-2xl font-black">{filteredTickets.length}</p>
                </div>
                <div className="rounded-2xl bg-white/14 p-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase text-white/65">Setores</p>
                  <p className="mt-1 text-2xl font-black">{uniqueSectors.length}</p>
                </div>
                <div className="rounded-2xl bg-white/14 p-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase text-white/65">Categorias</p>
                  <p className="mt-1 text-2xl font-black">{uniqueCategories.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-base font-black tracking-[-0.03em] text-[#17221C]">Filtros</h2>
                <p className="text-sm text-[#6D7A72]">Refina todos os cards e gráficos.</p>
              </div>
              <button
                onClick={clearFilters}
                className="h-11 rounded-2xl border border-[#DFE7E2] bg-[#F7FAF8] px-5 text-sm font-bold text-[#174A3A] transition hover:border-[#2FA866]/40 hover:bg-[#E8F7EF]"
              >
                Limpar filtros
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="h-11 rounded-2xl border border-[#DFE7E2] bg-white px-4 text-sm font-semibold text-[#17221C] outline-none focus:border-[#2FA866]">
                <option value="Todos">Todos setores</option>
                {uniqueSectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-11 rounded-2xl border border-[#DFE7E2] bg-white px-4 text-sm font-semibold text-[#17221C] outline-none focus:border-[#2FA866]">
                <option value="Todas">Todas categorias</option>
                {uniqueCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <select value={originFilter} onChange={(e) => setOriginFilter(e.target.value)} className="h-11 rounded-2xl border border-[#DFE7E2] bg-white px-4 text-sm font-semibold text-[#17221C] outline-none focus:border-[#2FA866]">
                <option value="Todas">Todas origens</option>
                <option value="Base">Base</option>
                <option value="Offshore">Offshore</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-2xl border border-[#DFE7E2] bg-white px-4 text-sm font-semibold text-[#17221C] outline-none focus:border-[#2FA866]">
                <option value="Todos">Todos status</option>
                <option value="Aberto">Aberto</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Aguardando usuário">Aguardando usuário</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>

            {activeFilters.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <span key={filter} className="rounded-full border border-[#2FA866]/20 bg-[#E8F7EF] px-3 py-1 text-xs font-bold text-[#174A3A]">
                    {filter}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[#42534A]">Status</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatsCard title="Total" value={String(totalTickets)} tone="neutral" />
            <StatsCard title="Abertos" value={String(openTickets)} tone="info" />
            <StatsCard title="Em andamento" value={String(progressTickets)} tone="warning" />
            <StatsCard title="Aguardando" value={String(waitingUserTickets)} tone="danger" />
            <StatsCard title="Finalizados" value={String(finishedTickets)} tone="success" />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[#42534A]">Origem</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatsCard title="Offshore" value={String(offshoreTickets)} tone="danger" />
            <StatsCard title="Base" value={String(baseTickets)} tone="base" />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-[#DFE7E2] bg-white p-4 shadow-[0_12px_32px_rgba(23,34,28,0.07)] sm:p-5">
            <h2 className="text-lg font-black tracking-[-0.03em] text-[#17221C]">Por setor</h2>
            <p className="text-sm text-[#6D7A72]">Volume por área.</p>
            <div className="mt-4 h-[260px] min-h-[260px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketsBySector}>
                  <XAxis dataKey="name" stroke="#8A9990" tick={{ fill: "#42534A", fontSize: 11 }} />
                  <YAxis stroke="#8A9990" tick={{ fill: "#42534A", fontSize: 11 }} />
                  <Tooltip {...chartTooltip()} />
                  <Bar dataKey="total" fill="#2FA866" radius={[12, 12, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#DFE7E2] bg-white p-4 shadow-[0_12px_32px_rgba(23,34,28,0.07)] sm:p-5">
            <h2 className="text-lg font-black tracking-[-0.03em] text-[#17221C]">Por categoria</h2>
            <p className="text-sm text-[#6D7A72]">Tipos mais recorrentes.</p>
            <div className="mt-4 h-[260px] min-h-[260px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketsByCategory}>
                  <XAxis dataKey="name" stroke="#8A9990" tick={{ fill: "#42534A", fontSize: 11 }} />
                  <YAxis stroke="#8A9990" tick={{ fill: "#42534A", fontSize: 11 }} />
                  <Tooltip {...chartTooltip()} />
                  <Bar dataKey="total" fill="#174A3A" radius={[12, 12, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#DFE7E2] bg-white p-4 shadow-[0_12px_32px_rgba(23,34,28,0.07)] sm:p-5">
            <h2 className="text-lg font-black tracking-[-0.03em] text-[#17221C]">Por status</h2>
            <p className="text-sm text-[#6D7A72]">Distribuição da fila.</p>
            <div className="mt-4 h-[260px] min-h-[260px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ticketsByStatus} dataKey="total" nameKey="name" innerRadius={48} outerRadius={92} paddingAngle={3} label>
                    <Cell fill="#2563EB" />
                    <Cell fill="#D97706" />
                    <Cell fill="#DC2626" />
                    <Cell fill="#2FA866" />
                  </Pie>
                  <Tooltip {...chartTooltip()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#DFE7E2] bg-white p-4 shadow-[0_12px_32px_rgba(23,34,28,0.07)] sm:p-5">
            <h2 className="text-lg font-black tracking-[-0.03em] text-[#17221C]">Base x Offshore</h2>
            <p className="text-sm text-[#6D7A72]">Origem dos chamados.</p>
            <div className="mt-4 h-[260px] min-h-[260px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ticketsByOrigin} dataKey="total" nameKey="name" innerRadius={48} outerRadius={92} paddingAngle={3} label>
                    <Cell fill="#0E7490" />
                    <Cell fill="#DC2626" />
                  </Pie>
                  <Tooltip {...chartTooltip()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
