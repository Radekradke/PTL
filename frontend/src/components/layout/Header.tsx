import { Bell, UserCircle2 } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface HeaderProps {
  notificationCount?: number
}

export function Header({ notificationCount = 0 }: HeaderProps) {
  const navigate = useNavigate()
  const user = localStorage.getItem("lifting-user")
  const parsedUser = user ? JSON.parse(user) : null

  function handleNotificationClick() {
    if (notificationCount > 0) navigate("/tickets")
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#DDE8E2] bg-white/85 px-3 py-2 sm:px-4 sm:py-3 lg:px-8 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00A859]">
            Lifting Support
          </p>
          <h2 className="truncate text-base sm:text-lg lg:text-xl font-black tracking-[-0.035em] text-[#111827]">
            Painel técnico
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleNotificationClick}
            className={`relative rounded-lg sm:rounded-2xl border border-[#DDE8E2] bg-white p-2 sm:p-2.5 text-[#102A43] shadow-sm transition hover:border-[#00A859]/40 hover:bg-[#ECFBF3] ${notificationCount > 0 ? "cursor-pointer" : "cursor-default"}`}
            aria-label="Notificações"
          >
            <Bell size={18} className="sm:w-5 sm:h-5" />
            {notificationCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 sm:h-5 min-w-4 sm:min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-0.5 sm:px-1 text-[9px] sm:text-[10px] font-black text-white shadow-sm">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          <div className="hidden items-center gap-2 sm:gap-3 rounded-lg sm:rounded-2xl border border-[#DDE8E2] bg-white px-2 sm:px-3 py-1.5 sm:py-2 shadow-sm sm:flex">
            <UserCircle2 className="text-[#00A859] w-5 h-5 sm:w-6 sm:h-6" />
            <div className="text-right leading-tight hidden sm:block">
              <p className="text-xs sm:text-sm font-bold text-[#111827]">{parsedUser?.sector || "Usuário"}</p>
              <p className="text-[10px] sm:text-xs text-[#64748B]">Perfil ativo</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
