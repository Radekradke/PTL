import { FileText, LayoutDashboard, LogOut, Settings, Ticket } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { AUTH_CHANGED_EVENT, TECHNICAL_USER_KEY } from "@/services/api"
import logoHorizontal from "@/assets/logo-lifting-horizontal.png"

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
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[#DDE8E2] bg-white/88 px-4 py-5 text-[#111827] backdrop-blur-xl lg:flex">

      {/* Logo card */}
      <div className="rounded-3xl border border-[#DDE8E2] bg-gradient-to-br from-white to-[#F2F8F5] p-4 shadow-sm">
        <div className="flex w-full flex-col items-center justify-center text-center">
          <img
            src={logoHorizontal}
            alt="Lifting Electric & Instrumentation"
            className="mx-auto block h-25 w-full max-w-[190px] object-contain"
          />
          <p className="mt-2 w-full text-center text-[10px] font-black uppercase tracking-[0.16em] text-[#00A859]">
            PTL • PAINEL TÉCNICO LIFTING
          </p>
        </div>
      </div>

      {/* Profile chip */}
      <div className="mt-4 rounded-2xl border border-[#DDE8E2] bg-white px-3 py-2.5">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#64748B]">Perfil ativo</p>
        <p className="mt-0.5 text-sm font-black text-[#073B2A]">{role || "Sem perfil"}</p>
      </div>

      {/* Nav */}
      <nav className="mt-5 flex-1 space-y-1.5">
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
              <Icon
                size={18}
                className={active ? "text-[#00A859]" : "opacity-60"}
              />
              {item.label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#00A859]" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Logout — pinned to bottom */}
      <div className="border-t border-[#DDE8E2] pt-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-[#B42318] transition hover:bg-[#FFF1F1]"
        >
          <LogOut size={18} className="opacity-70" />
          Sair
        </button>
      </div>
    </aside>
  )
}
