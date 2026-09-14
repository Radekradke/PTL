// Fonte única da versão do app. Ao lançar uma atualização, incremente APP_VERSION
// e adicione uma entrada no topo de CHANGELOG descrevendo o que mudou.
export const APP_VERSION = "1.3.2"

export type ChangelogEntry = {
  version: string
  date: string // formato AAAA-MM-DD
  changes: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.3.2",
    date: "2026-09-14",
    changes: [
      "Anexos nos chamados agora aceitam imagens, PDF, Word, Excel e TXT (máx. 10MB, até 5 por envio) — na abertura e nas respostas, no portal e no painel.",
      "Novo visualizador de imagens interno (galeria com zoom, navegação e download) e visualização de PDF sem sair do app.",
      "Nova área \"Sugestões de Melhoria\": funcionários enviam ideias com anexos e opção anônima; administração acompanha, filtra e define o status.",
    ],
  },
  {
    version: "1.3.1",
    date: "2026-09-14",
    changes: [
      "Nova identidade visual (verde Lifting), tela inicial em bento e dashboard renovado.",
      "Tela de acesso unificada com transição deslizante entre abrir chamado e responder chamados.",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-09-02",
    changes: [
      "Removido o fechamento automático de chamados — agora eles só são finalizados manualmente.",
      "Número da versão visível no painel e no portal.",
      "Histórico de versões (novidades) disponível em Configurações.",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-07-29",
    changes: [
      "E-mail automático ao responsável da área quando um chamado é aberto (configurável em Configurações).",
      "Notificação \"Chamado #X atualizado\" ao setor sempre que há uma nova resposta.",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-07-22",
    changes: [
      "Anexar fotos nos chamados — na abertura e nas respostas do chat.",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-07-16",
    changes: [
      "Portal do funcionário, chamados por setor, ouvidoria e notificações push.",
    ],
  },
]
