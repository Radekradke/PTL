import { Router } from "express"
import { prisma } from "../lib/prisma"
import { requireTechnical } from "../middlewares/auth.middleware"
import { validateId, TICKET_DEPARTMENTS } from "../lib/validation"

export const departmentEmailsRoutes = Router()

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidDepartment(value: unknown): value is string {
  return typeof value === "string" && (TICKET_DEPARTMENTS as readonly string[]).includes(value)
}

departmentEmailsRoutes.get("/", requireTechnical(["Admin"]), async (_req, res) => {
  const emails = await prisma.departmentEmail.findMany({
    orderBy: [{ department: "asc" }, { email: "asc" }],
  })
  res.json(emails)
})

departmentEmailsRoutes.post("/", requireTechnical(["Admin"]), async (req, res) => {
  const department = String(req.body?.department || "").trim()
  const email = String(req.body?.email || "").trim().toLowerCase()

  if (!isValidDepartment(department)) {
    return res.status(400).json({ message: "Departamento inválido. Use TI, RH ou Infraestrutura." })
  }

  if (!EMAIL_REGEX.test(email) || email.length > 160) {
    return res.status(400).json({ message: "E-mail inválido." })
  }

  try {
    const created = await prisma.departmentEmail.create({
      data: { department, email },
    })
    res.status(201).json(created)
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({ message: "Esse e-mail já está cadastrado para este departamento." })
    }
    console.error("Erro ao cadastrar e-mail de departamento:", error)
    res.status(500).json({ message: "Erro ao cadastrar e-mail." })
  }
})

departmentEmailsRoutes.delete("/:id", requireTechnical(["Admin"]), async (req, res) => {
  const idValidation = validateId(req.params.id, "E-mail")

  if (!idValidation.ok) {
    return res.status(400).json({ message: idValidation.message })
  }

  await prisma.departmentEmail.deleteMany({ where: { id: idValidation.value } })
  res.status(204).send()
})
