<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Bank Feed</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item">Banking</li>
            <li class="breadcrumb-item active">Bank Feed</li>
          </ol>
        </div>
        <div class="d-flex gap-2">
          <router-link to="/accounting/bank-feed/rules" class="btn btn-outline-secondary btn-sm">
            <i class="ri-settings-3-line me-1"></i>Rules
          </router-link>
          <button class="btn btn-primary btn-sm" @click="showImportModal = true" :disabled="importing">
            <i class="ri-download-line me-1"></i>Import
          </button>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row" v-if="summary">
      <div class="col-md-2">
        <div class="card border-info">
          <div class="card-body text-center py-2">
            <div class="fs-5 fw-bold text-info">{{ summary.newCount }}</div>
            <div class="text-muted small">New</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card">
          <div class="card-body text-center py-2">
            <div class="fs-5 fw-bold">{{ formatCurrency(summary.newTotal) }}</div>
            <div class="text-muted small">New Amount</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card border-warning">
          <div class="card-body text-center py-2">
            <div class="fs-5 fw-bold text-warning">{{ summary.categorizedCount }}</div>
            <div class="text-muted small">Categorized</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card border-success">
          <div class="card-body text-center py-2">
            <div class="fs-5 fw-bold text-success">{{ summary.postedCount }}</div>
            <div class="text-muted small">Posted</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card">
          <div class="card-body text-center py-2">
            <div class="fs-5 fw-bold text-muted">{{ summary.ignoredCount }}</div>
            <div class="text-muted small">Ignored</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card">
          <div class="card-body text-center py-2">
            <div class="fs-5 fw-bold">{{ summary.ruleCount }}</div>
            <div class="text-muted small">Active Rules</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters & Actions -->
    <div class="card mb-3">
      <div class="card-body py-2">
        <div class="d-flex align-items-center justify-content-between">
          <div class="d-flex gap-2 align-items-center">
            <select class="form-select form-select-sm" v-model="statusFilter" @change="load" style="width: 160px;">
              <option value="">All Status</option>
              <option value="New">New</option>
              <option value="Categorized">Categorized</option>
              <option value="Posted">Posted</option>
              <option value="Ignored">Ignored</option>
            </select>
            <span class="text-muted small" v-if="selectedIds.length">{{ selectedIds.length }} selected</span>
          </div>
          <div class="d-flex gap-2" v-if="selectedIds.length">
            <button class="btn btn-outline-primary btn-sm" @click="showCategorizeModal = true"
                    v-if="canCategorize">
              <i class="ri-price-tag-3-line me-1"></i>Categorize
            </button>
            <button class="btn btn-success btn-sm" @click="postSelected"
                    v-if="canPost" :disabled="posting">
              <i class="ri-send-plane-line me-1"></i>Post to GL
            </button>
            <button class="btn btn-outline-secondary btn-sm" @click="ignoreSelected"
                    v-if="canIgnore">
              <i class="ri-eye-off-line me-1"></i>Ignore
            </button>
            <button class="btn btn-outline-warning btn-sm" @click="uncategorizeSelected"
                    v-if="canUncategorize">
              <i class="ri-arrow-go-back-line me-1"></i>Reset
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Transactions Table -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading" class="text-center my-4">
          <div class="spinner-border text-primary" role="status"></div>
        </div>
        <div v-else-if="!transactions.length" class="text-center my-4">
          <p class="text-muted">No transactions found</p>
          <button class="btn btn-primary btn-sm" @click="showImportModal = true">Import from KeyBank</button>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-sm table-hover align-middle">
            <thead>
              <tr>
                <th style="width: 30px;">
                  <input type="checkbox" class="form-check-input" @change="toggleAll" :checked="allSelected" />
                </th>
                <th style="width: 90px;">Date</th>
                <th style="width: 50px;">Type</th>
                <th style="width: 100px; text-align: right;">Amount</th>
                <th>Description</th>
                <th style="width: 150px;">GL Account</th>
                <th style="width: 130px;">Vendor</th>
                <th style="width: 90px;">Status</th>
                <th style="width: 100px;">Match</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="txn in transactions" :key="txn.keyBankTransactionId"
                  :class="{ 'table-active': selectedIds.includes(txn.keyBankTransactionId) }">
                <td>
                  <input type="checkbox" class="form-check-input"
                         :checked="selectedIds.includes(txn.keyBankTransactionId)"
                         @change="toggleSelect(txn.keyBankTransactionId)" />
                </td>
                <td class="small">{{ formatDate(txn.transactionEffectiveDate) }}</td>
                <td>
                  <span :class="txn.creditOrDebitCode === 'D' ? 'badge bg-danger-subtle text-danger' : 'badge bg-success-subtle text-success'">
                    {{ txn.creditOrDebitCode === 'D' ? 'DR' : 'CR' }}
                  </span>
                </td>
                <td class="text-end fw-semibold" :class="txn.creditOrDebitCode === 'D' ? 'text-danger' : 'text-success'">
                  {{ txn.creditOrDebitCode === 'D' ? '-' : '' }}{{ formatCurrency(txn.transactionAmount) }}
                </td>
                <td class="small">{{ txn.transactionDescription }}</td>
                <td class="small">
                  <span v-if="txn.glAccountNumber" class="text-primary">
                    {{ txn.glAccountNumber }} <span class="text-muted">{{ txn.glAccountDescription }}</span>
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td class="small">{{ txn.vendorName || '-' }}</td>
                <td>
                  <span :class="statusBadgeClass(txn.feedStatus)">{{ txn.feedStatus }}</span>
                </td>
                <td class="small">
                  <span v-if="txn.matchConfidence" :class="confidenceBadge(txn.matchConfidence)">
                    {{ txn.matchConfidence }}
                  </span>
                  <span v-if="txn.postedBatchNumber" class="text-muted ms-1">B#{{ txn.postedBatchNumber }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <div class="modal fade" :class="{ show: showImportModal }" :style="showImportModal ? 'display: block;' : ''"
         tabindex="-1" @click.self="showImportModal = false">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Import Bank Transactions</h5>
            <button type="button" class="btn-close" @click="showImportModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">From Date</label>
              <input type="date" class="form-control" v-model="importForm.fromDate" />
            </div>
            <div class="mb-3">
              <label class="form-label">To Date</label>
              <input type="date" class="form-control" v-model="importForm.toDate" />
            </div>
            <p class="text-muted small">Leave blank to import yesterday's transactions.</p>
            <div v-if="importResult" class="alert" :class="importResult.newTransactions > 0 ? 'alert-success' : 'alert-info'">
              {{ importResult.message }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" @click="showImportModal = false">Close</button>
            <button class="btn btn-primary btn-sm" @click="doImport" :disabled="importing">
              <span v-if="importing" class="spinner-border spinner-border-sm me-1"></span>
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showImportModal" class="modal-backdrop fade show"></div>

    <!-- Categorize Modal -->
    <div class="modal fade" :class="{ show: showCategorizeModal }" :style="showCategorizeModal ? 'display: block;' : ''"
         tabindex="-1" @click.self="showCategorizeModal = false">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Categorize {{ selectedIds.length }} Transaction(s)</h5>
            <button type="button" class="btn-close" @click="showCategorizeModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">GL Account</label>
              <select class="form-select" v-model="catForm.glAccountNumber">
                <option value="">Select account...</option>
                <option v-for="a in accounts" :key="a.accountNumber" :value="a.accountNumber">
                  {{ a.accountNumber }} - {{ a.description }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Vendor (optional)</label>
              <select class="form-select" v-model="catForm.vendorId">
                <option :value="null">None</option>
                <option v-for="v in vendors" :key="v.vendorId" :value="v.vendorId">
                  {{ v.name }}
                </option>
              </select>
            </div>
            <hr />
            <div class="form-check mb-2">
              <input class="form-check-input" type="checkbox" v-model="catForm.createRule" id="createRuleCheck" />
              <label class="form-check-label" for="createRuleCheck">Create rule for future auto-categorization</label>
            </div>
            <div v-if="catForm.createRule">
              <div class="mb-2">
                <label class="form-label small">Rule Name</label>
                <input class="form-control form-control-sm" v-model="catForm.ruleName" />
              </div>
              <div class="mb-2">
                <label class="form-label small">Pattern (match description contains)</label>
                <input class="form-control form-control-sm" v-model="catForm.rulePattern"
                       :placeholder="suggestedPattern" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" @click="showCategorizeModal = false">Cancel</button>
            <button class="btn btn-primary btn-sm" @click="doCategorize"
                    :disabled="!catForm.glAccountNumber">
              Categorize
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showCategorizeModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'

const transactions = ref([])
const summary = ref(null)
const accounts = ref([])
const vendors = ref([])
const loading = ref(false)
const importing = ref(false)
const posting = ref(false)
const statusFilter = ref('New')
const selectedIds = ref([])

// Modals
const showImportModal = ref(false)
const showCategorizeModal = ref(false)

const importForm = ref({ fromDate: '', toDate: '' })
const importResult = ref(null)

const catForm = ref({
  glAccountNumber: '',
  vendorId: null,
  createRule: false,
  ruleName: '',
  rulePattern: ''
})

const allSelected = computed(() =>
  transactions.value.length > 0 && selectedIds.value.length === transactions.value.length
)

const selectedTransactions = computed(() =>
  transactions.value.filter(t => selectedIds.value.includes(t.keyBankTransactionId))
)

const canCategorize = computed(() =>
  selectedTransactions.value.some(t => t.feedStatus === 'New' || t.feedStatus === 'Categorized')
)

const canPost = computed(() =>
  selectedTransactions.value.every(t => t.feedStatus === 'Categorized' && t.glAccountNumber)
)

const canIgnore = computed(() =>
  selectedTransactions.value.some(t => t.feedStatus === 'New' || t.feedStatus === 'Categorized')
)

const canUncategorize = computed(() =>
  selectedTransactions.value.some(t => t.feedStatus === 'Categorized' || t.feedStatus === 'Ignored')
)

const suggestedPattern = computed(() => {
  if (!selectedTransactions.value.length) return ''
  const desc = selectedTransactions.value[0].transactionDescription || ''
  // Take first few meaningful words as suggestion
  return desc.split(/\s+/).slice(0, 3).join(' ')
})

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)
}

