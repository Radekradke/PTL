import express from "express"
import cors from "cors"
import dotenv from "dotenv"

import { sectorsRoutes } from "./routes/sectors.routes"
import { employeesRoutes } from "./routes/employees.routes"
import { ticketsRoutes } from "./routes/tickets.routes"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (_req, res) => {
  res.json({ message: "Lifting Support API online" })
})

app.use("/sectors", sectorsRoutes)
app.use("/employees", employeesRoutes)
app.use("/tickets", ticketsRoutes)

const PORT = process.env.PORT || 3333

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`)
})