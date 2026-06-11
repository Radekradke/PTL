import { Router } from "express"
import { prisma } from "../lib/prisma"
import { requireAuth } from "../middlewares/auth.middleware"
import { getVapidPublicKey } from "../services/pushNotification"

export const pushRoutes = Router()

pushRoutes.get("/vapid-public-key", (_req, res) => {
  const key = getVapidPublicKey()
  if (!key) return res.status(503).json({ message: "Push não configurado." })
  res.json({ publicKey: key })
})

pushRoutes.post("/subscribe", requireAuth, async (req, res) => {
  const { endpoint, keys } = req.body
  const auth = (req as any).auth

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ message: "Dados de subscription inválidos." })
  }

  const sector = auth.sector || "TI"

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { sector, p256dh: keys.p256dh, auth: keys.auth },
    create: { endpoint, sector, p256dh: keys.p256dh, auth: keys.auth },
  })

  res.status(201).json({ ok: true })
})

pushRoutes.delete("/unsubscribe", requireAuth, async (req, res) => {
  const { endpoint } = req.body
  if (!endpoint) return res.status(400).json({ message: "endpoint obrigatório." })

  await prisma.pushSubscription.deleteMany({ where: { endpoint } })
  res.json({ ok: true })
})
