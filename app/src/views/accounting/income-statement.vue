<template>
  <div class="page-content">
    <!-- Header / Breadcrumbs -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between gap-3 flex-wrap">
        <div>
          <h4 class="mb-1">Income Statement</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item active" aria-current="page">Income Statement</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <button type="button" class="btn" :class="editOrder ? 'btn-warning' : 'btn-primary'" @click="editOrder = !editOrder">
            <i class="ri-edit-line me-1"></i>{{ editOrder ? 'Done' : 'Edit' }}
          </button>
          <button type="button" class="btn btn-primary" @click="exportIncomeStatement">
            <i class="ri-download-2-line me-1"></i>Export
          </button>
          <button type="button" class="btn btn-primary" @click="updateBalances">
            <i class="ri-upload-2-line me-1"></i>Update Balances
          </button>
        </div>
      </div>

      <!-- Filters: Fiscal Year -->
      <div class="d-flex align-items-center gap-2 flex-wrap mt-2">
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
                <th class="text-end">YTD</th>
                <th class="text-end">JUL</th>
                <th class="text-end">AUG</th>
                <th class="text-end">SEP</th>
                <th class="text-end">OCT</th>
                <th class="text-end">NOV</th>
                <th class="text-end">DEC</th>
                <th class="text-end">JAN</th>
                <th class="text-end">FEB</th>
                <th class="text-end">MAR</th>
                <th class="text-end">APR</th>
                <th class="text-end">MAY</th>
                <th class="text-end">JUN</th>
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
                <td class="text-end">{{ formatCurrency(account.ytdBalance) }}</td>
                <td class="text-end">{{ formatCurrency(account.julBalance) }}</td>
                <td class="text-end">{{ formatCurrency(account.augBalance) }}</td>
                <td class="text-end">{{ formatCurrency(account.sepBalance) }}</td>
                <td class="text-end">{{ formatCurrency(account.octBalance) }}</td>
                <td class="text-end">{{ formatCurrency(account.novBalance) }}</td>
                <td class="text-end">{{ formatCurrency(account.decBalance) }}</td>
                <td class="text-end">{{ formatCurrency(account.janBalance) }}</td>
                <td class="text-end">{{ formatCurrency(account.febBalance) }}</td>
                <td class="text-end">{{ formatCurrency(account.marBalance) }}</td>
                <td class="text-end">{{ formatCurrency(account.aprBalance) }}</td>
                <td class="text-end">{{ formatCurrency(account.mayBalance) }}</td>
                <td class="text-end">{{ formatCurrency(account.junBalance) }}</td>
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
const selectedYear = ref(fiscalYear)

function getYearOptions() {
  const years = []
  for (let i = 1; i > -3; i--) years.push(fiscalYear + i)
  return years
}
const yearOptions = getYearOptions()

function changeYear() {
  getIncomeStatement(selectedYear.value)
}

function getIncomeStatement(inputYear) {
  api.get(`incomeStatement?year=${inputYear}`)
    .then((response) => {
      accounts.value = response.data
    })
    .catch((error) => {
      console.error('income statement error', error)
    })
}

getIncomeStatement(selectedYear.value)

// Build a parent-child ordered, flattened list for display
const orderedAccounts = computed(() => {
  const list = Array.isArray(accounts.value) ? accounts.value : []
  if (list.length === 0) return []

  const byId = new Map(list.map(a => [String(a.accountNumber), a]))
  const childrenMap = new Map()
  for (const a of list) {
    const parent = a.parentAccountNumber ? String(a.parentAccountNumber) : null
    if (parent && byId.has(parent)) {
      if (!childrenMap.has(parent)) childrenMap.set(parent, [])
      childrenMap.get(parent).push(a)
    }
  }

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
    const d = Math.max(0, depth || 0)
    result.push({ ...node, displayLevel: d })
    const kids = childrenMap.get(String(node.accountNumber)) || []
    for (const child of kids) visit(child, d + 1)
  }

  for (const r of roots) {
    const initialDepth = r.parentAccountNumber ? 1 : 0
    visit(r, initialDepth)
  }

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
    .then(() => getIncomeStatement(selectedYear.value))
    .catch((error) => console.error('move up error', error))
}

function moveDown(accountNumber) {
  const data = { accountNumber, fiscalYear: selectedYear.value }
  api.post('moveaccountdown', data)
    .then(() => getIncomeStatement(selectedYear.value))
    .catch((error) => console.error('move down error', error))
}

function exportIncomeStatement() {
  api.get(`exportincomestatement?year=${selectedYear.value}`, { responseType: 'blob' })
    .then((response) => {
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `incomeStatement_${selectedYear.value}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    })
    .catch((error) => console.error('export income statement error', error))
}

function updateBalances() {
  const data = { fiscalYear: selectedYear.value, targetYear: selectedYear.value + 1 }
  api.post('updatebalances', data)
    .then(() => alert('updated'))
    .catch((error) => console.error('update balances error', error))
}

function formatCurrency(val) {
  return (Math.round(val * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })
}
</script>

<style scoped>
.table th, .table td { white-space: nowrap; }
/* Breadcrumb separator styling comes from global SCSS */
</style>
