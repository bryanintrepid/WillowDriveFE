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
    },
    {
      path: '/time/entries',
      name: 'time-entries',
      component: () => import('../views/time/entries.vue'),
    },
    {
      path: '/time/clock-in',
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
      path: '/accounting/invoice-transactions',
      name: 'accounting-invoice-transactions',
      component: () => import('../views/accounting/InvoiceTransactions.vue'),
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
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/About.vue'),
    },
  ],
})

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
  const uname = (user?.name || user?.fullName || user?.username || '').toString().trim()
  const isKiosk = uname.toLowerCase() === 'kiosk'

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
  // If logged in as Kiosk user, restrict to the clock-in route only
  if (isKiosk && to.path !== '/time/clock-in') {
    return next({ path: '/time/clock-in' })
  }
  return next()
})

export default router
