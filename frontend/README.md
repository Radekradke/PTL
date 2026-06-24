# PTL — Frontend

Interface do sistema PTL, desenvolvida em React + TypeScript com Vite.

## Stack

- **React** + **TypeScript**
- **Vite** — build e dev server
- **Tailwind CSS** — estilização
- **shadcn/ui** + **Radix UI** — componentes
- **Recharts** — gráficos do dashboard
- **jsPDF** / **XLSX** — exportação de relatórios

## Estrutura

```
src/
├── components/       # Componentes reutilizáveis (layout, UI, tickets)
├── contexts/         # Contexto de notificações
├── hooks/            # Hooks customizados
├── lib/              # Utilitários e dados de domínio
├── pages/            # Páginas por módulo (auth, dashboard, tickets, reports, settings)
└── services/         # Camada de comunicação com a API
```

## Desenvolvimento

```bash
npm install
npm run dev
```

A interface espera a API rodando em `http://localhost:3000`. Consulte o README raiz para instruções completas de setup.
