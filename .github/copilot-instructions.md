# Acadex Project Guidelines

## Code Style & Conventions
- **TypeScript (Frontend)**: Follow strict TypeScript typings. Centralized interfaces belong in `sushi/src/types/*.types.ts`.
- **Node.js/Express (Backend)**: CommonJS. Group modules by feature (`*.controller.js`, `*.service.js`, `*.model.js`, `*.routes.js`) under `shadow/src/modules/{feature}/`.
- Write small functions, functions should be more than 10 lines of code only if for formatting reason.

## Architecture & State
- **Monorepo Structure**: 
  - `waiter/`: Python-based GitHub webhook listener and deployment automation server (port 5050).
  - `scripts/`: Holds internal utility scripts like `acadex` used for local operations.
  - `shadow/`: Multi-tenant Node.js backend (port 5000) using Express + Mongoose.
  - `sushi/`: React 18/Vite/TypeScript frontend (port 8080) separated by role-based routing (e.g., student, teacher, admin).
- **Frontend State**: Utilize **Context** for auth/theme, and **React Query** for server state. **Do not use Redux.**
- **UI Components**: Use tailwind CSS and `shadcn/ui`. Imports should use the `@/` path alias.

## Multi-Tenancy & School Isolation
- **Backend Headers**: Always require an `X-School-Id` header for cross-school isolation logic (handled via `schoolIsolation.middleware.js`). 
- **Middlewares**: Actions chaining goes `protect -> checkSubscription -> checkAdmin` or role middlewares. Services rely on normalized data (e.g., fetching by `schoolId`).

## Build and Test Commands
- **Backend (shadow)**: `npm run dev` to start Nodemon on port 5000.
- **Frontend (sushi)**: `npm run dev` to run Vite on port 8080.
