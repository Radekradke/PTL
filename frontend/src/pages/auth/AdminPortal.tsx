import { useEffect, useState } from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { categories } from "@/lib/categories"
import { API_URL } from "@/services/api"
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LogOut,
  LockKeyhole,
  MessageSquareText,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  UserCircle2,
  UserRound,
  ArrowRight,
} from "lucide-react"

type Sector = {
  id: number
  name: string
  pin: string
}

type Employee = {
  id: number
  name: string
  username?: string | null
  sectorId: number
  sector: Sector
}

type TicketMessage = {
  id: number
  ticketId: number
  senderType: "employee" | "technician" | string
  senderName: string
  message: string
  createdAt: string
}

type PortalTicket = {
  id: number
  user: string
  sector: string
  category: string
  status: string
  origin: string
  priority: string
  description: string
  technicalResponse: string
  createdAt: string
  messages: TicketMessage[]
}

type SuccessState = {
  isVisible: boolean
  ticketId?: number
  employeeName?: string
}

const PORTAL_USER_KEY = "lifting-portal-employee"

const styles = {
  page:
    "min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(57,217,138,0.16),transparent_30%),linear-gradient(180deg,#EAF0ED_0%,#F7FAF8_46%,#EAF0ED_100%)] text-[#111827]",
  shell: "mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-3 py-4 sm:px-5 sm:py-6",
  glass:
    "rounded-[1.75rem] border border-white/75 bg-white/78 shadow-[0_18px_55px_rgba(7,59,42,0.10)] backdrop-blur-2xl ring-1 ring-white/50",
  card:
    "rounded-[1.75rem] border border-[#DDE7E2] bg-white shadow-[0_14px_38px_rgba(7,59,42,0.08)]",
  input:
    "h-11 rounded-2xl border-[#DDE7E2] bg-[#F8FAF9] text-[#111827] placeholder:text-slate-400 focus:border-[#00A859] focus:ring-[#00A859]/10",
  select:
    "h-11 w-full rounded-2xl border border-[#DDE7E2] bg-[#F8FAF9] px-4 text-sm font-semibold text-[#111827] shadow-sm outline-none transition focus:border-[#00A859] focus:ring-4 focus:ring-[#00A859]/10",
  primary:
    "rounded-2xl bg-[#00A859] font-bold text-white shadow-[0_14px_30px_rgba(0,168,89,0.20)] transition hover:-translate-y-0.5 hover:bg-[#07864A] disabled:opacity-50",
  secondary:
    "rounded-2xl border border-[#DDE7E2] bg-white font-bold text-[#102A43] transition hover:bg-[#F4F8F6] hover:text-[#073B2A]",
}

function formatTicket(ticket: any): PortalTicket {
  return {
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
      : "Sem data",
    messages: ticket.messages || [],
  }
}

function getStatusStyle(status: string) {
  if (status === "Aberto") {
    return "border-sky-200 bg-sky-50 text-sky-700"
  }

  if (status === "Em andamento") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }

  if (status === "Aguardando usuário") {
    return "border-orange-200 bg-orange-50 text-orange-700"
  }

  if (status === "Finalizado") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  return "border-slate-200 bg-slate-100 text-slate-700"
}

