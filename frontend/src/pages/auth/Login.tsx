import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  LockKeyhole,
  ShieldCheck,
  UserRound,
  ArrowRight,
  Monitor,
  Users,
  Building2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import logoLifting from "../../assets/logo-lifting-icon-dark-bg.png"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { API_URL, AUTH_CHANGED_EVENT, TECHNICAL_USER_KEY } from "@/services/api"
import { subscribeToPush } from "@/pwa"

const technicalSectors = ["Admin", "TI", "RH", "Infraestrutura"]

type DepartmentOption = {
  id: string
  label: string
  description: string
  icon: React.ElementType
}

const departmentOptions: DepartmentOption[] = [
  {
    id: "TI",
    label: "Setor TI",
    description: "Suporte técnico, sistemas e infraestrutura",
    icon: Monitor,
  },
  {
    id: "RH",
    label: "Setor RH",
    description: "Recursos humanos e gestão de pessoas",
    icon: Users,
  },
  {
    id: "IN",
    label: "Setor IN",
    description: "Infraestrutura, instalações e manutenção",
    icon: Building2,
  },
]

const CSS = `
  @keyframes ls-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ls-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes ls-pulse-ring {
    0%, 100% { box-shadow: 0 0 0 0 rgba(0,168,89,0.38); }
    55%       { box-shadow: 0 0 0 9px rgba(0,168,89,0); }
  }
  @keyframes ls-icon-bounce {
    0%, 100% { transform: translateY(0) scale(1); }
    38%  { transform: translateY(-5px) scale(1.13); }
    68%  { transform: translateY(2px) scale(0.96); }
  }

  /* slide forward: selection → login */
  @keyframes ls-exit-left {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(-48px); }
  }
  @keyframes ls-enter-right {
    from { opacity: 0; transform: translateX(48px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  /* slide back: login → selection */
  @keyframes ls-exit-right {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(48px); }
  }
  @keyframes ls-enter-left {
    from { opacity: 0; transform: translateX(-48px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .ls-anim-exit-left  { animation: ls-exit-left  0.26s cubic-bezier(.4,0,.6,1) forwards; }
  .ls-anim-enter-right{ animation: ls-enter-right 0.32s cubic-bezier(.22,.68,0,1.18) 0.05s both; }
  .ls-anim-exit-right { animation: ls-exit-right  0.26s cubic-bezier(.4,0,.6,1) forwards; }
  .ls-anim-enter-left { animation: ls-enter-left  0.32s cubic-bezier(.22,.68,0,1.18) 0.05s both; }

  .ls-sector-btn:hover .ls-sector-icon {
    animation: ls-icon-bounce 0.52s ease forwards;
  }
  .ls-shimmer-text {
    background: linear-gradient(90deg,#073B2A 0%,#00A859 30%,#39D98A 50%,#00A859 70%,#073B2A 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: ls-shimmer 3.6s linear infinite;
  }
  .ls-logo-pulse {
    animation: ls-pulse-ring 2.2s ease infinite;
  }
`

