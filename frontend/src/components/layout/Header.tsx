import { Bell, UserCircle2 } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface HeaderProps {
  notificationCount?: number
}

export function Header({ notificationCount = 0 }: HeaderProps) {
  const navigate = useNavigate()
  const user = localStorage.getItem("lifting-user")
  const parsedUser = user ? JSON.parse(user) : null

  const handleNotificationClick = () => {
    if (notificationCount > 0) navigate("/tickets")
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-slate-950 sm:text-lg">Painel Técnico</h2>
          <p className="hidden text-sm text-slate-500 sm:block">Operação de suporte interno</p>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <button
            onClick={handleNotificationClick}
            className={`relative rounded-2xl border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 ${notificationCount > 0 ? "cursor-pointer" : "cursor-default"}`}
          >
            <Bell size={19} />
            {notificationCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <UserCircle2 className="text-emerald-700" size={20} />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">{parsedUser?.sector || "Usuário"}</p>
              <p className="text-xs text-slate-500">Sessão ativa</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
