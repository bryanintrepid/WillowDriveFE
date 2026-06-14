# Agent Index — WillowDrive v2 Frontend

This is the root agent.md for the WillowDrive v2 admin frontend. A Vue 3 + Vite + Bootstrap 5 SPA that consumes the WillowDrivev2 API.

## Project Summary

Vue 3 single-page application with Pinia state management, Vue Router, and Axios for API communication. Deployed as an Azure Static Web App. Features two layout modes: a standard admin interface and a fullscreen kiosk mode for time clock stations.

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Vue 3 (Composition API) | 3.5.13 |
| Build | Vite | 6.2.4 |
| State | Pinia | 3.0.1 |
| Routing | Vue Router | 4.5.0 |
| HTTP | Axios | 1.9.0 |
| Styling | Bootstrap 5 + SCSS | 5.3.7 |
| Icons | RemixIcon, BoxIcons, Bootstrap Icons | — |
| Maps | Leaflet | 1.9.4 |
| Deployment | Azure Static Web App | — |

## Directory Structure

```
WillowDriveFE/app/
├── src/
│   ├── main.js                ← App entry point (Vue + Pinia + Router + Bootstrap)
│   ├── App.vue                ← Root component (dynamic layout switching)
│   ├── router/
│   │   └── index.js           ← 93 route definitions with auth guard
│   ├── views/                 ← 89 page components
│   │   ├── accounting/        ← 67 views (GL, AP, AR, statements, vendors, modernization Phases 0–13.5)
│   │   ├── admin/             ← 5 views (account config + custom-field setup)
│   │   ├── employees/         ← 4 views (list, detail w/ tabs, departments, deductions)
│   │   ├── payroll/           ← payroll views including admin/tax-tables (Payroll Phase 1)
│   │   └── time/              ← 6 views (clock-in kiosk, entries, reports)
│   ├── components/            ← 18 reusable components (incl. NotificationBell, CustomFieldsPanel, AttachmentPanel)
│   │   └── icons/             ← 5 icon components
│   ├── layouts/
│   │   ├── DefaultLayout.vue  ← Standard admin (sidebar + topbar + content)
│   │   └── KioskLayout.vue    ← Fullscreen kiosk (idle handling, key blocking)
│   ├── stores/                ← 5 Pinia stores
│   ├── services/
│   │   └── api.js             ← Axios instance with Bearer token interceptor
│   ├── composables/           ← 2 composables (useApi, useEditCardState)
│   ├── utils/
│   │   ├── format.js          ← Currency formatting
│   │   └── auth.js            ← isKioskUser(user) — role-based kiosk-terminal check
│   └── assets/
│       ├── scss/              ← 100+ SCSS files (Bootstrap theme, components, plugins)
│       ├── images/            ← Image assets
│       └── fonts/             ← HK Grotesk, BoxIcons
├── index.html                 ← HTML template (RemixIcon CDN, Google Fonts)
├── vite.config.js             ← Vite config (@/ alias, SCSS, Vue DevTools)
├── playwright.config.js       ← E2E test config (Chromium, auto-starts Vite)
├── tests/
│   └── e2e/                   ← Playwright specs (kiosk-lockdown.spec.js, ...)
├── staticwebapp.config.json   ← Azure SWA config (SPA fallback, IP whitelist)
├── jsconfig.json              ← Path aliases
└── package.json               ← Dependencies and scripts
```

## Build & Run

```bash
cd WillowDriveFE/app
npm install
npm run dev      # Development server
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

## API Connection

| Environment | Base URL |
|------------|----------|
| Development | `https://localhost:7077/api/` |
| Production | `https://api.willowdrive.com/api/` |

Configured in `src/services/api.js`. Bearer token automatically injected from `localStorage.token`.

## Layouts

### DefaultLayout
Standard admin interface: fixed sidebar (250px), topbar with user dropdown, footer. Sidebar state persisted in localStorage.

### KioskLayout
Fullscreen mode for time clock stations:
- No sidebar or topbar
- Idle detection: hides cursor after 10s, soft-resets view after 90s
- Blocks keyboard shortcuts (F5, Ctrl+R, Ctrl+F, etc.)
- Disables context menu
- Used for `/time/clock-in` route

