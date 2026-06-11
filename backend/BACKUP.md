# Backups do banco

O banco de produção é **PostgreSQL no Render**. Este projeto tem duas camadas de proteção:

1. **Backups gerenciados do Render** (recomendado como principal)
2. **Snapshots JSON via script** (este repositório — cópia extra, off-site)

---

## 1. Backups gerenciados do Render

Os planos pagos de PostgreSQL do Render fazem **backups diários automáticos** e permitem
restauração por ponto no tempo (PITR) nos planos maiores. O plano gratuito **não tem backup**
e expira em ~90 dias.

> Ação recomendada: confirmar no painel do Render (Dashboard → o banco → aba **Backups**)
> que o plano atual gera backups. Se estiver no gratuito, esta é a maior lacuna de continuidade.

---

## 2. Snapshots JSON via script (`npm run backup`)

Script portátil que exporta **todas as tabelas** para um arquivo JSON com data/hora.
Usa o próprio Prisma — **não precisa do `pg_dump` instalado** — então roda igual no Windows
e no Linux.

### Gerar um backup

Aponte o `DATABASE_URL` para o banco de produção e rode:

```bash
# PowerShell (Windows) — temporário só para este comando
$env:DATABASE_URL="postgresql://...prod..."; npm run backup

# bash/Linux
DATABASE_URL="postgresql://...prod..." npm run backup
```

O arquivo é salvo em `backend/backups/backup-<timestamp>.json`.
A pasta `backups/` está no `.gitignore` (pode conter dados sensíveis: hashes de senha,
endpoints de push). Os 30 backups mais recentes são mantidos; os mais antigos são removidos.

> **Dica de durabilidade:** rode o script **da sua máquina** apontando para o `DATABASE_URL`
> de produção. Assim o dump fica salvo no seu computador, fora do servidor — se o banco do
> Render for perdido, sua cópia continua intacta. Backups gravados no disco do próprio Render
> são efêmeros (somem em restart/redeploy) e não servem como cópia de segurança.

### Restaurar um backup

```bash
DATABASE_URL="postgresql://...destino..." npm run restore -- ./backups/backup-2026-06-11T12-00-00-000Z.json
```

- Faz `upsert` por id respeitando as foreign keys (Sector → Employee → Ticket → ...).
- Reajusta as sequences de autoincremento do Postgres no final.
- **Restaure preferencialmente em um banco vazio/novo** para evitar conflito com dados atuais.

---

## Automatizar (opcional)

Para rodar o snapshot periodicamente sem depender de lembrar:

- **Render Cron Job**: criar um Cron Job que execute `npm run backup` — mas só é útil se o
  script **enviar o dump para fora** (S3, etc.), já que o disco do Render é efêmero. Por isso
  o método mais simples e durável hoje é rodar localmente (ver dica acima), de preferência
  agendado na sua máquina (Agendador de Tarefas do Windows / cron).
- A forma **mais robusta** continua sendo manter os backups gerenciados do Render ligados (item 1)
  e usar os snapshots JSON como cópia adicional.

---

## Observação de ambiente

O `.env` local versionado de exemplo aponta `DATABASE_URL` para SQLite (`file:./prisma/dev.db`),
mas o `schema.prisma` usa `provider = "postgresql"`. Ou seja, para rodar qualquer comando que
toque o banco (inclusive `npm run backup`) é preciso um `DATABASE_URL` Postgres válido.
