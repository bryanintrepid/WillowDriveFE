import { createRouter, createWebHistory } from 'vue-router'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: { layout: 'auth' },
    },
    {
      path: '/time/entries',
      name: 'time-entries',
      component: () => import('../views/time/entries.vue'),
    },
    {
      path: '/time/clock-in',
      alias: '/kiosk',
      name: 'time-clock-in',
      component: () => import('../views/time/clock-in.vue'),
      meta: { layout: 'kiosk' },
    },
    {
      path: '/time/manage',
      name: 'time-manage',
      component: () => import('../views/time/manage.vue'),
    },
    {
      path: '/time/admin',
      name: 'time-admin',
      component: () => import('../views/time/admin.vue'),
    },
    {
      path: '/time/entry-report',
      name: 'time-entry-report',
      component: () => import('../views/time/entry-report.vue'),
    },
    {
      path: '/time/error-report',
      name: 'time-error-report',
      component: () => import('../views/time/error-report.vue'),
    },
    {
      path: '/payroll/view',
      name: 'payroll-view',
      component: () => import('../views/payroll/view.vue'),
    },
    {
      path: '/payroll/admin/tax-tables',
      name: 'payroll-admin-tax-tables',
      component: () => import('../views/payroll/admin/TaxTables.vue'),
    },
    {
      path: '/payroll/pay-runs/:payrollRunId',
      name: 'payroll-pay-run-detail',
      component: () => import('../views/payroll/PayRunDetail.vue'),
      props: true,
    },
    {
      path: '/employees',
      name: 'employee-list',
      component: () => import('../views/employees/list.vue'),
    },
    {
      path: '/employees/departments',
      name: 'employee-departments',
      component: () => import('../views/employees/departments.vue'),
    },
    {
      path: '/employees/deductions',
      name: 'employee-deductions',
      component: () => import('../views/employees/deductions.vue'),
    },
    {
      path: '/employees/vacation',
      name: 'employee-vacation',
      component: () => import('../views/employees/vacation.vue'),
    },
    {
      path: '/employees/:employeeId',
      name: 'employee-detail',
      component: () => import('../views/employees/detail.vue'),
      props: true,
    },
    {
      path: '/accounting/close-dashboard',
      name: 'accounting-close-dashboard',
      component: () => import('../views/accounting/CloseDashboard.vue'),
    },
    {
      path: '/accounting/recurring-je/templates',
      name: 'accounting-recurring-je-templates',
      component: () => import('../views/accounting/RecurringJeTemplates.vue'),
    },
    {
      path: '/accounting/recurring-je/drafts',
      name: 'accounting-recurring-je-drafts',
      component: () => import('../views/accounting/RecurringJeDrafts.vue'),
    },
    {
      path: '/accounting/year-end-close',
      name: 'accounting-year-end-close',
      component: () => import('../views/accounting/YearEndWizard.vue'),
    },
    {
      path: '/accounting/reconciliation-workbench',
      name: 'accounting-reconciliation-workbench',
      component: () => import('../views/accounting/ReconWorkbench.vue'),
    },
    {
      path: '/accounting/financial-statements',
      name: 'accounting-financial-statements',
      component: () => import('../views/accounting/FinancialStatements.vue'),
    },
    {
      path: '/accounting/budget-editor',
      name: 'accounting-budget-editor',
      component: () => import('../views/accounting/BudgetEditor.vue'),
    },
    {
      path: '/accounting/variance-report',
      name: 'accounting-variance-report',
      component: () => import('../views/accounting/VarianceReport.vue'),
    },
    {
      path: '/accounting/flux-analysis',
      name: 'accounting-flux-analysis',
      component: () => import('../views/accounting/FluxAnalysis.vue'),
    },
    {
      path: '/accounting/financial-ratios',
      name: 'accounting-financial-ratios',
      component: () => import('../views/accounting/FinancialRatios.vue'),
    },
    {
      path: '/accounting/custom-reports',
      name: 'accounting-custom-reports',
      component: () => import('../views/accounting/ReportBuilder.vue'),
    },
    {
      path: '/accounting/board-package',
      name: 'accounting-board-package',
      component: () => import('../views/accounting/BoardPackage.vue'),
    },
    {
      path: '/accounting/segment-pnl',
      name: 'accounting-segment-pnl',
      component: () => import('../views/accounting/SegmentPnL.vue'),
    },
    {
      path: '/accounting/cash-forecast',
      name: 'accounting-cash-forecast',
      component: () => import('../views/accounting/CashForecast.vue'),
    },
    {
      path: '/accounting/audit-log',
      name: 'accounting-audit-log',
      component: () => import('../views/accounting/AuditLog.vue'),
    },
    {
      path: '/accounting/tax-1099',
      name: 'accounting-tax-1099',
      component: () => import('../views/accounting/Tax1099.vue'),
    },
    {
      path: '/accounting/tax-jurisdictions',
      name: 'accounting-tax-jurisdictions',
      component: () => import('../views/accounting/TaxJurisdictions.vue'),
    },
    {
      path: '/accounting/tax-report',
      name: 'accounting-tax-report',
      component: () => import('../views/accounting/TaxReport.vue'),
    },
    {
      path: '/accounting/tax-filing',
      name: 'accounting-tax-filing',
      component: () => import('../views/accounting/TaxFiling.vue'),
    },
    {
      path: '/accounting/alert-rules',
      name: 'accounting-alert-rules',
      component: () => import('../views/accounting/AlertRules.vue'),
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import('../views/accounting/NotificationCenter.vue'),
    },
    {
      path: '/accounting/fixed-assets',
      name: 'accounting-fixed-assets',
      component: () => import('../views/accounting/FixedAssets.vue'),
    },
    {
      path: '/accounting/fixed-assets/depreciation',
      name: 'accounting-depreciation-run',
      component: () => import('../views/accounting/DepreciationRun.vue'),
    },
    {
      path: '/accounting/fixed-assets/new',
      name: 'accounting-fixed-asset-new',
      component: () => import('../views/accounting/FixedAssetDetail.vue'),
    },
    {
      path: '/accounting/fixed-assets/:assetId',
      name: 'accounting-fixed-asset-detail',
      component: () => import('../views/accounting/FixedAssetDetail.vue'),
      props: true,
    },
    {
      path: '/accounting/purchase-orders',
      name: 'accounting-purchase-orders',
      component: () => import('../views/accounting/PurchaseOrders.vue'),
    },
    {
      path: '/accounting/purchase-orders/new',
      name: 'accounting-purchase-order-new',
      component: () => import('../views/accounting/PurchaseOrderDetail.vue'),
    },
    {
      path: '/accounting/purchase-orders/:poId',
      name: 'accounting-purchase-order-detail',
      component: () => import('../views/accounting/PurchaseOrderDetail.vue'),
      props: true,
    },
    {
      path: '/accounting/invoice-approvals',
      name: 'accounting-invoice-approvals',
      component: () => import('../views/accounting/InvoiceApprovals.vue'),
    },
    {
      path: '/accounting/aging-ar',
      name: 'accounting-aging-ar',
      component: () => import('../views/accounting/AgingAR.vue'),
    },
    {
      path: '/accounting/aging-ap',
      name: 'accounting-aging-ap',
      component: () => import('../views/accounting/AgingAP.vue'),
    },
    {
      path: '/accounting/balance-sheet',
      name: 'accounting-balance-sheet',
      component: () => import('../views/accounting/balance-sheet.vue'),
    },
    {
      path: '/accounting/income-statement',
      name: 'accounting-income-statement',
      component: () => import('../views/accounting/income-statement.vue'),
    },
    {
      path: '/accounting/chart-of-accounts',
      name: 'accounting-chart-of-accounts',
      component: () => import('../views/accounting/ChartOfAccounts.vue'),
    },
    {
      path: '/accounting/account-reconciliation',
      name: 'accounting-account-reconciliation',
      component: () => import('../views/accounting/AccountReconciliation.vue'),
    },
    {
      path: '/accounting/general-ledger',
      name: 'accounting-general-ledger',
      component: () => import('../views/accounting/GeneralLedger.vue'),
    },
    {
      path: '/admin/account-reconciliation',
      name: 'admin-account-reconciliation',
      component: () => import('../views/admin/AccountReconciliation.vue'),
    },
    {
      path: '/accounting/batch/:companyName/:fiscalYear/:batchNumber',
      name: 'accounting-batch-detail',
      component: () => import('../views/accounting/BatchDetail.vue'),
      props: true
    },
    {
      path: '/accounting/pending-transactions',
      name: 'accounting-pending-transactions',
      component: () => import('../views/accounting/PendingTransactions.vue'),
    },
    {
      path: '/accounting/cash-planning',
      name: 'accounting-cash-planning',
      component: () => import('../views/accounting/CashPlanning.vue'),
    },
    {
      path: '/accounting/bank-transactions',
      name: 'accounting-bank-transactions',
      component: () => import('../views/accounting/BankTransactions.vue'),
    },
    {
      path: '/accounting/bank-feed',
      name: 'accounting-bank-feed',
      component: () => import('../views/accounting/BankFeed.vue'),
    },
    {
      path: '/accounting/bank-feed/rules',
      name: 'accounting-bank-feed-rules',
      component: () => import('../views/accounting/BankFeedRules.vue'),
    },
    {
      path: '/accounting/accruals',
      name: 'accounting-accruals',
      component: () => import('../views/accounting/Accruals.vue'),
    },
    {
      path: '/accounting/accruals/:id',
      name: 'accounting-accrual-detail',
      component: () => import('../views/accounting/AccrualDetail.vue'),
    },
    {
      path: '/accounting/deferred-revenue',
      name: 'accounting-deferred-revenue',
      component: () => import('../views/accounting/DeferredRevenue.vue'),
    },
    {
      path: '/accounting/deferred-revenue/:id',
      name: 'accounting-deferred-revenue-detail',
      component: () => import('../views/accounting/DeferredRevenueDetail.vue'),
    },
    {
      path: '/accounting/leases',
      name: 'accounting-leases',
      component: () => import('../views/accounting/Leases.vue'),
    },
    {
      path: '/accounting/leases/:id',
      name: 'accounting-lease-detail',
      component: () => import('../views/accounting/LeaseDetail.vue'),
    },
    {
      path: '/accounting/expense-reports',
      name: 'accounting-expense-reports',
      component: () => import('../views/accounting/ExpenseReimbursements.vue'),
    },
    {
      path: '/accounting/expense-reports/new',
      name: 'accounting-expense-report-new',
      component: () => import('../views/accounting/ExpenseReimbursementDetail.vue'),
    },
    {
      path: '/accounting/expense-reports/:id',
      name: 'accounting-expense-report-detail',
      component: () => import('../views/accounting/ExpenseReimbursementDetail.vue'),
      props: true,
    },
    {
      path: '/accounting/checks',
      name: 'accounting-checks',
      component: () => import('../views/accounting/Checks.vue'),
    },
    {
      path: '/accounting/checks/:checkId',
      name: 'accounting-payables-checks-detail',
      component: () => import('../views/accounting/CheckDetail.vue'),
      props: true
    },
    {
      path: '/accounting/check-runs',
      name: 'accounting-check-runs',
      component: () => import('../views/accounting/CheckRuns.vue'),
    },
    {
      path: '/accounting/check-runs/:checkRunId',
      name: 'accounting-payables-checkrun-detail',
      component: () => import('../views/accounting/CheckRunDetail.vue'),
      props: true
    },
    {
      path: '/accounting/vendors',
      name: 'accounting-vendors',
      component: () => import('../views/accounting/Vendors.vue'),
    },
    {
      path: '/accounting/vendors/:vendorId',
      name: 'accounting-payables-vendors-detail',
      component: () => import('../views/accounting/VendorDetail.vue'),
      props: true
    },
    {
      path: '/accounting/vendor-invoices',
      name: 'accounting-vendor-invoices',
      component: () => import('../views/accounting/VendorInvoices.vue'),
    },
    {
      path: '/accounting/vendor-invoices/new',
      name: 'accounting-vendor-invoice-new',
      component: () => import('../views/accounting/VendorInvoiceEdit.vue'),
    },
    {
      path: '/accounting/vendor-invoices/:invoiceId/edit',
      name: 'accounting-vendor-invoice-edit',
      component: () => import('../views/accounting/VendorInvoiceEdit.vue'),
      props: true,
    },
    {
      path: '/accounting/vendors/:vendorId/invoices/:invoiceNumber',
      name: 'accounting-payables-invoices-detail',
      component: () => import('../views/accounting/InvoiceDetail.vue'),
      props: true
    },
    {
      path: '/accounting/discounts',
      name: 'accounting-discounts',
      component: () => import('../views/accounting/Discounts.vue'),
    },
    {
      path: '/accounting/cash-receipts',
      name: 'accounting-cash-receipts',
      component: () => import('../views/accounting/CashReceipts.vue'),
    },
    {
      path: '/accounting/cash-receipts/:reference',
      name: 'accounting-cash-receipt-detail',
      component: () => import('../views/accounting/CashReceiptDetail.vue'),
    },
    {
      path: '/accounting/invoice-transactions',
      name: 'accounting-invoice-transactions',
      component: () => import('../views/accounting/InvoiceTransactions.vue'),
    },
    {
      path: '/accounting/invoice-transactions/:invoiceId',
      name: 'accounting-invoice-transaction-detail',
      component: () => import('../views/accounting/InvoiceTransactionDetail.vue'),
    },
    {
      path: '/accounting/chart-of-accounts/print',
      name: 'chart-of-accounts-print',
      component: () => import('../views/accounting/ChartOfAccountsPrint.vue'),
    },
    {
      path: '/accounting/detail/:fiscalYear/:accountNumber',
      name: 'accounting-detail',
      component: () => import('../views/accounting/AccountDetail.vue'),
    },
    {
      path: '/accounting/statements',
      name: 'accounting-statements',
      component: () => import('../views/accounting/Statements.vue'),
    },
    {
      path: '/accounting/statement-runs/:id',
      name: 'accounting-statement-run-detail',
      component: () => import('../views/accounting/StatementRunDetail.vue'),
    },
    {
      path: '/accounting/reports/payroll-hours',
      name: 'accounting-reports-payroll-hours',
      component: () => import('../views/accounting/reports/PayrollHours.vue'),
    },
    {
      path: '/admin/accounts',
      name: 'admin-accounts',
      component: () => import('../views/admin/accounts.vue'),
    },
    {
      path: '/admin/account-products',
      name: 'admin-account-products',
      component: () => import('../views/admin/account-products.vue'),
    },
    {
      path: '/admin/account-product-years',
      name: 'admin-account-product-years',
      component: () => import('../views/admin/account-product-years.vue'),
    },
    {
      path: '/admin/custom-fields',
      name: 'admin-custom-fields',
      component: () => import('../views/admin/CustomFieldSetup.vue'),
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/About.vue'),
    },
  ],
})

import { isKioskUser } from '../utils/auth'

// Global auth guard: protect all routes except the public allowlist
const publicRoutes = new Set(['/login'])
router.beforeEach((to, from, next) => {
  // Only run on client
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  let user = null
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    user = raw ? JSON.parse(raw) : null
  } catch (e) {
    user = null
  }
  const isKiosk = isKioskUser(user)

  // If navigating to a public route
  if (publicRoutes.has(to.path)) {
    // Prevent navigating to /login when already authenticated
    if (token && to.path === '/login') {
      return next({ path: isKiosk ? '/time/clock-in' : '/' })
    }
    return next()
  }

  // For all other routes, require authentication
  if (!token) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }
  // If logged in as a kiosk-terminal user (Kiosk role only), restrict to the clock-in route
  if (isKiosk && to.path !== '/time/clock-in' && to.path !== '/kiosk') {
    return next({ path: '/kiosk' })
  }
  return next()
})

export default router
