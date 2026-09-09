# DevLog Web

DevLog frontend. This application provides the interface for browsing projects, recording issues and lessons learned, and finding previously attempted technical solutions.

## Current state

The frontend includes its application foundation, authentication screens, account details, project listing, creation, editing, and project details. The `/` route shows the initial infrastructure demonstration. Technical entry workflows continue to evolve.

The foundation includes:

- React Router routing;
- An Axios HTTP client configured for the API and cookies;
- Remote data caching and synchronization with TanStack Query;
- React Hook Form and Zod form validation;
- Tailwind CSS, shadcn/ui, and Radix interface components;
- Sonner notifications and Markdown rendering;
- React Query Devtools in development only.

## Technologies

- React 19 + TypeScript;
- Vite;
- React Router;
- TanStack Query;
- Axios;
- Tailwind CSS 4;
- shadcn/ui, Radix UI, and Lucide;
- React Hook Form + Zod;
- date-fns with the `en-US` locale.

## Code organization

```text
src/
  api/                 # HTTP client and API configuration
  app/providers/       # Global application providers
  components/          # Shared components and UI primitives
  features/            # Code organized by feature
    auth/              # Authentication schemas, types, hooks, and screens
    home/              # Current home page
    projects/          # Project APIs, forms, hooks, and screens
  lib/                 # Query client, dates, and utilities
  routes/              # Browser route definitions
  main.tsx             # React entry point
  index.css            # Tailwind, theme, and visual tokens
```

Features with their own rules belong in `features/`. Reusable components belong in `components/`; cross-cutting concerns such as dates and caching belong in `lib/`.

## Local configuration

From the monorepo root:

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
```

`VITE_API_URL` defines the base URL used by `src/api/http.ts`:

```env
VITE_API_URL=http://localhost:3000/api
```

If the variable is absent, the same address is used as a fallback. The API must be running and allow the Vite origin in `CORS_ALLOWED_ORIGINS`.

## Running

```bash
# Start Vite with hot module replacement
pnpm --filter web dev

# Validate types and create a production build
pnpm --filter web build

# Run lint checks
pnpm --filter web lint

# Preview the generated build locally
pnpm --filter web preview
```

Vite usually serves the app at `http://localhost:5173`.

## Foundation decisions

### API communication

Use the `api` instance from `src/api/http.ts` for new calls. It sets `withCredentials: true`, required because the backend stores the JWT in a protected cookie. Isolated Axios instances may break authentication or produce inconsistent URLs.

### Remote data

`queryClient` treats data as fresh for 30 seconds, does not refetch on window focus, and avoids retries for HTTP `4xx` errors. This policy distinguishes validation or authorization errors from temporary server failures.

### Forms and UI

`useLoginForm` is the form reference: Zod describes the data, and React Hook Form controls state and validation. Use the tokens and components in `src/index.css` and `src/components/ui`, composing styles with Tailwind classes.

All interface text, accessibility labels, validation messages, and notifications must be in English. Dates and numbers use `en-US`.

## Next areas to develop

Continue technical entry creation and editing, then connect tag and solution attempt workflows and editing of project subresources.

The web app does not yet have a test runner. Until one is added, the minimum checks for frontend changes are `lint` and `build`.
