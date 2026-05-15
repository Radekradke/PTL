import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { sectorCredentials } from "@/lib/auth"
import { ShieldCheck } from "lucide-react"

const technicalSectors = ["Admin", "TI", "Diretoria"]

export function Login() {
  const navigate = useNavigate()
  const [sector, setSector] = useState("Admin")
  const [pin, setPin] = useState("")

  function handleLogin() {
    const correctPin = sectorCredentials[sector as keyof typeof sectorCredentials]

    if (pin !== correctPin) {
      alert("PIN inválido")
      return
    }

    localStorage.setItem(
      "lifting-user",
      JSON.stringify({ sector, type: "technical" })
    )

    navigate("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(47,168,102,0.16),transparent_34%),linear-gradient(135deg,#f6f8f6,#edf6f0)] p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.14)] lg:grid-cols-[1fr_420px]">
        <div className="hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
              <ShieldCheck size={28} />
            </div>
            <h1 className="mt-8 text-4xl font-black tracking-[-0.05em]">Lifting Support</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-emerald-50/80">
              Plataforma interna para gerenciar chamados, atendimento técnico e relatórios operacionais.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
              <p className="text-xs text-emerald-50/70">Admin</p>
              <p className="mt-1 font-bold">Manutenção do site</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
              <p className="text-xs text-emerald-50/70">TI</p>
              <p className="mt-1 font-bold">Operação</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
              <p className="text-xs text-emerald-50/70">Diretoria</p>
              <p className="mt-1 font-bold">Visão estratégica</p>
            </div>
          </div>
        </div>

        <Card className="border-0 bg-white shadow-none">
          <CardContent className="space-y-7 p-6 sm:p-8 lg:p-10">
            <div>
              <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                Painel técnico
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">Acessar sistema</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Entre com o perfil autorizado e PIN de acesso.</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Perfil</label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white"
                >
                  {technicalSectors.map((sector) => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">PIN</label>
                <Input
                  type="password"
                  placeholder="Digite o PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleLogin()
                  }}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-slate-900 focus-visible:border-emerald-400"
                />
              </div>

              <Button
                className="h-12 w-full rounded-2xl bg-emerald-600 font-bold text-white shadow-sm transition hover:bg-emerald-700"
                onClick={handleLogin}
              >
                Entrar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
