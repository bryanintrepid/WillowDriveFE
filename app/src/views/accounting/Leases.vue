<template>
  <div>
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Leases (ASC 842)</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item active">Leases</li>
          </ol>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-success btn-sm" @click="openPostModal">
            <i class="ri-play-line me-1"></i>Post Period
          </button>
          <button class="btn btn-primary btn-sm" @click="editLease(null)">
            <i class="ri-add-line me-1"></i>New Lease
          </button>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row g-3 mb-3 px-3">
      <div class="col-md-3">
        <div class="card text-center"><div class="card-body py-2">
          <div class="text-muted small">Active</div>
          <div class="fs-4 fw-bold">{{ summary.activeCount }}</div>
          <div class="small text-muted">{{ summary.operatingCount }} op / {{ summary.financeCount }} fin</div>
        </div></div>
      </div>
      <div class="col-md-3">
        <div class="card text-center"><div class="card-body py-2">
          <div class="text-muted small">ROU Asset Balance</div>
          <div class="fs-4 fw-bold text-primary">{{ formatCurrency(summary.totalRouAssetBalance) }}</div>
        </div></div>
      </div>
      <div class="col-md-3">
        <div class="card text-center"><div class="card-body py-2">
          <div class="text-muted small">Lease Liability Balance</div>
          <div class="fs-4 fw-bold text-danger">{{ formatCurrency(summary.totalLeaseLiabilityBalance) }}</div>
        </div></div>
      </div>
      <div class="col-md-3">
        <div class="card text-center"><div class="card-body py-2">
          <div class="text-muted small">Monthly Obligation</div>
          <div class="fs-4 fw-bold">{{ formatCurrency(summary.totalMonthlyObligation) }}</div>
        </div></div>
      </div>
    </div>

    <!-- Filter -->
    <div class="px-3 mb-2">
      <select class="form-select form-select-sm" style="width: 160px;" v-model="statusFilter" @change="load">
        <option :value="null">All Statuses</option>
        <option value="Active">Active</option>
        <option value="Completed">Completed</option>
        <option value="Terminated">Terminated</option>
      </select>
    </div>

    <!-- Table -->
    <div class="card mx-3">
      <div class="card-body">
        <div v-if="!leases.length" class="text-center my-4">
          <p class="text-muted">No leases found.</p>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-sm table-hover align-middle">
            <thead>
              <tr>
                <th>Lease #</th>
                <th>Description</th>
                <th>Type</th>
                <th>Asset</th>
                <th>Dates</th>
                <th>Monthly</th>
                <th>PV</th>
                <th>Liability</th>
                <th>Progress</th>
                <th>Status</th>
                <th style="width:100px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="l in leases" :key="l.leaseId"
                  :class="{ 'text-muted': l.status === 'Terminated' }">
                <td>
                  <router-link :to="`/accounting/leases/${l.leaseId}`" class="fw-semibold text-decoration-none">
                    {{ l.leaseNumber }}
                  </router-link>
                </td>
                <td class="small">{{ l.description }}</td>
                <td>
                  <span :class="l.leaseType === 'Finance' ? 'badge bg-info text-dark' : 'badge bg-secondary'">
                    {{ l.leaseType }}
                  </span>
                </td>
                <td class="small">{{ l.assetType }}</td>
                <td class="small">
                  {{ formatDate(l.commencementDate) }}<br>
                  <span class="text-muted">→ {{ formatDate(l.expirationDate) }}</span>
                </td>
                <td>{{ formatCurrency(l.monthlyPayment) }}</td>
                <td>{{ formatCurrency(l.presentValuePayments) }}</td>
                <td>{{ formatCurrency(l.leaseLiabilityBalance) }}</td>
                <td>
                  <div class="progress" style="height: 18px; min-width: 80px;">
                    <div class="progress-bar" :style="{ width: progressPct(l) + '%' }">
                      {{ l.postedPayments }}/{{ l.totalPayments }}
                    </div>
                  </div>
                </td>
                <td><span :class="statusBadge(l.status)">{{ l.status }}</span></td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1" @click="editLease(l)"
                          :disabled="l.status === 'Terminated'" title="Edit metadata">
                    <i class="ri-pencil-line"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteLease(l)"
                          :disabled="l.status === 'Completed'" title="Delete / terminate">
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Lease Edit Modal -->
    <div class="modal fade" :class="{ show: showEditModal }" :style="showEditModal ? 'display:block' : ''"
         tabindex="-1" @click.self="showEditModal = false">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ form.leaseId ? 'Edit' : 'New' }} Lease</h5>
            <button type="button" class="btn-close" @click="showEditModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <div class="col-4">
                <label class="form-label">Lease Number</label>
                <input class="form-control" v-model="form.leaseNumber" :disabled="form.leaseId" />
              </div>
              <div class="col-4">
                <label class="form-label">Type</label>
                <select class="form-select" v-model="form.leaseType" :disabled="form.leaseId">
                  <option value="Operating">Operating</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>
              <div class="col-4">
                <label class="form-label">Asset Type</label>
                <select class="form-select" v-model="form.assetType">
                  <option value="RealEstate">Real Estate</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Description</label>
              <input class="form-control" v-model="form.description" />
            </div>
            <div class="row mb-3">
              <div class="col-3">
                <label class="form-label">Commencement</label>
                <input type="date" class="form-control" v-model="form.commencementDate" :disabled="form.leaseId" />
              </div>
              <div class="col-3">
                <label class="form-label">Expiration</label>
                <input type="date" class="form-control" v-model="form.expirationDate" :disabled="form.leaseId" />
              </div>
              <div class="col-3">
                <label class="form-label">Monthly Payment</label>
                <input type="number" class="form-control" v-model.number="form.monthlyPayment" step="0.01"
                       :disabled="form.leaseId" />
              </div>
              <div class="col-3">
                <label class="form-label">Discount Rate (IBR)</label>
                <input type="number" class="form-control" v-model.number="form.discountRate" step="0.0001"
                       placeholder="0.055 for 5.5%" :disabled="form.leaseId" />
                <div v-if="pvPreview && !form.leaseId" class="small text-muted mt-1">
                  PV ≈ {{ formatCurrency(pvPreview) }}
                </div>
              </div>
            </div>
            <hr />
            <h6>GL Accounts</h6>
            <div class="row mb-3">
              <div class="col-6">
                <label class="form-label">ROU Asset Account (Type 0)</label>
                <select class="form-select" v-model="form.rouAssetAccount" :disabled="form.leaseId">
                  <option value="">Select...</option>
                  <option v-for="a in assetAccounts" :key="a.accountNumber" :value="a.accountNumber">
                    {{ a.accountNumber }} - {{ a.description }}
                  </option>
                </select>
              </div>
              <div class="col-6">
                <label class="form-label">Lease Liability Account (Type 1)</label>
                <select class="form-select" v-model="form.leaseLiabilityAccount" :disabled="form.leaseId">
                  <option value="">Select...</option>
                  <option v-for="a in liabilityAccounts" :key="a.accountNumber" :value="a.accountNumber">
                    {{ a.accountNumber }} - {{ a.description }}
                  </option>
                </select>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-6">
                <label class="form-label">Cash / Payables Account (Type 0)</label>
                <select class="form-select" v-model="form.cashAccount">
                  <option value="">Select...</option>
                  <option v-for="a in assetAccounts" :key="a.accountNumber" :value="a.accountNumber">
                    {{ a.accountNumber }} - {{ a.description }}
                  </option>
                </select>
                <div class="form-text small">Credited on each payment. Defaults to 11100 Cash.</div>
              </div>
              <div class="col-6" v-if="form.leaseType === 'Operating'">
                <label class="form-label">Lease Expense Account (Type 4)</label>
                <select class="form-select" v-model="form.leaseExpenseAccount">
                  <option value="">Select...</option>
                  <option v-for="a in expenseAccounts" :key="a.accountNumber" :value="a.accountNumber">
                    {{ a.accountNumber }} - {{ a.description }}
                  </option>
                </select>
              </div>
              <div class="col-6" v-else>
                <label class="form-label">Interest Expense Account (Type 4)</label>
                <select class="form-select" v-model="form.interestExpenseAccount">
                  <option value="">Select...</option>
                  <option v-for="a in expenseAccounts" :key="a.accountNumber" :value="a.accountNumber">
                    {{ a.accountNumber }} - {{ a.description }}
                  </option>
                </select>
              </div>
            </div>
            <div class="row mb-3" v-if="form.leaseType === 'Finance'">
              <div class="col-6">
                <label class="form-label">Amortization Expense Account (Type 4)</label>
                <select class="form-select" v-model="form.amortizationExpenseAccount">
                  <option value="">Optional - none posts no amortization</option>
                  <option v-for="a in expenseAccounts" :key="a.accountNumber" :value="a.accountNumber">
                    {{ a.accountNumber }} - {{ a.description }}
                  </option>
                </select>
              </div>
              <div class="col-6">
                <label class="form-label">Accumulated Amortization Account</label>
                <select class="form-select" v-model="form.accumAmortizationAccount">
                  <option value="">Optional</option>
                  <option v-for="a in assetAccounts" :key="a.accountNumber" :value="a.accountNumber">
                    {{ a.accountNumber }} - {{ a.description }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" @click="showEditModal = false">Cancel</button>
            <button class="btn btn-primary btn-sm" @click="saveLease"
                    :disabled="!canSave">Save</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showEditModal" class="modal-backdrop fade show"></div>

    <!-- Post Period Modal -->
    <div class="modal fade" :class="{ show: showPostModal }" :style="showPostModal ? 'display:block' : ''"
         tabindex="-1" @click.self="showPostModal = false">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Post Lease Period</h5>
            <button type="button" class="btn-close" @click="showPostModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <div class="col-6">
                <label class="form-label">Fiscal Year</label>
                <input type="number" class="form-control" v-model.number="postForm.fiscalYear" />
              </div>
              <div class="col-6">
                <label class="form-label">Period</label>
                <input type="number" class="form-control" v-model.number="postForm.period" min="1" max="13" />
              </div>
            </div>
            <p class="text-muted small">
              For each active lease: posts the scheduled payment
              (and ROU amortization for finance leases) for the selected period.
            </p>
            <div v-if="postResults.length" class="mt-3">
              <strong>Results:</strong>
              <ul class="mb-0 small">
                <li v-for="(r, i) in postResults" :key="i">{{ r }}</li>
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" @click="showPostModal = false">Close</button>
            <button class="btn btn-success btn-sm" @click="postPeriod"
                    :disabled="!postForm.fiscalYear || !postForm.period">Post</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showPostModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'

const leases = ref([])
const summary = ref({ activeCount: 0, operatingCount: 0, financeCount: 0, completedCount: 0,
                     totalRouAssetBalance: 0, totalLeaseLiabilityBalance: 0, totalMonthlyObligation: 0 })
const accounts = ref([])
const statusFilter = ref(null)
const showEditModal = ref(false)
const showPostModal = ref(false)
const postResults = ref([])

const emptyForm = () => ({
  leaseId: null, leaseNumber: '', description: '',
  leaseType: 'Operating', assetType: 'RealEstate',
  commencementDate: new Date().toISOString().slice(0, 10),
  expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().slice(0, 10),
  monthlyPayment: 0, discountRate: 0.055,
  rouAssetAccount: '', leaseLiabilityAccount: '', cashAccount: '11100',
  leaseExpenseAccount: '', interestExpenseAccount: '',
  amortizationExpenseAccount: '', accumAmortizationAccount: ''
})
const form = ref(emptyForm())

const today = new Date()
const currentFy = today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1
const currentPeriod = today.getMonth() >= 6 ? today.getMonth() - 5 : today.getMonth() + 7
const postForm = ref({ fiscalYear: currentFy, period: currentPeriod })

const assetAccounts    = computed(() => accounts.value.filter(a => a.type === 0))
const liabilityAccounts = computed(() => accounts.value.filter(a => a.type === 1))
const expenseAccounts  = computed(() => accounts.value.filter(a => a.type === 4))

const pvPreview = computed(() => {
  const f = form.value
  if (!f.monthlyPayment || !f.commencementDate || !f.expirationDate) return 0
  const start = new Date(f.commencementDate)
  const end = new Date(f.expirationDate)
  const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()))
  const r = (f.discountRate || 0) / 12
  if (r === 0) return f.monthlyPayment * months
  const factor = (1 - Math.pow(1 + r, -months)) / r
  return Math.round(f.monthlyPayment * factor * 100) / 100
})

