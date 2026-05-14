import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  BarChart3,
  Building2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { sectorCredentials } from "@/lib/auth"

const technicalSectors = ["Admin", "TI", "Diretoria"]

const profileDescriptions: Record<string, string> = {
  Admin: "Acesso completo ao sistema, configurações, chamados e relatórios.",
  TI: "Acesso operacional para acompanhar, responder e finalizar chamados.",
  Diretoria: "Acesso executivo para dashboard e relatórios gerenciais.",
}

export function Login() {
  const navigate = useNavigate()
  const [sector, setSector] = useState("Admin")
  const [pin, setPin] = useState("")

  function handleLogin() {
    const correctPin =
      sectorCredentials[sector as keyof typeof sectorCredentials]

    if (pin !== correctPin) {
      alert("PIN inválido")
      return
    }

    localStorage.setItem(
      "lifting-user",
      JSON.stringify({
        sector,
        type: "technical",
      })
    )

    navigate("/dashboard")
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.14),transparent_30%),#0f172a] p-4 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative z-10 grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_460px] lg:items-center">
        <section className="hidden rounded-[2.5rem] border border-zinc-800 bg-zinc-950/70 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.45)] backdrop-blur lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-300">
            <Sparkles size={16} />
            Lifting Support
          </div>

          <h1 className="mt-8 max-w-2xl text-5xl font-black tracking-[-0.06em] text-white">
            Painel técnico para atendimento interno.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">
            Acompanhe chamados, visualize indicadores e mantenha o suporte organizado com acesso segmentado por perfil.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[2rem] border border-sky-500/20 bg-sky-500/10 p-5">
              <ShieldCheck className="text-sky-300" />
              <p className="mt-4 text-sm font-bold text-white">Acesso seguro</p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">Perfis separados para Admin, TI e Diretoria.</p>
            </div>

            <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-5">
              <BarChart3 className="text-emerald-300" />
              <p className="mt-4 text-sm font-bold text-white">Visão gerencial</p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">Dashboard e relatórios para decisão rápida.</p>
            </div>

            <div className="rounded-[2rem] border border-violet-500/20 bg-violet-500/10 p-5">
              <Building2 className="text-violet-300" />
              <p className="mt-4 text-sm font-bold text-white">Operação limpa</p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">Chamados centralizados sem ruído visual.</p>
            </div>
          </div>
        </section>

        <Card className="w-full rounded-[2.5rem] border border-zinc-800 bg-zinc-950/95 shadow-[0_30px_90px_rgba(15,23,42,0.55)] backdrop-blur">
          <CardContent className="space-y-8 p-8 sm:p-10">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-sky-500/20 bg-sky-500/10 text-sky-300 shadow-lg shadow-sky-950/30">
                <LockKeyhole size={28} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-300">
                  Painel Técnico
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white">
                  Acessar sistema
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Acesso restrito para perfis autorizados. Selecione o perfil e informe o PIN.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Perfil selecionado
              </p>
              <p className="mt-2 text-lg font-bold text-white">{sector}</p>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                {profileDescriptions[sector]}
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-300">Perfil de acesso</label>
                <select
                  value={sector}
                  onChange={(e) => {
                    setSector(e.target.value)
                    setPin("")
                  }}
                  className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-zinc-100 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                >
                  {technicalSectors.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-300">PIN</label>
                <Input
                  type="password"
                  placeholder="Digite o PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleLogin()
                    }
                  }}
                  className="h-12 rounded-2xl border-zinc-800 bg-zinc-900 px-4 text-white placeholder:text-zinc-600 focus-visible:border-sky-500 focus-visible:ring-sky-500/20"
                />
              </div>

              <Button
                className="h-12 w-full rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-600 to-cyan-700 font-bold text-white shadow-lg shadow-sky-950/30 transition hover:-translate-y-0.5 hover:from-sky-500 hover:to-cyan-600"
                onClick={handleLogin}
              >
                Entrar no painel
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
