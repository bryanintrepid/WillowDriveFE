<template>
  <div>
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="dashhead-titles">
        <ol class="breadcrumb m-0 align-items-center">
          <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
          <li class="breadcrumb-item">Accounting</li>
          <li class="breadcrumb-item active" aria-current="page">Reconciliation Workbench</li>
        </ol>
      </div>
    </div>

    <div v-if="banner.message" class="alert" :class="banner.cssClass">
      <strong>{{ banner.title }}</strong> <span class="ms-2">{{ banner.message }}</span>
      <button type="button" class="btn-close float-end" @click="banner.message = ''"></button>
    </div>

    <!-- Period header -->
    <div class="card mb-3">
      <div class="card-body">
        <div class="d-flex flex-wrap align-items-center gap-3">
          <div class="flex-grow-1 d-flex align-items-center gap-3">
            <div class="d-flex align-items-center gap-2">
              <label class="form-label fw-bold mb-0">FY</label>
              <select class="form-select form-select-sm" style="width: 90px;" v-model.number="selectedFy" @change="loadAll">
                <option v-for="y in fyOptions" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
            <div class="d-flex align-items-center gap-2">
              <label class="form-label fw-bold mb-0">Period</label>
              <select class="form-select form-select-sm" style="width: 80px;" v-model.number="selectedPeriod" @change="loadAll">
                <option v-for="p in 12" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>
            <span v-if="periodRange" class="text-muted fs-14">{{ periodRange }}</span>
          </div>
          <button class="btn btn-outline-secondary btn-sm" :disabled="loading" @click="loadAll">
            <i class="ri-refresh-line"></i> Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <button class="nav-link" :class="{ active: tab === 'bank' }" @click="tab = 'bank'">
          <i class="ri-bank-line me-1"></i>Bank Rec
          <span v-if="bankRec" class="badge ms-1" :class="bankRec.isReconciled ? 'text-bg-success' : 'text-bg-warning'">
            {{ bankRec.isReconciled ? 'Reconciled' : money(bankRec.variance) }}
          </span>
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: tab === 'ar' }" @click="tab = 'ar'">
          <i class="ri-user-received-line me-1"></i>AR Tie-Out
          <span v-if="arTieOut" class="badge ms-1" :class="arTieOut.isTiedOut ? 'text-bg-success' : 'text-bg-warning'">
            {{ arTieOut.isTiedOut ? 'Tied' : money(arTieOut.variance) }}
          </span>
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: tab === 'ap' }" @click="tab = 'ap'">
          <i class="ri-user-shared-line me-1"></i>AP Tie-Out
          <span v-if="apTieOut" class="badge ms-1" :class="apTieOut.isTiedOut ? 'text-bg-success' : 'text-bg-warning'">
            {{ apTieOut.isTiedOut ? 'Tied' : money(apTieOut.variance) }}
          </span>
        </button>
      </li>
    </ul>

    <!-- Bank Rec Tab -->
    <div v-if="tab === 'bank'" class="card mb-3">
      <div class="card-header"><h6 class="mb-0">Bank Reconciliation — {{ bankRec?.accountNumber }} {{ bankRec?.accountDescription }}</h6></div>
      <div class="card-body" v-if="bankRec">
        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <div class="card bg-light">
              <div class="card-body">
                <h6 class="text-muted">GL Book Balance</h6>
                <h4>{{ money(bankRec.glBookBalance) }}</h4>
                <small class="text-muted">BeginningBalance + Debits - Credits for the period</small>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card bg-light">
              <div class="card-body">
                <h6 class="text-muted">Bank Statement Balance</h6>
                <h4>{{ money(bankRec.bankStatementBalance) }}</h4>
                <small class="text-muted">Deposits - Withdrawals from KeyBank</small>
              </div>
            </div>
          </div>
        </div>
        <table class="table table-sm mb-3">
          <tbody>
            <tr><td>Matched check clearings</td><td class="text-end">{{ bankRec.matchedCount }}</td><td class="text-end">{{ money(bankRec.matchedAmount) }}</td></tr>
            <tr><td>Outstanding checks (unmatched debits)</td><td class="text-end">{{ bankRec.outstandingChecksCount }}</td><td class="text-end">{{ money(bankRec.outstandingChecksAmount) }}</td></tr>
            <tr><td>Deposits in transit (unmatched credits)</td><td class="text-end">{{ bankRec.outstandingDepositsCount }}</td><td class="text-end">{{ money(bankRec.outstandingDepositsAmount) }}</td></tr>
            <tr><td>Bank fees/charges</td><td class="text-end">{{ bankRec.bankFeesCount }}</td><td class="text-end">{{ money(bankRec.bankFeesAmount) }}</td></tr>
            <tr class="table-light fw-bold"><td>Adjusted Balance (GL - fees)</td><td></td><td class="text-end">{{ money(bankRec.adjustedBalance) }}</td></tr>
            <tr :class="bankRec.isReconciled ? 'table-success' : 'table-warning'">
              <td class="fw-bold">Variance</td><td></td><td class="text-end fw-bold">{{ money(bankRec.variance) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="d-flex gap-2">
          <button class="btn btn-primary btn-sm" :disabled="loading" @click="createWorksheet('Bank', bankRec.accountNumber)">
            <i class="ri-save-line"></i> Save as Worksheet
          </button>
        </div>
      </div>
      <div v-else class="card-body text-center text-muted py-4">
        <p>Loading bank reconciliation data...</p>
      </div>
    </div>

    <!-- AR Tie-Out Tab -->
    <div v-if="tab === 'ar'" class="card mb-3">
      <div class="card-header"><h6 class="mb-0">AR Subledger Tie-Out — {{ arTieOut?.accountNumber }} {{ arTieOut?.accountDescription }}</h6></div>
      <div class="card-body" v-if="arTieOut">
        <div class="row g-3 mb-3">
          <div class="col-md-4">
            <div class="card bg-light"><div class="card-body">
              <h6 class="text-muted">GL Ending Balance</h6>
              <h4>{{ money(arTieOut.glEndingBalance) }}</h4>
            </div></div>
          </div>
          <div class="col-md-4">
            <div class="card bg-light"><div class="card-body">
              <h6 class="text-muted">Open Invoices Total</h6>
              <h4>{{ money(arTieOut.subledgerTotal) }}</h4>
              <small class="text-muted">{{ arTieOut.openItemCount }} open invoice{{ arTieOut.openItemCount === 1 ? '' : 's' }}</small>
            </div></div>
          </div>
          <div class="col-md-4">
            <div class="card" :class="arTieOut.isTiedOut ? 'bg-success-subtle' : 'bg-warning-subtle'"><div class="card-body">
              <h6 class="text-muted">Variance</h6>
              <h4>{{ money(arTieOut.variance) }}</h4>
              <small>{{ arTieOut.isTiedOut ? 'Tied out' : 'Needs investigation' }}</small>
            </div></div>
          </div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-primary btn-sm" :disabled="loading" @click="createWorksheet('AR', arTieOut.accountNumber)">
            <i class="ri-save-line"></i> Save as Worksheet
          </button>
        </div>
      </div>
    </div>

    <!-- AP Tie-Out Tab -->
    <div v-if="tab === 'ap'" class="card mb-3">
      <div class="card-header"><h6 class="mb-0">AP Subledger Tie-Out — {{ apTieOut?.accountNumber }} {{ apTieOut?.accountDescription }}</h6></div>
      <div class="card-body" v-if="apTieOut">
        <div class="row g-3 mb-3">
          <div class="col-md-4">
            <div class="card bg-light"><div class="card-body">
              <h6 class="text-muted">GL Ending Balance</h6>
              <h4>{{ money(apTieOut.glEndingBalance) }}</h4>
              <small class="text-muted">Credit balance (payables owed)</small>
            </div></div>
          </div>
          <div class="col-md-4">
            <div class="card bg-light"><div class="card-body">
              <h6 class="text-muted">Open Invoices Total</h6>
              <h4>{{ money(apTieOut.subledgerTotal) }}</h4>
              <small class="text-muted">{{ apTieOut.openItemCount }} open invoice{{ apTieOut.openItemCount === 1 ? '' : 's' }}</small>
            </div></div>
          </div>
          <div class="col-md-4">
            <div class="card" :class="apTieOut.isTiedOut ? 'bg-success-subtle' : 'bg-warning-subtle'"><div class="card-body">
              <h6 class="text-muted">Variance</h6>
              <h4>{{ money(apTieOut.variance) }}</h4>
              <small>{{ apTieOut.isTiedOut ? 'Tied out' : 'Needs investigation' }}</small>
            </div></div>
          </div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-primary btn-sm" :disabled="loading" @click="createWorksheet('AP', apTieOut.accountNumber)">
            <i class="ri-save-line"></i> Save as Worksheet
          </button>
        </div>
      </div>
    </div>

    <!-- Saved worksheets for this period -->
    <div v-if="worksheets.length > 0" class="card mb-3">
      <div class="card-header"><h6 class="mb-0">Saved Worksheets</h6></div>
      <div class="card-body p-0">
        <table class="table table-sm mb-0">
          <thead class="table-light">
            <tr>
              <th>Type</th><th>Account</th><th class="text-end">GL Balance</th><th class="text-end">Subledger</th>
              <th class="text-end">Variance</th><th>State</th><th>Signed Off</th><th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ws in worksheets" :key="ws.worksheetId">
              <td><span class="badge text-bg-light">{{ ws.type }}</span></td>
              <td>{{ ws.accountNumber }} <small class="text-muted">{{ ws.accountDescription }}</small></td>
              <td class="text-end">{{ money(ws.glBalance) }}</td>
              <td class="text-end">{{ money(ws.subledgerBalance) }}</td>
              <td class="text-end" :class="Math.abs(ws.variance) < 0.01 ? 'text-success' : 'text-warning'">{{ money(ws.variance) }}</td>
              <td><span class="badge" :class="ws.state === 'Reconciled' ? 'text-bg-success' : 'text-bg-warning'">{{ ws.state }}</span></td>
              <td><small v-if="ws.signedOffBy" class="text-muted">{{ ws.signedOffBy }} {{ formatDate(ws.signedOffAt) }}</small></td>
              <td class="text-end">
                <button v-if="ws.state !== 'Reconciled' && isCloseManagement"
                        class="btn btn-success btn-xs" :disabled="loading" @click="handleSignoff(ws.worksheetId)">
                  <i class="ri-check-line"></i> Sign Off
                </button>
                <button v-if="ws.state !== 'Reconciled'"
                        class="btn btn-outline-secondary btn-xs ms-1" :disabled="loading"
                        @click="refreshWorksheet(ws)">
                  <i class="ri-refresh-line"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const period = ref(null)
const bankRec = ref(null)
const arTieOut = ref(null)
const apTieOut = ref(null)
const worksheets = ref([])
const loading = ref(false)
const tab = ref('bank')
const banner = ref({ message: '', title: '', cssClass: 'alert-info' })

// Period picker — defaults to current period on mount, user can change
const currentYear = new Date().getFullYear()
const selectedFy = ref(currentYear)
const selectedPeriod = ref(1)
const fyOptions = ref(Array.from({ length: 10 }, (_, i) => currentYear - 5 + i))

const periodRange = computed(() => {
  // Jul-Jun calendar: period P of FY Y starts at month (7 + P - 1) mod 12
  const fy = selectedFy.value
  const p = selectedPeriod.value
  const startMonth = ((6 + p - 1) % 12) + 1
  const startYear = p <= 6 ? fy : fy + 1
  const start = new Date(startYear, startMonth - 1, 1)
  const end = new Date(startYear, startMonth, 0) // last day of month
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
})

// Role detection (same pattern as CloseDashboard)
function decodeUserRoles() {
  try {
    const token = localStorage.getItem('token')
    if (!token) return new Set()
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    const roleClaimKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    const raw = payload[roleClaimKey] ?? payload.role ?? []
    return new Set((Array.isArray(raw) ? raw : [raw]).map(r => String(r).toUpperCase()))
  } catch (e) { return new Set() }
}
const userRoles = ref(decodeUserRoles())
const hasRole = (r) => userRoles.value.has(r.toUpperCase())
const isCloseManagement = computed(() => hasRole('Admin') || hasRole('CFO'))

function money(n) {
  if (n == null) return '-'
  return Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
function formatDate(v) { return v ? new Date(v).toLocaleString() : '' }
function formatPeriodRange(p) {
  if (!p) return ''
  return `${new Date(p.startDate).toLocaleDateString()} - ${new Date(p.endDate).toLocaleDateString()}`
}
function setBanner(type, title, message) {
  const cssMap = { success: 'alert-success', error: 'alert-danger', warning: 'alert-warning', info: 'alert-info' }
  banner.value = { message, title, cssClass: cssMap[type] || 'alert-info' }
}

async function loadAll() {
  loading.value = true
  banner.value.message = ''
  try {
    // On first load, seed the picker from the current fiscal period
    if (!period.value) {
      const pResp = await api.get('fiscal-period/current')
      period.value = pResp.data
      selectedFy.value = period.value.fiscalYear
      selectedPeriod.value = period.value.period
    }

    const fy = selectedFy.value
    const pd = selectedPeriod.value

    const [tieOuts, bankRecResp, wsResp] = await Promise.all([
      api.get(`reconciliation/tie-outs?fy=${fy}&period=${pd}`),
      api.get(`reconciliation/bank-rec?fy=${fy}&period=${pd}`),
      api.get(`reconciliation/worksheets?fy=${fy}&period=${pd}`)
    ])

    const tos = tieOuts.data || []
    arTieOut.value = tos.find(t => t.type === 'AR') || null
    apTieOut.value = tos.find(t => t.type === 'AP') || null
    bankRec.value = bankRecResp.data || null
    worksheets.value = wsResp.data || []
  } catch (e) {
    setBanner('error', 'Load failed', e?.response?.data?.message || e?.message || 'Unknown error')
  } finally {
    loading.value = false
  }
}

async function createWorksheet(type, accountNumber) {
  loading.value = true
  try {
    await api.post('reconciliation/worksheets', {
      fiscalYear: selectedFy.value,
      period: selectedPeriod.value,
      type,
      accountNumber
    })
    setBanner('success', 'Saved', `${type} worksheet created/refreshed.`)
    await loadAll()
  } catch (e) {
    setBanner('error', 'Save failed', e?.response?.data?.message || e?.message)
  } finally {
    loading.value = false
  }
}

async function refreshWorksheet(ws) {
  await createWorksheet(ws.type, ws.accountNumber)
}

async function handleSignoff(worksheetId) {
  loading.value = true
  try {
    await api.post(`reconciliation/worksheets/${worksheetId}/signoff`, {})
    setBanner('success', 'Signed off', 'Worksheet reconciled.')
    await loadAll()
  } catch (e) {
    setBanner('error', 'Signoff failed', e?.response?.data?.message || e?.message)
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
.fs-14 { font-size: 0.875rem; }
.btn-xs { padding: 0.15rem 0.5rem; font-size: 0.75rem; }
</style>
