import { useMemo, useState } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { AreaTrend } from "@/components/dashboard/AreaTrend"
import { Reveal } from "@/components/ui/reveal"
import { useNotifications } from "@/contexts/NotificationContext"
import { useSectorColors } from "@/lib/sectorColors"

type Tone = "neutral" | "warning" | "info" | "success"

const toneChip: Record<Tone, string> = {
  neutral: "bg-zinc-100 text-zinc-600",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-sky-50 text-sky-700",
  success: "bg-emerald-50 text-emerald-700",
}
const toneValue: Record<Tone, string> = {
  neutral: "text-zinc-900",
  warning: "text-amber-600",
  info: "text-sky-600",
  success: "text-emerald-600",
}

function KpiCard({ label, value, tone, hint }: { label: string; value: number; tone: Tone; hint: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--hairline)] bg-white p-5 shadow-[var(--shadow-sm)] transition-colors hover:border-[#00A859]/35">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">{label}</p>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <p className={`ls-num text-3xl font-bold ${toneValue[tone]}`}>{value}</p>
        <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${toneChip[tone]}`}>{hint}</span>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { tickets } = useNotifications()
  const sectorColors = useSectorColors()
  const [sectorFilter, setSectorFilter] = useState("Todos")
  const [categoryFilter, setCategoryFilter] = useState("Todas")
  const [originFilter, setOriginFilter] = useState("Todas")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const hasActiveFilters = sectorFilter !== "Todos" || categoryFilter !== "Todas" || originFilter !== "Todas" || statusFilter !== "Todos"

  const filtered = useMemo(() => tickets.filter((t) => {
    return (sectorFilter === "Todos" || t.sector === sectorFilter)
      && (categoryFilter === "Todas" || t.category === categoryFilter)
      && (originFilter === "Todas" || t.origin === originFilter)
      && (statusFilter === "Todos" || t.status === statusFilter)
  }), [tickets, sectorFilter, categoryFilter, originFilter, statusFilter])

  const total = filtered.length
  const open = filtered.filter((t) => t.status === "Aberto").length
  const progress = filtered.filter((t) => t.status === "Em andamento").length
  const waiting = filtered.filter((t) => t.status === "Aguardando usuário").length
  const finished = filtered.filter((t) => t.status === "Finalizado").length
  const operational = filtered.filter((t) => t.origin === "Operacional").length
  const administrative = filtered.filter((t) => t.origin === "Administrativo").length

  const uniqueSectors = useMemo(() => Array.from(new Set(tickets.map((t) => t.sector))).filter(Boolean), [tickets])
  const uniqueCategories = useMemo(() => Array.from(new Set(tickets.map((t) => t.category))).filter(Boolean), [tickets])

  const byCategory = useMemo(
    () => uniqueCategories.map((c) => ({ name: c, total: filtered.filter((t) => t.category === c).length })).filter((d) => d.total > 0),
    [filtered, uniqueCategories],
  )
  const bySector = useMemo(
    () => uniqueSectors.map((s) => ({ name: s, total: filtered.filter((t) => t.sector === s).length })).filter((d) => d.total > 0),
    [filtered, uniqueSectors],
  )
  const maxSector = Math.max(1, ...bySector.map((d) => d.total))

  const finishRate = total > 0 ? Math.round((finished / total) * 100) : 0
  const opPct = total > 0 ? Math.round((operational / total) * 100) : 0

  return (
    <AppLayout>
      <div className="ls-page-shell">
        <Reveal>
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-[-0.05em] text-[color:var(--foreground)] sm:text-4xl">Dashboard</h1>
              <p className="mt-1.5 text-sm text-[color:var(--muted-foreground)]">Indicadores e leitura rápida da operação.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFiltersOpen((o) => !o)} className="ls-button-secondary h-10 px-4 text-xs sm:hidden">
                {filtersOpen ? "Ocultar filtros" : "Filtros"}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={() => { setSectorFilter("Todos"); setCategoryFilter("Todas"); setOriginFilter("Todas"); setStatusFilter("Todos") }}
                  className="ls-button-secondary h-10 px-4 text-xs text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </header>
        </Reveal>

        {/* Filtros */}
        <Reveal delay={0.04}>
          <section className={`${filtersOpen ? "grid" : "hidden"} gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-4`}>
            <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="ls-input text-sm"><option value="Todos">Todos setores</option>{uniqueSectors.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="ls-input text-sm"><option value="Todas">Todas categorias</option>{uniqueCategories.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            <select value={originFilter} onChange={(e) => setOriginFilter(e.target.value)} className="ls-input text-sm"><option value="Todas">Todas origens</option><option value="Administrativo">Administrativo</option><option value="Operacional">Operacional</option></select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="ls-input text-sm"><option value="Todos">Todos status</option><option value="Aberto">Aberto</option><option value="Em andamento">Em andamento</option><option value="Aguardando usuário">Aguardando usuário</option><option value="Finalizado">Finalizado</option></select>
          </section>
        </Reveal>

        {/* KPIs */}
        <Reveal delay={0.08}>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <KpiCard label="Total" value={total} tone="neutral" hint="chamados" />
            <KpiCard label="Abertos" value={open} tone="warning" hint="na fila" />
            <KpiCard label="Em andamento" value={progress} tone="info" hint="ativos" />
            <KpiCard label="Finalizados" value={finished} tone="success" hint="concluídos" />
          </div>
        </Reveal>

        {/* Gráfico principal + meta/insight */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Reveal delay={0.12} className="lg:col-span-2">
            <section className="ls-card h-full p-5 sm:p-6">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h2 className="ls-section-title text-lg">Volume por categoria</h2>
                  <p className="text-sm text-[color:var(--muted-foreground)]">Distribuição dos chamados por tipo de demanda.</p>
                </div>
              </div>
              <AreaTrend data={byCategory} height={300} />
            </section>
          </Reveal>

          <div className="flex flex-col gap-4">
            <Reveal delay={0.16}>
              <section className="ls-card-dark p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100/50">Meta operacional</p>
                <h3 className="mt-1 text-xl font-bold tracking-tight text-emerald-50">Taxa de finalização</h3>
                <div className="mt-8">
                  <div className="mb-2 flex items-end justify-between">
                    <span className="ls-num text-3xl font-semibold text-emerald-50">{finishRate}%</span>
                    <span className="mb-1 text-xs font-medium text-emerald-100/60">{finished} de {total}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[#39D98A] transition-all" style={{ width: `${finishRate}%` }} />
                  </div>
                </div>
              </section>
            </Reveal>

            <Reveal delay={0.2}>
              <section className="ls-card p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Origem</p>
                <h3 className="mt-1 text-base font-bold text-[color:var(--foreground)]">Operacional x Administrativo</h3>
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                      <span className="text-rose-600">Operacional</span>
                      <span className="ls-num text-zinc-500">{operational} · {opPct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div className="h-full rounded-full bg-rose-500" style={{ width: `${opPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#0B3D29]">Administrativo</span>
                      <span className="ls-num text-zinc-500">{administrative} · {100 - opPct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div className="h-full rounded-full bg-[#00A859]" style={{ width: `${100 - opPct}%` }} />
                    </div>
                  </div>
                  {waiting > 0 && (
                    <p className="pt-1 text-xs text-[color:var(--muted-foreground)]">
                      <span className="font-semibold text-amber-600">{waiting}</span> chamado(s) aguardando o usuário.
                    </p>
                  )}
                </div>
              </section>
            </Reveal>
          </div>
        </div>

        {/* Breakdown por setor */}
        <Reveal delay={0.24}>
          <section className="ls-card p-5 sm:p-6">
            <h2 className="ls-section-title text-lg">Por setor</h2>
            <p className="text-sm text-[color:var(--muted-foreground)]">Volume de chamados por área responsável.</p>
            <div className="mt-4 space-y-3">
              {bySector.length === 0 && <p className="py-3 text-sm text-[color:var(--muted-foreground)]">Sem dados para exibir.</p>}
              {bySector.map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm font-semibold text-[color:var(--foreground)]" title={s.name}>{s.name}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(s.total / maxSector) * 100}%`, background: sectorColors[s.name] || "#00A859" }}
                    />
                  </div>
                  <span className="ls-num w-6 shrink-0 text-right text-sm font-bold text-[color:var(--foreground)]">{s.total}</span>
                </div>
              ))}
            </div>
          </section>
        </Reveal>
      </div>
    </AppLayout>
  )
}
