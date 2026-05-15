import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { API_URL } from "@/services/api"

type Sector = { id: number; name: string; pin: string }
type Employee = {
  id: number
  name: string
  username?: string | null
  password?: string
  sectorId: number
  sector: { id: number; name: string; pin: string }
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
    if (sectorsData.length > 0 && !newEmployeeSectorId) setNewEmployeeSectorId(String(sectorsData[0].id))
  }

  useEffect(() => { loadData() }, [])

  async function addSector() {
    if (!newSectorName || !newSectorPin) { alert("Preencha o nome do setor e o PIN."); return }
    await fetch(`${API_URL}/sectors`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newSectorName, pin: newSectorPin }) })
    setNewSectorName(""); setNewSectorPin(""); loadData()
  }

  async function updateSector(sector: Sector) {
    await fetch(`${API_URL}/sectors/${sector.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: sector.name, pin: sector.pin }) })
    loadData()
  }

  async function removeSector(id: number) {
    if (employees.some((employee) => employee.sectorId === id)) { alert("Esse setor possui funcionários vinculados."); return }
    if (!window.confirm("Excluir este setor?")) return
    await fetch(`${API_URL}/sectors/${id}`, { method: "DELETE" })
    loadData()
  }

  async function addEmployee() {
    if (!newEmployeeName || !newEmployeeSectorId || !newEmployeeUsername || !newEmployeePassword) { alert("Preencha nome, usuário, senha e setor."); return }
    const response = await fetch(`${API_URL}/employees`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newEmployeeName, username: newEmployeeUsername, password: newEmployeePassword, sectorId: Number(newEmployeeSectorId) }) })
    if (!response.ok) { alert("Erro ao criar funcionário. Verifique se o usuário já existe."); return }
    setNewEmployeeName(""); setNewEmployeeUsername(""); setNewEmployeePassword(""); loadData()
  }

  async function updateEmployee(employee: Employee) {
    if (!employee.name || !employee.sectorId || !employee.username) { alert("Nome, usuário e setor são obrigatórios."); return }
    const response = await fetch(`${API_URL}/employees/${employee.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: employee.name, username: employee.username, password: employee.password || undefined, sectorId: employee.sectorId }) })
    if (!response.ok) { alert("Erro ao salvar funcionário. Verifique se o usuário já existe."); return }
    loadData()
  }

  async function removeEmployee(id: number) {
    if (!window.confirm("Excluir este funcionário? Todos os chamados associados também serão deletados.")) return
    const response = await fetch(`${API_URL}/employees/${id}`, { method: "DELETE" })
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
      <div className="ls-page-shell">
        <section className="ls-page-heading">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="ls-kicker">Administração</p>
              <h1 className="ls-title">Configurações</h1>
              <p className="ls-description">Gerencie setores, funcionários e acessos do portal.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-500">Setores</p><p className="text-2xl font-black text-slate-950">{sectors.length}</p></div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-500">Funcionários</p><p className="text-2xl font-black text-slate-950">{employees.length}</p></div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="ls-card p-4 sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">Setores</h2>
            <p className="mt-1 text-sm text-slate-500">Organize áreas e PINs internos.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Input placeholder="Nome do setor" value={newSectorName} onChange={(e) => setNewSectorName(e.target.value)} className="ls-input" />
              <Input placeholder="PIN" value={newSectorPin} onChange={(e) => setNewSectorPin(e.target.value)} className="ls-input" />
              <Button className="ls-button-primary h-11" onClick={addSector}>Adicionar</Button>
            </div>
            <div className="mt-5 space-y-3">
              {sectors.map((sector) => <div key={sector.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]"><Input value={sector.name} onChange={(e) => updateSectorState(sector.id, "name", e.target.value)} className="ls-input" /><Input value={sector.pin} onChange={(e) => updateSectorState(sector.id, "pin", e.target.value)} className="ls-input" /></div><div className="mt-3 flex justify-end gap-2"><Button size="sm" className="ls-button-primary rounded-2xl" onClick={() => updateSector(sector)}>Salvar</Button><Button variant="destructive" size="sm" className="rounded-2xl" onClick={() => removeSector(sector.id)}>Excluir</Button></div></div>)}
            </div>
          </section>

          <section className="ls-card p-4 sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">Funcionários</h2>
            <p className="mt-1 text-sm text-slate-500">Usuário, senha e setor definem o acesso ao portal.</p>
            <div className="mt-5 grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
              <Input placeholder="Nome" value={newEmployeeName} onChange={(e) => setNewEmployeeName(e.target.value)} className="ls-input" />
              <Input placeholder="Usuário" value={newEmployeeUsername} onChange={(e) => setNewEmployeeUsername(e.target.value)} className="ls-input" />
              <Input type="password" placeholder="Senha" value={newEmployeePassword} onChange={(e) => setNewEmployeePassword(e.target.value)} className="ls-input" />
              <select value={newEmployeeSectorId} onChange={(e) => setNewEmployeeSectorId(e.target.value)} className="ls-input">{sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}</select>
              <Button className="ls-button-primary h-11" onClick={addEmployee}>Adicionar</Button>
            </div>
            <div className="mt-5 space-y-3">
              {employees.map((employee) => <div key={employee.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-slate-950">{employee.name}</p><p className="text-xs text-slate-500">Usuário: {employee.username || "não configurado"}</p></div><span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200">{sectors.find((sector) => sector.id === employee.sectorId)?.name || employee.sector?.name || "Sem setor"}</span></div><div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr_1fr]"><Input value={employee.name} onChange={(e) => updateEmployeeState(employee.id, "name", e.target.value)} className="ls-input" /><Input value={employee.username || ""} onChange={(e) => updateEmployeeState(employee.id, "username", e.target.value)} placeholder="usuário" className="ls-input" /><Input type="password" value={employee.password || ""} onChange={(e) => updateEmployeeState(employee.id, "password", e.target.value)} placeholder="Nova senha opcional" className="ls-input" /><select value={employee.sectorId} onChange={(e) => updateEmployeeState(employee.id, "sectorId", e.target.value)} className="ls-input">{sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}</select></div><div className="mt-3 flex justify-end gap-2"><Button size="sm" className="ls-button-primary rounded-2xl" onClick={() => updateEmployee(employee)}>Salvar</Button><Button variant="destructive" size="sm" className="rounded-2xl" onClick={() => removeEmployee(employee.id)}>Excluir</Button></div></div>)}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
