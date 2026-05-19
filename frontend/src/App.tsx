import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { TicketsPage } from "./pages/tickets/TicketsPage"
import { Dashboard } from "./pages/dashboard/Dashboard"
import { AdminPortal } from "./pages/auth/AdminPortal"
import { Login } from "./pages/auth/Login"
import { ReportsPage } from "@/pages/reports/ReportsPage"
import { SettingsPage } from "./pages/settings/SettingsPage"
import { NotificationProvider } from "./contexts/NotificationContext"
import { Toaster } from "react-hot-toast"
import { TECHNICAL_USER_KEY } from "@/services/api"

function getCurrentUser() {
  const stored = localStorage.getItem(TECHNICAL_USER_KEY)
  if (!stored) return null

  try {
    const user = JSON.parse(stored)
    return user?.token ? user : null
  } catch {
    return null
  }
}

function ProtectedRoute({
  children,
  allowed,
}: {
  children: ReactNode
  allowed: string[]
}) {
  const user = getCurrentUser()

  if (!user || !allowed.includes(user.sector)) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#18181b",
              color: "#fff",
              border: "1px solid #27272a",
            },
          }}
        />

        <Routes>
          <Route path="/" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowed={["Admin", "TI", "Diretoria"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tickets"
            element={
              <ProtectedRoute allowed={["Admin", "TI"]}>
                <TicketsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute allowed={["Admin", "TI", "Diretoria"]}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute allowed={["Admin"]}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route path="/portal" element={<AdminPortal />} />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  )
}

export default App
