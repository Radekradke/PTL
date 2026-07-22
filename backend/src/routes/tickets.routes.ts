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
  validateTicketDepartment,
  validateTicketOrigin,
  validateTicketStatus,
} from "../lib/validation"
import { sendAutoReply } from "../services/autoReply"
import { broadcastTicketChange } from "../lib/eventBus"
import { sendPushToSector } from "../services/pushNotification"

export const ticketsRoutes = Router()

const sectorPublicSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
}

const employeePublicSelect = {
  id: true,
  name: true,
  username: true,
  active: true,
  sectorId: true,
  createdAt: true,
  updatedAt: true,
}

const attachmentMetaSelect = {
  id: true,
  ticketId: true,
  messageId: true,
  filename: true,
  mimeType: true,
  size: true,
  createdAt: true,
}

const ticketInclude = {
  employee: { select: employeePublicSelect },
  sector: { select: sectorPublicSelect },
  timeline: {
    orderBy: { createdAt: "asc" as const },
  },
  messages: {
    orderBy: { createdAt: "asc" as const },
    include: { attachments: { select: attachmentMetaSelect } },
  },
}

const ticketListInclude = {
  employee: { select: employeePublicSelect },
  sector: { select: sectorPublicSelect },
  timeline: {
    orderBy: { createdAt: "asc" as const },
  },
}

