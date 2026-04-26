<template>
  <div>
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Accruals</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item active">Accruals</li>
          </ol>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-success btn-sm" @click="showPostModal = true">
            <i class="ri-play-line me-1"></i>Post Accruals
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
            <div class="text-muted small">Total Accrued</div>
            <div class="fs-4 fw-bold">{{ formatCurrency(summary.totalAccruedAmount) }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body py-2">
            <div class="text-muted small">Total Posted</div>
            <div class="fs-4 fw-bold text-primary">{{ formatCurrency(summary.totalPostedAmount) }}</div>
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
          <p class="text-muted">No accrual schedules found.</p>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-sm table-hover align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Period Range</th>
                <th>Dr Account</th>
                <th>Cr Account</th>
                <th>Progress</th>
                <th>Vendor</th>
                <th>Status</th>
                <th style="width:100px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in schedules" :key="s.scheduleId"
                  :class="{ 'text-muted': s.status === 'Cancelled' }">
                <td>
                  <router-link :to="`/accounting/accruals/${s.scheduleId}`" class="fw-semibold text-decoration-none">
                    {{ s.name }}
                  </router-link>
                  <div v-if="s.description" class="small text-muted">{{ s.description }}</div>
                </td>
                <td>{{ formatCurrency(s.totalAmount) }}</td>
                <td class="small">
                  FY{{ s.startFiscalYear }} P{{ s.startPeriod }}
                  – FY{{ s.endFiscalYear }} P{{ s.endPeriod }}
                </td>
                <td class="small">{{ s.drAccountNumber }}</td>
                <td class="small">{{ s.crAccountNumber }}</td>
                <td>
                  <div class="progress" style="height: 18px; min-width: 80px;">
                    <div class="progress-bar" :style="{ width: progressPct(s) + '%' }">
                      {{ s.postedPeriods }}/{{ s.totalPeriods }}
                    </div>
                  </div>
                </td>
                <td class="small">{{ s.vendorName || '-' }}</td>
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
            <h5 class="modal-title">{{ form.scheduleId ? 'Edit' : 'New' }} Accrual Schedule</h5>
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
                  <option value="Manual">Manual</option>
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
              </div>
              <div class="col-4">
                <label class="form-label">Start (FY / Period)</label>
                <div class="d-flex gap-1">
                  <input type="number" class="form-control" v-model.number="form.startFiscalYear" placeholder="FY" />
                  <input type="number" class="form-control" v-model.number="form.startPeriod" placeholder="P" min="1" max="12" />
                </div>
              </div>
              <div class="col-4">
                <label class="form-label">End (FY / Period)</label>
                <div class="d-flex gap-1">
                  <input type="number" class="form-control" v-model.number="form.endFiscalYear" placeholder="FY" />
                  <input type="number" class="form-control" v-model.number="form.endPeriod" placeholder="P" min="1" max="12" />
                </div>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-6">
                <label class="form-label">Debit (Expense) Account</label>
                <select class="form-select" v-model="form.drAccountNumber">
                  <option value="">Select...</option>
                  <option v-for="a in accounts" :key="a.accountNumber" :value="a.accountNumber">
                    {{ a.accountNumber }} - {{ a.description }}
                  </option>
                </select>
              </div>
              <div class="col-6">
                <label class="form-label">Credit (Liability) Account</label>
                <select class="form-select" v-model="form.crAccountNumber">
                  <option value="">Select...</option>
                  <option v-for="a in accounts" :key="a.accountNumber" :value="a.accountNumber">
                    {{ a.accountNumber }} - {{ a.description }}
                  </option>
                </select>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Vendor (optional)</label>
              <select class="form-select" v-model="form.vendorId">
                <option :value="null">None</option>
                <option v-for="v in vendors" :key="v.vendorId" :value="v.vendorId">{{ v.name }}</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" @click="showEditModal = false">Cancel</button>
            <button class="btn btn-primary btn-sm" @click="saveSchedule"
                    :disabled="!form.name || !form.totalAmount || !form.drAccountNumber || !form.crAccountNumber">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showEditModal" class="modal-backdrop fade show"></div>

    <!-- Post Accruals Modal -->
    <div class="modal fade" :class="{ show: showPostModal }" :style="showPostModal ? 'display:block' : ''"
         tabindex="-1" @click.self="showPostModal = false">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Post Accruals</h5>
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
                <input type="number" class="form-control" v-model.number="postForm.period" min="1" max="12" />
              </div>
            </div>
            <p class="text-muted small">Posts all active schedules that cover the selected period.</p>
            <div v-if="postResults.length" class="mt-3">
              <strong>Results:</strong>
              <ul class="mb-0 small">
                <li v-for="(r, i) in postResults" :key="i">{{ r }}</li>
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" @click="showPostModal = false">Close</button>
            <button class="btn btn-success btn-sm" @click="postAccruals"
                    :disabled="!postForm.fiscalYear || !postForm.period">
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showPostModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'

const schedules = ref([])
const summary = ref({ activeCount: 0, completedCount: 0, totalAccruedAmount: 0, totalPostedAmount: 0 })
const accounts = ref([])
const vendors = ref([])
const statusFilter = ref(null)
const showEditModal = ref(false)
const showPostModal = ref(false)
const postResults = ref([])

const emptyForm = {
  scheduleId: null, name: '', description: '', totalAmount: 0,
  startFiscalYear: 2025, startPeriod: 10, endFiscalYear: 2025, endPeriod: 12,
  method: 'StraightLine', drAccountNumber: '', crAccountNumber: '', vendorId: null
}
const form = ref({ ...emptyForm })
const postForm = ref({ fiscalYear: 2025, period: 10 })

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
      totalAmount: s.totalAmount, startFiscalYear: s.startFiscalYear, startPeriod: s.startPeriod,
      endFiscalYear: s.endFiscalYear, endPeriod: s.endPeriod, method: s.method,
      drAccountNumber: s.drAccountNumber, crAccountNumber: s.crAccountNumber, vendorId: s.vendorId
    }
  } else {
    form.value = { ...emptyForm }
  }
  showEditModal.value = true
}

async function load() {
  try {
    const params = statusFilter.value ? { status: statusFilter.value } : {}
    const [schedResp, summResp] = await Promise.all([
      api.get('accruals', { params }),
      api.get('accruals/summary')
    ])
    schedules.value = schedResp.data
    summary.value = summResp.data
  } catch (err) {
    console.error('Load error:', err)
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

async function saveSchedule() {
  try {
    await api.post('accruals', form.value)
    showEditModal.value = false
    await load()
  } catch (err) {
    alert(err.response?.data?.message || 'Save failed')
  }
}

async function deleteSchedule(s) {
  if (!confirm(`Delete schedule "${s.name}"?`)) return
  try {
    await api.delete(`accruals/${s.scheduleId}`)
    await load()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}

async function postAccruals() {
  try {
    const resp = await api.post('accruals/post', postForm.value)
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
