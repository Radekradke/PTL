import type { CSSProperties } from "react"
import { useEffect, useMemo, useState } from "react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { AppLayout } from "@/components/layout/AppLayout"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { useNotifications } from "@/contexts/NotificationContext"


type ChartDatum = {
  name: string
  total: number
}

function hasChartData(data: ChartDatum[]) {
  return data.some((item) => item.total > 0)
}

function EmptyChartState() {
  return (
    <div className="flex h-full min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-[#CFE2D8] bg-[#F8FCFA] px-5 text-center sm:min-h-[220px] sm:rounded-3xl">
      <div>
        <div className="mx-auto mb-3 h-8 w-8 rounded-2xl bg-[#ECFBF3] ring-1 ring-[#BFEFD7]" />
        <p className="text-sm font-black text-[#073B2A]">Sem dados para exibir</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Ajuste os filtros ou aguarde novos chamados entrarem.</p>
      </div>
    </div>
  )
}

function ChartLegend({ data, colors }: { data: ChartDatum[]; colors: string[] }) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {data.map((item, index) => (
        <div key={item.name} className="flex items-center justify-between gap-3 rounded-2xl border border-[#DDE8E2] bg-white px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
            <span className="truncate text-xs font-bold text-slate-600">{item.name}</span>
          </div>
          <span className="text-xs font-black text-[#073B2A]">{item.total}</span>
        </div>
      ))}
    </div>
  )
}

