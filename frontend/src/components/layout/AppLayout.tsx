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
    <div className="min-h-screen bg-[#F4F7F5] text-[#17221C]">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header notificationCount={notificationCount} />

          <main className="flex-1 px-3 pb-24 pt-4 sm:px-5 md:px-6 lg:px-8 lg:pb-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  )
}
