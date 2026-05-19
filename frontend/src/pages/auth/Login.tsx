import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LockKeyhole, ShieldCheck, UserRound, ArrowRight } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { API_URL, AUTH_CHANGED_EVENT, TECHNICAL_USER_KEY } from "@/services/api"

const technicalSectors = ["Admin", "TI", "Diretoria"]

export function Login() {
  const navigate = useNavigate()
  const [sector, setSector] = useState("Admin")
  const [pin, setPin] = useState("")

  async function handleLogin() {
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
        return
      }

      const data = await response.json()

      localStorage.setItem(
        TECHNICAL_USER_KEY,
        JSON.stringify({
          ...data.user,
          token: data.token,
        })
      )

      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
      navigate("/dashboard")
    } catch (error) {
      console.error("Erro ao acessar painel:", error)
      alert("Erro ao acessar painel.")
    }
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

        <section className="flex min-h-[620px] items-center justify-center bg-white px-6 py-10 sm:px-12">
  <div className="w-full max-w-[360px]">
    <div className="mb-9 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00A859]/10 text-[#00A859] ring-1 ring-[#00A859]/20">
        <LockKeyhole size={24} />
      </div>

      <h2 className="text-4xl font-black tracking-[-0.06em] text-[#111827]">
        Entrar
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-500">
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
          {technicalSectors.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
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
        className="mt-3 h-[52px] w-full rounded-full bg-gradient-to-r from-[#073B2A] via-[#00A859] to-[#073B2A] font-bold text-white shadow-[0_18px_45px_rgba(0,168,89,0.28)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
        onClick={handleLogin}
      >
        Entrar no painel
        <ArrowRight
          size={18}
          className="ml-2"
        />
      </Button>
    </div>

    <div className="mt-8 text-center">
      <p className="text-xs leading-5 text-slate-400">
        Acesso restrito para equipes autorizadas.
      </p>
    </div>
  </div>
</section>
      </div>
    </div>
  )
}
