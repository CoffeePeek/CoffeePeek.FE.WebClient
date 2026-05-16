# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at 0.0.0.0:5173
npm run build     # Production build via Vite
npm run preview   # Preview production build locally
```

No test or lint scripts are configured in package.json. ESLint is configured (`eslint.config.js`) and can be run manually with `npx eslint src/`.

## Architecture

**CoffeePeek** is a React 19 SPA for discovering and reviewing coffee shops. It uses Vite + TypeScript with Vercel deployment (all routes rewrite to `/index.html` via `vercel.json`).

### State Management

Three layers:
1. **React Context** — `UserContext` (auth, roles), `ThemeContext` (dark/light), `ToastContext` (notifications)
2. **React Query v5** — all server state; configured in `src/lib/queryClient.ts` with staleTime=5min, gcTime=10min
3. **React Hook Form + Zod** — form state and validation

### API Layer (`src/api/`)

All HTTP communication goes through `src/api/core/httpClient.ts` — a centralized client with interceptors for:
- Auto-injecting JWT access tokens
- Transparent token refresh on 401 responses
- Normalizing responses to `{ success, data, message }`

Token management is handled by `TokenManager` in `src/api/core/interceptors.ts` (tokens stored in localStorage). API modules (`auth.ts`, `coffeeshop.ts`, `user.ts`, etc.) call the shared client — never `fetch` directly.

### Routing (`src/routes/`)

- `AppRoutes.tsx` — all route definitions; pages are lazy-loaded with `React.lazy()` + `Suspense`
- `ProtectedRoute.tsx` — wraps authenticated routes; reads from `UserContext`
- Public routes: `/`, `/login`, `/register`, `/privacy`, `/error`
- Protected routes: `/shops`, `/dashboard`, `/users/:userId`, `/coffee-shops/new`, etc.

### User Roles

Three roles: `User`, `Moderator`, `Admin`. Role-checking logic lives in `UserContext`. The `DashboardPage` routes to either `ModeratorPanel` or `AdminPanel` based on role.

### Key Patterns

- **Import alias:** `@/` maps to the project root (configured in `vite.config.ts` and `tsconfig.app.json`)
- **Query keys:** Feature-specific key factories (e.g., `coffeeShopKeys`, `reviewKeys`) are co-located with their query hooks in `src/hooks/queries/`
- **Skeletons:** Every data-fetching view has a matching skeleton component in `src/components/skeletons/`; see `src/components/skeletons/README.md` for usage
- **Tailwind theme:** Coffee-themed custom palette defined in `tailwind.config.js` — primary `#EAB308` (gold), warm-gold `#D4A84B`, fonts Sora (display) + Noto Sans (body); dark mode is class-based

### Notable Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root component — wraps providers (Query, User, Theme, Toast) |
| `src/api/core/httpClient.ts` | The single HTTP client; all API calls go through here |
| `src/api/core/interceptors.ts` | Token refresh logic and `TokenManager` |
| `src/contexts/UserContext.tsx` | Auth state, roles, and permission helpers |
| `src/lib/queryClient.ts` | React Query global configuration |
