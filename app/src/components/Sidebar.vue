<template>
  <div class="app-menu navbar-menu">
    <!-- LOGO -->
    <div class="navbar-brand-box">
      <router-link to="/" class="logo logo-dark">
        <span class="logo-sm">
          <img src="@/assets/logo.png" alt="" height="30">
        </span>
        <span class="logo-lg">
          <img src="@/assets/logo.png" alt="" height="100">
        </span>
      </router-link>
      <button type="button" class="btn btn-sm p-0 fs-20 header-item float-end btn-vertical-sm-hover" id="vertical-hover">
        <i class="ri-record-circle-line"></i>
      </button>
    </div>

    <div id="scrollbar">
      <div class="container-fluid">
        <div id="two-column-menu">
        </div>
        <ul class="navbar-nav" id="navbar-nav">
          <li class="menu-title"><span></span></li>
          <li class="nav-item" v-if="isCfoOrAdmin">
            <router-link class="nav-link menu-link" to="/">
              <i class="ri-dashboard-2-line"></i> <span>Dashboard</span>
            </router-link>
          </li>

          <!-- Time -->
          <li class="nav-item">
            <a class="nav-link menu-link" href="#sidebarTime" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarTime">
              <i class="ri-time-line"></i> <span>Time</span>
            </a>
            <div class="collapse menu-dropdown" id="sidebarTime">
              <ul class="nav nav-sm flex-column">
                <li class="nav-item">
                  <router-link to="/time/clock-in" class="nav-link">Clock In</router-link>
                </li>
                <li class="nav-item">
                  <router-link to="/time/entries" class="nav-link">Time Entries</router-link>
                </li>
                <li class="nav-item">
                  <router-link to="/time/manage" class="nav-link">Manage</router-link>
                </li>
                <li class="nav-item">
                  <router-link to="/time/admin" class="nav-link">Admin</router-link>
                </li>
                <li class="nav-item">
                  <router-link to="/time/entry-report" class="nav-link">Entry Report</router-link>
                </li>
                <li class="nav-item">
                  <router-link to="/time/error-report" class="nav-link">Error Report</router-link>
                </li>
              </ul>
            </div>
          </li>

          <!-- Employees -->
          <li class="nav-item">
            <a class="nav-link menu-link" href="#sidebarEmployees" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarEmployees">
              <i class="ri-team-line"></i> <span>Employees</span>
            </a>
            <div class="collapse menu-dropdown" id="sidebarEmployees">
              <ul class="nav nav-sm flex-column">
                <li class="nav-item">
                  <router-link to="/employees" class="nav-link">Employee List</router-link>
                </li>
                <li class="nav-item">
                  <router-link to="/employees/departments" class="nav-link">Departments</router-link>
                </li>
                <li class="nav-item">
                  <router-link to="/employees/deductions" class="nav-link">Deductions</router-link>
                </li>
                <li class="nav-item">
                  <router-link to="/employees/vacation" class="nav-link">Vacation</router-link>
                </li>
              </ul>
            </div>
          </li>

          <!-- Payroll -->
          <li class="nav-item">
            <a class="nav-link menu-link" href="#sidebarPayroll" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarPayroll">
              <i class="ri-wallet-line"></i> <span>Payroll</span>
            </a>
            <div class="collapse menu-dropdown" id="sidebarPayroll">
              <ul class="nav nav-sm flex-column">
                <li class="nav-item">
                  <router-link to="/payroll/view" class="nav-link">View</router-link>
                </li>
                <li class="nav-item">
                  <router-link to="/payroll/admin/tax-tables" class="nav-link">Tax Tables</router-link>
                </li>
              </ul>
            </div>
          </li>

          <!-- Accounting -->
          <li class="nav-item">
            <a class="nav-link menu-link" href="#sidebarAccounting" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarAccounting">
              <i class="ri-book-read-line"></i> <span>Accounting</span>
            </a>
            <div class="collapse menu-dropdown" id="sidebarAccounting">
              <ul class="nav nav-sm flex-column">

                <!-- Close & Audit -->
                <li class="nav-item">
                  <a class="nav-link menu-link" href="#sidebarAcctClose" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarAcctClose">
                    <i class="ri-calendar-check-line align-bottom me-1"></i><span>Close &amp; Audit</span>
                  </a>
                  <div class="collapse menu-dropdown" id="sidebarAcctClose">
                    <ul class="nav nav-sm flex-column">
                      <li class="nav-item"><router-link to="/accounting/close-dashboard" class="nav-link">Period Close</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/year-end-close" class="nav-link">Year-End Close</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/audit-log" class="nav-link">Audit Trail</router-link></li>
                    </ul>
                  </div>
                </li>

                <!-- Financial Reports -->
                <li class="nav-item">
                  <a class="nav-link menu-link" href="#sidebarAcctReports" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarAcctReports">
                    <i class="ri-file-chart-line align-bottom me-1"></i><span>Financial Reports</span>
                  </a>
                  <div class="collapse menu-dropdown" id="sidebarAcctReports">
                    <ul class="nav nav-sm flex-column">
                      <li class="nav-item"><router-link to="/accounting/financial-statements" class="nav-link">Financial Statements</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/balance-sheet" class="nav-link">Balance Sheet</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/income-statement" class="nav-link">Income Statement</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/financial-ratios" class="nav-link">Financial Ratios</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/variance-report" class="nav-link">Variance Report</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/flux-analysis" class="nav-link">Flux Analysis</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/segment-pnl" class="nav-link">Segment P&amp;L</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/board-package" class="nav-link">Board Package</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/custom-reports" class="nav-link">Custom Reports</router-link></li>
                    </ul>
                  </div>
                </li>

                <!-- General Ledger -->
                <li class="nav-item">
                  <a class="nav-link menu-link" href="#sidebarAcctGL" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarAcctGL">
                    <i class="ri-book-2-line align-bottom me-1"></i><span>General Ledger</span>
                  </a>
                  <div class="collapse menu-dropdown" id="sidebarAcctGL">
                    <ul class="nav nav-sm flex-column">
                      <li class="nav-item"><router-link to="/accounting/chart-of-accounts" class="nav-link">Chart of Accounts</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/general-ledger" class="nav-link">General Ledger</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/pending-transactions" class="nav-link">Pending Transactions</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/account-reconciliation" class="nav-link">Account Reconciliation</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/reconciliation-workbench" class="nav-link">Reconciliation Workbench</router-link></li>
                      <li class="nav-item">
                        <a class="nav-link menu-link" href="#sidebarRecurringJe" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarRecurringJe">
                          <span>Recurring JEs</span>
                        </a>
                        <div class="collapse menu-dropdown" id="sidebarRecurringJe">
                          <ul class="nav nav-sm flex-column">
                            <li class="nav-item"><router-link to="/accounting/recurring-je/drafts" class="nav-link">Drafts Workflow</router-link></li>
                            <li class="nav-item"><router-link to="/accounting/recurring-je/templates" class="nav-link">Templates</router-link></li>
                          </ul>
                        </div>
                      </li>
                    </ul>
                  </div>
                </li>

                <!-- Budget & Cash -->
                <li class="nav-item">
                  <a class="nav-link menu-link" href="#sidebarAcctBudget" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarAcctBudget">
                    <i class="ri-calculator-line align-bottom me-1"></i><span>Budget &amp; Cash</span>
                  </a>
                  <div class="collapse menu-dropdown" id="sidebarAcctBudget">
                    <ul class="nav nav-sm flex-column">
                      <li class="nav-item"><router-link to="/accounting/budget-editor" class="nav-link">Budget Editor</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/cash-planning" class="nav-link">Cash Planning</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/cash-forecast" class="nav-link">Cash Forecast</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/alert-rules" class="nav-link">Alert Rules</router-link></li>
                    </ul>
                  </div>
                </li>

                <!-- Payables -->
                <li class="nav-item">
                  <a class="nav-link menu-link" href="#sidebarPayables" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarPayables">
                    <i class="ri-arrow-up-circle-line align-bottom me-1"></i><span>Payables</span>
                  </a>
                  <div class="collapse menu-dropdown" id="sidebarPayables">
                    <ul class="nav nav-sm flex-column">
                      <li class="nav-item"><router-link to="/accounting/purchase-orders" class="nav-link">Purchase Orders</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/vendor-invoices" class="nav-link">Vendor Invoices</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/invoice-approvals" class="nav-link">Invoice Approvals</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/vendors" class="nav-link">Vendors</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/discounts" class="nav-link">Discounts</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/accruals" class="nav-link">Accruals</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/expense-reports" class="nav-link">Expense Reports</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/checks" class="nav-link">Checks</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/check-runs" class="nav-link">Check Runs</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/bank-transactions" class="nav-link">Bank Transactions</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/bank-feed" class="nav-link">Bank Feed</router-link></li>
                    </ul>
                  </div>
                </li>

                <!-- Receivables -->
                <li class="nav-item">
                  <a class="nav-link menu-link" href="#sidebarReceivables" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarReceivables">
                    <i class="ri-arrow-down-circle-line align-bottom me-1"></i><span>Receivables</span>
                  </a>
                  <div class="collapse menu-dropdown" id="sidebarReceivables">
                    <ul class="nav nav-sm flex-column">
                      <li class="nav-item"><router-link to="/accounting/cash-receipts" class="nav-link">Cash Receipts</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/invoice-transactions" class="nav-link">Invoice Transactions</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/statements" class="nav-link">Statements</router-link></li>
                    </ul>
                  </div>
                </li>

                <!-- Assets & Long-Term -->
                <li class="nav-item">
                  <a class="nav-link menu-link" href="#sidebarAcctAssets" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarAcctAssets">
                    <i class="ri-building-2-line align-bottom me-1"></i><span>Assets &amp; Long-Term</span>
                  </a>
                  <div class="collapse menu-dropdown" id="sidebarAcctAssets">
                    <ul class="nav nav-sm flex-column">
                      <li class="nav-item">
                        <a class="nav-link menu-link" href="#sidebarFixedAssets" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarFixedAssets">
                          <span>Fixed Assets</span>
                        </a>
                        <div class="collapse menu-dropdown" id="sidebarFixedAssets">
                          <ul class="nav nav-sm flex-column">
                            <li class="nav-item"><router-link to="/accounting/fixed-assets" class="nav-link">Asset Register</router-link></li>
                            <li class="nav-item"><router-link to="/accounting/fixed-assets/depreciation" class="nav-link">Run Depreciation</router-link></li>
                          </ul>
                        </div>
                      </li>
                      <li class="nav-item"><router-link to="/accounting/leases" class="nav-link">Leases (ASC 842)</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/deferred-revenue" class="nav-link">Deferred Revenue</router-link></li>
                    </ul>
                  </div>
                </li>

                <!-- Tax -->
                <li class="nav-item">
                  <a class="nav-link menu-link" href="#sidebarAcctTax" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarAcctTax">
                    <i class="ri-bank-line align-bottom me-1"></i><span>Tax</span>
                  </a>
                  <div class="collapse menu-dropdown" id="sidebarAcctTax">
                    <ul class="nav nav-sm flex-column">
                      <li class="nav-item"><router-link to="/accounting/tax-1099" class="nav-link">1099 Report</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/tax-jurisdictions" class="nav-link">Tax Jurisdictions</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/tax-report" class="nav-link">Sales Tax Report</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/tax-filing" class="nav-link">Sales Tax Filing</router-link></li>
                    </ul>
                  </div>
                </li>

                <!-- Aging & Other Reports -->
                <li class="nav-item">
                  <a class="nav-link menu-link" href="#sidebarAcctAging" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarAcctAging">
                    <i class="ri-time-line align-bottom me-1"></i><span>Aging &amp; Other Reports</span>
                  </a>
                  <div class="collapse menu-dropdown" id="sidebarAcctAging">
                    <ul class="nav nav-sm flex-column">
                      <li class="nav-item"><router-link to="/accounting/aging-ar" class="nav-link">AR Aging</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/aging-ap" class="nav-link">AP Aging</router-link></li>
                      <li class="nav-item"><router-link to="/accounting/reports/payroll-hours" class="nav-link">Payroll Hours</router-link></li>
                    </ul>
                  </div>
                </li>

              </ul>
            </div>
          </li>

          <!-- Admin -->
          <li class="nav-item">
            <a class="nav-link menu-link" href="#sidebarAdmin" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarAdmin">
              <i class="ri-settings-2-line"></i> <span>Admin</span>
            </a>
            <div class="collapse menu-dropdown" id="sidebarAdmin">
              <ul class="nav nav-sm flex-column">
                <li class="nav-item">
                  <router-link to="/admin/accounts" class="nav-link">Accounts</router-link>
                </li>
                <li class="nav-item">
                  <router-link to="/admin/account-products" class="nav-link">Account Products</router-link>
                </li>
                <li class="nav-item">
                  <router-link to="/admin/account-product-years" class="nav-link">Account Product Years</router-link>
                </li>
                <li class="nav-item">
                  <router-link to="/admin/account-reconciliation" class="nav-link">Account Reconciliation</router-link>
                </li>
                <li class="nav-item">
                  <router-link to="/admin/custom-fields" class="nav-link">Custom Fields</router-link>
                </li>
              </ul>
            </div>
          </li>

         <li class="nav-item">
            <a class="nav-link menu-link" href="#sidebarAuth" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarAuth">
              <i class="ri-account-circle-line"></i> <span>Authentication</span>
            </a>
            <div class="collapse menu-dropdown" id="sidebarAuth">
              <ul class="nav nav-sm flex-column">
                <li class="nav-item">
                  <router-link to="/login" class="nav-link">Login</router-link>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMainStore } from '@/stores/mainStore'
