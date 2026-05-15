import {
  LayoutDashboard,
  Ticket,
  FileText,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("lifting-user") || "{}")
  } catch {
    return {}
  }
}

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()
  const role = user?.sector || ""

  const items = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      allowed: ["Admin", "TI", "Diretoria"],
    },
    {
      label: "Chamados",
      path: "/tickets",
      icon: Ticket,
      allowed: ["Admin", "TI"],
    },
    {
      label: "Relatórios",
      path: "/reports",
      icon: FileText,
      allowed: ["Admin", "TI", "Diretoria"],
    },
    {
      label: "Config.",
      path: "/settings",
      icon: Settings,
      allowed: ["Admin"],
    },
  ].filter((item) => item.allowed.includes(role))

  function handleLogout() {
    localStorage.removeItem("lifting-user")
    navigate("/")
  }

  function isActive(path: string) {
    return location.pathname === path
  }

  return (
    <>
      <aside className="hidden min-h-screen w-64 shrink-0 border-r border-[#B4D7C4]/60 bg-white/95 p-4 text-[#2B2B2B] lg:block">
        <div className="rounded-[1.75rem] border border-[#B4D7C4]/60 bg-gradient-to-br from-white via-[#F8FBF9] to-[#F2F2F2] p-4 shadow-[0_18px_50px_rgba(50,98,74,0.12)]">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-[#42A95E]/25 bg-[#42A95E]/10 p-3 text-[#32624A]">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-[-0.04em] text-[#2B2B2B]">Lifting</h1>
              <p className="text-sm font-medium tracking-wide text-[#66736B]">Support Panel</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#B4D7C4]/60 bg-[#F8FBF9]/90 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7C8A80]">Perfil</p>
            <p className="mt-1 text-sm font-bold text-[#32624A]">{role || "Sem acesso"}</p>
          </div>
        </div>

        <nav className="mt-5 space-y-2">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-sm font-semibold transition ${
                  isActive(item.path)
                    ? "border border-[#42A95E]/25 bg-[#42A95E] text-white shadow-lg shadow-[#42A95E]/20"
                    : "text-[#32624A] hover:bg-[#F8FBF9] hover:text-[#2B2B2B]"
                }`}
              >
                <Icon size={18} />
                {item.label === "Config." ? "Configurações" : item.label}
              </button>
            )
          })}

          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-red-500/15 bg-red-500/5 p-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
          >
            <LogOut size={18} />
            Sair
          </button>
        </nav>
      </aside>

      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-[1.75rem] border border-[#B4D7C4]/60 bg-white/95 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(64px,1fr))] gap-1">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[11px] font-semibold transition ${
                  isActive(item.path)
                    ? "bg-[#42A95E] text-white shadow-lg shadow-[#42A95E]/20"
                    : "text-[#66736B] hover:bg-[#F8FBF9] hover:text-[#2B2B2B]"
                }`}
              >
                <Icon size={18} />
                <span className="max-w-full truncate">{item.label}</span>
              </button>
            )
          })}
          <button
            onClick={handleLogout}
            className="flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </nav>
    </>
  )
}