## Routes (93 total)

### Public
- `/login` — Login page

### Time Module (6 routes)
- `/time/entries` — View/filter time entries by date range, crew, employee
- `/time/clock-in` — Kiosk clock-in (PIN entry, KioskLayout, bilingual EN/ES)
- `/time/manage` — Manage time entries
- `/time/admin` — Time admin panel
- `/time/entry-report` — Time entry reports
- `/time/error-report` — Error reporting

### Employee Module (4 routes)
- `/employees` — Employee list (search, filter by status, paginate, sortable columns, create modal)
- `/employees/:employeeId` — Employee detail (tabbed: Info, Compensation, Tax, ACH, Benefits, Deductions, HR, History)
- `/employees/departments` — Department management (inline editing)
- `/employees/deductions` — Deductions management (list + detail modal)

### Accounting Module (~35 routes)

**Accounting Modernization (Phases 0-7)**:
- `/accounting/close-dashboard` — Period close workflow (Phase 1): checklist, progress, signoff, reopen
- `/accounting/recurring-je/templates` — Recurring JE template management (Phase 2)
- `/accounting/recurring-je/drafts` — Recurring JE draft approval workflow (Phase 2)
- `/accounting/reconciliation-workbench` — Bank/AR/AP reconciliation with period picker (Phase 3)
- `/accounting/financial-statements` — Unified BS/IS/TB with comparatives, drill-down, export (Phase 4)
- `/accounting/budget-editor` — Budget entry grid (account × 12 periods) with lock/unlock (Phase 6)
- `/accounting/aging-ar` — AR aging report by customer (0/30/60/90+) (Phase 5)
- `/accounting/aging-ap` — AP aging report by vendor (Phase 5)
- `/accounting/statement-runs/:id` — Statement run detail (Phase 5)
- `/accounting/year-end-close` — Year-end wizard: precheck → preview → confirm roll-forward (Phase 7)

**Accounting Modernization (Phases 8–13.5)** — added since this doc was last refreshed:
- `/` (Home) — Executive dashboard, CFO/Admin only (Phase 8)
- `/accounting/audit-log` — Audit log viewer, filtered (Phase 9)
- `/accounting/fixed-assets` + `/new` + `/:assetId` + `/depreciation` — Fixed asset register, depreciation runs (Phase 10)
- `/accounting/purchase-orders` — PO lifecycle (Phase 11.1)
- `/accounting/invoice-approvals` — Invoice approval queue + thresholds (Phase 11.2)
- `/accounting/bank-feed-rules` — Bank feed matching rules (Phase 11.3)
- `/accounting/accruals` + `/:id` — Accrual schedules + posting history (Phase 11.4)
- `/accounting/expense-reports` + `/new` + `/:id` — Employee expense reimbursement (Phase 11.5)
- `/accounting/vendor-invoices/new` + `/:invoiceId/edit` — Vendor invoice CRUD with credit-memo mode (Phase 11.6)
- `/accounting/flux-analysis` — Period-over-period flux with drilldown (Phase 12.1)
- `/accounting/financial-ratios` — 14 ratios with sparkline trends (Phase 12.2)
- `/accounting/custom-reports` — Saved-query builder (Phase 12.3)
- `/accounting/board-package` — Multi-section PDF generator with saved layouts (Phase 12.4)
- `/accounting/segment-pnl` — Product / Product Year P&L slice (Phase 12.5)
- `/accounting/cash-forecast` — 30/60/90-day cash forecast (Phase 12.6)
- `/accounting/tax-jurisdictions` + `/tax-report` + `/tax-filing` — Sales tax (Phase 13.1)
- `/accounting/deferred-revenue` + `/:id` — Deferred revenue schedules (Phase 13.2)
- `/accounting/leases` + `/:id` — ASC 842 leases (Phase 13.3)
- `/accounting/alert-rules` + `/notifications` — Alert config + notification center (Phase 13.4)
- `/admin/custom-fields` — Custom field setup, vendor-only in v1 (Phase 13.5)

