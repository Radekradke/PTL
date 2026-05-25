import { Router } from "express"
import { prisma } from "../lib/prisma"
import { requireTechnical } from "../middlewares/auth.middleware"
import { validateId, validateName, validatePin } from "../lib/validation"

export const sectorsRoutes = Router()

async function sectorPinColumnExists() {
  const result = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'Sector'
        AND column_name = 'pin'
    ) AS "exists"
  `

  return Boolean(result[0]?.exists)
}

function sectorSelect(includePin: boolean) {
  return {
    id: true,
    name: true,
    active: true,
    createdAt: true,
    updatedAt: true,
    ...(includePin ? { pin: true } : {}),
  }
}

sectorsRoutes.get("/", requireTechnical(["Admin", "TI", "Diretoria"]), async (_req, res) => {
  try {
    const hasPin = await sectorPinColumnExists()
    const sectors = await prisma.sector.findMany({
      where: {
        active: true,
      },
      orderBy: { name: "asc" },
      select: sectorSelect(hasPin),
    })

    res.json(sectors.map((sector) => ({ ...sector, pin: "pin" in sector ? sector.pin : "" })))
  } catch (error) {
    console.error("Erro ao listar setores:", error)
    res.status(500).json({ message: "Erro ao listar setores." })
  }
})

sectorsRoutes.post("/", requireTechnical(["Admin"]), async (req, res) => {
  try {
    const { name, pin } = req.body
    const nameValidation = validateName(name, "Setor")

    if (!nameValidation.ok) {
      return res.status(400).json({ message: nameValidation.message })
    }

    const pinValidation = validatePin(pin)

    if (!pinValidation.ok) {
      return res.status(400).json({ message: pinValidation.message })
    }

    const hasPin = await sectorPinColumnExists()
    const existingSector = await prisma.sector.findUnique({
      where: {
        name: nameValidation.value,
      },
      select: sectorSelect(hasPin),
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
          ...(hasPin ? { pin: pinValidation.value } : {}),
        },
        select: sectorSelect(hasPin),
      })

      return res.status(200).json(sector)
    }

    const sector = await prisma.sector.create({
      data: {
        name: nameValidation.value,
        ...(hasPin ? { pin: pinValidation.value } : {}),
      },
      select: sectorSelect(hasPin),
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

  try {
    const hasPin = await sectorPinColumnExists()
    const sector = await prisma.sector.update({
      where: { id: idValidation.value },
      data: {
        name: nameValidation.value,
        ...(hasPin ? { pin: pinValidation.value } : {}),
      },
      select: sectorSelect(hasPin),
    })

    res.json({ ...sector, pin: "pin" in sector ? sector.pin : "" })
  } catch (error: any) {
    console.error("Erro ao salvar setor:", error)

    if (error?.code === "P2002") {
      return res.status(409).json({ message: "Já existe um setor com esse nome." })
    }

    res.status(500).json({ message: "Erro ao salvar setor." })
  }
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
