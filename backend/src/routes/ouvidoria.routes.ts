import { Router } from "express"
import nodemailer from "nodemailer"
import { requireAuth } from "../middlewares/auth.middleware"

export const ouvidoriaRoutes = Router()

ouvidoriaRoutes.post("/", requireAuth, async (req, res) => {
  const { name, sector, complaint } = req.body

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ message: "Nome inválido." })
  }

  if (!sector || typeof sector !== "string" || sector.trim().length < 1) {
    return res.status(400).json({ message: "Setor inválido." })
  }

  if (!complaint || typeof complaint !== "string" || complaint.trim().length < 10) {
    return res.status(400).json({ message: "Descreva a denúncia com pelo menos 10 caracteres." })
  }

  const destinatario = process.env.OUVIDORIA_EMAIL
  if (!destinatario) {
    console.error("OUVIDORIA_EMAIL não configurado no .env")
    return res.status(500).json({ message: "Ouvidoria não configurada. Contate o administrador." })
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const dataHora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #DDE7E2;border-radius:12px;">
      <h2 style="color:#073B2A;margin-bottom:24px;">📋 Nova Denúncia — Ouvidoria</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="background:#F8FAF9;">
          <th style="text-align:left;padding:10px 14px;color:#00A859;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;border:1px solid #DDE7E2;width:120px;">Nome</th>
          <td style="padding:10px 14px;border:1px solid #DDE7E2;color:#111827;">${name.trim()}</td>
        </tr>
        <tr>
          <th style="text-align:left;padding:10px 14px;color:#00A859;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;border:1px solid #DDE7E2;">Setor</th>
          <td style="padding:10px 14px;border:1px solid #DDE7E2;color:#111827;">${sector.trim()}</td>
        </tr>
        <tr style="background:#F8FAF9;">
          <th style="text-align:left;padding:10px 14px;color:#00A859;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;border:1px solid #DDE7E2;vertical-align:top;">Denúncia</th>
          <td style="padding:10px 14px;border:1px solid #DDE7E2;color:#111827;white-space:pre-line;">${complaint.trim()}</td>
        </tr>
      </table>
      <p style="margin-top:20px;font-size:12px;color:#6B7280;">Enviado em: ${dataHora}</p>
    </div>
  `

  try {
    await transporter.sendMail({
      from: `"Ouvidoria Lifting" <${process.env.SMTP_USER}>`,
      to: destinatario,
      subject: `[Ouvidoria] Denúncia de ${name.trim()} — ${sector.trim()}`,
      html,
    })

    res.status(200).json({ message: "Denúncia enviada com sucesso." })
  } catch (error) {
    console.error("Erro ao enviar e-mail de ouvidoria:", error)
    res.status(500).json({ message: "Erro ao enviar a denúncia. Tente novamente mais tarde." })
  }
})
