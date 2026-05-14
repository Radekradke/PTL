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
      const matchesSector =
        sectorFilter === "Todos" || ticket.sector === sectorFilter;

      const matchesCategory =
        categoryFilter === "Todas" || ticket.category === categoryFilter;

      const matchesOrigin =
        originFilter === "Todas" || ticket.origin === originFilter;

      const matchesStatus =
        statusFilter === "Todos" || ticket.status === statusFilter;

      return matchesSector && matchesCategory && matchesOrigin && matchesStatus;
    });
  }, [tickets, sectorFilter, categoryFilter, originFilter, statusFilter]);

  const totalTickets = filteredTickets.length;

  const openTickets = filteredTickets.filter(
    (ticket) => ticket.status === "Aberto",
  ).length;

  const progressTickets = filteredTickets.filter(
    (ticket) => ticket.status === "Em andamento",
  ).length;

  const waitingUserTickets = filteredTickets.filter(
    (ticket) => ticket.status === "Aguardando usuário",
  ).length;

  const finishedTickets = filteredTickets.filter(
    (ticket) => ticket.status === "Finalizado",
  ).length;

  const offshoreTickets = filteredTickets.filter(
    (ticket) => ticket.origin === "Offshore",
  ).length;

  const ticketsBySector = useMemo(() => {
    const sectors = Array.from(new Set(tickets.map((t) => t.sector)));
    return sectors.map((sector) => ({
      name: sector,
      total: filteredTickets.filter((ticket) => ticket.sector === sector)
        .length,
    }));
  }, [filteredTickets, tickets]);

  const ticketsByCategory = useMemo(() => {
    const categories = Array.from(new Set(tickets.map((t) => t.category)));
    return categories.map((category) => ({
      name: category,
      total: filteredTickets.filter((ticket) => ticket.category === category)
        .length,
    }));
  }, [filteredTickets, tickets]);

  const ticketsByStatus = [
    {
      name: "Aberto",
      total: openTickets,
    },
    {
      name: "Em andamento",
      total: progressTickets,
    },
    {
      name: "Aguardando usuário",
      total: waitingUserTickets,
    },
    {
      name: "Finalizado",
      total: finishedTickets,
    },
  ];

  const ticketsByOrigin = [
    {
      name: "Base",
      total: filteredTickets.filter((ticket) => ticket.origin === "Base")
        .length,
    },
    {
      name: "Offshore",
      total: offshoreTickets,
    },
  ];

  const uniqueSectors = useMemo(
    () => Array.from(new Set(tickets.map((t) => t.sector))),
    [tickets],
  );

  const uniqueCategories = useMemo(
    () => Array.from(new Set(tickets.map((t) => t.category))),
    [tickets],
  );

  const baseTickets = filteredTickets.filter(
    (ticket) => ticket.origin === "Base",
  ).length;

  const currentFilters = [
    sectorFilter !== "Todos" ? `Setor: ${sectorFilter}` : null,
    categoryFilter !== "Todas" ? `Categoria: ${categoryFilter}` : null,
    originFilter !== "Todas" ? `Origem: ${originFilter}` : null,
    statusFilter !== "Todos" ? `Status: ${statusFilter}` : null,
  ].filter(Boolean);

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <div className="relative overflow-hidden rounded-[2.25rem] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_32%),linear-gradient(135deg,#09090b,#18181b_45%,#09090b)] p-6 shadow-[0_28px_90px_rgba(15,23,42,0.48)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">
                Visão geral
              </p>
              <h1 className="mt-2 text-4xl font-bold text-white sm:text-5xl">
                Dashboard de Chamados
              </h1>
              <p className="mt-3 max-w-2xl text-zinc-400">
                Monitoramento em tempo real das demandas. Filtros inteligentes e
                gráficos rápidos para você tomar decisão com clareza.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-1 hover:border-cyan-500/20">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                  Chamados filtrados
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {filteredTickets.length}
                </p>
              </div>
              <div className="rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 p-5 text-center shadow-[0_18px_50px_rgba(15,23,42,0.25)] transition hover:-translate-y-1 hover:border-cyan-500/20">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                  Setores ativos
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {uniqueSectors.length}
                </p>
              </div>
              <div className="rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 p-5 text-center shadow-[0_18px_50px_rgba(15,23,42,0.25)] transition hover:-translate-y-1 hover:border-cyan-500/20">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                  Categorias ativas
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {uniqueCategories.length}
                </p>
              </div>
            </div>
          </div>

          {currentFilters.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {currentFilters.map((filter) => (
                <span
                  key={filter}
                  className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300"
                >
                  {filter}
                </span>
              ))}
            </div>
          )}
        </div>

        <section className="rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Filtros rápidos
              </h2>
              <p className="text-sm text-zinc-400">
                Use os filtros para segmentar os resultados do dashboard.
              </p>
            </div>
            <button
              onClick={() => {
                setSectorFilter("Todos");
                setCategoryFilter("Todas");
                setOriginFilter("Todas");
                setStatusFilter("Todos");
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 px-5 py-3 text-sm font-semibold text-sky-300 transition hover:-translate-y-0.5 hover:border-sky-400/40 hover:bg-sky-500/15 hover:text-sky-200"
            >
              Limpar filtros
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="block">
              <span className="text-sm text-zinc-400">Setor</span>
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
              >
                <option value="Todos">Todos Setores</option>
                {uniqueSectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-zinc-400">Categoria</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
              >
                <option value="Todas">Todas Categorias</option>
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-zinc-400">Origem</span>
              <select
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
              >
                <option value="Todas">Todas Origens</option>
                <option value="Base">Base</option>
                <option value="Offshore">Offshore</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-zinc-400">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
              >
                <option value="Todos">Todos Status</option>
                <option value="Aberto">Aberto</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Aguardando usuário">Aguardando usuário</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </label>
          </div>
        </section>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm uppercase tracking-[0.16em] text-zinc-300 mb-4">
              Resumo por status
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatsCard
                title="Total de Chamados"
                value={String(totalTickets)}
                tone="neutral"
              />
              <StatsCard
                title="Chamados Abertos"
                value={String(openTickets)}
                tone="warning"
              />
              <StatsCard
                title="Em andamento"
                value={String(progressTickets)}
                tone="info"
              />
              <StatsCard
                title="Aguardando usuário"
                value={String(waitingUserTickets)}
                tone="danger"
              />
              <StatsCard
                title="Finalizados"
                value={String(finishedTickets)}
                tone="success"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-[0.16em] text-zinc-300 mb-4">
              Resumo por origem
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatsCard
                title="Chamados Offshore"
                value={String(offshoreTickets)}
                tone="danger"
              />
              <StatsCard
                title="Chamados da Base"
                value={String(baseTickets)}
                tone="base"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-1 hover:border-cyan-500/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-[-0.02em] text-white">
                  Chamados por Setor
                </h2>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Comparativo por setor com base no conjunto filtrado.
                </p>
              </div>
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
                {filteredTickets.length} itens
              </span>
            </div>

            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketsBySector}>
                  <XAxis
                    dataKey="name"
                    stroke="#a1a1aa"
                    tick={{ fill: "#cbd5e1", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#a1a1aa"
                    tick={{ fill: "#cbd5e1", fontSize: 12 }}
                  />
                 <Tooltip
  cursor={{ fill: "rgba(255,255,255,0.03)" }}
  contentStyle={{
    backgroundColor: "#09090b",
    borderRadius: 20,
    border: "1px solid rgba(56,189,248,0.18)",
    color: "#f8fafc",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  }}
  labelStyle={{
    color: "#f8fafc",
    fontWeight: 600,
  }}
/>
                 <Bar
                     dataKey="total"
                      fill="#38bdf8"
                    radius={[14, 14, 4, 4]}/></BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-1 hover:border-cyan-500/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-[-0.02em] text-white">
                  Chamados por Categoria
                </h2>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Categorias mais frequentes no filtro atual.
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                {uniqueCategories.length} categorias
              </span>
            </div>

            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketsByCategory}>
                  <XAxis
                    dataKey="name"
                    stroke="#a1a1aa"
                    tick={{ fill: "#cbd5e1", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#a1a1aa"
                    tick={{ fill: "#cbd5e1", fontSize: 12 }}
                  />
                  <Tooltip
  cursor={{ fill: "rgba(255,255,255,0.03)" }}
  contentStyle={{
    backgroundColor: "#09090b",
    borderRadius: 20,
    border: "1px solid rgba(56,189,248,0.18)",
    color: "#f8fafc",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  }}
  labelStyle={{
    color: "#f8fafc",
    fontWeight: 600,
  }}
/>
                  <Bar
  dataKey="total"
  fill="#22c55e"
  radius={[14, 14, 4, 4]}
/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-1 hover:border-cyan-500/20">
            <h2 className="text-xl font-bold tracking-[-0.02em] text-white">
              Chamados por Status
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Distribuição atual de status.
            </p>

            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart style={{
  filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.25))",
}}>
                  <Pie
                    data={ticketsByStatus}
                    dataKey="total"
                    nameKey="name"
                    outerRadius={105}
innerRadius={55}
paddingAngle={4}
label
                  >
                    <Cell fill="#eab308" />
                    <Cell fill="#3b82f6" />
                    <Cell fill="#f97316" />
                    <Cell fill="#22c55e" />
                  </Pie>
                 <Tooltip
  cursor={{ fill: "rgba(255,255,255,0.03)" }}
  contentStyle={{
    backgroundColor: "#09090b",
    borderRadius: 20,
    border: "1px solid rgba(56,189,248,0.18)",
    color: "#f8fafc",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  }}
  labelStyle={{
    color: "#f8fafc",
    fontWeight: 600,
  }}
/>
                </PieChart >
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-1 hover:border-cyan-500/20">
            <h2 className="text-xl font-bold tracking-[-0.02em] text-white">
              Base x Offshore
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              Origem dos chamados no conjunto filtrado.
            </p>

            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart style={{
  filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.25))",
}}>
                  <Pie
                    data={ticketsByOrigin}
                    dataKey="total"
                    nameKey="name"
                   outerRadius={105}
innerRadius={55}
paddingAngle={4}
label
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ef4444" />
                  </Pie>
                 <Tooltip
  cursor={{ fill: "rgba(255,255,255,0.03)" }}
  contentStyle={{
    backgroundColor: "#09090b",
    borderRadius: 20,
    border: "1px solid rgba(56,189,248,0.18)",
    color: "#f8fafc",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  }}
  labelStyle={{
    color: "#f8fafc",
    fontWeight: 600,
  }}
/>
                
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
