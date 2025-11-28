Title: Projeto Gestão — monorepo

Estrutura inicial com 3 pacotes:

- `frontend/` — app React (Vite + TypeScript)
- `admin/` — app React (Vite + TypeScript)
- `server/` — API Node + Express (TypeScript) com `prisma` e `.env.example`

Execução local

Em cada subpasta execute instalação e depois rode os scripts.

Entrar na pasta `frontend`:

```powershell
cd frontend
npm install
npm run dev
```

Entrar na pasta `admin`:

```powershell
cd admin
npm install
npm run dev
```

Entrar na pasta `server`:

```powershell
cd server
npm install
cp .env.example .env
# ajustar DATABASE_URL no .env
npm run dev
```

Deploy no Railway (resumo)

- Criar projeto no Railway e adicionar um Postgres plugin.
- Copiar a `DATABASE_URL` do Railway para o `server/.env` (variável `DATABASE_URL`).
- Rodar `prisma migrate deploy` (ou `prisma db push`) no Railway build step.
- Adicionar três serviços no Railway se desejar: `frontend`, `admin` (static) e `server`.
