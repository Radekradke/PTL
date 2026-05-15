import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Calendar, Search, FileSpreadsheet, RotateCcw } from "lucide-react";
import { API_URL } from "@/services/api";

type Ticket = {
  id: number;
  user: string;
  sector: string;
  category: string;
  status: string;
  origin: string;
  priority: string;
  createdAt: string;
  description: string;
  technicalResponse: string;
};

export function ReportsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("Todos");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [originFilter, setOriginFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [priorityFilter, setPriorityFilter] = useState("Todas");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/tickets`);
      const data = await response.json();

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
        createdAt: ticket.createdAt
          ? new Date(ticket.createdAt).toLocaleString("pt-BR")
          : new Date().toLocaleString("pt-BR"),
      }));

      setTickets(formattedTickets);
    } catch (error) {
      console.error("Erro ao carregar tickets:", error);
    } finally {
      setLoading(false);
    }
  }

  function parseBrazilianDate(date: string) {
    const [datePart] = date.split(", ");
    const [day, month, year] = datePart.split("/");

    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const ticketDate = parseBrazilianDate(ticket.createdAt);

      const matchesSearch =
        !search ||
        ticket.user.toLowerCase().includes(search.toLowerCase()) ||
        ticket.description.toLowerCase().includes(search.toLowerCase()) ||
        ticket.category.toLowerCase().includes(search.toLowerCase());

      const matchesSector =
        sectorFilter === "Todos" || ticket.sector === sectorFilter;
      const matchesCategory =
        categoryFilter === "Todas" || ticket.category === categoryFilter;
      const matchesOrigin =
        originFilter === "Todas" || ticket.origin === originFilter;
      const matchesStatus =
        statusFilter === "Todos" || ticket.status === statusFilter;
      const matchesPriority =
        priorityFilter === "Todas" || ticket.priority === priorityFilter;

      const matchesStartDate = !startDate || ticketDate >= new Date(startDate);
      const matchesEndDate = !endDate || ticketDate <= new Date(endDate);

      return (
        matchesSearch &&
        matchesSector &&
        matchesCategory &&
        matchesOrigin &&
        matchesStatus &&
        matchesPriority &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    tickets,
    search,
    sectorFilter,
    categoryFilter,
    originFilter,
    statusFilter,
    priorityFilter,
    startDate,
    endDate,
  ]);

  const totalFilteredTickets = filteredTickets.length;
  const openFilteredTickets = filteredTickets.filter(
    (ticket) => ticket.status === "Aberto",
  ).length;
  const progressFilteredTickets = filteredTickets.filter(
    (ticket) => ticket.status === "Em andamento",
  ).length;
  const waitingUserFilteredTickets = filteredTickets.filter(
    (ticket) => ticket.status === "Aguardando usuário",
  ).length;
  const finishedFilteredTickets = filteredTickets.filter(
    (ticket) => ticket.status === "Finalizado",
  ).length;
  const offshoreFilteredTickets = filteredTickets.filter(
    (ticket) => ticket.origin === "Offshore",
  ).length;
  const baseFilteredTickets = filteredTickets.filter(
    (ticket) => ticket.origin === "Base",
  ).length;

  function exportPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Relatório de Chamados - Lifting Support", 14, 20);

    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 28);
    doc.text(`Filtros aplicados: ${getFiltersSummary()}`, 14, 34);
    doc.text(`Total de chamados: ${filteredTickets.length}`, 14, 40);

    autoTable(doc, {
      startY: 48,
      head: [
        [
          "ID",
          "Solicitante",
          "Setor",
          "Categoria",
          "Origem",
          "Status",
          "Prioridade",
          "Criado em",
        ],
      ],
      body: filteredTickets.map((ticket) => [
        `#${ticket.id}`,
        ticket.user,
        ticket.sector,
        ticket.category,
        ticket.origin,
        ticket.status,
        ticket.priority,
        ticket.createdAt,
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [30, 30, 30],
        textColor: 255,
      },
    });

    doc.save(
      `relatorio-chamados-lifting-${new Date().toISOString().split("T")[0]}.pdf`,
    );
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
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Chamados");

    XLSX.writeFile(
      workbook,
      `relatorio-chamados-lifting-${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  }

  function getFiltersSummary() {
    const filters = [];
    if (search) filters.push(`Busca: "${search}"`);
    if (sectorFilter !== "Todos") filters.push(`Setor: ${sectorFilter}`);
    if (categoryFilter !== "Todas")
      filters.push(`Categoria: ${categoryFilter}`);
    if (originFilter !== "Todas") filters.push(`Origem: ${originFilter}`);
    if (statusFilter !== "Todos") filters.push(`Status: ${statusFilter}`);
    if (priorityFilter !== "Todas")
      filters.push(`Prioridade: ${priorityFilter}`);
    if (startDate || endDate) {
      const period =
        startDate && endDate
          ? `${startDate} a ${endDate}`
          : startDate
            ? `desde ${startDate}`
            : `até ${endDate}`;
      filters.push(`Período: ${period}`);
    }

    return filters.length > 0 ? filters.join(", ") : "Nenhum filtro aplicado";
  }

  function clearFilters() {
    setSearch("");
    setSectorFilter("Todos");
    setCategoryFilter("Todas");
    setOriginFilter("Todas");
    setStatusFilter("Todos");
    setPriorityFilter("Todas");
    setStartDate("");
    setEndDate("");
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "Aberto":
        return "bg-yellow-500/20 text-yellow-400";
      case "Em andamento":
        return "bg-blue-500/20 text-blue-400";
      case "Aguardando usuário":
        return "bg-orange-500/20 text-orange-300";
      case "Finalizado":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-zinc-500/20 text-zinc-400";
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 px-6 py-4 text-sm font-medium text-zinc-300 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
            Carregando relatórios...
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8 py-6">
        <div className="rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-6 shadow-[0_25px_70px_rgba(15,23,42,0.35)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">
                Central de relatórios
              </p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl tracking-[-0.04em] text-white lg:text-5xl">
                Relatórios
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                Gere arquivos, filtre indicadores e acompanhe os chamados com a mesma leitura visual do dashboard.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
              <Button
                onClick={exportPDF}
                className="h-12 rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-600 to-red-700 px-5 font-semibold text-white shadow-lg shadow-red-950/30 transition hover:-translate-y-0.5 hover:from-rose-500 hover:to-red-600 whitespace-nowrap"
              >
                <Download size={16} className="mr-2" /> Gerar PDF
              </Button>
              <Button
                onClick={exportExcel}
                className="h-12 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600 to-green-700 px-5 font-semibold text-white shadow-lg shadow-emerald-950/30 transition hover:-translate-y-0.5 hover:from-emerald-500 hover:to-green-600 whitespace-nowrap"
              >
                <FileSpreadsheet size={16} className="mr-2" /> Gerar Excel
              </Button>
            </div>
          </div>
        </div>

        <Card className="rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 shadow-[0_20px_60px_rgba(15,23,42,0.28)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold tracking-[-0.02em] text-white">
              <span className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-300">
                <FileText size={20} />
              </span>
              Filtros do relatório
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm text-zinc-400 flex items-center gap-2">
                  <Search size={14} /> Buscar
                </label>
                <Input
                  placeholder="Nome, descrição ou categoria"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 rounded-2xl border-zinc-800 bg-zinc-900 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Setor</label>
                <Select value={sectorFilter} onValueChange={setSectorFilter}>
                  <SelectTrigger className="h-11 rounded-2xl border border-zinc-800 bg-zinc-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos</SelectItem>
                    {Array.from(new Set(tickets.map((t) => t.sector))).map(
                      (sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Categoria</label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="h-11 rounded-2xl border border-zinc-800 bg-zinc-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas">Todas</SelectItem>
                    {Array.from(new Set(tickets.map((t) => t.category))).map(
                      (category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Origem</label>
                <Select value={originFilter} onValueChange={setOriginFilter}>
                  <SelectTrigger className="h-11 rounded-2xl border border-zinc-800 bg-zinc-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas">Todas</SelectItem>
                    <SelectItem value="Base">Base</SelectItem>
                    <SelectItem value="Offshore">Offshore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11 rounded-2xl border border-zinc-800 bg-zinc-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos</SelectItem>
                    <SelectItem value="Aberto">Aberto</SelectItem>
                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                    <SelectItem value="Aguardando usuário">
                      Aguardando usuário
                    </SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Prioridade</label>
                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger className="h-11 rounded-2xl border border-zinc-800 bg-zinc-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas">Todas</SelectItem>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-400 flex items-center gap-2">
                  <Calendar size={14} /> Data Inicial
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-11 rounded-2xl border-zinc-800 bg-zinc-900 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-400 flex items-center gap-2">
                  <Calendar size={14} /> Data Final
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-11 rounded-2xl border-zinc-800 bg-zinc-900 text-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-[1.5rem] border border-cyan-500/10 bg-zinc-900/80 p-4 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p>
                  <strong className="text-white">{filteredTickets.length}</strong>{" "}
                  chamados encontrados
                </p>
                <div className="mt-2 break-words text-xs leading-5 text-zinc-500">
                  {getFiltersSummary()}
                </div>
              </div>
              <Button
                onClick={clearFilters}
                variant="outline"
                className="inline-flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 px-5 py-2 text-sm font-medium text-white transition hover:border-cyan-500 hover:text-cyan-200"
            >
                <RotateCcw size={16} className="mr-2" /> Limpar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <section>
            <h3 className="mb-4 text-sm uppercase tracking-[0.16em] text-zinc-300">
              Resumo por status
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatsCard
                title="Total filtrado"
                value={String(totalFilteredTickets)}
                tone="neutral"
              />
              <StatsCard
                title="Chamados abertos"
                value={String(openFilteredTickets)}
                tone="warning"
              />
              <StatsCard
                title="Em andamento"
                value={String(progressFilteredTickets)}
                tone="info"
              />
              <StatsCard
                title="Aguardando usuário"
                value={String(waitingUserFilteredTickets)}
                tone="danger"
              />
              <StatsCard
                title="Finalizados"
                value={String(finishedFilteredTickets)}
                tone="success"
              />
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-sm uppercase tracking-[0.16em] text-zinc-300">
              Resumo por origem
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatsCard
                title="Chamados Offshore"
                value={String(offshoreFilteredTickets)}
                tone="danger"
              />
              <StatsCard
                title="Chamados da Base"
                value={String(baseFilteredTickets)}
                tone="base"
              />
            </div>
          </section>
        </div>

        <Card className="rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 shadow-[0_20px_60px_rgba(15,23,42,0.28)]">
          <CardHeader>
            <CardTitle className="text-xl font-bold tracking-[-0.02em] text-white">
              Preview dos dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-[1.5rem] border border-zinc-800 bg-zinc-900/80">
              <table className="min-w-[900px] w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left p-3 text-zinc-400">ID</th>
                    <th className="text-left p-3 text-zinc-400">Solicitante</th>
                    <th className="text-left p-3 text-zinc-400">Setor</th>
                    <th className="text-left p-3 text-zinc-400">Categoria</th>
                    <th className="text-left p-3 text-zinc-400">Status</th>
                    <th className="text-left p-3 text-zinc-400">Origem</th>
                    <th className="text-left p-3 text-zinc-400">Prioridade</th>
                    <th className="text-left p-3 text-zinc-400">Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.slice(0, 20).map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b border-zinc-800 transition hover:bg-zinc-800/50"
                    >
                      <td className="p-3 text-white">#{ticket.id}</td>
                      <td className="p-3 text-white">{ticket.user}</td>
                      <td className="p-3 text-white">{ticket.sector}</td>
                      <td className="p-3 text-white">{ticket.category}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(ticket.status)}`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="p-3 text-white">{ticket.origin}</td>
                      <td className="p-3 text-white">{ticket.priority}</td>
                      <td className="p-3 text-white">{ticket.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTickets.length > 20 && (
              <div className="p-3 text-center text-zinc-400">
                ... e mais {filteredTickets.length - 20} registros (visíveis
                apenas no export)
              </div>
            )}

            {filteredTickets.length === 0 && (
              <div className="p-8 text-center text-zinc-400">
                Nenhum chamado encontrado com os filtros aplicados.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
