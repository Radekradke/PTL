import { createContext, useContext, useState, useEffect, useRef } from "react"
import type { ReactNode } from "react"
import toast from "react-hot-toast"
import { AUTH_CHANGED_EVENT, TECHNICAL_USER_KEY, apiFetch, getTechnicalToken } from "@/services/api"

interface NotificationContextType {
  tickets: any[]
  setTickets: (tickets: any[]) => void
  notificationCount: number
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<any[]>([])
  const previousTicketCount = useRef(0)

  const notificationCount = tickets.filter(ticket => ticket.status === "Aberto" && !ticket.archived).length

  async function loadTickets() {
    if (!getTechnicalToken()) {
      setTickets([])
      previousTicketCount.current = 0
      return
    }

    try {
      const response = await apiFetch("/tickets?includeArchived=true&summary=true")

      if (response.status === 401) {
        localStorage.removeItem(TECHNICAL_USER_KEY)
        setTickets([])
        previousTicketCount.current = 0
        window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
        return
      }

      if (!response.ok) {
        setTickets([])
        return
      }

      const data = await response.json()

      const formattedTickets = data.map((ticket: any) => ({
        id: ticket.id,
        user: ticket.employee?.name || "",
        sector: ticket.sector?.name || "",
        category: ticket.category,
        status: ticket.status,
        origin: ticket.origin,
        description: ticket.description,
        technicalResponse: ticket.technicalResponse || "",
        archived: ticket.archived || false,
        createdAt: new Date(ticket.createdAt).toLocaleString("pt-BR"),
      }))

      setTickets(formattedTickets)
    } catch (error) {
      console.error("Erro ao carregar tickets no provider:", error)
    }
  }

  useEffect(() => {
    loadTickets()
    const interval = setInterval(loadTickets, 30000)
    window.addEventListener(AUTH_CHANGED_EVENT, loadTickets)

    return () => {
      clearInterval(interval)
      window.removeEventListener(AUTH_CHANGED_EVENT, loadTickets)
    }
  }, [])

  useEffect(() => {
    const currentOpenCount = tickets.filter(ticket => ticket.status === "Aberto" && !ticket.archived).length

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