**Payroll Modernization (Phases 1–4)** — added since this doc was last refreshed:
- `/payroll/admin/tax-tables` — Tax bracket admin (W-4 2020+ + HoH brackets, evidence panel) (Payroll Phase 1)
- Direct-deposit splits editor lives in `/employees/:id` "Direct Deposit" tab — multi-split with pre-note + effective date (Payroll Phase 2B)
- W-4 picker + 5 W-4 2020+ fields live in `/employees/:id` "Tax Setup" tab (Payroll Phase 2A)

**Financial (legacy views)**:
- `/accounting/balance-sheet`, `/accounting/income-statement` — Legacy views (superseded by `/financial-statements`)
- `/accounting/chart-of-accounts` — With fiscal year selector, search, trial balance, lock/unlock periods
- `/accounting/general-ledger` — Journal type filters, batch creation
- `/accounting/detail/:fiscalYear/:accountNumber` — Account detail
- `/accounting/batch/:companyName/:fiscalYear/:batchNumber` — Batch editing
- `/accounting/pending-transactions`, `/accounting/statements`, `/accounting/cash-planning`
- `/accounting/account-reconciliation`

**Payables (AP)**:
- `/accounting/checks`, `/accounting/checks/:checkId`
- `/accounting/check-runs`, `/accounting/check-runs/:checkRunId`
- `/accounting/vendors`, `/accounting/vendors/:vendorId`
- `/accounting/vendor-invoices`, `/accounting/vendors/:vendorId/invoices/:invoiceNumber`
- `/accounting/discounts`

**Receivables (AR)**:
- `/accounting/cash-receipts`, `/accounting/cash-receipts/:reference`
- `/accounting/invoice-transactions`, `/accounting/invoice-transactions/:invoiceId`

**Reports**:
- `/accounting/reports/payroll-hours`
- `/accounting/chart-of-accounts/print`

### Payroll Module (1 route)
- `/payroll/view`

### Admin Module (4 routes)
- `/admin/accounts`, `/admin/account-products`, `/admin/account-product-years`, `/admin/account-reconciliation`

## Stores (5 Pinia stores)

| Store | Purpose |
|-------|---------|
| `apiStore` | Generic HTTP state (data, error, loading) with get/post/put/delete helpers |
| `mainStore` | Global app state — current user, error |
| `filterStore` | Per-page filter persistence (saves/restores filter state by page key) |
| `userStores` | User list and current user fetching |
| `counter` | Demo/example store |

## Components (16 total)

### Layout
- `Topbar.vue` — Header with fullscreen toggle, user profile dropdown, logout
- `Sidebar.vue` — Collapsible nav menu, scroll/state persistence, active route tracking
- `Footer.vue` — Copyright footer

### Functional
- `ClearableSearchInput.vue` — Text input with clear button and ESC key support
- `EditCard.vue` — Inline edit card (summary/form toggle, uses `useEditCardState` composable)
- `FilterTag.vue` — Badge-style removable filter display
- `FiscalYearChooser.vue` — Dropdown for fiscal year selection
- `Paginate.vue` — Pagination with page size selector, item range display, direct page input

### Accounting Modernization (Phases 0-7)
- `FiscalPeriodBadge.vue` — Topbar badge showing current FY, period, and close state (Phase 0)
- `FiscalPeriodPicker.vue` — Reusable FY + period (P1-P12) selector dropdown (Phase 4)
- `DrilldownModal.vue` — GL transaction drill-down modal: summary bar + transaction table + source doc links (Phase 4b)
- `ExportMenu.vue` — Dropdown button for CSV/XLSX/PDF export (Phase 4c)

## Composables

| Composable | Purpose |
|-----------|---------|
| `useApi` | Reactive HTTP state (data, error, loading refs) with fetch/get/post/put/delete |
| `useEditCardState` | Global mutex — prevents multiple EditCard components from editing simultaneously |

## Authentication Flow

