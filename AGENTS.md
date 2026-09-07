# Repository Guidelines

## Project Structure & Module Organization

This repository contains two independent React 19, TypeScript, and Vite apps:

- `coffee-peek/`: customer-facing coffee shop discovery and reviews.
- `coffee-peek-admin/`: administration interface; backend contracts live in `docs/BACKEND-API-SPEC.md` within this app.

Each app organizes `src/` into `pages/`, `routes/`, `components/`, `api/`, `hooks/`, `contexts/`, and `utils/`. Static assets live in each app’s `public/`; the customer app also has `src/assets/`. Customer UI guidance lives in `coffee-peek/DESIGN-SYSTEM.md` and `src/design-system/`. Keep changes scoped to the relevant app.

## Build, Test, and Development Commands

Run commands inside `coffee-peek/` or `coffee-peek-admin/`; there is no root npm package.

- `npm ci`: install dependencies from the app’s committed lockfile.
- `npm run dev`: start Vite on port 5173 (customer) or 5174 (admin).
- `npm run build`: create the production bundle in `dist/`.
- `npm run preview`: serve the production build locally.
- `npx tsc -p tsconfig.app.json --noEmit`: check application types separately; the build script only runs Vite.

## Coding Style & Naming Conventions

Use TypeScript, functional React components, and two-space indentation. Match surrounding quote and semicolon conventions. Name components and pages in PascalCase, hooks with a `use` prefix, and utilities in camelCase.

Reuse Tailwind styles and existing design tokens. Route API requests through `src/api/core/httpClient.ts`; use React Query for server state and React Hook Form with Zod for forms. Vite’s `@` alias points to `src/` in the customer app but the app root in admin.

The customer app includes an ESLint configuration, but its dependencies and lint script are not configured. Neither app configures Prettier.

## Testing Guidelines

No tests, test scripts, or coverage thresholds are currently configured. The customer app declares Jest and Testing Library dependencies. If adding tests, configure a runnable test command and use descriptive `*.test.ts` or `*.test.tsx` names.

For changes, build and type-check the affected app and manually verify relevant routes, authentication, forms, and responsive layouts. Record results and any existing failures in the PR.

## Commit & Pull Request Guidelines

History mixes imperative summaries and prefixes such as `refactor:`. Prefer descriptive messages such as `fix: handle expired admin sessions`; avoid `*` messages.

PRs should identify the affected app, explain behavior changes, link relevant issues, list validation, and include screenshots for visual changes.

## Security & Configuration

Use local environment files for configuration; admin provides `.env.example` with `VITE_API_URL`. Never commit credentials or put secrets in `VITE_*` variables, which are exposed to the browser.
