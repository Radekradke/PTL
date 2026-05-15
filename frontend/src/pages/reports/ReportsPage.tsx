import { useEffect, useMemo, useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import { AppLayout } from "@/components/layout/AppLayout"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FileText, Download, Calendar, Search, FileSpreadsheet, RotateCcw } from "lucide-react"
import { API_URL } from "@/services/api"

type Ticket = {
  id: number
  user: string
  sector: string
  category: string
  status: string
  origin: string
  priority: string
  createdAt: string
  description: string
  technicalResponse: string
}

export function ReportsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sectorFilter, setSectorFilter] = useState("Todos")
  const [categoryFilter, setCategoryFilter] = useState("Todas")
  const [originFilter, setOriginFilter] = useState("Todas")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [priorityFilter, setPriorityFilter] = useState("Todas")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => { loadTickets() }, [])

  async function loadTickets() {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/tickets`)
      const data = await response.json()
      const formattedTickets = data.map((ticket: any) => ({
        id: ticket.id,
        user: ticket.employee?.name || "Sem solicitante",
        sector: ticket.sector?.name || "Sem setor",
        category: ticket.category || "Sem categoria",
        status: ticket.status || "Aberto",
        origin: ticket.origin || "Base",
        priority: ticket.priority || "Normal",
        description: ticket.description || "",
        technicalResponse: ticket.technicalResponse || "",
        createdAt: ticket.createdAt ? new Date(ticket.createdAt).toLocaleString("pt-BR") : new Date().toLocaleString("pt-BR"),
      }))
      setTickets(formattedTickets)
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
    const matchesPriority = priorityFilter === "Todas" || ticket.priority === priorityFilter
    const matchesStartDate = !startDate || ticketDate >= new Date(startDate)
    const matchesEndDate = !endDate || ticketDate <= new Date(endDate)
    return matchesSearch && matchesSector && matchesCategory && matchesOrigin && matchesStatus && matchesPriority && matchesStartDate && matchesEndDate
  }), [tickets, search, sectorFilter, categoryFilter, originFilter, statusFilter, priorityFilter, startDate, endDate])

  const totalFilteredTickets = filteredTickets.length
  const openFilteredTickets = filteredTickets.filter((ticket) => ticket.status === "Aberto").length
  const progressFilteredTickets = filteredTickets.filter((ticket) => ticket.status === "Em andamento").length
  const waitingUserFilteredTickets = filteredTickets.filter((ticket) => ticket.status === "Aguardando usuário").length
  const finishedFilteredTickets = filteredTickets.filter((ticket) => ticket.status === "Finalizado").length
  const offshoreFilteredTickets = filteredTickets.filter((ticket) => ticket.origin === "Offshore").length
  const baseFilteredTickets = filteredTickets.filter((ticket) => ticket.origin === "Base").length

  function exportPDF() {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("Relatório de Chamados - Lifting Support", 14, 20)
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 28)
    doc.text(`Total de chamados: ${filteredTickets.length}`, 14, 34)
    autoTable(doc, {
      startY: 42,
      head: [["ID", "Solicitante", "Setor", "Categoria", "Origem", "Status", "Prioridade", "Criado em"]],
      body: filteredTickets.map((ticket) => [`#${ticket.id}`, ticket.user, ticket.sector, ticket.category, ticket.origin, ticket.status, ticket.priority, ticket.createdAt]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    })
    doc.save(`relatorio-chamados-lifting-${new Date().toISOString().split("T")[0]}.pdf`)
  }

  function exportExcel() {
    const data = filteredTickets.map((ticket) => ({
      ID: ticket.id,
      Solicitante: ticket.user,
      Setor: ticket.sector,
      Categoria: ticket.category,
      Origem: ticket.origin,
      Status: ticket.status,
      Prioridade: ticket.priority,
      "Criado em": ticket.createdAt,
      Descrição: ticket.description,
      "Resposta técnica": ticket.technicalResponse,
    }))
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Chamados")
    XLSX.writeFile(workbook, `relatorio-chamados-lifting-${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  function clearFilters() {
    setSearch(""); setSectorFilter("Todos"); setCategoryFilter("Todas"); setOriginFilter("Todas"); setStatusFilter("Todos"); setPriorityFilter("Todas"); setStartDate(""); setEndDate("")
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
    return <AppLayout><div className="flex h-64 items-center justify-center"><div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-600 shadow-sm">Carregando relatórios...</div></div></AppLayout>
  }

  return (
    <AppLayout>
      <div className="ls-page-shell">
        <section className="ls-page-heading">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="ls-kicker">Central de relatórios</p>
              <h1 className="ls-title">Relatórios</h1>
              <p className="ls-description">Filtre chamados, visualize dados e exporte relatórios.</p>
            </div>
            <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
              <Button onClick={exportPDF} className="h-12 rounded-2xl bg-rose-600 px-5 font-bold text-white shadow-sm transition hover:bg-rose-700 whitespace-nowrap"><Download size={16} className="mr-2" /> Gerar PDF</Button>
              <Button onClick={exportExcel} className="h-12 rounded-2xl bg-emerald-600 px-5 font-bold text-white shadow-sm transition hover:bg-emerald-700 whitespace-nowrap"><FileSpreadsheet size={16} className="mr-2" /> Gerar Excel</Button>
            </div>
          </div>
        </section>

        <section className="ls-card p-4 sm:p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="ls-section-title text-xl"><span className="rounded-2xl bg-blue-50 p-2 text-blue-600"><FileText size={18} /></span>Filtros do relatório</h2>
              <p className="mt-1 text-sm text-slate-500">Ajuste os dados antes de exportar.</p>
            </div>
            <Button onClick={clearFilters} variant="outline" className="ls-button-secondary h-11 px-5 font-bold"><RotateCcw size={16} className="mr-2" /> Limpar filtros</Button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <label className="space-y-2"><span className="flex items-center gap-2 text-sm font-medium text-slate-600"><Search size={14} />Buscar</span><Input placeholder="Nome, descrição ou categoria" value={search} onChange={(e) => setSearch(e.target.value)} className="ls-input" /></label>
            <label className="space-y-2"><span className="text-sm font-medium text-slate-600">Setor</span><select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="ls-input w-full"><option value="Todos">Todos</option>{sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}</select></label>
            <label className="space-y-2"><span className="text-sm font-medium text-slate-600">Categoria</span><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="ls-input w-full"><option value="Todas">Todas</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
            <label className="space-y-2"><span className="text-sm font-medium text-slate-600">Origem</span><select value={originFilter} onChange={(e) => setOriginFilter(e.target.value)} className="ls-input w-full"><option value="Todas">Todas</option><option value="Base">Base</option><option value="Offshore">Offshore</option></select></label>
            <label className="space-y-2"><span className="text-sm font-medium text-slate-600">Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="ls-input w-full"><option value="Todos">Todos</option><option value="Aberto">Aberto</option><option value="Em andamento">Em andamento</option><option value="Aguardando usuário">Aguardando usuário</option><option value="Finalizado">Finalizado</option></select></label>
            <label className="space-y-2"><span className="text-sm font-medium text-slate-600">Prioridade</span><select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="ls-input w-full"><option value="Todas">Todas</option><option value="Baixa">Baixa</option><option value="Normal">Normal</option><option value="Alta">Alta</option><option value="Urgente">Urgente</option></select></label>
            <label className="space-y-2"><span className="flex items-center gap-2 text-sm font-medium text-slate-600"><Calendar size={14} />Data inicial</span><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="ls-input" /></label>
            <label className="space-y-2"><span className="flex items-center gap-2 text-sm font-medium text-slate-600"><Calendar size={14} />Data final</span><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="ls-input" /></label>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <strong className="text-slate-950">{filteredTickets.length}</strong> chamados encontrados
          </div>
        </section>

        <section className="space-y-4"><h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Status</h3><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><StatsCard title="Total filtrado" value={String(totalFilteredTickets)} tone="neutral" /><StatsCard title="Abertos" value={String(openFilteredTickets)} tone="warning" /><StatsCard title="Em andamento" value={String(progressFilteredTickets)} tone="info" /><StatsCard title="Aguardando usuário" value={String(waitingUserFilteredTickets)} tone="danger" /><StatsCard title="Finalizados" value={String(finishedFilteredTickets)} tone="success" /></div></section>
        <section className="space-y-4"><h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Origem</h3><div className="grid gap-4 sm:grid-cols-2"><StatsCard title="Offshore" value={String(offshoreFilteredTickets)} tone="danger" /><StatsCard title="Base" value={String(baseFilteredTickets)} tone="base" /></div></section>

        <section className="ls-card p-4 sm:p-5">
          <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">Preview dos dados</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-slate-50"><tr>{["ID", "Solicitante", "Setor", "Categoria", "Status", "Origem", "Prioridade", "Criado em"].map((head) => <th key={head} className="p-3 text-left text-xs font-black uppercase tracking-[0.1em] text-slate-500">{head}</th>)}</tr></thead>
              <tbody>{filteredTickets.slice(0, 20).map((ticket) => <tr key={ticket.id} className="border-t border-slate-100 transition hover:bg-blue-50/40"><td className="p-3 font-bold text-slate-950">#{ticket.id}</td><td className="p-3 text-slate-700">{ticket.user}</td><td className="p-3 text-slate-700">{ticket.sector}</td><td className="p-3 text-slate-700">{ticket.category}</td><td className="p-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getStatusColor(ticket.status)}`}>{ticket.status}</span></td><td className="p-3 text-slate-700">{ticket.origin}</td><td className="p-3 text-slate-700">{ticket.priority}</td><td className="p-3 text-slate-700">{ticket.createdAt}</td></tr>)}</tbody>
            </table>
          </div>
          {filteredTickets.length > 20 && <div className="p-3 text-center text-sm text-slate-500">... e mais {filteredTickets.length - 20} registros no export</div>}
          {filteredTickets.length === 0 && <div className="p-8 text-center text-sm text-slate-500">Nenhum chamado encontrado.</div>}
        </section>
      </div>
    </AppLayout>
  )
}
