import { Router } from "express"
import { getTechnicalCredentials, signToken } from "../lib/auth"
import { validatePin } from "../lib/validation"
import { loginLimiter } from "../lib/rateLimiter"
import { timingSafeEqual } from "crypto"

export const authRoutes = Router()

authRoutes.post("/technical", loginLimiter, (req, res) => {
  const { sector, pin } = req.body
  const normalizedSector = String(sector || "").trim()
  const pinValidation = validatePin(pin)
  const credentials = getTechnicalCredentials()

  if (!normalizedSector || !pinValidation.ok) {
    return res.status(400).json({ message: "Perfil e PIN são obrigatórios." })
  }

  const expectedPin = credentials[normalizedSector]
  const providedPin = pinValidation.value

  const pinMatch =
    expectedPin &&
    expectedPin.length === providedPin.length &&
    timingSafeEqual(Buffer.from(expectedPin), Buffer.from(providedPin))

  if (!pinMatch) {
    return res.status(401).json({ message: "PIN inválido." })
  }

  res.json({
    token: signToken({
      type: "technical",
      sector: normalizedSector,
    }),
    user: {
      sector: normalizedSector,
      type: "technical",
    },
  })
})