const ticketSummarySelect = {
  id: true,
  employee: { select: employeePublicSelect },
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

const ATTACHMENT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_ATTACHMENTS = 3
// ~3MB de imagem depois de decodificar o base64
const MAX_ATTACHMENT_BASE64_LENGTH = 4_200_000

type CleanAttachment = { filename: string; mimeType: string; data: string; size: number }

function validateAttachments(value: unknown): { ok: true; value: CleanAttachment[] } | { ok: false; message: string } {
  if (value === undefined || value === null) return { ok: true, value: [] }
  if (!Array.isArray(value)) return { ok: false, message: "Anexos inválidos." }
  if (value.length > MAX_ATTACHMENTS) return { ok: false, message: `Máximo de ${MAX_ATTACHMENTS} fotos por envio.` }

  const clean: CleanAttachment[] = []

  for (const item of value) {
    const mimeType = String(item?.mimeType || "")
    const data = String(item?.data || "")
    const filename = String(item?.filename || "foto.jpg").slice(0, 120)

    if (!ATTACHMENT_MIME_TYPES.includes(mimeType)) {
      return { ok: false, message: "Apenas imagens JPG, PNG ou WebP são permitidas." }
    }

    if (!data || data.length > MAX_ATTACHMENT_BASE64_LENGTH) {
      return { ok: false, message: "Cada foto deve ter no máximo 3MB." }
    }

    if (!/^[A-Za-z0-9+/=]+$/.test(data)) {
      return { ok: false, message: "Imagem inválida." }
    }

    clean.push({ filename, mimeType, data, size: Math.floor(data.length * 0.75) })
  }

  return { ok: true, value: clean }
}

ticketsRoutes.get("/", requireTechnical(["Admin", "TI", "RH", "Infraestrutura"]), async (req, res) => {
  const { archived, includeArchived, summary } = req.query
  const auth = (req as any).auth
  const showArchived = archived === "true"
  const shouldIncludeArchived = includeArchived === "true" || archived === "all"

  // Admin vê tudo; demais setores só veem os tickets do próprio department
  const departmentFilter = auth.sector !== "Admin" ? { department: auth.sector } : {}

  const query: any = {
    where: {
      ...departmentFilter,
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
})

ticketsRoutes.get(
  "/employee/:employeeId",
  requireEmployeeOwnerOrTechnical("employeeId", ["Admin", "TI", "RH", "Infraestrutura"]),
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
  const { employeeId, category, origin, description, department } = req.body
  const auth = (req as any).auth

  const employeeIdValidation = validateId(employeeId, "Funcionário")
  if (!employeeIdValidation.ok) {
    return res.status(400).json({ message: employeeIdValidation.message })
  }

  const departmentValidation = validateTicketDepartment(department)
  if (!departmentValidation.ok) {
    return res.status(400).json({ message: departmentValidation.message })
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

  const attachmentsValidation = validateAttachments(req.body.attachments)
  if (!attachmentsValidation.ok) {
    return res.status(400).json({ message: attachmentsValidation.message })
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
      department: departmentValidation.value,
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

  if (attachmentsValidation.value.length > 0) {
    const firstMessage = ticket.messages[0]
    await prisma.ticketAttachment.createMany({
      data: attachmentsValidation.value.map((attachment) => ({
        ticketId: ticket.id,
        messageId: firstMessage?.id,
        ...attachment,
      })),
    })
  }

  sendAutoReply(ticket.id, ticket.category).catch((err) => {
    console.error("Falha ao enviar resposta automática:", err)
  })

  sendPushToSector(ticket.department, {
    title: `Novo chamado · ${ticket.department}`,
    body: `${employee.name} (${employee.sector.name}): ${ticket.category} — ${ticket.description.slice(0, 80)}`,
    ticketId: ticket.id,
    url: "/tickets",
  }).catch((err) => console.error("Falha ao enviar push:", err))

  broadcastTicketChange()
  res.status(201).json(ticket)
})

ticketsRoutes.get("/:id/messages", requireTicketParticipant(["Admin", "TI", "RH", "Infraestrutura"]), async (req, res) => {
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
    include: { attachments: { select: attachmentMetaSelect } },
  })

  res.json(messages)
})

ticketsRoutes.get(
  "/:id/attachments/:attachmentId",
  requireTicketParticipant(["Admin", "TI", "RH", "Infraestrutura"]),
  async (req, res) => {
    const idValidation = validateId(req.params.id, "Chamado")
    const attachmentIdValidation = validateId(req.params.attachmentId, "Anexo")

    if (!idValidation.ok) {
      return res.status(400).json({ message: idValidation.message })
    }

    if (!attachmentIdValidation.ok) {
      return res.status(400).json({ message: attachmentIdValidation.message })
    }

    const attachment = await prisma.ticketAttachment.findFirst({
      where: {
        id: attachmentIdValidation.value,
        ticketId: idValidation.value,
      },
    })

    if (!attachment) {
      return res.status(404).json({ message: "Anexo não encontrado." })
    }

    res.setHeader("Content-Type", attachment.mimeType)
    res.setHeader("Cache-Control", "private, max-age=86400")
    res.send(Buffer.from(attachment.data, "base64"))
  }
)

ticketsRoutes.post("/:id/messages", requireTicketParticipant(["Admin", "TI", "RH", "Infraestrutura"]), async (req, res) => {
  const { id } = req.params
  const { senderType, senderName, employeeId, message } = req.body
  const auth = (req as any).auth
  const idValidation = validateId(id, "Chamado")

  if (!idValidation.ok) {
    return res.status(400).json({ message: idValidation.message })
  }

  const attachmentsValidation = validateAttachments(req.body.attachments)
  if (!attachmentsValidation.ok) {
    return res.status(400).json({ message: attachmentsValidation.message })
  }

  // Com fotos anexadas, o texto da mensagem é opcional
  const minMessageLength = attachmentsValidation.value.length > 0 ? 0 : 1
  const messageValidation = validateLongText(message, "Mensagem", minMessageLength, 2000)
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

  let createdAttachments: any[] = []
  if (attachmentsValidation.value.length > 0) {
    await prisma.ticketAttachment.createMany({
      data: attachmentsValidation.value.map((attachment) => ({
        ticketId: idValidation.value,
        messageId: createdMessage.id,
        ...attachment,
      })),
    })
    createdAttachments = await prisma.ticketAttachment.findMany({
      where: { messageId: createdMessage.id },
      select: attachmentMetaSelect,
    })
  }

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

  // Quando o funcionário responde, avisa a equipe técnica do setor (que é quem assina push)
  if (normalizedSenderType === "employee") {
    sendPushToSector(ticket.department, {
      title: `Nova resposta · ${ticket.department}`,
      body: `${ticket.employee.name} respondeu o chamado #${ticket.id} (${ticket.category}): ${messageValidation.value.slice(0, 80) || "📷 Foto anexada"}`,
      ticketId: ticket.id,
      url: "/tickets",
    }).catch((err) => console.error("Falha ao enviar push:", err))
  }

  broadcastTicketChange()
  res.status(201).json({ ...createdMessage, attachments: createdAttachments })
})

ticketsRoutes.patch("/:id/status", requireTechnical(["Admin", "TI", "RH", "Infraestrutura"]), async (req, res) => {
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

  broadcastTicketChange()
  res.json(ticket)
})

ticketsRoutes.patch("/:id/response", requireTechnical(["Admin", "TI", "RH", "Infraestrutura"]), async (req, res) => {
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

  broadcastTicketChange()
  res.json(ticket)
})

ticketsRoutes.patch("/:id", requireTechnical(["Admin", "TI", "RH", "Infraestrutura"]), async (req, res) => {
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

ticketsRoutes.patch("/:id/archive", requireTechnical(["Admin", "TI", "RH", "Infraestrutura"]), async (req, res) => {
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

ticketsRoutes.patch("/:id/finish", requireTicketParticipant(["Admin", "TI", "RH", "Infraestrutura"]), async (req, res) => {
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

  broadcastTicketChange()
  res.json(ticket)
})
