Projeto Gestão — monorepo

Visão geral

Repositório monorepo com três serviços principais:

- `frontend/` — aplicação pública em React (Vite + TypeScript)
- `admin/` — painel administrativo em React (Vite + TypeScript)
- `server/` — API em Node + Express (TypeScript) com `prisma` para acesso ao Postgres

Estrutura

- `frontend/` — App público (scripts: `dev`, `build`, `preview`, `start`)
- `admin/` — Painel admin (scripts: `dev`, `build`, `preview`, `start`)
- `server/` — API (scripts: `dev`, `build`, `start`, `prisma:*`)

Executar localmente

1) Frontend

```powershell
cd frontend
npm install
npm run dev
```

2) Admin

```powershell
cd admin
npm install
npm run dev
```

3) Server (API)

```powershell
cd server
npm install
copy .env.example .env
# editar .env e ajustar DATABASE_URL para apontar ao seu Postgres local ou de desenvolvimento
npm run dev
```

Builds para produção (local)

```powershell
cd frontend
npm run build

cd ../admin
npm run build

cd ../server
npx tsc -p tsconfig.json
```

Observação: o `frontend` e o `admin` usam `serve` no script `start` para servir o conteúdo estático em produção (`serve -s dist -l $PORT`).

Variáveis de ambiente (essenciais)

- `DATABASE_URL` — string de conexão PostgreSQL (ex.: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`)
- `PORT` — porta onde o `server` deve escutar (padrão `4000` se não setado)

Prisma (migrates e seed)

Para gerar o cliente Prisma e aplicar migrations:

```powershell
cd server
npx prisma generate
npx prisma migrate deploy   # em produção
# ou, em desenvolvimento:
npx prisma migrate dev --name init

# opcional: rodar seed (caso exista)
node dist/prisma/seed.js # ou npx ts-node prisma/seed.ts
```

Deploy no Railway (passo a passo)

1. Crie um novo projeto no Railway e adicione o plugin PostgreSQL.
2. Conecte seu repositório GitHub ao projeto Railway (link do repositório).
3. Adicione/Verifique variáveis de ambiente no Railway (em `Settings` > `Variables`):
	- Para o `server`: `DATABASE_URL` (string do Postgres), `PORT` (opcional).
	- Para `frontend`/`admin`: em geral não há variáveis obrigatórias, mas adicione as que seu app necessitar.
4. Configure cada serviço no Railway:
	- `server` (Node): build command: `npm ci && npm run build` (ou `npm ci --include=dev && npm run build` se precisar de devDependencies no build); start command: `npm start`.
	- `frontend` / `admin` (Static Node): build command: `npm ci && npm run build`; start command: `npm start` (usa `serve -s dist -l $PORT`).
5. Se o Railway estiver falhando por não instalar devDependencies durante o build (por exemplo `vite`/`tsc` não disponíveis), defina a variável de ambiente no Railway para o build: `NPM_CONFIG_PRODUCTION=false` ou altere o build command para `npm ci --include=dev`.
6. Após deploy, verifique logs e execute `npx prisma migrate deploy` se desejar aplicar migrations manualmente (ou adicione esse passo no processo de release).

Dicas e problemas comuns

- Erro de tipos TypeScript no build (ex.: `Could not find a declaration file for module 'express'`): confirme que `@types/*` necessários estão em `dependencies` (ou configure o Railway para instalar devDependencies durante o build).
- Para aplicações estáticas com Vite, use `serve` para servir `dist/` em produção (script `start` já configurado).
- Se estiver usando domínios customizados, configure DNS apontando para o Railway e ative SSL no painel do Railway.

CI/CD recomendado

- Crie uma GitHub Action que execute `npm run build` e `npx tsc` para cada pacote antes do merge/push para `main`.

Mais informações

Se quiser, posso gerar um `railway.toml` exemplo, um workflow do GitHub Actions e scripts de seed/migration automatizados.