import Collapse from 'bootstrap/js/dist/collapse'

const mainStore = useMainStore()
const isCfoOrAdmin = computed(() => {
  const roles = mainStore.user?.roles || []
  return roles.some(r => r.toLowerCase() === 'admin' || r.toLowerCase() === 'cfo')
})

// Persist and restore sidebar submenu open state and scroll position
const route = useRoute()
const OPEN_MENUS_KEY = 'wd_sidebar_open_menus'
const SCROLL_POS_KEY = 'wd_sidebar_scroll'

let collapseHandlers = []
let scrollContainer = null

function getOpenMenusFromStorage() {
  try {
    const raw = localStorage.getItem(OPEN_MENUS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

function saveOpenMenus(ids) {
  try {
    localStorage.setItem(OPEN_MENUS_KEY, JSON.stringify(ids))
  } catch (e) {
    // no-op
  }
}

function updateOpenMenusFromDOM() {
  const open = Array.from(document.querySelectorAll('.menu-dropdown.show'))
    .map(el => el.id)
    .filter(Boolean)
  saveOpenMenus(open)
}

// Remove data-bs-toggle from our sidebar anchors so Bootstrap's data-api stops
// auto-handling clicks on them (it was fighting our explicit toggle and re-opening
// menus the user just closed). We mark each with data-wd-toggle for our own selectors.
function stripBootstrapToggles() {
  const navbar = document.getElementById('navbar-nav')
  if (!navbar) return
  navbar.querySelectorAll('a[data-bs-toggle="collapse"]').forEach(el => {
    el.setAttribute('data-wd-toggle', '')
    el.removeAttribute('data-bs-toggle')
  })
}

function applyOpenMenus(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id)
    if (el && !el.classList.contains('show')) {
      el.classList.add('show')
      const toggle = document.querySelector(`a[href="#${id}"][data-wd-toggle]`)
      if (toggle) toggle.setAttribute('aria-expanded', 'true')
    }
  })
}

