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
      alert("Por favor, selecione o funcionário e o setor, e descreva o problema.")
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
        setIsSubmitting(false)
        return
      }

      // Reset form
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

      // Reload tickets
      onTicketsChange()
      setIsSubmitting(false)
    } catch (error) {
      console.error("Erro ao criar chamado:", error)
      alert("Erro ao criar chamado.")
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
      return "bg-yellow-500/20 text-yellow-400"
    }

    if (status === "Em andamento") {
      return "bg-blue-500/20 text-blue-400"
    }

    if (status === "Finalizado") {
      return "bg-green-500/20 text-green-400"
    }

    return "bg-zinc-500/20 text-zinc-400"
  }

  function handleAddResponse() {
    if (!selectedTicket || !technicalResponse) return

    // Atualizar no backend
    fetch(`${API_URL}/tickets/${selectedTicket.id}/response`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        technicalResponse,
      }),
    })
    .then(() => {
      // Recarregar tickets após atualização
      onTicketsChange()
      
      setSelectedTicket({
        ...selectedTicket,
        technicalResponse,
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

    // Atualizar no backend
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
      // Recarregar tickets após atualização
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
        className: "bg-green-500/20 text-green-400",
      }
    }

    if (ticket.origin === "Offshore") {
      return {
        label: "Prioridade Offshore",
        className: "bg-red-500/20 text-red-400",
      }
    }

    if (ticket.priority === "Urgente") {
      return {
        label: "Urgente",
        className: "bg-red-500/20 text-red-400",
      }
    }

    if (ticket.priority === "Alta") {
      return {
        label: "Alta prioridade",
        className: "bg-orange-500/20 text-orange-400",
      }
    }

    return {
      label: "Dentro do prazo",
      className: "bg-blue-500/20 text-blue-400",
    }
  }


  const filteredTickets = tableTickets.filter((ticket) => {
    const matchesSearch =
      ticket.user.toLowerCase().includes(search.toLowerCase()) ||
      ticket.sector.toLowerCase().includes(search.toLowerCase()) ||
      ticket.category.toLowerCase().includes(search.toLowerCase()) ||
      String(ticket.id).includes(search)

    const matchesStatus =
      statusFilter === "Todos" || ticket.status === statusFilter

    const matchesOrigin =
      originFilter === "Todas" || ticket.origin === originFilter

    const matchesPriority =
      priorityFilter === "Todas" || ticket.priority === priorityFilter

    const matchesSector =
      sectorFilter === "Todos" || ticket.sector === sectorFilter

    return matchesSearch && matchesStatus && matchesOrigin && matchesPriority && matchesSector
  })

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.25)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">Central de chamados</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-white sm:text-3xl">Lista de chamados</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Filtre, acompanhe e atualize os chamados sem bagunça visual. O botão de criação fica aqui no topo, estilo cockpit.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:shrink-0">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-11 w-full rounded-2xl bg-sky-600 px-5 text-white hover:bg-sky-500 sm:w-auto whitespace-nowrap">
                  Abrir novo chamado
                </Button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.25)] sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Novo chamado</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm text-zinc-300">Solicitante</label>
                    <select
                      value={employeeId}
                      onChange={(e) => handleEmployeeChange(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-300 shadow-sm outline-none focus:border-sky-500"
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
                      <label className="text-sm text-zinc-300">Setor vinculado</label>
                      <div className="min-h-[48px] rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-zinc-300 shadow-sm">
                        {selectedEmployeeSector?.name || sectors.find((sect) => String(sect.id) === sectorId)?.name || "Selecione um funcionário"}
                      </div>
                      <p className="text-xs text-zinc-500">
                        O setor é preenchido automaticamente pelo cadastro do funcionário.
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm text-zinc-300">Categoria</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-300 shadow-sm outline-none focus:border-sky-500"
                      >
                        {categories.map((categoryItem) => (
                          <option key={categoryItem}>{categoryItem}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm text-zinc-300">Origem</label>
                      <select
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-300 shadow-sm outline-none focus:border-sky-500"
                      >
                        <option>Base</option>
                        <option>Offshore</option>
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm text-zinc-300">Prioridade</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-300 shadow-sm outline-none focus:border-sky-500"
                      >
                        <option>Baixa</option>
                        <option>Normal</option>
                        <option>Alta</option>
                        <option>Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm text-zinc-300">Descrição</label>
                    <Textarea
                      placeholder="Descreva o problema..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[140px] border-zinc-800 bg-zinc-900 text-white"
                    />
                  </div>

                  <Button
                    className="h-11 w-full rounded-2xl bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50"
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
              className="h-11 w-full rounded-2xl border-sky-500/20 bg-sky-500/10 text-sky-300 hover:bg-sky-500/15 hover:text-sky-200 sm:w-auto whitespace-nowrap"
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

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Input
            placeholder="Buscar chamado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 border-zinc-800 bg-zinc-900 text-white xl:col-span-1"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-zinc-300 shadow-sm outline-none focus:border-sky-500"
          >
            <option value="Todos">Todos status</option>
            <option value="Aberto">Aberto</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Finalizado">Finalizado</option>
          </select>

          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="h-11 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-zinc-300 shadow-sm outline-none focus:border-sky-500"
          >
            <option value="Todas">Todas origens</option>
            <option value="Offshore">Offshore</option>
            <option value="Base">Base</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-11 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-zinc-300 shadow-sm outline-none focus:border-sky-500"
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
            className="h-11 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-zinc-300 shadow-sm outline-none focus:border-sky-500"
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
        <p className="text-sm text-zinc-400">
          <span className="font-semibold text-white">{filteredTickets.length}</span> chamado(s) encontrado(s)
        </p>
      </div>

      <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.2)] sm:p-4">
        <div className="hidden overflow-x-auto rounded-[1.5rem] border border-zinc-800 bg-zinc-900 lg:block">
          <table className="min-w-[1120px] w-full text-left text-sm">
            <thead className="bg-zinc-800 text-xs uppercase tracking-[0.12em] text-zinc-300">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">ID</th>
                <th className="px-4 py-3 whitespace-nowrap">Usuário</th>
                <th className="px-4 py-3 whitespace-nowrap">Setor</th>
                <th className="px-4 py-3 whitespace-nowrap">Categoria</th>
                <th className="px-4 py-3 whitespace-nowrap">Origem</th>
                <th className="px-4 py-3 whitespace-nowrap">Prioridade</th>
                <th className="px-4 py-3 whitespace-nowrap">SLA</th>
                <th className="px-4 py-3 whitespace-nowrap">Criado</th>
                <th className="px-4 py-3 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 whitespace-nowrap">Atualizar</th>
                <th className="px-4 py-3 whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="border-t border-zinc-800 transition-all hover:bg-zinc-800/40">
                  <td className="px-4 py-4 text-white whitespace-nowrap">#{ticket.id}</td>
                  <td className="px-4 py-4 text-zinc-300 whitespace-nowrap">{ticket.user}</td>
                  <td className="px-4 py-4 text-zinc-300 whitespace-nowrap">{ticket.sector}</td>
                  <td className="px-4 py-4 text-zinc-300 whitespace-nowrap">{ticket.category}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${ticket.origin === "Offshore" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
                      {ticket.origin}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${ticket.priority === "Urgente" ? "bg-red-500/20 text-red-400" : ticket.priority === "Alta" ? "bg-orange-500/20 text-orange-400" : ticket.priority === "Normal" ? "bg-blue-500/20 text-blue-400" : "bg-zinc-500/20 text-zinc-400"}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getSlaStatus(ticket).className}`}>
                      {getSlaStatus(ticket).label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-zinc-300 whitespace-nowrap">{ticket.createdAt}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <select
                      value={ticket.status}
                      onChange={(e) => handleChangeStatus(ticket.id, e.target.value)}
                      className="w-full min-w-[150px] rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-300 outline-none focus:border-sky-500"
                    >
                      <option>Aberto</option>
                      <option>Em andamento</option>
                      <option>Aguardando usuário</option>
                      <option>Finalizado</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Button variant="outline" size="sm" className="rounded-xl whitespace-nowrap" onClick={() => setSelectedTicket(ticket)}>
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
            <div key={ticket.id} className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900/80 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.2)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Chamado #{ticket.id}</p>
                  <h3 className="mt-1 truncate text-base font-bold text-white">{ticket.category}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{ticket.user} · {ticket.sector}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>

              <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                {ticket.description || "Sem descrição."}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <span className={`rounded-full px-3 py-2 text-center font-semibold ${ticket.origin === "Offshore" ? "bg-red-500/20 text-red-300" : "bg-blue-500/20 text-blue-300"}`}>
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
                  className="h-11 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-300 outline-none focus:border-sky-500"
                >
                  <option>Aberto</option>
                  <option>Em andamento</option>
                  <option>Aguardando usuário</option>
                  <option>Finalizado</option>
                </select>
                <Button variant="outline" className="h-11 rounded-2xl border-sky-500/20 bg-sky-500/10 text-sky-300 hover:bg-sky-500/15" onClick={() => setSelectedTicket(ticket)}>
                  Ver detalhes
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredTickets.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-400">
            Nenhum chamado encontrado com os filtros aplicados.
          </div>
        )}
      </div>

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] overflow-hidden rounded-[1.5rem] border border-zinc-800 bg-zinc-950 p-0 text-white shadow-[0_24px_80px_rgba(15,23,42,0.45)] sm:max-w-3xl sm:rounded-[2rem]">
          <DialogHeader className="border-b border-zinc-800 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold">Detalhes do chamado #{selectedTicket?.id}</DialogTitle>
                <p className="mt-1 text-sm text-zinc-400">
                  Acompanhe informações, resposta técnica e histórico do atendimento.
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
            <div className="max-h-[calc(92vh-92px)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                <div className="space-y-5">
                  <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300/70">
                      Informações principais
                    </h3>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-zinc-950/70 p-3">
                        <p className="text-xs text-zinc-500">Solicitante</p>
                        <p className="mt-1 break-words text-sm font-medium text-white">{selectedTicket.user}</p>
                      </div>

                      <div className="rounded-2xl bg-zinc-950/70 p-3">
                        <p className="text-xs text-zinc-500">Setor</p>
                        <p className="mt-1 break-words text-sm font-medium text-white">{selectedTicket.sector}</p>
                      </div>

                      <div className="rounded-2xl bg-zinc-950/70 p-3">
                        <p className="text-xs text-zinc-500">Categoria</p>
                        <p className="mt-1 break-words text-sm font-medium text-white">{selectedTicket.category}</p>
                      </div>

                      <div className="rounded-2xl bg-zinc-950/70 p-3">
                        <p className="text-xs text-zinc-500">Criado em</p>
                        <p className="mt-1 break-words text-sm font-medium text-white">{selectedTicket.createdAt}</p>
                      </div>

                      <div className="rounded-2xl bg-zinc-950/70 p-3">
                        <p className="text-xs text-zinc-500">Origem</p>
                        <p className="mt-1 break-words text-sm font-medium text-white">{selectedTicket.origin}</p>
                      </div>

                      <div className="rounded-2xl bg-zinc-950/70 p-3">
                        <p className="text-xs text-zinc-500">Prioridade</p>
                        <p className="mt-1 break-words text-sm font-medium text-white">{selectedTicket.priority}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                    <p className="text-sm font-semibold text-zinc-200">Descrição</p>
                    <div className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm leading-6 text-zinc-300">
                      {selectedTicket.description || "Sem descrição."}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                    <p className="text-sm font-semibold text-zinc-200">Resposta técnica</p>
                    {selectedTicket.technicalResponse ? (
                      <div className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm leading-6 text-zinc-300">
                        {selectedTicket.technicalResponse}
                      </div>
                    ) : (
                      <p className="mt-3 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-500">
                        Nenhuma resposta adicionada ainda.
                      </p>
                    )}
                  </div>
                </div>

                <aside className="space-y-5">

                  <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                    <p className="text-sm font-semibold text-zinc-200">Timeline</p>
                    <div className="mt-3 max-h-56 space-y-3 overflow-y-auto pr-1">
                      {selectedTicket.timeline?.length ? (
                        selectedTicket.timeline.map((event: { date: string; action: string }, index: number) => (
                          <div key={index} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
                            <p className="break-words text-sm text-white">{event.action}</p>
                            <p className="mt-1 text-xs text-zinc-500">{event.date}</p>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-500">
                          Nenhum evento registrado.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                    <label className="text-sm font-semibold text-zinc-200">Nova resposta técnica</label>
                    <Textarea
                      placeholder="Digite a resposta técnica..."
                      value={technicalResponse}
                      onChange={(e) => setTechnicalResponse(e.target.value)}
                      className="mt-3 min-h-[120px] border border-zinc-800 bg-zinc-950 text-white"
                    />

                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                      <Button className="h-11 rounded-2xl bg-sky-600 text-white hover:bg-sky-500" onClick={handleAddResponse}>
                        Salvar resposta
                      </Button>
                      <Button className="h-11 rounded-2xl bg-green-700 text-white hover:bg-green-800" onClick={handleFinishTicket}>
                        Finalizar chamado
                      </Button>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}