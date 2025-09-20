<template>
  <div>
    <!-- Page Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div>
          <h4 class="mb-1">Payroll Hours</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item">Reports</li>
            <li class="breadcrumb-item active" aria-current="page">Payroll Hours</li>
          </ol>
        </div>
        <div class="d-flex align-items-end gap-2 flex-wrap">
          <div>
            <label class="form-label mb-1">Start Date</label>
            <input type="date" class="form-control" v-model="startDate" />
          </div>
          <div>
            <label class="form-label mb-1">End Date</label>
            <input type="date" class="form-control" v-model="endDate" />
          </div>
          <div class="d-flex align-items-end">
            <button class="btn btn-primary" @click="onSearch">Search</button>
          </div>
          <div class="d-flex align-items-end">
            <button class="btn btn-secondary" :disabled="filteredRows.length === 0" @click="exportCsv">Export CSV</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table align-middle table-striped">
            <thead>
              <tr v-if="startDate && endDate">
                <th :colspan="hasHours ? 7 : 6" class="bg-light sticky">
                  Date Range: {{ formatDate(startDate) }} - {{ formatDate(endDate) }}
                </th>
              </tr>
              <tr>
                <th scope="col">Product Code</th>
                <th scope="col">Product</th>
                <th scope="col">Product Year</th>
                <th scope="col">Activity Code</th>
                <th scope="col">Activity</th>
                <th scope="col" class="text-end">Hours</th>
                <th scope="col" class="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredRows.length === 0">
                <td :colspan="hasHours ? 7 : 6" class="text-center text-muted">No data. Choose a date range and click Search.</td>
              </tr>
              <tr v-for="(row, idx) in filteredRows" :key="idx">
                <td>{{ row.productCode }}</td>
                <td>{{ row.product }}</td>
                <td>{{ row.productYearName }}</td>
                <td>{{ row.activityCode }}</td>
                <td>{{ row.activity }}</td>
                <td class="text-end">{{ formatNumber(row.hours) }}</td>
                <td class="text-end">{{ formatCurrency(row.total) }}</td>
              </tr>
            </tbody>
            <tfoot v-if="filteredRows.length > 0">
              <tr>
                <th :colspan="5" class="text-end">Totals</th>
                <th class="text-end">{{ formatNumber(totalHours) }}</th>
                <th class="text-end">{{ formatCurrency(totalAmount) }}</th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api.js'

const startDate = ref('')
const endDate = ref('')
const hasSearched = ref(false)
const loading = ref(false)
const errorMessage = ref('')

// Data populated from API
const allRows = ref([])

const filteredRows = computed(() => {
  // API already returns server-filtered data; just gate by hasSearched
  if (!hasSearched.value) return []
  return allRows.value
})

// Determine if Hours data is present to show/hide the column
const hasHours = computed(() => {
  return filteredRows.value.some(r => r.hours !== undefined && r.hours !== null)
})

const totalHours = computed(() => filteredRows.value.reduce((sum, r) => sum + Number(r.hours || 0), 0))
const totalAmount = computed(() => filteredRows.value.reduce((sum, r) => sum + Number(r.total || 0), 0))

async function onSearch() {
  if (!startDate.value || !endDate.value) return
  errorMessage.value = ''
  loading.value = true
  try {
    const params = { startDate: startDate.value, endDate: endDate.value }
    const { data } = await api.get('payrollamounts', { params })
    // Map API response to view model fields
    // API items: { productCode, productName, productYear, productYearName, activityCode, activityName, total }
    allRows.value = Array.isArray(data)
      ? data.map(item => ({
          productCode: item.productCode ?? '',
          product: item.productName ?? '',
          productYearCode: item.productYear ?? '',
          productYearName: item.productYearName ?? item.productYear ?? '',
          activityCode: item.activityCode ?? '',
          activity: item.activityName ?? '',
          hours: item.hours !== undefined && item.hours !== null ? Number(item.hours) : undefined,
          total: Number(item.total ?? 0),
        }))
      : []
    hasSearched.value = true
  } catch (err) {
    errorMessage.value = 'Failed to load data.'
    allRows.value = []
    hasSearched.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Default to last 7 days
  const today = new Date()
  const weekAgo = new Date()
  weekAgo.setDate(today.getDate() - 7)
  const toStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  startDate.value = toStr(weekAgo)
  endDate.value = toStr(today)
  onSearch()
})

function formatNumber(n) {
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatCurrency(n) {
  return Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d)) return value
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

function exportCsv() {
  if (filteredRows.value.length === 0) return
  const lines = []
  // Title with date range
  lines.push([`Date Range: ${formatDate(startDate.value)} - ${formatDate(endDate.value)}`].join(','))
  // Blank line
  lines.push('')
  // Headers
  const headers = hasHours.value
    ? ['Product Code', 'Product', 'Product Year', 'Activity Code', 'Activity', 'Hours', 'Total']
    : ['Product Code', 'Product', 'Product Year', 'Activity Code', 'Activity', 'Total']
  lines.push(headers.join(','))
  // Data rows (use raw numbers for Excel friendliness)
  for (const r of filteredRows.value) {
    const base = [
      csvEscape(r.productCode),
      csvEscape(r.product),
      csvEscape(r.productYearName),
      csvEscape(r.activityCode),
      csvEscape(r.activity),
    ]
    const row = hasHours.value
      ? [...base, Number(r.hours ?? 0).toFixed(2), Number(r.total ?? 0).toFixed(2)]
      : [...base, Number(r.total ?? 0).toFixed(2)]
    lines.push(row.join(','))
  }
  // Totals
  if (hasHours.value) {
    // 5 leading columns (codes/names), then Hours and Total
    lines.push(['Totals', '', '', '', '', Number(totalHours.value).toFixed(2), Number(totalAmount.value).toFixed(2)].join(','))
  } else {
    // 5 leading columns, then Total only
    lines.push(['Totals', '', '', '', '', Number(totalAmount.value).toFixed(2)].join(','))
  }

  const csv = lines.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `PayrollHours_${startDate.value}_${endDate.value}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function csvEscape(val) {
  if (val === null || val === undefined) return ''
  const s = String(val)
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}
</script>

<style scoped>
/* Make the date-range header sticky */
.sticky {
  position: sticky;
  top: 0;
  z-index: 1;
}
</style>