// Menus the user has explicitly closed at the current route path. Cleared on path
// change, so navigating to a new page restores the auto-open behavior.
const userClosedAtPath = new Set()

function ensureAncestorsForActive() {
  // Mark active link's parent collapses as open (unless user explicitly closed them)
  const activeLink = document.querySelector('.navbar-nav a.router-link-active')
  if (!activeLink) return

  const keepOpenIds = new Set()
  let parent = activeLink.closest('.menu-dropdown')
  while (parent) {
    const id = parent.id
    if (id && !userClosedAtPath.has(id)) {
      parent.classList.add('show')
      keepOpenIds.add(id)
      const toggle = document.querySelector(`a[href="#${id}"][data-wd-toggle]`)
      if (toggle) toggle.setAttribute('aria-expanded', 'true')
    }
    parent = parent.parentElement?.closest('.menu-dropdown') || null
  }
  // Close other top-level sections that are not ancestors of the active route
  const topLevels = Array.from(document.querySelectorAll('.navbar-nav > li .menu-dropdown'))
    .filter(el => !el.parentElement?.closest('.menu-dropdown'))
  topLevels.forEach(tl => {
    const id = tl.id
    if (id && !keepOpenIds.has(id) && tl.classList.contains('show')) {
      tl.classList.remove('show')
      tl.querySelectorAll('.menu-dropdown.show').forEach(child => child.classList.remove('show'))
      const toggle = document.querySelector(`a[href="#${id}"][data-wd-toggle]`)
      if (toggle) toggle.setAttribute('aria-expanded', 'false')
    }
  })
  persistOpenMenus()
}

