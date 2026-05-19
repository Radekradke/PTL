import { Router } from "express"
import { getTechnicalCredentials, signToken } from "../lib/auth"

export const authRoutes = Router()

authRoutes.post("/technical", (req, res) => {
  const { sector, pin } = req.body
  const normalizedSector = String(sector || "").trim()
  const credentials = getTechnicalCredentials()

  if (!normalizedSector || !pin) {
    return res.status(400).json({ message: "Perfil e PIN são obrigatórios." })
  }

  if (!credentials[normalizedSector] || credentials[normalizedSector] !== String(pin)) {
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
