import { useEffect, useRef, useState, type ElementType } from "react"
import { Navigate } from "react-router-dom"
import toast from "react-hot-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { categoriesByDepartment, type TicketDepartment } from "@/lib/categories"
import { PORTAL_USER_KEY, apiFetch, getPortalToken } from "@/services/api"
import {
  attachmentPayload,
  type PendingAttachment,
  type StoredAttachment,
} from "@/lib/attachments"
import { AttachmentPicker } from "@/components/attachments/AttachmentPicker"
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery"
import { EmployeeSuggestions } from "@/components/suggestions/EmployeeSuggestions"
import { APP_VERSION } from "@/lib/version"
import {
  CheckCircle2,
  ChevronDown,
  LogOut,
  MessageSquareText,
  PlusCircle,
  RefreshCw,
  ClipboardList,
  Clock3,
  Send,
  Activity,
  CheckCheck,
  Layers,
  ShieldAlert,
  Bot,
  Monitor,
  Users,
  Building2,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
} from "lucide-react"

type Sector = {
  id: number
  name: string
}

type Employee = {
  id: number
  name: string
  username?: string | null
  token?: string
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
  attachments?: StoredAttachment[]
}

type PortalTicket = {
  id: number
  user: string
  sector: string
  category: string
  status: string
  origin: string
  description: string
  technicalResponse: string
  createdAt: string
  archived: boolean
  messages: TicketMessage[]
}

type SuccessState = {
  isVisible: boolean
  ticketId?: number
  employeeName?: string
}

const styles = {
  page:
    "min-h-[100dvh] bg-[color:var(--background)] text-[color:var(--foreground)]",
  shell: "mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-5 sm:py-6",
  glass:
    "overflow-hidden rounded-2xl border border-[color:var(--hairline)] bg-white shadow-[var(--shadow-sm)]",
  card:
    "rounded-2xl border border-[color:var(--hairline)] bg-white shadow-[var(--shadow-sm)]",
  input:
    "h-11 rounded-xl border-[color:var(--hairline)] bg-white text-[color:var(--foreground)] placeholder:text-zinc-400 focus:border-[#00A859] focus:ring-[#00A859]/15",
  select:
    "h-11 w-full rounded-xl border border-[color:var(--hairline)] bg-white px-4 text-sm font-semibold text-[color:var(--foreground)] shadow-[var(--shadow-xs)] outline-none transition focus:border-[#00A859] focus:ring-4 focus:ring-[#00A859]/12",
  primary:
    "rounded-xl bg-[#00A859] font-bold text-white shadow-[var(--shadow-xs)] transition hover:bg-[#07934E] active:translate-y-px disabled:opacity-50",
  secondary:
    "rounded-xl border border-[color:var(--hairline)] bg-white font-bold text-[color:var(--secondary-foreground)] shadow-[var(--shadow-xs)] transition hover:bg-[color:var(--muted)] hover:text-[#073B2A]",
}

function formatTicket(ticket: any): PortalTicket {
  return {
    id: ticket.id,
    user: ticket.employee?.name || "Sem solicitante",
    sector: ticket.sector?.name || "Sem setor",
    category: ticket.category || "Sem categoria",
    status: ticket.status || "Aberto",
    origin: ticket.origin || "Administrativo",
    description: ticket.description || "",
    technicalResponse: ticket.technicalResponse || "",
    archived: ticket.archived || false,
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

function getStatusAccent(status: string) {
  if (status === "Finalizado") return "#00A859"
  if (status === "Em andamento") return "#F59E0B"
  if (status === "Aguardando usuário") return "#F97316"
  return "#0EA5E9"
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

function MiniMetric({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: string | number
  icon?: ElementType
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-[color:var(--hairline)] bg-white px-2.5 py-2.5 shadow-[var(--shadow-xs)] transition-colors hover:border-[#00A859]/35 sm:px-4 sm:py-3">
      <div className="flex min-w-0 items-center gap-2">
        {Icon && (
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
            style={{ background: accent ? `${accent}14` : "#F4F4F5", color: accent ?? "#71717A" }}
          >
            <Icon size={13} />
          </span>
        )}
        <p className="min-w-0 truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-400 sm:text-[11px]">{label}</p>
      </div>
      <p className="ls-num mt-1.5 text-2xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-xl">{value}</p>
    </div>
  )
}

function EmptyPortalState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--hairline)] bg-[color:var(--surface-inset)] p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#00A859] shadow-[var(--shadow-xs)] ring-1 ring-[color:var(--hairline)]">
        <ClipboardList size={22} />
      </div>
      <p className="text-sm font-bold text-[color:var(--foreground)]">{title}</p>
      <p className="mt-1.5 text-xs font-medium leading-5 text-[color:var(--muted-foreground)]">{description}</p>
    </div>
  )
}

