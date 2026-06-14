# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For detailed project architecture, file inventories, and component documentation, see [agent.md](agent.md).

## Project Overview

WillowDrive v2 Frontend — a Vue 3 + Vite admin SPA for WillowDrive Nursery. Consumes the WillowDrivev2 .NET 9 API. Deployed as an Azure Static Web App.

## Build & Run

```bash
cd WillowDriveFE/app
npm install
npm run dev          # Development server
npm run build        # Production build → dist/
npm run preview      # Preview production build
npm run test:e2e     # Playwright E2E (needs API at https://localhost:7077)
```

## Key Architecture

- **Framework**: Vue 3 (Composition API) + Vite 6
- **State**: Pinia stores (apiStore, mainStore, filterStore, userStores)
- **Routing**: Vue Router with auth guard, 42 routes
- **HTTP**: Axios with Bearer token interceptor
- **Styling**: Bootstrap 5 + SCSS theme system
- **Layouts**: DefaultLayout (admin) and KioskLayout (fullscreen time clock)

## Source Structure

```
app/src/
├── views/              ← 41 pages (accounting/25+1 report, employees/4, admin/4, time/6, payroll/1)
├── components/         ← 16 reusable components (Sidebar, Topbar, EditCard, Paginate, etc.)
├── stores/             ← 5 Pinia stores
├── services/api.js     ← Axios instance (dev: localhost:7077, prod: api.willowdrive.com)
├── composables/        ← useApi, useEditCardState
├── layouts/            ← DefaultLayout, KioskLayout
├── router/index.js     ← Route definitions with auth guard
├── utils/format.js     ← Currency formatting
└── assets/scss/        ← 100+ SCSS files (Bootstrap theme)
```

## API Connection

- Dev: `https://localhost:7077/api/`
- Prod: `https://api.willowdrive.com/api/`
- Auth: JWT Bearer token from localStorage

## Kiosk lockdown (role-based)

The FE router pins users whose **only** role is `Kiosk` to `/time/clock-in`. Check is in `src/utils/auth.js#isKioskUser(user)`, applied by `src/router/index.js` and the post-login redirect in `src/views/Login.vue`. Anyone with `Kiosk` plus other roles is treated normally by the FE (backend role gates still enforce).

## Testing

Playwright E2E suite at `tests/e2e/`. Hits the real API + DB. Prereqs:
- v2 API at `https://localhost:7077` (start with `dotnet run` from `WillowDrivev2/`)
- The DB the API targets must have `kiosk` (Kiosk role only) + `testAdmin` users; password `WillowDriveIsMyNursery`. Discover the DB from the API's `DataConnection` connection string (`dotnet user-secrets list | grep DataConnection`) rather than assuming a name.

See `agent.md` > Testing (E2E) for the full runbook, spec-authoring pattern, and trace-viewing.