1. Login form → `POST /api/login` (username/password)
2. Server returns JWT token + user object (includes `roles` array)
3. Stored in `localStorage` (token, user JSON)
4. Axios interceptor injects `Authorization: Bearer {token}` on all requests
5. Router auth guard redirects unauthenticated users to `/login`
6. Kiosk-terminal users redirected to `/time/clock-in` (KioskLayout) and pinned there — the guard treats anyone whose **only** role is `Kiosk` as a terminal account. Check lives in `utils/auth.js#isKioskUser(user)`; used by both `router/index.js` and the post-login redirect in `Login.vue`. A user with `Kiosk` plus other roles is **not** locked down by the FE (backend role gates still apply).
7. Logout clears localStorage → redirect to `/login`

## Testing (E2E)

Playwright suite lives under `tests/e2e/`. Specs use the real API + database — they're not mocked.

### Prereqs
- v2 API running at **`https://localhost:7077`** (the URL hardcoded in `src/services/api.js` for dev). Start from `WillowDrivev2/` with `dotnet run` — the default profile binds 7077.
- The database the API is configured against has the standard test users with password `WillowDriveIsMyNursery`. Don't assume a specific DB name — discover it from the API's `DataConnection` connection string (`cd WillowDrivev2 && dotnet user-secrets list | grep DataConnection`, read the `Initial Catalog`). Tests hit whatever DB that points at.
  - `kiosk` — roles=`[Kiosk]` only (single-role; triggers FE lockdown)
  - `testAdmin` — broad roles incl. Admin (used as the negative case — should *not* be locked down)
- Other test users used elsewhere: `testCfo`, `testWeekly`, `testBiweekly`, `testMonthly`, `testPayrollOnly`

### Run
```bash
npm run test:e2e          # headless, full suite
npm run test:e2e:ui       # interactive Playwright UI (best for debugging)
npm run test:e2e:headed   # watch the browser drive
```

Playwright's `webServer` auto-starts Vite on port 5173 (reusing an existing server if you already have `npm run dev` going). The browser is configured with `ignoreHTTPSErrors: true` so the dev cert on `:7077` doesn't trip it.

### Adding a spec
Drop a new `*.spec.js` in `tests/e2e/`. The `login()` helper at the top of `kiosk-lockdown.spec.js` shows the form-fill pattern (`#username`, `#password-input`, `button[type="submit"]`). If you add more than two specs, lift the helper into `tests/e2e/_helpers/login.js`.

Trace + screenshots are kept on failure (`retain-on-failure` / `only-on-failure`). View a failed trace with:
```bash
npx playwright show-trace test-results/<test-folder>/trace.zip
```

### Coverage today
- `kiosk-lockdown.spec.js` — 14 tests covering unauthenticated redirect, kiosk login lands on clock-in, four protected routes bounce back to `/kiosk`, two allowed routes resolve, `/login` redirects authed-kiosk → clock-in, admin can navigate freely, localStorage shape checks for both user types.

### Tooling notes
- Only the `chromium-headless-shell` browser is installed (~112MB) — keep it slim by re-running `npx playwright install chromium` after a clean checkout. If you need Firefox/WebKit, `npx playwright install firefox webkit`.
- `playwright.config.js`: `fullyParallel: false`, single worker — these specs share a DB and the kiosk's `/api/login` path, so parallel sessions would race.
- The leftover Vite/dotnet processes can linger if a session crashes; check `netstat -ano | grep -E "7077|5173"` and `taskkill //PID <pid> //F` if needed.

## Styling Architecture

- Bootstrap 5 as base framework with SCSS customization
- Theme variables in `assets/scss/config/default/_variables.scss`
- 30+ component SCSS files, 20+ page-specific styles, 60+ plugin styles
- Fonts: HK Grotesk (custom), Poppins (Google Fonts CDN)

## Deployment

Azure Static Web App:
- `staticwebapp.config.json` configures SPA fallback routing
- 11 IP addresses whitelisted in `allowedIpRanges`
- Static assets excluded from SPA rewrite

## Related Projects

- **WillowDrivev2** (`../WillowDrivev2/`) — .NET 9 API backend that this frontend consumes
- **WillowDrive** (`../../WillowDrive/`) — Original .NET 4.8 monolith (being replaced)