function bindBootstrapEvents() {
  const collapses = document.querySelectorAll('.menu-dropdown')
  collapses.forEach(el => {
    const handlerShown = () => updateOpenMenusFromDOM()
    const handlerHidden = () => updateOpenMenusFromDOM()
    el.addEventListener('shown.bs.collapse', handlerShown)
    el.addEventListener('hidden.bs.collapse', handlerHidden)
    collapseHandlers.push({ el, handlerShown, handlerHidden })
  })
}

// Capture-phase click handler: takes over from Bootstrap's data-api so we control
// toggle behavior deterministically and add accordion (close-siblings) behavior.
// We toggle the .show class directly rather than going through Bootstrap's Collapse
// API — Bootstrap's hide() can bail when the scoped .collapsing CSS interferes with
// its height transition, leaving _isTransitioning stuck.
let toggleClickHandler = null
function persistOpenMenus() {
  const open = Array.from(document.querySelectorAll('.menu-dropdown.show'))
    .map(el => el.id)
    .filter(Boolean)
  saveOpenMenus(open)
}
// Animate the .menu-dropdown height transition ourselves, mirroring Bootstrap's
// collapse flow (collapse → collapsing → height transition → collapse+show) so we
// stay independent of Bootstrap's Collapse API while keeping the smooth motion.
const TRANSITION_MS = 350

