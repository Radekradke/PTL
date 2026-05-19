import type { NextFunction, Request, Response } from "express"
import { prisma } from "../lib/prisma"
import { verifyToken } from "../lib/auth"

function getBearerToken(req: Request) {
  const authorization = req.headers.authorization
  if (!authorization?.startsWith("Bearer ")) return null

  return authorization.slice("Bearer ".length)
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const payload = verifyToken(getBearerToken(req) || undefined)

  if (!payload) {
    return res.status(401).json({ message: "Acesso não autorizado." })
  }

  ;(req as any).auth = payload
  next()
}

export function requireTechnical(allowedSectors: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const payload = verifyToken(getBearerToken(req) || undefined)

    if (!payload || payload.type !== "technical") {
      return res.status(401).json({ message: "Acesso técnico obrigatório." })
    }

    if (allowedSectors.length > 0 && !allowedSectors.includes(payload.sector || "")) {
      return res.status(403).json({ message: "Perfil sem permissão para esta ação." })
    }

    ;(req as any).auth = payload
    next()
  }
}

export function requireEmployeeOwnerOrTechnical(paramName = "employeeId", allowedSectors: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const payload = verifyToken(getBearerToken(req) || undefined)

    if (!payload) {
      return res.status(401).json({ message: "Acesso não autorizado." })
    }

    if (payload.type === "technical") {
      if (allowedSectors.length > 0 && !allowedSectors.includes(payload.sector || "")) {
        return res.status(403).json({ message: "Perfil sem permissão para esta ação." })
      }

      ;(req as any).auth = payload
      return next()
    }

    const employeeId = Number(req.params[paramName] || req.body.employeeId)
    if (payload.type !== "employee" || payload.employeeId !== employeeId) {
      return res.status(403).json({ message: "Funcionário sem permissão para este recurso." })
    }

    ;(req as any).auth = payload
    next()
  }
}

export function requireTicketParticipant(allowedSectors: string[] = []) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const payload = verifyToken(getBearerToken(req) || undefined)

    if (!payload) {
      return res.status(401).json({ message: "Acesso não autorizado." })
    }

    if (payload.type === "technical") {
      if (allowedSectors.length > 0 && !allowedSectors.includes(payload.sector || "")) {
        return res.status(403).json({ message: "Perfil sem permissão para esta ação." })
      }

      ;(req as any).auth = payload
      return next()
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(req.params.id) },
      select: { employeeId: true },
    })

    if (!ticket) {
      return res.status(404).json({ message: "Chamado não encontrado." })
    }

    if (payload.type !== "employee" || payload.employeeId !== ticket.employeeId) {
      return res.status(403).json({ message: "Funcionário sem permissão para este chamado." })
    }

    ;(req as any).auth = payload
    next()
  }
}
