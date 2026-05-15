import { useEffect, useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { categories } from "@/lib/categories"
import { API_URL } from "@/services/api"
import {
  CheckCircle2,
  MessageSquareText,
  PlusCircle,
  RefreshCw,
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
    return "bg-yellow-500/20 text-yellow-300 border-yellow-500/20"
  }

  if (status === "Em andamento") {
    return "bg-blue-500/20 text-blue-300 border-blue-500/20"
  }

  if (status === "Aguardando usuário") {
    return "bg-orange-500/20 text-orange-300 border-orange-500/20"
  }

  if (status === "Finalizado") {
    return "bg-green-500/20 text-green-300 border-green-500/20"
  }

  return "bg-zinc-500/20 text-zinc-300 border-zinc-500/20"
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

  if (!loggedEmployee) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.12),transparent_30%),#0f172a] p-4">
        <Card className="w-full max-w-md rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-[0_25px_80px_rgba(15,23,42,0.45)]">
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2 text-center">
              <p className="text-sm uppercase tracking-[0.25em] text-sky-400">
                Portal de Chamados
              </p>
              <h1 className="text-3xl font-bold text-white">Acesse sua conta</h1>
              <p className="text-zinc-400">
                Entre com seu usuário e senha para abrir, acompanhar e responder seus chamados.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-zinc-300">Usuário</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex: andre.ti"
                  className="rounded-2xl border-zinc-800 bg-zinc-900 px-4 py-3 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-300">Senha</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="rounded-2xl border-zinc-800 bg-zinc-900 px-4 py-3 text-white"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handlePortalLogin()
                    }
                  }}
                />
              </div>

              <Button
                className="w-full rounded-[1.75rem] bg-sky-600 text-white shadow-lg shadow-sky-500/20 hover:bg-sky-500"
                onClick={handlePortalLogin}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Entrando..." : "Entrar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (successState.isVisible) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.12),transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.08),transparent_25%),#0f172a] p-4">
        <Card className="w-full max-w-md rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-[0_25px_80px_rgba(15,23,42,0.5)]">
          <CardContent className="space-y-8 p-12 text-center">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-green-500/20 blur-2xl" />
                <CheckCircle2 className="relative h-20 w-20 text-green-500" />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-white">Chamado enviado!</h1>
              <p className="text-zinc-400">
                Seu chamado foi criado com sucesso. Agora você pode acompanhar respostas por aqui.
              </p>
            </div>

            <div className="space-y-2 rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">ID do Chamado</p>
                <p className="text-xl font-semibold text-green-400">#{successState.ticketId}</p>
              </div>
              <div className="border-t border-zinc-800 pt-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Solicitante</p>
                <p className="text-lg text-white">{successState.employeeName}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-3">
              <Button
                variant="outline"
                className="rounded-[1.5rem] border-zinc-700 text-zinc-300 hover:bg-zinc-800/50"
                onClick={handleExit}
              >
                Sair
              </Button>
              <Button
                variant="outline"
                className="rounded-[1.5rem] border-sky-500/30 text-sky-300 hover:bg-sky-500/10"
                onClick={handleGoToMyTickets}
              >
                Acompanhar
              </Button>
              <Button
                className="rounded-[1.5rem] bg-green-600 text-white shadow-lg shadow-green-500/20 hover:bg-green-500"
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.12),transparent_25%),#0f172a] p-4 text-zinc-100">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col gap-6">
        <header className="rounded-[2rem] border border-zinc-800 bg-zinc-950/90 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.35)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-sky-300">
                Portal interno
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white">
                Olá, {loggedEmployee.name}
              </h1>
              <p className="mt-2 max-w-2xl text-zinc-400">
                Setor vinculado: <strong className="text-zinc-200">{loggedEmployee.sector?.name}</strong>. Seu setor é puxado do cadastro e será usado em todos os chamados.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="rounded-2xl border-zinc-700 text-zinc-300 hover:bg-zinc-800/60"
                onClick={() => loadMyTickets(loggedEmployee.id)}
                disabled={isLoadingTickets}
              >
                <RefreshCw size={16} className="mr-2" />
                Atualizar
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-zinc-700 text-zinc-300 hover:bg-zinc-800/60"
                onClick={handleExit}
              >
                Sair
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center gap-3">
                <UserCircle2 className="text-sky-300" />
                <div>
                  <p className="text-sm font-semibold text-white">{loggedEmployee.name}</p>
                  <p className="text-xs text-zinc-500">Usuário: {loggedEmployee.username || "sem usuário"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-1">
              <button
                onClick={() => setActiveTab("new")}
                className={`inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === "new"
                    ? "bg-sky-600 text-white"
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
                className={`inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === "mine"
                    ? "bg-sky-600 text-white"
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
          <Card className="rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-[0_25px_80px_rgba(15,23,42,0.35)]">
            <CardContent className="space-y-6 p-8">
              <div className="space-y-3">
                <div className="inline-flex rounded-full bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300">
                  Abrir chamado interno
                </div>
                <h2 className="text-3xl font-bold text-white">Preencha os dados</h2>
                <p className="text-zinc-400">
                  O solicitante e o setor já estão definidos pelo seu login. Agora é só informar a categoria, origem e descrição.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Solicitante</label>
                  <Input
                    value={loggedEmployee.name}
                    disabled
                    className="rounded-2xl border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Setor</label>
                  <Input
                    value={loggedEmployee.sector?.name || ""}
                    disabled
                    className="rounded-2xl border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-200 shadow-sm outline-none focus:border-sky-500"
                  >
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Origem</label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-200 shadow-sm outline-none focus:border-sky-500"
                  >
                    <option>Base</option>
                    <option>Offshore</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Descrição</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o problema com o máximo de contexto possível..."
                  className="min-h-[180px] rounded-2xl border-zinc-800 bg-zinc-900 px-4 py-3 text-white"
                />
              </div>

              <Button
                className="w-full rounded-[1.75rem] bg-sky-600 py-6 text-white shadow-lg shadow-sky-500/20 hover:bg-sky-500 disabled:opacity-50"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Abrir chamado"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid min-h-[640px] gap-6 xl:grid-cols-[380px_1fr]">
            <Card className="rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-[0_25px_80px_rgba(15,23,42,0.35)]">
              <CardContent className="flex h-full flex-col p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Meus chamados</h2>
                    <p className="text-sm text-zinc-500">
                      {myTickets.length} chamado(s) encontrados
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-zinc-700 text-zinc-300"
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
                      className={`w-full rounded-2xl border p-4 text-left transition hover:border-sky-500/40 hover:bg-zinc-900 ${
                        selectedTicket?.id === ticket.id
                          ? "border-sky-500/50 bg-sky-500/10"
                          : "border-zinc-800 bg-zinc-900/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">#{ticket.id} - {ticket.category}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-400">{ticket.description}</p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${getStatusStyle(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-zinc-500">{ticket.createdAt}</p>
                    </button>
                  ))}

                  {myTickets.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
                      Nenhum chamado encontrado para sua conta.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-[0_25px_80px_rgba(15,23,42,0.35)]">
              <CardContent className="flex h-full min-h-[640px] flex-col p-0">
                {selectedTicket ? (
                  <>
                    <div className="border-b border-zinc-800 p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-sky-300">Conversa do chamado</p>
                          <h2 className="mt-2 text-2xl font-bold text-white">
                            #{selectedTicket.id} - {selectedTicket.category}
                          </h2>
                          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                            {selectedTicket.description}
                          </p>
                        </div>
                        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(selectedTicket.status)}`}>
                          {selectedTicket.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto p-6">
                      {messages.map((message) => {
                        const isEmployee = message.senderType === "employee"

                        return (
                          <div key={message.id} className={`flex ${isEmployee ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[82%] rounded-3xl border p-4 ${
                              isEmployee
                                ? "border-sky-500/30 bg-sky-500/15 text-sky-50"
                                : "border-zinc-800 bg-zinc-900 text-zinc-100"
                            }`}>
                              <div className="mb-2 flex items-center justify-between gap-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
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
                        <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
                          Nenhuma mensagem nesse chamado ainda.
                        </div>
                      )}
                    </div>

                    <div className="border-t border-zinc-800 p-5">
                      {selectedTicket.status === "Finalizado" ? (
                        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
                          Este chamado está finalizado. Caso o problema volte, abra um novo chamado com o contexto atualizado.
                        </div>
                      ) : (
                        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                          <Textarea
                            value={employeeReply}
                            onChange={(e) => setEmployeeReply(e.target.value)}
                            placeholder="Responda o técnico ou envie mais detalhes..."
                            className="min-h-[96px] rounded-2xl border-zinc-800 bg-zinc-900 text-white"
                          />
                          <Button
                            className="rounded-2xl bg-sky-600 px-6 text-white hover:bg-sky-500 disabled:opacity-50"
                            onClick={handleEmployeeReply}
                            disabled={isSendingReply || !employeeReply.trim()}
                          >
                            {isSendingReply ? "Enviando..." : "Responder"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full min-h-[640px] items-center justify-center p-8 text-center">
                    <div className="max-w-md">
                      <MessageSquareText className="mx-auto h-14 w-14 text-zinc-600" />
                      <h2 className="mt-4 text-2xl font-bold text-white">Selecione um chamado</h2>
                      <p className="mt-2 text-zinc-500">
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