function cancelInFlight(el) {
  if (el._wdFinish) el._wdFinish()
}

function animateOpen(el) {
  cancelInFlight(el)
  el.classList.remove('collapse')
  el.classList.add('collapsing')
  el.style.height = '0px'
  // Force reflow so the browser registers the starting height before we set the target
  void el.offsetHeight
  el.style.height = el.scrollHeight + 'px'
  const finish = (e) => {
    if (e && e.target !== el) return
    if (e && e.propertyName && e.propertyName !== 'height') return
    el.classList.remove('collapsing')
    el.classList.add('collapse', 'show')
    el.style.height = ''
    el.removeEventListener('transitionend', finish)
    if (el._wdTimer) { clearTimeout(el._wdTimer); el._wdTimer = null }
    el._wdFinish = null
  }
  el._wdFinish = finish
  el.addEventListener('transitionend', finish)
  el._wdTimer = setTimeout(finish, TRANSITION_MS + 50)
}

function animateClose(el) {
  cancelInFlight(el)
  el.style.height = el.scrollHeight + 'px'
  void el.offsetHeight
  el.classList.remove('show', 'collapse')
  el.classList.add('collapsing')
  el.style.height = '0px'
  const finish = (e) => {
    if (e && e.target !== el) return
    if (e && e.propertyName && e.propertyName !== 'height') return
    el.classList.remove('collapsing')
    el.classList.add('collapse')
    el.style.height = ''
    el.removeEventListener('transitionend', finish)
    if (el._wdTimer) { clearTimeout(el._wdTimer); el._wdTimer = null }
    el._wdFinish = null
  }
  el._wdFinish = finish
  el.addEventListener('transitionend', finish)
  el._wdTimer = setTimeout(finish, TRANSITION_MS + 50)
}

