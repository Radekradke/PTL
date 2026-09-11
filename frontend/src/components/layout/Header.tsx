import { Bell, UserCircle2 } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { TECHNICAL_USER_KEY } from "@/services/api"

const PAGE_TITLES: Record<string, { label: string; sub: string }> = {
  "/dashboard": { label: "Dashboard", sub: "Visão geral da operação" },
  "/tickets":   { label: "Chamados",  sub: "Fila de atendimento técnico" },
  "/reports":   { label: "Relatórios", sub: "Exportação e histórico" },
  "/settings":  { label: "Configurações", sub: "Gestão de usuários e setores" },
}

interface HeaderProps {
  notificationCount?: number
}

export function Header({ notificationCount = 0 }: HeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = localStorage.getItem(TECHNICAL_USER_KEY)
  const parsedUser = user ? JSON.parse(user) : null
  const page = PAGE_TITLES[location.pathname] ?? { label: "Painel Técnico", sub: "PTL · Lifting Electric" }

  function handleNotificationClick() {
    if (notificationCount > 0) navigate("/tickets")
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--hairline)] bg-[#F7FAF8]/85 px-3 py-3 backdrop-blur-md sm:px-4 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 sm:gap-4">

        <div className="min-w-0">
          <h2 className="truncate text-base font-bold tracking-[-0.03em] text-[color:var(--foreground)] sm:text-lg lg:text-xl">
            {page.label}
          </h2>
          <p className="truncate text-xs text-[color:var(--muted-foreground)]">
            {page.sub}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleNotificationClick}
            className={`relative rounded-lg border border-[color:var(--hairline)] bg-white p-2 text-[#0B3D29] shadow-[var(--shadow-sm)] transition hover:border-[#00A859]/35 hover:bg-[color:var(--accent)] sm:p-2.5 ${notificationCount > 0 ? "cursor-pointer" : "cursor-default"}`}
            aria-label={`Notificações${notificationCount > 0 ? ` (${notificationCount})` : ""}`}
          >
            <Bell size={18} strokeWidth={2} />
            {notificationCount > 0 && (
              <span className="ls-num absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DC2626] px-0.5 text-[9px] font-bold text-white shadow-sm sm:h-[18px] sm:min-w-[18px] sm:px-1 sm:text-[10px]">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          <div className="hidden items-center gap-2.5 rounded-lg border border-[color:var(--hairline)] bg-white px-3 py-2 shadow-[var(--shadow-sm)] sm:flex">
            <UserCircle2 className="h-5 w-5 text-[#00A859]" strokeWidth={2} />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">{parsedUser?.sector || "Usuário"}</p>
              <p className="text-[11px] text-[color:var(--muted-foreground)]">Perfil ativo</p>
            </div>
          </div>
        </div>

      </div>
    </header>
  )
}
