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
  borderRadius: 18,
  border: "1px solid #dbe6f3",
  color: "#101828",
  boxShadow: "0 20px 60px rgba(15,23,42,0.14)",
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

  const ticketsBySector = useMemo(() => {
    const sectors = Array.from(new Set(tickets.map((t) => t.sector))).filter(Boolean)
    return sectors.map((sector) => ({
      name: sector,
      total: filteredTickets.filter((ticket) => ticket.sector === sector).length,
    }))
  }, [filteredTickets, tickets])

  const ticketsByCategory = useMemo(() => {
    const categories = Array.from(new Set(tickets.map((t) => t.category))).filter(Boolean)
    return categories.map((category) => ({
      name: category,
      total: filteredTickets.filter((ticket) => ticket.category === category).length,
    }))
  }, [filteredTickets, tickets])

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

  const uniqueSectors = useMemo(() => Array.from(new Set(tickets.map((t) => t.sector))).filter(Boolean), [tickets])
  const uniqueCategories = useMemo(() => Array.from(new Set(tickets.map((t) => t.category))).filter(Boolean), [tickets])

  return (
    <AppLayout>
      <div className="space-y-6 sm:space-y-8">
        <section className="ls-hero-blue rounded-[2rem] p-5 sm:p-8">
          <div className="ls-hero-content flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="ls-label text-xs sm:text-sm">Visão geral</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] text-white sm:text-5xl">
                Dashboard operacional
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Indicadores, filtros e leitura rápida da fila de chamados.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-white backdrop-blur-xl">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">Filtrados</p>
                <p className="mt-2 text-3xl font-black">{filteredTickets.length}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-white backdrop-blur-xl">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">Setores</p>
                <p className="mt-2 text-3xl font-black">{uniqueSectors.length}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-white backdrop-blur-xl">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">Categorias</p>
                <p className="mt-2 text-3xl font-black">{uniqueCategories.length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="ls-product-card rounded-[2rem] p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="ls-section-title text-xl">Filtros</h2>
              <p className="text-sm text-slate-500">Refine os indicadores por operação.</p>
            </div>
            <button
              onClick={() => {
                setSectorFilter("Todos")
                setCategoryFilter("Todas")
                setOriginFilter("Todas")
                setStatusFilter("Todos")
              }}
              className="ls-secondary-btn inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-bold"
            >
              Limpar filtros
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-600">Setor</span>
              <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="ls-input mt-2 h-11 w-full rounded-2xl border px-4">
                <option value="Todos">Todos setores</option>
                {uniqueSectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-600">Categoria</span>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="ls-input mt-2 h-11 w-full rounded-2xl border px-4">
                <option value="Todas">Todas categorias</option>
                {uniqueCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-600">Origem</span>
              <select value={originFilter} onChange={(e) => setOriginFilter(e.target.value)} className="ls-input mt-2 h-11 w-full rounded-2xl border px-4">
                <option value="Todas">Todas origens</option>
                <option value="Base">Base</option>
                <option value="Offshore">Offshore</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-600">Status</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="ls-input mt-2 h-11 w-full rounded-2xl border px-4">
                <option value="Todos">Todos status</option>
                <option value="Aberto">Aberto</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Aguardando usuário">Aguardando usuário</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Status</h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatsCard title="Total" value={String(totalTickets)} tone="neutral" />
            <StatsCard title="Abertos" value={String(openTickets)} tone="warning" />
            <StatsCard title="Em andamento" value={String(progressTickets)} tone="info" />
            <StatsCard title="Aguardando usuário" value={String(waitingUserTickets)} tone="danger" />
            <StatsCard title="Finalizados" value={String(finishedTickets)} tone="success" />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Origem</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatsCard title="Offshore" value={String(offshoreTickets)} tone="danger" />
            <StatsCard title="Base" value={String(baseTickets)} tone="base" />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="ls-product-card rounded-[2rem] p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="ls-section-title text-xl">Por setor</h2>
                <p className="text-sm text-slate-500">Volume por área.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200">{filteredTickets.length} itens</span>
            </div>
            <div className="mt-5 h-[320px] min-h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketsBySector}>
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#475569", fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: "#475569", fontSize: 12 }} />
                  <Tooltip contentStyle={chartTooltip} labelStyle={{ color: "#101828", fontWeight: 700 }} />
                  <Bar dataKey="total" fill="#2563EB" radius={[14, 14, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="ls-product-card rounded-[2rem] p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="ls-section-title text-xl">Por categoria</h2>
                <p className="text-sm text-slate-500">Tipos de demanda.</p>
              </div>
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 ring-1 ring-cyan-200">{uniqueCategories.length} categorias</span>
            </div>
            <div className="mt-5 h-[320px] min-h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketsByCategory}>
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#475569", fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: "#475569", fontSize: 12 }} />
                  <Tooltip contentStyle={chartTooltip} labelStyle={{ color: "#101828", fontWeight: 700 }} />
                  <Bar dataKey="total" fill="#0891B2" radius={[14, 14, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="ls-product-card rounded-[2rem] p-4 sm:p-6">
            <h2 className="ls-section-title text-xl">Por status</h2>
            <p className="text-sm text-slate-500">Distribuição da fila.</p>
            <div className="mt-5 h-[320px] min-h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ticketsByStatus} dataKey="total" nameKey="name" outerRadius={105} innerRadius={58} paddingAngle={4} label>
                    <Cell fill="#3B82F6" />
                    <Cell fill="#F59E0B" />
                    <Cell fill="#FB923C" />
                    <Cell fill="#10B981" />
                  </Pie>
                  <Tooltip contentStyle={chartTooltip} labelStyle={{ color: "#101828", fontWeight: 700 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="ls-product-card rounded-[2rem] p-4 sm:p-6">
            <h2 className="ls-section-title text-xl">Base x Offshore</h2>
            <p className="text-sm text-slate-500">Origem dos chamados.</p>
            <div className="mt-5 h-[320px] min-h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ticketsByOrigin} dataKey="total" nameKey="name" outerRadius={105} innerRadius={58} paddingAngle={4} label>
                    <Cell fill="#2563EB" />
                    <Cell fill="#E11D48" />
                  </Pie>
                  <Tooltip contentStyle={chartTooltip} labelStyle={{ color: "#101828", fontWeight: 700 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
