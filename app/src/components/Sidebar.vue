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
          <li class="nav-item">
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
                <li class="nav-item">
                  <router-link to="/accounting/balance-sheet" class="nav-link">Balance Sheet</router-link>
                </li>
                <li class="nav-item">
                  <router-link to="/accounting/income-statement" class="nav-link">Income Statement</router-link>
                </li>
                <li class="nav-item">
                  <router-link to="/accounting/chart-of-accounts" class="nav-link">Chart of Accounts</router-link>
                </li>
                <li class="nav-item">
                  <router-link to="/accounting/account-reconciliation" class="nav-link">Account Reconciliation</router-link>
                </li>
                
                <li class="nav-item">
                  <router-link to="/accounting/general-ledger" class="nav-link">General Ledger</router-link>
                </li>
                <li class="nav-item">
                  <router-link to="/accounting/pending-transactions" class="nav-link">Pending Transactions</router-link>
                </li>
                <li class="nav-item">
                  <a class="nav-link menu-link" href="#sidebarAccountingReports" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarAccountingReports">
                    <span>Reports</span>
                  </a>
                  <div class="collapse menu-dropdown" id="sidebarAccountingReports">
                    <ul class="nav nav-sm flex-column">
                      <li class="nav-item">
                        <router-link to="/accounting/reports/payroll-hours" class="nav-link">Payroll Hours</router-link>
                      </li>
                    </ul>
                  </div>
                </li>
                <li class="nav-item">
                  <a class="nav-link menu-link" href="#sidebarPayables" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarPayables">
                    <span>Payables</span>
                  </a>
                  <div class="collapse menu-dropdown" id="sidebarPayables">
                    <ul class="nav nav-sm flex-column">
                      <li class="nav-item">
                        <router-link to="/accounting/cash-planning" class="nav-link">Cash Planning</router-link>
                      </li>
                      <li class="nav-item">
                        <router-link to="/accounting/checks" class="nav-link">Checks</router-link>
                      </li>
                      <li class="nav-item">
                        <router-link to="/accounting/check-runs" class="nav-link">Check Runs</router-link>
                      </li>
                      <li class="nav-item">
                        <router-link to="/accounting/vendors" class="nav-link">Vendors</router-link>
                      </li>
                      <li class="nav-item">
                        <router-link to="/accounting/vendor-invoices" class="nav-link">Vendor Invoices</router-link>
                      </li>
                      <li class="nav-item">
                        <router-link to="/accounting/discounts" class="nav-link">Discounts</router-link>
                      </li>
                    </ul>
                  </div>
                </li>
                <li class="nav-item">
                  <a class="nav-link menu-link" href="#sidebarReceivables" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarReceivables">
                    <span>Receivables</span>
                  </a>
                  <div class="collapse menu-dropdown" id="sidebarReceivables">
                    <ul class="nav nav-sm flex-column">
                      <li class="nav-item">
                        <router-link to="/accounting/cash-receipts" class="nav-link">Cash Receipts</router-link>
                      </li>
                      <li class="nav-item">
                        <router-link to="/accounting/invoice-transactions" class="nav-link">Invoice Transactions</router-link>
                      </li>
                      <li class="nav-item">
                        <router-link to="/accounting/statements" class="nav-link">Statements</router-link>
                      </li>
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
import { onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import Collapse from 'bootstrap/js/dist/collapse'

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

function applyOpenMenus(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id)
    if (el && !el.classList.contains('show')) {
      try {
        const instance = Collapse.getOrCreateInstance(el, { toggle: false })
        instance.show()
      } catch (e) {
        el.classList.add('show')
      }
      const toggle = document.querySelector(`a[href="#${id}"][data-bs-toggle="collapse"]`)
      if (toggle) toggle.setAttribute('aria-expanded', 'true')
    }
  })
}

function ensureAncestorsForActive() {
  // Mark active link's parent collapses as open
  const activeLink = document.querySelector('.navbar-nav a.router-link-active')
  if (!activeLink) return

  const openedIds = new Set(getOpenMenusFromStorage())
  const keepOpenIds = new Set()
  let parent = activeLink.closest('.menu-dropdown')
  while (parent) {
    try {
      const instance = Collapse.getOrCreateInstance(parent, { toggle: false })
      instance.show()
    } catch (e) {
      parent.classList.add('show')
    }
    const id = parent.id
    if (id) {
      openedIds.add(id)
      keepOpenIds.add(id)
      const toggle = document.querySelector(`a[href="#${id}"][data-bs-toggle="collapse"]`)
      if (toggle) toggle.setAttribute('aria-expanded', 'true')
    }
    parent = parent.parentElement?.closest('.menu-dropdown') || null
  }
  // Close other top-level sections that are not ancestors of the active route
  const topLevels = Array.from(document.querySelectorAll('.navbar-nav > li .menu-dropdown'))
    .filter(el => !el.parentElement?.closest('.menu-dropdown'))
  topLevels.forEach(tl => {
    const id = tl.id
    if (id && !keepOpenIds.has(id)) {
      // Close this top-level and any open descendants
      try {
        // Use Bootstrap's API to animate close
        const instance = Collapse.getOrCreateInstance(tl, { toggle: false })
        // Force reflow to ensure transition can start
        void tl.offsetHeight
        // Schedule on next frame for reliability
        requestAnimationFrame(() => instance.hide())
      } catch (e) {
        // Fallback: immediate close
        tl.classList.remove('show')
        tl.querySelectorAll('.menu-dropdown.show').forEach(child => child.classList.remove('show'))
      }
      const toggle = document.querySelector(`a[href="#${id}"][data-bs-toggle="collapse"]`)
      if (toggle) toggle.setAttribute('aria-expanded', 'false')
      openedIds.delete(id)
    }
  })
  // Do not force recompute immediately; let 'hidden.bs.collapse' events persist state after animation
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
  // 1) Restore previously open menus
  applyOpenMenus(getOpenMenusFromStorage())
  // 2) Ensure ancestors of the active route are open
  ensureAncestorsForActive()
  // 3) Bind to Bootstrap collapse events to persist changes
  bindBootstrapEvents()
  // 4) Restore sidebar scroll position
  restoreScrollPosition()
})

onBeforeUnmount(() => {
  unbindBootstrapEvents()
})

// Watch route changes to keep ancestors open when navigating
watch(() => route.fullPath, async () => {
  await nextTick()
  ensureAncestorsForActive()
})
</script>

<style scoped>
/* Override the default theme's sidebar arrow to use Remix Icons */
.nav-link[data-bs-toggle="collapse"]::after {
    content: "\ea6e" !important; /* Remixicon: ri-arrow-right-s-line */
    font-family: 'remixicon' !important;
    margin-left: auto;
    transition: transform .2s;
    font-size: 1.05rem;
}

.nav-link[data-bs-toggle="collapse"][aria-expanded="true"]::after {
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
/* Ensure collapse animations are enabled (in case theme overrides) */
.collapse:not(.show) { display: none !important; }
.collapsing { height: 0 !important; overflow: hidden !important; transition: height .35s ease !important; }
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
