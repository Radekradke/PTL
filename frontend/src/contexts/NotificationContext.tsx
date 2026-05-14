import { createContext, useContext, useState, useEffect, useRef } from "react"
import type { ReactNode } from "react"
import toast from "react-hot-toast"
import { API_URL } from "@/services/api"

interface NotificationContextType {
  tickets: any[]
  setTickets: (tickets: any[]) => void
  notificationCount: number
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<any[]>([])
  const previousTicketCount = useRef(0)

  const notificationCount = tickets.filter(ticket => ticket.status === "Aberto").length

  async function loadTickets() {
    try {
      const response = await fetch(`${API_URL}/tickets`)
      const data = await response.json()

      const formattedTickets = data.map((ticket: any) => ({
        id: ticket.id,
        user: ticket.employee?.name || "",
        sector: ticket.sector?.name || "",
        category: ticket.category,
        status: ticket.status,
        origin: ticket.origin,
        priority: ticket.priority,
        description: ticket.description,
        technicalResponse: ticket.technicalResponse || "",
        createdAt: new Date(ticket.createdAt).toLocaleString("pt-BR"),
      }))

      setTickets(formattedTickets)
    } catch (error) {
      console.error("Erro ao carregar tickets no provider:", error)
    }
  }

  useEffect(() => {
    loadTickets()
    const interval = setInterval(loadTickets, 10000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const currentOpenCount = tickets.filter(ticket => ticket.status === "Aberto").length

    // Se há mais tickets abertos que antes, mostrar notificação
    if (currentOpenCount > previousTicketCount.current && previousTicketCount.current > 0) {
      const newTickets = currentOpenCount - previousTicketCount.current
      toast.success(`🔔 ${newTickets} novo${newTickets > 1 ? 's' : ''} chamado${newTickets > 1 ? 's' : ''} ${newTickets > 1 ? 'recebido' : 'recebido'}!`, {
        icon: '🔔',
        duration: 5000,
      })
    }

    previousTicketCount.current = currentOpenCount
  }, [tickets])

  return (
    <NotificationContext.Provider value={{ tickets, setTickets, notificationCount }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}