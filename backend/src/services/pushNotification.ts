import webpush from "web-push"
import { prisma } from "../lib/prisma"

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || ""
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || ""
const VAPID_EMAIL   = process.env.VAPID_EMAIL       || "mailto:admin@lifting.com.br"

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)
}

export function getVapidPublicKey() {
  return VAPID_PUBLIC
}

export async function sendPushToSector(department: string, payload: object) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return

  // Admin recebe notificações de todos os setores também
  const subs = await prisma.pushSubscription.findMany({
    where: { sector: { in: [department, "Admin"] } },
  })

  const data = JSON.stringify(payload)

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          data
        )
      } catch (err: any) {
        // Subscription expirada ou inválida — remove do banco
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        }
      }
    })
  )
}
