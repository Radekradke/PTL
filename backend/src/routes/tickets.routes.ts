import { Router } from "express"
import { prisma } from "../lib/prisma"
import {
  requireAuth,
  requireEmployeeOwnerOrTechnical,
  requireTechnical,
  requireTicketParticipant,
} from "../middlewares/auth.middleware"

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

const ticketListInclude = {
  employee: true,
  sector: true,
  timeline: {
    orderBy: { createdAt: "asc" as const },
  },
}

const ticketSummarySelect = {
  id: true,
  employee: true,
  sector: true,
  category: true,
  status: true,
  origin: true,
  priority: true,
  description: true,
  technicalResponse: true,
  archived: true,
  createdAt: true,
}

function formatSenderType(senderType?: string) {
  return senderType === "employee" ? "employee" : "technician"
}

function nextStatusFromSender(senderType: string) {
  return senderType === "employee" ? "Em andamento" : "Aguardando usuário"
}

ticketsRoutes.get("/", requireTechnical(["Admin", "TI", "Diretoria"]), async (req, res) => {
  const { archived, includeArchived, summary } = req.query
  const showArchived = archived === "true"
  const shouldIncludeArchived = includeArchived === "true" || archived === "all"

  const query: any = {
    where: shouldIncludeArchived ? undefined : { archived: showArchived },
    orderBy: { createdAt: "desc" },
  }

  if (summary === "true") {
    query.select = ticketSummarySelect
  } else {
    query.include = ticketListInclude
  }

  const tickets = await prisma.ticket.findMany(query)

  res.json(tickets)
})

ticketsRoutes.get(
  "/employee/:employeeId",
  requireEmployeeOwnerOrTechnical("employeeId", ["Admin", "TI", "Diretoria"]),
  async (req, res) => {
    const { employeeId } = req.params
    const { archived, includeArchived, summary } = req.query
    const showArchived = archived === "true"
    const shouldIncludeArchived = includeArchived === "true" || archived === "all"

    const query: any = {
      where: {
        employeeId: Number(employeeId),
        ...(shouldIncludeArchived ? {} : { archived: showArchived }),
      },
      orderBy: { createdAt: "desc" },
    }

    if (summary === "true") {
      query.select = ticketSummarySelect
    } else {
      query.include = ticketListInclude
    }

    const tickets = await prisma.ticket.findMany(query)

    res.json(tickets)
  }
)

ticketsRoutes.post("/", requireAuth, async (req, res) => {
  const { employeeId, category, origin, description } = req.body
  const auth = (req as any).auth

  if (!employeeId || !category || !origin || !description) {
    return res.status(400).json({ message: "Funcionário, categoria, origem e descrição são obrigatórios." })
  }

  if (auth.type === "employee" && auth.employeeId !== Number(employeeId)) {
    return res.status(403).json({ message: "Funcionário sem permissão para abrir chamado em nome de outro usuário." })
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

ticketsRoutes.get("/:id/messages", requireTicketParticipant(["Admin", "TI", "Diretoria"]), async (req, res) => {
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

ticketsRoutes.post("/:id/messages", requireTicketParticipant(["Admin", "TI"]), async (req, res) => {
  const { id } = req.params
  const { senderType, senderName, employeeId, message } = req.body
  const auth = (req as any).auth

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
    if (auth.type === "employee" && auth.employeeId !== ticket.employeeId) {
      return res.status(403).json({ message: "Este funcionário não tem permissão para responder este chamado." })
    }

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

ticketsRoutes.patch("/:id/status", requireTechnical(["Admin", "TI"]), async (req, res) => {
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

ticketsRoutes.patch("/:id/response", requireTechnical(["Admin", "TI"]), async (req, res) => {
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

ticketsRoutes.patch("/:id", requireTechnical(["Admin", "TI"]), async (req, res) => {
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

ticketsRoutes.patch("/:id/archive", requireTechnical(["Admin", "TI"]), async (req, res) => {
  const { id } = req.params

  const ticket = await prisma.ticket.update({
    where: { id: Number(id) },
    data: {
      archived: true,
      timeline: {
        create: {
          action: "Chamado arquivado",
        },
      },
    },
    include: ticketInclude,
  })

  res.json(ticket)
})

ticketsRoutes.patch("/:id/finish", requireTicketParticipant(["Admin", "TI"]), async (req, res) => {
  const { id } = req.params

  const ticket = await prisma.ticket.update({
    where: { id: Number(id) },
    data: {
      status: "Finalizado",
      archived: true,
      timeline: {
        create: {
          action: "Chamado finalizado e arquivado",
        },
      },
    },
    include: ticketInclude,
  })

  res.json(ticket)
})
