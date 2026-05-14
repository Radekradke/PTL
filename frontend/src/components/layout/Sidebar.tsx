import {
  LayoutDashboard,
  Ticket,
  FileText,
  Settings,
  LogOut,
} from "lucide-react"

import { useNavigate, useLocation } from "react-router-dom"

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const user = JSON.parse(
    localStorage.getItem("lifting-user") || "{}"
  )

  const role = user?.sector || ""

  function handleLogout() {
    localStorage.removeItem("lifting-user")
    navigate("/")
  }

  function isActive(path: string) {
    return location.pathname === path
  }

  function getButtonClass(path: string) {
    return `
      w-full flex items-center gap-3 rounded-2xl p-3 text-sm font-semibold transition
      ${
        isActive(path)
          ? "bg-sky-600 text-white shadow-lg shadow-sky-500/20"
          : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
      }
    `
  }

  return (
   <aside className="w-64 min-h-screen border-r border-zinc-800 bg-zinc-900 p-4 text-zinc-100">
    
      <div>
        <div className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-[-0.04em] text-white">
                Lifting
              </h1>

              <p className="text-sm font-medium tracking-wide text-zinc-400">
                Painel de Suporte
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Perfil logado
            </p>

            <p className="mt-1 text-sm font-semibold text-sky-300">
              {role}
            </p>
          </div>
        </div>

        <nav className="space-y-2">

          {["Admin", "TI", "Diretoria"].includes(role) && (
            <button
              onClick={() => navigate("/dashboard")}
              className={getButtonClass("/dashboard")}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
          )}

          {["Admin", "TI"].includes(role) && (
            <button
              onClick={() => navigate("/tickets")}
              className={getButtonClass("/tickets")}
            >
              <Ticket size={18} />
              Chamados
            </button>
          )}

          {["Admin", "TI", "Diretoria"].includes(role) && (
            <button
              onClick={() => navigate("/reports")}
              className={getButtonClass("/reports")}
            >
              <FileText size={18} />
              Relatórios
            </button>
          )}

          {["Admin"].includes(role) && (
            <button
              onClick={() => navigate("/settings")}
              className={getButtonClass("/settings")}
            >
              <Settings size={18} />
              Configurações
            </button>
          )}
        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="mt-10 flex w-full items-center gap-3 rounded-2xl p-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
      >
        <LogOut size={18} />
        Sair
      </button>
    </aside>
  )
}