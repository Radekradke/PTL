import { Router } from "express"
import { prisma } from "../lib/prisma"
import { requireTechnical } from "../middlewares/auth.middleware"
import { validateId, validateName, validatePin } from "../lib/validation"

export const sectorsRoutes = Router()

type SectorRow = {
  id: number
  name: string
  color?: string | null
  active: boolean
  pin?: string | null
  createdAt: Date
  updatedAt: Date
}

const DEFAULT_SECTOR_COLOR = "#00A859"

// Aceita apenas cores hex no formato #RRGGBB; ausente/inválida cai no padrão.
function sanitizeColor(color: unknown) {
  if (typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color.trim())) {
    return color.trim().toUpperCase()
  }
  return DEFAULT_SECTOR_COLOR
}

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

function publicSector(sector: SectorRow) {
  return {
    ...sector,
    color: sector.color || DEFAULT_SECTOR_COLOR,
    pin: sector.pin || "",
  }
}

async function findSectorByName(name: string, includePin: boolean) {
  const sectors = includePin
    ? await prisma.$queryRaw<SectorRow[]>`
        SELECT "id", "name", "color", "active", "pin", "createdAt", "updatedAt"
        FROM "Sector"
        WHERE "name" = ${name}
        LIMIT 1
      `
    : await prisma.$queryRaw<SectorRow[]>`
        SELECT "id", "name", "color", "active", "createdAt", "updatedAt"
        FROM "Sector"
        WHERE "name" = ${name}
        LIMIT 1
      `

  return sectors[0] || null
}

sectorsRoutes.get("/", requireTechnical(["Admin", "TI", "RH", "Infraestrutura"]), async (_req, res) => {
  try {
    const hasPin = await sectorPinColumnExists()
    const sectors = hasPin
      ? await prisma.$queryRaw<SectorRow[]>`
          SELECT "id", "name", "color", "active", "pin", "createdAt", "updatedAt"
          FROM "Sector"
          WHERE "active" = true
          ORDER BY "name" ASC
        `
      : await prisma.$queryRaw<SectorRow[]>`
          SELECT "id", "name", "color", "active", "createdAt", "updatedAt"
          FROM "Sector"
          WHERE "active" = true
          ORDER BY "name" ASC
        `

    res.json(sectors.map(publicSector))
  } catch (error) {
    console.error("Erro ao listar setores:", error)
    res.status(500).json({ message: "Erro ao listar setores." })
  }
})

sectorsRoutes.post("/", requireTechnical(["Admin"]), async (req, res) => {
  try {
    const { name, pin, color } = req.body
    const sectorColor = sanitizeColor(color)
    const nameValidation = validateName(name, "Setor")

    if (!nameValidation.ok) {
      return res.status(400).json({ message: nameValidation.message })
    }

    const pinValidation = validatePin(pin)

    if (!pinValidation.ok) {
      return res.status(400).json({ message: pinValidation.message })
    }

    const hasPin = await sectorPinColumnExists()
    const existingSector = await findSectorByName(nameValidation.value, hasPin)

    if (existingSector?.active) {
      return res.status(409).json({ message: "Já existe um setor com esse nome." })
    }

    if (existingSector) {
      const sectors = hasPin
        ? await prisma.$queryRaw<SectorRow[]>`
            UPDATE "Sector"
            SET "active" = true, "color" = ${sectorColor}, "pin" = ${pinValidation.value}, "updatedAt" = CURRENT_TIMESTAMP
            WHERE "id" = ${existingSector.id}
            RETURNING "id", "name", "color", "active", "pin", "createdAt", "updatedAt"
          `
        : await prisma.$queryRaw<SectorRow[]>`
            UPDATE "Sector"
            SET "active" = true, "color" = ${sectorColor}, "updatedAt" = CURRENT_TIMESTAMP
            WHERE "id" = ${existingSector.id}
            RETURNING "id", "name", "color", "active", "createdAt", "updatedAt"
          `

      return res.status(200).json(publicSector(sectors[0]))
    }

    const sectors = hasPin
      ? await prisma.$queryRaw<SectorRow[]>`
          INSERT INTO "Sector" ("name", "color", "pin")
          VALUES (${nameValidation.value}, ${sectorColor}, ${pinValidation.value})
          RETURNING "id", "name", "color", "active", "pin", "createdAt", "updatedAt"
        `
      : await prisma.$queryRaw<SectorRow[]>`
          INSERT INTO "Sector" ("name", "color")
          VALUES (${nameValidation.value}, ${sectorColor})
          RETURNING "id", "name", "color", "active", "createdAt", "updatedAt"
        `

    res.status(201).json(publicSector(sectors[0]))
  } catch (error: any) {
    console.error("Erro ao criar setor:", error)

    if (error?.code === "P2002" || error?.meta?.code === "23505") {
      return res.status(409).json({ message: "Já existe um setor com esse nome." })
    }

    res.status(500).json({ message: "Erro ao criar setor." })
  }
})

sectorsRoutes.put("/:id", requireTechnical(["Admin"]), async (req, res) => {
  const { id } = req.params
  const { name, pin, color } = req.body
  const sectorColor = sanitizeColor(color)
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
    const sectors = hasPin
      ? await prisma.$queryRaw<SectorRow[]>`
          UPDATE "Sector"
          SET "name" = ${nameValidation.value}, "color" = ${sectorColor}, "pin" = ${pinValidation.value}, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${idValidation.value}
          RETURNING "id", "name", "color", "active", "pin", "createdAt", "updatedAt"
        `
      : await prisma.$queryRaw<SectorRow[]>`
          UPDATE "Sector"
          SET "name" = ${nameValidation.value}, "color" = ${sectorColor}, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${idValidation.value}
          RETURNING "id", "name", "color", "active", "createdAt", "updatedAt"
        `

    if (!sectors[0]) {
      return res.status(404).json({ message: "Setor não encontrado." })
    }

    res.json(publicSector(sectors[0]))
  } catch (error: any) {
    console.error("Erro ao salvar setor:", error)

    if (error?.code === "P2002" || error?.meta?.code === "23505") {
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

  const activeEmployeesResult = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS "count"
    FROM "Employee"
    WHERE "sectorId" = ${idValidation.value}
      AND "active" = true
  `
  const activeEmployees = Number(activeEmployeesResult[0]?.count || 0)

  if (activeEmployees > 0) {
    return res.status(409).json({
      message: "Esse setor possui funcionários ativos. Remaneje ou desative os funcionários antes.",
    })
  }

  await prisma.$executeRaw`
    UPDATE "Sector"
    SET "active" = false, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${idValidation.value}
  `

  res.status(204).send()
})
