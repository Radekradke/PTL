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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(66,169,94,0.20),transparent_35%),linear-gradient(180deg,#DFF5E6_0%,#F2F2F2_48%,#F7FAF8_100%)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-[2rem] border border-[#B4D7C4]/60 bg-white shadow-[0_24px_70px_rgba(50,98,74,0.14)]">
        <CardContent className="p-8 space-y-8">
          <div className="space-y-3 text-center">
            <div className="inline-flex rounded-full bg-[#42A95E]/10 px-4 py-2 text-sm font-medium text-[#32624A]">
              Painel Técnico
            </div>
            <h1 className="text-4xl font-bold text-[#2B2B2B]">Acessar sistema</h1>
            <p className="text-[#66736B]">
              Acesso técnico autorizado.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-[#66736B]">Perfil de acesso</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full rounded-2xl border border-[#B4D7C4]/60 bg-[#F8FBF9] px-4 py-3 text-[#2B2B2B] shadow-sm"
              >
                {technicalSectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[#66736B]">PIN</label>
              <Input
                type="password"
                placeholder="Digite o PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="rounded-2xl bg-[#F8FBF9] border-[#B4D7C4]/60 text-[#2B2B2B] px-4 py-3"
              />
            </div>

            <Button
              className="w-full rounded-[1.75rem] bg-[#42A95E] text-white shadow-lg shadow-[#42A95E]/20 hover:bg-[#2F8B4C]"
              onClick={handleLogin}
            >
              Entrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}