function MobileDistributionSummary({ data, colors }: { data: ChartDatum[]; colors: string[] }) {
  const total = data.reduce((sum, item) => sum + item.total, 0)

  if (total <= 0) return <EmptyChartState />

  return (
    <div className="mt-4 sm:hidden">
      <div className="flex h-4 overflow-hidden rounded-full border border-[#DDE8E2] bg-[#F1F5F9]">
        {data.map((item, index) => {
          const percent = (item.total / total) * 100

          return (
            <span
              key={item.name}
              className="h-full min-w-[6px]"
              style={{ width: `${percent}%`, backgroundColor: colors[index % colors.length] }}
              title={`${item.name}: ${item.total}`}
            />
          )
        })}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        {data.map((item, index) => {
          const percent = Math.round((item.total / total) * 100)

          return (
            <div key={item.name} className="flex items-center justify-between gap-3 rounded-2xl border border-[#DDE8E2] bg-white px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                <span className="truncate text-xs font-bold text-slate-600">{item.name}</span>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-xs font-black text-[#073B2A]">{item.total}</span>
                <span className="ml-1 text-[10px] font-bold text-slate-400">{percent}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MobileBarChart({
  data,
  fill,
  tooltipStyle,
}: {
  data: ChartDatum[]
  fill: string
  tooltipStyle: CSSProperties
}) {
  const chartWidth = Math.max(data.length * 110, 560)

  if (!hasChartData(data)) return <EmptyChartState />

  return (
    <div className="ls-chart-scroll mt-4 sm:mt-5 overflow-x-auto overflow-y-hidden pb-3 [-webkit-overflow-scrolling:touch]">
      <div style={{ width: chartWidth }} className="h-[280px] sm:h-80 lg:h-[320px] lg:w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 18, left: -16, bottom: 44 }}>
            <XAxis
              dataKey="name"
              stroke="#94A3B8"
              interval={0}
              height={72}
              tick={{ fill: "#475569", fontSize: 11 }}
              angle={-24}
              textAnchor="end"
            />
            <YAxis allowDecimals={false} stroke="#94A3B8" tick={{ fill: "#475569", fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,168,89,0.08)" }} />
            <Bar dataKey="total" fill={fill} radius={[12, 12, 4, 4]} minPointSize={4} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
        {data.map((item) => (
          <div key={item.name} className="flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-[#DDE8E2] bg-white px-3 py-2">
            <span className="truncate text-xs font-bold text-slate-600">{item.name}</span>
            <span className="text-xs font-black text-[#073B2A]">{item.total}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MobilePieChart({
  data,
  colors,
  tooltipStyle,
}: {
  data: ChartDatum[]
  colors: string[]
  tooltipStyle: CSSProperties
}) {
  if (!hasChartData(data)) return <EmptyChartState />

  return (
    <>
      <MobileDistributionSummary data={data} colors={colors} />

      <div className="mt-4 hidden h-[240px] w-full sm:mt-5 sm:block sm:h-80 lg:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="76%"
              innerRadius="42%"
              paddingAngle={4}
              label={false}
              isAnimationActive={false}
            >
              {data.map((item, index) => (
                <Cell key={item.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="hidden sm:block">
        <ChartLegend data={data} colors={colors} />
      </div>
    </>
  )
}


export function Dashboard() {
  const { tickets } = useNotifications()
  const [sectorFilter, setSectorFilter] = useState("Todos")
  const [categoryFilter, setCategoryFilter] = useState("Todas")
  const [originFilter, setOriginFilter] = useState("Todas")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [filtersOpen, setFiltersOpen] = useState(false)

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
    border: "1px solid #DDE8E2",
    color: "#111827",
    boxShadow: "0 18px 45px rgba(16, 42, 67, 0.12)",
  }

  return (
    <AppLayout>
      <div className="ls-page-shell">
        <section className="ls-hero-clean p-3 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-3 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#00A859] sm:text-xs sm:tracking-[0.22em]">Visão geral</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.045em] text-[#111827] sm:mt-2 sm:text-4xl sm:tracking-[-0.06em] lg:text-5xl">Dashboard</h1>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-[#64748B] sm:mt-3 sm:text-sm sm:leading-6">Indicadores principais, filtros e gráficos para leitura rápida da operação.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
              <div className="rounded-2xl sm:rounded-3xl border border-[#DDE8E2] bg-white p-3 sm:p-4 text-center shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Filtrados</p>
                <p className="mt-1 text-xl sm:text-2xl font-black text-[#111827]">{filteredTickets.length}</p>
              </div>
              <div className="rounded-2xl sm:rounded-3xl border border-[#DDE8E2] bg-white p-3 sm:p-4 text-center shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.14em] text-[#00A859]">Setores</p>
                <p className="mt-1 text-xl sm:text-2xl font-black text-[#073B2A]">{uniqueSectors.length}</p>
              </div>
              <div className="rounded-2xl sm:rounded-3xl border border-[#DDE8E2] bg-white p-3 sm:p-4 text-center shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.14em] text-[#102A43]">Categorias</p>
                <p className="mt-1 text-xl sm:text-2xl font-black text-[#102A43]">{uniqueCategories.length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="ls-card p-3 sm:p-4 lg:p-5">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h2 className="ls-section-title text-base sm:text-lg lg:text-xl">Filtros <span className="ls-help" title="Refina todos os cards e gráficos desta tela.">?</span></h2>
              <p className="text-xs sm:text-sm text-slate-500">Segmentação rápida dos indicadores.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <button onClick={() => setFiltersOpen((open) => !open)} className="ls-button-secondary h-10 px-4 text-xs font-bold sm:hidden">
                {filtersOpen ? "Ocultar" : "Filtros"}
              </button>
              <button onClick={() => { setSectorFilter("Todos"); setCategoryFilter("Todas"); setOriginFilter("Todas"); setStatusFilter("Todos") }} className="ls-button-secondary h-10 sm:h-11 px-4 sm:px-5 text-xs sm:text-sm font-bold whitespace-nowrap">Limpar</button>
            </div>
          </div>
          <div className={`${filtersOpen ? "grid animate-in fade-in-0 slide-in-from-top-1 duration-200" : "hidden"} mt-3 gap-2 sm:mt-4 sm:grid sm:gap-3 sm:grid-cols-2 lg:mt-5 lg:grid-cols-5`}>
            <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="ls-input text-sm"><option value="Todos">Todos setores</option>{uniqueSectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}</select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="ls-input text-sm"><option value="Todas">Todas categorias</option>{uniqueCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
            <select value={originFilter} onChange={(e) => setOriginFilter(e.target.value)} className="ls-input text-sm"><option value="Todas">Todas origens</option><option value="Base">Base</option><option value="Offshore">Offshore</option></select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="ls-input text-sm"><option value="Todos">Todos status</option><option value="Aberto">Aberto</option><option value="Em andamento">Em andamento</option><option value="Aguardando usuário">Aguardando usuário</option><option value="Finalizado">Finalizado</option></select>
          </div>
        </section>

        <section className="space-y-2 sm:space-y-3 lg:space-y-4">
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

        <section className="space-y-2 sm:space-y-3 lg:space-y-4">
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
          <div className="hidden gap-2 sm:grid sm:gap-3 lg:gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <StatsCard title="Offshore" value={String(offshoreTickets)} tone="danger" />
            <StatsCard title="Base" value={String(baseTickets)} tone="base" />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
          <div className="ls-card p-3 sm:p-4 lg:p-6">
            <h2 className="ls-section-title text-lg sm:text-xl">Por setor</h2>
            <p className="text-xs sm:text-sm text-slate-500">Volume por área.</p>
            <MobileBarChart data={ticketsBySector} fill="#00A859" tooltipStyle={tooltipStyle} />
          </div>
          <div className="ls-card p-3 sm:p-4 lg:p-6">
            <h2 className="ls-section-title text-lg sm:text-xl">Por categoria</h2>
            <p className="text-xs sm:text-sm text-slate-500">Tipos de demanda.</p>
            <MobileBarChart data={ticketsByCategory} fill="#102A43" tooltipStyle={tooltipStyle} />
          </div>
          <div className="ls-card p-3 sm:p-4 lg:p-6">
            <h2 className="ls-section-title text-lg sm:text-xl">Por status</h2>
            <p className="text-xs sm:text-sm text-slate-500">Distribuição da fila.</p>
            <MobilePieChart data={ticketsByStatus} colors={["#4F93D2", "#F59E0B", "#F97316", "#00A859"]} tooltipStyle={tooltipStyle} />
          </div>
          <div className="ls-card p-3 sm:p-4 lg:p-6">
            <h2 className="ls-section-title text-lg sm:text-xl">Base x Offshore</h2>
            <p className="text-xs sm:text-sm text-slate-500">Origem dos chamados.</p>
            <MobilePieChart data={ticketsByOrigin} colors={["#102A43", "#E11D48"]} tooltipStyle={tooltipStyle} />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
