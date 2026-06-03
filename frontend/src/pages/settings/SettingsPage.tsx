import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { UserCheck, UserX, KeyRound } from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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

async function readApiJson(response: Response, fallbackMessage: string) {
  const contentType = response.headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    return response.json()
  }

  if (!response.ok) {
    throw new Error(fallbackMessage)
  }

  return null
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
  const [isLoadingData, setIsLoadingData] = useState(true)

  async function loadData() {
    setIsLoadingData(true)

    try {
      const sectorsResponse = await apiFetch("/sectors")
      const employeesResponse = await apiFetch("/employees")

      if (!sectorsResponse.ok || !employeesResponse.ok) {
        throw new Error("Não foi possível carregar setores e funcionários.")
      }

      const sectorsData = await readApiJson(sectorsResponse, "Erro ao carregar setores.")
      const employeesData = await readApiJson(employeesResponse, "Erro ao carregar funcionários.")
      setSectors(sectorsData)
      setEmployees(employeesData.map((employee: Employee) => ({ ...employee, password: "" })))
      if (sectorsData.length > 0 && !newEmployeeSectorId) setNewEmployeeSectorId(String(sectorsData[0].id))
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    loadData().catch((error) => {
      console.error("Erro ao carregar configurações:", error)
      alert(error instanceof Error ? error.message : "Erro ao carregar configurações.")
    })
  }, [])

  async function addSector() {
    const sectorName = newSectorName.trim()
    const sectorPin = newSectorPin.trim()

    if (!sectorName) { toast.error("Preencha o nome do setor."); return }
    if (!/^\d{4,8}$/.test(sectorPin)) { toast.error("PIN deve conter de 4 a 8 números."); return }

    setIsAddingSector(true)

    try {
      const response = await apiFetch("/sectors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: sectorName, pin: sectorPin }) })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        toast.error(data?.message || `Erro ao criar setor.`)
        return
      }

      setNewSectorName("")
      setNewSectorPin("")
      toast.success("Setor criado com sucesso.")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar setor.")
    } finally {
      setIsAddingSector(false)
    }
  }

  async function updateSector(sector: Sector) {
    const sectorName = sector.name.trim()
    const sectorPin = String(sector.pin || "").trim()

    if (!/^\d{4,8}$/.test(sectorPin)) { toast.error("PIN deve conter de 4 a 8 números."); return }

    const response = await apiFetch(`/sectors/${sector.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: sectorName, pin: sectorPin }) })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      toast.error(data?.message || "Erro ao salvar setor.")
      return
    }
    toast.success("Setor salvo.")
    loadData()
  }

  async function removeSector(id: number) {
    const hasEmployees = employees.some((employee) => employee.sectorId === id)
    if (hasEmployees) { toast.error("Esse setor possui funcionários vinculados. Remaneje ou desative os funcionários antes."); return }
    if (!window.confirm("Excluir este setor?")) return
    await apiFetch(`/sectors/${id}`, { method: "DELETE" })
    toast.success("Setor excluído.")
    loadData()
  }

  async function addEmployee() {
    if (!newEmployeeName || !newEmployeeSectorId || !newEmployeeUsername || !newEmployeePassword) {
      toast.error("Preencha nome, usuário, senha e setor do funcionário.")
      return
    }
    if (newEmployeePassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.")
      return
    }
    const response = await apiFetch("/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newEmployeeName, username: newEmployeeUsername, password: newEmployeePassword, sectorId: Number(newEmployeeSectorId) }) })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      toast.error(data?.message || "Erro ao criar funcionário.")
      return
    }
    toast.success("Funcionário criado com sucesso.")
    setNewEmployeeName(""); setNewEmployeeUsername(""); setNewEmployeePassword(""); loadData()
  }

  async function updateEmployee(employee: Employee) {
    if (!employee.name || !employee.sectorId || !employee.username) { toast.error("Nome, usuário e setor são obrigatórios."); return }
    if (employee.password && employee.password.length < 6) { toast.error("A nova senha deve ter pelo menos 6 caracteres."); return }
    const response = await apiFetch(`/employees/${employee.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: employee.name, username: employee.username, password: employee.password || undefined, sectorId: employee.sectorId }) })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      toast.error(data?.message || "Erro ao salvar funcionário.")
      return
    }
    toast.success("Funcionário salvo.")
    loadData()
  }

  async function removeEmployee(id: number) {
    if (!window.confirm("Desativar este funcionário? Os chamados associados serão preservados.")) return
    const response = await apiFetch(`/employees/${id}`, { method: "DELETE" })
    if (!response.ok) { toast.error("Erro ao desativar funcionário."); return }
    toast.success("Funcionário desativado.")
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
            <div className="mt-6 space-y-4">{isLoadingData ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-3xl bg-white/80" />) : sectors.map((sector) => <div key={sector.id} className="rounded-3xl border border-[#DDE8E2] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(7,59,42,0.10)]"><div className="grid gap-3 sm:grid-cols-[1fr_10rem]"><Input value={sector.name} onChange={(e) => updateSectorState(sector.id, "name", e.target.value)} className="ls-input" /><Input inputMode="numeric" placeholder="PIN" value={sector.pin || ""} onChange={(e) => updateSectorState(sector.id, "pin", e.target.value)} className="ls-input" /></div><div className="mt-4 flex flex-wrap justify-end gap-3"><Button size="sm" className="ls-button-primary rounded-2xl px-4" onClick={() => updateSector(sector)}>Salvar</Button><Button variant="destructive" size="sm" className="rounded-2xl" onClick={() => removeSector(sector.id)}>Excluir</Button></div></div>)}</div>
          </section>

          <section className="ls-card p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="ls-section-title text-2xl">Funcionários</h2>
                <p className="mt-1 text-sm text-slate-500">Usuário e senha definem o acesso ao portal.</p>
              </div>
              {!isLoadingData && employees.length > 0 && (
                <div className="flex gap-2 text-xs font-bold">
                  <span className="flex items-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
                    <UserCheck size={13} />
                    {employees.filter(e => e.username).length} com acesso
                  </span>
                  {employees.filter(e => !e.username).length > 0 && (
                    <span className="flex items-center gap-1.5 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700">
                      <UserX size={13} />
                      {employees.filter(e => !e.username).length} sem acesso
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Formulário novo funcionário */}
            <div className="rounded-2xl border border-dashed border-[#BFEFD7] bg-[#F8FCFA] p-4">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[#00A859]">Novo funcionário</p>
              <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
                <Input placeholder="Nome completo" value={newEmployeeName} onChange={(e) => setNewEmployeeName(e.target.value)} className="ls-input" />
                <Input placeholder="Usuário" value={newEmployeeUsername} onChange={(e) => setNewEmployeeUsername(e.target.value)} className="ls-input" />
                <Input type="password" placeholder="Senha (mín. 6 caracteres)" value={newEmployeePassword} onChange={(e) => setNewEmployeePassword(e.target.value)} className="ls-input" />
                <select value={newEmployeeSectorId} onChange={(e) => setNewEmployeeSectorId(e.target.value)} className="ls-input">
                  {sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}
                </select>
                <Button className="ls-button-primary h-11 font-black" onClick={addEmployee}>Adicionar</Button>
              </div>
            </div>

            {/* Lista de funcionários */}
            <div className="mt-5 space-y-3">
              {isLoadingData
                ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-40 rounded-3xl bg-white/80" />)
                : employees.map((employee) => {
                  const hasAccess = !!employee.username
                  const sectorName = sectors.find((s) => s.id === employee.sectorId)?.name || employee.sector?.name || "Sem setor"
                  const initials = employee.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()

                  return (
                    <div
                      key={employee.id}
                      className={`rounded-3xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(7,59,42,0.10)] ${
                        hasAccess ? "border-[#DDE8E2]" : "border-amber-200 bg-amber-50/30"
                      }`}
                    >
                      {/* Cabeçalho do card */}
                      <div className="mb-4 flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${
                          hasAccess ? "bg-[#ECFBF3] text-[#073B2A]" : "bg-amber-100 text-amber-800"
                        }`}>
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-[#111827]">{employee.name}</p>
                          <p className="text-xs text-slate-500">{sectorName}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {hasAccess ? (
                            <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                              <UserCheck size={11} /> Acesso ativo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700">
                              <UserX size={11} /> Sem acesso ao portal
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Campos de edição */}
                      <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr_1fr]">
                        <Input value={employee.name} onChange={(e) => updateEmployeeState(employee.id, "name", e.target.value)} placeholder="Nome" className="ls-input" />
                        <Input value={employee.username || ""} onChange={(e) => updateEmployeeState(employee.id, "username", e.target.value)} placeholder="usuário" className="ls-input" />
                        <div className="relative">
                          <KeyRound size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input type="password" value={employee.password || ""} onChange={(e) => updateEmployeeState(employee.id, "password", e.target.value)} placeholder="Nova senha opcional" className="ls-input pl-8" />
                        </div>
                        <select value={employee.sectorId} onChange={(e) => updateEmployeeState(employee.id, "sectorId", e.target.value)} className="ls-input">
                          {sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}
                        </select>
                      </div>

                      <div className="mt-4 flex flex-wrap justify-end gap-3">
                        <Button size="sm" className="ls-button-primary rounded-2xl px-4" onClick={() => updateEmployee(employee)}>Salvar</Button>
                        <Button variant="destructive" size="sm" className="rounded-2xl" onClick={() => removeEmployee(employee.id)}>Desativar</Button>
                      </div>
                    </div>
                  )
                })
              }
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
