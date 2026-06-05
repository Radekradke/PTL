import { useEffect, useMemo, useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import { AppLayout } from "@/components/layout/AppLayout"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PageLoader } from "@/components/ui/PageLoader"
import { FileSpreadsheet, Download, RotateCcw, Search, Calendar, FileText } from "lucide-react"
import { apiFetch } from "@/services/api"

type Ticket = {
  id: number
  user: string
  sector: string
  category: string
  status: string
  origin: string
  createdAt: string
  description: string
  technicalResponse: string
  archived: boolean
}

export function ReportsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sectorFilter, setSectorFilter] = useState("Todos")
  const [categoryFilter, setCategoryFilter] = useState("Todas")
  const [originFilter, setOriginFilter] = useState("Todas")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => { loadTickets() }, [])

  async function loadTickets() {
    try {
      setLoading(true)
      const response = await apiFetch("/tickets?includeArchived=true")
      const data = await response.json()
      setTickets(data.map((ticket: any) => ({
        id: ticket.id,
        user: ticket.employee?.name || "Sem solicitante",
        sector: ticket.sector?.name || "Sem setor",
        category: ticket.category || "Sem categoria",
        status: ticket.status || "Aberto",
        origin: ticket.origin || "Administrativo",
        description: ticket.description || "",
        technicalResponse: ticket.technicalResponse || "",
        archived: ticket.archived || false,
        createdAt: ticket.createdAt ? new Date(ticket.createdAt).toLocaleString("pt-BR") : new Date().toLocaleString("pt-BR"),
      })))
    } catch (error) {
      console.error("Erro ao carregar tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  function parseBrazilianDate(date: string) {
    const [datePart] = date.split(", ")
    const [day, month, year] = datePart.split("/")
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  const sectors = useMemo(() => Array.from(new Set(tickets.map((t) => t.sector))).filter(Boolean), [tickets])
  const categories = useMemo(() => Array.from(new Set(tickets.map((t) => t.category))).filter(Boolean), [tickets])

  const filteredTickets = useMemo(() => tickets.filter((ticket) => {
    const ticketDate = parseBrazilianDate(ticket.createdAt)
    const matchesSearch = !search || ticket.user.toLowerCase().includes(search.toLowerCase()) || ticket.description.toLowerCase().includes(search.toLowerCase()) || ticket.category.toLowerCase().includes(search.toLowerCase())
    const matchesSector = sectorFilter === "Todos" || ticket.sector === sectorFilter
    const matchesCategory = categoryFilter === "Todas" || ticket.category === categoryFilter
    const matchesOrigin = originFilter === "Todas" || ticket.origin === originFilter
    const matchesStatus = statusFilter === "Todos" || ticket.status === statusFilter
    const matchesStartDate = !startDate || ticketDate >= new Date(startDate)
    const matchesEndDate = !endDate || ticketDate <= new Date(endDate)
    return matchesSearch && matchesSector && matchesCategory && matchesOrigin && matchesStatus && matchesStartDate && matchesEndDate
  }), [tickets, search, sectorFilter, categoryFilter, originFilter, statusFilter, startDate, endDate])

  const totalFilteredTickets = filteredTickets.length
  const openFilteredTickets = filteredTickets.filter((ticket) => ticket.status === "Aberto").length
  const progressFilteredTickets = filteredTickets.filter((ticket) => ticket.status === "Em andamento").length
  const waitingUserFilteredTickets = filteredTickets.filter((ticket) => ticket.status === "Aguardando usuário").length
  const finishedFilteredTickets = filteredTickets.filter((ticket) => ticket.status === "Finalizado").length
  const offshoreFilteredTickets = filteredTickets.filter((ticket) => ticket.origin === "Operacional").length
  const baseFilteredTickets = filteredTickets.filter((ticket) => ticket.origin === "Administrativo").length

  function getFiltersSummary() {
    const filters = []
    if (search) filters.push(`Busca: "${search}"`)
    if (sectorFilter !== "Todos") filters.push(`Setor: ${sectorFilter}`)
    if (categoryFilter !== "Todas") filters.push(`Categoria: ${categoryFilter}`)
    if (originFilter !== "Todas") filters.push(`Origem: ${originFilter}`)
    if (statusFilter !== "Todos") filters.push(`Status: ${statusFilter}`)
    if (startDate || endDate) filters.push(`Período: ${startDate || "início"} até ${endDate || "hoje"}`)
    return filters.length > 0 ? filters.join(", ") : "Nenhum filtro aplicado"
  }

  function clearFilters() {
    setSearch(""); setSectorFilter("Todos"); setCategoryFilter("Todas"); setOriginFilter("Todas"); setStatusFilter("Todos"); setStartDate(""); setEndDate("")
  }

  function exportPDF() {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("Relatório de Chamados - Lifting Support", 14, 20)
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 28)
    doc.text(`Filtros aplicados: ${getFiltersSummary()}`, 14, 34)
    doc.text(`Total de chamados: ${filteredTickets.length}`, 14, 40)
    autoTable(doc, {
      startY: 48,
      head: [["ID", "Solicitante", "Setor", "Categoria", "Origem", "Status", "Arquivado", "Criado em"]],
      body: filteredTickets.map((ticket) => [`#${ticket.id}`, ticket.user, ticket.sector, ticket.category, ticket.origin, ticket.status, ticket.archived ? "Sim" : "Não", ticket.createdAt]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [7, 59, 42], textColor: 255 },
    })
    doc.save(`relatorio-chamados-lifting-${new Date().toISOString().split("T")[0]}.pdf`)
  }

  function exportExcel() {
    const data = filteredTickets.map((ticket) => ({ ID: ticket.id, Solicitante: ticket.user, Setor: ticket.sector, Categoria: ticket.category, Origem: ticket.origin, Status: ticket.status, Arquivado: ticket.archived ? "Sim" : "Não", "Criado em": ticket.createdAt, Descrição: ticket.description, "Resposta técnica": ticket.technicalResponse }))
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Chamados")
    XLSX.writeFile(workbook, `relatorio-chamados-lifting-${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "Aberto": return "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
      case "Em andamento": return "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
      case "Aguardando usuário": return "bg-orange-50 text-orange-700 ring-1 ring-orange-200"
      case "Finalizado": return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      default: return "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="ls-page-shell">
          <div className="rounded-3xl border border-[#DDE8E2] bg-white/90 shadow-sm">
            <PageLoader message="Carregando relatórios..." />
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="ls-page-shell py-2">
        <section className="ls-hero-clean p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#00A859]">Central de relatórios</p>
              <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] text-[#111827] sm:text-5xl">Relatórios</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B] sm:text-base">Filtre, exporte e acompanhe os chamados com leitura rápida.</p>
            </div>
            <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
              <Button onClick={exportPDF} className="ls-button-primary h-12 px-5 font-black"><Download size={16} className="mr-2" /> Gerar PDF</Button>
              <Button onClick={exportExcel} className="h-12 rounded-2xl border border-[#DDE8E2] bg-white px-5 font-black text-[#073B2A] shadow-sm hover:bg-[#ECFBF3]"><FileSpreadsheet size={16} className="mr-2" /> Gerar Excel</Button>
            </div>
          </div>
        </section>

        <section className="ls-card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-[#ECFBF3] p-2 text-[#00A859]"><FileText size={20} /></span>
            <h2 className="ls-section-title text-xl">Filtros do relatório</h2>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-4">
            <label className="space-y-2"><span className="flex items-center gap-2 text-sm font-semibold text-slate-600"><Search size={14}/>Buscar</span><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome, descrição ou categoria" className="ls-input" /></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-slate-600">Setor</span><select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="ls-input"><option value="Todos">Todos</option>{sectors.map((sector) => <option key={sector}>{sector}</option>)}</select></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-slate-600">Categoria</span><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="ls-input"><option value="Todas">Todas</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-slate-600">Origem</span><select value={originFilter} onChange={(e) => setOriginFilter(e.target.value)} className="ls-input"><option value="Todas">Todas</option><option>Administrativo</option><option>Operacional</option></select></label>
            <label className="space-y-2"><span className="text-sm font-semibold text-slate-600">Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="ls-input"><option value="Todos">Todos</option><option>Aberto</option><option>Em andamento</option><option>Aguardando usuário</option><option>Finalizado</option></select></label>
            <label className="space-y-2"><span className="flex items-center gap-2 text-sm font-semibold text-slate-600"><Calendar size={14}/>Data Inicial</span><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="ls-input" /></label>
            <label className="space-y-2"><span className="flex items-center gap-2 text-sm font-semibold text-slate-600"><Calendar size={14}/>Data Final</span><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="ls-input" /></label>
          </div>
          <div className="mt-5 flex flex-col gap-4 rounded-3xl border border-[#DDE8E2] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-sm text-slate-600"><strong className="text-[#111827]">{filteredTickets.length}</strong> chamados encontrados <div className="mt-1 text-xs text-slate-500">{getFiltersSummary()}</div></div>
            <Button onClick={clearFilters} variant="outline" className="h-11 rounded-2xl border-[#DDE8E2] bg-white text-[#073B2A] hover:bg-[#ECFBF3]"><RotateCcw size={16} className="mr-2"/> Limpar filtros</Button>
          </div>
        </section>

        <section className="space-y-4"><h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Resumo por status</h3><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><StatsCard title="Total filtrado" value={String(totalFilteredTickets)} tone="neutral" /><StatsCard title="Abertos" value={String(openFilteredTickets)} tone="warning" /><StatsCard title="Em andamento" value={String(progressFilteredTickets)} tone="info" /><StatsCard title="Aguardando usuário" value={String(waitingUserFilteredTickets)} tone="danger" /><StatsCard title="Finalizados" value={String(finishedFilteredTickets)} tone="success" /></div></section>
        <section className="space-y-4"><h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Resumo por origem</h3><div className="grid gap-4 sm:grid-cols-2"><StatsCard title="Operacional" value={String(offshoreFilteredTickets)} tone="danger" /><StatsCard title="Administrativo" value={String(baseFilteredTickets)} tone="base" /></div></section>

        <section className="ls-card p-4 sm:p-6">
          <h2 className="ls-section-title text-xl">Preview dos dados</h2>
          <div className="mt-5 overflow-x-auto rounded-3xl border border-[#DDE8E2] bg-white">
            <table className="min-w-[820px] w-full text-sm"><thead className="bg-[#F8FCFA]"><tr className="border-b border-[#DDE8E2]"><th className="p-3 text-left text-slate-500">ID</th><th className="p-3 text-left text-slate-500">Solicitante</th><th className="p-3 text-left text-slate-500">Setor</th><th className="p-3 text-left text-slate-500">Categoria</th><th className="p-3 text-left text-slate-500">Status</th><th className="p-3 text-left text-slate-500">Origem</th><th className="p-3 text-left text-slate-500">Criado em</th></tr></thead><tbody>{filteredTickets.slice(0,20).map((ticket) => <tr key={ticket.id} className="border-b border-[#DDE8E2] transition hover:bg-[#F8FCFA]"><td className="p-3 text-slate-900">#{ticket.id}</td><td className="p-3 text-slate-900">{ticket.user}</td><td className="p-3 text-slate-700">{ticket.sector}</td><td className="p-3 text-slate-700">{ticket.category}</td><td className="p-3"><span className={`status-badge-animated inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getStatusColor(ticket.status)}`}>{ticket.status}</span></td><td className="p-3 text-slate-700">{ticket.origin}</td><td className="p-3 text-slate-700">{ticket.createdAt}</td></tr>)}</tbody></table>
          </div>
          {filteredTickets.length > 20 && <div className="p-3 text-center text-slate-500">... e mais {filteredTickets.length - 20} registros no export</div>}
          {filteredTickets.length === 0 && <div className="p-8 text-center text-slate-500">Nenhum chamado encontrado com os filtros aplicados.</div>}
        </section>
      </div>
    </AppLayout>
  )
}