function PortalShell({ children }: { children: React.ReactNode }) {
  return <div className={styles.page}>{children}</div>
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={`${styles.glass} ${className}`}>{children}</div>
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-2xl border border-[#DDE7E2] bg-white/78">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-bold text-[#102A43]">{title}</span>
        {open ? (
          <ChevronUp size={18} className="text-[#00A859]" />
        ) : (
          <ChevronDown size={18} className="text-[#00A859]" />
        )}
      </button>

      {open && <div className="border-t border-[#DDE7E2] px-4 py-4">{children}</div>}
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[#DDE7E2] bg-white/78 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-[#073B2A]">{value}</p>
    </div>
  )
}

export function AdminPortal() {
  const [loggedEmployee, setLoggedEmployee] = useState<Employee | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const [category, setCategory] = useState("PC")
  const [origin, setOrigin] = useState("Base")
  const [description, setDescription] = useState("")

  const [activeTab, setActiveTab] = useState<"new" | "mine">("new")
  const [myTickets, setMyTickets] = useState<PortalTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<PortalTicket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [employeeReply, setEmployeeReply] = useState("")
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)
  const [isSendingReply, setIsSendingReply] = useState(false)

  const [successState, setSuccessState] = useState<SuccessState>({
    isVisible: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const savedEmployee = localStorage.getItem(PORTAL_USER_KEY)

    if (savedEmployee) {
      try {
        setLoggedEmployee(JSON.parse(savedEmployee))
      } catch {
        localStorage.removeItem(PORTAL_USER_KEY)
      }
    }
  }, [])

  useEffect(() => {
    if (loggedEmployee?.id) {
      loadMyTickets(loggedEmployee.id)
    }
  }, [loggedEmployee?.id])

  async function handlePortalLogin() {
    if (!username || !password) {
      alert("Digite seu usuário e senha.")
      return
    }

    setIsLoggingIn(true)

    try {
      const response = await fetch(`${API_URL}/employees/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      if (!response.ok) {
        alert("Usuário ou senha inválidos.")
        return
      }

      const employee = await response.json()
      setLoggedEmployee(employee)
      localStorage.setItem(PORTAL_USER_KEY, JSON.stringify(employee))
      setUsername("")
      setPassword("")
    } catch (error) {
      console.error("Erro ao acessar portal:", error)
      alert("Erro ao acessar portal.")
    } finally {
      setIsLoggingIn(false)
    }
  }

  async function loadMyTickets(targetEmployeeId?: number) {
    const idToSearch = targetEmployeeId || loggedEmployee?.id

    if (!idToSearch) {
      setMyTickets([])
      setSelectedTicket(null)
      setMessages([])
      return
    }

    setIsLoadingTickets(true)

    try {
      const response = await fetch(`${API_URL}/tickets/employee/${idToSearch}`)

      if (!response.ok) {
        setMyTickets([])
        return
      }

      const data = await response.json()
      const formattedTickets = data.map(formatTicket)

      setMyTickets(formattedTickets)

      if (selectedTicket) {
        const updatedSelectedTicket = formattedTickets.find(
          (ticket: PortalTicket) => ticket.id === selectedTicket.id
        )

        if (updatedSelectedTicket) {
          setSelectedTicket(updatedSelectedTicket)
          setMessages(updatedSelectedTicket.messages || [])
        }
      }
    } catch (error) {
      console.error("Erro ao carregar meus chamados:", error)
      setMyTickets([])
    } finally {
      setIsLoadingTickets(false)
    }
  }

  async function loadTicketMessages(ticket: PortalTicket) {
    setSelectedTicket(ticket)

    try {
      const response = await fetch(`${API_URL}/tickets/${ticket.id}/messages`)

      if (!response.ok) {
        setMessages(ticket.messages || [])
        return
      }

      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error("Erro ao carregar conversa:", error)
      setMessages(ticket.messages || [])
    }
  }

  async function handleSubmit() {
    if (!loggedEmployee || !description) {
      alert("Descreva o problema antes de abrir o chamado.")
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
          employeeId: loggedEmployee.id,
          category,
          origin,
          description,
        }),
      })

      if (!response.ok) {
        alert("Erro ao abrir chamado.")
        return
      }

      const newTicket = await response.json()

      setSuccessState({
        isVisible: true,
        ticketId: newTicket.id,
        employeeName: loggedEmployee.name,
      })

      setCategory("PC")
      setOrigin("Base")
      setDescription("")
      loadMyTickets(loggedEmployee.id)
    } catch (error) {
      console.error(error)
      alert("Erro ao abrir chamado.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEmployeeReply() {
    if (!loggedEmployee || !selectedTicket || !employeeReply.trim()) return

    setIsSendingReply(true)

    try {
      const response = await fetch(`${API_URL}/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderType: "employee",
          employeeId: loggedEmployee.id,
          message: employeeReply.trim(),
        }),
      })

      if (!response.ok) {
        alert("Erro ao enviar resposta.")
        return
      }

      const newMessage = await response.json()
      setMessages((currentMessages) => [...currentMessages, newMessage])
      setSelectedTicket({ ...selectedTicket, status: "Em andamento" })
      setEmployeeReply("")
      loadMyTickets(loggedEmployee.id)
    } catch (error) {
      console.error("Erro ao responder chamado:", error)
      alert("Erro ao enviar resposta.")
    } finally {
      setIsSendingReply(false)
    }
  }

  function handleContinue() {
    setSuccessState({ isVisible: false })
    setActiveTab("new")
  }

  function handleGoToMyTickets() {
    setSuccessState({ isVisible: false })
    setActiveTab("mine")
    loadMyTickets(loggedEmployee?.id)
  }

  function handleExit() {
    localStorage.removeItem(PORTAL_USER_KEY)
    setLoggedEmployee(null)
    setUsername("")
    setPassword("")
    setCategory("PC")
    setOrigin("Base")
    setDescription("")
    setActiveTab("new")
    setMyTickets([])
    setSelectedTicket(null)
    setMessages([])
    setSuccessState({ isVisible: false })
  }

  const activeTickets = myTickets.filter((ticket) => ticket.status !== "Finalizado").length
  const finishedTickets = myTickets.filter((ticket) => ticket.status === "Finalizado").length

  if (!loggedEmployee) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAF0ED] px-4 py-8 text-[#111827]">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_28px_90px_rgba(7,59,42,0.16)] lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative hidden min-h-[620px] overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(57,217,138,0.28),transparent_32%),linear-gradient(135deg,#073B2A,#102A43)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#39D98A]/20 blur-[90px]" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#00A859]/20 blur-[100px]" />

            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 text-2xl font-black text-white shadow-inner ring-1 ring-white/20">
                L
              </div>

              <h1 className="mt-8 text-5xl font-black tracking-[-0.06em] text-white">
                Lifting
              </h1>

              <p className="mt-3 max-w-sm text-sm leading-6 text-emerald-50/80">
                Portal do funcionário para abrir chamados, acompanhar respostas e conversar com a equipe técnica.
              </p>
            </div>

            <div className="relative space-y-3">
              <div className="rounded-3xl border border-white/14 bg-white/10 p-4 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-[#39D98A]" size={22} />
                  <div>
                    <p className="text-sm font-bold text-white">
                      Atendimento conectado
                    </p>
                    <p className="text-xs text-emerald-50/65">
                      Chamado, resposta e histórico no mesmo lugar
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/14 bg-white/10 p-4 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.18em] text-[#39D98A]">
                  Portal do funcionário
                </p>
                <p className="mt-1 text-sm text-emerald-50/70">
                  Abra chamados e acompanhe tudo em um só lugar.
                </p>
              </div>
            </div>
          </section>

          <section className="flex min-h-[620px] items-center justify-center bg-white px-6 py-10 sm:px-12">
            <div className="w-full max-w-[360px]">
              <div className="mb-9 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00A859]/10 text-[#00A859] ring-1 ring-[#00A859]/20">
                  <UserCircle2 size={24} />
                </div>

                <h2 className="text-4xl font-black tracking-[-0.06em] text-[#111827]">
                  Entrar
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Acesse seu portal de chamados com usuário e senha.
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <UserRound
                    size={18}
                    className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <Input
                    type="text"
                    placeholder="Digite seu usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-[52px] w-full rounded-full border border-slate-200 bg-white pl-12 pr-5 text-sm font-semibold text-slate-800 shadow-[0_8px_25px_rgba(15,23,42,0.04)] outline-none transition hover:border-[#00A859]/40 focus:border-[#00A859] focus:ring-4 focus:ring-[#39D98A]/10"
                  />
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <Input
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handlePortalLogin()
                    }}
                    className="h-[52px] w-full rounded-full border border-slate-200 bg-white pl-12 pr-5 text-sm font-semibold text-slate-800 shadow-[0_8px_25px_rgba(15,23,42,0.04)] outline-none transition hover:border-[#00A859]/40 focus:border-[#00A859] focus:ring-4 focus:ring-[#39D98A]/10"
                  />
                </div>

                <Button
                  className="mt-3 h-[52px] w-full rounded-full bg-gradient-to-r from-[#073B2A] via-[#00A859] to-[#073B2A] font-bold text-white shadow-[0_18px_45px_rgba(0,168,89,0.28)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:opacity-50"
                  onClick={handlePortalLogin}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? "Entrando..." : "Entrar no portal"}
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-xs leading-5 text-slate-400">
                  Acesso restrito para funcionários autorizados.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  if (successState.isVisible) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAF0ED] px-4 py-8">
        <GlassCard className="w-full max-w-md p-8 text-center sm:p-10">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[#39D98A]/25 blur-2xl" />
                <CheckCircle2 className="relative h-20 w-20 text-[#00A859]" />
              </div>
            </div>

            <div className="mt-7 space-y-3">
              <h1 className="text-3xl font-black tracking-[-0.04em] text-[#111827]">Chamado enviado</h1>
              <p className="text-sm leading-6 text-slate-500">
                Solicitação criada com sucesso. Acompanhe as respostas pelo portal.
              </p>
            </div>

            <div className="mt-7 rounded-[1.5rem] border border-[#DDE7E2] bg-white/70 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">ID do chamado</p>
              <p className="mt-1 text-2xl font-black text-[#073B2A]">#{successState.ticketId}</p>
              <div className="mt-4 border-t border-[#DDE7E2] pt-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Solicitante</p>
                <p className="mt-1 text-base font-bold text-[#111827]">{successState.employeeName}</p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <Button variant="outline" className={styles.secondary} onClick={handleExit}>
                Sair
              </Button>
              <Button variant="outline" className="rounded-2xl border-[#00A859]/30 bg-[#00A859]/10 font-bold text-[#073B2A] hover:bg-[#00A859]/15" onClick={handleGoToMyTickets}>
                Acompanhar
              </Button>
              <Button className={styles.primary} onClick={handleContinue}>
                Novo chamado
              </Button>
            </div>
          </GlassCard>
        </div>
      )
    }

  return (
    <PortalShell>
      <div className={styles.shell}>
        <header className={`${styles.glass} p-4 sm:p-5`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00A859]">Portal interno</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#111827] sm:text-3xl">
                Olá, {loggedEmployee.name}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Setor: <strong className="text-[#073B2A]">{loggedEmployee.sector?.name}</strong>
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <MiniMetric label="Ativos" value={activeTickets} />
              <MiniMetric label="Finalizados" value={finishedTickets} />
              <MiniMetric label="Total" value={myTickets.length} />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#DDE7E2] bg-white/70 p-1 lg:w-[360px]">
              <button
                onClick={() => setActiveTab("new")}
                className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-bold transition ${
                  activeTab === "new"
                    ? "bg-[#073B2A] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-[#073B2A]"
                }`}
              >
                <PlusCircle size={16} className="mr-2" />
                Novo
              </button>
              <button
                onClick={() => {
                  setActiveTab("mine")
                  loadMyTickets(loggedEmployee.id)
                }}
                className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-bold transition ${
                  activeTab === "mine"
                    ? "bg-[#073B2A] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-[#073B2A]"
                }`}
              >
                <MessageSquareText size={16} className="mr-2" />
                Meus chamados
              </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                className={`h-10 ${styles.secondary}`}
                onClick={() => loadMyTickets(loggedEmployee.id)}
                disabled={isLoadingTickets}
              >
                <RefreshCw size={16} className="mr-2" />
                Atualizar
              </Button>
              <Button
                variant="outline"
                className="h-10 rounded-2xl border border-[#DDE7E2] bg-white font-bold text-slate-700 transition hover:bg-red-50 hover:text-red-700"
                onClick={handleExit}
              >
                <LogOut size={16} className="mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        {activeTab === "new" ? (
          <GlassCard className="p-4 sm:p-6">
            <div className="mb-5">
              
              <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#111827]">Qual é o problema?</h2>
              <p className="mt-1 text-sm text-slate-500">Descreva o problema e envie para a equipe técnica.</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="space-y-3">
                <CollapsibleSection title="Dados do solicitante">
                  <div className="grid gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Solicitante</label>
                      <Input value={loggedEmployee.name} disabled className="mt-2 h-11 rounded-2xl border-[#DDE7E2] bg-slate-50 text-slate-500" />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Setor</label>
                      <Input value={loggedEmployee.sector?.name || ""} disabled className="mt-2 h-11 rounded-2xl border-[#DDE7E2] bg-slate-50 text-slate-500" />
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Classificação" defaultOpen>
                  <div className="grid gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Categoria</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={`mt-2 ${styles.select}`}
                      >
                        {categories.map((category) => (
                          <option key={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Origem</label>
                      <select
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        className={`mt-2 ${styles.select}`}
                      >
                        <option>Base</option>
                        <option>Offshore</option>
                      </select>
                    </div>
                  </div>
                </CollapsibleSection>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-bold text-[#102A43]">Descrição</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o problema com contexto objetivo..."
                    className="mt-2 min-h-[210px] rounded-2xl border-[#DDE7E2] bg-white/90 px-4 py-3 text-slate-950 focus:border-[#00A859]"
                  />
                </div>

                <Button
                  className={`h-12 w-full ${styles.primary}`}
                  onClick={handleSubmit}
                  disabled={isSubmitting || !description.trim()}
                >
                  {isSubmitting ? "Enviando..." : "Abrir chamado"}
                </Button>
              </div>
            </div>
          </GlassCard>
        ) : (
          <div className="grid min-h-[620px] gap-4 xl:grid-cols-[340px_1fr]">
            <GlassCard className="p-4">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black tracking-[-0.03em] text-[#111827]">Meus chamados</h2>
                  <p className="text-sm text-slate-500">{myTickets.length} encontrado(s)</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-[#DDE7E2] bg-white text-slate-700"
                  onClick={() => loadMyTickets(loggedEmployee.id)}
                  disabled={isLoadingTickets}
                >
                  <RefreshCw size={14} />
                </Button>
              </div>

              <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
                {myTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => loadTicketMessages(ticket)}
                    className={`w-full rounded-2xl border p-4 text-left transition hover:border-[#00A859]/35 hover:bg-white ${
                      selectedTicket?.id === ticket.id
                        ? "border-[#00A859]/40 bg-[#00A859]/10"
                        : "border-[#DDE7E2] bg-white/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#00A859]">#{ticket.id}</p>
                        <h3 className="mt-1 truncate text-sm font-black text-[#111827]">{ticket.category}</h3>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${getStatusStyle(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{ticket.description}</p>
                    <p className="mt-3 text-[11px] text-slate-400">{ticket.createdAt}</p>
                  </button>
                ))}

                {myTickets.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#DDE7E2] bg-white/60 p-6 text-center text-sm text-slate-500">
                    Nenhum chamado encontrado.
                  </div>
                )}
              </div>
            </GlassCard>

            <GlassCard className="overflow-hidden p-0">
              {selectedTicket ? (
                <div className="flex min-h-[620px] flex-col">
                  <div className="border-b border-[#DDE7E2] bg-white/65 p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#00A859]">Conversa do chamado</p>
                        <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#111827]">
                          #{selectedTicket.id} · {selectedTicket.category}
                        </h2>
                        <p className="mt-2 line-clamp-3 max-w-3xl text-sm leading-6 text-slate-500">
                          {selectedTicket.description}
                        </p>
                      </div>
                      <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(selectedTicket.status)}`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
                    {messages.map((message) => {
                      const isEmployee = message.senderType === "employee"

                      return (
                        <div key={message.id} className={`flex ${isEmployee ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[88%] rounded-3xl border p-4 shadow-sm ${
                              isEmployee
                                ? "border-[#00A859]/20 bg-[#00A859]/12 text-[#073B2A]"
                                : "border-[#DDE7E2] bg-white text-[#111827]"
                            }`}
                          >
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                {isEmployee ? "Você" : message.senderName || "Técnico"}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {new Date(message.createdAt).toLocaleString("pt-BR")}
                              </p>
                            </div>
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.message}</p>
                          </div>
                        </div>
                      )
                    })}

                    {messages.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-[#DDE7E2] bg-white/60 p-8 text-center text-slate-500">
                        Nenhuma mensagem nesse chamado ainda.
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#DDE7E2] bg-white/70 p-4">
                    {selectedTicket.status === "Finalizado" ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        Este chamado está finalizado. Caso o problema volte, abra um novo chamado.
                      </div>
                    ) : (
                      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                        <Textarea
                          value={employeeReply}
                          onChange={(e) => setEmployeeReply(e.target.value)}
                          placeholder="Responda o técnico ou envie mais detalhes..."
                          className="min-h-[92px] rounded-2xl border-[#DDE7E2] bg-white text-slate-950 focus:border-[#00A859]"
                        />
                        <Button
                          className={`px-6 ${styles.primary}`}
                          onClick={handleEmployeeReply}
                          disabled={isSendingReply || !employeeReply.trim()}
                        >
                          {isSendingReply ? "Enviando..." : "Responder"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[620px] items-center justify-center p-8 text-center">
                  <div className="max-w-md">
                    <MessageSquareText className="mx-auto h-14 w-14 text-slate-400" />
                    <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-[#111827]">Selecione um chamado</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Clique em um chamado para acompanhar a conversa com a equipe técnica.
                    </p>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>
        )}
      </div>
    </PortalShell>
  )
}