function formatDate(val) {
  if (!val) return '-'
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusBadgeClass(status) {
  const map = {
    'New': 'badge bg-info-subtle text-info',
    'Categorized': 'badge bg-warning-subtle text-warning',
    'Posted': 'badge bg-success-subtle text-success',
    'Ignored': 'badge bg-secondary-subtle text-secondary'
  }
  return map[status] || 'badge bg-secondary'
}

function confidenceBadge(conf) {
  const map = {
    'High': 'badge bg-success-subtle text-success',
    'Manual': 'badge bg-primary-subtle text-primary',
    'Medium': 'badge bg-warning-subtle text-warning',
    'Low': 'badge bg-danger-subtle text-danger'
  }
  return map[conf] || 'badge bg-secondary'
}

function toggleAll(e) {
  if (e.target.checked) {
    selectedIds.value = transactions.value.map(t => t.keyBankTransactionId)
  } else {
    selectedIds.value = []
  }
}

function toggleSelect(id) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

async function load() {
  loading.value = true
  selectedIds.value = []
  try {
    const [txnResp, sumResp] = await Promise.all([
      api.get('bank-feed/transactions', { params: { status: statusFilter.value || undefined } }),
      api.get('bank-feed/summary')
    ])
    transactions.value = txnResp.data
    summary.value = sumResp.data
  } catch (err) {
    console.error('Load error:', err)
  } finally {
    loading.value = false
  }
}

async function loadLookups() {
  try {
    const [acctResp, vendorResp] = await Promise.all([
      api.get('accounts').catch(() => ({ data: [] })),
      api.get('vendors', { params: { pageSize: 500 } }).catch(() => ({ data: [] }))
    ])
    accounts.value = Array.isArray(acctResp.data) ? acctResp.data : acctResp.data?.items || []
    vendors.value = Array.isArray(vendorResp.data) ? vendorResp.data : vendorResp.data?.items || []
  } catch (err) {
    console.error('Lookup error:', err)
  }
}

async function doImport() {
  importing.value = true
  importResult.value = null
  try {
    const resp = await api.post('bank-feed/import', {
      fromDate: importForm.value.fromDate || null,
      toDate: importForm.value.toDate || null
    })
    importResult.value = resp.data
    await load()
  } catch (err) {
    importResult.value = { message: err.response?.data?.message || 'Import failed' }
  } finally {
    importing.value = false
  }
}

async function doCategorize() {
  try {
    await api.post('bank-feed/categorize', {
      transactionIds: selectedIds.value,
      glAccountNumber: catForm.value.glAccountNumber,
      vendorId: catForm.value.vendorId,
      createRule: catForm.value.createRule,
      ruleName: catForm.value.ruleName,
      rulePattern: catForm.value.rulePattern || suggestedPattern.value
    })
    showCategorizeModal.value = false
    catForm.value = { glAccountNumber: '', vendorId: null, createRule: false, ruleName: '', rulePattern: '' }
    await load()
  } catch (err) {
    alert(err.response?.data?.message || 'Categorize failed')
  }
}

async function postSelected() {
  if (!confirm(`Post ${selectedIds.value.length} transaction(s) to the GL?`)) return
  posting.value = true
  try {
    const resp = await api.post('bank-feed/post', { transactionIds: selectedIds.value })
    alert(resp.data.message)
    await load()
  } catch (err) {
    alert(err.response?.data?.message || 'Post failed')
  } finally {
    posting.value = false
  }
}

async function ignoreSelected() {
  try {
    await api.post('bank-feed/ignore', { transactionIds: selectedIds.value })
    await load()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed')
  }
}

async function uncategorizeSelected() {
  try {
    await api.post('bank-feed/uncategorize', { transactionIds: selectedIds.value })
    await load()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed')
  }
}

onMounted(() => {
  load()
  loadLookups()
})
</script>
