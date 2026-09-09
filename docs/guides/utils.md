# Useful commands

Run commands from the repository root.

```bash
# Install all dependencies
pnpm install

# Run all applications
pnpm dev

# Run only the API
pnpm --filter api dev

# Generate Nest files in the correct directory through the CLI
pnpm --filter api exec nest g controller auth/infrastructure/auth --flat --no-spec
pnpm --filter api exec nest g guard auth/infrastructure/auth --flat --no-spec

# Run only the frontend
pnpm --filter web dev

# Run Prisma
pnpm --filter api exec prisma migrate dev --name init
pnpm --filter api exec prisma generate

# Generate builds
pnpm build

# Run lint checks
pnpm lint

# Run tests
pnpm test
```
