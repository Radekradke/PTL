import { Bell, UserCircle2 } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface HeaderProps { notificationCount?: number }

export function Header({ notificationCount = 0 }: HeaderProps) {
  const navigate = useNavigate()
  const user = localStorage.getItem("lifting-user")
  const parsedUser = user ? JSON.parse(user) : null

  function handleNotificationClick() {
    if (notificationCount > 0) navigate("/tickets")
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Lifting Support</p>
          <h2 className="truncate text-lg font-black tracking-[-0.04em] text-slate-950 sm:text-xl">Painel técnico</h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleNotificationClick}
            className={`relative rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 ${notificationCount > 0 ? "cursor-pointer" : "cursor-default"}`}
            aria-label="Notificações"
          >
            <Bell size={20} />
            {notificationCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-sm">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 sm:flex">
            <UserCircle2 className="text-blue-600" size={22} />
            <div className="text-right leading-tight">
              <p className="text-sm font-bold text-slate-950">{parsedUser?.sector || "Usuário"}</p>
              <p className="text-xs text-slate-500">Perfil ativo</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
