PTL - Lifting Support
O PTL é um sistema interno desenvolvido para a Lifting, pensado para organizar o suporte técnico da empresa de um jeito mais claro, rastreável e eficiente.

Este projeto está aqui como portfólio: ele mostra a construção de uma solução real, feita para uma necessidade real de operação. Não é um produto aberto para uso público, nem uma aplicação pensada para ser clonada e utilizada por terceiros. O contexto, os fluxos e as regras foram desenhados para a rotina da Lifting.

Sobre o projeto
A ideia do PTL nasceu de uma dor bem comum em empresas: chamados espalhados, falta de histórico, dificuldade de acompanhar prioridades e pouca visibilidade para a gestão.

Com o sistema, cada solicitação passa a ter um lugar certo. O funcionário abre o chamado, a equipe técnica acompanha, responde, altera o status e mantém todo o histórico registrado. Ao mesmo tempo, a gestão consegue olhar para os números e entender melhor onde estão os maiores volumes de atendimento.

O que foi construído
O sistema tem dois ambientes principais:

Painel técnico para Admin, TI e Diretoria acompanharem dashboard, chamados, relatórios e cadastros.
Portal do funcionário para abertura de chamados, acompanhamento de respostas e finalização do atendimento.
Entre as principais funcionalidades estão:

abertura de chamados por funcionário, setor, categoria e origem;
acompanhamento por status: Aberto, Em andamento, Aguardando usuário e Finalizado;
histórico de mensagens dentro de cada chamado;
arquivamento de chamados finalizados sem perda do histórico;
dashboard com indicadores da operação;
relatórios com filtros e exportação em PDF ou Excel;
cadastro de setores e funcionários com controle de acesso.
Minha atuação
Neste projeto, trabalhei pensando tanto na experiência de quem abre o chamado quanto na rotina de quem precisa atender.

Alguns pontos que guiaram o desenvolvimento:

deixar o fluxo simples para o funcionário, sem telas desnecessárias;
dar ao time técnico uma visão rápida do que precisa de atenção;
manter histórico suficiente para evitar perda de contexto;
criar relatórios úteis para leitura de volume, origem e status dos chamados;
separar permissões entre perfis técnicos e usuários do portal;
preservar dados importantes, evitando exclusões definitivas quando o histórico ainda importa.
Tecnologias utilizadas
O projeto foi desenvolvido com uma stack moderna de frontend e backend:

React
TypeScript
Vite
Tailwind CSS
shadcn/radix
Recharts
jsPDF
XLSX
Node.js
Express
Prisma
PostgreSQL
Arquitetura geral
O projeto está dividido em duas partes:

.
|-- backend
|   |-- prisma
|   |-- src
|   |   |-- lib
|   |   |-- middlewares
|   |   |-- routes
|   |   `-- server.ts
|-- frontend
|   |-- public
|   `-- src
|       |-- components
|       |-- contexts
|       |-- lib
|       |-- pages
|       `-- services
`-- README.md
No backend, a API concentra autenticação, permissões, chamados, funcionários e setores. No frontend, a interface é organizada por páginas, componentes reutilizáveis, serviços de API e contexto de notificações.

Principais telas
Login técnico
Dashboard operacional
Gestão de chamados
Relatórios
Configurações administrativas
Portal do funcionário
Regras e cuidados do sistema
Algumas decisões foram importantes para deixar a aplicação mais próxima de um cenário real:

funcionários acessam apenas os próprios chamados;
áreas técnicas têm permissões diferentes conforme o perfil;
chamados finalizados são arquivados, mas continuam disponíveis para consulta e relatório;
setores e funcionários podem ser desativados sem apagar o histórico;
mensagens e mudanças de status ficam registradas para manter rastreabilidade.
O que este projeto demonstra
Para portfólio, o PTL representa mais do que uma tela bonita. Ele mostra a construção de um sistema com fluxo completo:

autenticação;
controle de permissões;
CRUD administrativo;
comunicação entre portal e painel técnico;
dashboard com dados operacionais;
exportação de relatórios;
integração entre frontend, backend e banco de dados;
preocupação com usabilidade e manutenção.
Observação
Por ser um projeto exclusivo para a Lifting, este repositório não tem foco em distribuição, instalação pública ou uso por terceiros. A proposta aqui é apresentar a solução, as decisões técnicas e o tipo de problema que ela resolve.

Em resumo: o PTL existe para dar rastro, clareza e velocidade ao suporte interno. É uma ferramenta feita para organizar o atendimento, melhorar a comunicação e não deixar chamado se perder no caminho.
