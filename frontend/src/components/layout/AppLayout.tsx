import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { useNotifications } from "@/contexts/NotificationContext"

interface Props {
  children: React.ReactNode
}

export function AppLayout({ children }: Props) {
  const { notificationCount } = useNotifications()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(66,169,94,0.18),transparent_32%),linear-gradient(180deg,#DFF5E6_0%,#F2F2F2_44%,#F7FAF8_100%)] text-[#2B2B2B]">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header notificationCount={notificationCount} />

          <main className="flex-1 px-3 py-4 pb-28 text-[15px] sm:px-5 md:px-6 lg:px-8 lg:py-8 lg:pb-8 xl:px-10">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
