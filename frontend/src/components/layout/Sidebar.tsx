import { FileText, LayoutDashboard, LogOut, Settings, Ticket } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { AUTH_CHANGED_EVENT, TECHNICAL_USER_KEY } from "@/services/api"
import { APP_VERSION } from "@/lib/version"
import logoHorizontal from "@/assets/logo-lifting-horizontal-dark-bg.png"

const access = {
  dashboard: ["Admin", "TI", "RH", "Infraestrutura"],
  tickets:   ["Admin", "TI", "RH", "Infraestrutura"],
  reports:   ["Admin", "TI", "RH", "Infraestrutura"],
  settings:  ["Admin"],
}

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem(TECHNICAL_USER_KEY) || "{}")
  const role = user?.sector || ""

  function handleLogout() {
    localStorage.removeItem(TECHNICAL_USER_KEY)
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
    navigate("/login")
  }

  const items = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, allowed: access.dashboard },
    { label: "Chamados", path: "/tickets", icon: Ticket, allowed: access.tickets },
    { label: "Relatórios", path: "/reports", icon: FileText, allowed: access.reports },
    { label: "Configurações", path: "/settings", icon: Settings, allowed: access.settings },
  ].filter((item) => item.allowed.includes(role))

  return (
    <aside className="ls-metal-panel sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-black/20 px-4 py-5 text-emerald-50 lg:flex">
      {/* Marca */}
      <div className="px-2 pt-1">
        <img
          src={logoHorizontal}
          alt="Lifting Electric & Instrumentation"
          className="block h-11 w-auto max-w-[172px] object-contain"
        />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/70">
          Painel Técnico
        </p>
      </div>

      {/* Perfil */}
      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200/60">
          Perfil ativo
        </p>
        <p className="mt-0.5 text-sm font-bold text-white">{role || "Sem perfil"}</p>
      </div>

      {/* Navegação */}
      <nav className="mt-6 flex-1 space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.path

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-current={active ? "page" : undefined}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-white/[0.10] text-white"
                  : "text-emerald-100/70 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[#39D98A]" />
              )}
              <Icon
                size={18}
                strokeWidth={2}
                className={active ? "text-[#39D98A]" : "text-emerald-200/60 group-hover:text-emerald-100"}
              />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Rodapé */}
      <div className="mt-3 border-t border-white/10 pt-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-200/80 transition-colors hover:bg-red-500/15 hover:text-red-100"
        >
          <LogOut size={18} strokeWidth={2} className="opacity-80" />
          Sair
        </button>
        <p className="mt-2 px-3 text-[10px] font-medium tracking-wide text-emerald-200/40">
          Versão {APP_VERSION}
        </p>
      </div>
    </aside>
  )
}
