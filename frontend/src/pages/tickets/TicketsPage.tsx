import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { TicketsTable } from "@/components/tickets/TicketsTable";
import { API_URL } from "@/services/api";
import { useNotifications } from "@/contexts/NotificationContext";

export function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const { setTickets: setGlobalTickets } = useNotifications();

  useEffect(() => {
    loadTickets();

    const interval = setInterval(loadTickets, 5000);

    return () => clearInterval(interval);
  }, []);

  async function loadTickets() {
    try {
      const response = await fetch(`${API_URL}/tickets`);
      const data = await response.json();

      const formattedTickets = data.map((ticket: any) => ({
        id: ticket.id,
        user: ticket.employee.name,
        sector: ticket.sector.name,
        category: ticket.category,
        status: ticket.status,
        origin: ticket.origin,
        priority: ticket.priority,
        description: ticket.description,
        technicalResponse: ticket.technicalResponse || "",
        createdAt: new Date(ticket.createdAt).toLocaleString("pt-BR"),
        timeline: ticket.timeline.map((event: any) => ({
          date: new Date(event.createdAt).toLocaleString("pt-BR"),
          action: event.action,
        })),
      }));

      setTickets(formattedTickets);
      setGlobalTickets(formattedTickets); // Atualizar estado global
    } catch (error) {
      console.error("Erro ao carregar tickets:", error);
    }
  }

  const openTickets = tickets.filter(
    (ticket) => ticket.status === "Aberto",
  ).length;

  const progressTickets = tickets.filter(
    (ticket) => ticket.status === "Em andamento",
  ).length;

  const waitingUserTickets = tickets.filter(
    (ticket) => ticket.status === "Aguardando usuário",
  ).length;

  const finishedTickets = tickets.filter(
    (ticket) => ticket.status === "Finalizado",
  ).length;

  const offshoreTickets = tickets.filter(
    (ticket) => ticket.origin === "Offshore",
  ).length;

  const baseTickets = tickets.filter(
    (ticket) => ticket.origin === "Base",
  ).length;

  const totalTickets = tickets.length;

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8 py-4">
        <div className="rounded-[2rem] border border-[#B4D7C4]/60 bg-gradient-to-br from-white via-[#F8FBF9] to-[#F2F2F2] p-6 shadow-[0_18px_55px_rgba(50,98,74,0.11)] sm:p-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#42A95E]/80">
                Operação técnica
              </p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl tracking-[-0.04em] text-[#2B2B2B] lg:text-5xl">
                Chamados
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66736B] sm:text-base">
                Fila, conversa e status em uma visão clara.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-3xl border border-[#B4D7C4]/60 bg-white/60 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-[#66736B]">Total</p>
                <p className="mt-3 text-3xl font-semibold text-[#2B2B2B]">{totalTickets}</p>
              </div>
              <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Pendentes</p>
                <p className="mt-3 text-3xl font-semibold text-amber-300">{openTickets + waitingUserTickets}</p>
              </div>
              <div className="rounded-3xl border border-[#42A95E]/25 bg-[#42A95E]/10 p-4 text-center sm:col-span-2 lg:col-span-1">
                <p className="text-xs uppercase tracking-[0.2em] text-[#32624A]">Em atendimento</p>
                <p className="mt-3 text-3xl font-semibold text-[#32624A]">{progressTickets}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm uppercase tracking-[0.16em] text-[#32624A] mb-4">
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
              <h3 className="text-sm uppercase tracking-[0.16em] text-[#32624A] mb-4">
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
        </div>

        <TicketsTable tickets={tickets} onTicketsChange={loadTickets} />
      </div>
    </AppLayout>
  );
}
