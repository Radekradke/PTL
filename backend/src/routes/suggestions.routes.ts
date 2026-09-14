import { Router } from "express"
import { prisma } from "../lib/prisma"
import { requireAuth, requireTechnical, requireEmployeeOwnerOrTechnical } from "../middlewares/auth.middleware"
import { validateId, validateLongText } from "../lib/validation"
import { validateAttachments, contentDispositionFor } from "../lib/attachments"

export const suggestionsRoutes = Router()

export const SUGGESTION_CATEGORIES = [
  "Sistema / Tecnologia",
  "Processo",
  "Equipamento",
  "Infraestrutura",
  "Segurança",
  "Comunicação",
  "Outro",
]

export const SUGGESTION_STATUSES = [
  "Nova",
  "Em análise",
  "Aprovada",
  "Planejada",
  "Implementada",
  "Não aprovada",
  "Adiada",
]

const attachmentMetaSelect = {
  id: true,
  suggestionId: true,
  filename: true,
  mimeType: true,
  size: true,
  createdAt: true,
}

function uploadedByFrom(auth: any): string {
  if (!auth) return "unknown"
  if (auth.type === "employee") return `employee:${auth.employeeId}`
  return `technician:${auth.sector || "tec"}`
}

/** Serializa uma sugestão para o admin, respeitando o anonimato. */
function toAdminView(s: any, includeInternal: boolean) {
  const view: any = {
    id: s.id,
    title: s.title,
    description: s.description,
    improvement: s.improvement,
    category: s.category,
    sectorName: s.sectorName,
    status: s.status,
    isAnonymous: s.isAnonymous,
    author: s.isAnonymous ? null : s.authorName,
    employeeId: s.isAnonymous ? null : s.employeeId,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    attachments: s.attachments || [],
  }
  if (includeInternal) view.internalNote = s.internalNote || ""
  return view
}

/** Serializa uma sugestão para o próprio funcionário (sem nota interna). */
function toEmployeeView(s: any) {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    improvement: s.improvement,
    category: s.category,
    sectorName: s.sectorName,
    status: s.status,
    isAnonymous: s.isAnonymous,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    attachments: s.attachments || [],
  }
}

// ── Criação (funcionário autenticado) ──
suggestionsRoutes.post("/", requireAuth, async (req, res) => {
  const auth = (req as any).auth

  if (!auth || auth.type !== "employee") {
    return res.status(403).json({ message: "Apenas funcionários podem enviar sugestões." })
  }

  const { title, description, improvement, category, sectorId, isAnonymous } = req.body

  const titleValidation = validateLongText(title, "Título", 3, 120)
  if (!titleValidation.ok) return res.status(400).json({ message: titleValidation.message })

  const descriptionValidation = validateLongText(description, "Descrição", 5, 4000)
  if (!descriptionValidation.ok) return res.status(400).json({ message: descriptionValidation.message })

  let improvementValue: string | null = null
  if (improvement !== undefined && improvement !== null && String(improvement).trim() !== "") {
    const improvementValidation = validateLongText(improvement, "Sugestão de melhoria", 0, 4000)
    if (!improvementValidation.ok) return res.status(400).json({ message: improvementValidation.message })
    improvementValue = improvementValidation.value
  }

  const categoryValue = String(category || "").trim()
  if (!SUGGESTION_CATEGORIES.includes(categoryValue)) {
    return res.status(400).json({ message: "Categoria inválida." })
  }

  const attachmentsValidation = validateAttachments(req.body.attachments)
  if (!attachmentsValidation.ok) return res.status(400).json({ message: attachmentsValidation.message })

  const employee = await prisma.employee.findFirst({
    where: { id: auth.employeeId, active: true },
    include: { sector: true },
  })
  if (!employee) return res.status(404).json({ message: "Funcionário não encontrado." })

  // Setor: por padrão o do funcionário; permite escolher outro ativo
  let sectorName: string | null = employee.sector?.name || null
  if (sectorId !== undefined && sectorId !== null && String(sectorId) !== "") {
    const sectorIdValidation = validateId(sectorId, "Setor")
    if (!sectorIdValidation.ok) return res.status(400).json({ message: sectorIdValidation.message })
    const chosen = await prisma.sector.findUnique({ where: { id: sectorIdValidation.value } })
    if (chosen) sectorName = chosen.name
  }

  const suggestion = await prisma.suggestion.create({
    data: {
      title: titleValidation.value,
      description: descriptionValidation.value,
      improvement: improvementValue,
      category: categoryValue,
      sectorId: employee.sectorId,
      sectorName,
      employeeId: employee.id, // mantido internamente mesmo se anônimo
      authorName: employee.name,
      isAnonymous: Boolean(isAnonymous),
      status: "Nova",
    },
  })

  if (attachmentsValidation.value.length > 0) {
    const uploadedBy = uploadedByFrom(auth)
    await prisma.suggestionAttachment.createMany({
      data: attachmentsValidation.value.map((attachment) => ({
        suggestionId: suggestion.id,
        uploadedBy,
        ...attachment,
      })),
    })
  }

  res.status(201).json({ id: suggestion.id })
})

