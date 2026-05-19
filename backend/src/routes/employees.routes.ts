import { Router } from "express"
import { prisma } from "../lib/prisma"
import { hashPassword, signToken, verifyPassword } from "../lib/auth"
import { requireTechnical } from "../middlewares/auth.middleware"

export const employeesRoutes = Router()

function normalizeUsername(username?: string) {
  const normalized = String(username || "").trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

function publicEmployee(employee: any) {
  return {
    id: employee.id,
    name: employee.name,
    username: employee.username,
    sectorId: employee.sectorId,
    sector: employee.sector,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  }
}

employeesRoutes.get("/", requireTechnical(["Admin", "TI"]), async (_req, res) => {
  const employees = await prisma.employee.findMany({
    include: {
      sector: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  res.json(employees.map(publicEmployee))
})

employeesRoutes.post("/login", async (req, res) => {
  const { username, password } = req.body
  const normalizedUsername = normalizeUsername(username)

  if (!normalizedUsername || !String(password || "").trim()) {
    return res.status(400).json({ message: "Usuário e senha são obrigatórios." })
  }

  const employee = await prisma.employee.findUnique({
    where: {
      username: normalizedUsername,
    },
    include: {
      sector: true,
    },
  })

  const passwordCheck = employee ? verifyPassword(String(password), employee.passwordHash) : { valid: false }

  if (!employee || !passwordCheck.valid) {
    return res.status(401).json({ message: "Usuário ou senha inválidos." })
  }

  res.json({
    ...publicEmployee(employee),
    token: signToken({
      type: "employee",
      employeeId: employee.id,
      name: employee.name,
    }),
  })
})

employeesRoutes.post("/", requireTechnical(["Admin"]), async (req, res) => {
  try {
    const { name, sectorId, username, password } = req.body

    if (!name || !sectorId) {
      return res.status(400).json({ message: "Nome e setor são obrigatórios." })
    }

    const normalizedUsername = normalizeUsername(username)
    const hashedPassword = hashPassword(password)

    const employee = await prisma.employee.create({
      data: {
        name,
        sectorId: Number(sectorId),
        username: normalizedUsername || null,
        passwordHash: hashedPassword || null,
      },
      include: {
        sector: true,
      },
    })

    res.status(201).json(publicEmployee(employee))
  } catch (error: any) {
    console.error("Erro ao criar funcionário:", error)

    if (error?.code === "P2002") {
      return res.status(409).json({
        message: "Já existe um funcionário com esse usuário.",
      })
    }

    res.status(500).json({
      message: "Erro ao criar funcionário.",
    })
  }
})

employeesRoutes.put("/:id", requireTechnical(["Admin"]), async (req, res) => {
  const { id } = req.params
  const { name, sectorId, username, password } = req.body

  const data: any = {
    name,
    sectorId: Number(sectorId),
    username: normalizeUsername(username),
  }

  const passwordHash = hashPassword(password)
  if (passwordHash) {
    data.passwordHash = passwordHash
  }

  const employee = await prisma.employee.update({
    where: {
      id: Number(id),
    },
    data,
    include: {
      sector: true,
    },
  })

  res.json(publicEmployee(employee))
})

employeesRoutes.delete("/:id", requireTechnical(["Admin"]), async (req, res) => {
  const { id } = req.params

  await prisma.employee.delete({
    where: {
      id: Number(id),
    },
  })

  res.status(204).send()
})
