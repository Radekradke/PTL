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
} from "lucide-react"
import logoLifting from "../../assets/logo-lifting-icon-dark-bg.png"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { API_URL, AUTH_CHANGED_EVENT, TECHNICAL_USER_KEY } from "@/services/api"

const technicalSectors = ["Admin", "TI", "RH", "Infraestrutura"]

type DepartmentOption = {
  id: string
  label: string
  description: string
  icon: React.ElementType
  color: string
  bg: string
  border: string
}

const departmentOptions: DepartmentOption[] = [
  {
    id: "TI",
    label: "Setor TI",
    description: "Suporte técnico, sistemas e infraestrutura de TI",
    icon: Monitor,
    color: "#0EA5E9",
    bg: "#F0F9FF",
    border: "#BAE6FD",
  },
  {
    id: "RH",
    label: "Setor RH",
    description: "Recursos humanos, benefícios e gestão de pessoas",
    icon: Users,
    color: "#8B5CF6",
    bg: "#F5F3FF",
    border: "#DDD6FE",
  },
  {
    id: "IN",
    label: "Setor IN",
    description: "Infraestrutura, instalações e manutenção predial",
    icon: Building2,
    color: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
]

export function Login() {
  const navigate = useNavigate()
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [sector, setSector] = useState("Admin")
  const [pin, setPin] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin() {
    if (isLoading) return

    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/technical`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sector,
          pin,
        }),
      })

      if (!response.ok) {
        alert("PIN inválido")
        setIsLoading(false)
        return
      }

      const data = await response.json()

      localStorage.setItem(
        TECHNICAL_USER_KEY,
        JSON.stringify({
          ...data.user,
          token: data.token,
          department: selectedDept,
        })
      )

      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
      navigate("/dashboard")
    } catch (error) {
      console.error("Erro ao acessar painel:", error)
      alert("Erro ao acessar painel.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EAF0ED] px-4 py-8 text-[#111827]">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_28px_90px_rgba(7,59,42,0.16)] lg:grid-cols-[1.05fr_0.95fr]">

        {/* Left panel */}
        <section className="relative hidden min-h-[620px] overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(57,217,138,0.28),transparent_32%),linear-gradient(135deg,#073B2A,#102A43)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#39D98A]/20 blur-[90px]" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#00A859]/20 blur-[100px]" />

          <div className="relative">
            <img
              src={logoLifting}
              alt="Lifting Electric"
              className="h-20 w-auto object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.28)]"
            />
            <h1 className="mt-3 max-w-sm text-sm leading-6 text-emerald-50/80">
              <br /> Lifting
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-emerald-50/80">
              <br />Technical Support para acompanhamento, resposta e gestão de chamados internos.
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
              <p className="mt-1 text-sm text-emerald-50/70">
                Operação, relatórios e atendimento em um só lugar.
              </p>
            </div>
          </div>
        </section>

        {/* Right panel */}
        <section className="flex min-h-[620px] items-center justify-center bg-white px-6 py-10 sm:px-12">
          <div className="w-full max-w-[360px]">

            {/* Step 1: Department selection */}
            {!selectedDept ? (
              <>
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00A859]/10 text-[#00A859] ring-1 ring-[#00A859]/20">
                    <Building2 size={24} />
                  </div>
                  <h2 className="text-3xl font-black tracking-[-0.05em] text-[#111827]">
                    Selecione o setor
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Escolha o setor para continuar o acesso ao painel.
                  </p>
                </div>

                <div className="space-y-3">
                  {departmentOptions.map((dept) => {
                    const Icon = dept.icon
                    return (
                      <button
                        key={dept.id}
                        onClick={() => setSelectedDept(dept.id)}
                        className="group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
                        style={{
                          borderColor: dept.border,
                          backgroundColor: dept.bg,
                        }}
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                          style={{ background: `${dept.color}18`, color: dept.color }}
                        >
                          <Icon size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-[#111827]">{dept.label}</p>
                          <p className="mt-0.5 text-xs font-medium leading-4 text-slate-500">
                            {dept.description}
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          className="shrink-0 text-slate-400 transition group-hover:text-slate-600"
                        />
                      </button>
                    )
                  })}
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                  <p className="text-xs text-slate-400">É funcionário?</p>
                  <button
                    onClick={() => navigate("/portal")}
                    className="mt-2 text-sm font-bold text-[#00A859] transition hover:underline"
                  >
                    Acessar portal do funcionário →
                  </button>
                </div>
              </>
            ) : (
              /* Step 2: Login form */
              <>
                <div className="mb-2">
                  <button
                    onClick={() => { setSelectedDept(null); setPin("") }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-slate-600"
                  >
                    ← Voltar à seleção de setor
                  </button>
                </div>

                <div className="mb-9 text-center">
                  {(() => {
                    const dept = departmentOptions.find((d) => d.id === selectedDept)!
                    const Icon = dept.icon
                    return (
                      <div
                        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ring-1"
                        style={{
                          background: dept.bg,
                          color: dept.color,
                        }}
                      >
                        <Icon size={24} />
                      </div>
                    )
                  })()}
                  <p
                    className="text-xs font-black uppercase tracking-[0.16em]"
                    style={{
                      color: departmentOptions.find((d) => d.id === selectedDept)?.color,
                    }}
                  >
                    {departmentOptions.find((d) => d.id === selectedDept)?.label}
                  </p>
                  <h2 className="mt-1 text-4xl font-black tracking-[-0.06em] text-[#111827]">
                    Entrar
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Acesse o painel técnico com seu perfil autorizado.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <UserRound
                      size={18}
                      className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="h-[52px] w-full appearance-none rounded-full border border-slate-200 bg-white pl-12 pr-5 text-sm font-semibold text-slate-800 shadow-[0_8px_25px_rgba(15,23,42,0.04)] outline-none transition hover:border-[#00A859]/40 focus:border-[#00A859] focus:ring-4 focus:ring-[#39D98A]/10"
                    >
                      {technicalSectors.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                      type="password"
                      placeholder="Digite seu PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleLogin()
                      }}
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
                  <p className="text-xs leading-5 text-slate-400">
                    Acesso restrito para equipes autorizadas.
                  </p>
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-400">É funcionário?</p>
                    <button
                      onClick={() => navigate("/portal")}
                      className="mt-2 text-sm font-bold text-[#00A859] transition hover:underline"
                    >
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
