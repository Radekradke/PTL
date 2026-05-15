import { Bell, UserCircle2 } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface HeaderProps {
  notificationCount?: number
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("lifting-user") || "null")
  } catch {
    return null
  }
}

export function Header({ notificationCount = 0 }: HeaderProps) {
  const navigate = useNavigate()
  const parsedUser = getCurrentUser()

  const handleNotificationClick = () => {
    if (notificationCount > 0) {
      navigate("/tickets")
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/85 px-3 py-3 backdrop-blur-xl sm:px-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/80 sm:text-xs">
            Lifting Support
          </p>
          <h2 className="truncate text-lg font-bold tracking-[-0.03em] text-white sm:text-xl lg:text-2xl">
            Painel Técnico
          </h2>
          <p className="hidden text-sm text-zinc-400 sm:block">
            Gerencie chamados e suporte interno
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <button
            onClick={handleNotificationClick}
            className={`relative rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-300 transition hover:border-sky-500/30 hover:text-white ${notificationCount > 0 ? "cursor-pointer" : "cursor-default"}`}
          >
            <Bell size={18} />
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-red-500/30">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          <div className="hidden items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 sm:flex">
            <UserCircle2 className="text-zinc-400" size={20} />
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{parsedUser?.sector || "Visitante"}</p>
              <p className="text-xs text-zinc-500">Usuário logado</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
