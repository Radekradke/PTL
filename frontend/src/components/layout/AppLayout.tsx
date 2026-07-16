import { useEffect } from "react"
import toast from "react-hot-toast"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { MobileBottomNav } from "./MobileBottomNav"
import { useNotifications } from "@/contexts/NotificationContext"
import { ensurePushSubscription, subscribeToPush } from "@/pwa"
import { getTechnicalToken } from "@/services/api"

interface Props {
  children: React.ReactNode
}

const PUSH_PROMPT_SHOWN_KEY = "lifting-push-prompt-shown"

// Mantém o push ativo para qualquer sessão técnica logada:
// - permissão já concedida → renova a inscrição silenciosamente;
// - permissão ainda não decidida → oferece ativação uma vez por sessão.
function usePushForActiveSession() {
  useEffect(() => {
    if (!getTechnicalToken()) return
    if (!("Notification" in window) || !("PushManager" in window)) return

    if (Notification.permission === "granted") {
      ensurePushSubscription()
      return
    }

    if (
      Notification.permission === "default" &&
      !sessionStorage.getItem(PUSH_PROMPT_SHOWN_KEY)
    ) {
      sessionStorage.setItem(PUSH_PROMPT_SHOWN_KEY, "1")

      toast(
        (t) => (
          <div className="flex items-center gap-3">
            <span className="text-sm">
              Ative as notificações para ser avisado de novos chamados.
            </span>
            <button
              onClick={() => {
                toast.dismiss(t.id)
                subscribeToPush()
              }}
              className="shrink-0 rounded-lg bg-[#00A859] px-3 py-1.5 text-xs font-bold text-white"
            >
              Ativar
            </button>
          </div>
        ),
        { icon: "🔔", duration: 10000 }
      )
    }
  }, [])
}

export function AppLayout({ children }: Props) {
  const { notificationCount } = useNotifications()

  usePushForActiveSession()

  return (
    <div className="min-h-screen bg-[#F6FAF8] text-[#111827]">
      <div className="flex min-h-screen min-w-0 flex-col lg:flex-row">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header notificationCount={notificationCount} />

          <main className="min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4 sm:px-4 md:px-5 lg:px-6 lg:pb-8">
            <div className="mx-auto w-full min-w-0 max-w-6xl">{children}</div>
          </main>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  )
}
