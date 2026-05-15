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

    localStorage.setItem("lifting-user", JSON.stringify({ sector, type: "technical" }))
    navigate("/dashboard")
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),transparent_30%),#0f172a] flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-[0_25px_80px_rgba(15,23,42,0.45)]">
        <CardContent className="p-8 space-y-8">
          <div className="space-y-3 text-center">
            <div className="inline-flex rounded-full bg-sky-600/10 px-4 py-2 text-sm font-medium text-sky-300">Painel Técnico</div>
            <h1 className="text-4xl font-bold text-white">Acessar sistema</h1>
            <p className="text-zinc-400">Acesso restrito para Admin, TI e Diretoria.</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Perfil de acesso</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-200 shadow-sm"
              >
                {technicalSectors.map((sector) => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">PIN</label>
              <Input
                type="password"
                placeholder="Digite o PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="rounded-2xl bg-zinc-900 border-zinc-800 text-white px-4 py-3"
              />
            </div>

            <Button className="w-full rounded-[1.75rem] bg-sky-600 text-white shadow-lg shadow-sky-500/20 hover:bg-sky-500" onClick={handleLogin}>
              Entrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
