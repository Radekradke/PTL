import { useEffect, useState } from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { categories } from "@/lib/categories"
import { API_URL } from "@/services/api"

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
  pin: string
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
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value || "—"}</p>
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
    <div className="rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-bold text-slate-900">{title}</span>
        <span className="text-sm font-bold text-emerald-700">
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
  const [priority, setPriority] = useState("Normal")
  const [description, setDescription] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [originFilter, setOriginFilter] = useState("Todas")
  const [priorityFilter, setPriorityFilter] = useState("Todas")
  const [sectorFilter, setSectorFilter] = useState("Todos")
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [technicalResponse, setTechnicalResponse] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    setTableTickets(tickets)
  }, [tickets])

  async function loadEmployeesAndSectors() {
    try {
      const [employeesRes, sectorsRes] = await Promise.all([
        fetch(`${API_URL}/employees`),
        fetch(`${API_URL}/sectors`),
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
      const response = await fetch(`${API_URL}/tickets`, {
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
      setPriority("Normal")
      onTicketsChange()
    } catch (error) {
      console.error("Erro ao criar chamado:", error)
      alert("Erro ao criar chamado.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleChangeStatus(ticketId: number, newStatus: string) {
    fetch(`${API_URL}/tickets/${ticketId}/status`, {
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
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
    }

    if (status === "Em andamento") {
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
    }

    if (status === "Aguardando usuário") {
      return "bg-orange-50 text-orange-700 ring-1 ring-orange-200"
    }

    if (status === "Finalizado") {
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    }

    return "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
  }

  function handleAddResponse() {
    if (!selectedTicket || !technicalResponse.trim()) return

    fetch(`${API_URL}/tickets/${selectedTicket.id}/response`, {
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

    fetch(`${API_URL}/tickets/${selectedTicket.id}`, {
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
        className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      }
    }

    if (ticket.origin === "Offshore") {
      return {
        label: "Offshore",
        className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
      }
    }

    if (ticket.priority === "Urgente") {
      return {
        label: "Urgente",
        className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
      }
    }

    if (ticket.priority === "Alta") {
      return {
        label: "Alta",
        className: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
      }
    }

    return {
      label: "No prazo",
      className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    }
  }

  const filteredTickets = tableTickets.filter((ticket) => {
    const matchesSearch =
      ticket.user.toLowerCase().includes(search.toLowerCase()) ||
      ticket.sector.toLowerCase().includes(search.toLowerCase()) ||
      ticket.category.toLowerCase().includes(search.toLowerCase()) ||
      String(ticket.id).includes(search)

    const matchesStatus = statusFilter === "Todos" || ticket.status === statusFilter
    const matchesOrigin = originFilter === "Todas" || ticket.origin === originFilter
    const matchesPriority = priorityFilter === "Todas" || ticket.priority === priorityFilter
    const matchesSector = sectorFilter === "Todos" || ticket.sector === sectorFilter

    return matchesSearch && matchesStatus && matchesOrigin && matchesPriority && matchesSector
  })

  return (
    <div className="space-y-5">
      <div className="ls-product-card rounded-3xl p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Chamados</p>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-slate-950">Fila de atendimento</h2>
            <p className="mt-1 text-sm text-slate-600">Filtre, abra e responda chamados em um só lugar.</p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:shrink-0">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-11 w-full rounded-2xl bg-emerald-600 px-5 text-white hover:bg-emerald-700 sm:w-auto whitespace-nowrap">
                  Novo chamado
                </Button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 text-slate-950 shadow-2xl sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Novo chamado</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Solicitante</label>
                    <select
                      value={employeeId}
                      onChange={(e) => handleEmployeeChange(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-emerald-500"
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
                      <label className="text-sm font-medium text-slate-700">Setor vinculado</label>
                      <div className="min-h-[48px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 shadow-sm">
                        {selectedEmployeeSector?.name || sectors.find((sect) => String(sect.id) === sectorId)?.name || "Selecione um funcionário"}
                      </div>
                      <p className="text-xs text-slate-500">Preenchido pelo cadastro do funcionário.</p>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-700">Categoria</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-emerald-500"
                      >
                        {categories.map((categoryItem) => (
                          <option key={categoryItem}>{categoryItem}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-700">Origem</label>
                      <select
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-emerald-500"
                      >
                        <option>Base</option>
                        <option>Offshore</option>
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-700">Prioridade</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-emerald-500"
                      >
                        <option>Baixa</option>
                        <option>Normal</option>
                        <option>Alta</option>
                        <option>Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Descrição</label>
                    <Textarea
                      placeholder="Descreva o problema com contexto objetivo..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[140px] border-slate-200 bg-white text-slate-950"
                    />
                  </div>

                  <Button
                    className="h-11 w-full rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
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
              className="h-11 w-full rounded-2xl border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 sm:w-auto whitespace-nowrap"
              onClick={() => {
                setSearch("")
                setStatusFilter("Todos")
                setOriginFilter("Todas")
                setPriorityFilter("Todas")
                setSectorFilter("Todos")
              }}
            >
              Limpar filtros
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Input
            placeholder="Buscar chamado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 border-slate-200 bg-white text-slate-950 xl:col-span-1"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 shadow-sm outline-none focus:border-emerald-500"
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
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 shadow-sm outline-none focus:border-emerald-500"
          >
            <option value="Todas">Todas origens</option>
            <option value="Offshore">Offshore</option>
            <option value="Base">Base</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 shadow-sm outline-none focus:border-emerald-500"
          >
            <option value="Todas">Todas prioridades</option>
            <option value="Baixa">Baixa</option>
            <option value="Normal">Normal</option>
            <option value="Alta">Alta</option>
            <option value="Urgente">Urgente</option>
          </select>

          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 shadow-sm outline-none focus:border-emerald-500"
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
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-950">{filteredTickets.length}</span> chamado(s) encontrado(s)
        </p>
      </div>

      <div className="ls-product-card rounded-3xl p-3 sm:p-4">
        <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white lg:block">
          <table className="min-w-[980px] w-full text-left text-[13px]">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.1em] text-slate-500">
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
                <tr key={ticket.id} className="border-t border-slate-100 transition-all hover:bg-emerald-50/50">
                  <td className="px-3 py-3 text-slate-950 whitespace-nowrap">#{ticket.id}</td>
                  <td className="px-3 py-3 text-slate-800 whitespace-nowrap">{ticket.user}</td>
                  <td className="px-3 py-3 text-slate-700 whitespace-nowrap">{ticket.sector}</td>
                  <td className="px-3 py-3 text-slate-700 whitespace-nowrap">{ticket.category}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ticket.origin === "Offshore" ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200" : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"}`}>
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
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <select
                      value={ticket.status}
                      onChange={(e) => handleChangeStatus(ticket.id, e.target.value)}
                      className="w-full min-w-[138px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-emerald-500"
                    >
                      <option>Aberto</option>
                      <option>Em andamento</option>
                      <option>Aguardando usuário</option>
                      <option>Finalizado</option>
                    </select>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <Button variant="outline" size="sm" className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-emerald-50" onClick={() => setSelectedTicket(ticket)}>
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
            <div key={ticket.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">#{ticket.id}</p>
                  <h3 className="mt-1 truncate text-base font-bold text-slate-950">{ticket.category}</h3>
                  <p className="mt-1 text-sm text-slate-600">{ticket.user} · {ticket.sector}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>

              <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {ticket.description || "Sem descrição."}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <span className={`rounded-full px-3 py-2 text-center font-semibold ${ticket.origin === "Offshore" ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200" : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"}`}>
                  {ticket.origin}
                </span>
                <span className={`rounded-full px-3 py-2 text-center font-semibold ${getSlaStatus(ticket).className}`}>
                  {getSlaStatus(ticket).label}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <select
                  value={ticket.status}
                  onChange={(e) => handleChangeStatus(ticket.id, e.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                >
                  <option>Aberto</option>
                  <option>Em andamento</option>
                  <option>Aguardando usuário</option>
                  <option>Finalizado</option>
                </select>
                <Button variant="outline" className="h-11 rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" onClick={() => setSelectedTicket(ticket)}>
                  Ver detalhes
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredTickets.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">Nenhum chamado encontrado.</div>
        )}
      </div>

    <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
  <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] overflow-hidden rounded-3xl border border-slate-200 bg-[#F8FAF9] p-0 text-slate-950 shadow-2xl sm:max-w-4xl xl:max-w-[1100px]">
    <DialogHeader className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
            Chamado #{selectedTicket?.id}
          </p>
          <DialogTitle className="mt-1 text-xl font-bold tracking-[-0.02em] text-slate-950">
            Atendimento técnico
          </DialogTitle>
          <p className="mt-1 text-sm text-slate-500">
            Responda o usuário e consulte os detalhes quando precisar.
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
      <div className="max-h-[calc(92vh-96px)] overflow-y-auto p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <section className="space-y-4">
            <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <p className="text-sm font-bold text-slate-950">
                  Responder ao usuário
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Informe orientação, diagnóstico ou próximo passo.
                </p>
              </div>

              <Textarea
                placeholder="Ex: Verificamos a solicitação e o próximo passo será..."
                value={technicalResponse}
                onChange={(e) => setTechnicalResponse(e.target.value)}
                className="min-h-[150px] rounded-2xl border-slate-200 bg-white text-slate-950"
              />

              <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="h-11 rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  onClick={handleFinishTicket}
                >
                  Finalizar chamado
                </Button>

                <Button
                  className="h-11 rounded-2xl bg-emerald-600 px-6 text-white hover:bg-emerald-700 disabled:opacity-50"
                  onClick={handleAddResponse}
                  disabled={!technicalResponse.trim()}
                >
                  Enviar resposta
                </Button>
              </div>
            </div>

            <DetailsSection title="Descrição do problema" defaultOpen>
              <div className="max-h-44 overflow-y-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">
                {selectedTicket.description || "Sem descrição."}
              </div>
            </DetailsSection>

            {selectedTicket.technicalResponse && (
              <DetailsSection title="Última resposta técnica">
                <div className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">
                  {selectedTicket.technicalResponse}
                </div>
              </DetailsSection>
            )}
          </section>

          <aside className="space-y-4">
            <DetailsSection title="Informações principais" defaultOpen>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <FieldCard label="Solicitante" value={selectedTicket.user} />
                <FieldCard label="Setor" value={selectedTicket.sector} />
                <FieldCard label="Categoria" value={selectedTicket.category} />
                <FieldCard label="Criado em" value={selectedTicket.createdAt} />
                <FieldCard label="Origem" value={selectedTicket.origin} />
                <FieldCard label="Prioridade" value={selectedTicket.priority} />
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
                        className="rounded-2xl bg-slate-50 p-3 text-sm ring-1 ring-slate-200"
                      >
                        <p className="break-words text-slate-800">
                          {event.action}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {event.date}
                        </p>
                      </div>
                    )
                  )
                ) : (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
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
