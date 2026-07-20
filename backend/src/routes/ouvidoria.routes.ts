import { Router } from "express"
import { Resend } from "resend"
import { requireAuth } from "../middlewares/auth.middleware"
import { ouvidoriaLimiter } from "../lib/rateLimiter"

export const ouvidoriaRoutes = Router()

function escapeHtml(raw: string) {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

function buildEmailHtml(name: string, sector: string, complaint: string) {
  const safeName = escapeHtml(name)
  const safeSector = escapeHtml(sector)
  const safeComplaint = escapeHtml(complaint)
  const dataHora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#fff;border:1px solid #DDE7E2;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#073B2A,#00A859);padding:24px 28px;">
        <h2 style="color:#fff;margin:0;font-size:20px;">📋 Nova Denúncia — Ouvidoria</h2>
        <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:13px;">Recebido em ${dataHora}</p>
      </div>
      <div style="padding:24px 28px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:10px 14px;background:#F8FAF9;font-weight:bold;color:#00A859;text-transform:uppercase;font-size:11px;letter-spacing:0.08em;border:1px solid #DDE7E2;width:110px;">Nome</td>
            <td style="padding:10px 14px;border:1px solid #DDE7E2;color:#111827;">${safeName}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;background:#F8FAF9;font-weight:bold;color:#00A859;text-transform:uppercase;font-size:11px;letter-spacing:0.08em;border:1px solid #DDE7E2;">Setor</td>
            <td style="padding:10px 14px;border:1px solid #DDE7E2;color:#111827;">${safeSector}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;background:#F8FAF9;font-weight:bold;color:#00A859;text-transform:uppercase;font-size:11px;letter-spacing:0.08em;border:1px solid #DDE7E2;vertical-align:top;">Denúncia</td>
            <td style="padding:10px 14px;border:1px solid #DDE7E2;color:#111827;white-space:pre-line;line-height:1.6;">${safeComplaint}</td>
          </tr>
        </table>
      </div>
      <div style="padding:12px 28px 20px;border-top:1px solid #DDE7E2;">
        <p style="margin:0;font-size:11px;color:#9CA3AF;">Enviado automaticamente pelo sistema de Ouvidoria da Lifting.</p>
      </div>
    </div>
  `
}

ouvidoriaRoutes.post("/", ouvidoriaLimiter, requireAuth, async (req, res) => {
  const { name, sector, complaint } = req.body

  const cleanName = String(name || "").trim()
  const cleanSector = String(sector || "").trim()
  const cleanComplaint = String(complaint || "").trim()

  if (cleanName.length < 2 || cleanName.length > 80) return res.status(400).json({ message: "Nome inválido." })
  if (cleanSector.length < 1 || cleanSector.length > 80) return res.status(400).json({ message: "Setor inválido." })
  if (cleanComplaint.length < 10) return res.status(400).json({ message: "Descreva a denúncia com pelo menos 10 caracteres." })
  if (cleanComplaint.length > 4000) return res.status(400).json({ message: "Denúncia muito longa. Máximo de 4000 caracteres." })

  const apiKey = process.env.RESEND_API_KEY
  const destinatario = process.env.OUVIDORIA_EMAIL || "ouvidoria.lifting@gmail.com"

  if (!apiKey) {
    console.error("[Ouvidoria] RESEND_API_KEY não configurada.")
    return res.status(500).json({ message: "Ouvidoria não configurada. Contate o administrador." })
  }

  // Responde imediatamente — e-mail enviado em background
  res.status(200).json({ message: "Denúncia registrada com sucesso." })

  const resend = new Resend(apiKey)

  resend.emails.send({
    from: "Ouvidoria Lifting <onboarding@resend.dev>",
    to: [destinatario],
    subject: `[Ouvidoria] ${cleanName} — ${cleanSector}`,
    html: buildEmailHtml(cleanName, cleanSector, cleanComplaint),
  }).then((result) => {
    console.log("[Ouvidoria] E-mail enviado:", result?.data?.id)
  }).catch((err) => {
    console.error("[Ouvidoria] Falha ao enviar e-mail:", err?.message || err)
  })
})
