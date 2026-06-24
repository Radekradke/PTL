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
  const page = PAGE_TITLES[location.pathname]

  function handleNotificationClick() {
    if (notificationCount > 0) navigate("/tickets")
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#DDE8E2] bg-white/88 px-3 py-2 backdrop-blur-xl sm:px-4 sm:py-3 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 sm:gap-4">

        <div className="min-w-0">
          {page ? (
            <>
              <p className="hidden text-[10px] font-black uppercase tracking-[0.18em] text-[#00A859] sm:block">
                {page.sub}
              </p>
              <h2 className="truncate text-sm font-black tracking-[-0.03em] text-[#111827] sm:text-lg sm:tracking-[-0.04em] lg:text-xl">
                {page.label}
              </h2>
            </>
          ) : (
            <>
              <p className="hidden text-[10px] font-black uppercase tracking-[0.18em] text-[#00A859] sm:block">
                PTL • Lifting Electric
              </p>
              <h2 className="truncate text-sm font-black tracking-[-0.025em] text-[#111827] sm:text-lg lg:text-xl">
                Painel Técnico Interno
              </h2>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleNotificationClick}
            className={`relative rounded-xl border border-[#DDE8E2] bg-white p-2 text-[#102A43] shadow-sm transition hover:border-[#00A859]/40 hover:bg-[#ECFBF3] sm:rounded-2xl sm:p-2.5 ${notificationCount > 0 ? "cursor-pointer" : "cursor-default"}`}
            aria-label="Notificações"
          >
            <Bell size={18} className="sm:h-5 sm:w-5" />
            {notificationCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF4444] px-0.5 text-[9px] font-black text-white shadow-sm sm:h-5 sm:min-w-5 sm:px-1 sm:text-[10px]">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          <div className="hidden items-center gap-2 rounded-lg border border-[#DDE8E2] bg-white px-2 py-1.5 shadow-sm sm:flex sm:gap-3 sm:rounded-2xl sm:px-3 sm:py-2">
            <UserCircle2 className="h-5 w-5 text-[#00A859] sm:h-6 sm:w-6" />
            <div className="hidden leading-tight sm:block">
              <p className="text-xs font-bold text-[#111827] sm:text-sm">{parsedUser?.sector || "Usuário"}</p>
              <p className="text-[10px] text-[#64748B] sm:text-xs">Perfil ativo</p>
            </div>
          </div>
        </div>

      </div>
    </header>
  )
}
