import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { useNotifications } from "@/contexts/NotificationContext"

interface Props {
  children: React.ReactNode
}

export function AppLayout({ children }: Props) {
  const { notificationCount } = useNotifications()

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header notificationCount={notificationCount} />

        <main className="flex-1 px-4 py-5 text-[15px] sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}