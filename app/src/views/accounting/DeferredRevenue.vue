<template>
  <div>
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Deferred Revenue</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item active">Deferred Revenue</li>
          </ol>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-success btn-sm" @click="openRecognizeModal">
            <i class="ri-play-line me-1"></i>Recognize Period
          </button>
          <button class="btn btn-primary btn-sm" @click="editSchedule(null)">
            <i class="ri-add-line me-1"></i>New Schedule
          </button>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row g-3 mb-3 px-3">
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body py-2">
            <div class="text-muted small">Active</div>
            <div class="fs-4 fw-bold">{{ summary.activeCount }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body py-2">
            <div class="text-muted small">Completed</div>
            <div class="fs-4 fw-bold text-success">{{ summary.completedCount }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body py-2">
            <div class="text-muted small">Total Deferred</div>
            <div class="fs-4 fw-bold">{{ formatCurrency(summary.totalDeferredAmount) }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body py-2">
            <div class="text-muted small">Recognized</div>
            <div class="fs-4 fw-bold text-primary">{{ formatCurrency(summary.totalRecognizedAmount) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter -->
    <div class="px-3 mb-2">
      <select class="form-select form-select-sm" style="width: 160px;" v-model="statusFilter" @change="load">
        <option :value="null">All Statuses</option>
        <option value="Active">Active</option>
        <option value="Completed">Completed</option>
        <option value="Cancelled">Cancelled</option>
      </select>
    </div>

    <!-- Table -->
    <div class="card mx-3">
      <div class="card-body">
        <div v-if="!schedules.length" class="text-center my-4">
          <p class="text-muted">No deferred revenue schedules found.</p>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-sm table-hover align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Period Range</th>
                <th>Dr (Liability)</th>
                <th>Cr (Revenue)</th>
                <th>Progress</th>
                <th>Customer</th>
                <th>Status</th>
                <th style="width:100px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in schedules" :key="s.scheduleId"
                  :class="{ 'text-muted': s.status === 'Cancelled' }">
                <td>
                  <router-link :to="`/accounting/deferred-revenue/${s.scheduleId}`" class="fw-semibold text-decoration-none">
                    {{ s.name }}
                  </router-link>
                  <div v-if="s.description" class="small text-muted">{{ s.description }}</div>
                </td>
                <td>{{ formatCurrency(s.totalAmount) }}</td>
                <td class="small">
                  FY{{ s.startFiscalYear }} P{{ s.startPeriod }}
                  – FY{{ s.endFiscalYear }} P{{ s.endPeriod }}
                </td>
                <td class="small">{{ s.deferredRevenueAccount }}</td>
                <td class="small">{{ s.revenueAccount }}</td>
                <td>
                  <div class="progress" style="height: 18px; min-width: 80px;">
                    <div class="progress-bar" :style="{ width: progressPct(s) + '%' }">
                      {{ s.postedPeriods }}/{{ s.totalPeriods }}
                    </div>
                  </div>
                </td>
                <td class="small">{{ s.customerName || s.invoiceReference || '-' }}</td>
                <td>
                  <span :class="statusBadge(s.status)">{{ s.status }}</span>
                </td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1" @click="editSchedule(s)"
                          :disabled="s.status === 'Cancelled'">
                    <i class="ri-pencil-line"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteSchedule(s)"
                          :disabled="s.status === 'Completed'">
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Schedule Edit Modal -->
    <div class="modal fade" :class="{ show: showEditModal }" :style="showEditModal ? 'display:block' : ''"
         tabindex="-1" @click.self="showEditModal = false">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ form.scheduleId ? 'Edit' : 'New' }} Deferred Revenue Schedule</h5>
            <button type="button" class="btn-close" @click="showEditModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <div class="col-8">
                <label class="form-label">Name</label>
                <input class="form-control" v-model="form.name" />
              </div>
              <div class="col-4">
                <label class="form-label">Method</label>
                <select class="form-select" v-model="form.method">
                  <option value="StraightLine">Straight Line</option>
                </select>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Description</label>
              <input class="form-control" v-model="form.description" />
            </div>
            <div class="row mb-3">
              <div class="col-4">
                <label class="form-label">Total Amount</label>
                <input type="number" class="form-control" v-model.number="form.totalAmount" step="0.01" />
                <div v-if="periodAmount" class="small text-muted mt-1">
                  {{ formatCurrency(periodAmount) }} × {{ totalPeriods }} periods
                </div>
              </div>
              <div class="col-4">
                <label class="form-label">Start (FY / Period)</label>
                <div class="d-flex gap-1">
                  <input type="number" class="form-control" v-model.number="form.startFiscalYear" placeholder="FY" />
                  <input type="number" class="form-control" v-model.number="form.startPeriod" placeholder="P" min="1" max="13" />
                </div>
              </div>
              <div class="col-4">
                <label class="form-label">End (FY / Period)</label>
                <div class="d-flex gap-1">
                  <input type="number" class="form-control" v-model.number="form.endFiscalYear" placeholder="FY" />
                  <input type="number" class="form-control" v-model.number="form.endPeriod" placeholder="P" min="1" max="13" />
                </div>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-6">
                <label class="form-label">Deferred Revenue Account (Liability)</label>
                <select class="form-select" v-model="form.deferredRevenueAccount">
                  <option value="">Select...</option>
                  <option v-for="a in liabilityAccounts" :key="a.accountNumber" :value="a.accountNumber">
                    {{ a.accountNumber }} - {{ a.description }}
                  </option>
                </select>
              </div>
              <div class="col-6">
                <label class="form-label">Revenue Account</label>
                <select class="form-select" v-model="form.revenueAccount">
                  <option value="">Select...</option>
                  <option v-for="a in revenueAccounts" :key="a.accountNumber" :value="a.accountNumber">
                    {{ a.accountNumber }} - {{ a.description }}
                  </option>
                </select>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-6">
                <label class="form-label">Customer (optional)</label>
                <select class="form-select" v-model="form.customerId">
                  <option :value="null">None</option>
                  <option v-for="c in customers" :key="c.customerId" :value="c.customerId">{{ c.name }}</option>
                </select>
              </div>
              <div class="col-6">
                <label class="form-label">Invoice Reference (optional)</label>
                <input class="form-control" v-model="form.invoiceReference" placeholder="e.g., INV-12345" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" @click="showEditModal = false">Cancel</button>
            <button class="btn btn-primary btn-sm" @click="saveSchedule"
                    :disabled="!form.name || !form.totalAmount || !form.deferredRevenueAccount || !form.revenueAccount">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showEditModal" class="modal-backdrop fade show"></div>

    <!-- Recognize Modal -->
    <div class="modal fade" :class="{ show: showRecognizeModal }" :style="showRecognizeModal ? 'display:block' : ''"
         tabindex="-1" @click.self="showRecognizeModal = false">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Recognize Deferred Revenue</h5>
            <button type="button" class="btn-close" @click="showRecognizeModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <div class="col-6">
                <label class="form-label">Fiscal Year</label>
                <input type="number" class="form-control" v-model.number="recognizeForm.fiscalYear" />
              </div>
              <div class="col-6">
                <label class="form-label">Period</label>
                <input type="number" class="form-control" v-model.number="recognizeForm.period" min="1" max="13" />
              </div>
            </div>
            <p class="text-muted small">Posts current-period share (Dr liability / Cr revenue) for every active schedule that covers this period.</p>
            <div v-if="recognizeResults.length" class="mt-3">
              <strong>Results:</strong>
              <ul class="mb-0 small">
                <li v-for="(r, i) in recognizeResults" :key="i">{{ r }}</li>
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" @click="showRecognizeModal = false">Close</button>
            <button class="btn btn-success btn-sm" @click="recognize"
                    :disabled="!recognizeForm.fiscalYear || !recognizeForm.period">
              Recognize
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showRecognizeModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'

const schedules = ref([])
const summary = ref({ activeCount: 0, completedCount: 0, totalDeferredAmount: 0, totalRecognizedAmount: 0, totalRemainingAmount: 0 })
const accounts = ref([])
const customers = ref([])
const statusFilter = ref(null)
const showEditModal = ref(false)
const showRecognizeModal = ref(false)
const recognizeResults = ref([])

const emptyForm = {
  scheduleId: null, name: '', description: '', customerId: null, invoiceReference: '',
  totalAmount: 0,
  startFiscalYear: new Date().getFullYear(), startPeriod: 1,
  endFiscalYear: new Date().getFullYear(), endPeriod: 12,
  method: 'StraightLine', deferredRevenueAccount: '21140', revenueAccount: ''
}
const form = ref({ ...emptyForm })

const today = new Date()
const currentFy = today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1
const currentPeriod = today.getMonth() >= 6 ? today.getMonth() - 5 : today.getMonth() + 7
const recognizeForm = ref({ fiscalYear: currentFy, period: currentPeriod })

const liabilityAccounts = computed(() => accounts.value.filter(a => a.type === 1))
const revenueAccounts = computed(() => accounts.value.filter(a => a.type === 3))

const totalPeriods = computed(() => {
  if (!form.value.startFiscalYear || !form.value.endFiscalYear) return 0
  return Math.max(1, (form.value.endFiscalYear - form.value.startFiscalYear) * 12
                     + (form.value.endPeriod - form.value.startPeriod) + 1)
})
const periodAmount = computed(() => {
  if (!form.value.totalAmount || totalPeriods.value <= 0) return 0
  return Math.round((form.value.totalAmount / totalPeriods.value) * 100) / 100
})

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)
}

function progressPct(s) {
  return s.totalPeriods > 0 ? Math.round((s.postedPeriods / s.totalPeriods) * 100) : 0
}

function statusBadge(status) {
  if (status === 'Active') return 'badge bg-success'
  if (status === 'Completed') return 'badge bg-primary'
  return 'badge bg-secondary'
}

function editSchedule(s) {
  if (s) {
    form.value = {
      scheduleId: s.scheduleId, name: s.name, description: s.description,
      customerId: s.customerId, invoiceReference: s.invoiceReference,
      totalAmount: s.totalAmount,
      startFiscalYear: s.startFiscalYear, startPeriod: s.startPeriod,
      endFiscalYear: s.endFiscalYear, endPeriod: s.endPeriod,
      method: s.method,
      deferredRevenueAccount: s.deferredRevenueAccount, revenueAccount: s.revenueAccount
    }
  } else {
    form.value = { ...emptyForm }
  }
  showEditModal.value = true
}

function openRecognizeModal() {
  recognizeResults.value = []
  showRecognizeModal.value = true
}

async function load() {
  try {
    const params = statusFilter.value ? { status: statusFilter.value } : {}
    const [schedResp, summResp] = await Promise.all([
      api.get('deferred-revenue', { params }),
      api.get('deferred-revenue/summary')
    ])
    schedules.value = schedResp.data
    summary.value = summResp.data
  } catch (err) {
    console.error('Load error:', err)
  }
}

async function loadLookups() {
  try {
    const [acctResp, custResp] = await Promise.all([
      api.get('accounts').catch(() => ({ data: [] })),
      api.get('customers', { params: { pageSize: 500 } }).catch(() => ({ data: [] }))
    ])
    accounts.value = Array.isArray(acctResp.data) ? acctResp.data : acctResp.data?.items || []
    customers.value = Array.isArray(custResp.data) ? custResp.data : custResp.data?.items || []
  } catch (err) {
    console.error('Lookup error:', err)
  }
}

async function saveSchedule() {
  try {
    await api.post('deferred-revenue', form.value)
    showEditModal.value = false
    await load()
  } catch (err) {
    alert(err.response?.data?.message || 'Save failed')
  }
}

async function deleteSchedule(s) {
  if (!confirm(`Delete schedule "${s.name}"?`)) return
  try {
    await api.delete(`deferred-revenue/${s.scheduleId}`)
    await load()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}

async function recognize() {
  try {
    const resp = await api.post('deferred-revenue/recognize', recognizeForm.value)
    recognizeResults.value = resp.data.results || []
    await load()
  } catch (err) {
    alert(err.response?.data?.message || 'Recognize failed')
  }
}

onMounted(() => {
  load()
  loadLookups()
})
</script>
