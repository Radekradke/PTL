import express from "express"
import cors from "cors"
import dotenv from "dotenv"

import { sectorsRoutes } from "./routes/sectors.routes"
import { employeesRoutes } from "./routes/employees.routes"
import { ticketsRoutes } from "./routes/tickets.routes"
import { authRoutes } from "./routes/auth.routes"
import { ouvidoriaRoutes } from "./routes/ouvidoria.routes"
import { assertAuthConfig } from "./lib/auth"
import { addSseClient } from "./lib/eventBus"

dotenv.config()
assertAuthConfig()

const app = express()
const isProduction = process.env.NODE_ENV === "production"
const configuredOrigins = String(process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
const allowedOrigins = isProduction
  ? configuredOrigins
  : [...configuredOrigins, "http://localhost:5173", "http://127.0.0.1:5173"]

if (isProduction && allowedOrigins.length === 0) {
  throw new Error("FRONTEND_URL deve ser configurado em produção.")
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error("Origem não permitida pelo CORS."))
    },
    credentials: true,
  })
)
app.use(express.json())

app.get("/", (_req, res) => {
  res.json({ message: "Lifting Support API online" })
})

app.get("/events", (_req, res) => {
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.flushHeaders()
  res.write(": connected\n\n")
  addSseClient(res)
})

app.use("/auth", authRoutes)
app.use("/sectors", sectorsRoutes)
app.use("/employees", employeesRoutes)
app.use("/tickets", ticketsRoutes)
app.use("/ouvidoria", ouvidoriaRoutes)

const PORT = process.env.PORT || 3333

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`)
})
