import { prisma } from "../lib/prisma"

const CATEGORY_REPLIES: Record<string, string> = {
  PC: "Chamado recebido. Enquanto aguarda o técnico: verifique se o equipamento está energizado e conectado à rede. Se aparecer código de erro na tela, anote-o para agilizar o diagnóstico.",
  Impressora:
    "Chamado recebido. Enquanto aguarda: confirme se há papel na bandeja e verifique os níveis de toner. Tente desligar e religar o equipamento.",
  Rede: "Chamado recebido. Enquanto aguarda: verifique se os cabos estão bem encaixados e tente reiniciar o roteador. Se só alguns dispositivos forem afetados, informe isso ao técnico.",
  Sistema:
    "Chamado recebido. Enquanto aguarda: anote o nome do sistema e o código de erro exibido. Não altere configurações nem tente reinstalar antes do atendimento.",
  "E-mail":
    "Chamado recebido. Enquanto aguarda: confirme se o problema ocorre em todos os dispositivos ou apenas em um, e se afeta somente o envio, o recebimento ou ambos.",
  Câmera:
    "Chamado recebido. Enquanto aguarda: verifique se a câmera está energizada e se o cabo de rede está conectado. Informe o número ou localização do equipamento se disponível.",
  Outro:
    "Chamado recebido. Nossa equipe irá analisar em breve. Se o problema se agravar antes do atendimento, adicione mais detalhes respondendo a este chamado.",
}

export async function sendAutoReply(ticketId: number, category: string): Promise<void> {
  const message = CATEGORY_REPLIES[category] ?? CATEGORY_REPLIES["Outro"]

  await prisma.ticketMessage.create({
    data: {
      ticketId,
      senderType: "bot",
      senderName: "Atendimento Automático",
      message,
    },
  })
}
