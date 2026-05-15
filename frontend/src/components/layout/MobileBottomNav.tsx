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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#DFE7E2] bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-12px_30px_rgba(23,34,28,0.10)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.slice(0, 4).map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.path

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${
                active
                  ? "bg-[#E8F7EF] text-[#174A3A]"
                  : "text-[#6D7A72] hover:bg-[#F4F7F5] hover:text-[#174A3A]"
              }`}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          )
        })}

        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold text-[#B42318] transition hover:bg-[#FFF1F1]"
        >
          <LogOut size={19} />
          <span>Sair</span>
        </button>
      </div>
    </nav>
  )
}
