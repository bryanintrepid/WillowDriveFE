<template>
  <div class="page-content">
    <!-- Header / Breadcrumbs -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <!-- Top row: title/breadcrumbs left, buttons right -->
      <div class="d-flex align-items-center justify-content-between gap-3 flex-wrap">
        <div>
          <h4 class="mb-1">Balance Sheet</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item active" aria-current="page">Balance Sheet</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <button type="button" class="btn" :class="editOrder ? 'btn-warning' : 'btn-primary'" @click="editOrder = !editOrder">
            <i class="ri-edit-line me-1"></i>{{ editOrder ? 'Done' : 'Edit' }}
          </button>
          <button type="button" class="btn btn-primary" @click="exportBalanceSheet">
            <i class="ri-download-2-line me-1"></i>Export
          </button>
          <button type="button" class="btn btn-primary" @click="updateBalances">
            <i class="ri-upload-2-line me-1"></i>Update Balances
          </button>
        </div>
      </div>
      <!-- Second row: inline filters -->
      <div class="d-flex align-items-center gap-2 flex-wrap mt-2">
        <!-- Month start -->
        <select class="form-select w-auto" v-model.number="selectedMonth" @change="changeMonth" style="max-width: 200px; flex: 0 0 auto;">
          <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
        <!-- Month end -->
        <select class="form-select w-auto" v-model.number="selectedEndMonth" @change="changeMonth" style="max-width: 200px; flex: 0 0 auto;">
          <option :value="null">End Month</option>
          <option v-for="m in monthOptions" :key="'end-' + m.value" :value="m.value">{{ m.label }}</option>
        </select>
        <!-- Fiscal Year -->
        <select class="form-select w-auto" v-model.number="selectedYear" @change="changeYear" style="max-width: 110px; flex: 0 0 auto;">
          <option v-for="y in yearOptions" :key="y" :value="y">FY {{ y }}</option>
        </select>
      </div>
    </div>

    <!-- Grid -->
    <div class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th v-if="editOrder" class="text-nowrap">Actions</th>
                <th class="text-start">Account</th>
                <th v-show="adjustRange(6)" class="text-end">JUN</th>
                <th v-show="adjustRange(5)" class="text-end">MAY</th>
                <th v-show="adjustRange(4)" class="text-end">APR</th>
                <th v-show="adjustRange(3)" class="text-end">MAR</th>
                <th v-show="adjustRange(2)" class="text-end">FEB</th>
                <th v-show="adjustRange(1)" class="text-end">JAN</th>
                <th v-show="adjustRange(12)" class="text-end">DEC</th>
                <th v-show="adjustRange(11)" class="text-end">NOV</th>
                <th v-show="adjustRange(10)" class="text-end">OCT</th>
                <th v-show="adjustRange(9)" class="text-end">SEP</th>
                <th v-show="adjustRange(8)" class="text-end">AUG</th>
                <th v-show="adjustRange(7)" class="text-end">JUL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="account in orderedAccounts" :key="account.accountNumber">
                <td v-if="editOrder" class="text-nowrap">
                  <button class="btn btn-sm btn-primary me-1" @click="moveUp(account.accountNumber)" title="Move Up">
                    <i class="ri-arrow-up-line"></i>
                  </button>
                  <button class="btn btn-sm btn-info" @click="moveDown(account.accountNumber)" title="Move Down">
                    <i class="ri-arrow-down-line"></i>
                  </button>
                </td>
                <td class="text-start">
                  <span :style="{ paddingLeft: (10 + (20 * ((account.displayLevel ?? account.level ?? 0)))) + 'px' }">
                    {{ account.accountNumber }} - {{ account.description }}
                  </span>
                </td>
                <td v-show="adjustRange(6)" class="text-end">{{ formatCurrency(account.junBalance) }}</td>
                <td v-show="adjustRange(5)" class="text-end">{{ formatCurrency(account.mayBalance) }}</td>
                <td v-show="adjustRange(4)" class="text-end">{{ formatCurrency(account.aprBalance) }}</td>
                <td v-show="adjustRange(3)" class="text-end">{{ formatCurrency(account.marBalance) }}</td>
                <td v-show="adjustRange(2)" class="text-end">{{ formatCurrency(account.febBalance) }}</td>
                <td v-show="adjustRange(1)" class="text-end">{{ formatCurrency(account.janBalance) }}</td>
                <td v-show="adjustRange(12)" class="text-end">{{ formatCurrency(account.decBalance) }}</td>
                <td v-show="adjustRange(11)" class="text-end">{{ formatCurrency(account.novBalance) }}</td>
                <td v-show="adjustRange(10)" class="text-end">{{ formatCurrency(account.octBalance) }}</td>
                <td v-show="adjustRange(9)" class="text-end">{{ formatCurrency(account.sepBalance) }}</td>
                <td v-show="adjustRange(8)" class="text-end">{{ formatCurrency(account.augBalance) }}</td>
                <td v-show="adjustRange(7)" class="text-end">{{ formatCurrency(account.julBalance) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { ref, computed } from 'vue'
import api from '@/services/api.js'

const year = new Date().getFullYear()
const fiscalYear = new Date().getMonth() > 5 ? year : year - 1

const accounts = ref([])
const editOrder = ref(false)
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedEndMonth = ref(null)
const selectedYear = ref(fiscalYear)

const monthOptions = [
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 }
]

const yearOptions = (() => {
  const years = []
  for (let i = 1; i > -3; i--) {
    years.push(fiscalYear + i)
  }
  return years
})()

function changeMonth() {
  getBalanceSheet(selectedMonth.value, selectedYear.value)
}

function changeYear() {
  getBalanceSheet(selectedMonth.value, selectedYear.value)
}

function adjustRange(target) {
  let selMonth = selectedMonth.value
  let selEndMonth = selectedEndMonth.value != null ? selectedEndMonth.value : 6

  if (selMonth < 7 && selEndMonth > 6) {
    selectedEndMonth.value = 6
    selEndMonth = 6
  }

  const val = (selMonth >= 7 && selEndMonth <= 12 && selEndMonth >= target && target >= selMonth) ||
              (selMonth >= 7 && selEndMonth <= 6 && (target <= selEndMonth || target >= selMonth)) ||
              (selMonth <= 6 && target <= selEndMonth && target >= selMonth)
  return val
}

function getBalanceSheet(inputMonth, inputYear) {
  if (inputYear == null) inputYear = fiscalYear
  if (inputMonth == null) inputMonth = new Date().getMonth() + 1

  api.get(`balancesheet?year=${inputYear}`)
    .then((response) => {
      accounts.value = response.data
    })
    .catch((error) => {
      console.error('balancesheet error', error)
    })
}

getBalanceSheet()

// Build a parent-child ordered, flattened list for display
const orderedAccounts = computed(() => {
  const list = Array.isArray(accounts.value) ? accounts.value : []
  if (list.length === 0) return []

  // Map accounts by accountNumber
  const byId = new Map(list.map(a => [String(a.accountNumber), a]))

  // Build children map
  const childrenMap = new Map()
  for (const a of list) {
    const parent = a.parentAccountNumber ? String(a.parentAccountNumber) : null
    if (parent && byId.has(parent)) {
      if (!childrenMap.has(parent)) childrenMap.set(parent, [])
      childrenMap.get(parent).push(a)
    }
  }

  // Roots: no parent or parent not present in the set
  const roots = list.filter(a => {
    const p = a.parentAccountNumber ? String(a.parentAccountNumber) : null
    return !p || !byId.has(p)
  })

  const sortFn = (a, b) => {
    const sa = a.statementOrder ?? Number.MAX_SAFE_INTEGER
    const sb = b.statementOrder ?? Number.MAX_SAFE_INTEGER
    if (sa !== sb) return sa - sb
    return String(a.accountNumber).localeCompare(String(b.accountNumber))
  }

  roots.sort(sortFn)
  for (const [, arr] of childrenMap) arr.sort(sortFn)

  const result = []
  const visit = (node, depth) => {
    // Ensure depth is at least 0
    const d = Math.max(0, depth || 0)
    // Add a displayLevel used only for indentation
    result.push({ ...node, displayLevel: d })
    const kids = childrenMap.get(String(node.accountNumber)) || []
    for (const child of kids) visit(child, d + 1)
  }

  for (const r of roots) {
    // If a node references a parentAccountNumber but the parent is not present,
    // indent it one level to indicate it is conceptually a child.
    const initialDepth = r.parentAccountNumber ? 1 : 0
    visit(r, initialDepth)
  }

  // Include any orphans not visited (cyclic or missing links)
  if (result.length !== list.length) {
    const seen = new Set(result.map(a => a.accountNumber))
    const leftover = list.filter(a => !seen.has(a.accountNumber))
    leftover.sort(sortFn)
    result.push(...leftover)
  }

  return result
})

function moveUp(accountNumber) {
  const data = { accountNumber, fiscalYear: selectedYear.value }
  api.post('moveaccountup', data)
    .then(() => getBalanceSheet())
    .catch((error) => console.error('move up error', error))
}

function moveDown(accountNumber) {
  const data = { accountNumber, fiscalYear: selectedYear.value }
  api.post('moveaccountdown', data)
    .then(() => getBalanceSheet())
    .catch((error) => console.error('move down error', error))
}

function exportBalanceSheet() {
  api.get(`exportbalancesheet?year=${selectedYear.value}`, { responseType: 'blob' })
    .then((response) => {
      const blob = new Blob([response.data])
      if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, `balanceSheet_${selectedYear.value}_${selectedMonth.value}.csv`)
      } else {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob, { type: 'text/csv' })
        a.download = `balanceSheet_${selectedYear.value}_${selectedMonth.value}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    })
    .catch((error) => console.error('export error', error))
}

function updateBalances() {
  const data = { fiscalYear: selectedYear.value, targetYear: selectedYear.value + 1 }
  api.post('updatebalances', data)
    .then(() => alert('Updated'))
    .catch((error) => console.error('update balances error', error))
}

function formatCurrency(val) {
  return (Math.round(val * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })
}
</script>

<style scoped>
.table th, .table td { white-space: nowrap; }
/* Breadcrumb separator to match Velzon theme */
.breadcrumb-item + .breadcrumb-item::before {
  content: "\ea6e";
  font-family: 'remixicon';
  font-size: 14px;
  vertical-align: middle;
}
</style>
