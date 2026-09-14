import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import toast from "react-hot-toast"
import {
  ArrowRight,
  LockKeyhole,
  UserRound,
  ShieldCheck,
  Headset,
  ChevronRight,
} from "lucide-react"
import logoLifting from "../../assets/logo-lifting-icon-dark-bg.png"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { APP_VERSION } from "@/lib/version"
import { API_URL, AUTH_CHANGED_EVENT, PORTAL_USER_KEY, TECHNICAL_USER_KEY } from "@/services/api"
import { subscribeToPush } from "@/pwa"

const technicalSectors = ["Admin", "TI", "RH", "Infraestrutura"]

const inputClass =
  "h-[52px] w-full rounded-full border border-slate-200 bg-white pl-12 pr-5 text-sm font-semibold text-slate-800 shadow-[0_8px_25px_rgba(15,23,42,0.04)] outline-none transition hover:border-[#00A859]/40 focus:border-[#00A859] focus:ring-4 focus:ring-[#39D98A]/10"

const primaryBtnClass =
  "mt-2 h-[52px] w-full rounded-full bg-[#00A859] font-bold !text-white shadow-[var(--shadow-xs)] transition hover:bg-[#07934E] active:translate-y-px disabled:opacity-50"

export function AccessScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // "active" = lado técnico revelado; padrão = funcionário
  const [active, setActive] = useState(searchParams.get("tipo") === "tecnico")

  // Funcionário (abrir chamado)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Técnico (responder chamados)
  const [sector, setSector] = useState("Admin")
  const [pin, setPin] = useState("")
  const [isValidatingPin, setIsValidatingPin] = useState(false)

  async function handlePortalLogin() {
    if (isLoggingIn) return
    if (!username || !password) {
      toast.error("Digite seu usuário e senha.")
      return
    }

    setIsLoggingIn(true)
    try {
      const response = await fetch(`${API_URL}/employees/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        toast.error("Usuário ou senha inválidos.")
        return
      }

      const employee = await response.json()
      localStorage.setItem(PORTAL_USER_KEY, JSON.stringify(employee))
      navigate("/")
    } catch (error) {
      console.error("Erro ao acessar portal:", error)
      toast.error("Erro ao acessar portal.")
    } finally {
      setIsLoggingIn(false)
    }
  }

  async function handleTechnicalLogin() {
    if (isValidatingPin) return
    if (!pin) {
      toast.error("Digite seu PIN.")
      return
    }

    setIsValidatingPin(true)
    try {
      const response = await fetch(`${API_URL}/auth/technical`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector, pin }),
      })

      if (!response.ok) {
        toast.error("PIN inválido.")
        return
      }

      const data = await response.json()
      localStorage.setItem(
        TECHNICAL_USER_KEY,
        JSON.stringify({ ...data.user, token: data.token }),
      )
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
      subscribeToPush().catch(() => {})
      navigate("/home")
    } catch (error) {
      console.error("Erro ao acessar painel:", error)
      toast.error("Erro ao acessar painel técnico.")
    } finally {
      setIsValidatingPin(false)
    }
  }

  return (
    <div className="auth-stage text-[#111827]">
      <div className={`auth-container ${active ? "auth-active" : ""}`}>
        {/* Cabeçalho verde — apenas mobile */}
        <div className="auth-mobile-top">
          <img
            src={logoLifting}
            alt="Lifting"
            className="h-14 w-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
          />
          <p className="text-sm font-semibold text-emerald-50/80">
            {active ? "Painel técnico" : "Portal do funcionário"}
          </p>
        </div>

        {/* ── Formulário Funcionário (abrir chamado) ── */}
        <div className="auth-form-container auth-func-container">
          <div className="auth-form-inner">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-5 hidden h-14 w-14 items-center justify-center rounded-2xl bg-[#00A859]/10 text-[#00A859] ring-1 ring-[#00A859]/20 lg:flex">
                <UserRound size={24} />
              </div>
              <h2 className="text-3xl font-black tracking-[-0.05em] text-[#111827]">Abrir chamado</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Acesse o portal do funcionário com usuário e senha.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <UserRound size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Digite seu usuário"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="relative">
                <LockKeyhole size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="password"
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handlePortalLogin() }}
                  className={inputClass}
                />
              </div>
              <Button onClick={handlePortalLogin} disabled={isLoggingIn} className={primaryBtnClass}>
                {isLoggingIn ? "Entrando..." : "Entrar no portal"}
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>

            <div className="mt-7 text-center">
              <p className="text-xs leading-5 text-slate-400">Acesso restrito para funcionários autorizados.</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-300">Versão {APP_VERSION}</p>
            </div>

            {/* Troca de lado — mobile */}
            <div className="auth-switch-mobile mt-5 border-t border-slate-100 pt-4 text-center">
              <p className="text-xs text-slate-400">É da equipe técnica?</p>
              <button
                onClick={() => setActive(true)}
                className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#00A859] transition hover:underline"
              >
                Responder chamados <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Formulário Técnico (responder chamados) ── */}
        <div className="auth-form-container auth-tech-container">
          <div className="auth-form-inner">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-5 hidden h-14 w-14 items-center justify-center rounded-2xl bg-[#00A859]/10 text-[#00A859] ring-1 ring-[#00A859]/20 lg:flex">
                <Headset size={24} />
              </div>
              <h2 className="text-3xl font-black tracking-[-0.05em] text-[#111827]">Responder chamados</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Entre no painel técnico com seu setor e PIN.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <ShieldCheck size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="h-[52px] w-full appearance-none rounded-full border border-slate-200 bg-white pl-12 pr-5 text-sm font-semibold text-slate-800 shadow-[0_8px_25px_rgba(15,23,42,0.04)] outline-none transition hover:border-[#00A859]/40 focus:border-[#00A859] focus:ring-4 focus:ring-[#39D98A]/10"
                >
                  {technicalSectors.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronRight size={16} className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400" />
              </div>
              <div className="relative">
                <LockKeyhole size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="password"
                  placeholder="Digite seu PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleTechnicalLogin() }}
                  className={inputClass}
                />
              </div>
              <Button onClick={handleTechnicalLogin} disabled={isValidatingPin} className={primaryBtnClass}>
                {isValidatingPin ? "Validando..." : "Entrar no painel"}
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>

            <div className="mt-7 text-center">
              <p className="text-xs leading-5 text-slate-400">Acesso restrito para equipes autorizadas.</p>
            </div>

            {/* Troca de lado — mobile */}
            <div className="auth-switch-mobile mt-5 border-t border-slate-100 pt-4 text-center">
              <p className="text-xs text-slate-400">É funcionário?</p>
              <button
                onClick={() => setActive(false)}
                className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#00A859] transition hover:underline"
              >
                Abrir chamado <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Painel verde deslizante (desktop) ── */}
        <div className="auth-overlay-container">
          <div className="auth-overlay">
            {/* Visível quando lado técnico ativo → convida a voltar p/ funcionário */}
            <div className="auth-overlay-panel auth-overlay-left">
              <img
                src={logoLifting}
                alt="Lifting"
                className="mb-6 h-16 w-auto object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.3)]"
              />
              <h3 className="text-2xl font-black tracking-[-0.04em] text-white">É funcionário?</h3>
              <p className="mt-2 max-w-[15rem] text-sm leading-6 text-emerald-50/75">
                Abra e acompanhe seus chamados pelo portal do funcionário.
              </p>
              <button className="auth-ghost-btn" onClick={() => setActive(false)}>
                Abrir chamado <ArrowRight size={16} />
              </button>
            </div>

            {/* Visível no estado inicial → convida a ir p/ técnico */}
            <div className="auth-overlay-panel auth-overlay-right">
              <img
                src={logoLifting}
                alt="Lifting"
                className="mb-6 h-16 w-auto object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.3)]"
              />
              <h3 className="text-2xl font-black tracking-[-0.04em] text-white">É da equipe técnica?</h3>
              <p className="mt-2 max-w-[15rem] text-sm leading-6 text-emerald-50/75">
                Acesse o painel para responder e gerenciar os chamados internos.
              </p>
              <button className="auth-ghost-btn" onClick={() => setActive(true)}>
                Responder chamados <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
