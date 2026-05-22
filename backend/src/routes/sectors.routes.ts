import { Router } from "express"
import { prisma } from "../lib/prisma"
import { requireTechnical } from "../middlewares/auth.middleware"
import { validateId, validateName, validatePin } from "../lib/validation"

export const sectorsRoutes = Router()

sectorsRoutes.get("/", requireTechnical(["Admin", "TI", "Diretoria"]), async (_req, res) => {
  const sectors = await prisma.sector.findMany({
    where: {
      active: true,
    },
    orderBy: { name: "asc" },
  })

  res.json(sectors)
})

sectorsRoutes.post("/", requireTechnical(["Admin"]), async (req, res) => {
  const { name, pin } = req.body
  const nameValidation = validateName(name, "Setor")
  const pinValidation = validatePin(pin)

  if (!nameValidation.ok) {
    return res.status(400).json({ message: nameValidation.message })
  }

  if (!pinValidation.ok) {
    return res.status(400).json({ message: pinValidation.message })
  }

  const sector = await prisma.sector.create({
    data: {
      name: nameValidation.value,
      pin: pinValidation.value,
    },
  })

  res.status(201).json(sector)
})

sectorsRoutes.put("/:id", requireTechnical(["Admin"]), async (req, res) => {
  const { id } = req.params
  const { name, pin } = req.body
  const idValidation = validateId(id, "Setor")
  const nameValidation = validateName(name, "Setor")
  const pinValidation = validatePin(pin)

  if (!idValidation.ok) {
    return res.status(400).json({ message: idValidation.message })
  }

  if (!nameValidation.ok) {
    return res.status(400).json({ message: nameValidation.message })
  }

  if (!pinValidation.ok) {
    return res.status(400).json({ message: pinValidation.message })
  }

  const sector = await prisma.sector.update({
    where: { id: idValidation.value },
    data: {
      name: nameValidation.value,
      pin: pinValidation.value,
    },
  })

  res.json(sector)
})

sectorsRoutes.delete("/:id", requireTechnical(["Admin"]), async (req, res) => {
  const { id } = req.params
  const idValidation = validateId(id, "Setor")

  if (!idValidation.ok) {
    return res.status(400).json({ message: idValidation.message })
  }

  const activeEmployees = await prisma.employee.count({
    where: {
      sectorId: idValidation.value,
      active: true,
    },
  })

  if (activeEmployees > 0) {
    return res.status(409).json({
      message: "Esse setor possui funcionários ativos. Remaneje ou desative os funcionários antes.",
    })
  }

  await prisma.sector.update({
    where: { id: idValidation.value },
    data: {
      active: false,
    },
  })

  res.status(204).send()
})
