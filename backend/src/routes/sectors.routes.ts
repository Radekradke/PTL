import { Router } from "express"
import { prisma } from "../lib/prisma"
import { requireTechnical } from "../middlewares/auth.middleware"

export const sectorsRoutes = Router()

sectorsRoutes.get("/", requireTechnical(["Admin", "TI", "Diretoria"]), async (_req, res) => {
  const sectors = await prisma.sector.findMany({
    orderBy: { name: "asc" },
  })

  res.json(sectors)
})

sectorsRoutes.post("/", requireTechnical(["Admin"]), async (req, res) => {
  const { name, pin } = req.body

  const sector = await prisma.sector.create({
    data: { name, pin },
  })

  res.status(201).json(sector)
})

sectorsRoutes.put("/:id", requireTechnical(["Admin"]), async (req, res) => {
  const { id } = req.params
  const { name, pin } = req.body

  const sector = await prisma.sector.update({
    where: { id: Number(id) },
    data: { name, pin },
  })

  res.json(sector)
})

sectorsRoutes.delete("/:id", requireTechnical(["Admin"]), async (req, res) => {
  const { id } = req.params

  await prisma.sector.delete({
    where: { id: Number(id) },
  })

  res.status(204).send()
})
