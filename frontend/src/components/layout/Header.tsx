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
    if (notificationCount > 0) {
      navigate('/tickets')
    }
  }

  return (
    <header className="h-20 border-b border-zinc-800 bg-zinc-900 px-6 flex items-center justify-between">

      <div>
        <h2 className="text-xl font-semibold text-white">
          Painel Técnico
        </h2>

        <p className="text-sm text-zinc-400">
          Gerencie chamados e suporte interno
        </p>
      </div>

      <div className="flex items-center gap-6">

        <button
          onClick={handleNotificationClick}
          className={`relative text-zinc-400 hover:text-white transition ${notificationCount > 0 ? 'cursor-pointer' : 'cursor-default'}`}
        >

          <Bell size={22} />

          {notificationCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-pulse">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}

        </button>

        <div className="flex items-center gap-3">

          <UserCircle2 className="text-zinc-400" />

          <div className="text-right">
            <p className="text-sm text-white font-medium">
              {parsedUser?.sector}
            </p>

            <p className="text-xs text-zinc-400">
              Usuário logado
            </p>
          </div>

        </div>

      </div>

    </header>
  )
}
