import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/services/api"

type Sector = { id: number; name: string; pin?: string }

type Employee = {
  id: number
  name: string
  username?: string | null
  password?: string
  sectorId: number
  sector: { id: number; name: string }
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
  const [isAddingSector, setIsAddingSector] = useState(false)

  async function loadData() {
    const sectorsResponse = await apiFetch("/sectors")
    const employeesResponse = await apiFetch("/employees")
    const sectorsData = await sectorsResponse.json()
    const employeesData = await employeesResponse.json()
    setSectors(sectorsData)
    setEmployees(employeesData.map((employee: Employee) => ({ ...employee, password: "" })))
    if (sectorsData.length > 0 && !newEmployeeSectorId) setNewEmployeeSectorId(String(sectorsData[0].id))
  }

  useEffect(() => { loadData() }, [])

  async function addSector() {
    const sectorName = newSectorName.trim()
    const sectorPin = newSectorPin.trim()

    if (!sectorName) { alert("Preencha o nome do setor."); return }
    if (!/^\d{4,8}$/.test(sectorPin)) { alert("PIN deve conter de 4 a 8 números."); return }

    setIsAddingSector(true)

    try {
      const response = await apiFetch("/sectors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: sectorName, pin: sectorPin }) })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        console.error("Erro ao criar setor:", response.status, data)
        alert(data?.message || `Erro ao criar setor. Código ${response.status}.`)
        return
      }

      setNewSectorName("")
      setNewSectorPin("")
      await loadData()
    } finally {
      setIsAddingSector(false)
    }
  }

  async function updateSector(sector: Sector) {
    const sectorName = sector.name.trim()
    const sectorPin = String(sector.pin || "").trim()

    if (!/^\d{4,8}$/.test(sectorPin)) { alert("PIN deve conter de 4 a 8 números."); return }

    const response = await apiFetch(`/sectors/${sector.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: sectorName, pin: sectorPin }) })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      alert(data?.message || "Erro ao salvar setor.")
      return
    }
    loadData()
  }

  async function removeSector(id: number) {
    const hasEmployees = employees.some((employee) => employee.sectorId === id)
    if (hasEmployees) { alert("Esse setor possui funcionários vinculados. Remaneje ou desative os funcionários antes."); return }
    if (!window.confirm("Excluir este setor?")) return
    await apiFetch(`/sectors/${id}`, { method: "DELETE" })
    loadData()
  }

  async function addEmployee() {
    if (!newEmployeeName || !newEmployeeSectorId || !newEmployeeUsername || !newEmployeePassword) {
      alert("Preencha nome, usuário, senha e setor do funcionário.")
      return
    }
    const response = await apiFetch("/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newEmployeeName, username: newEmployeeUsername, password: newEmployeePassword, sectorId: Number(newEmployeeSectorId) }) })
    if (!response.ok) { alert("Erro ao criar funcionário. Verifique se o usuário já existe."); return }
    setNewEmployeeName(""); setNewEmployeeUsername(""); setNewEmployeePassword(""); loadData()
  }

  async function updateEmployee(employee: Employee) {
    if (!employee.name || !employee.sectorId || !employee.username) { alert("Nome, usuário e setor são obrigatórios."); return }
    const response = await apiFetch(`/employees/${employee.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: employee.name, username: employee.username, password: employee.password || undefined, sectorId: employee.sectorId }) })
    if (!response.ok) { alert("Erro ao salvar funcionário. Verifique se o usuário já existe."); return }
    loadData()
  }

  async function removeEmployee(id: number) {
    if (!window.confirm("Desativar este funcionário? Os chamados associados serão preservados.")) return
    const response = await apiFetch(`/employees/${id}`, { method: "DELETE" })
    if (!response.ok) { alert("Erro ao excluir funcionário."); return }
    loadData()
  }

  function updateSectorState(id: number, field: "name" | "pin", value: string) {
    setSectors(sectors.map((sector) => sector.id === id ? { ...sector, [field]: value } : sector))
  }

  function updateEmployeeState(id: number, field: "name" | "sectorId" | "username" | "password", value: string) {
    setEmployees(employees.map((employee) => employee.id === id ? { ...employee, [field]: field === "sectorId" ? Number(value) : value } : employee))
  }

  return (
    <AppLayout>
      <div className="ls-page-shell py-2">
        <section className="ls-hero-clean p-6 sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#00A859]">Administração</p>
              <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] text-[#111827] sm:text-5xl">Configurações</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B] sm:text-base">
                Cadastre setores e funcionários. Esses dados são a base do portal e dos chamados.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-[#DDE8E2] bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Setores</p><p className="mt-1 text-2xl font-black text-[#073B2A]">{sectors.length}</p></div>
              <div className="rounded-3xl border border-[#DDE8E2] bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Funcionários</p><p className="mt-1 text-2xl font-black text-[#00A859]">{employees.length}</p></div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="ls-card p-5 sm:p-6">
            <div className="mb-5"><h2 className="ls-section-title text-2xl">Setores</h2><p className="mt-1 text-sm text-slate-500">Controle os setores usados no painel e portal.</p></div>
            <div className="grid gap-3 sm:grid-cols-[1fr_10rem_auto]"><Input placeholder="Nome do setor" value={newSectorName} onChange={(e) => setNewSectorName(e.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addSector() }} className="ls-input" /><Input inputMode="numeric" placeholder="PIN" value={newSectorPin} onChange={(e) => setNewSectorPin(e.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addSector() }} className="ls-input" /><Button className="ls-button-primary h-11 font-black" onClick={addSector} disabled={isAddingSector}>{isAddingSector ? "Adicionando..." : "Adicionar"}</Button></div>
            <div className="mt-6 space-y-4">{sectors.map((sector) => <div key={sector.id} className="rounded-3xl border border-[#DDE8E2] bg-white p-4 shadow-sm"><div className="grid gap-3 sm:grid-cols-[1fr_10rem]"><Input value={sector.name} onChange={(e) => updateSectorState(sector.id, "name", e.target.value)} className="ls-input" /><Input inputMode="numeric" placeholder="PIN" value={sector.pin || ""} onChange={(e) => updateSectorState(sector.id, "pin", e.target.value)} className="ls-input" /></div><div className="mt-4 flex flex-wrap justify-end gap-3"><Button size="sm" className="ls-button-primary rounded-2xl px-4" onClick={() => updateSector(sector)}>Salvar</Button><Button variant="destructive" size="sm" className="rounded-2xl" onClick={() => removeSector(sector.id)}>Excluir</Button></div></div>)}</div>
          </section>

          <section className="ls-card p-5 sm:p-6">
            <div className="mb-5"><h2 className="ls-section-title text-2xl">Funcionários</h2><p className="mt-1 text-sm text-slate-500">Usuário, senha e setor definem o acesso ao portal.</p></div>
            <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto]"><Input placeholder="Nome" value={newEmployeeName} onChange={(e) => setNewEmployeeName(e.target.value)} className="ls-input" /><Input placeholder="Usuário" value={newEmployeeUsername} onChange={(e) => setNewEmployeeUsername(e.target.value)} className="ls-input" /><Input type="password" placeholder="Senha" value={newEmployeePassword} onChange={(e) => setNewEmployeePassword(e.target.value)} className="ls-input" /><select value={newEmployeeSectorId} onChange={(e) => setNewEmployeeSectorId(e.target.value)} className="ls-input">{sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}</select><Button className="ls-button-primary h-11 font-black" onClick={addEmployee}>Adicionar</Button></div>
            <div className="mt-6 space-y-4">{employees.map((employee) => <div key={employee.id} className="rounded-3xl border border-[#DDE8E2] bg-white p-4 shadow-sm"><div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black text-[#111827]">{employee.name}</p><p className="text-xs text-slate-500">Usuário: {employee.username || "não configurado"}</p></div><span className="w-fit rounded-full bg-[#ECFBF3] px-3 py-1 text-xs font-black text-[#073B2A]">{sectors.find((sector) => sector.id === employee.sectorId)?.name || employee.sector?.name || "Sem setor"}</span></div><div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr_1fr]"><Input value={employee.name} onChange={(e) => updateEmployeeState(employee.id, "name", e.target.value)} className="ls-input" /><Input value={employee.username || ""} onChange={(e) => updateEmployeeState(employee.id, "username", e.target.value)} placeholder="usuário" className="ls-input" /><Input type="password" value={employee.password || ""} onChange={(e) => updateEmployeeState(employee.id, "password", e.target.value)} placeholder="Nova senha opcional" className="ls-input" /><select value={employee.sectorId} onChange={(e) => updateEmployeeState(employee.id, "sectorId", e.target.value)} className="ls-input">{sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}</select></div><div className="mt-4 flex flex-wrap justify-end gap-3"><Button size="sm" className="ls-button-primary rounded-2xl px-4" onClick={() => updateEmployee(employee)}>Salvar</Button><Button variant="destructive" size="sm" className="rounded-2xl" onClick={() => removeEmployee(employee.id)}>Excluir</Button></div></div>)}</div>
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
