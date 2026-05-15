import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { useNotifications } from "@/contexts/NotificationContext"

interface Props {
  children: React.ReactNode
}

export function AppLayout({ children }: Props) {
  const { notificationCount } = useNotifications()

  return (
    <div className="min-h-screen bg-[#F5F7F5] text-slate-900">
      <Sidebar />

      <div className="min-h-screen lg:pl-72">
        <Header notificationCount={notificationCount} />

        <main className="px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
