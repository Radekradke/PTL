import { Router } from "express"
import { prisma } from "../lib/prisma"
import { requireTechnical } from "../middlewares/auth.middleware"
import { validateId, validateName } from "../lib/validation"

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
  try {
    const { name } = req.body
    const nameValidation = validateName(name, "Setor")

    if (!nameValidation.ok) {
      return res.status(400).json({ message: nameValidation.message })
    }

    const existingSector = await prisma.sector.findUnique({
      where: {
        name: nameValidation.value,
      },
    })

    if (existingSector?.active) {
      return res.status(409).json({ message: "Já existe um setor com esse nome." })
    }

    if (existingSector) {
      const sector = await prisma.sector.update({
        where: {
          id: existingSector.id,
        },
        data: {
          active: true,
        },
      })

      return res.status(200).json(sector)
    }

    const sector = await prisma.sector.create({
      data: {
        name: nameValidation.value,
      },
    })

    res.status(201).json(sector)
  } catch (error: any) {
    console.error("Erro ao criar setor:", error)

    if (error?.code === "P2002") {
      return res.status(409).json({ message: "Já existe um setor com esse nome." })
    }

    res.status(500).json({ message: "Erro ao criar setor." })
  }
})

sectorsRoutes.put("/:id", requireTechnical(["Admin"]), async (req, res) => {
  const { id } = req.params
  const { name } = req.body
  const idValidation = validateId(id, "Setor")
  const nameValidation = validateName(name, "Setor")

  if (!idValidation.ok) {
    return res.status(400).json({ message: idValidation.message })
  }

  if (!nameValidation.ok) {
    return res.status(400).json({ message: nameValidation.message })
  }

  const sector = await prisma.sector.update({
    where: { id: idValidation.value },
    data: {
      name: nameValidation.value,
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