export function AdminPortal() {
  const [loggedEmployee, setLoggedEmployee] = useState<Employee | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [ticketDepartment, setTicketDepartment] = useState<TicketDepartment | null>(null)
  const [category, setCategory] = useState("PC")
  const [origin, setOrigin] = useState("Administrativo")
  const [description, setDescription] = useState("")

  const [activeTab, setActiveTab] = useState<"new" | "mine" | "ouvidoria" | "sugestoes">("new")
  const [ouvidoriaName, setOuvidoriaName] = useState("")
  const [ouvidoriaSector, setOuvidoriaSector] = useState("")
  const [ouvidoriaComplaint, setOuvidoriaComplaint] = useState("")
  const [isSubmittingOuvidoria, setIsSubmittingOuvidoria] = useState(false)
  const [ouvidoriaSuccess, setOuvidoriaSuccess] = useState(false)
  const [showArchivedTickets, setShowArchivedTickets] = useState(false)
  const [myTickets, setMyTickets] = useState<PortalTicket[]>([])
  const [archivedTickets, setArchivedTickets] = useState<PortalTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<PortalTicket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [employeeReply, setEmployeeReply] = useState("")
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [newTicketPhotos, setNewTicketPhotos] = useState<PendingAttachment[]>([])
  const [replyPhotos, setReplyPhotos] = useState<PendingAttachment[]>([])
  const [isFinishingTicket, setIsFinishingTicket] = useState(false)
  const hasShownExpiredSession = useRef(false)

  const [successState, setSuccessState] = useState<SuccessState>({
    isVisible: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const savedEmployee = localStorage.getItem(PORTAL_USER_KEY)

    if (savedEmployee) {
      try {
        const parsedEmployee = JSON.parse(savedEmployee)
        if (parsedEmployee?.token) {
          setLoggedEmployee(parsedEmployee)
        } else {
          localStorage.removeItem(PORTAL_USER_KEY)
        }
      } catch {
        localStorage.removeItem(PORTAL_USER_KEY)
      }
    }

    setAuthChecked(true)
  }, [])

  useEffect(() => {
    if (loggedEmployee?.id) {
      loadMyTickets(loggedEmployee.id)
      loadArchivedTickets(loggedEmployee.id)
    }
  }, [loggedEmployee?.id])

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
      const response = await apiFetch(`/tickets/employee/${idToSearch}?archived=false`, {}, getPortalToken())

      if (handleUnauthorizedPortalResponse(response)) {
        setMyTickets([])
        return
      }

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

  async function loadArchivedTickets(targetEmployeeId?: number) {
    const idToSearch = targetEmployeeId || loggedEmployee?.id

    if (!idToSearch) {
      setArchivedTickets([])
      return
    }

    try {
      const response = await apiFetch(`/tickets/employee/${idToSearch}?archived=true`, {}, getPortalToken())

      if (handleUnauthorizedPortalResponse(response)) {
        setArchivedTickets([])
        return
      }

      if (!response.ok) {
        setArchivedTickets([])
        return
      }

      const data = await response.json()
      const formattedTickets = data.map(formatTicket)
      setArchivedTickets(formattedTickets)
    } catch (error) {
      console.error("Erro ao carregar chamados arquivados:", error)
      setArchivedTickets([])
    }
  }

  async function loadTicketMessages(ticket: PortalTicket) {
    setSelectedTicket(ticket)
    setReplyPhotos([])

    try {
      const response = await apiFetch(`/tickets/${ticket.id}/messages`, {}, getPortalToken())

      if (handleUnauthorizedPortalResponse(response)) {
        setMessages([])
        return
      }

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

  async function handleOuvidoriaSubmit() {
    if (isSubmittingOuvidoria) return

    const name = ouvidoriaName.trim()
    const sector = ouvidoriaSector.trim()
    const complaint = ouvidoriaComplaint.trim()

    if (name.length < 2) { toast.error("Informe seu nome."); return }
    if (sector.length < 1) { toast.error("Informe seu setor."); return }
    if (complaint.length < 10) { toast.error("Descreva a denúncia com pelo menos 10 caracteres."); return }

    setIsSubmittingOuvidoria(true)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const response = await apiFetch("/ouvidoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sector, complaint }),
        signal: controller.signal,
      }, getPortalToken())

      clearTimeout(timeout)

      if (handleUnauthorizedPortalResponse(response)) return

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        toast.error(data.message || "Erro ao enviar denúncia.")
        return
      }

      setOuvidoriaSuccess(true)
      setOuvidoriaComplaint("")
    } catch (error: any) {
      if (error?.name === "AbortError") {
        toast.error("Tempo limite atingido. Tente novamente.")
      } else {
        console.error("Erro ao enviar ouvidoria:", error)
        toast.error("Erro ao enviar denúncia. Verifique sua conexão.")
      }
    } finally {
      setIsSubmittingOuvidoria(false)
    }
  }

  async function handleSubmit() {
    if (!loggedEmployee || !description) {
      toast.error("Descreva o problema antes de abrir o chamado.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await apiFetch("/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: loggedEmployee.id,
          department: ticketDepartment,
          category,
          origin,
          description,
          attachments: attachmentPayload(newTicketPhotos),
        }),
      }, getPortalToken())

      if (handleUnauthorizedPortalResponse(response)) {
        return
      }

      if (!response.ok) {
        toast.error("Erro ao abrir chamado.")
        return
      }

      const newTicket = await response.json()

      setSuccessState({
        isVisible: true,
        ticketId: newTicket.id,
        employeeName: loggedEmployee.name,
      })

      setTicketDepartment(null)
      setCategory("PC")
      setOrigin("Administrativo")
      setDescription("")
      setNewTicketPhotos([])
      loadMyTickets(loggedEmployee.id)
    } catch (error) {
      console.error(error)
      toast.error("Erro ao abrir chamado.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEmployeeReply() {
    if (!loggedEmployee || !selectedTicket) return
    if (!employeeReply.trim() && replyPhotos.length === 0) return

    setIsSendingReply(true)

    try {
      const response = await apiFetch(`/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderType: "employee",
          employeeId: loggedEmployee.id,
          message: employeeReply.trim(),
          attachments: attachmentPayload(replyPhotos),
        }),
      }, getPortalToken())

      if (handleUnauthorizedPortalResponse(response)) {
        return
      }

      if (!response.ok) {
        toast.error("Erro ao enviar resposta.")
        return
      }

      const newMessage = await response.json()
      setMessages((currentMessages) => [...currentMessages, newMessage])
      setSelectedTicket({ ...selectedTicket, status: "Em andamento" })
      setEmployeeReply("")
      setReplyPhotos([])
      loadMyTickets(loggedEmployee.id)
    } catch (error) {
      console.error("Erro ao responder chamado:", error)
      toast.error("Erro ao enviar resposta.")
    } finally {
      setIsSendingReply(false)
    }
  }

  async function handleFinishTicket() {
    if (!selectedTicket) return

    setIsFinishingTicket(true)

    try {
      const response = await apiFetch(`/tickets/${selectedTicket.id}/finish`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      }, getPortalToken())

      if (handleUnauthorizedPortalResponse(response)) {
        return
      }

      if (!response.ok) {
        toast.error("Erro ao finalizar chamado.")
        return
      }

      setSelectedTicket(null)
      setMessages([])
      loadMyTickets(loggedEmployee?.id)
      loadArchivedTickets(loggedEmployee?.id)
    } catch (error) {
      console.error("Erro ao finalizar chamado:", error)
      toast.error("Erro ao finalizar chamado.")
    } finally {
      setIsFinishingTicket(false)
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
    loadArchivedTickets(loggedEmployee?.id)
  }

  function handleTabChange(tab: "new" | "mine" | "ouvidoria" | "sugestoes") {
    setActiveTab(tab)
    if (tab === "ouvidoria") {
      setOuvidoriaSuccess(false)
      if (loggedEmployee) {
        setOuvidoriaName(loggedEmployee.name)
        setOuvidoriaSector(loggedEmployee.sector?.name || "")
      }
    }
  }

  function handleExit() {
    localStorage.removeItem(PORTAL_USER_KEY)
    hasShownExpiredSession.current = false
    setLoggedEmployee(null)
    setCategory("PC")
    setOrigin("Administrativo")
    setDescription("")
    setNewTicketPhotos([])
    setReplyPhotos([])
    setActiveTab("new")
    setShowArchivedTickets(false)
    setMyTickets([])
    setArchivedTickets([])
    setSelectedTicket(null)
    setMessages([])
    setSuccessState({ isVisible: false })
    setOuvidoriaName("")
    setOuvidoriaSector("")
    setOuvidoriaComplaint("")
    setOuvidoriaSuccess(false)
  }

  function handleUnauthorizedPortalResponse(response: Response) {
    if (response.status !== 401) return false

    localStorage.removeItem(PORTAL_USER_KEY)

    if (!hasShownExpiredSession.current) {
      hasShownExpiredSession.current = true
      toast.error("Sua sessão expirou. Entre novamente no portal para abrir ou acompanhar chamados.")
    }

    setLoggedEmployee(null)
    setMyTickets([])
    setArchivedTickets([])
    setSelectedTicket(null)
    setMessages([])
    setSuccessState({ isVisible: false })

    return true
  }

  const allTickets = [...myTickets, ...archivedTickets]
  const activeTickets = myTickets.filter((ticket) => ticket.status !== "Finalizado").length
  const finishedTickets = allTickets.filter((ticket) => ticket.status === "Finalizado").length

  if (!loggedEmployee) {
    if (!authChecked) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[color:var(--background)]">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#00A859]/25 border-t-[#00A859]" />
        </div>
      )
    }
    return <Navigate to="/login" replace />
  }

  if (successState.isVisible) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--background)] px-4 py-8">
        <GlassCard className="w-full max-w-md p-6 text-center sm:p-10">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[#39D98A]/25 blur-2xl" />
                <CheckCircle2 className="portal-success-check relative h-16 w-16 text-[#00A859] sm:h-20 sm:w-20" />
              </div>
            </div>

            <div className="mt-6 space-y-3 sm:mt-7">
              <h1 className="text-2xl font-black tracking-[-0.04em] text-[#111827] sm:text-3xl">Chamado enviado</h1>
              <p className="text-sm leading-6 text-slate-500">
                Solicitação criada com sucesso. Acompanhe as respostas pelo portal.
              </p>
            </div>

            <div className="mt-6 rounded-[1.35rem] border border-[color:var(--hairline)] bg-white p-5 shadow-sm sm:mt-7 sm:rounded-[1.5rem]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">ID do chamado</p>
              <p className="mt-1 text-2xl font-black text-[#073B2A]">#{successState.ticketId}</p>
              <div className="mt-4 border-t border-[color:var(--hairline)] pt-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Solicitante</p>
                <p className="mt-1 text-base font-bold text-[#111827]">{successState.employeeName}</p>
              </div>
            </div>

            <div className="portal-success-actions mt-6 grid gap-3 sm:mt-7 sm:grid-cols-3">
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
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#00A859] sm:text-xs">Portal interno</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#111827] sm:text-3xl">
                Olá, {loggedEmployee.name}
              </h1>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                Setor: <strong className="text-[#073B2A]">{loggedEmployee.sector?.name}</strong>
                <span className="ml-2 text-xs font-semibold text-slate-400">· Versão {APP_VERSION}</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <MiniMetric label="Ativos" value={activeTickets} icon={Activity} accent="#0EA5E9" />
              <MiniMetric label="Finalizados" value={finishedTickets} icon={CheckCheck} accent="#00A859" />
              <MiniMetric label="Total" value={allTickets.length} icon={Layers} accent="#8B5CF6" />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-1 rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--surface-inset)] p-1 lg:w-fit">
              {(
                [
                  { key: "new", label: "Novo Chamado", short: "Novo", Icon: PlusCircle, activeColor: "bg-[#00A859]" },
                  { key: "mine", label: "Meus Chamados", short: "Meus", Icon: MessageSquareText, activeColor: "bg-[#00A859]" },
                  { key: "sugestoes", label: "Sugestões", short: "Ideias", Icon: Lightbulb, activeColor: "bg-[#00A859]" },
                  { key: "ouvidoria", label: "Ouvidoria", short: "Ouvidoria", Icon: ShieldAlert, activeColor: "bg-[#00A859]" },
                ] as const
              ).map(({ key, label, short, Icon, activeColor }) => (
                <button
                  key={key}
                  onClick={() => handleTabChange(key)}
                  className={`inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-bold transition-all duration-200 sm:flex-none sm:gap-2 sm:px-4 ${
                    activeTab === key
                      ? `${activeColor} text-white shadow-md scale-[1.01]`
                      : "text-slate-600 hover:bg-slate-50 hover:text-[#073B2A]"
                  }`}
                >
                  <Icon size={15} className={`hidden shrink-0 sm:block ${activeTab === key ? "opacity-100" : "opacity-60"}`} />
                  <span className="hidden truncate sm:inline">{label}</span>
                  <span className="truncate sm:hidden">{short}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="h-10 rounded-2xl border border-[color:var(--hairline)] bg-white font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={handleExit}
              >
                <LogOut size={15} className="mr-2 opacity-70" />
                Sair do portal
              </Button>
            </div>
          </div>
        </header>

        {activeTab === "sugestoes" ? (
          <GlassCard className="p-4 sm:p-6">
            <EmployeeSuggestions employee={loggedEmployee} />
          </GlassCard>
        ) : activeTab === "ouvidoria" ? (
          <GlassCard className="p-4 sm:p-6">
            {ouvidoriaSuccess ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="relative mb-2">
                  <div className="absolute inset-0 rounded-full bg-[#39D98A]/20 blur-2xl" />
                  <CheckCircle2 className="relative h-16 w-16 text-[#00A859]" />
                </div>
                <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-[#111827]">Denúncia registrada!</h2>
                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                  Sua denúncia foi recebida e será encaminhada com sigilo ao responsável.
                </p>
                <Button
                  className="mt-8 h-11 rounded-xl px-8 bg-[#00A859] font-bold text-white shadow-[var(--shadow-xs)] transition hover:bg-[#07934E]"
                  onClick={() => setOuvidoriaSuccess(false)}
                >
                  Enviar nova denúncia
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-start gap-4">
                    <div className="ls-card-dark flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-[var(--shadow-sm)]">
                      <ShieldAlert size={22} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#073B2A]">Canal confidencial</p>
                        <span className="rounded-full bg-[#073B2A]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#073B2A]">Sigiloso</span>
                      </div>
                      <h2 className="mt-0.5 text-2xl font-black tracking-[-0.04em] text-[#111827]">Ouvidoria</h2>
                      <p className="mt-1.5 text-sm leading-6 text-slate-500">
                        Registre denúncias ou irregularidades de forma sigilosa. Após o envio, a mensagem é encaminhada diretamente ao responsável por e-mail.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
                  <div className="space-y-4">
                    <div className="rounded-[1.35rem] border border-[color:var(--hairline)] bg-white p-4 shadow-sm sm:rounded-[1.5rem]">
                      <p className="mb-4 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Identificação</p>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Nome</label>
                          <Input
                            value={ouvidoriaName}
                            readOnly
                            className={`mt-1.5 cursor-default select-none bg-[color:var(--surface-inset)] text-slate-500 ${styles.input}`}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Setor</label>
                          <Input
                            value={ouvidoriaSector}
                            readOnly
                            className={`mt-1.5 cursor-default select-none bg-[color:var(--surface-inset)] text-slate-500 ${styles.input}`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs font-black text-amber-800">Sigilo garantido</p>
                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        O conteúdo desta denúncia é enviado diretamente ao responsável pela ouvidoria. Seja objetivo e inclua o máximo de detalhes possível.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 rounded-[1.35rem] border border-[color:var(--hairline)] bg-white p-4 shadow-sm sm:rounded-[1.5rem]">
                    <div className="flex-1">
                      <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Descrição da denúncia</label>
                      <Textarea
                        value={ouvidoriaComplaint}
                        onChange={(e) => setOuvidoriaComplaint(e.target.value)}
                        placeholder="Descreva o que aconteceu, quando, onde e quem está envolvido..."
                        className="mt-2 min-h-[240px] w-full rounded-2xl border-[color:var(--hairline)] bg-white px-4 py-3 text-sm text-slate-950 focus:border-[#073B2A] focus:outline-none focus:ring-2 focus:ring-[#073B2A]/10"
                      />
                      <p className="mt-1.5 text-xs text-slate-400">
                        {ouvidoriaComplaint.trim().length} caracteres {ouvidoriaComplaint.trim().length < 10 && "(mínimo 10)"}
                      </p>
                    </div>

                    <Button
                      className={`h-12 w-full ${styles.primary}`}
                      onClick={handleOuvidoriaSubmit}
                      disabled={isSubmittingOuvidoria || ouvidoriaComplaint.trim().length < 10 || !ouvidoriaName.trim() || !ouvidoriaSector.trim()}
                    >
                      {isSubmittingOuvidoria ? "Registrando..." : "Enviar denúncia"}
                      <Send size={16} className="ml-2" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </GlassCard>
        ) : activeTab === "new" ? (
          <GlassCard className="p-4 sm:p-6">
            {!ticketDepartment ? (
              /* Step 1: choose department */
              <>
                <div className="mb-6 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#00A859]">Novo chamado</p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#111827]">Para qual setor é o chamado?</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Selecione o setor responsável pelo atendimento.</p>
                </div>

                <div className="mx-auto max-w-sm space-y-3">
                  {(
                    [
                      {
                        id: "TI" as TicketDepartment,
                        label: "Setor TI",
                        description: "Suporte a sistemas, equipamentos e redes",
                        icon: Monitor,
                      },
                      {
                        id: "RH" as TicketDepartment,
                        label: "Setor RH",
                        description: "Salário, benefícios, férias e gestão de pessoas",
                        icon: Users,
                      },
                      {
                        id: "Infraestrutura" as TicketDepartment,
                        label: "Infraestrutura",
                        description: "Instalações, manutenção e infraestrutura predial",
                        icon: Building2,
                      },
                    ] as const
                  ).map((dept, i) => {
                    const Icon = dept.icon
                    return (
                      <button
                        key={dept.id}
                        onClick={() => {
                          setTicketDepartment(dept.id)
                          setCategory(categoriesByDepartment[dept.id][0])
                        }}
                        className="group flex w-full items-center gap-4 rounded-2xl border border-[color:var(--hairline)] bg-white px-4 py-[14px] text-left shadow-[var(--shadow-xs)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00A859]/40 hover:shadow-[var(--shadow-md)]"
                        style={{ animation: `ap-fade-up 0.38s cubic-bezier(.22,.68,0,1.2) ${0.06 + i * 0.09}s both` }}
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00A859]/10 text-[#00A859] ring-1 ring-[#00A859]/15 transition-colors duration-200 group-hover:bg-[#00A859] group-hover:text-white group-hover:ring-transparent">
                          <Icon size={22} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-bold tracking-[-0.02em] text-[color:var(--foreground)]">
                            {dept.label}
                          </span>
                          <span className="mt-0.5 block text-xs font-medium leading-4 text-[color:var(--muted-foreground)]">
                            {dept.description}
                          </span>
                        </span>
                        <ChevronRight size={18} className="shrink-0 text-zinc-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#00A859]" />
                      </button>
                    )
                  })}
                </div>
                <style>{`@keyframes ap-fade-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
              </>
            ) : (
              /* Step 2: form with department-specific categories */
              <>
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <button
                      onClick={() => { setTicketDepartment(null); setCategory("PC"); setDescription("") }}
                      className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-slate-600"
                    >
                      <ChevronLeft size={14} />
                      Trocar setor
                    </button>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#00A859]">
                      Novo atendimento · {ticketDepartment === "Infraestrutura" ? "Infraestrutura" : `Setor ${ticketDepartment}`}
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#111827]">Qual é o problema?</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">Descreva o que está acontecendo para a equipe técnica começar com contexto.</p>
                  </div>
                  <div className="hidden rounded-2xl border border-[#BFEFD7] bg-[#ECFBF3] px-4 py-3 text-sm font-bold text-[#073B2A] sm:block">
                    Resposta pelo portal
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
                  <div className="space-y-3">
                    <div className="rounded-[1.35rem] border border-[color:var(--hairline)] bg-white p-4 shadow-sm sm:rounded-[1.5rem]">
                      <div className="mb-4">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#00A859]">Classificação</p>
                        <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">Escolha o tipo e a origem do chamado.</p>
                      </div>

                      <div className="grid gap-4">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Categoria</label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className={`mt-2 ${styles.select}`}
                          >
                            {categoriesByDepartment[ticketDepartment].map((cat) => (
                              <option key={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Origem</label>
                          <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-[color:var(--hairline)] bg-white p-1">
                            {["Administrativo", "Operacional"].map((originOption) => (
                              <button
                                key={originOption}
                                type="button"
                                onClick={() => setOrigin(originOption)}
                                className={`h-10 rounded-xl text-sm font-black transition ${
                                  origin === originOption
                                    ? "bg-[#00A859] text-white shadow-sm"
                                    : "text-slate-600 hover:bg-white"
                                }`}
                              >
                                {originOption}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.35rem] border border-[#BFEFD7] bg-[#ECFBF3] p-4 text-sm leading-6 text-[#073B2A] shadow-sm sm:rounded-[1.5rem]">
                      <p className="font-black">Dica rápida</p>
                      <p className="mt-1 text-xs font-semibold text-[#376B55]">
                        Quanto mais claro for o contexto, mais rápido a equipe técnica consegue responder.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[1.35rem] border border-[color:var(--hairline)] bg-white p-3 shadow-sm sm:rounded-[1.5rem] sm:p-4">
                    <div>
                      <label className="text-sm font-bold text-[#102A43]">Descrição</label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva o problema com contexto objetivo..."
                        className="mt-2 min-h-[220px] rounded-2xl border-[color:var(--hairline)] bg-white/95 px-4 py-3 text-slate-950 focus:border-[#00A859]"
                      />
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                        Inclua local, equipamento, mensagem de erro e urgência, se houver.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-dashed border-[#CFE2D8] bg-[color:var(--surface-inset)] p-3">
                      <p className="mb-2 text-xs font-bold text-slate-500">
                        Anexos <span className="font-medium text-slate-400">(opcional)</span>
                      </p>
                      <AttachmentPicker
                        attachments={newTicketPhotos}
                        onAdd={(attachment) => setNewTicketPhotos((current) => [...current, attachment])}
                        onRemove={(id) => setNewTicketPhotos((current) => current.filter((photo) => photo.id !== id))}
                      />
                    </div>

                    <Button
                      className={`h-12 w-full ${styles.primary}`}
                      onClick={handleSubmit}
                      disabled={isSubmitting || !description.trim()}
                    >
                      {isSubmitting ? "Enviando..." : "Abrir chamado"}
                      <Send size={16} className="ml-2" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </GlassCard>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
            <GlassCard className="p-4">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black tracking-[-0.03em] text-[#111827]">Meus chamados</h2>
                  <p className="text-sm text-slate-500">{myTickets.length} aberto(s) ou em andamento</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-[color:var(--hairline)] bg-white text-slate-700"
                  onClick={() => {
                    loadMyTickets(loggedEmployee.id)
                    loadArchivedTickets(loggedEmployee.id)
                  }}
                  disabled={isLoadingTickets}
                >
                  <RefreshCw size={14} />
                </Button>
              </div>

              <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
                {isLoadingTickets && myTickets.length === 0 && (
                  <>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 rounded-2xl bg-white" />
                    ))}
                  </>
                )}
                {myTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => loadTicketMessages(ticket)}
                    className={`group w-full overflow-hidden rounded-2xl border text-left shadow-sm transition-all duration-150 hover:shadow-md ${
                      selectedTicket?.id === ticket.id
                        ? "border-[#00A859]/40 bg-[#00A859]/8 ring-1 ring-[#00A859]/20"
                        : "border-[color:var(--hairline)] bg-white hover:bg-white"
                    }`}
                  >
                    <div
                      className="h-1 w-full rounded-t-2xl"
                      style={{ background: getStatusAccent(ticket.status) }}
                    />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: getStatusAccent(ticket.status) }}>
                            #{ticket.id}
                          </p>
                          <h3 className="mt-0.5 truncate text-sm font-black text-[#111827]">{ticket.category}</h3>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusStyle(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{ticket.description}</p>
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Clock3 size={11} />
                        <span>{ticket.createdAt}</span>
                      </div>
                    </div>
                  </button>
                ))}

                {myTickets.length === 0 && (
                  <EmptyPortalState
                    title="Nenhum chamado ativo"
                    description="Quando você abrir um chamado, ele aparecerá aqui para acompanhamento."
                  />
                )}

                {archivedTickets.length > 0 && (
                  <div className="mt-2 border-t border-[color:var(--hairline)] pt-3">
                    <button
                      onClick={() => setShowArchivedTickets(!showArchivedTickets)}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                    >
                      <span>Arquivados ({archivedTickets.length})</span>
                      <ChevronDown
                        size={16}
                        className={`transition ${showArchivedTickets ? "rotate-180" : ""}`}
                      />
                    </button>

                    {showArchivedTickets && (
                      <div className="mt-2 space-y-2">
                        {archivedTickets.map((ticket) => (
                          <button
                            key={ticket.id}
                            onClick={() => loadTicketMessages(ticket)}
                            className={`w-full rounded-2xl border border-l-4 p-3 text-left text-sm transition hover:border-[#00A859]/35 hover:bg-white ${
                              selectedTicket?.id === ticket.id
                                ? "border-[#00A859]/40 bg-[#00A859]/10"
                                : "border-[color:var(--hairline)] bg-white opacity-70"
                            }`}
                            style={{ borderLeftColor: getStatusAccent(ticket.status) }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#00A859]">#{ticket.id}</p>
                                <h3 className="mt-1 truncate text-xs font-bold text-[#111827]">{ticket.category}</h3>
                              </div>
                              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold ${getStatusStyle(ticket.status)}`}>
                                {ticket.status}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-1 text-xs leading-4 text-slate-500">{ticket.description}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>

            <GlassCard className="overflow-hidden p-0">
              {selectedTicket ? (
                <div className="flex min-h-[560px] flex-col">
                  <div className="border-b border-[color:var(--hairline)] bg-white p-4 sm:p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#00A859] sm:text-xs">Conversa do chamado</p>
                        <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-[#111827] sm:text-2xl">
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

                  <div className="flex-1 space-y-5 overflow-y-auto bg-[color:var(--surface-inset)] p-4 sm:p-5">
                    {messages.map((message) => {
                      const isEmployee = message.senderType === "employee"
                      const isBot = message.senderType === "bot"
                      const senderLabel = isEmployee ? "Você" : isBot ? "Bot" : (message.senderName || "Técnico")
                      const initials = senderLabel
                        .split(" ")
                        .slice(0, 2)
                        .map((w: string) => w[0])
                        .join("")
                        .toUpperCase()

                      return (
                        <div key={message.id} className={`flex items-end gap-2.5 ${isEmployee ? "flex-row-reverse" : "flex-row"}`}>
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-black shadow-sm ${
                              isEmployee
                                ? "bg-[#00A859] text-white"
                                : isBot
                                ? "bg-blue-500 text-white"
                                : "bg-[#073B2A] text-white"
                            }`}
                          >
                            {isBot ? <Bot size={14} /> : initials}
                          </div>
                          <div
                            className={`max-w-[80%] rounded-3xl border px-4 py-3 shadow-sm ${
                              isEmployee
                                ? "rounded-br-md border-[#00A859]/20 bg-[#00A859]/10 text-[#073B2A]"
                                : isBot
                                ? "rounded-bl-md border-blue-200 bg-blue-50 text-[#111827]"
                                : "rounded-bl-md border-[color:var(--hairline)] bg-white text-[#111827]"
                            }`}
                          >
                            <div className="mb-1.5 flex flex-wrap items-center gap-2">
                              <p className={`text-[11px] font-black uppercase tracking-[0.1em] ${isBot ? "text-blue-600" : isEmployee ? "text-[#00A859]" : "text-slate-500"}`}>
                                {isEmployee ? "Você" : isBot ? "Atendimento Automático" : message.senderName || "Técnico"}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {new Date(message.createdAt).toLocaleString("pt-BR")}
                              </p>
                            </div>
                            {message.message && (
                              <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.message}</p>
                            )}
                            {(message.attachments?.length ?? 0) > 0 && (
                              <div className="mt-2.5">
                                <AttachmentGallery
                                  attachments={message.attachments!}
                                  buildPath={(a) => `/tickets/${message.ticketId}/attachments/${a.id}`}
                                  token={getPortalToken()}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {messages.length === 0 && (
                      <EmptyPortalState
                        title="Sem mensagens ainda"
                        description="Assim que a equipe responder, a conversa aparecerá aqui."
                      />
                    )}
                  </div>

                  <div className="border-t border-[color:var(--hairline)] bg-white p-4">
                    {selectedTicket.status === "Finalizado" ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        Este chamado está finalizado e arquivado.
                      </div>
                    ) : (
                      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                        <div className="space-y-2">
                          <Textarea
                            value={employeeReply}
                            onChange={(e) => setEmployeeReply(e.target.value)}
                            placeholder="Responda o técnico ou envie mais detalhes..."
                            className="min-h-[92px] rounded-2xl border-[color:var(--hairline)] bg-white text-slate-950 focus:border-[#00A859]"
                          />
                          <AttachmentPicker
                            compact
                            attachments={replyPhotos}
                            onAdd={(attachment) => setReplyPhotos((current) => [...current, attachment])}
                            onRemove={(id) => setReplyPhotos((current) => current.filter((photo) => photo.id !== id))}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-col">
                          <Button
                            className={`h-11 px-6 ${styles.primary}`}
                            onClick={handleEmployeeReply}
                            disabled={isSendingReply || (!employeeReply.trim() && replyPhotos.length === 0)}
                          >
                            {isSendingReply ? "Enviando..." : "Responder"}
                          </Button>
                          <Button
                            className="px-6 h-11 rounded-2xl border border-[#00A859]/40 bg-[#00A859]/10 font-bold text-[#073B2A] transition hover:bg-[#00A859]/20 disabled:opacity-50"
                            onClick={handleFinishTicket}
                            disabled={isFinishingTicket}
                          >
                            {isFinishingTicket ? "Finalizando..." : "Finalizar"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[520px] items-center justify-center bg-[color:var(--surface-inset)] p-8 text-center">
                  <div className="max-w-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[color:var(--accent)] text-[#00A859] shadow-[var(--shadow-xs)] ring-1 ring-[#00A859]/15">
                      <MessageSquareText size={30} />
                    </div>
                    <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-[#111827]">Selecione um chamado</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Clique em qualquer chamado da lista para ver a conversa com a equipe técnica.
                    </p>
                    <div className="mx-auto mt-5 flex max-w-[200px] flex-col gap-1.5">
                      {["Aberto", "Em andamento", "Finalizado"].map((s) => (
                        <div key={s} className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold ${getStatusStyle(s)}`}>
                          <span className="h-2 w-2 rounded-full" style={{ background: getStatusAccent(s) }} />
                          {s}
                        </div>
                      ))}
                    </div>
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
