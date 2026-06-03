import { createContext, useContext, useState, useEffect, useRef } from "react"
import type { ReactNode } from "react"
import toast from "react-hot-toast"
import { API_URL, AUTH_CHANGED_EVENT, TECHNICAL_USER_KEY, apiFetch, getTechnicalToken } from "@/services/api"

export const TICKETS_CHANGED_EVENT = "tickets:changed"

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

    // SSE — tempo real
    const source = new EventSource(`${API_URL}/events`)

    source.addEventListener("ticket:changed", () => {
      loadTickets()
      window.dispatchEvent(new Event(TICKETS_CHANGED_EVENT))
    })

    // Fallback polling a cada 60s caso SSE caia
    const fallback = setInterval(loadTickets, 60_000)

    window.addEventListener(AUTH_CHANGED_EVENT, loadTickets)

    return () => {
      source.close()
      clearInterval(fallback)
      window.removeEventListener(AUTH_CHANGED_EVENT, loadTickets)
    }
  }, [])

  useEffect(() => {
    const currentOpenCount = tickets.filter(ticket => ticket.status === "Aberto" && !ticket.archived).length

    if (currentOpenCount > previousTicketCount.current && previousTicketCount.current > 0) {
      const newTickets = currentOpenCount - previousTicketCount.current
      toast.success(`${newTickets} novo${newTickets > 1 ? "s" : ""} chamado${newTickets > 1 ? "s" : ""} recebido${newTickets > 1 ? "s" : ""}!`, {
        icon: "🔔",
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
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
