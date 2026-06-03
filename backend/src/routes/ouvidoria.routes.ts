import { Router } from "express"
import nodemailer from "nodemailer"
import { requireAuth } from "../middlewares/auth.middleware"

export const ouvidoriaRoutes = Router()

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.SMTP_USER,
    pass: (process.env.SMTP_PASS || "").replace(/\s/g, ""),
  },
  pool: true,
  maxConnections: 3,
})

function buildEmailHtml(name: string, sector: string, complaint: string) {
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
            <td style="padding:10px 14px;border:1px solid #DDE7E2;color:#111827;">${name}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;background:#F8FAF9;font-weight:bold;color:#00A859;text-transform:uppercase;font-size:11px;letter-spacing:0.08em;border:1px solid #DDE7E2;">Setor</td>
            <td style="padding:10px 14px;border:1px solid #DDE7E2;color:#111827;">${sector}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;background:#F8FAF9;font-weight:bold;color:#00A859;text-transform:uppercase;font-size:11px;letter-spacing:0.08em;border:1px solid #DDE7E2;vertical-align:top;">Denúncia</td>
            <td style="padding:10px 14px;border:1px solid #DDE7E2;color:#111827;white-space:pre-line;line-height:1.6;">${complaint}</td>
          </tr>
        </table>
      </div>
      <div style="padding:12px 28px 20px;border-top:1px solid #DDE7E2;">
        <p style="margin:0;font-size:11px;color:#9CA3AF;">Esta mensagem foi enviada automaticamente pelo sistema de Ouvidoria da Lifting.</p>
      </div>
    </div>
  `
}

ouvidoriaRoutes.post("/", requireAuth, async (req, res) => {
  const { name, sector, complaint } = req.body

  const cleanName = String(name || "").trim()
  const cleanSector = String(sector || "").trim()
  const cleanComplaint = String(complaint || "").trim()

  if (cleanName.length < 2) {
    return res.status(400).json({ message: "Nome inválido." })
  }
  if (cleanSector.length < 1) {
    return res.status(400).json({ message: "Setor inválido." })
  }
  if (cleanComplaint.length < 10) {
    return res.status(400).json({ message: "Descreva a denúncia com pelo menos 10 caracteres." })
  }

  const destinatario = process.env.OUVIDORIA_EMAIL
  if (!destinatario) {
    console.error("[Ouvidoria] OUVIDORIA_EMAIL não configurado.")
    return res.status(500).json({ message: "Ouvidoria não configurada. Contate o administrador." })
  }

  // Responde imediatamente — e-mail é enviado em background
  res.status(200).json({ message: "Denúncia registrada com sucesso." })

  transporter.sendMail({
    from: `"Ouvidoria Lifting" <${process.env.SMTP_USER}>`,
    to: destinatario,
    subject: `[Ouvidoria] ${cleanName} — ${cleanSector}`,
    html: buildEmailHtml(cleanName, cleanSector, cleanComplaint),
  }).then(() => {
    console.log(`[Ouvidoria] E-mail enviado para ${destinatario}`)
  }).catch((err: any) => {
    console.error("[Ouvidoria] Falha ao enviar e-mail:", err?.message || err)
  })
})
