import { useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"
import { ClipboardList, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { categoriesByDepartment, type TicketDepartment } from "@/lib/categories"
import { apiFetch } from "@/services/api"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Sector {
  id: number
  name: string
}

interface Employee {
  id: number
  name: string
  sectorId: number
  sector: Sector
}

interface TicketsTableProps {
  tickets: any[]
  onTicketsChange: () => void
}

type SortKey = "id" | "user" | "sector" | "category" | "origin" | "status" | "createdAt"
type SortDir = "asc" | "desc"

function parsePtBrDate(str: string) {
  const [datePart, timePart] = str.split(", ")
  const [day, month, year] = (datePart || "").split("/")
  const [hour, minute] = (timePart || "00:00").split(":")
  return new Date(+year, +month - 1, +day, +hour, +minute).getTime()
}

function FieldCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#DDE7E2] bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#64748B]">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-[#102A43]">{value || "—"}</p>
    </div>
  )
}

function SortableHeader({
  label,
  sortK,
  currentKey,
  dir,
  onClick,
}: {
  label: string
  sortK: SortKey
  currentKey: SortKey
  dir: SortDir
  onClick: (k: SortKey) => void
}) {
  const active = currentKey === sortK
  return (
    <th
      onClick={() => onClick(sortK)}
      className="cursor-pointer select-none whitespace-nowrap px-2 py-2 hover:bg-[#E9FFF3]/70 transition-colors"
    >
      <span className="flex items-center gap-1.5">
        {label}
        {active ? (
          dir === "asc"
            ? <ArrowUp size={12} className="text-[#00A859]" />
            : <ArrowDown size={12} className="text-[#00A859]" />
        ) : (
          <ArrowUpDown size={11} className="text-slate-300" />
        )}
      </span>
    </th>
  )
}

