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
      <div className="max-w-7xl mx-auto w-full space-y-8 py-6">
        <div className="ls-hero-blue rounded-[2rem] p-6 sm:p-8">
          <div className="ls-hero-content flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.04em] text-white">Configurações</h1>
              <p className="mt-2 max-w-2xl text-slate-300">
                Cadastre funcionários com usuário, senha e setor correto. Esses dados serão usados no portal e nos chamados.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Setores disponíveis</p>
                <p className="text-2xl font-semibold text-slate-950">{sectors.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Funcionários cadastrados</p>
                <p className="text-2xl font-semibold text-slate-950">{employees.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-950">Setores</h2>
              <p className="mt-2 text-sm text-slate-500">
                O PIN ainda pode ser usado para controle interno, mas o portal do funcionário passa a usar usuário e senha individual.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                placeholder="Nome do setor"
                value={newSectorName}
                onChange={(e) => setNewSectorName(e.target.value)}
                className="bg-white border-slate-200 text-slate-950"
              />
              <Input
                placeholder="PIN"
                value={newSectorPin}
                onChange={(e) => setNewSectorPin(e.target.value)}
                className="bg-white border-slate-200 text-slate-950"
              />
              <Button className="w-full rounded-[1.5rem] bg-blue-600 text-slate-950 hover:bg-blue-700" onClick={addSector}>
                Adicionar
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              {sectors.map((sector) => (
                <div key={sector.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
                    <Input
                      value={sector.name}
                      onChange={(e) => updateSectorState(sector.id, "name", e.target.value)}
                      className="bg-white border-slate-200 text-slate-950"
                    />
                    <Input
                      value={sector.pin}
                      onChange={(e) => updateSectorState(sector.id, "pin", e.target.value)}
                      className="bg-white border-slate-200 text-slate-950"
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 justify-end">
                    <Button size="sm" className="rounded-[1.25rem]" onClick={() => updateSector(sector)}>
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

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-950">Funcionários</h2>
              <p className="mt-2 text-sm text-slate-500">
                O setor do funcionário define automaticamente onde o chamado será registrado. Capricha aqui, porque agora esse cadastro manda em tudo.
              </p>
            </div>

            <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
              <Input
                placeholder="Nome do funcionário"
                value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                className="bg-white border-slate-200 text-slate-950"
              />
              <Input
                placeholder="Usuário de acesso"
                value={newEmployeeUsername}
                onChange={(e) => setNewEmployeeUsername(e.target.value)}
                className="bg-white border-slate-200 text-slate-950"
              />
              <Input
                type="password"
                placeholder="Senha inicial"
                value={newEmployeePassword}
                onChange={(e) => setNewEmployeePassword(e.target.value)}
                className="bg-white border-slate-200 text-slate-950"
              />
              <select
                value={newEmployeeSectorId}
                onChange={(e) => setNewEmployeeSectorId(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 shadow-sm"
              >
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </select>
              <Button className="w-full rounded-[1.5rem] bg-blue-600 text-slate-950 hover:bg-blue-700" onClick={addEmployee}>
                Adicionar
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              {employees.map((employee) => (
                <div key={employee.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{employee.name}</p>
                      <p className="text-xs text-slate-500">Usuário: {employee.username || "não configurado"}</p>
                    </div>
                    <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {sectors.find((sector) => sector.id === employee.sectorId)?.name || employee.sector?.name || "Sem setor"}
                    </span>
                  </div>

                  <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr_1fr]">
                    <Input
                      value={employee.name}
                      onChange={(e) => updateEmployeeState(employee.id, "name", e.target.value)}
                      className="bg-white border-slate-200 text-slate-950"
                    />
                    <Input
                      value={employee.username || ""}
                      onChange={(e) => updateEmployeeState(employee.id, "username", e.target.value)}
                      placeholder="usuário"
                      className="bg-white border-slate-200 text-slate-950"
                    />
                    <Input
                      type="password"
                      value={employee.password || ""}
                      onChange={(e) => updateEmployeeState(employee.id, "password", e.target.value)}
                      placeholder="Nova senha opcional"
                      className="bg-white border-slate-200 text-slate-950"
                    />
                    <select
                      value={employee.sectorId}
                      onChange={(e) => updateEmployeeState(employee.id, "sectorId", e.target.value)}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm"
                    >
                      {sectors.map((sector) => (
                        <option key={sector.id} value={sector.id}>
                          {sector.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 justify-end">
                    <Button size="sm" className="rounded-[1.25rem]" onClick={() => updateEmployee(employee)}>
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
