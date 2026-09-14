import { FileText, Home, LayoutDashboard, Lightbulb, LogOut, Settings, Ticket } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { AUTH_CHANGED_EVENT, TECHNICAL_USER_KEY } from "@/services/api"
import { APP_VERSION } from "@/lib/version"
import logoHorizontal from "@/assets/logo-lifting-horizontal.png"

const ALL = ["Admin", "TI", "RH", "Infraestrutura"]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem(TECHNICAL_USER_KEY) || "{}")
  const role = user?.sector || ""

  function handleLogout() {
    localStorage.removeItem(TECHNICAL_USER_KEY)
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
    navigate("/login?tipo=tecnico")
  }

  const items = [
    { label: "Início", path: "/home", icon: Home, allowed: ALL },
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, allowed: ALL },
    { label: "Chamados", path: "/tickets", icon: Ticket, allowed: ALL },
    { label: "Relatórios", path: "/reports", icon: FileText, allowed: ALL },
    { label: "Sugestões", path: "/suggestions", icon: Lightbulb, allowed: ["Admin"] },
    { label: "Configurações", path: "/settings", icon: Settings, allowed: ["Admin"] },
  ].filter((item) => item.allowed.includes(role))

  return (
    <aside className="hidden w-60 shrink-0 self-stretch border-r border-[color:var(--hairline)] bg-white lg:block">
      <div className="sticky top-0 flex h-[100dvh] flex-col px-4 py-5">
        {/* Marca */}
        <div className="px-1 pt-1">
          <img src={logoHorizontal} alt="Lifting Electric & Instrumentation" className="block h-9 w-auto max-w-[168px] object-contain" />
          <p className="ls-label mt-3">Painel técnico</p>
        </div>

        {/* Perfil */}
        <div className="mt-5 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface-inset)] px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Perfil ativo</p>
          <p className="mt-0.5 text-sm font-bold text-[#0B3D29]">{role || "Sem perfil"}</p>
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
                  active ? "bg-[color:var(--accent)] text-[#0B3D29]" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[#00A859]" />}
                <Icon size={18} strokeWidth={2} className={active ? "text-[#00A859]" : "text-zinc-400 group-hover:text-zinc-600"} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Rodapé */}
        <div className="mt-3 border-t border-[color:var(--hairline)] pt-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
          >
            <LogOut size={18} strokeWidth={2} className="opacity-80" />
            Sair
          </button>
          <p className="mt-2 px-3 text-[10px] font-medium tracking-wide text-zinc-400">Versão {APP_VERSION}</p>
        </div>
      </div>
    </aside>
  )
}
