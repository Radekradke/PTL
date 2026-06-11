import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { lazy, Suspense, type ReactNode } from "react"
import { Login } from "./pages/auth/Login"
import { NotificationProvider } from "./contexts/NotificationContext"
import { Toaster } from "react-hot-toast"
import { TECHNICAL_USER_KEY } from "@/services/api"

// Páginas pesadas carregadas sob demanda (code-splitting) — reduz o bundle inicial.
const TicketsPage = lazy(() => import("./pages/tickets/TicketsPage").then((m) => ({ default: m.TicketsPage })))
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard").then((m) => ({ default: m.Dashboard })))
const AdminPortal = lazy(() => import("./pages/auth/AdminPortal").then((m) => ({ default: m.AdminPortal })))
const ReportsPage = lazy(() => import("@/pages/reports/ReportsPage").then((m) => ({ default: m.ReportsPage })))
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })))

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EAF0ED]">
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#00A859]/25 border-t-[#00A859]" />
    </div>
  )
}

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

        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowed={["Admin", "TI", "RH", "Infraestrutura"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tickets"
              element={
                <ProtectedRoute allowed={["Admin", "TI", "RH", "Infraestrutura"]}>
                  <TicketsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute allowed={["Admin", "TI", "RH", "Infraestrutura"]}>
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
        </Suspense>
      </BrowserRouter>
    </NotificationProvider>
  )
}

export default App
