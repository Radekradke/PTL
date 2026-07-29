import { Resend } from "resend"
import { prisma } from "../lib/prisma"

function escapeHtml(raw: string) {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

function departmentLabel(department: string) {
  if (department === "TI") return "Setor TI"
  if (department === "RH") return "Setor RH"
  if (department === "Infraestrutura") return "Infraestrutura"
  return department
}

function buildEmailHtml(params: {
  ticketId: number
  department: string
  employeeName: string
  sectorName: string
  category: string
  origin: string
  description: string
}) {
  const dataHora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
  const rows: [string, string][] = [
    ["Chamado", `#${params.ticketId}`],
    ["Solicitante", params.employeeName],
    ["Setor do solicitante", params.sectorName],
    ["Categoria", params.category],
    ["Origem", params.origin],
  ]

  const rowsHtml = rows
    .map(
      ([label, value]) => `
          <tr>
            <td style="padding:10px 14px;background:#F8FAF9;font-weight:bold;color:#00A859;text-transform:uppercase;font-size:11px;letter-spacing:0.08em;border:1px solid #DDE7E2;width:170px;">${escapeHtml(label)}</td>
            <td style="padding:10px 14px;border:1px solid #DDE7E2;color:#111827;">${escapeHtml(value)}</td>
          </tr>`
    )
    .join("")

  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#fff;border:1px solid #DDE7E2;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#073B2A,#00A859);padding:24px 28px;">
        <h2 style="color:#fff;margin:0;font-size:20px;">📋 Novo chamado — ${escapeHtml(departmentLabel(params.department))}</h2>
        <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:13px;">Aberto em ${dataHora}</p>
      </div>
      <div style="padding:24px 28px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          ${rowsHtml}
          <tr>
            <td style="padding:10px 14px;background:#F8FAF9;font-weight:bold;color:#00A859;text-transform:uppercase;font-size:11px;letter-spacing:0.08em;border:1px solid #DDE7E2;vertical-align:top;">Descrição</td>
            <td style="padding:10px 14px;border:1px solid #DDE7E2;color:#111827;white-space:pre-line;line-height:1.6;">${escapeHtml(params.description)}</td>
          </tr>
        </table>
      </div>
      <div style="padding:12px 28px 20px;border-top:1px solid #DDE7E2;">
        <p style="margin:0;font-size:11px;color:#9CA3AF;">Enviado automaticamente pelo sistema de chamados da Lifting.</p>
      </div>
    </div>
  `
}

// Avisa por e-mail o(s) responsável(is) cadastrado(s) para o departamento do chamado.
// Roda em background — falhas são apenas logadas para não travar a criação do chamado.
export async function sendTicketOpenedEmail(params: {
  ticketId: number
  department: string
  employeeName: string
  sectorName: string
  category: string
  origin: string
  description: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const recipients = await prisma.departmentEmail.findMany({
    where: { department: params.department },
    select: { email: true },
  })

  const to = recipients.map((recipient) => recipient.email)
  if (to.length === 0) return

  const resend = new Resend(apiKey)

  const result = await resend.emails.send({
    from: "Chamados Lifting <onboarding@resend.dev>",
    to,
    subject: `[Chamado #${params.ticketId}] ${params.category} — ${departmentLabel(params.department)}`,
    html: buildEmailHtml(params),
  })

  console.log(`[TicketEmail] Chamado #${params.ticketId} notificado a ${to.length} e-mail(s):`, result?.data?.id)
}
