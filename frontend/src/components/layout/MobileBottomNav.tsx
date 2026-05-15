import { FileText, LayoutDashboard, LogOut, Settings, Ticket } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

const access = {
  dashboard: ["Admin", "TI", "Diretoria"],
  tickets: ["Admin", "TI"],
  reports: ["Admin", "TI", "Diretoria"],
  settings: ["Admin"],
}

export function MobileBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem("lifting-user") || "{}")
  const role = user?.sector || ""

  const items = [
    { label: "Início", path: "/dashboard", icon: LayoutDashboard, allowed: access.dashboard },
    { label: "Chamados", path: "/tickets", icon: Ticket, allowed: access.tickets },
    { label: "Relatórios", path: "/reports", icon: FileText, allowed: access.reports },
    { label: "Config", path: "/settings", icon: Settings, allowed: access.settings },
  ].filter((item) => item.allowed.includes(role))

  function handleLogout() {
    localStorage.removeItem("lifting-user")
    navigate("/")
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/90 px-2 pb-2 pt-2 shadow-[0_-18px_50px_rgba(15,23,42,0.10)] backdrop-blur-2xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1 rounded-3xl border border-slate-200 bg-white p-1 shadow-sm">
        {items.slice(0, 4).map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.path

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-bold transition ${
                active ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              <Icon size={18} />
              <span className="mt-1 truncate">{item.label}</span>
            </button>
          )
        })}

        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-bold text-rose-600 transition hover:bg-rose-50"
        >
          <LogOut size={18} />
          <span className="mt-1">Sair</span>
        </button>
      </div>
    </div>
  )
}
