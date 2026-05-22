import { useEffect, useState } from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { categories } from "@/lib/categories"
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

function FieldCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#DDE7E2] bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#64748B]">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-[#102A43]">{value || "—"}</p>
    </div>
  )
}


function DetailsSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="overflow-hidden rounded-2xl border border-[#DDE7E2] bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#F7FAF8]"
      >
        <span className="text-sm font-black text-[#073B2A]">{title}</span>
        <span className="text-sm font-black text-[#00A859]">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4">
          {children}
        </div>
      )}
    </div>
  )
}


export function TicketsTable({ tickets, onTicketsChange }: TicketsTableProps) {
  const [tableTickets, setTableTickets] = useState<any[]>(tickets)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [employeeId, setEmployeeId] = useState("")
  const [category, setCategory] = useState("PC")
  const [sectorId, setSectorId] = useState("")
  const [origin, setOrigin] = useState("Base")
  const [description, setDescription] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [originFilter, setOriginFilter] = useState("Todas")
  const [sectorFilter, setSectorFilter] = useState("Todos")
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [technicalResponse, setTechnicalResponse] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const selectedEmployee = employees.find((employee) => String(employee.id) === employeeId)
  const selectedEmployeeSector = selectedEmployee?.sector

  function handleEmployeeChange(value: string) {
    setEmployeeId(value)
    const employee = employees.find((item) => String(item.id) === value)

    if (employee?.sectorId) {
      setSectorId(String(employee.sectorId))
      return
    }

    if (employee?.sector?.id) {
      setSectorId(String(employee.sector.id))
      return
    }

    setSectorId("")
  }

  useEffect(() => {
    loadEmployeesAndSectors()
  }, [])

  useEffect(() => {
    setTableTickets(tickets)
  }, [tickets])

  async function loadEmployeesAndSectors() {
    try {
      const [employeesRes, sectorsRes] = await Promise.all([
        apiFetch("/employees"),
        apiFetch("/sectors"),
      ])

      const employeesData = await employeesRes.json()
      const sectorsData = await sectorsRes.json()

      setEmployees(employeesData)
      setSectors(sectorsData)

      if (employeesData.length > 0) {
        const firstEmployee = employeesData[0]
        setEmployeeId(String(firstEmployee.id))
        setSectorId(String(firstEmployee.sectorId || firstEmployee.sector?.id || ""))
      } else if (sectorsData.length > 0) {
        setSectorId(String(sectorsData[0].id))
      }
    } catch (error) {
      console.error("Erro ao carregar funcionários e setores:", error)
    }
  }

  function getCurrentDateTime() {
    return new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  async function handleCreateTicket() {
    if (!employeeId || !sectorId || !description) {
      alert("Selecione o funcionário e descreva o problema.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await apiFetch("/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: Number(employeeId),
          sectorId: Number(sectorId),
          category,
          origin,
          description,
        }),
      })

      if (!response.ok) {
        alert("Erro ao criar chamado.")
        return
      }

      if (employees.length > 0) {
        const firstEmployee = employees[0]
        setEmployeeId(String(firstEmployee.id))
        setSectorId(String(firstEmployee.sectorId || firstEmployee.sector?.id || ""))
      } else {
        setEmployeeId("")
        setSectorId("")
      }

      setCategory("PC")
      setOrigin("Base")
      setDescription("")
      onTicketsChange()
    } catch (error) {
      console.error("Erro ao criar chamado:", error)
      alert("Erro ao criar chamado.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleChangeStatus(ticketId: number, newStatus: string) {
    apiFetch(`/tickets/${ticketId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: newStatus,
      }),
    })
      .then(() => {
        onTicketsChange()
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket({
            ...selectedTicket,
            status: newStatus,
            timeline: [
              ...(selectedTicket.timeline || []),
              {
                date: getCurrentDateTime(),
                action: `Status alterado para ${newStatus}`,
              },
            ],
          })
        }
      })
      .catch((error) => {
        console.error("Erro ao alterar status:", error)
        alert("Erro ao alterar status do chamado")
      })
  }

  function getStatusStyle(status: string) {
    if (status === "Aberto") {
      return "bg-[#EFF6FF] text-[#1D4ED8] ring-1 ring-[#BFDBFE]"
    }

    if (status === "Em andamento") {
      return "bg-[#FFFBEB] text-[#B45309] ring-1 ring-[#FDE68A]"
    }

    if (status === "Aguardando usuário") {
      return "bg-[#FFF7ED] text-[#C2410C] ring-1 ring-[#FED7AA]"
    }

    if (status === "Finalizado") {
      return "bg-[#E9FFF3] text-[#073B2A] ring-1 ring-emerald-200"
    }

    return "bg-[#EAF0ED] text-[#516070] ring-1 ring-[#DDE7E2]"
  }

  function handleAddResponse() {
    if (!selectedTicket || !technicalResponse.trim()) return

    apiFetch(`/tickets/${selectedTicket.id}/response`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        technicalResponse: technicalResponse.trim(),
      }),
    })
      .then(() => {
        onTicketsChange()
        setSelectedTicket({
          ...selectedTicket,
          technicalResponse: technicalResponse.trim(),
          status: "Em andamento",
          timeline: [
            ...(selectedTicket.timeline || []),
            {
              date: getCurrentDateTime(),
              action: "Resposta técnica adicionada",
            },
            {
              date: getCurrentDateTime(),
              action: "Status alterado para Em andamento",
            },
          ],
        })

        setTechnicalResponse("")
      })
      .catch((error) => {
        console.error("Erro ao adicionar resposta:", error)
        alert("Erro ao adicionar resposta técnica")
      })
  }

  function handleFinishTicket() {
    if (!selectedTicket) return

    apiFetch(`/tickets/${selectedTicket.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "Finalizado",
      }),
    })
      .then(() => {
        onTicketsChange()
        setSelectedTicket({
          ...selectedTicket,
          status: "Finalizado",
          timeline: [
            ...(selectedTicket.timeline || []),
            {
              date: getCurrentDateTime(),
              action: "Chamado finalizado",
            },
          ],
        })
      })
      .catch((error) => {
        console.error("Erro ao finalizar chamado:", error)
        alert("Erro ao finalizar chamado")
      })
  }

  function getSlaStatus(ticket: any) {
    if (ticket.status === "Finalizado") {
      return {
        label: "Concluído",
        className: "bg-[#E9FFF3] text-[#073B2A] ring-1 ring-emerald-200",
      }
    }

    if (ticket.origin === "Offshore") {
      return {
        label: "Offshore",
        className: "bg-[#FFF1F2] text-[#BE123C] ring-1 ring-[#FECACA]",
      }
    }

    return {
      label: "No prazo",
      className: "bg-[#EAF0ED] text-[#334155] ring-1 ring-[#DDE7E2]",
    }
  }

  function getTicketAccentColor(ticket: any) {
    if (ticket.status === "Finalizado") return "#00A859"
    if (ticket.status === "Aguardando usuário") return "#F97316"
    if (ticket.status === "Em andamento") return "#2563EB"
    if (ticket.origin === "Offshore") return "#E11D48"
    return "#F59E0B"
  }

  const filteredTickets = tableTickets.filter((ticket) => {
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

  const filteredArchivedTickets = filteredTickets.filter((ticket) => ticket.archived).length

  return (
    <div className="space-y-5">
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

              <DialogContent className="max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-[1.35rem] border border-[#DDE7E2] bg-white p-4 pr-10 text-[#111827] shadow-[0_24px_70px_rgba(7,59,42,0.16)] sm:max-w-2xl sm:rounded-3xl sm:p-5">
                <DialogHeader className="pr-2">
                  <DialogTitle className="text-lg font-black tracking-[-0.02em] text-[#073B2A]">Novo chamado</DialogTitle>
                </DialogHeader>

                <div className="grid gap-3 sm:gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-[#334155]">Solicitante</label>
                    <select
                      value={employeeId}
                      onChange={(e) => handleEmployeeChange(e.target.value)}
                      className="w-full rounded-2xl border border-[#DDE7E2] bg-white px-4 py-3 text-[#102A43] shadow-sm outline-none focus:border-[#00A859]"
                    >
                      <option value="">Selecione um funcionário</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[#334155]">Setor vinculado</label>
                      <div className="min-h-[48px] rounded-2xl border border-[#DDE7E2] bg-[#F4F8F6] px-4 py-3 text-[#102A43] shadow-sm">
                        {selectedEmployeeSector?.name || sectors.find((sect) => String(sect.id) === sectorId)?.name || "Selecione um funcionário"}
                      </div>
                      <p className="text-xs text-[#64748B]">Preenchido pelo cadastro do funcionário.</p>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[#334155]">Categoria</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-2xl border border-[#DDE7E2] bg-white px-4 py-3 text-[#102A43] shadow-sm outline-none focus:border-[#00A859]"
                      >
                        {categories.map((categoryItem) => (
                          <option key={categoryItem}>{categoryItem}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-[#334155]">Origem</label>
                    <select
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-full rounded-2xl border border-[#DDE7E2] bg-white px-4 py-3 text-[#102A43] shadow-sm outline-none focus:border-[#00A859]"
                    >
                      <option>Base</option>
                      <option>Offshore</option>
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-[#334155]">Descrição</label>
                    <Textarea
                      placeholder="Descreva o problema com contexto objetivo..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[120px] rounded-2xl border-[#DDE7E2] bg-white text-[#111827] sm:min-h-[140px]"
                    />
                  </div>

                  <Button
                    className="h-11 w-full rounded-2xl bg-[#00A859] text-white hover:bg-[#078C4D] disabled:opacity-50"
                    onClick={handleCreateTicket}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Criando..." : "Abrir chamado"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="h-11 w-full rounded-2xl border-[#BFEFD7] bg-white text-[#073B2A] hover:bg-[#E9FFF3] sm:hidden whitespace-nowrap"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              {filtersOpen ? "Ocultar filtros" : "Filtros"}
            </Button>

            <Button
              variant="outline"
              className="h-11 w-full rounded-2xl border-[#DDE7E2] bg-white text-[#073B2A] hover:bg-[#F4F8F6] sm:w-auto whitespace-nowrap"
              onClick={() => {
                setSearch("")
                setStatusFilter("Todos")
                setOriginFilter("Todas")
                setSectorFilter("Todos")
              }}
            >
              Limpar
            </Button>
          </div>
        </div>

        <div className={`${filtersOpen ? "grid animate-in fade-in-0 slide-in-from-top-1 duration-200" : "hidden"} mt-4 gap-3 sm:mt-5 sm:grid sm:grid-cols-2 xl:grid-cols-4`}>
          <Input
            placeholder="Buscar chamado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 border-[#DDE7E2] bg-white text-[#111827] xl:col-span-1"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 w-full rounded-2xl border border-[#DDE7E2] bg-white px-4 text-[#102A43] shadow-sm outline-none focus:border-[#00A859]"
          >
            <option value="Todos">Todos status</option>
            <option value="Aberto">Aberto</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Aguardando usuário">Aguardando usuário</option>
            <option value="Finalizado">Finalizado</option>
          </select>

          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="h-11 w-full rounded-2xl border border-[#DDE7E2] bg-white px-4 text-[#102A43] shadow-sm outline-none focus:border-[#00A859]"
          >
            <option value="Todas">Todas origens</option>
            <option value="Offshore">Offshore</option>
            <option value="Base">Base</option>
          </select>

          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="h-11 w-full rounded-2xl border border-[#DDE7E2] bg-white px-4 text-[#102A43] shadow-sm outline-none focus:border-[#00A859]"
          >
            <option value="Todos">Todos setores</option>
            {sectors.map((sectorItem) => (
              <option key={sectorItem.id} value={sectorItem.name}>
                {sectorItem.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#516070]">
          <span className="font-semibold text-[#111827]">{filteredTickets.length}</span> chamado(s) encontrado(s)
          {filteredArchivedTickets > 0 && (
            <span className="ml-2 rounded-full border border-[#DDE7E2] bg-white px-2.5 py-1 text-xs font-bold text-slate-500">
              {filteredArchivedTickets} arquivado(s)
            </span>
          )}
        </p>
      </div>

      <div className="rounded-3xl border border-[#DDE7E2] bg-white/90 p-3 shadow-[0_18px_48px_rgba(7,59,42,0.08)] backdrop-blur sm:p-4">
        <div className="hidden overflow-x-auto rounded-2xl border border-[#DDE7E2] bg-white lg:block">
          <table className="min-w-[980px] w-full text-left text-[13px]">
            <thead className="bg-[#F4F8F6] text-[11px] uppercase tracking-[0.1em] text-[#64748B]">
              <tr>
                <th className="px-3 py-3 whitespace-nowrap">ID</th>
                <th className="px-3 py-3 whitespace-nowrap">Solicitante</th>
                <th className="px-3 py-3 whitespace-nowrap">Setor</th>
                <th className="px-3 py-3 whitespace-nowrap">Categoria</th>
                <th className="px-3 py-3 whitespace-nowrap">Origem</th>
                <th className="px-3 py-3 whitespace-nowrap">SLA</th>
                <th className="px-3 py-3 whitespace-nowrap">Status</th>
                <th className="px-3 py-3 whitespace-nowrap">Atualizar</th>
                <th className="px-3 py-3 whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className={`border-t border-slate-100 transition-all hover:bg-[#E9FFF3]/50 ${ticket.archived ? "bg-slate-50/70 opacity-75" : ""}`}>
                  <td className="px-3 py-3 text-[#111827] whitespace-nowrap">#{ticket.id}</td>
                  <td className="px-3 py-3 text-[#102A43] whitespace-nowrap">{ticket.user}</td>
                  <td className="px-3 py-3 text-[#334155] whitespace-nowrap">{ticket.sector}</td>
                  <td className="px-3 py-3 text-[#334155] whitespace-nowrap">{ticket.category}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ticket.origin === "Offshore" ? "bg-[#FFF1F2] text-[#BE123C] ring-1 ring-[#FECACA]" : "bg-[#EAF0ED] text-[#334155] ring-1 ring-[#DDE7E2]"}`}>
                      {ticket.origin}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getSlaStatus(ticket).className}`}>
                      {getSlaStatus(ticket).label}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    {ticket.archived && (
                      <span className="ml-1.5 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 ring-1 ring-slate-200">
                        Arquivado
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <select
                      value={ticket.status}
                      onChange={(e) => handleChangeStatus(ticket.id, e.target.value)}
                      className="w-full min-w-[138px] rounded-xl border border-[#DDE7E2] bg-white px-3 py-2 text-[#102A43] outline-none focus:border-[#00A859]"
                    >
                      <option>Aberto</option>
                      <option>Em andamento</option>
                      <option>Aguardando usuário</option>
                      <option>Finalizado</option>
                    </select>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <Button variant="outline" size="sm" className="rounded-xl border-[#DDE7E2] bg-white text-[#334155] hover:bg-[#E9FFF3]" onClick={() => setSelectedTicket(ticket)}>
                      Ver detalhes
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 lg:hidden">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`rounded-2xl border border-l-4 border-[#DDE7E2] bg-white p-4 shadow-sm ${ticket.archived ? "opacity-75" : ""}`}
              style={{ borderLeftColor: getTicketAccentColor(ticket) }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#00A859]">#{ticket.id}</p>
                  <h3 className="mt-1 truncate text-base font-bold text-[#111827]">{ticket.category}</h3>
                  <p className="mt-1 text-sm text-[#516070]">{ticket.user} · {ticket.sector}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
              {ticket.archived && (
                <span className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 ring-1 ring-slate-200">
                  Arquivado
                </span>
              )}

              <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-[#334155]">
                {ticket.description || "Sem descrição."}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-3 py-1.5 font-semibold ${getSlaStatus(ticket).className}`}>
                  {getSlaStatus(ticket).label}
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  {ticket.origin}
                </span>
              </div>

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
                <Button variant="outline" className="h-11 rounded-2xl border-[#BFEFD7] bg-[#E9FFF3] text-[#073B2A] hover:bg-[#D8FBE8]" onClick={() => setSelectedTicket(ticket)}>
                  Ver detalhes
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredTickets.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#CFE2D8] bg-[#F8FCFA] p-8 text-center">
            <div className="mx-auto mb-3 h-9 w-9 rounded-2xl bg-white ring-1 ring-[#DDE7E2]" />
            <p className="text-sm font-black text-[#073B2A]">Nenhum chamado encontrado</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#64748B]">Limpe os filtros ou tente outro termo de busca.</p>
          </div>
        )}
      </div>

    <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-h-[calc(100vh-1.5rem)] w-[calc(100vw-1.5rem)] overflow-hidden rounded-[1.35rem] border border-[#DDE7E2] bg-[#F7FAF8] p-0 text-[#111827] shadow-[0_30px_90px_rgba(7,59,42,0.18)] sm:max-w-4xl sm:rounded-3xl xl:max-w-[1080px]">
          <DialogHeader className="border-b border-[#DDE7E2] bg-white px-4 py-4 pr-12 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#00A859]">
                  Chamado #{selectedTicket?.id}
                </p>
                <DialogTitle className="mt-1 text-lg font-black tracking-[-0.03em] text-[#073B2A] sm:text-xl">
                  Atendimento técnico
                </DialogTitle>
                <p className="mt-1 text-sm text-[#64748B]">
                  Leia o problema, responda o usuário e consulte os detalhes se necessário.
                </p>
              </div>

              {selectedTicket && (
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(selectedTicket.status)}`}>
                  {selectedTicket.status}
                </span>
              )}
            </div>
          </DialogHeader>

          {selectedTicket && (
            <div className="max-h-[calc(100vh-7.5rem)] overflow-y-auto p-3 sm:p-5">
              <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1fr_340px]">
                <section className="space-y-3 sm:space-y-4">
                  <DetailsSection title="Descrição do problema">
                    <div className="max-h-52 overflow-y-auto whitespace-pre-wrap break-words rounded-2xl bg-white p-4 text-sm leading-6 text-[#102A43] ring-1 ring-[#DDE7E2]">
                      {selectedTicket.description || "Sem descrição."}
                    </div>
                  </DetailsSection>

                  <div className="rounded-2xl border border-[#BFEFD7] bg-white p-3 shadow-[0_14px_34px_rgba(7,59,42,0.08)] sm:rounded-3xl sm:p-4">
                    <div className="mb-3">
                      <p className="text-sm font-black text-[#073B2A]">
                        Responder ao usuário
                      </p>
                      <p className="mt-1 text-xs text-[#64748B]">
                        Informe orientação, diagnóstico ou próximo passo do atendimento.
                      </p>
                    </div>

                    <Textarea
                      placeholder="Ex: Verificamos a solicitação e o próximo passo será..."
                      value={technicalResponse}
                      onChange={(e) => setTechnicalResponse(e.target.value)}
                      className="min-h-[130px] rounded-2xl border-[#DDE7E2] bg-[#F7FAF8] text-[#111827] focus-visible:ring-[#00A859]/30 sm:min-h-[150px]"
                    />

                    <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <Button
                        variant="outline"
                        className="h-11 rounded-2xl border-[#DDE7E2] bg-white text-[#102A43] hover:bg-[#EAF0ED]"
                        onClick={handleFinishTicket}
                      >
                        Finalizar chamado
                      </Button>

                      <Button
                        className="h-11 rounded-2xl bg-[#00A859] px-6 text-white shadow-[0_12px_30px_rgba(0,168,89,0.22)] hover:bg-[#078C4D] disabled:opacity-50"
                        onClick={handleAddResponse}
                        disabled={!technicalResponse.trim()}
                      >
                        Enviar resposta
                      </Button>
                    </div>
                  </div>

                  {selectedTicket.technicalResponse && (
                    <DetailsSection title="Última resposta técnica">
                      <div className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-2xl bg-white p-4 text-sm leading-6 text-[#102A43] ring-1 ring-[#DDE7E2]">
                        {selectedTicket.technicalResponse}
                      </div>
                    </DetailsSection>
                  )}
                </section>

                <aside className="space-y-4">
                  <DetailsSection title="Informações principais">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                      <FieldCard label="Solicitante" value={selectedTicket.user} />
                      <FieldCard label="Setor" value={selectedTicket.sector} />
                      <FieldCard label="Categoria" value={selectedTicket.category} />
                      <FieldCard label="Criado em" value={selectedTicket.createdAt} />
                      <FieldCard label="Origem" value={selectedTicket.origin} />
                    </div>
                  </DetailsSection>

                  <DetailsSection title="Histórico do chamado">
                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                      {selectedTicket.timeline?.length ? (
                        selectedTicket.timeline.map(
                          (
                            event: { date: string; action: string },
                            index: number
                          ) => (
                            <div
                              key={index}
                              className="rounded-2xl bg-white p-3 text-sm ring-1 ring-[#DDE7E2]"
                            >
                              <p className="break-words text-[#102A43]">
                                {event.action}
                              </p>
                              <p className="mt-1 text-xs text-[#64748B]">
                                {event.date}
                              </p>
                            </div>
                          )
                        )
                      ) : (
                        <p className="rounded-2xl border border-dashed border-[#DDE7E2] bg-white p-4 text-sm text-[#64748B]">
                          Nenhum evento registrado.
                        </p>
                      )}
                    </div>
                  </DetailsSection>
                </aside>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