const canSave = computed(() => {
  const f = form.value
  if (!f.leaseNumber || !f.description || !f.monthlyPayment) return false
  if (!f.rouAssetAccount || !f.leaseLiabilityAccount || !f.cashAccount) return false
  if (f.leaseType === 'Operating' && !f.leaseExpenseAccount) return false
  if (f.leaseType === 'Finance' && !f.interestExpenseAccount) return false
  return true
})

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString()
}

function progressPct(l) {
  return l.totalPayments > 0 ? Math.round((l.postedPayments / l.totalPayments) * 100) : 0
}

function statusBadge(s) {
  if (s === 'Active') return 'badge bg-success'
  if (s === 'Completed') return 'badge bg-primary'
  return 'badge bg-secondary'
}

function editLease(l) {
  if (l) {
    // Fetch full DTO for edit (list items only have a subset).
    api.get(`leases/${l.leaseId}`).then(resp => {
      const d = resp.data
      form.value = {
        leaseId: d.leaseId, leaseNumber: d.leaseNumber, description: d.description,
        leaseType: d.leaseType, assetType: d.assetType,
        commencementDate: d.commencementDate?.slice(0, 10),
        expirationDate: d.expirationDate?.slice(0, 10),
        monthlyPayment: d.monthlyPayment, discountRate: d.discountRate,
        rouAssetAccount: d.rouAssetAccount, leaseLiabilityAccount: d.leaseLiabilityAccount,
        cashAccount: d.cashAccount || '11100',
        leaseExpenseAccount: d.leaseExpenseAccount || '',
        interestExpenseAccount: d.interestExpenseAccount || '',
        amortizationExpenseAccount: d.amortizationExpenseAccount || '',
        accumAmortizationAccount: d.accumAmortizationAccount || ''
      }
      showEditModal.value = true
    })
  } else {
    form.value = emptyForm()
    showEditModal.value = true
  }
}

