import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LockKeyhole, ShieldCheck, UserRound, ArrowRight } from "lucide-react"

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
              Technical Support para acompanhamento, resposta e gestão de chamados internos.
            </p>
          </div>

          <div className="relative space-y-3">
            <div className="rounded-3xl border border-white/14 bg-white/10 p-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-[#39D98A]" size={22} />
                <div>
                  <p className="text-sm font-bold text-white">
                    Acesso restrito
                  </p>
                  <p className="text-xs text-emerald-50/65">
                    Admin, TI e Diretoria
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/14 bg-white/10 p-4 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.18em] text-[#39D98A]">
                Lifting Support
              </p>
              <p className="mt-1 text-sm text-emerald-50/70">
                Operação, relatórios e atendimento em um só lugar.
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-[620px] items-center justify-center bg-white p-6 sm:p-10">
          <Card className="w-full max-w-md border-0 bg-transparent shadow-none">
            <CardContent className="space-y-8 p-0">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#00A859]/20 bg-[#00A859]/8 px-4 py-2 text-sm font-bold text-[#073B2A]">
                  <LockKeyhole size={16} />
                  Ambiente seguro
                </div>

                <div>
                  <h2 className="text-4xl font-black tracking-[-0.05em] text-[#111827]">
                    Entrar no painel
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Acesse chamados, relatórios e gestão técnica.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Perfil de acesso
                  </label>

                  <div className="relative">
                    <UserRound
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="h-12 w-full appearance-none rounded-2xl border border-[#D7E3DC] bg-white pl-11 pr-4 text-sm font-semibold text-slate-900 shadow-[0_2px_10px_rgba(7,59,42,0.04)] outline-none transition hover:border-[#00A859]/40 focus:border-[#00A859] focus:ring-4 focus:ring-[#39D98A]/10"
                    >
                      {technicalSectors.map((sector) => (
                        <option key={sector} value={sector}>
                          {sector}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    PIN
                  </label>

                  <Input
                    type="password"
                    placeholder="Digite seu PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleLogin()
                    }}
                    className="h-12 rounded-2xl border-[#D7E3DC] bg-white px-4 text-slate-900 shadow-[0_2px_10px_rgba(7,59,42,0.04)] placeholder:text-slate-400 focus:border-[#00A859] focus:ring-[#39D98A]/10"
                  />
                </div>

                <Button
                  className="group h-12 w-full rounded-2xl bg-gradient-to-r from-[#00A859] to-[#07864A] font-bold text-white shadow-[0_16px_40px_rgba(0,168,89,0.24)] transition hover:-translate-y-0.5 hover:from-[#08B864] hover:to-[#067A43] active:translate-y-0"
                  onClick={handleLogin}
                >
                  Entrar no painel
                  <ArrowRight
                    size={18}
                    className="ml-2 transition group-hover:translate-x-0.5"
                  />
                </Button>
              </div>

              <div className="rounded-2xl border border-[#D7E3DC] bg-[#F8FAF9] p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 text-[#00A859]" size={18} />
                  <div>
                    <p className="text-sm font-bold text-[#111827]">
                      Acesso protegido
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Uso exclusivo para usuários autorizados do painel técnico.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}