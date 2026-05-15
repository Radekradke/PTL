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
        return "bg-[#4F93D2]/15 text-[#4F93D2] border border-[#4F93D2]/25";
      case "Em andamento":
        return "bg-[#F59E0B]/15 text-[#B56F00] border border-[#F59E0B]/25";
      case "Aguardando usuário":
        return "bg-[#F59E0B]/15 text-[#B56F00] border border-[#F59E0B]/25";
      case "Finalizado":
        return "bg-[#42A95E]/15 text-[#32624A] border border-[#42A95E]/25";
      default:
        return "bg-zinc-500/20 text-[#66736B]";
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="rounded-3xl border border-[#B4D7C4]/60 bg-white px-6 py-4 text-sm font-medium text-[#32624A] shadow-[0_18px_50px_rgba(50,98,74,0.10)]">
            Carregando relatórios...
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8 py-6">
        <div className="rounded-[2rem] border border-[#B4D7C4]/60 bg-gradient-to-br from-white via-[#F8FBF9] to-[#F2F2F2] p-6 shadow-[0_25px_70px_rgba(15,23,42,0.35)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm uppercase tracking-[0.24em] text-[#42A95E]/80">
                Central de relatórios
              </p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl tracking-[-0.04em] text-[#2B2B2B] lg:text-5xl">
                Relatórios
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66736B] sm:text-base">
                Gere arquivos, filtre indicadores e acompanhe os chamados com a mesma leitura visual do dashboard.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
              <Button
                onClick={exportPDF}
                className="h-12 rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-600 to-red-700 px-5 font-semibold text-[#2B2B2B] shadow-lg shadow-red-950/30 transition hover:-translate-y-0.5 hover:from-rose-500 hover:to-red-600 whitespace-nowrap"
              >
                <Download size={16} className="mr-2" /> Gerar PDF
              </Button>
              <Button
                onClick={exportExcel}
                className="h-12 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#42A95E] to-[#32624A] px-5 font-semibold text-[#2B2B2B] shadow-lg shadow-emerald-950/30 transition hover:-translate-y-0.5 hover:from-emerald-500 hover:to-green-600 whitespace-nowrap"
              >
                <FileSpreadsheet size={16} className="mr-2" /> Gerar Excel
              </Button>
            </div>
          </div>
        </div>

        <Card className="rounded-[2rem] border border-[#B4D7C4]/60 bg-gradient-to-br from-white via-[#F8FBF9] to-[#F2F2F2] shadow-[0_18px_50px_rgba(50,98,74,0.10)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold tracking-[-0.02em] text-[#2B2B2B]">
              <span className="rounded-2xl border border-[#42A95E]/25 bg-[#42A95E]/10 p-2 text-[#42A95E]">
                <FileText size={20} />
              </span>
              Filtros do relatório
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm text-[#66736B] flex items-center gap-2">
                  <Search size={14} /> Buscar
                </label>
                <Input
                  placeholder="Nome, descrição ou categoria"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 rounded-2xl border-[#B4D7C4]/60 bg-[#F8FBF9] text-[#2B2B2B]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#66736B]">Setor</label>
                <Select value={sectorFilter} onValueChange={setSectorFilter}>
                  <SelectTrigger className="h-11 rounded-2xl border border-[#B4D7C4]/60 bg-[#F8FBF9] text-[#2B2B2B]">
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
                <label className="text-sm text-[#66736B]">Categoria</label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="h-11 rounded-2xl border border-[#B4D7C4]/60 bg-[#F8FBF9] text-[#2B2B2B]">
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
                <label className="text-sm text-[#66736B]">Origem</label>
                <Select value={originFilter} onValueChange={setOriginFilter}>
                  <SelectTrigger className="h-11 rounded-2xl border border-[#B4D7C4]/60 bg-[#F8FBF9] text-[#2B2B2B]">
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
                <label className="text-sm text-[#66736B]">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11 rounded-2xl border border-[#B4D7C4]/60 bg-[#F8FBF9] text-[#2B2B2B]">
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
                <label className="text-sm text-[#66736B]">Prioridade</label>
                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger className="h-11 rounded-2xl border border-[#B4D7C4]/60 bg-[#F8FBF9] text-[#2B2B2B]">
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
                <label className="text-sm text-[#66736B] flex items-center gap-2">
                  <Calendar size={14} /> Data Inicial
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-11 rounded-2xl border-[#B4D7C4]/60 bg-[#F8FBF9] text-[#2B2B2B]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#66736B] flex items-center gap-2">
                  <Calendar size={14} /> Data Final
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-11 rounded-2xl border-[#B4D7C4]/60 bg-[#F8FBF9] text-[#2B2B2B]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-[1.5rem] border border-[#42A95E]/15 bg-[#F8FBF9]/90 p-4 text-sm text-[#66736B] sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p>
                  <strong className="text-[#2B2B2B]">{filteredTickets.length}</strong>{" "}
                  chamados encontrados
                </p>
                <div className="mt-2 break-words text-xs leading-5 text-[#7C8A80]">
                  {getFiltersSummary()}
                </div>
              </div>
              <Button
                onClick={clearFilters}
                variant="outline"
                className="inline-flex items-center justify-center rounded-full border border-[#80B092]/60 bg-white px-5 py-2 text-sm font-medium text-[#2B2B2B] transition hover:border-[#42A95E] hover:text-[#32624A]"
            >
                <RotateCcw size={16} className="mr-2" /> Limpar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <section>
            <h3 className="mb-4 text-sm uppercase tracking-[0.16em] text-[#32624A]">
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
            <h3 className="mb-4 text-sm uppercase tracking-[0.16em] text-[#32624A]">
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

        <Card className="rounded-[2rem] border border-[#B4D7C4]/60 bg-gradient-to-br from-white via-[#F8FBF9] to-[#F2F2F2] shadow-[0_18px_50px_rgba(50,98,74,0.10)]">
          <CardHeader>
            <CardTitle className="text-xl font-bold tracking-[-0.02em] text-[#2B2B2B]">
              Preview dos dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-[1.5rem] border border-[#B4D7C4]/60 bg-[#F8FBF9]/90">
              <table className="min-w-[900px] w-full text-sm">
                <thead>
                  <tr className="border-b border-[#B4D7C4]/60">
                    <th className="text-left p-3 text-[#66736B]">ID</th>
                    <th className="text-left p-3 text-[#66736B]">Solicitante</th>
                    <th className="text-left p-3 text-[#66736B]">Setor</th>
                    <th className="text-left p-3 text-[#66736B]">Categoria</th>
                    <th className="text-left p-3 text-[#66736B]">Status</th>
                    <th className="text-left p-3 text-[#66736B]">Origem</th>
                    <th className="text-left p-3 text-[#66736B]">Prioridade</th>
                    <th className="text-left p-3 text-[#66736B]">Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.slice(0, 20).map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b border-[#B4D7C4]/60 transition hover:bg-[#EAF6EE]/50"
                    >
                      <td className="p-3 text-[#2B2B2B]">#{ticket.id}</td>
                      <td className="p-3 text-[#2B2B2B]">{ticket.user}</td>
                      <td className="p-3 text-[#2B2B2B]">{ticket.sector}</td>
                      <td className="p-3 text-[#2B2B2B]">{ticket.category}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(ticket.status)}`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="p-3 text-[#2B2B2B]">{ticket.origin}</td>
                      <td className="p-3 text-[#2B2B2B]">{ticket.priority}</td>
                      <td className="p-3 text-[#2B2B2B]">{ticket.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTickets.length > 20 && (
              <div className="p-3 text-center text-[#66736B]">
                ... e mais {filteredTickets.length - 20} registros (visíveis
                apenas no export)
              </div>
            )}

            {filteredTickets.length === 0 && (
              <div className="p-8 text-center text-[#66736B]">
                Nenhum chamado encontrado com os filtros aplicados.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