function setMenuOpen(el, open) {
  const isShown = el.classList.contains('show')
  const isAnimating = el.classList.contains('collapsing')
  if (open && isShown && !isAnimating) {
    // already open
  } else if (!open && !isShown && !isAnimating) {
    // already closed
  } else if (open) {
    animateOpen(el)
  } else {
    animateClose(el)
  }
  if (el.id) {
    const tgl = document.querySelector(`a[href="#${el.id}"][data-wd-toggle]`)
    if (tgl) tgl.setAttribute('aria-expanded', open ? 'true' : 'false')
  }
}
function handleToggleClick(e) {
  const toggle = e.target.closest('a[data-wd-toggle]')
  if (!toggle) return
  const navbar = document.getElementById('navbar-nav')
  if (!navbar || !navbar.contains(toggle)) return

  e.preventDefault()
  e.stopImmediatePropagation()

  const targetId = (toggle.getAttribute('href') || '').replace(/^#/, '')
  if (!targetId) return
  const target = document.getElementById(targetId)
  if (!target) return

  const isShown = target.classList.contains('show')

  if (isShown) {
    setMenuOpen(target, false)
    userClosedAtPath.add(targetId)
    persistOpenMenus()
    return
  }

  // User reopened — clear the explicit-close mark
  userClosedAtPath.delete(targetId)

  // Accordion: close any open menus that share the same nesting level
  // (same direct .menu-dropdown ancestor, or both at root)
  const myParent = target.parentElement?.closest('.menu-dropdown') || null
  document.querySelectorAll('.menu-dropdown.show').forEach(el => {
    if (el === target) return
    const elParent = el.parentElement?.closest('.menu-dropdown') || null
    if (elParent !== myParent) return
    setMenuOpen(el, false)
  })

  setMenuOpen(target, true)
  persistOpenMenus()
}

function unbindBootstrapEvents() {
  collapseHandlers.forEach(({ el, handlerShown, handlerHidden }) => {
    el.removeEventListener('shown.bs.collapse', handlerShown)
    el.removeEventListener('hidden.bs.collapse', handlerHidden)
  })
  collapseHandlers = []
}

function restoreScrollPosition() {
  scrollContainer = document.getElementById('scrollbar')
  if (!scrollContainer) return
  const y = Number(localStorage.getItem(SCROLL_POS_KEY) || 0)
  scrollContainer.scrollTop = y
  const onScroll = () => {
    try { localStorage.setItem(SCROLL_POS_KEY, String(scrollContainer.scrollTop)) } catch (e) {}
  }
  scrollContainer.addEventListener('scroll', onScroll)
  // Save to cleanup if needed
  collapseHandlers.push({ el: scrollContainer, handlerShown: onScroll, handlerHidden: onScroll })
}

onMounted(async () => {
  await nextTick()
  // 1) Strip Bootstrap's data-bs-toggle so its data-api stops handling clicks here
  stripBootstrapToggles()
  // 2) Restore previously open menus
  applyOpenMenus(getOpenMenusFromStorage())
  // 3) Ensure ancestors of the active route are open
  ensureAncestorsForActive()
  // 4) Bind to Bootstrap collapse events to persist changes
  bindBootstrapEvents()
  // 5) Restore sidebar scroll position
  restoreScrollPosition()
  // 6) Install our click handler
  toggleClickHandler = handleToggleClick
  document.addEventListener('click', toggleClickHandler, true)
})

onBeforeUnmount(() => {
  unbindBootstrapEvents()
  if (toggleClickHandler) {
    document.removeEventListener('click', toggleClickHandler, true)
    toggleClickHandler = null
  }
})

// Watch route changes to keep ancestors open when navigating. Use route.path so
// hash/query changes don't trigger this — only real page navigation should
// recompute. Clear the user-closed set since the user moved to a new page.
watch(() => route.path, async () => {
  userClosedAtPath.clear()
  await nextTick()
  ensureAncestorsForActive()
})
</script>

<style scoped>
/* Override the default theme's sidebar arrow to use Remix Icons */
.nav-link[data-bs-toggle="collapse"]::after,
.nav-link[data-wd-toggle]::after {
    content: "\ea6e" !important; /* Remixicon: ri-arrow-right-s-line */
    font-family: 'remixicon' !important;
    margin-left: auto;
    transition: transform .2s;
    font-size: 1.05rem;
}

.nav-link[data-bs-toggle="collapse"][aria-expanded="true"]::after,
.nav-link[data-wd-toggle][aria-expanded="true"]::after {
    transform: rotate(90deg);
}

/* Basic styles to make the sidebar visible */
.app-menu {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 250px;
  background-color: #ffffff; /* White background */
  color: #343a40; /* Dark text */
  padding-top: 10px;
  z-index: 100;
  border-right: 1px solid #e9ecef; /* Add a border to distinguish from content */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.navbar-menu { padding: 0 !important; }
.navbar-brand-box { flex: 0 0 auto; }
#scrollbar { flex: 1 1 auto; overflow-y: auto; overflow-x: hidden; }
.navbar-nav .nav-link {
  color: #495057; /* Darker link color */
}
.navbar-nav .nav-link:hover {
  color: #000; /* Black hover color */
}
.navbar-nav .nav-link.router-link-active {
  font-weight: 600;
  color: #405189; /* Velzon primary tone */
}
/* Ensure collapse animations are enabled (in case theme overrides). Height is set
   inline by our JS during transition, so we deliberately do NOT pin height here. */
.collapse:not(.show) { display: none !important; }
.collapsing { overflow: hidden !important; transition: height .35s ease !important; position: relative; }
.menu-title {
  padding: 12px 20px;
  letter-spacing: .05em;
  pointer-events: none;
  cursor: default;
  font-size: 11px;
  text-transform: uppercase;
  color: #878a99;
  font-weight: 600;
}
</style>
