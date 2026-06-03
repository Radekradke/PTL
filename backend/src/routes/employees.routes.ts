import { Router } from "express"
import { prisma } from "../lib/prisma"
import { hashPassword, signToken, verifyPassword } from "../lib/auth"
import { requireTechnical } from "../middlewares/auth.middleware"
import { validateId, validateName, validatePassword, validateUsername } from "../lib/validation"

export const employeesRoutes = Router()

const sectorPublicSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
}

function publicEmployee(employee: any) {
  return {
    id: employee.id,
    name: employee.name,
    username: employee.username,
    active: employee.active,
    sectorId: employee.sectorId,
    sector: employee.sector,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  }
}

employeesRoutes.get("/", requireTechnical(["Admin", "TI"]), async (_req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        active: true,
        sectorId: true,
        sector: { select: sectorPublicSelect },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    res.json(employees.map(publicEmployee))
  } catch (error) {
    console.error("Erro ao listar funcionários:", error)
    res.status(500).json({ message: "Erro ao listar funcionários." })
  }
})

employeesRoutes.post("/login", async (req, res) => {
  const { username, password } = req.body
  const usernameValidation = validateUsername(username)

  if (!usernameValidation.ok || !String(password || "").trim()) {
    return res.status(400).json({ message: "Usuário e senha são obrigatórios." })
  }

  const employee = await prisma.employee.findUnique({
    where: {
      username: usernameValidation.value,
    },
    include: {
      sector: { select: sectorPublicSelect },
    },
  })

  const passwordCheck = employee ? verifyPassword(String(password), employee.passwordHash) : { valid: false }

  if (!employee || !employee.active || !employee.sector?.active || !passwordCheck.valid) {
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

    const nameValidation = validateName(name)
    if (!nameValidation.ok) {
      return res.status(400).json({ message: nameValidation.message })
    }

    const sectorIdValidation = validateId(sectorId, "Setor")
    if (!sectorIdValidation.ok) {
      return res.status(400).json({ message: sectorIdValidation.message })
    }

    const usernameValidation = validateUsername(username)
    if (!usernameValidation.ok) {
      return res.status(400).json({ message: usernameValidation.message })
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.ok) {
      return res.status(400).json({ message: passwordValidation.message })
    }

    const sector = await prisma.sector.findFirst({
      where: {
        id: sectorIdValidation.value,
        active: true,
      },
      select: {
        id: true,
      },
    })

    if (!sector) {
      return res.status(404).json({ message: "Setor ativo não encontrado." })
    }

    const employee = await prisma.employee.create({
      data: {
        name: nameValidation.value,
        sectorId: sectorIdValidation.value,
        username: usernameValidation.value,
        passwordHash: hashPassword(passwordValidation.value || ""),
      },
      include: {
        sector: { select: sectorPublicSelect },
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

  const idValidation = validateId(id, "Funcionário")
  if (!idValidation.ok) {
    return res.status(400).json({ message: idValidation.message })
  }

  const nameValidation = validateName(name)
  if (!nameValidation.ok) {
    return res.status(400).json({ message: nameValidation.message })
  }

  const sectorIdValidation = validateId(sectorId, "Setor")
  if (!sectorIdValidation.ok) {
    return res.status(400).json({ message: sectorIdValidation.message })
  }

  const usernameValidation = validateUsername(username)
  if (!usernameValidation.ok) {
    return res.status(400).json({ message: usernameValidation.message })
  }

  const passwordValidation = validatePassword(password, false)
  if (!passwordValidation.ok) {
    return res.status(400).json({ message: passwordValidation.message })
  }

  const sector = await prisma.sector.findFirst({
    where: {
      id: sectorIdValidation.value,
      active: true,
    },
    select: {
      id: true,
    },
  })

  if (!sector) {
    return res.status(404).json({ message: "Setor ativo não encontrado." })
  }

  const data: any = {
    name: nameValidation.value,
    sectorId: sectorIdValidation.value,
    username: usernameValidation.value,
  }

  const passwordHash = hashPassword(passwordValidation.value || "")
  if (passwordHash) {
    data.passwordHash = passwordHash
  }

  try {
    const employee = await prisma.employee.update({
      where: {
        id: idValidation.value,
      },
      data,
      include: {
        sector: { select: sectorPublicSelect },
      },
    })

    res.json(publicEmployee(employee))
  } catch (error: any) {
    console.error("Erro ao atualizar funcionário:", error)

    if (error?.code === "P2002") {
      return res.status(409).json({ message: "Já existe um funcionário com esse usuário." })
    }

    if (error?.code === "P2025") {
      return res.status(404).json({ message: "Funcionário não encontrado." })
    }

    res.status(500).json({ message: "Erro ao atualizar funcionário." })
  }
})

employeesRoutes.delete("/:id", requireTechnical(["Admin"]), async (req, res) => {
  const { id } = req.params
  const idValidation = validateId(id, "Funcionário")

  if (!idValidation.ok) {
    return res.status(400).json({ message: idValidation.message })
  }

  await prisma.employee.update({
    where: {
      id: idValidation.value,
    },
    data: {
      active: false,
    },
  })

  res.status(204).send()
})
