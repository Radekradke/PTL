import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { sectorCredentials } from "@/lib/auth"

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
      JSON.stringify({
        sector,
        type: "technical",
      })
    )

    navigate("/dashboard")
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(57,217,138,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(16,42,67,0.16),transparent_34%),#EAF0ED] p-4 text-[#111827]">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2.25rem] border border-white/70 bg-white/75 shadow-[0_30px_100px_rgba(16,42,67,0.22)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
          <section className="ls-metal-panel relative hidden min-h-[620px] overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#39D98A]/25 blur-[90px]" />
              <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#00A859]/20 blur-[110px]" />
            </div>

            <div className="relative">
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#39D98A] backdrop-blur-md">
                Lifting Support
              </div>

              <h1 className="mt-8 max-w-md text-6xl font-black leading-[0.95] tracking-[-0.07em]">
                Painel técnico moderno.
              </h1>

              <p className="mt-6 max-w-md text-base leading-7 text-white/76">
                Controle chamados, acompanhe indicadores e mantenha a operação fluindo com clareza.
              </p>
            </div>

            <div className="relative grid grid-cols-3 gap-3">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-xs text-white/60">Acesso</p>
                <p className="mt-1 text-lg font-black">Seguro</p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-xs text-white/60">Fila</p>
                <p className="mt-1 text-lg font-black">Rápida</p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-xs text-white/60">Dados</p>
                <p className="mt-1 text-lg font-black">Claros</p>
              </div>
            </div>
          </section>

          <section className="flex min-h-[620px] items-center justify-center p-5 sm:p-10">
            <Card className="w-full max-w-md border-0 bg-transparent shadow-none">
              <CardContent className="space-y-8 p-0">
                <div className="space-y-3 text-center lg:text-left">
                  <div className="inline-flex rounded-full border border-[#DDE8E2] bg-[#ECFBF3] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#073B2A]">
                    Painel Técnico
                  </div>
                  <h1 className="text-4xl font-black tracking-[-0.055em] text-[#111827]">
                    Acessar sistema
                  </h1>
                  <p className="text-[#64748B]">
                    Acesso restrito para Admin, TI e Diretoria.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#102A43]">Perfil de acesso</label>
                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-[#DDE8E2] bg-white px-4 text-[#111827] shadow-sm outline-none focus:border-[#00A859] focus:ring-4 focus:ring-[#00A859]/10"
                    >
                      {technicalSectors.map((sector) => (
                        <option key={sector} value={sector}>
                          {sector}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#102A43]">PIN</label>
                    <Input
                      type="password"
                      placeholder="Digite o PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleLogin()
                      }}
                      className="h-12 rounded-2xl border-[#DDE8E2] bg-white px-4 text-[#111827] shadow-sm focus:border-[#00A859] focus:ring-[#00A859]/10"
                    />
                  </div>

                  <Button
                    className="h-12 w-full rounded-2xl bg-gradient-to-br from-[#00A859] to-[#073B2A] font-black text-white shadow-[0_18px_44px_rgba(0,168,89,0.24)] hover:brightness-105"
                    onClick={handleLogin}
                  >
                    Entrar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
