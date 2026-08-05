# Comandos úteis

Execute os comandos a partir da raiz do repositório.

```bash
# Instalar todas as dependências
pnpm install

# Executar todas as aplicações
pnpm dev

# Executar somente a API
pnpm --filter api dev

# Criar arquivos nest pela cli + diretorio correto
pnpm --filter api exec nest g controller auth/infrastructure/auth --flat --no-spec
pnpm --filter api exec nest g guard auth/infrastructure/auth --flat --no-spec

# Executar somente o frontend
pnpm --filter web dev

# Executar Prisma
pnpm --filter api exec prisma migrate dev --name init
pnpm --filter api exec prisma generate

# Gerar os builds
pnpm build

# Executar lint
pnpm lint

# Executar testes
pnpm test
```
