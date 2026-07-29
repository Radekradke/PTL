import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { UserCheck, UserX, KeyRound, ChevronDown, Users, Mail, Trash2 } from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { apiFetch } from "@/services/api"

type Sector = { id: number; name: string; pin?: string; color?: string }

type DepartmentEmail = { id: number; department: string; email: string }

// Departamentos fixos que recebem chamados (mesma lista do backend)
const TICKET_DEPARTMENTS: { value: string; label: string; color: string }[] = [
  { value: "TI", label: "Setor TI", color: "#0EA5E9" },
  { value: "RH", label: "Setor RH", color: "#8B5CF6" },
  { value: "Infraestrutura", label: "Infraestrutura", color: "#F59E0B" },
]


// Paleta fixa de cores de setor — evita cores ilegíveis e mantém identidade visual
const SECTOR_COLORS = [
  "#00A859", // verde Lifting
  "#0EA5E9", // azul claro
  "#2563EB", // azul
  "#8B5CF6", // roxo
  "#EC4899", // rosa
  "#EF4444", // vermelho
  "#F97316", // laranja
  "#F59E0B", // âmbar
  "#14B8A6", // teal
  "#64748B", // cinza
]

const DEFAULT_SECTOR_COLOR = SECTOR_COLORS[0]

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {SECTOR_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          aria-label={`Selecionar cor ${color}`}
          className={`h-7 w-7 rounded-full border border-black/5 transition ${
            value.toUpperCase() === color ? "scale-110 ring-2 ring-[#073B2A] ring-offset-2" : "hover:scale-110"
          }`}
          style={{ background: color }}
        />
      ))}
    </div>
  )
}

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
  const [newSectorColor, setNewSectorColor] = useState(DEFAULT_SECTOR_COLOR)
  const [openSectorIds, setOpenSectorIds] = useState<Set<number>>(new Set())
  const [newEmployeeName, setNewEmployeeName] = useState("")
  const [newEmployeeUsername, setNewEmployeeUsername] = useState("")
  const [newEmployeePassword, setNewEmployeePassword] = useState("")
  const [newEmployeeSectorId, setNewEmployeeSectorId] = useState("")
  const [isAddingSector, setIsAddingSector] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [departmentEmails, setDepartmentEmails] = useState<DepartmentEmail[]>([])
  const [newEmailDepartment, setNewEmailDepartment] = useState(TICKET_DEPARTMENTS[0].value)
  const [newEmailAddress, setNewEmailAddress] = useState("")
  const [isAddingEmail, setIsAddingEmail] = useState(false)

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

      const emailsResponse = await apiFetch("/department-emails")
      if (emailsResponse.ok) {
        setDepartmentEmails(await readApiJson(emailsResponse, "Erro ao carregar e-mails."))
      }
    } finally {
      setIsLoadingData(false)
    }
  }

  async function addDepartmentEmail() {
    const email = newEmailAddress.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Digite um e-mail válido.")
      return
    }

    setIsAddingEmail(true)
    try {
      const response = await apiFetch("/department-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department: newEmailDepartment, email }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        toast.error(data?.message || "Erro ao cadastrar e-mail.")
        return
      }
      setNewEmailAddress("")
      toast.success("E-mail cadastrado.")
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao cadastrar e-mail.")
    } finally {
      setIsAddingEmail(false)
    }
  }

  async function removeDepartmentEmail(id: number) {
    const response = await apiFetch(`/department-emails/${id}`, { method: "DELETE" })
    if (!response.ok) {
      toast.error("Erro ao remover e-mail.")
      return
    }
    toast.success("E-mail removido.")
    setDepartmentEmails((current) => current.filter((item) => item.id !== id))
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
      const response = await apiFetch("/sectors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: sectorName, pin: sectorPin, color: newSectorColor }) })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        toast.error(data?.message || `Erro ao criar setor.`)
        return
      }

      setNewSectorName("")
      setNewSectorPin("")
      setNewSectorColor(DEFAULT_SECTOR_COLOR)
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

    const response = await apiFetch(`/sectors/${sector.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: sectorName, pin: sectorPin, color: sector.color || DEFAULT_SECTOR_COLOR }) })
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
    // Abre o grupo do setor para o funcionário recém-criado aparecer
    setOpenSectorIds((prev) => new Set(prev).add(Number(newEmployeeSectorId)))
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

  function updateSectorState(id: number, field: "name" | "pin" | "color", value: string) {
    setSectors(sectors.map((sector) => sector.id === id ? { ...sector, [field]: value } : sector))
  }

  function updateEmployeeState(id: number, field: "name" | "sectorId" | "username" | "password", value: string) {
    setEmployees(employees.map((employee) => employee.id === id ? { ...employee, [field]: field === "sectorId" ? Number(value) : value } : employee))
  }

  function toggleSectorGroup(id: number) {
    setOpenSectorIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Funcionários agrupados por setor (o grupo "Sem setor" cobre setores desativados)
  const employeeGroups = [
    ...sectors.map((sector) => ({
      key: sector.id,
      name: sector.name,
      color: sector.color || DEFAULT_SECTOR_COLOR,
      list: employees.filter((employee) => employee.sectorId === sector.id),
    })),
    {
      key: -1,
      name: "Sem setor",
      color: "#94A3B8",
      list: employees.filter((employee) => !sectors.some((sector) => sector.id === employee.sectorId)),
    },
  ].filter((group) => group.key !== -1 || group.list.length > 0)

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

        <section className="ls-card p-5 sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#ECFBF3] text-[#00A859]">
              <Mail size={18} />
            </span>
            <div>
              <h2 className="ls-section-title text-2xl">E-mails dos responsáveis</h2>
              <p className="mt-1 text-sm text-slate-500">
                Quando um funcionário abre um chamado, o(s) e-mail(s) cadastrado(s) para aquele departamento recebem um aviso automático. Ex.: chamado de TI → gestor de TI.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-[#BFEFD7] bg-[#F8FCFA] p-4">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[#00A859]">Novo e-mail</p>
            <div className="grid gap-3 sm:grid-cols-[12rem_1fr_auto]">
              <select value={newEmailDepartment} onChange={(e) => setNewEmailDepartment(e.target.value)} className="ls-input">
                {TICKET_DEPARTMENTS.map((dept) => <option key={dept.value} value={dept.value}>{dept.label}</option>)}
              </select>
              <Input
                type="email"
                placeholder="gestor@empresa.com.br"
                value={newEmailAddress}
                onChange={(e) => setNewEmailAddress(e.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") addDepartmentEmail() }}
                className="ls-input"
              />
              <Button className="ls-button-primary h-11 font-black" onClick={addDepartmentEmail} disabled={isAddingEmail}>
                {isAddingEmail ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {TICKET_DEPARTMENTS.map((dept) => {
              const list = departmentEmails.filter((item) => item.department === dept.value)
              return (
                <div key={dept.value} className="rounded-3xl border border-[#DDE8E2] bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ background: dept.color }} />
                    <p className="font-black text-[#111827]">{dept.label}</p>
                    <span className="ml-auto rounded-full px-2 py-0.5 text-xs font-black" style={{ background: `${dept.color}1A`, color: dept.color }}>
                      {list.length}
                    </span>
                  </div>
                  {list.length === 0 ? (
                    <p className="py-3 text-center text-xs text-slate-400">Nenhum e-mail cadastrado.</p>
                  ) : (
                    <div className="space-y-2">
                      {list.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 rounded-2xl border border-[#EDF3F0] bg-[#FAFCFB] px-3 py-2">
                          <Mail size={13} className="shrink-0 text-slate-400" />
                          <span className="min-w-0 flex-1 truncate text-sm text-[#102A43]" title={item.email}>{item.email}</span>
                          <button
                            type="button"
                            onClick={() => removeDepartmentEmail(item.id)}
                            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            aria-label="Remover e-mail"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="ls-card p-5 sm:p-6">
            <div className="mb-5"><h2 className="ls-section-title text-2xl">Setores</h2><p className="mt-1 text-sm text-slate-500">Controle os setores usados no painel e portal.</p></div>
            <div className="rounded-2xl border border-dashed border-[#BFEFD7] bg-[#F8FCFA] p-4">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[#00A859]">Novo setor</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
                <Input placeholder="Nome do setor" value={newSectorName} onChange={(e) => setNewSectorName(e.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addSector() }} className="ls-input" />
                <Input inputMode="numeric" placeholder="PIN" value={newSectorPin} onChange={(e) => setNewSectorPin(e.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addSector() }} className="ls-input" />
              </div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="mb-2 text-xs font-bold text-slate-500">Cor de identificação</p>
                  <ColorPicker value={newSectorColor} onChange={setNewSectorColor} />
                </div>
                <Button className="ls-button-primary h-11 font-black" onClick={addSector} disabled={isAddingSector}>{isAddingSector ? "Adicionando..." : "Adicionar"}</Button>
              </div>
            </div>
            <div className="mt-6 space-y-4">{isLoadingData ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-3xl bg-white/80" />) : sectors.map((sector) => <div key={sector.id} className="relative overflow-hidden rounded-3xl border border-[#DDE8E2] bg-white p-4 pl-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(7,59,42,0.10)]"><span className="absolute left-0 top-0 h-full w-1.5" style={{ background: sector.color || DEFAULT_SECTOR_COLOR }} /><div className="grid gap-3 sm:grid-cols-[1fr_10rem]"><Input value={sector.name} onChange={(e) => updateSectorState(sector.id, "name", e.target.value)} className="ls-input" /><Input inputMode="numeric" placeholder="PIN" value={sector.pin || ""} onChange={(e) => updateSectorState(sector.id, "pin", e.target.value)} className="ls-input" /></div><div className="mt-3"><ColorPicker value={sector.color || DEFAULT_SECTOR_COLOR} onChange={(color) => updateSectorState(sector.id, "color", color)} /></div><div className="mt-4 flex flex-wrap justify-end gap-3"><Button size="sm" className="ls-button-primary rounded-2xl px-4" onClick={() => updateSector(sector)}>Salvar</Button><Button variant="destructive" size="sm" className="rounded-2xl" onClick={() => removeSector(sector.id)}>Excluir</Button></div></div>)}</div>
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

            {/* Lista de funcionários agrupada por setor */}
            <div className="mt-5 space-y-3">
              {isLoadingData
                ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-3xl bg-white/80" />)
                : employeeGroups.map((group) => {
                  const isOpen = openSectorIds.has(group.key)
                  const withAccess = group.list.filter((e) => e.username).length

                  return (
                    <div key={group.key} className="overflow-hidden rounded-3xl border border-[#DDE8E2] bg-white shadow-sm">
                      {/* Cabeçalho do setor */}
                      <button
                        type="button"
                        onClick={() => toggleSectorGroup(group.key)}
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[#F8FCFA]"
                      >
                        <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: group.color }} />
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
                          style={{ background: `${group.color}1A`, color: group.color }}
                        >
                          <Users size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-black text-[#111827]">{group.name}</span>
                          <span className="block text-xs text-slate-500">
                            {group.list.length} funcionário(s){group.list.length > 0 && ` · ${withAccess} com acesso`}
                          </span>
                        </span>
                        <span
                          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-black"
                          style={{ background: `${group.color}1A`, color: group.color }}
                        >
                          {group.list.length}
                        </span>
                        <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>

                      {/* Funcionários do setor */}
                      {isOpen && (
                        <div className="space-y-3 border-t border-[#EDF3F0] bg-[#FAFCFB] p-3">
                          {group.list.length === 0 && (
                            <p className="px-2 py-3 text-center text-xs text-slate-400">Nenhum funcionário neste setor ainda.</p>
                          )}
                          {group.list.map((employee) => {
                            const hasAccess = !!employee.username
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
                          <p className="text-xs text-slate-500">{employee.username ? `@${employee.username}` : "Sem usuário de acesso"}</p>
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
                          })}
                        </div>
                      )}
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
