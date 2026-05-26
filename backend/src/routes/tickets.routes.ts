import { Router } from "express"
import { prisma } from "../lib/prisma"
import {
  requireAuth,
  requireEmployeeOwnerOrTechnical,
  requireTechnical,
  requireTicketParticipant,
} from "../middlewares/auth.middleware"
import {
  validateId,
  validateLongText,
  validateTicketCategory,
  validateTicketOrigin,
  validateTicketStatus,
} from "../lib/validation"

export const ticketsRoutes = Router()

const sectorPublicSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
}

const ticketInclude = {
  employee: true,
  sector: { select: sectorPublicSelect },
  timeline: {
    orderBy: { createdAt: "asc" as const },
  },
  messages: {
    orderBy: { createdAt: "asc" as const },
  },
}

const ticketListInclude = {
  employee: true,
  sector: { select: sectorPublicSelect },
  timeline: {
    orderBy: { createdAt: "asc" as const },
  },
}

const ticketSummarySelect = {
  id: true,
  employee: true,
  sector: { select: sectorPublicSelect },
  category: true,
  status: true,
  origin: true,
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

function shouldArchiveStatus(status: string) {
  return status === "Finalizado"
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

  const employeeIdValidation = validateId(employeeId, "Funcionário")
  if (!employeeIdValidation.ok) {
    return res.status(400).json({ message: employeeIdValidation.message })
  }

  const categoryValidation = validateTicketCategory(category)
  if (!categoryValidation.ok) {
    return res.status(400).json({ message: categoryValidation.message })
  }

  const originValidation = validateTicketOrigin(origin)
  if (!originValidation.ok) {
    return res.status(400).json({ message: originValidation.message })
  }

  const descriptionValidation = validateLongText(description, "Descrição", 5, 2000)
  if (!descriptionValidation.ok) {
    return res.status(400).json({ message: descriptionValidation.message })
  }

  if (auth.type === "employee" && auth.employeeId !== employeeIdValidation.value) {
    return res.status(403).json({ message: "Funcionário sem permissão para abrir chamado em nome de outro usuário." })
  }

  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeIdValidation.value,
      active: true,
    },
    include: { sector: { select: sectorPublicSelect } },
  })

  if (!employee || !employee.sector.active) {
    return res.status(404).json({ message: "Funcionário ativo não encontrado." })
  }

  const ticket = await prisma.ticket.create({
    data: {
      employeeId: employee.id,
      sectorId: employee.sectorId,
      category: categoryValidation.value,
      origin: originValidation.value,
      description: descriptionValidation.value,
      timeline: {
        create: {
          action: "Chamado criado",
        },
      },
      messages: {
        create: {
          senderType: "employee",
          senderName: employee.name,
          message: descriptionValidation.value,
        },
      },
    },
    include: ticketInclude,
  })

  res.status(201).json(ticket)
})

ticketsRoutes.get("/:id/messages", requireTicketParticipant(["Admin", "TI", "Diretoria"]), async (req, res) => {
  const { id } = req.params
  const idValidation = validateId(id, "Chamado")

  if (!idValidation.ok) {
    return res.status(400).json({ message: idValidation.message })
  }

  const messages = await prisma.ticketMessage.findMany({
    where: {
      ticketId: idValidation.value,
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
  const idValidation = validateId(id, "Chamado")

  if (!idValidation.ok) {
    return res.status(400).json({ message: idValidation.message })
  }

  const messageValidation = validateLongText(message, "Mensagem", 1, 2000)
  if (!messageValidation.ok) {
    return res.status(400).json({ message: messageValidation.message })
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: idValidation.value },
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

    const employeeIdValidation = validateId(employeeId, "Funcionário")
    if (!employeeIdValidation.ok || employeeIdValidation.value !== ticket.employeeId) {
      return res.status(403).json({ message: "Este funcionário não tem permissão para responder este chamado." })
    }

    finalSenderName = ticket.employee.name
  }

  const nextStatus = nextStatusFromSender(normalizedSenderType)

  const createdMessage = await prisma.ticketMessage.create({
    data: {
      ticketId: idValidation.value,
      senderType: normalizedSenderType,
      senderName: finalSenderName,
      message: messageValidation.value,
    },
  })

  await prisma.ticket.update({
    where: { id: idValidation.value },
    data: {
      status: nextStatus,
      archived: shouldArchiveStatus(nextStatus),
      technicalResponse: normalizedSenderType === "technician" ? messageValidation.value : undefined,
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
  const idValidation = validateId(id, "Chamado")
  const statusValidation = validateTicketStatus(status)

  if (!idValidation.ok) {
    return res.status(400).json({ message: idValidation.message })
  }

  if (!statusValidation.ok) {
    return res.status(400).json({ message: statusValidation.message })
  }

  const ticket = await prisma.ticket.update({
    where: { id: idValidation.value },
    data: {
      status: statusValidation.value,
      archived: shouldArchiveStatus(statusValidation.value),
      timeline: {
        create: {
          action: `Status alterado para ${statusValidation.value}`,
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
  const idValidation = validateId(id, "Chamado")

  if (!idValidation.ok) {
    return res.status(400).json({ message: idValidation.message })
  }

  const responseValidation = validateLongText(technicalResponse, "Resposta técnica", 1, 2000)
  if (!responseValidation.ok) {
    return res.status(400).json({ message: responseValidation.message })
  }

  const ticket = await prisma.ticket.update({
    where: { id: idValidation.value },
    data: {
      technicalResponse: responseValidation.value,
      status: "Aguardando usuário",
      archived: false,
      timeline: {
        create: {
          action: "Resposta técnica adicionada",
        },
      },
      messages: {
        create: {
          senderType: "technician",
          senderName: "Técnico",
          message: responseValidation.value,
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
  const idValidation = validateId(id, "Chamado")
  const statusValidation = validateTicketStatus(status)

  if (!idValidation.ok) {
    return res.status(400).json({ message: idValidation.message })
  }

  if (!statusValidation.ok) {
    return res.status(400).json({ message: statusValidation.message })
  }

  const ticket = await prisma.ticket.update({
    where: { id: idValidation.value },
    data: {
      status: statusValidation.value,
      archived: shouldArchiveStatus(statusValidation.value),
      timeline: {
        create: {
          action: `Status alterado para ${statusValidation.value}`,
        },
      },
    },
    include: ticketInclude,
  })

  res.json(ticket)
})

ticketsRoutes.patch("/:id/archive", requireTechnical(["Admin", "TI"]), async (req, res) => {
  const { id } = req.params
  const idValidation = validateId(id, "Chamado")

  if (!idValidation.ok) {
    return res.status(400).json({ message: idValidation.message })
  }

  const ticket = await prisma.ticket.update({
    where: { id: idValidation.value },
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
  const idValidation = validateId(id, "Chamado")

  if (!idValidation.ok) {
    return res.status(400).json({ message: idValidation.message })
  }

  const ticket = await prisma.ticket.update({
    where: { id: idValidation.value },
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
