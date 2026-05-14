import { useEffect, useState } from "react"

import { AppLayout } from "@/components/layout/AppLayout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { API_URL } from "@/services/api"

type Sector = {
  id: number
  name: string
  pin: string
}

type Employee = {
  id: number
  name: string
  username?: string | null
  password?: string
  sectorId: number
  sector: {
    id: number
    name: string
    pin: string
  }
}

export function SettingsPage() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  const [newSectorName, setNewSectorName] = useState("")
  const [newSectorPin, setNewSectorPin] = useState("")

  const [newEmployeeName, setNewEmployeeName] = useState("")
  const [newEmployeeUsername, setNewEmployeeUsername] = useState("")
  const [newEmployeePassword, setNewEmployeePassword] = useState("")
  const [newEmployeeSectorId, setNewEmployeeSectorId] = useState("")

  async function loadData() {
    const sectorsResponse = await fetch(`${API_URL}/sectors`)
    const employeesResponse = await fetch(`${API_URL}/employees`)

    const sectorsData = await sectorsResponse.json()
    const employeesData = await employeesResponse.json()

    setSectors(sectorsData)
    setEmployees(employeesData.map((employee: Employee) => ({ ...employee, password: "" })))

    if (sectorsData.length > 0 && !newEmployeeSectorId) {
      setNewEmployeeSectorId(String(sectorsData[0].id))
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function addSector() {
    if (!newSectorName || !newSectorPin) {
      alert("Preencha o nome do setor e o PIN.")
      return
    }

    await fetch(`${API_URL}/sectors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newSectorName,
        pin: newSectorPin,
      }),
    })

    setNewSectorName("")
    setNewSectorPin("")

    loadData()
  }

  async function updateSector(sector: Sector) {
    await fetch(`${API_URL}/sectors/${sector.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: sector.name,
        pin: sector.pin,
      }),
    })

    loadData()
  }

  async function removeSector(id: number) {
    const hasEmployees = employees.some((employee) => employee.sectorId === id)

    if (hasEmployees) {
      alert("Esse setor possui funcionários vinculados. Remaneje ou exclua os funcionários antes.")
      return
    }

    if (!window.confirm("Excluir este setor?")) return

    await fetch(`${API_URL}/sectors/${id}`, {
      method: "DELETE",
    })

    loadData()
  }

  async function addEmployee() {
    if (!newEmployeeName || !newEmployeeSectorId || !newEmployeeUsername || !newEmployeePassword) {
      alert("Preencha nome, usuário, senha e setor do funcionário.")
      return
    }

    const response = await fetch(`${API_URL}/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newEmployeeName,
        username: newEmployeeUsername,
        password: newEmployeePassword,
        sectorId: Number(newEmployeeSectorId),
      }),
    })

    if (!response.ok) {
      alert("Erro ao criar funcionário. Verifique se o usuário já existe.")
      return
    }

    setNewEmployeeName("")
    setNewEmployeeUsername("")
    setNewEmployeePassword("")

    loadData()
  }

  async function updateEmployee(employee: Employee) {
    if (!employee.name || !employee.sectorId || !employee.username) {
      alert("Nome, usuário e setor são obrigatórios.")
      return
    }

    const response = await fetch(`${API_URL}/employees/${employee.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: employee.name,
        username: employee.username,
        password: employee.password || undefined,
        sectorId: employee.sectorId,
      }),
    })

    if (!response.ok) {
      alert("Erro ao salvar funcionário. Verifique se o usuário já existe.")
      return
    }

    loadData()
  }

  async function removeEmployee(id: number) {
    if (!window.confirm("Excluir este funcionário? Todos os chamados associados também serão deletados.")) return

    try {
      const response = await fetch(`${API_URL}/employees/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        alert("Erro ao excluir funcionário.")
        return
      }

      loadData()
    } catch (error) {
      alert("Erro ao excluir funcionário.")
      console.error(error)
    }
  }

  function updateSectorState(id: number, field: "name" | "pin", value: string) {
    setSectors(
      sectors.map((sector) =>
        sector.id === id
          ? {
              ...sector,
              [field]: value,
            }
          : sector
      )
    )
  }

  function updateEmployeeState(
    id: number,
    field: "name" | "sectorId" | "username" | "password",
    value: string
  ) {
    setEmployees(
      employees.map((employee) =>
        employee.id === id
          ? {
              ...employee,
              [field]: field === "sectorId" ? Number(value) : value,
            }
          : employee
      )
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl space-y-8 py-6">
        <div className="relative overflow-hidden rounded-[2.25rem] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_30%),linear-gradient(135deg,#09090b,#18181b_45%,#09090b)] p-6 shadow-[0_28px_90px_rgba(15,23,42,0.42)] sm:p-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Configurações</h1>
              <p className="mt-2 max-w-2xl text-zinc-400">
                Cadastre funcionários com usuário, senha e setor correto. Esses dados serão usados no portal e nos chamados.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/70 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.22)]">
                <p className="text-sm text-zinc-400">Setores disponíveis</p>
                <p className="text-2xl font-semibold text-white">{sectors.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/70 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.22)]">
                <p className="text-sm text-zinc-400">Funcionários cadastrados</p>
                <p className="text-2xl font-semibold text-white">{employees.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white">Setores</h2>
              <p className="mt-2 text-sm text-zinc-400">
                O PIN ainda pode ser usado para controle interno, mas o portal do funcionário passa a usar usuário e senha individual.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                placeholder="Nome do setor"
                value={newSectorName}
                onChange={(e) => setNewSectorName(e.target.value)}
                className="rounded-2xl border-zinc-800 bg-zinc-900 text-white focus-visible:border-sky-500"
              />
              <Input
                placeholder="PIN"
                value={newSectorPin}
                onChange={(e) => setNewSectorPin(e.target.value)}
                className="rounded-2xl border-zinc-800 bg-zinc-900 text-white focus-visible:border-sky-500"
              />
              <Button className="w-full rounded-[1.5rem] border border-sky-500/30 bg-gradient-to-br from-sky-600 to-cyan-700 text-white shadow-lg shadow-sky-950/25 transition hover:-translate-y-0.5 hover:from-sky-500 hover:to-cyan-600" onClick={addSector}>
                Adicionar
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              {sectors.map((sector) => (
                <div key={sector.id} className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/80 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.18)] transition hover:border-sky-500/20">
                  <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
                    <Input
                      value={sector.name}
                      onChange={(e) => updateSectorState(sector.id, "name", e.target.value)}
                      className="rounded-2xl border-zinc-800 bg-zinc-950 text-white focus-visible:border-sky-500"
                    />
                    <Input
                      value={sector.pin}
                      onChange={(e) => updateSectorState(sector.id, "pin", e.target.value)}
                      className="rounded-2xl border-zinc-800 bg-zinc-950 text-white focus-visible:border-sky-500"
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 justify-end">
                    <Button size="sm" className="rounded-[1.25rem] bg-sky-600 text-white hover:bg-sky-500" onClick={() => updateSector(sector)}>
                      Salvar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded-[1.25rem]"
                      onClick={() => removeSector(sector.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white">Funcionários</h2>
              <p className="mt-2 text-sm text-zinc-400">
                O setor do funcionário define automaticamente onde o chamado será registrado. Capricha aqui, porque agora esse cadastro manda em tudo.
              </p>
            </div>

            <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
              <Input
                placeholder="Nome do funcionário"
                value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                className="rounded-2xl border-zinc-800 bg-zinc-900 text-white focus-visible:border-sky-500"
              />
              <Input
                placeholder="Usuário de acesso"
                value={newEmployeeUsername}
                onChange={(e) => setNewEmployeeUsername(e.target.value)}
                className="rounded-2xl border-zinc-800 bg-zinc-900 text-white focus-visible:border-sky-500"
              />
              <Input
                type="password"
                placeholder="Senha inicial"
                value={newEmployeePassword}
                onChange={(e) => setNewEmployeePassword(e.target.value)}
                className="rounded-2xl border-zinc-800 bg-zinc-900 text-white focus-visible:border-sky-500"
              />
              <select
                value={newEmployeeSectorId}
                onChange={(e) => setNewEmployeeSectorId(e.target.value)}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-300 shadow-sm"
              >
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </select>
              <Button className="w-full rounded-[1.5rem] border border-sky-500/30 bg-gradient-to-br from-sky-600 to-cyan-700 text-white shadow-lg shadow-sky-950/25 transition hover:-translate-y-0.5 hover:from-sky-500 hover:to-cyan-600" onClick={addEmployee}>
                Adicionar
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              {employees.map((employee) => (
                <div key={employee.id} className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/80 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.18)] transition hover:border-sky-500/20">
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{employee.name}</p>
                      <p className="text-xs text-zinc-500">Usuário: {employee.username || "não configurado"}</p>
                    </div>
                    <span className="w-fit rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
                      {sectors.find((sector) => sector.id === employee.sectorId)?.name || employee.sector?.name || "Sem setor"}
                    </span>
                  </div>

                  <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr_1fr]">
                    <Input
                      value={employee.name}
                      onChange={(e) => updateEmployeeState(employee.id, "name", e.target.value)}
                      className="rounded-2xl border-zinc-800 bg-zinc-950 text-white focus-visible:border-sky-500"
                    />
                    <Input
                      value={employee.username || ""}
                      onChange={(e) => updateEmployeeState(employee.id, "username", e.target.value)}
                      placeholder="usuário"
                      className="rounded-2xl border-zinc-800 bg-zinc-950 text-white focus-visible:border-sky-500"
                    />
                    <Input
                      type="password"
                      value={employee.password || ""}
                      onChange={(e) => updateEmployeeState(employee.id, "password", e.target.value)}
                      placeholder="Nova senha opcional"
                      className="rounded-2xl border-zinc-800 bg-zinc-950 text-white focus-visible:border-sky-500"
                    />
                    <select
                      value={employee.sectorId}
                      onChange={(e) => updateEmployeeState(employee.id, "sectorId", e.target.value)}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-300 shadow-sm"
                    >
                      {sectors.map((sector) => (
                        <option key={sector.id} value={sector.id}>
                          {sector.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 justify-end">
                    <Button size="sm" className="rounded-[1.25rem] bg-sky-600 text-white hover:bg-sky-500" onClick={() => updateEmployee(employee)}>
                      Salvar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded-[1.25rem]"
                      onClick={() => removeEmployee(employee.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
