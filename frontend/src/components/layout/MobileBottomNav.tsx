import { FileText, Home, LayoutDashboard, LogOut, Ticket } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { AUTH_CHANGED_EVENT, TECHNICAL_USER_KEY } from "@/services/api"

const ALL = ["Admin", "TI", "RH", "Infraestrutura"]

export function MobileBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem(TECHNICAL_USER_KEY) || "{}")
  const role = user?.sector || ""

  const items = [
    { label: "Início", path: "/home", icon: Home, allowed: ALL },
    { label: "Chamados", path: "/tickets", icon: Ticket, allowed: ALL },
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, allowed: ALL },
    { label: "Relatórios", path: "/reports", icon: FileText, allowed: ALL },
  ].filter((item) => item.allowed.includes(role))

  function handleLogout() {
    localStorage.removeItem(TECHNICAL_USER_KEY)
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
    navigate("/login")
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--hairline)] bg-white/92 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_36px_-20px_rgb(24_24_27_/_0.25)] backdrop-blur-md lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-0.5 rounded-2xl border border-[color:var(--hairline)] bg-white p-1 shadow-[var(--shadow-xs)]">
        {items.slice(0, 4).map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold transition ${
                active ? "bg-[#00A859] text-white shadow-sm" : "text-zinc-500 hover:bg-[color:var(--accent)] hover:text-[#0B3D29]"
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              <span className="truncate text-[9px] sm:text-[10px]">{item.label}</span>
            </button>
          )
        })}

        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold text-rose-600 transition hover:bg-rose-50"
        >
          <LogOut size={18} strokeWidth={2} />
          <span className="truncate text-[9px] sm:text-[10px]">Sair</span>
        </button>
      </div>
    </div>
  )
}
