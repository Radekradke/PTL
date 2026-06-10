export type TicketDepartment = "TI" | "RH" | "Infraestrutura"

export const categoriesByDepartment: Record<TicketDepartment, string[]> = {
  TI: ["PC", "Impressora", "Rede", "Sistema", "E-mail", "Câmera", "Outro"],
  RH: [
    "Plano de Saúde",
    "Salário",
    "Férias",
    "Benefícios",
    "Contratação",
    "Demissão",
    "Treinamento",
    "Ponto / Frequência",
    "Outro",
  ],
  Infraestrutura: [
    "Elétrica",
    "Hidráulica",
    "Ar Condicionado",
    "Segurança",
    "Limpeza",
    "Obras / Reformas",
    "Equipamentos",
    "Outro",
  ],
}

export const categories = categoriesByDepartment.TI
