import { Router } from "express"
import { getTechnicalCredentials, signToken } from "../lib/auth"
import { validatePin } from "../lib/validation"

export const authRoutes = Router()

authRoutes.post("/technical", (req, res) => {
  const { sector, pin } = req.body
  const normalizedSector = String(sector || "").trim()
  const pinValidation = validatePin(pin)
  const credentials = getTechnicalCredentials()

  if (!normalizedSector || !pinValidation.ok) {
    return res.status(400).json({ message: "Perfil e PIN são obrigatórios." })
  }

  if (!credentials[normalizedSector] || credentials[normalizedSector] !== pinValidation.value) {
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