function openPostModal() {
  postResults.value = []
  showPostModal.value = true
}

async function load() {
  try {
    const params = statusFilter.value ? { status: statusFilter.value } : {}
    const [leaseResp, summResp] = await Promise.all([
      api.get('leases', { params }),
      api.get('leases/summary')
    ])
    leases.value = leaseResp.data
    summary.value = summResp.data
  } catch (err) {
    console.error('Load error:', err)
  }
}

async function loadLookups() {
  try {
    const acctResp = await api.get('accounts').catch(() => ({ data: [] }))
    accounts.value = Array.isArray(acctResp.data) ? acctResp.data : acctResp.data?.items || []
  } catch (err) {
    console.error('Lookup error:', err)
  }
}

async function saveLease() {
  try {
    await api.post('leases', form.value)
    showEditModal.value = false
    await load()
  } catch (err) {
    alert(err.response?.data?.message || 'Save failed')
  }
}

async function deleteLease(l) {
  if (!confirm(`Delete / terminate lease "${l.leaseNumber}"?`)) return
  try {
    await api.delete(`leases/${l.leaseId}`)
    await load()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}

async function postPeriod() {
  try {
    const resp = await api.post('leases/post-period', postForm.value)
    postResults.value = resp.data.results || []
    await load()
  } catch (err) {
    alert(err.response?.data?.message || 'Post failed')
  }
}

onMounted(() => {
  load()
  loadLookups()
})
</script>
