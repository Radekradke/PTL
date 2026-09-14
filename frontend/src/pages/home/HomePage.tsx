import { useNavigate } from "react-router-dom"
import { ArrowRight, LayoutDashboard, FileText, Settings, Ticket, Activity, Clock3, AlertTriangle } from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid"
import { Reveal } from "@/components/ui/reveal"
import { useNotifications } from "@/contexts/NotificationContext"
import { TECHNICAL_USER_KEY } from "@/services/api"

export function HomePage() {
  const navigate = useNavigate()
  const { tickets } = useNotifications()
  const user = JSON.parse(localStorage.getItem(TECHNICAL_USER_KEY) || "{}")
  const role = user?.sector || ""
  const isAdmin = role === "Admin"

  const active = tickets.filter((t) => !t.archived)
  const open = active.filter((t) => t.status === "Aberto").length
  const progress = active.filter((t) => t.status === "Em andamento").length
  const waiting = active.filter((t) => t.status === "Aguardando usuário").length
  const pending = open + waiting

  const heroStats = [
    { label: "Abertos", value: open, Icon: AlertTriangle },
    { label: "Em andamento", value: progress, Icon: Activity },
    { label: "Aguardando", value: waiting, Icon: Clock3 },
  ]

  return (
    <AppLayout>
      <div className="ls-page-shell">
        <Reveal>
          <div className="pb-1">
            <p className="ls-label">Painel técnico</p>
            <h1 className="mt-1 text-3xl font-bold tracking-[-0.05em] text-[color:var(--foreground)] sm:text-4xl">
              Bem-vindo{role ? `, ${role}` : ""}
            </h1>
            <p className="mt-1.5 text-sm text-[color:var(--muted-foreground)]">
              Escolha por onde começar. {pending > 0 ? `${pending} chamado(s) aguardando atenção.` : "Nenhum chamado pendente no momento."}
            </p>
          </div>
        </Reveal>

        <BentoGrid className="lg:grid-cols-3">
          {/* Hero — Chamados */}
          <Reveal className="sm:col-span-2 lg:col-span-2 lg:row-span-2" delay={0.04}>
            <button
              type="button"
              onClick={() => navigate("/tickets")}
              className="ls-card-dark group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[1.6rem] p-6 text-left transition-shadow duration-300 hover:shadow-[var(--shadow-md)] sm:p-8"
            >
              <span className="ls-num pointer-events-none absolute -bottom-10 right-2 text-[10rem] font-black leading-none text-emerald-50/[0.08] sm:text-[13rem]">
                {pending}
              </span>
              <div className="relative">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-[#39D98A] ring-1 ring-white/15">
                  <Ticket className="h-6 w-6" strokeWidth={2} />
                </span>
                <h2 className="mt-5 text-2xl font-bold tracking-tight text-emerald-50 sm:text-3xl">Chamados</h2>
                <p className="mt-1.5 max-w-md text-sm leading-6 text-emerald-100/70">
                  Fila de atendimento técnico — abra, responda e acompanhe os chamados.
                </p>
              </div>

              <div className="relative mt-6 flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {heroStats.map((s) => (
                    <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 backdrop-blur-sm">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-100/60">
                        <s.Icon className="h-3 w-3" strokeWidth={2} /> {s.label}
                      </div>
                      <p className="ls-num mt-0.5 text-xl font-bold text-emerald-50">{s.value}</p>
                    </div>
                  ))}
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#39D98A] transition-transform group-hover:translate-x-1">
                  Ver fila <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </span>
              </div>
            </button>
          </Reveal>

          {/* Dashboard */}
          <Reveal className="lg:col-start-3 lg:row-start-1" delay={0.1}>
            <BentoCard
              name="Dashboard"
              description="Indicadores, gráficos e leitura rápida da operação."
              cta="Abrir"
              Icon={LayoutDashboard}
              onClick={() => navigate("/dashboard")}
              className="h-full"
            />
          </Reveal>

          {/* Relatórios */}
          <Reveal className="lg:col-start-3 lg:row-start-2" delay={0.16}>
            <BentoCard
              name="Relatórios"
              description="Exportação em PDF/Excel e histórico de chamados."
              cta="Abrir"
              Icon={FileText}
              onClick={() => navigate("/reports")}
              className="h-full"
            />
          </Reveal>

          {/* Configurações (Admin) */}
          {isAdmin && (
            <Reveal className="lg:col-span-3 lg:row-start-3" delay={0.22}>
              <BentoCard
                name="Configurações"
                description="Setores, funcionários, e-mails dos responsáveis e versão do sistema."
                cta="Abrir"
                Icon={Settings}
                onClick={() => navigate("/settings")}
                className="h-full"
              />
            </Reveal>
          )}
        </BentoGrid>
      </div>
    </AppLayout>
  )
}
