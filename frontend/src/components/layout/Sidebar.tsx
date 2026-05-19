import { FileText, LayoutDashboard, LogOut, Settings, Ticket } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { AUTH_CHANGED_EVENT, TECHNICAL_USER_KEY } from "@/services/api"

const access = {
  dashboard: ["Admin", "TI", "Diretoria"],
  tickets: ["Admin", "TI"],
  reports: ["Admin", "TI", "Diretoria"],
  settings: ["Admin"],
}

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem(TECHNICAL_USER_KEY) || "{}")
  const role = user?.sector || ""

  function handleLogout() {
    localStorage.removeItem(TECHNICAL_USER_KEY)
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
    navigate("/")
  }

  const items = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, allowed: access.dashboard },
    { label: "Chamados", path: "/tickets", icon: Ticket, allowed: access.tickets },
    { label: "Relatórios", path: "/reports", icon: FileText, allowed: access.reports },
    { label: "Configurações", path: "/settings", icon: Settings, allowed: access.settings },
  ].filter((item) => item.allowed.includes(role))

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-[#DDE8E2] bg-white/88 px-4 py-5 text-[#111827] backdrop-blur-xl lg:block">
      <div className="rounded-3xl border border-[#DDE8E2] bg-gradient-to-br from-white to-[#F2F8F5] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#073B2A] text-lg font-black text-white shadow-[0_12px_30px_rgba(7,59,42,0.28)]">
            L
          </div>
          <div>
            <h1 className="text-xl font-black tracking-[-0.05em] text-[#111827]">Lifting</h1>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#00A859]">Support Panel</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#DDE8E2] bg-white px-3 py-2">
          <p className="text-xs text-[#64748B]">Perfil</p>
          <p className="text-sm font-black text-[#073B2A]">{role || "Sem perfil"}</p>
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
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
                active
                  ? "bg-[#ECFBF3] text-[#073B2A] shadow-sm ring-1 ring-[#00A859]/20"
                  : "text-[#4B5B52] hover:bg-[#F4F9F6] hover:text-[#073B2A]"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-[#B42318] transition hover:bg-[#FFF1F1]"
        >
          <LogOut size={18} />
          Sair
        </button>
      </nav>
    </aside>
  )
}
