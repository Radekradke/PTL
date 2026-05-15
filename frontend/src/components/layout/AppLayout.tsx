import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { MobileBottomNav } from "./MobileBottomNav"
import { useNotifications } from "@/contexts/NotificationContext"

interface Props {
  children: React.ReactNode
}

export function AppLayout({ children }: Props) {
  const { notificationCount } = useNotifications()

  return (
    <div className="min-h-screen bg-[#F6FAF8] text-[#111827]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header notificationCount={notificationCount} />

          <main className="flex-1 overflow-y-auto px-3 pb-28 pt-4 sm:px-4 md:px-5 lg:px-6 lg:pb-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  )
}
