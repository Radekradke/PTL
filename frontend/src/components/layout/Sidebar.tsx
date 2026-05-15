import {
  LayoutDashboard,
  Ticket,
  FileText,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

type NavItem = {
  label: string
  path: string
  icon: React.ElementType
  allowed: string[]
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, allowed: ["Admin", "TI", "Diretoria"] },
  { label: "Chamados", path: "/tickets", icon: Ticket, allowed: ["Admin", "TI"] },
  { label: "Relatórios", path: "/reports", icon: FileText, allowed: ["Admin", "TI", "Diretoria"] },
  { label: "Configurações", path: "/settings", icon: Settings, allowed: ["Admin"] },
]

function getUserRole() {
  try {
    const stored = localStorage.getItem("lifting-user")
    if (!stored) return ""
    return JSON.parse(stored)?.sector || ""
  } catch {
    return ""
  }
}

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const role = getUserRole()
  const visibleItems = navItems.filter((item) => item.allowed.includes(role))

  function handleLogout() {
    localStorage.removeItem("lifting-user")
    navigate("/")
  }

  function itemClass(path: string) {
    const active = location.pathname === path
    return `flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
      active
        ? "bg-emerald-600 text-white shadow-sm"
        : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
    }`
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white p-5 shadow-sm lg:block">
        <div className="mb-7 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-600 p-2.5 text-white">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-[-0.04em] text-slate-950">Lifting</h1>
              <p className="text-sm font-medium text-slate-500">Support</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-white px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Perfil</p>
            <p className="mt-1 text-sm font-bold text-emerald-700">{role || "Não logado"}</p>
          </div>
        </div>

        <nav className="space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.path} onClick={() => navigate(item.path)} className={itemClass(item.path)}>
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}

          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            <LogOut size={18} />
            Sair
          </button>
        </nav>
      </aside>

      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 gap-1">
          {visibleItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${
                  active ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-800"
                }`}
              >
                <Icon size={18} />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
