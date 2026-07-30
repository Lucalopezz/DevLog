# Comandos úteis

Execute os comandos a partir da raiz do repositório.

```bash
# Instalar todas as dependências
pnpm install

# Executar todas as aplicações
pnpm dev

# Executar somente a API
pnpm --filter api dev

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
