import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useNotifications } from "@/contexts/NotificationContext";

const metallicPanel = "rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#061B16_0%,#0F3D2E_46%,#164A6B_145%)] shadow-[0_24px_70px_rgba(6,27,22,0.32)]";
const metallicSoft = "rounded-[1.75rem] border border-white/15 bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur";
const inputClass = "mt-2 w-full rounded-2xl border border-white/15 bg-white/95 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200/40";
const chartCard = "rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,#08221B_0%,#103B2F_56%,#143E57_145%)] p-5 text-white shadow-[0_18px_48px_rgba(6,27,22,0.24)] sm:p-6";
const tooltipStyle = {
  backgroundColor: "#08221B",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#F8FAFC",
  boxShadow: "0 18px 50px rgba(6,27,22,0.35)",
};

export function Dashboard() {
  const { tickets } = useNotifications();

  const [sectorFilter, setSectorFilter] = useState("Todos");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [originFilter, setOriginFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Todos");

  useEffect(() => {
    console.log("Dashboard: Tickets atualizados no contexto:", tickets.length);
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSector = sectorFilter === "Todos" || ticket.sector === sectorFilter;
      const matchesCategory = categoryFilter === "Todas" || ticket.category === categoryFilter;
      const matchesOrigin = originFilter === "Todas" || ticket.origin === originFilter;
      const matchesStatus = statusFilter === "Todos" || ticket.status === statusFilter;
      return matchesSector && matchesCategory && matchesOrigin && matchesStatus;
    });
  }, [tickets, sectorFilter, categoryFilter, originFilter, statusFilter]);

  const totalTickets = filteredTickets.length;
  const openTickets = filteredTickets.filter((ticket) => ticket.status === "Aberto").length;
  const progressTickets = filteredTickets.filter((ticket) => ticket.status === "Em andamento").length;
  const waitingUserTickets = filteredTickets.filter((ticket) => ticket.status === "Aguardando usuário").length;
  const finishedTickets = filteredTickets.filter((ticket) => ticket.status === "Finalizado").length;
  const offshoreTickets = filteredTickets.filter((ticket) => ticket.origin === "Offshore").length;
  const baseTickets = filteredTickets.filter((ticket) => ticket.origin === "Base").length;

  const ticketsBySector = useMemo(() => {
    const sectors = Array.from(new Set(tickets.map((t) => t.sector)));
    return sectors.map((sector) => ({
      name: sector,
      total: filteredTickets.filter((ticket) => ticket.sector === sector).length,
    }));
  }, [filteredTickets, tickets]);

  const ticketsByCategory = useMemo(() => {
    const categories = Array.from(new Set(tickets.map((t) => t.category)));
    return categories.map((category) => ({
      name: category,
      total: filteredTickets.filter((ticket) => ticket.category === category).length,
    }));
  }, [filteredTickets, tickets]);

  const ticketsByStatus = [
    { name: "Aberto", total: openTickets },
    { name: "Em andamento", total: progressTickets },
    { name: "Aguardando usuário", total: waitingUserTickets },
    { name: "Finalizado", total: finishedTickets },
  ];

  const ticketsByOrigin = [
    { name: "Base", total: baseTickets },
    { name: "Offshore", total: offshoreTickets },
  ];

  const uniqueSectors = useMemo(() => Array.from(new Set(tickets.map((t) => t.sector))), [tickets]);
  const uniqueCategories = useMemo(() => Array.from(new Set(tickets.map((t) => t.category))), [tickets]);

  const currentFilters = [
    sectorFilter !== "Todos" ? `Setor: ${sectorFilter}` : null,
    categoryFilter !== "Todas" ? `Categoria: ${categoryFilter}` : null,
    originFilter !== "Todas" ? `Origem: ${originFilter}` : null,
    statusFilter !== "Todos" ? `Status: ${statusFilter}` : null,
  ].filter(Boolean);

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl space-y-7">
        <section className={`${metallicPanel} p-5 text-white sm:p-8`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-100/85">Visão geral</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white sm:text-5xl">Dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
                Indicadores da operação em tempo real, com leitura rápida por status, origem e setor.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[430px]">
              <div className={`${metallicSoft} p-4 text-white`}>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Filtrados</p>
                <p className="mt-2 text-3xl font-black text-white">{filteredTickets.length}</p>
              </div>
              <div className={`${metallicSoft} p-4 text-white`}>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Setores</p>
                <p className="mt-2 text-3xl font-black text-white">{uniqueSectors.length}</p>
              </div>
              <div className={`${metallicSoft} p-4 text-white`}>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Categorias</p>
                <p className="mt-2 text-3xl font-black text-white">{uniqueCategories.length}</p>
              </div>
            </div>
          </div>

          {currentFilters.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {currentFilters.map((filter) => (
                <span key={filter} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
                  {filter}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className={`${metallicPanel} p-5 text-white sm:p-6`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-[-0.03em] text-white">Filtros</h2>
              <p className="mt-1 text-sm text-white/70">Refine os indicadores do dashboard.</p>
            </div>
            <button
              onClick={() => {
                setSectorFilter("Todos");
                setCategoryFilter("Todas");
                setOriginFilter("Todas");
                setStatusFilter("Todos");
              }}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/15"
            >
              Limpar filtros
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block"><span className="text-sm font-semibold text-white/75">Setor</span>
              <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className={inputClass}>
                <option value="Todos">Todos setores</option>{uniqueSectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-sm font-semibold text-white/75">Categoria</span>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={inputClass}>
                <option value="Todas">Todas categorias</option>{uniqueCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-sm font-semibold text-white/75">Origem</span>
              <select value={originFilter} onChange={(e) => setOriginFilter(e.target.value)} className={inputClass}>
                <option value="Todas">Todas origens</option><option value="Base">Base</option><option value="Offshore">Offshore</option>
              </select>
            </label>
            <label className="block"><span className="text-sm font-semibold text-white/75">Status</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}>
                <option value="Todos">Todos status</option><option value="Aberto">Aberto</option><option value="Em andamento">Em andamento</option><option value="Aguardando usuário">Aguardando usuário</option><option value="Finalizado">Finalizado</option>
              </select>
            </label>
          </div>
        </section>

        <div className="space-y-6">
          <div>
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-[#0F3D2E]">Resumo por status</h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatsCard title="Total" value={String(totalTickets)} tone="neutral" />
              <StatsCard title="Abertos" value={String(openTickets)} tone="info" />
              <StatsCard title="Em andamento" value={String(progressTickets)} tone="warning" />
              <StatsCard title="Aguardando usuário" value={String(waitingUserTickets)} tone="danger" />
              <StatsCard title="Finalizados" value={String(finishedTickets)} tone="success" />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-[#0F3D2E]">Resumo por origem</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatsCard title="Offshore" value={String(offshoreTickets)} tone="danger" />
              <StatsCard title="Base" value={String(baseTickets)} tone="base" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className={chartCard}>
            <div className="flex items-center justify-between gap-4">
              <div><h2 className="text-xl font-black tracking-[-0.03em] text-white">Chamados por setor</h2><p className="text-sm text-emerald-50/70">Volume por área no filtro atual.</p></div>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-emerald-50">{filteredTickets.length} itens</span>
            </div>
            <div className="mt-5 h-[320px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={ticketsBySector}><XAxis dataKey="name" stroke="#6EE7B7" tick={{ fill: "#174A3A", fontSize: 12 }} /><YAxis stroke="#6EE7B7" tick={{ fill: "#174A3A", fontSize: 12 }} /><Tooltip cursor={{ fill: "rgba(23,74,58,0.05)" }} contentStyle={tooltipStyle} labelStyle={{ color: "#17221C", fontWeight: 700 }} /><Bar dataKey="total" fill="#2FA866" radius={[12, 12, 4, 4]} /></BarChart></ResponsiveContainer></div>
          </div>

          <div className={chartCard}>
            <div className="flex items-center justify-between gap-4">
              <div><h2 className="text-xl font-black tracking-[-0.03em] text-white">Chamados por categoria</h2><p className="text-sm text-emerald-50/70">Tipos de demanda mais frequentes.</p></div>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-sky-50">{uniqueCategories.length} categorias</span>
            </div>
            <div className="mt-5 h-[320px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={ticketsByCategory}><XAxis dataKey="name" stroke="#6EE7B7" tick={{ fill: "#174A3A", fontSize: 12 }} /><YAxis stroke="#6EE7B7" tick={{ fill: "#174A3A", fontSize: 12 }} /><Tooltip cursor={{ fill: "rgba(23,74,58,0.05)" }} contentStyle={tooltipStyle} labelStyle={{ color: "#17221C", fontWeight: 700 }} /><Bar dataKey="total" fill="#2563EB" radius={[12, 12, 4, 4]} /></BarChart></ResponsiveContainer></div>
          </div>

          <div className={chartCard}>
            <h2 className="text-xl font-black tracking-[-0.03em] text-white">Chamados por status</h2><p className="text-sm text-emerald-50/70">Distribuição atual da fila.</p>
            <div className="mt-5 h-[320px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={ticketsByStatus} dataKey="total" nameKey="name" outerRadius={105} innerRadius={58} paddingAngle={4} label><Cell fill="#60A5FA" /><Cell fill="#FBBF24" /><Cell fill="#FB7185" /><Cell fill="#2FA866" /></Pie><Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#17221C", fontWeight: 700 }} /></PieChart></ResponsiveContainer></div>
          </div>

          <div className={chartCard}>
            <h2 className="text-xl font-black tracking-[-0.03em] text-white">Base x Offshore</h2><p className="text-sm text-emerald-50/70">Origem dos chamados filtrados.</p>
            <div className="mt-5 h-[320px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={ticketsByOrigin} dataKey="total" nameKey="name" outerRadius={105} innerRadius={58} paddingAngle={4} label><Cell fill="#2563EB" /><Cell fill="#FB7185" /></Pie><Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#17221C", fontWeight: 700 }} /></PieChart></ResponsiveContainer></div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
