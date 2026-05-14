import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { categories } from "@/lib/categories";
import { API_URL } from "@/services/api";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, PlusCircle, RotateCcw, Send, CheckCircle2, MessageSquare } from "lucide-react";

interface Sector {
  id: number;
  name: string;
  pin: string;
}

interface Employee {
  id: number;
  name: string;
  sectorId: number;
  sector: Sector;
}

interface TicketsTableProps {
  tickets: any[];
  onTicketsChange: () => void;
}

interface TicketMessage {
  id: number;
  ticketId: number;
  senderType: "employee" | "technician" | string;
  senderName: string;
  message: string;
  createdAt: string;
}

export function TicketsTable({ tickets, onTicketsChange }: TicketsTableProps) {
  const [tableTickets, setTableTickets] = useState<any[]>(tickets);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [category, setCategory] = useState("PC");
  const [sectorId, setSectorId] = useState("");
  const [origin, setOrigin] = useState("Base");
  const [priority, setPriority] = useState("Normal");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [originFilter, setOriginFilter] = useState("Todas");
  const [priorityFilter, setPriorityFilter] = useState("Todas");
  const [sectorFilter, setSectorFilter] = useState("Todos");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [technicalResponse, setTechnicalResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const selectedEmployee = employees.find(
    (employee) => String(employee.id) === employeeId,
  );
  const selectedEmployeeSector = selectedEmployee?.sector;

  function handleEmployeeChange(value: string) {
    setEmployeeId(value);

    const employee = employees.find((item) => String(item.id) === value);

    if (employee?.sectorId) {
      setSectorId(String(employee.sectorId));
      return;
    }

    if (employee?.sector?.id) {
      setSectorId(String(employee.sector.id));
      return;
    }

    setSectorId("");
  }

  useEffect(() => {
    loadEmployeesAndSectors();
    setTableTickets(tickets);
  }, [tickets]);

  useEffect(() => {
    if (!selectedTicket) {
      setMessages([]);
      setTechnicalResponse("");
      return;
    }

    loadTicketMessages(selectedTicket.id);
  }, [selectedTicket?.id]);

  async function loadTicketMessages(ticketId: number) {
    try {
      setIsLoadingMessages(true);
      const response = await fetch(`${API_URL}/tickets/${ticketId}/messages`);

      if (!response.ok) {
        setMessages([]);
        return;
      }

      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Erro ao carregar mensagens do chamado:", error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function loadEmployeesAndSectors() {
    try {
      const [employeesRes, sectorsRes] = await Promise.all([
        fetch(`${API_URL}/employees`),
        fetch(`${API_URL}/sectors`),
      ]);

      const employeesData = await employeesRes.json();
      const sectorsData = await sectorsRes.json();

      setEmployees(employeesData);
      setSectors(sectorsData);

      if (employeesData.length > 0) {
        const firstEmployee = employeesData[0];

        setEmployeeId(String(firstEmployee.id));
        setSectorId(
          String(firstEmployee.sectorId || firstEmployee.sector?.id || ""),
        );
      } else if (sectorsData.length > 0) {
        setSectorId(String(sectorsData[0].id));
      }
    } catch (error) {
      console.error("Erro ao carregar funcionários e setores:", error);
    }
  }

  function getCurrentDateTime() {
    return new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleCreateTicket() {
    if (!employeeId || !sectorId || !description) {
      alert(
        "Por favor, selecione o funcionário e o setor, e descreva o problema.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: Number(employeeId),
          category,
          origin,
          description,
        }),
      });

      if (!response.ok) {
        alert("Erro ao criar chamado.");
        setIsSubmitting(false);
        return;
      }

      // Reset form
      if (employees.length > 0) {
        const firstEmployee = employees[0];

        setEmployeeId(String(firstEmployee.id));
        setSectorId(
          String(firstEmployee.sectorId || firstEmployee.sector?.id || ""),
        );
      } else {
        setEmployeeId("");
        setSectorId("");
      }

      setCategory("PC");
      setOrigin("Base");
      setDescription("");
      setPriority("Normal");

      // Reload tickets
      onTicketsChange();
      setIsSubmitting(false);
    } catch (error) {
      console.error("Erro ao criar chamado:", error);
      alert("Erro ao criar chamado.");
      setIsSubmitting(false);
    }
  }

  async function handleChangeStatus(ticketId: number, newStatus: string) {
    try {
      const response = await fetch(`${API_URL}/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        alert("Erro ao alterar status do chamado");
        return;
      }

      const updatedTicket = await response.json();

      onTicketsChange();

      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({
          ...selectedTicket,
          status: updatedTicket.status || newStatus,
          timeline: (updatedTicket.timeline || []).map((event: any) => ({
            date: event.createdAt
              ? new Date(event.createdAt).toLocaleString("pt-BR")
              : event.date || getCurrentDateTime(),
            action: event.action,
          })),
        });
      }
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      alert("Erro ao alterar status do chamado");
    }
  }

  function getStatusStyle(status: string) {
    if (status === "Aberto") {
      return "bg-yellow-500/20 text-yellow-400";
    }

    if (status === "Em andamento") {
      return "bg-blue-500/20 text-blue-400";
    }

    if (status === "Aguardando usuário") {
      return "bg-orange-500/20 text-orange-300";
    }

    if (status === "Finalizado") {
      return "bg-green-500/20 text-green-400";
    }

    return "bg-zinc-500/20 text-zinc-400";
  }

  async function handleAddResponse() {
    if (!selectedTicket || !technicalResponse.trim()) return;

    setIsSendingMessage(true);

    try {
      const response = await fetch(
        `${API_URL}/tickets/${selectedTicket.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            senderType: "technician",
            senderName: "Técnico",
            message: technicalResponse.trim(),
          }),
        },
      );

      if (!response.ok) {
        alert("Erro ao enviar resposta técnica.");
        return;
      }

      const newMessage = await response.json();

      setMessages((currentMessages) => [...currentMessages, newMessage]);
      setSelectedTicket({
        ...selectedTicket,
        technicalResponse: technicalResponse.trim(),
        status: "Aguardando usuário",
        timeline: [
          ...(selectedTicket.timeline || []),
          {
            date: getCurrentDateTime(),
            action: "Técnico respondeu ao chamado",
          },
          {
            date: getCurrentDateTime(),
            action: "Status alterado para Aguardando usuário",
          },
        ],
      });

      setTechnicalResponse("");
      onTicketsChange();
    } catch (error) {
      console.error("Erro ao enviar resposta técnica:", error);
      alert("Erro ao enviar resposta técnica.");
    } finally {
      setIsSendingMessage(false);
    }
  }

  function handleFinishTicket() {
    if (!selectedTicket) return;

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
        onTicketsChange();

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
        });
      })
      .catch((error) => {
        console.error("Erro ao finalizar chamado:", error);
        alert("Erro ao finalizar chamado");
      });
  }

  function getSlaStatus(ticket: any) {
    if (ticket.status === "Finalizado") {
      return {
        label: "Concluído",
        className: "bg-green-500/20 text-green-400",
      };
    }

    if (ticket.origin === "Offshore") {
      return {
        label: "Prioridade Offshore",
        className: "bg-red-500/20 text-red-400",
      };
    }

    if (ticket.priority === "Urgente") {
      return {
        label: "Urgente",
        className: "bg-red-500/20 text-red-400",
      };
    }

    if (ticket.priority === "Alta") {
      return {
        label: "Alta prioridade",
        className: "bg-orange-500/20 text-orange-400",
      };
    }

    return {
      label: "Dentro do prazo",
      className: "bg-blue-500/20 text-blue-400",
    };
  }

  const filteredTickets = tableTickets.filter((ticket) => {
    const matchesSearch =
      ticket.user.toLowerCase().includes(search.toLowerCase()) ||
      ticket.sector.toLowerCase().includes(search.toLowerCase()) ||
      ticket.category.toLowerCase().includes(search.toLowerCase()) ||
      String(ticket.id).includes(search);

    const matchesStatus =
      statusFilter === "Todos" || ticket.status === statusFilter;

    const matchesOrigin =
      originFilter === "Todas" || ticket.origin === originFilter;

    const matchesPriority =
      priorityFilter === "Todas" || ticket.priority === priorityFilter;

    const matchesSector =
      sectorFilter === "Todos" || ticket.sector === sectorFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesOrigin &&
      matchesPriority &&
      matchesSector
    );
  });

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.28)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
              Central de chamados
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-white">
              Lista de chamados
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Filtre, acompanhe, responda e atualize chamados com uma experiência visual alinhada ao dashboard.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:shrink-0">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-12 w-full rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-600 to-cyan-700 px-5 font-semibold text-white shadow-lg shadow-sky-950/30 transition hover:-translate-y-0.5 hover:from-sky-500 hover:to-cyan-600 sm:w-auto whitespace-nowrap">
                  <PlusCircle size={17} className="mr-2" /> Abrir novo chamado
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
                      <label className="text-sm text-zinc-300">
                        Setor vinculado
                      </label>
                      <div className="min-h-[48px] rounded-2xl border border-cyan-500/10 bg-zinc-900/80 px-4 py-3 text-zinc-300 shadow-sm">
                        {selectedEmployeeSector?.name ||
                          sectors.find((sect) => String(sect.id) === sectorId)
                            ?.name ||
                          "Selecione um funcionário"}
                      </div>
                      <p className="text-xs text-zinc-500">
                        O setor é preenchido automaticamente pelo cadastro do
                        funcionário.
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
                      <label className="text-sm text-zinc-300">
                        Prioridade
                      </label>
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
                    className="h-12 w-full rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-600 to-cyan-700 font-semibold text-white shadow-lg shadow-sky-950/30 transition hover:-translate-y-0.5 hover:from-sky-500 hover:to-cyan-600 disabled:opacity-50"
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
              className="h-12 w-full rounded-2xl border-zinc-700 px-5 font-semibold text-zinc-300 transition hover:-translate-y-0.5 hover:border-cyan-500/40 hover:bg-zinc-800 hover:text-white sm:w-auto whitespace-nowrap"
              onClick={() => {
                setSearch("");
                setStatusFilter("Todos");
                setOriginFilter("Todas");
                setPriorityFilter("Todas");
                setSectorFilter("Todos");
              }}
            >
              <RotateCcw size={16} className="mr-2" /> Limpar filtros
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
            <option value="Aguardando usuário">Aguardando usuário</option>
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
          <span className="font-semibold text-white">
            {filteredTickets.length}
          </span>{" "}
          chamado(s) encontrado(s)
        </p>
      </div>

      <div className="rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.28)] sm:p-4">
        <div className="overflow-x-auto rounded-[1.5rem] border border-zinc-800 bg-zinc-900/80">
          <table className="min-w-[1120px] w-full text-left text-sm">
            <thead className="bg-zinc-800/80 text-xs uppercase tracking-[0.12em] text-zinc-300">
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
                <tr
                  key={ticket.id}
                  className="border-t border-zinc-800 transition-all hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-4 text-white whitespace-nowrap">
                    #{ticket.id}
                  </td>
                  <td className="px-4 py-4 text-zinc-300 whitespace-nowrap">
                    {ticket.user}
                  </td>
                  <td className="px-4 py-4 text-zinc-300 whitespace-nowrap">
                    {ticket.sector}
                  </td>
                  <td className="px-4 py-4 text-zinc-300 whitespace-nowrap">
                    {ticket.category}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${ticket.origin === "Offshore" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}
                    >
                      {ticket.origin}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${ticket.priority === "Urgente" ? "bg-red-500/20 text-red-400" : ticket.priority === "Alta" ? "bg-orange-500/20 text-orange-400" : ticket.priority === "Normal" ? "bg-blue-500/20 text-blue-400" : "bg-zinc-500/20 text-zinc-400"}`}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getSlaStatus(ticket).className}`}
                    >
                      {getSlaStatus(ticket).label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-zinc-300 whitespace-nowrap">
                    {ticket.createdAt}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(ticket.status)}`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <select
                      value={ticket.status}
                      onChange={(e) =>
                        handleChangeStatus(ticket.id, e.target.value)
                      }
                      className="w-full min-w-[150px] rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-300 outline-none focus:border-sky-500"
                    >
                      <option>Aberto</option>
                      <option>Em andamento</option>
                      <option>Aguardando usuário</option>
                      <option>Finalizado</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-zinc-700 font-semibold text-zinc-200 transition hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-sky-100 whitespace-nowrap"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <Eye size={15} className="mr-2" /> Ver detalhes
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTickets.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-400">
            Nenhum chamado encontrado com os filtros aplicados.
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedTicket}
        onOpenChange={() => setSelectedTicket(null)}
      >
        <DialogContent className="max-h-[88vh] overflow-hidden rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 p-0 text-white shadow-[0_24px_80px_rgba(15,23,42,0.45)] sm:max-w-5xl">
          <DialogHeader className="border-b border-zinc-800 bg-zinc-950/60 px-6 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold">
                  Conversa do chamado #{selectedTicket?.id}
                </DialogTitle>
                <p className="mt-1 text-sm text-zinc-400">
                  Histórico completo entre equipe técnica e solicitante. Tudo
                  registrado no chamado.
                </p>
              </div>

              {selectedTicket && (
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(selectedTicket.status)}`}
                >
                  {selectedTicket.status}
                </span>
              )}
            </div>
          </DialogHeader>

          {selectedTicket && (
            <div className="grid max-h-[calc(88vh-96px)] overflow-hidden lg:grid-cols-[0.95fr_1.35fr]">
              <aside className="max-h-[calc(88vh-96px)] overflow-y-auto border-b border-zinc-800 p-5 lg:border-b-0 lg:border-r">
                <div className="space-y-4">
                  <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-[0_15px_40px_rgba(15,23,42,0.18)]">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300/70">
                      Informações principais
                    </h3>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      <div className="rounded-2xl bg-zinc-950/70 p-3">
                        <p className="text-xs text-zinc-500">Solicitante</p>
                        <p className="mt-1 break-words text-sm font-medium text-white">
                          {selectedTicket.user}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-zinc-950/70 p-3">
                        <p className="text-xs text-zinc-500">Setor</p>
                        <p className="mt-1 break-words text-sm font-medium text-white">
                          {selectedTicket.sector}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-zinc-950/70 p-3">
                        <p className="text-xs text-zinc-500">Categoria</p>
                        <p className="mt-1 break-words text-sm font-medium text-white">
                          {selectedTicket.category}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-zinc-950/70 p-3">
                        <p className="text-xs text-zinc-500">Criado em</p>
                        <p className="mt-1 break-words text-sm font-medium text-white">
                          {selectedTicket.createdAt}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-zinc-950/70 p-3">
                        <p className="text-xs text-zinc-500">Origem</p>
                        <p className="mt-1 break-words text-sm font-medium text-white">
                          {selectedTicket.origin}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-zinc-950/70 p-3">
                        <p className="text-xs text-zinc-500">Prioridade</p>
                        <p className="mt-1 break-words text-sm font-medium text-white">
                          {selectedTicket.priority}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-[0_15px_40px_rgba(15,23,42,0.18)]">
                    <p className="text-sm font-semibold text-zinc-200">
                      Descrição inicial
                    </p>
                    <div className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm leading-6 text-zinc-300">
                      {selectedTicket.description || "Sem descrição."}
                    </div>
                  </div>

                

                  <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-[0_15px_40px_rgba(15,23,42,0.18)]">
                    <p className="text-sm font-semibold text-zinc-200">
                      Timeline operacional
                    </p>
                    <div className="mt-3 max-h-56 space-y-3 overflow-y-auto pr-1">
                      {selectedTicket.timeline?.length ? (
                        selectedTicket.timeline.map(
                          (
                            event: { date: string; action: string },
                            index: number,
                          ) => (
                            <div
                              key={index}
                              className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3"
                            >
                              <p className="break-words text-sm text-white">
                                {event.action}
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                {event.date}
                              </p>
                            </div>
                          ),
                        )
                      ) : (
                        <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-500">
                          Nenhum evento registrado.
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    className="h-12 w-full rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600 to-green-700 font-semibold text-white shadow-lg shadow-emerald-950/30 transition hover:-translate-y-0.5 hover:from-emerald-500 hover:to-green-600"
                    onClick={handleFinishTicket}
                  >
                    <CheckCircle2 size={17} className="mr-2" /> Finalizar chamado
                  </Button>
                </div>
              </aside>

              <section className="flex max-h-[calc(88vh-96px)] min-h-[520px] flex-col bg-zinc-950">
                <div className="border-b border-zinc-800 px-5 py-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-white">
                    <MessageSquare size={16} className="text-sky-300" /> Chat do atendimento
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Use este espaço para orientar o funcionário e manter o
                    histórico centralizado.
                  </p>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                  {isLoadingMessages ? (
                    <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-500">
                      Carregando conversa...
                    </p>
                  ) : messages.length > 0 ? (
                    messages.map((message) => {
                      const isTechnician = message.senderType === "technician";

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isTechnician ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[82%] rounded-3xl border px-4 py-3 shadow-sm ${
                              isTechnician
                                ? "border-sky-500/30 bg-sky-500/15 text-sky-50"
                                : "border-zinc-800 bg-zinc-900 text-zinc-100"
                            }`}
                          >
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                                {isTechnician
                                  ? "Técnico"
                                  : message.senderName || "Funcionário"}
                              </span>
                              <span className="text-[11px] text-zinc-500">
                                {new Date(message.createdAt).toLocaleString(
                                  "pt-BR",
                                )}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {message.message}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-500">
                      Nenhuma mensagem registrada ainda. A descrição inicial
                      aparece no chamado e as próximas respostas ficarão aqui.
                    </p>
                  )}
                </div>

                <div className="border-t border-zinc-800 bg-zinc-950 p-5">
                  <label className="text-sm font-semibold text-zinc-200">
                    Responder como técnico
                  </label>
                  <Textarea
                    placeholder="Digite a resposta para o funcionário..."
                    value={technicalResponse}
                    onChange={(e) => setTechnicalResponse(e.target.value)}
                    className="mt-3 min-h-[110px] border border-zinc-800 bg-zinc-900 text-white"
                  />

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-zinc-500">
                      Ao responder, o status vira{" "}
                      <strong className="text-orange-300">
                        Aguardando usuário
                      </strong>
                      .
                    </p>
                    <Button
                      className="h-12 rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-600 to-cyan-700 px-5 font-semibold text-white shadow-lg shadow-sky-950/30 transition hover:-translate-y-0.5 hover:from-sky-500 hover:to-cyan-600 disabled:opacity-50"
                      onClick={handleAddResponse}
                      disabled={isSendingMessage || !technicalResponse.trim()}
                    >
                      <Send size={16} className="mr-2" /> {isSendingMessage ? "Enviando..." : "Enviar resposta"}
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