export function TicketsTable({ tickets, onTicketsChange }: TicketsTableProps) {
  const [tableTickets, setTableTickets] = useState<any[]>(tickets)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [employeeId, setEmployeeId] = useState("")
  const [department, setDepartment] = useState<TicketDepartment>("TI")
  const [category, setCategory] = useState("PC")
  const [sectorId, setSectorId] = useState("")
  const [origin, setOrigin] = useState("Administrativo")
  const [description, setDescription] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [originFilter, setOriginFilter] = useState("Todas")
  const [sectorFilter, setSectorFilter] = useState("Todos")
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [ticketMessages, setTicketMessages] = useState<any[]>([])
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [technicalResponse, setTechnicalResponse] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [highlightedTicketIds, setHighlightedTicketIds] = useState<Set<number>>(new Set())
  const knownTicketIds = useRef<Set<number>>(new Set())
  const hasSyncedTickets = useRef(false)

  const [sortKey, setSortKey] = useState<SortKey>("id")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const selectedEmployee = employees.find((employee) => String(employee.id) === employeeId)
  const selectedEmployeeSector = selectedEmployee?.sector

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  function sortList(list: any[]) {
    return [...list].sort((a, b) => {
      let av: any = a[sortKey]
      let bv: any = b[sortKey]

      if (sortKey === "id") {
        av = Number(av)
        bv = Number(bv)
      } else if (sortKey === "createdAt") {
        av = parsePtBrDate(av)
        bv = parsePtBrDate(bv)
      } else {
        av = String(av ?? "").toLowerCase()
        bv = String(bv ?? "").toLowerCase()
      }

      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
  }

  function handleEmployeeChange(value: string) {
    setEmployeeId(value)
    const employee = employees.find((item) => String(item.id) === value)
    if (employee?.sectorId) { setSectorId(String(employee.sectorId)); return }
    if (employee?.sector?.id) { setSectorId(String(employee.sector.id)); return }
    setSectorId("")
  }

  useEffect(() => { loadEmployeesAndSectors() }, [])

  useEffect(() => {
    setTableTickets(tickets)
    const currentIds = new Set(tickets.map((t) => t.id))

    if (!hasSyncedTickets.current) {
      knownTicketIds.current = currentIds
      hasSyncedTickets.current = true
      return
    }

    const newIds = tickets.map((t) => t.id).filter((id) => !knownTicketIds.current.has(id))
    knownTicketIds.current = currentIds
    if (newIds.length === 0) return

    setHighlightedTicketIds(new Set(newIds))
    const timeout = window.setTimeout(() => setHighlightedTicketIds(new Set()), 2200)
    return () => window.clearTimeout(timeout)
  }, [tickets])

  async function loadEmployeesAndSectors() {
    try {
      const [employeesRes, sectorsRes] = await Promise.all([apiFetch("/employees"), apiFetch("/sectors")])
      const employeesData = await employeesRes.json()
      const sectorsData = await sectorsRes.json()
      setEmployees(employeesData)
      setSectors(sectorsData)
      if (employeesData.length > 0) {
        const first = employeesData[0]
        setEmployeeId(String(first.id))
        setSectorId(String(first.sectorId || first.sector?.id || ""))
      } else if (sectorsData.length > 0) {
        setSectorId(String(sectorsData[0].id))
      }
    } catch (error) {
      console.error("Erro ao carregar funcionários e setores:", error)
    }
  }

  function getCurrentDateTime() {
    return new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  async function handleCreateTicket() {
    if (!employeeId || !sectorId || !description) { toast.error("Selecione o funcionário e descreva o problema."); return }
    setIsSubmitting(true)
    try {
      const response = await apiFetch("/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: Number(employeeId), sectorId: Number(sectorId), department, category, origin, description }),
      })
      if (!response.ok) { toast.error("Erro ao criar chamado."); return }
      if (employees.length > 0) {
        const first = employees[0]
        setEmployeeId(String(first.id))
        setSectorId(String(first.sectorId || first.sector?.id || ""))
      } else { setEmployeeId(""); setSectorId("") }
      setDepartment("TI"); setCategory("PC"); setOrigin("Administrativo"); setDescription("")
      onTicketsChange()
    } catch (error) {
      console.error("Erro ao criar chamado:", error)
      toast.error("Erro ao criar chamado.")
    } finally { setIsSubmitting(false) }
  }

  function handleChangeStatus(ticketId: number, newStatus: string) {
    apiFetch(`/tickets/${ticketId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
      .then(() => {
        onTicketsChange()
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: newStatus, timeline: [...(selectedTicket.timeline || []), { date: getCurrentDateTime(), action: `Status alterado para ${newStatus}` }] })
        }
      })
      .catch(() => toast.error("Erro ao alterar status do chamado"))
  }

  function getStatusStyle(status: string) {
    if (status === "Aberto") return "bg-[#EFF6FF] text-[#1D4ED8] ring-1 ring-[#BFDBFE]"
    if (status === "Em andamento") return "bg-[#FFFBEB] text-[#B45309] ring-1 ring-[#FDE68A]"
    if (status === "Aguardando usuário") return "bg-[#FFF7ED] text-[#C2410C] ring-1 ring-[#FED7AA]"
    if (status === "Finalizado") return "bg-[#E9FFF3] text-[#073B2A] ring-1 ring-emerald-200"
    return "bg-[#EAF0ED] text-[#516070] ring-1 ring-[#DDE7E2]"
  }

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [ticketMessages])

  async function loadMessages(ticketId: number) {
    try {
      const response = await apiFetch(`/tickets/${ticketId}/messages`)
      if (response.ok) setTicketMessages(await response.json())
    } catch (error) { console.error("Erro ao carregar mensagens:", error) }
  }

  function handleAddResponse() {
    if (!selectedTicket || !technicalResponse.trim()) return
    apiFetch(`/tickets/${selectedTicket.id}/response`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ technicalResponse: technicalResponse.trim() }),
    })
      .then(() => {
        onTicketsChange()
        loadMessages(selectedTicket.id)
        setSelectedTicket({ ...selectedTicket, technicalResponse: technicalResponse.trim(), status: "Em andamento", timeline: [...(selectedTicket.timeline || []), { date: getCurrentDateTime(), action: "Resposta técnica adicionada" }, { date: getCurrentDateTime(), action: "Status alterado para Em andamento" }] })
        setTechnicalResponse("")
      })
      .catch(() => toast.error("Erro ao adicionar resposta técnica"))
  }

  function handleFinishTicket() {
    if (!selectedTicket) return
    apiFetch(`/tickets/${selectedTicket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Finalizado" }),
    })
      .then(() => { onTicketsChange(); setSelectedTicket(null) })
      .catch(() => toast.error("Erro ao finalizar chamado"))
  }

  function getSlaStatus(ticket: any) {
    if (ticket.status === "Finalizado") return { label: "Concluído", className: "bg-[#E9FFF3] text-[#073B2A] ring-1 ring-emerald-200" }
    if (ticket.origin === "Operacional") return { label: "Operacional", className: "bg-[#FFF1F2] text-[#BE123C] ring-1 ring-[#FECACA]" }
    return { label: "No prazo", className: "bg-[#EAF0ED] text-[#334155] ring-1 ring-[#DDE7E2]" }
  }

  function getTicketAccentColor(ticket: any) {
    if (ticket.status === "Finalizado") return "#00A859"
    if (ticket.status === "Aguardando usuário") return "#F97316"
    if (ticket.status === "Em andamento") return "#2563EB"
    if (ticket.origin === "Operacional") return "#E11D48"
    return "#F59E0B"
  }

  const baseFiltered = tableTickets.filter((ticket) => {
    const matchesSearch =
      ticket.user.toLowerCase().includes(search.toLowerCase()) ||
      ticket.sector.toLowerCase().includes(search.toLowerCase()) ||
      ticket.category.toLowerCase().includes(search.toLowerCase()) ||
      String(ticket.id).includes(search)
    const matchesStatus = statusFilter === "Todos" || ticket.status === statusFilter
    const matchesOrigin = originFilter === "Todas" || ticket.origin === originFilter
    const matchesSector = sectorFilter === "Todos" || ticket.sector === sectorFilter
    return matchesSearch && matchesStatus && matchesOrigin && matchesSector
  })

  const activeFiltered = sortList(baseFiltered.filter((t) => !t.archived))
  const archivedFiltered = sortList(baseFiltered.filter((t) => t.archived))

  const sortProps = { currentKey: sortKey, dir: sortDir, onClick: handleSort }

  function TicketRow({ ticket, dimmed = false }: { ticket: any; dimmed?: boolean }) {
    return (
      <tr
        className={`border-t border-slate-100 transition-all hover:bg-[#E9FFF3]/50 ${highlightedTicketIds.has(ticket.id) ? "ticket-row-new" : ""} ${dimmed ? "opacity-60" : ""}`}
      >
        <td className="px-2 py-2 text-[#111827] whitespace-nowrap">#{ticket.id}</td>
        <td className="px-2 py-2 max-w-[120px] truncate text-[#102A43]">{ticket.user}</td>
        <td className="px-2 py-2 max-w-[100px] truncate text-[#334155]">{ticket.sector}</td>
        <td className="px-2 py-2 text-[#334155] whitespace-nowrap">{ticket.category}</td>
        <td className="px-2 py-2 whitespace-nowrap">
          <span className={`status-badge-animated inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ticket.origin === "Operacional" ? "bg-[#FFF1F2] text-[#BE123C] ring-1 ring-[#FECACA]" : "bg-[#EAF0ED] text-[#334155] ring-1 ring-[#DDE7E2]"}`}>
            {ticket.origin}
          </span>
        </td>
        <td className="px-2 py-2 whitespace-nowrap">
          <span className={`status-badge-animated inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusStyle(ticket.status)}`}>
            {ticket.status}
          </span>
        </td>
        <td className="px-2 py-2 text-xs text-[#64748B] whitespace-nowrap">{ticket.createdAt}</td>
        <td className="px-2 py-2 whitespace-nowrap">
          <select
            value={ticket.status}
            onChange={(e) => handleChangeStatus(ticket.id, e.target.value)}
            className="w-full rounded-xl border border-[#DDE7E2] bg-white px-2 py-1.5 text-xs text-[#102A43] outline-none focus:border-[#00A859]"
          >
            <option>Aberto</option>
            <option>Em andamento</option>
            <option>Aguardando usuário</option>
            <option>Finalizado</option>
          </select>
        </td>
        <td className="px-2 py-2 whitespace-nowrap">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-[#DDE7E2] bg-white px-3 text-xs text-[#334155] hover:bg-[#E9FFF3]"
            onClick={() => { setSelectedTicket(ticket); loadMessages(ticket.id) }}
          >
            Responder
          </Button>
        </td>
      </tr>
    )
  }

  function MobileCard({ ticket, dimmed = false }: { ticket: any; dimmed?: boolean }) {
    return (
      <div
        className={`min-w-0 rounded-2xl border border-l-4 border-[#DDE7E2] bg-white p-4 shadow-sm ${highlightedTicketIds.has(ticket.id) ? "ticket-row-new" : ""} ${dimmed ? "opacity-60" : ""}`}
        className={`rounded-2xl border border-l-4 border-[#DDE7E2] bg-white p-4 shadow-sm ${highlightedTicketIds.has(ticket.id) ? "ticket-row-new" : ""} ${dimmed ? "opacity-60" : ""}`}
        style={{ borderLeftColor: getTicketAccentColor(ticket) }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#00A859]">#{ticket.id}</p>
            <h3 className="mt-1 truncate text-base font-bold text-[#111827]">{ticket.category}</h3>
            <p className="mt-1 break-words text-sm text-[#516070]">{ticket.user} · {ticket.sector}</p>
          </div>
          <span className={`status-badge-animated max-w-[9rem] shrink-0 rounded-full px-2.5 py-1 text-center text-[11px] font-semibold leading-tight ${getStatusStyle(ticket.status)}`}>
            <p className="mt-1 text-sm text-[#516070]">{ticket.user} · {ticket.sector}</p>
          </div>
          <span className={`status-badge-animated shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(ticket.status)}`}>
            {ticket.status}
          </span>
        </div>

        <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-[#334155]">
          {ticket.description || "Sem descrição."}
        </p>
        <p className="mt-2 text-[11px] text-slate-400">{ticket.createdAt}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className={`status-badge-animated rounded-full px-3 py-1.5 font-semibold ${getSlaStatus(ticket).className}`}>
            {getSlaStatus(ticket).label}
          </span>
          <span className="text-[11px] font-bold text-slate-400">{ticket.origin}</span>
        </div>

        <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
          <select
            value={ticket.status}
            onChange={(e) => handleChangeStatus(ticket.id, e.target.value)}
            className="h-11 w-full rounded-2xl border border-[#DDE7E2] bg-white px-3 text-sm text-[#102A43] outline-none focus:border-[#00A859]"
          >
            <option>Aberto</option>
            <option>Em andamento</option>
            <option>Aguardando usuário</option>
            <option>Finalizado</option>
          </select>
          <Button
            variant="outline"
            className="h-11 rounded-2xl border-[#BFEFD7] bg-[#E9FFF3] text-[#073B2A] hover:bg-[#D8FBE8]"
            onClick={() => { setSelectedTicket(ticket); loadMessages(ticket.id) }}
          >
            Ver detalhes
          </Button>
        </div>
      </div>
    )
  }

  const theadClass = "bg-[#F4F8F6] text-[11px] uppercase tracking-[0.1em] text-[#64748B]"

  return (
    <div className="space-y-5">
      {/* ── Barra de filtros e novo chamado ── */}
      <div className="rounded-3xl border border-[#DDE7E2] bg-white/90 p-4 shadow-[0_18px_48px_rgba(7,59,42,0.08)] backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#00A859]">Chamados</p>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-[#073B2A]">Fila de atendimento</h2>
            <p className="mt-1 text-sm text-[#64748B]">Filtre, abra e responda chamados em um só lugar.</p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:shrink-0">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#00A859,#078C4D)] px-5 font-black text-white shadow-[0_16px_36px_rgba(0,168,89,0.26)] hover:bg-[#078C4D] sm:h-11 sm:w-auto whitespace-nowrap">
                  Novo chamado
                </Button>
              </DialogTrigger>

              <DialogContent className="max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-[1.35rem] border border-[#DDE7E2] bg-white p-4 text-[#111827] shadow-[0_24px_70px_rgba(7,59,42,0.16)] sm:max-w-2xl sm:rounded-3xl sm:p-5">
                <DialogHeader className="pr-2">
                  <DialogTitle className="text-lg font-black tracking-[-0.02em] text-[#073B2A]">Novo chamado</DialogTitle>
                </DialogHeader>

                <div className="grid gap-3 sm:gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-[#334155]">Solicitante</label>
                    <select value={employeeId} onChange={(e) => handleEmployeeChange(e.target.value)} className="w-full rounded-2xl border border-[#DDE7E2] bg-white px-4 py-3 text-[#102A43] shadow-sm outline-none focus:border-[#00A859]">
                      <option value="">Selecione um funcionário</option>
                      {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-[#334155]">Departamento responsável</label>
                    <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#DDE7E2] bg-[#F8FAF9] p-1">
                      {(["TI", "RH", "Infraestrutura"] as TicketDepartment[]).map((dept) => (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => {
                            setDepartment(dept)
                            setCategory(categoriesByDepartment[dept][0])
                          }}
                          className={`h-10 rounded-xl text-sm font-black transition ${
                            department === dept
                              ? "bg-[#00A859] text-white shadow-sm"
                              : "text-slate-600 hover:bg-white"
                          }`}
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[#334155]">Setor vinculado</label>
                      <div className="min-h-[48px] rounded-2xl border border-[#DDE7E2] bg-[#F4F8F6] px-4 py-3 text-[#102A43] shadow-sm">
                        {selectedEmployeeSector?.name || sectors.find((s) => String(s.id) === sectorId)?.name || "Selecione um funcionário"}
                      </div>
                      <p className="text-xs text-[#64748B]">Preenchido pelo cadastro do funcionário.</p>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[#334155]">Categoria</label>
                      <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-2xl border border-[#DDE7E2] bg-white px-4 py-3 text-[#102A43] shadow-sm outline-none focus:border-[#00A859]">
                        {categoriesByDepartment[department].map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-[#334155]">Origem</label>
                    <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="w-full rounded-2xl border border-[#DDE7E2] bg-white px-4 py-3 text-[#102A43] shadow-sm outline-none focus:border-[#00A859]">
                      <option>Administrativo</option>
                      <option>Operacional</option>
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-[#334155]">Descrição</label>
                    <Textarea placeholder="Descreva o problema com contexto objetivo..." value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[120px] rounded-2xl border-[#DDE7E2] bg-white text-[#111827] sm:min-h-[140px]" />
                  </div>

                  <Button className="h-11 w-full rounded-2xl bg-[#00A859] text-white hover:bg-[#078C4D] disabled:opacity-50" onClick={handleCreateTicket} disabled={isSubmitting}>
                    {isSubmitting ? "Criando..." : "Abrir chamado"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="h-11 w-full rounded-2xl border-[#BFEFD7] bg-white text-[#073B2A] hover:bg-[#E9FFF3] sm:hidden whitespace-nowrap" onClick={() => setFiltersOpen((o) => !o)}>
              {filtersOpen ? "Ocultar filtros" : "Filtros"}
            </Button>

            <Button variant="outline" className="h-11 w-full rounded-2xl border-[#DDE7E2] bg-white text-[#073B2A] hover:bg-[#F4F8F6] sm:w-auto whitespace-nowrap" onClick={() => { setSearch(""); setStatusFilter("Todos"); setOriginFilter("Todas"); setSectorFilter("Todos") }}>
              Limpar
            </Button>
          </div>
        </div>

        <div className={`${filtersOpen ? "grid animate-in fade-in-0 slide-in-from-top-1 duration-200" : "hidden"} mt-4 gap-3 sm:mt-5 sm:grid sm:grid-cols-2 xl:grid-cols-4`}>
          <Input placeholder="Buscar chamado..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 border-[#DDE7E2] bg-white text-[#111827] xl:col-span-1" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 w-full rounded-2xl border border-[#DDE7E2] bg-white px-4 text-[#102A43] shadow-sm outline-none focus:border-[#00A859]">
            <option value="Todos">Todos status</option>
            <option value="Aberto">Aberto</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Aguardando usuário">Aguardando usuário</option>
            <option value="Finalizado">Finalizado</option>
          </select>
          <select value={originFilter} onChange={(e) => setOriginFilter(e.target.value)} className="h-11 w-full rounded-2xl border border-[#DDE7E2] bg-white px-4 text-[#102A43] shadow-sm outline-none focus:border-[#00A859]">
            <option value="Todas">Todas origens</option>
            <option value="Operacional">Operacional</option>
            <option value="Administrativo">Administrativo</option>
          </select>
          <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="h-11 w-full rounded-2xl border border-[#DDE7E2] bg-white px-4 text-[#102A43] shadow-sm outline-none focus:border-[#00A859]">
            <option value="Todos">Todos setores</option>
            {sectors.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* ── Contador ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#516070]">
          <span className="font-semibold text-[#111827]">{activeFiltered.length}</span> chamado(s) ativo(s)
          {archivedFiltered.length > 0 && (
            <span className="ml-2 rounded-full border border-[#DDE7E2] bg-white px-2.5 py-1 text-xs font-bold text-slate-500">
              {archivedFiltered.length} arquivado(s)
            </span>
          )}
        </p>
      </div>

      {/* ── Tabela principal (ativos) ── */}
      <div className="rounded-3xl border border-[#DDE7E2] bg-white/90 p-3 shadow-[0_18px_48px_rgba(7,59,42,0.08)] backdrop-blur sm:p-4">
        {/* Desktop */}
        <div className="hidden rounded-2xl border border-[#DDE7E2] bg-white lg:block">
          <table className="w-full text-left text-xs">
            <thead className={theadClass}>
              <tr>
                <SortableHeader label="ID"         sortK="id"        {...sortProps} />
                <SortableHeader label="Solicitante" sortK="user"      {...sortProps} />
                <SortableHeader label="Setor"       sortK="sector"    {...sortProps} />
                <SortableHeader label="Categoria"   sortK="category"  {...sortProps} />
                <SortableHeader label="Origem"      sortK="origin"    {...sortProps} />
                <SortableHeader label="Status"      sortK="status"    {...sortProps} />
                <SortableHeader label="Aberto em"   sortK="createdAt" {...sortProps} />
                <th className="px-2 py-2 whitespace-nowrap">Alterar</th>
                <th className="px-2 py-2 whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody>
              {activeFiltered.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="space-y-3 lg:hidden">
          {activeFiltered.map((ticket) => <MobileCard key={ticket.id} ticket={ticket} />)}
        </div>

        {activeFiltered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#CFE2D8] bg-gradient-to-b from-[#F8FCFA] to-white p-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#00A859] shadow-sm ring-1 ring-[#DDE7E2]">
              <ClipboardList size={22} />
            </div>
            <p className="text-sm font-black text-[#073B2A]">Nenhum chamado encontrado</p>
            <p className="mt-1.5 text-xs font-medium leading-5 text-[#64748B]">Limpe os filtros ou tente outro termo de busca.</p>
          </div>
        )}
      </div>

      {/* ── Arquivados (colapsáveis) ── */}
      {archivedFiltered.length > 0 && (
        <div className="rounded-3xl border border-[#DDE7E2] bg-white/80 p-3 shadow-sm sm:p-4">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-600">Arquivados</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                {archivedFiltered.length}
              </span>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${showArchived ? "rotate-180" : ""}`} />
          </button>

          {showArchived && (
            <div className="mt-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
              {/* Desktop */}
              <div className="hidden rounded-2xl border border-[#DDE7E2] bg-white lg:block">
                <table className="w-full text-left text-xs">
                  <thead className={theadClass}>
                    <tr>
                      <SortableHeader label="ID"         sortK="id"        {...sortProps} />
                      <SortableHeader label="Solicitante" sortK="user"      {...sortProps} />
                      <SortableHeader label="Setor"       sortK="sector"    {...sortProps} />
                      <SortableHeader label="Categoria"   sortK="category"  {...sortProps} />
                      <SortableHeader label="Origem"      sortK="origin"    {...sortProps} />
                      <th className="px-2 py-2 whitespace-nowrap">SLA</th>
                      <SortableHeader label="Status"      sortK="status"    {...sortProps} />
                      <SortableHeader label="Aberto em"   sortK="createdAt" {...sortProps} />
                      <th className="px-2 py-2 whitespace-nowrap">Alterar</th>
                      <th className="px-2 py-2 whitespace-nowrap">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedFiltered.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} dimmed />)}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="space-y-3 lg:hidden">
                {archivedFiltered.map((ticket) => <MobileCard key={ticket.id} ticket={ticket} dimmed />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Dialog detalhes ── */}
      <Dialog open={!!selectedTicket} onOpenChange={() => { setSelectedTicket(null); setTicketMessages([]); setShowFinishConfirm(false) }}>
        <DialogContent className="w-[calc(100vw-1rem)] max-h-[calc(100vh-1rem)] overflow-hidden rounded-[1.35rem] border border-[#DDE7E2] bg-[#F7FAF8] p-0 text-[#111827] shadow-[0_30px_90px_rgba(7,59,42,0.18)] sm:max-w-4xl sm:rounded-3xl xl:max-w-[1080px]">
          <DialogHeader className="shrink-0 border-b border-[#DDE7E2] bg-white px-4 py-3 pr-12 sm:px-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#00A859]">Chamado #{selectedTicket?.id}</p>
                <DialogTitle className="mt-0.5 text-base font-black tracking-[-0.03em] text-[#073B2A] sm:text-lg">
                  {selectedTicket?.category} · {selectedTicket?.user}
                </DialogTitle>
                {selectedTicket?.description && (
                  <p className="mt-0.5 max-w-xl truncate text-xs text-[#64748B]">{selectedTicket.description}</p>
                )}
              </div>
              {selectedTicket && (
                <span className={`status-badge-animated w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(selectedTicket.status)}`}>
                  {selectedTicket.status}
                </span>
              )}
            </div>
          </DialogHeader>

          {selectedTicket && (
            <div className="flex h-[calc(100vh-10rem)] max-h-[640px] min-w-0 overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="flex h-[calc(100vh-10rem)] max-h-[640px] overflow-hidden lg:grid lg:grid-cols-[1fr_260px]">
              <div className="flex min-h-0 flex-col overflow-hidden">
                <div className="flex-1 space-y-3 overflow-y-auto bg-[#F8FCFA] p-4">
                  {ticketMessages.length === 0 && (
                    <div className="flex h-32 items-center justify-center">
                      <p className="text-sm text-slate-400">Nenhuma mensagem ainda.</p>
                    </div>
                  )}
                  {ticketMessages.map((msg: any) => {
                    const isEmployee = msg.senderType === "employee"
                    const isBot = msg.senderType === "bot"
                    return (
                      <div key={msg.id} className={`flex ${isEmployee ? "justify-end" : "justify-start"}`}>
                        <div className={`min-w-0 max-w-[82%] rounded-3xl border p-3 text-sm shadow-sm ${isEmployee ? "border-[#00A859]/20 bg-[#00A859]/10 text-[#073B2A]" : isBot ? "border-blue-200 bg-blue-50 text-[#111827]" : "border-[#DDE7E2] bg-white text-[#111827]"}`}>
                        <div className={`max-w-[82%] rounded-3xl border p-3 text-sm shadow-sm ${isEmployee ? "border-[#00A859]/20 bg-[#00A859]/10 text-[#073B2A]" : isBot ? "border-blue-200 bg-blue-50 text-[#111827]" : "border-[#DDE7E2] bg-white text-[#111827]"}`}>
                          <p className={`mb-1 text-[11px] font-black uppercase tracking-[0.1em] ${isBot ? "text-blue-600" : isEmployee ? "text-[#00A859]" : "text-slate-500"}`}>
                            {isBot ? "🤖 Atendimento Automático" : isEmployee ? msg.senderName : "Técnico"}
                          </p>
                          <p className="whitespace-pre-wrap break-words leading-5">{msg.message}</p>
                          <p className="mt-1.5 text-[10px] text-slate-400">{new Date(msg.createdAt).toLocaleString("pt-BR")}</p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="shrink-0 border-t border-[#DDE7E2] bg-white p-3 sm:p-4">
                  <Textarea
                    placeholder="Responda com orientação, diagnóstico ou próximo passo..."
                    value={technicalResponse}
                    onChange={(e) => setTechnicalResponse(e.target.value)}
                    className="min-h-[90px] rounded-2xl border-[#DDE7E2] bg-[#F7FAF8] text-[#111827] focus-visible:ring-[#00A859]/30"
                  />
                  <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    {showFinishConfirm ? (
                      <>
                        <span className="flex items-center text-sm font-semibold text-slate-600">Confirmar finalização?</span>
                        <Button variant="outline" className="h-10 rounded-2xl border-[#DDE7E2] bg-white text-[#102A43] hover:bg-[#EAF0ED]" onClick={() => setShowFinishConfirm(false)}>
                          Cancelar
                        </Button>
                        <Button className="h-10 rounded-2xl border border-[#00A859]/40 bg-[#00A859]/10 font-bold text-[#073B2A] hover:bg-[#00A859]/20" onClick={handleFinishTicket}>
                          Confirmar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" className="h-10 rounded-2xl border-[#DDE7E2] bg-white text-[#102A43] hover:bg-[#EAF0ED]" onClick={() => setShowFinishConfirm(true)}>
                          Finalizar chamado
                        </Button>
                        <Button className="h-10 rounded-2xl bg-[#00A859] px-6 text-white shadow-[0_12px_30px_rgba(0,168,89,0.22)] hover:bg-[#078C4D] disabled:opacity-50" onClick={handleAddResponse} disabled={!technicalResponse.trim()}>
                          Enviar resposta
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="hidden overflow-y-auto border-l border-[#DDE7E2] bg-white p-4 lg:block">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Informações</p>
                <div className="space-y-2">
                  <FieldCard label="Solicitante" value={selectedTicket.user} />
                  <FieldCard label="Setor" value={selectedTicket.sector} />
                  <FieldCard label="Categoria" value={selectedTicket.category} />
                  <FieldCard label="Origem" value={selectedTicket.origin} />
                  <FieldCard label="Criado em" value={selectedTicket.createdAt} />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
