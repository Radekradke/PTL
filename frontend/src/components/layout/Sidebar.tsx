import { FileText, LayoutDashboard, LogOut, Settings, Ticket } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

const access = {
  dashboard: ["Admin", "TI", "Diretoria"],
  tickets: ["Admin", "TI"],
  reports: ["Admin", "TI", "Diretoria"],
  settings: ["Admin"],
}

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem("lifting-user") || "{}")
  const role = user?.sector || ""

  function handleLogout() {
    localStorage.removeItem("lifting-user")
    navigate("/")
  }

  const items = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, allowed: access.dashboard },
    { label: "Chamados", path: "/tickets", icon: Ticket, allowed: access.tickets },
    { label: "Relatórios", path: "/reports", icon: FileText, allowed: access.reports },
    { label: "Configurações", path: "/settings", icon: Settings, allowed: access.settings },
  ].filter((item) => item.allowed.includes(role))

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-[#DFE7E2] bg-white px-4 py-5 text-[#17221C] lg:block">
      <div className="rounded-3xl border border-[#DFE7E2] bg-gradient-to-br from-[#F7FAF8] to-white p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#174A3A] text-lg font-black text-white">
            L
          </div>
          <div>
            <h1 className="text-xl font-black tracking-[-0.05em] text-[#17221C]">Lifting</h1>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2FA866]">Support Panel</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#DFE7E2] bg-white px-3 py-2">
          <p className="text-xs text-[#6D7A72]">Perfil</p>
          <p className="text-sm font-bold text-[#174A3A]">{role || "Sem perfil"}</p>
        </div>
      </div>

      <nav className="mt-5 space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.path

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                active
                  ? "bg-[#E8F7EF] text-[#174A3A] shadow-sm"
                  : "text-[#5A685F] hover:bg-[#F4F7F5] hover:text-[#174A3A]"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-[#B42318] transition hover:bg-[#FFF1F1]"
        >
          <LogOut size={18} />
          Sair
        </button>
      </nav>
    </aside>
  )
}
