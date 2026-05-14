import { Router } from "express"
import { prisma } from "../lib/prisma"

export const ticketsRoutes = Router()

const ticketInclude = {
  employee: true,
  sector: true,
  timeline: {
    orderBy: { createdAt: "asc" as const },
  },
  messages: {
    orderBy: { createdAt: "asc" as const },
  },
}

function formatSenderType(senderType?: string) {
  return senderType === "employee" ? "employee" : "technician"
}

function nextStatusFromSender(senderType: string) {
  return senderType === "employee" ? "Em andamento" : "Aguardando usuário"
}

ticketsRoutes.get("/", async (_req, res) => {
  const tickets = await prisma.ticket.findMany({
    include: ticketInclude,
    orderBy: { createdAt: "desc" },
  })

  res.json(tickets)
})

ticketsRoutes.get("/employee/:employeeId", async (req, res) => {
  const { employeeId } = req.params

  const tickets = await prisma.ticket.findMany({
    where: {
      employeeId: Number(employeeId),
    },
    include: ticketInclude,
    orderBy: { createdAt: "desc" },
  })

  res.json(tickets)
})

ticketsRoutes.post("/", async (req, res) => {
  const { employeeId, category, origin, description } = req.body

  if (!employeeId || !category || !origin || !description) {
    return res.status(400).json({ message: "Funcionário, categoria, origem e descrição são obrigatórios." })
  }

  const employee = await prisma.employee.findUnique({
    where: { id: Number(employeeId) },
    include: { sector: true },
  })

  if (!employee) {
    return res.status(404).json({ message: "Funcionário não encontrado." })
  }

  const priority = origin === "Offshore" ? "Alta" : "Normal"

  const ticket = await prisma.ticket.create({
    data: {
      employeeId: employee.id,
      sectorId: employee.sectorId,
      category,
      origin,
      description,
      priority,
      timeline: {
        create: {
          action: "Chamado criado",
        },
      },
      messages: {
        create: {
          senderType: "employee",
          senderName: employee.name,
          message: description,
        },
      },
    },
    include: ticketInclude,
  })

  res.status(201).json(ticket)
})

ticketsRoutes.get("/:id/messages", async (req, res) => {
  const { id } = req.params

  const messages = await prisma.ticketMessage.findMany({
    where: {
      ticketId: Number(id),
    },
    orderBy: {
      createdAt: "asc",
    },
  })

  res.json(messages)
})

ticketsRoutes.post("/:id/messages", async (req, res) => {
  const { id } = req.params
  const { senderType, senderName, employeeId, message } = req.body

  if (!message || !String(message).trim()) {
    return res.status(400).json({ message: "A mensagem é obrigatória." })
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: Number(id) },
    include: { employee: true },
  })

  if (!ticket) {
    return res.status(404).json({ message: "Chamado não encontrado." })
  }

  const normalizedSenderType = formatSenderType(senderType)
  let finalSenderName = senderName || (normalizedSenderType === "employee" ? "Funcionário" : "Técnico")

  if (normalizedSenderType === "employee") {
    if (!employeeId || Number(employeeId) !== ticket.employeeId) {
      return res.status(403).json({ message: "Este funcionário não tem permissão para responder este chamado." })
    }

    finalSenderName = ticket.employee.name
  }

  const nextStatus = nextStatusFromSender(normalizedSenderType)

  const createdMessage = await prisma.ticketMessage.create({
    data: {
      ticketId: Number(id),
      senderType: normalizedSenderType,
      senderName: finalSenderName,
      message: String(message).trim(),
    },
  })

  await prisma.ticket.update({
    where: { id: Number(id) },
    data: {
      status: nextStatus,
      technicalResponse: normalizedSenderType === "technician" ? String(message).trim() : undefined,
      timeline: {
        create: {
          action:
            normalizedSenderType === "employee"
              ? "Funcionário respondeu ao chamado"
              : "Técnico respondeu ao chamado",
        },
      },
    },
  })

  res.status(201).json(createdMessage)
})

ticketsRoutes.patch("/:id/status", async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  if (!status) {
    return res.status(400).json({ message: "Status é obrigatório." })
  }

  const ticket = await prisma.ticket.update({
    where: { id: Number(id) },
    data: {
      status,
      timeline: {
        create: {
          action: `Status alterado para ${status}`,
        },
      },
    },
    include: ticketInclude,
  })

  res.json(ticket)
})

ticketsRoutes.patch("/:id/response", async (req, res) => {
  const { id } = req.params
  const { technicalResponse } = req.body

  if (!technicalResponse || !String(technicalResponse).trim()) {
    return res.status(400).json({ message: "A resposta técnica é obrigatória." })
  }

  const ticket = await prisma.ticket.update({
    where: { id: Number(id) },
    data: {
      technicalResponse: String(technicalResponse).trim(),
      status: "Aguardando usuário",
      timeline: {
        create: {
          action: "Resposta técnica adicionada",
        },
      },
      messages: {
        create: {
          senderType: "technician",
          senderName: "Técnico",
          message: String(technicalResponse).trim(),
        },
      },
    },
    include: ticketInclude,
  })

  res.json(ticket)
})

ticketsRoutes.patch("/:id", async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  const ticket = await prisma.ticket.update({
    where: { id: Number(id) },
    data: {
      status,
      timeline: {
        create: {
          action: `Status alterado para ${status}`,
        },
      },
    },
    include: ticketInclude,
  })

  res.json(ticket)
})
