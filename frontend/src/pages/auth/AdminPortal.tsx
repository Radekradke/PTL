import { useEffect, useMemo, useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { categories } from "@/lib/categories"
import { API_URL } from "@/services/api"
import {
  CheckCircle2,
  Clock3,
  ClipboardList,
  LogOut,
  MessageSquareText,
  PlusCircle,
  RefreshCw,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  UserCircle2,
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
    return "border-amber-500/25 bg-amber-500/10 text-amber-300"
  }

  if (status === "Em andamento") {
    return "border-sky-500/25 bg-sky-500/10 text-sky-300"
  }

  if (status === "Aguardando usuário") {
    return "border-orange-500/25 bg-orange-500/10 text-orange-300"
  }

  if (status === "Finalizado") {
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
  }

  return "border-zinc-500/25 bg-zinc-500/10 text-zinc-300"
}

function getStatusDot(status: string) {
  if (status === "Aberto") return "bg-amber-300"
  if (status === "Em andamento") return "bg-sky-300"
  if (status === "Aguardando usuário") return "bg-orange-300"
  if (status === "Finalizado") return "bg-emerald-300"
  return "bg-zinc-300"
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

  const ticketStats = useMemo(() => {
    return {
      total: myTickets.length,
      open: myTickets.filter((ticket) => ticket.status === "Aberto").length,
      waiting: myTickets.filter((ticket) => ticket.status === "Aguardando usuário").length,
      finished: myTickets.filter((ticket) => ticket.status === "Finalizado").length,
    }
  }, [myTickets])

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
    if (!loggedEmployee || !description.trim()) {
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
          description: description.trim(),
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

  if (!loggedEmployee) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.10),transparent_28%),#0f172a] p-4 text-zinc-100">
        <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden rounded-[2.25rem] border border-sky-500/10 bg-gradient-to-br from-sky-500/10 via-zinc-950 to-zinc-950 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.45)] lg:block">
            <div className="inline-flex rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-300">
              <ShieldCheck size={16} className="mr-2" /> Portal seguro do colaborador
            </div>

            <h1 className="mt-8 max-w-xl text-5xl font-black tracking-[-0.06em] text-white">
              Abra, acompanhe e responda chamados em um só lugar.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
              Seu usuário identifica automaticamente seu nome e setor. Menos seleção manual, menos erro humano e mais rastreabilidade para o suporte.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                <PlusCircle className="text-sky-300" />
                <p className="mt-3 text-sm font-semibold text-white">Abrir chamado</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">Registro rápido e vinculado ao seu cadastro.</p>
              </div>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                <MessageSquareText className="text-violet-300" />
                <p className="mt-3 text-sm font-semibold text-white">Responder TI</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">Histórico salvo em formato de conversa.</p>
              </div>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                <Clock3 className="text-emerald-300" />
                <p className="mt-3 text-sm font-semibold text-white">Acompanhar</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">Veja status e respostas sem depender do WhatsApp.</p>
              </div>
            </div>
          </section>

          <Card className="rounded-[2.25rem] border border-zinc-800 bg-zinc-950/95 shadow-[0_30px_90px_rgba(15,23,42,0.55)]">
            <CardContent className="space-y-7 p-8 sm:p-10">
              <div className="space-y-3 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-300">
                  <UserCircle2 size={28} />
                </div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-300">
                  Portal de Chamados
                </p>
                <h1 className="text-3xl font-black tracking-[-0.04em] text-white">Acesse sua conta</h1>
                <p className="text-sm leading-6 text-zinc-400">
                  Entre com seu usuário e senha para abrir, acompanhar e responder seus chamados.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-300">Usuário</label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ex: andre.ti"
                    className="h-12 rounded-2xl border-zinc-800 bg-zinc-900 px-4 text-white placeholder:text-zinc-600 focus-visible:border-sky-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-300">Senha</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="h-12 rounded-2xl border-zinc-800 bg-zinc-900 px-4 text-white placeholder:text-zinc-600 focus-visible:border-sky-500"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handlePortalLogin()
                      }
                    }}
                  />
                </div>

                <Button
                  className="h-12 w-full rounded-2xl bg-sky-600 font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 hover:bg-sky-500 disabled:opacity-50"
                  onClick={handlePortalLogin}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? "Entrando..." : "Entrar no portal"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (successState.isVisible) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.10),transparent_26%),#0f172a] p-4 text-zinc-100">
        <Card className="w-full max-w-lg rounded-[2.25rem] border border-emerald-500/20 bg-zinc-950 shadow-[0_30px_90px_rgba(15,23,42,0.55)]">
          <CardContent className="space-y-8 p-8 text-center sm:p-12">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-500/25 blur-3xl" />
                <div className="relative rounded-full border border-emerald-500/25 bg-emerald-500/10 p-5">
                  <CheckCircle2 className="h-16 w-16 text-emerald-400" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Chamado registrado</p>
              <h1 className="text-3xl font-black tracking-[-0.04em] text-white">Chamado enviado!</h1>
              <p className="text-sm leading-6 text-zinc-400">
                Seu chamado foi criado com sucesso. Agora você pode acompanhar respostas e conversar com a equipe técnica por aqui.
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.75rem] border border-zinc-800 bg-zinc-900/70 p-5 text-left sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">ID do chamado</p>
                <p className="mt-1 text-2xl font-bold text-emerald-300">#{successState.ticketId}</p>
              </div>
              <div className="sm:border-l sm:border-zinc-800 sm:pl-5">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Solicitante</p>
                <p className="mt-1 text-lg font-semibold text-white">{successState.employeeName}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
              <Button
                variant="outline"
                className="h-11 rounded-2xl border-zinc-700 !bg-zinc-900/60 text-zinc-300 hover:!bg-zinc-800 hover:text-white"
                onClick={handleExit}
              >
                Sair
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-2xl border-sky-500/30 !bg-sky-500/10 text-sky-300 hover:!bg-sky-500/15 hover:text-sky-200"
                onClick={handleGoToMyTickets}
              >
                Acompanhar
              </Button>
              <Button
                className="h-11 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500"
                onClick={handleContinue}
              >
                Novo chamado
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.10),transparent_25%),#0f172a] p-4 text-zinc-100">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col gap-6">
        <header className="rounded-[2.25rem] border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.38)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
                Portal interno
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
                Olá, {loggedEmployee.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                Seu setor é <strong className="text-zinc-200">{loggedEmployee.sector?.name}</strong>. Todos os chamados abertos por aqui ficam vinculados ao seu cadastro.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="h-11 rounded-2xl border-sky-500/20 !bg-sky-500/10 px-5 text-sky-300 hover:!bg-sky-500/15 hover:text-sky-200"
                onClick={() => loadMyTickets(loggedEmployee.id)}
                disabled={isLoadingTickets}
              >
                <RefreshCw size={16} className="mr-2" />
                Atualizar
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-2xl border-red-500/20 !bg-red-500/10 px-5 text-red-300 hover:!bg-red-500/15 hover:text-red-200"
                onClick={handleExit}
              >
                <LogOut size={16} className="mr-2" />
                Sair
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 sm:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3 text-sky-300">
                    <UserCircle2 />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{loggedEmployee.name}</p>
                    <p className="text-xs text-zinc-500">Usuário: {loggedEmployee.username || "sem usuário"}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Chamados</p>
                <p className="mt-2 text-2xl font-bold text-white">{ticketStats.total}</p>
              </div>
              <div className="rounded-3xl border border-orange-500/20 bg-orange-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-orange-300">Aguardando</p>
                <p className="mt-2 text-2xl font-bold text-orange-200">{ticketStats.waiting}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-1.5">
              <button
                onClick={() => setActiveTab("new")}
                className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  activeTab === "new"
                    ? "bg-sky-600 text-white shadow-lg shadow-sky-500/20"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
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
                className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  activeTab === "mine"
                    ? "bg-sky-600 text-white shadow-lg shadow-sky-500/20"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <MessageSquareText size={16} className="mr-2" />
                Meus chamados
              </button>
            </div>
          </div>
        </header>

        {activeTab === "new" ? (
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <Card className="rounded-[2.25rem] border border-zinc-800 bg-zinc-950 shadow-[0_25px_80px_rgba(15,23,42,0.35)]">
              <CardContent className="space-y-7 p-6 sm:p-8">
                <div className="space-y-3">
                  <div className="inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-300">
                    <ClipboardList size={16} className="mr-2" /> Abrir chamado interno
                  </div>
                  <h2 className="text-3xl font-black tracking-[-0.04em] text-white">Preencha os dados do atendimento</h2>
                  <p className="max-w-3xl text-sm leading-6 text-zinc-400">
                    O solicitante e o setor vêm do seu login. Informe categoria, origem e descreva o problema com contexto suficiente para agilizar o suporte.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-400">Solicitante</label>
                    <Input
                      value={loggedEmployee.name}
                      disabled
                      className="h-12 rounded-2xl border-zinc-800 bg-zinc-900 px-4 text-zinc-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-400">Setor</label>
                    <Input
                      value={loggedEmployee.sector?.name || ""}
                      disabled
                      className="h-12 rounded-2xl border-zinc-800 bg-zinc-900 px-4 text-zinc-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-400">Categoria</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-zinc-200 shadow-sm outline-none transition focus:border-sky-500"
                    >
                      {categories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-400">Origem</label>
                    <select
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-zinc-200 shadow-sm outline-none transition focus:border-sky-500"
                    >
                      <option>Base</option>
                      <option>Offshore</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-400">Descrição do problema</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: computador não liga, impressora não aparece na rede, sistema apresenta erro ao abrir..."
                    className="min-h-[190px] rounded-2xl border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-600 focus-visible:border-sky-500"
                  />
                </div>

                <Button
                  className="h-13 w-full rounded-2xl bg-sky-600 text-base font-bold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 hover:bg-sky-500 disabled:opacity-50"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando chamado..." : "Abrir chamado"}
                </Button>
              </CardContent>
            </Card>

            <aside className="space-y-4">
              <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.28)]">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-sky-300" />
                  <h3 className="text-lg font-bold text-white">Boas práticas</h3>
                </div>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-zinc-400">
                  <li>• Informe quando o problema começou.</li>
                  <li>• Descreva mensagens de erro exatamente como aparecem.</li>
                  <li>• Diga se é urgente ou impacta operação.</li>
                  <li>• Acompanhe a resposta na aba “Meus chamados”.</li>
                </ul>
              </div>

              <div className="rounded-[2rem] border border-sky-500/20 bg-sky-500/10 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">Rastreamento</p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  Cada resposta fica salva no histórico do chamado, com data, autor e status atualizado.
                </p>
              </div>
            </aside>
          </div>
        ) : (
          <div className="grid min-h-[680px] gap-6 xl:grid-cols-[400px_1fr]">
            <Card className="rounded-[2.25rem] border border-zinc-800 bg-zinc-950 shadow-[0_25px_80px_rgba(15,23,42,0.35)]">
              <CardContent className="flex h-full flex-col p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black tracking-[-0.03em] text-white">Meus chamados</h2>
                    <p className="text-sm text-zinc-500">
                      {myTickets.length} chamado(s) encontrados
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-sky-500/20 !bg-sky-500/10 text-sky-300 hover:!bg-sky-500/15 hover:text-sky-200"
                    onClick={() => loadMyTickets(loggedEmployee.id)}
                    disabled={isLoadingTickets}
                  >
                    <RefreshCw size={14} />
                  </Button>
                </div>

                <div className="space-y-3 overflow-y-auto pr-1">
                  {myTickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => loadTicketMessages(ticket)}
                      className={`w-full rounded-3xl border p-4 text-left transition hover:border-sky-500/40 hover:bg-zinc-900 ${
                        selectedTicket?.id === ticket.id
                          ? "border-sky-500/50 bg-sky-500/10 shadow-[0_12px_34px_rgba(14,165,233,0.08)]"
                          : "border-zinc-800 bg-zinc-900/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white">#{ticket.id} - {ticket.category}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-400">{ticket.description}</p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${getStatusStyle(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                        <span>{ticket.createdAt}</span>
                        <span className="rounded-full bg-zinc-950 px-2 py-1">{ticket.origin}</span>
                      </div>
                    </button>
                  ))}

                  {myTickets.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-zinc-800 p-8 text-center">
                      <MessageSquareText className="mx-auto h-10 w-10 text-zinc-700" />
                      <p className="mt-3 text-sm font-semibold text-zinc-300">Nenhum chamado encontrado</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">Quando você abrir um chamado, ele aparecerá aqui.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.25rem] border border-zinc-800 bg-zinc-950 shadow-[0_25px_80px_rgba(15,23,42,0.35)]">
              <CardContent className="flex h-full min-h-[680px] flex-col p-0">
                {selectedTicket ? (
                  <>
                    <div className="border-b border-zinc-800 p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">Conversa do chamado</p>
                          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
                            #{selectedTicket.id} - {selectedTicket.category}
                          </h2>
                          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                            {selectedTicket.description}
                          </p>
                        </div>
                        <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(selectedTicket.status)}`}>
                          <span className={`h-2 w-2 rounded-full ${getStatusDot(selectedTicket.status)}`} />
                          {selectedTicket.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.05),transparent_30%)] p-6">
                      {messages.map((message) => {
                        const isEmployee = message.senderType === "employee"

                        return (
                          <div key={message.id} className={`flex ${isEmployee ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[82%] rounded-3xl border p-4 shadow-[0_12px_34px_rgba(0,0,0,0.16)] ${
                              isEmployee
                                ? "border-sky-500/30 bg-sky-500/15 text-sky-50"
                                : "border-zinc-800 bg-zinc-900 text-zinc-100"
                            }`}>
                              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                                <p className={`text-xs font-bold uppercase tracking-[0.14em] ${isEmployee ? "text-sky-200" : "text-zinc-400"}`}>
                                  {isEmployee ? "Você" : message.senderName || "Técnico"}
                                </p>
                                <p className="text-[11px] text-zinc-500">
                                  {new Date(message.createdAt).toLocaleString("pt-BR")}
                                </p>
                              </div>
                              <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                {message.message}
                              </p>
                            </div>
                          </div>
                        )
                      })}

                      {messages.length === 0 && (
                        <div className="rounded-3xl border border-dashed border-zinc-800 p-10 text-center">
                          <MessageSquareText className="mx-auto h-12 w-12 text-zinc-700" />
                          <h3 className="mt-4 text-lg font-bold text-white">Nenhuma mensagem ainda</h3>
                          <p className="mt-2 text-sm text-zinc-500">Quando a equipe técnica responder, a conversa aparecerá aqui.</p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-zinc-800 p-5">
                      {selectedTicket.status === "Finalizado" ? (
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-300">
                          Este chamado está finalizado. Caso o problema volte, abra um novo chamado com o contexto atualizado.
                        </div>
                      ) : (
                        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                          <Textarea
                            value={employeeReply}
                            onChange={(e) => setEmployeeReply(e.target.value)}
                            placeholder="Responda o técnico ou envie mais detalhes..."
                            className="min-h-[96px] rounded-2xl border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-600 focus-visible:border-sky-500"
                          />
                          <Button
                            className="rounded-2xl bg-sky-600 px-6 font-bold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 hover:bg-sky-500 disabled:opacity-50"
                            onClick={handleEmployeeReply}
                            disabled={isSendingReply || !employeeReply.trim()}
                          >
                            <SendHorizontal size={16} className="mr-2" />
                            {isSendingReply ? "Enviando..." : "Responder"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full min-h-[680px] items-center justify-center p-8 text-center">
                    <div className="max-w-md">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900 text-zinc-600">
                        <MessageSquareText className="h-10 w-10" />
                      </div>
                      <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-white">Selecione um chamado</h2>
                      <p className="mt-2 text-sm leading-6 text-zinc-500">
                        Clique em um chamado à esquerda para acompanhar a conversa com a equipe técnica.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