// ── Lista para o admin (com filtros e busca) ──
suggestionsRoutes.get("/", requireTechnical(["Admin"]), async (req, res) => {
  const { status, category, sector, from, to, q } = req.query as Record<string, string>

  const where: any = {}
  if (status && SUGGESTION_STATUSES.includes(status)) where.status = status
  if (category && SUGGESTION_CATEGORIES.includes(category)) where.category = category
  if (sector) where.sectorName = sector
  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = new Date(from)
    if (to) {
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      where.createdAt.lte = end
    }
  }
  if (q && q.trim()) {
    where.OR = [
      { title: { contains: q.trim(), mode: "insensitive" } },
      { description: { contains: q.trim(), mode: "insensitive" } },
    ]
  }

  const suggestions = await prisma.suggestion.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { attachments: { where: { deletedAt: null }, select: attachmentMetaSelect } },
  })

  res.json(suggestions.map((s) => toAdminView(s, false)))
})

// ── Sugestões do próprio funcionário ("Minhas sugestões") ──
suggestionsRoutes.get(
  "/mine/:employeeId",
  requireEmployeeOwnerOrTechnical("employeeId"),
  async (req, res) => {
    const employeeIdValidation = validateId(req.params.employeeId, "Funcionário")
    if (!employeeIdValidation.ok) return res.status(400).json({ message: employeeIdValidation.message })

    const suggestions = await prisma.suggestion.findMany({
      where: { employeeId: employeeIdValidation.value },
      orderBy: { createdAt: "desc" },
      include: { attachments: { where: { deletedAt: null }, select: attachmentMetaSelect } },
    })

    res.json(suggestions.map(toEmployeeView))
  }
)

// ── Detalhe (admin) ──
suggestionsRoutes.get("/:id", requireTechnical(["Admin"]), async (req, res) => {
  const idValidation = validateId(req.params.id, "Sugestão")
  if (!idValidation.ok) return res.status(400).json({ message: idValidation.message })

  const suggestion = await prisma.suggestion.findUnique({
    where: { id: idValidation.value },
    include: { attachments: { where: { deletedAt: null }, select: attachmentMetaSelect } },
  })
  if (!suggestion) return res.status(404).json({ message: "Sugestão não encontrada." })

  res.json(toAdminView(suggestion, true))
})

// ── Atualização administrativa (status / nota interna) ──
suggestionsRoutes.patch("/:id", requireTechnical(["Admin"]), async (req, res) => {
  const idValidation = validateId(req.params.id, "Sugestão")
  if (!idValidation.ok) return res.status(400).json({ message: idValidation.message })

  const { status, internalNote } = req.body
  const data: any = {}

  if (status !== undefined) {
    if (!SUGGESTION_STATUSES.includes(String(status))) {
      return res.status(400).json({ message: "Status inválido." })
    }
    data.status = String(status)
  }

  if (internalNote !== undefined) {
    data.internalNote = String(internalNote).slice(0, 4000)
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: "Nada para atualizar." })
  }

  const suggestion = await prisma.suggestion.update({
    where: { id: idValidation.value },
    data,
    include: { attachments: { where: { deletedAt: null }, select: attachmentMetaSelect } },
  })

  res.json(toAdminView(suggestion, true))
})

// ── Servir anexo (admin ou o próprio autor) ──
suggestionsRoutes.get("/:id/attachments/:attachmentId", requireAuth, async (req, res) => {
  const idValidation = validateId(req.params.id, "Sugestão")
  const attachmentIdValidation = validateId(req.params.attachmentId, "Anexo")
  const auth = (req as any).auth

  if (!idValidation.ok) return res.status(400).json({ message: idValidation.message })
  if (!attachmentIdValidation.ok) return res.status(400).json({ message: attachmentIdValidation.message })

  const suggestion = await prisma.suggestion.findUnique({ where: { id: idValidation.value } })
  if (!suggestion) return res.status(404).json({ message: "Sugestão não encontrada." })

  const isAdmin = auth?.type === "technical" && auth?.sector === "Admin"
  const isOwner = auth?.type === "employee" && auth?.employeeId === suggestion.employeeId
  if (!isAdmin && !isOwner) {
    return res.status(403).json({ message: "Sem permissão para acessar este anexo." })
  }

  const attachment = await prisma.suggestionAttachment.findFirst({
    where: { id: attachmentIdValidation.value, suggestionId: idValidation.value, deletedAt: null },
  })
  if (!attachment) return res.status(404).json({ message: "Anexo não encontrado." })

  res.setHeader("Content-Type", attachment.mimeType)
  res.setHeader("Content-Disposition", contentDispositionFor(attachment.mimeType, attachment.filename))
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("Cache-Control", "private, max-age=86400")
  res.send(Buffer.from(attachment.data, "base64"))
})

// ── Remover anexo (somente admin) — remoção lógica ──
suggestionsRoutes.delete("/:id/attachments/:attachmentId", requireTechnical(["Admin"]), async (req, res) => {
  const idValidation = validateId(req.params.id, "Sugestão")
  const attachmentIdValidation = validateId(req.params.attachmentId, "Anexo")
  const auth = (req as any).auth

  if (!idValidation.ok) return res.status(400).json({ message: idValidation.message })
  if (!attachmentIdValidation.ok) return res.status(400).json({ message: attachmentIdValidation.message })

  const attachment = await prisma.suggestionAttachment.findFirst({
    where: { id: attachmentIdValidation.value, suggestionId: idValidation.value, deletedAt: null },
  })
  if (!attachment) return res.status(404).json({ message: "Anexo não encontrado." })

  await prisma.suggestionAttachment.update({
    where: { id: attachment.id },
    data: { deletedAt: new Date(), deletedBy: uploadedByFrom(auth) },
  })

  res.json({ ok: true })
})