export function Login() {
  const navigate = useNavigate()
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [animClass, setAnimClass] = useState("")
  const [sector, setSector] = useState("Admin")
  const [pin, setPin] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  function goToDept(id: string) {
    setAnimClass("ls-anim-exit-left")
    setTimeout(() => {
      setSelectedDept(id)
      setAnimClass("ls-anim-enter-right")
    }, 240)
  }

  function goBack() {
    setAnimClass("ls-anim-exit-right")
    setTimeout(() => {
      setSelectedDept(null)
      setPin("")
      setAnimClass("ls-anim-enter-left")
    }, 240)
  }

  async function handleLogin() {
    if (isLoading) return
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/technical`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector, pin }),
      })
      if (!response.ok) {
        alert("PIN inválido")
        setIsLoading(false)
        return
      }
      const data = await response.json()
      localStorage.setItem(
        TECHNICAL_USER_KEY,
        JSON.stringify({ ...data.user, token: data.token, department: selectedDept })
      )
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
      subscribeToPush().catch(() => {})
      navigate("/dashboard")
    } catch (error) {
      console.error("Erro ao acessar painel:", error)
      alert("Erro ao acessar painel.")
      setIsLoading(false)
    }
  }

  const activeDept = departmentOptions.find((d) => d.id === selectedDept)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EAF0ED] px-4 py-8 text-[#111827]">
      <style>{CSS}</style>

      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_28px_90px_rgba(7,59,42,0.16)] lg:grid-cols-[1.05fr_0.95fr]">

        {/* ── Left panel ── */}
        <section className="relative hidden min-h-[620px] overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(57,217,138,0.28),transparent_32%),linear-gradient(135deg,#073B2A,#102A43)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#39D98A]/20 blur-[90px]" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#00A859]/20 blur-[100px]" />
          <div className="relative">
            <img src={logoLifting} alt="Lifting" className="h-20 w-auto object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.28)]" />
            <p className="mt-4 max-w-sm text-sm leading-6 text-emerald-50/80">
              Technical Support para acompanhamento, resposta e gestão de chamados internos.
            </p>
          </div>
          <div className="relative space-y-3">
            <div className="rounded-3xl border border-white/14 bg-white/10 p-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-[#39D98A]" size={22} />
                <div>
                  <p className="text-sm font-bold !text-white">Acesso restrito</p>
                  <p className="text-xs text-emerald-50/65">Admin, TI, RH e Infraestrutura</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/14 bg-white/10 p-4 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.18em] text-[#39D98A]">Lifting Support</p>
              <p className="mt-1 text-sm text-emerald-50/70">Operação, relatórios e atendimento em um só lugar.</p>
            </div>
          </div>
        </section>

        {/* ── Right panel ── */}
        <section className="flex min-h-[620px] items-center justify-center overflow-hidden bg-white px-6 py-10 sm:px-12">
          <div className={`w-full max-w-[360px] ${animClass}`}>

            {!selectedDept ? (
              /* ── Tela 1: seleção de setor ── */
              <>
                <div className="mb-7 text-center">
                  <h2 className="text-3xl font-black tracking-[-0.05em]">
                    <span className="ls-shimmer-text">Selecione o setor</span>
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Escolha o setor para continuar o acesso ao painel.
                  </p>
                </div>

                <div className="space-y-3">
                  {departmentOptions.map((dept, i) => {
                    const Icon = dept.icon
                    return (
                      <button
                        key={dept.id}
                        onClick={() => goToDept(dept.id)}
                        className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl p-[1.5px] text-left"
                        style={{
                          background: "linear-gradient(135deg,#00A859,#39D98A,#00A859)",
                          animation: `ls-fade-up 0.38s cubic-bezier(.22,.68,0,1.2) ${0.06 + i * 0.09}s both`,
                        }}
                      >
                        <span className="flex w-full items-center gap-4 rounded-[14px] bg-white px-4 py-[14px] transition-all duration-200 group-hover:bg-[linear-gradient(135deg,#073B2A,#00A859)]">
                          <span className="ls-sector-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00A859]/10 text-[#00A859] ring-1 ring-[#00A859]/20 transition-all duration-200 group-hover:bg-white/15 group-hover:text-white group-hover:ring-white/30">
                            <Icon size={22} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[15px] font-black tracking-[-0.02em] text-[#073B2A] transition-colors duration-200 group-hover:text-white">
                              {dept.label}
                            </span>
                            <span className="mt-0.5 block text-xs font-medium leading-4 text-slate-500 transition-colors duration-200 group-hover:text-emerald-100">
                              {dept.description}
                            </span>
                          </span>
                          <ChevronRight size={18} className="shrink-0 text-[#00A859] transition-all duration-200 group-hover:translate-x-1 group-hover:text-white" />
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                  <p className="text-xs text-slate-400">É funcionário?</p>
                  <button onClick={() => navigate("/portal")} className="mt-2 text-sm font-bold text-[#00A859] transition hover:underline">
                    Acessar portal do funcionário →
                  </button>
                </div>
              </>
            ) : (
              /* ── Tela 2: formulário de login ── */
              <>
                {/* badge do setor selecionado */}
                {activeDept && (() => {
                  const Icon = activeDept.icon
                  return (
                    <div className="mb-6 flex items-center justify-between">
                      <button
                        onClick={goBack}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-[#00A859]"
                      >
                        <ChevronLeft size={14} />
                        Voltar
                      </button>
                      <span className="flex items-center gap-2 rounded-full border border-[#00A859]/20 bg-[#00A859]/8 px-3 py-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00A859]/15 text-[#00A859]">
                          <Icon size={12} />
                        </span>
                        <span className="text-xs font-black text-[#073B2A]">{activeDept.label}</span>
                      </span>
                    </div>
                  )
                })()}

                <div className="mb-8 text-center">
                  <h2 className="text-4xl font-black tracking-[-0.06em] text-[#111827]">Entrar</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Acesse o painel técnico com seu perfil autorizado.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <UserRound size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="h-[52px] w-full appearance-none rounded-full border border-slate-200 bg-white pl-12 pr-5 text-sm font-semibold text-slate-800 shadow-[0_8px_25px_rgba(15,23,42,0.04)] outline-none transition hover:border-[#00A859]/40 focus:border-[#00A859] focus:ring-4 focus:ring-[#39D98A]/10"
                    >
                      {technicalSectors.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="relative">
                    <LockKeyhole size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="password"
                      placeholder="Digite seu PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleLogin() }}
                      className="h-[52px] rounded-full border-slate-200 bg-white pl-12 pr-5 text-sm text-slate-900 shadow-[0_8px_25px_rgba(15,23,42,0.04)] placeholder:text-slate-400 focus:border-[#00A859] focus:ring-[#39D98A]/10"
                    />
                  </div>

                  <Button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="mt-3 h-[52px] w-full rounded-full bg-gradient-to-r from-[#073B2A] via-[#00A859] to-[#073B2A] font-bold !text-white shadow-[0_18px_45px_rgba(0,168,89,0.28)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
                  >
                    {isLoading ? "Validando..." : "Entrar no painel"}
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </div>

                <div className="mt-8 text-center">
                  <p className="text-xs leading-5 text-slate-400">Acesso restrito para equipes autorizadas.</p>
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-400">É funcionário?</p>
                    <button onClick={() => navigate("/portal")} className="mt-2 text-sm font-bold text-[#00A859] transition hover:underline">
                      Acessar portal do funcionário →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
