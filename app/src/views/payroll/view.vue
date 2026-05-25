<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Pay Calendar</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item active" aria-current="page">Payroll</li>
          </ol>
        </div>
        <button class="btn btn-primary btn-sm" @click="showAdd = !showAdd">
          <i class="ri-add-line me-1"></i>{{ showAdd ? 'Cancel' : 'New Pay Period' }}
        </button>
      </div>
    </div>

    <!-- Add form -->
    <div v-if="showAdd" class="card">
      <div class="card-body">
        <div class="row g-2 align-items-end">
          <div class="col-2">
            <label class="form-label">Pay Bucket</label>
            <select class="form-select form-select-sm" v-model="newCal.bucket">
              <option value="0,0">Hourly Weekly</option>
              <option value="1,1">Salary Biweekly</option>
              <option value="1,2">Salary Monthly</option>
            </select>
          </div>
          <div class="col-1">
            <label class="form-label">Fiscal Year</label>
            <input type="number" class="form-control form-control-sm" v-model.number="newCal.fiscalYear" />
          </div>
          <div class="col-2">
            <label class="form-label">Period Start</label>
            <input type="date" class="form-control form-control-sm" v-model="newCal.periodStartDate" />
          </div>
          <div class="col-2">
            <label class="form-label">Period End</label>
            <input type="date" class="form-control form-control-sm" v-model="newCal.periodEndDate" />
          </div>
          <div class="col-2">
            <label class="form-label">Pay Date</label>
            <input type="date" class="form-control form-control-sm" v-model="newCal.payDate" />
          </div>
          <div class="col-3">
            <label class="form-label">Notes</label>
            <input type="text" class="form-control form-control-sm" v-model="newCal.notes" placeholder="Optional" />
          </div>
          <div class="col-12">
            <button class="btn btn-sm btn-primary" @click="createPayCalendar" :disabled="creating || !canSubmit">
              {{ creating ? 'Creating...' : 'Create' }}
            </button>
            <span v-if="addError" class="text-danger ms-2 small">{{ addError }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && !calendars.length" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger mx-3">{{ error }}</div>

    <!-- List -->
    <div v-else class="card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-nowrap align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Bucket</th>
                <th>FY</th>
                <th>Period</th>
                <th>Pay Date</th>
                <th>Status</th>
                <th>PayRun</th>
                <th>Notes</th>
                <th style="width: 180px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in calendars" :key="c.payCalendarId">
                <td>{{ bucketLabel(c.payType, c.payPeriod) }}</td>
                <td>{{ c.fiscalYear }}</td>
                <td>{{ c.periodStartDate }} → {{ c.periodEndDate }}</td>
                <td>{{ c.payDate }}</td>
                <td>
                  <span class="badge" :class="statusBadgeClass(c.status)">{{ statusLabel(c.status) }}</span>
                </td>
                <td>
                  <router-link v-if="c.payrollRunId"
                    :to="{ name: 'payroll-pay-run-detail', params: { payrollRunId: c.payrollRunId } }">
                    #{{ c.payrollRunId }}
                  </router-link>
                  <span v-else class="text-muted">—</span>
                </td>
                <td class="text-muted small">{{ c.notes }}</td>
                <td>
                  <button v-if="!c.payrollRunId && c.status !== 4" class="btn btn-sm btn-outline-primary"
                    @click="createRun(c)" :disabled="busy[c.payCalendarId]">
                    <i class="ri-play-line me-1"></i>{{ busy[c.payCalendarId] ? 'Creating...' : 'Create Pay Run' }}
                  </button>
                </td>
              </tr>
              <tr v-if="!calendars.length">
                <td colspan="8" class="text-center text-muted py-3">No pay periods scheduled yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/api'

const router = useRouter()
const loading = ref(true)
const error = ref('')
const calendars = ref([])
const showAdd = ref(false)
const creating = ref(false)
const addError = ref('')
const busy = reactive({})

const newCal = reactive({
  bucket: '0,0',
  fiscalYear: new Date().getFullYear(),
  periodStartDate: '',
  periodEndDate: '',
  payDate: '',
  notes: ''
})

const canSubmit = computed(() =>
  newCal.bucket && newCal.fiscalYear && newCal.periodStartDate && newCal.periodEndDate && newCal.payDate)

const bucketLabel = (pt, pp) => {
  if (pt === 0 && pp === 0) return 'Hourly Weekly'
  if (pt === 1 && pp === 1) return 'Salary Biweekly'
  if (pt === 1 && pp === 2) return 'Salary Monthly'
  return `(${pt},${pp})`
}

const STATUS_LABELS = ['Draft', 'Active', 'RunCreated', 'Posted', 'Cancelled']
const statusLabel = (s) => STATUS_LABELS[s] ?? `Status ${s}`
const statusBadgeClass = (s) => ({
  0: 'bg-secondary-subtle text-secondary',
  1: 'bg-warning-subtle text-warning',
  2: 'bg-info-subtle text-info',
  3: 'bg-success-subtle text-success',
  4: 'bg-danger-subtle text-danger'
}[s] || 'bg-secondary-subtle text-secondary')

const loadCalendars = async () => {
  loading.value = true
  error.value = ''
  try {
    const r = await api.get('payroll/pay-calendar')
    calendars.value = r.data
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to load pay calendars'
  } finally {
    loading.value = false
  }
}

const createPayCalendar = async () => {
  creating.value = true
  addError.value = ''
  const [pt, pp] = newCal.bucket.split(',').map(Number)
  try {
    await api.post('payroll/pay-calendar', {
      companyId: 1,
      fiscalYear: newCal.fiscalYear,
      payType: pt,
      payPeriod: pp,
      periodStartDate: newCal.periodStartDate,
      periodEndDate: newCal.periodEndDate,
      payDate: newCal.payDate,
      notes: newCal.notes || null
    })
    showAdd.value = false
    newCal.notes = ''
    await loadCalendars()
  } catch (err) {
    addError.value = err.response?.data?.message || err.message || 'Failed to create pay calendar'
  } finally {
    creating.value = false
  }
}

const createRun = async (cal) => {
  busy[cal.payCalendarId] = true
  try {
    const r = await api.post(`payroll/pay-runs/from-calendar/${cal.payCalendarId}`)
    router.push({ name: 'payroll-pay-run-detail', params: { payrollRunId: r.data.payrollRunId } })
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to create pay run'
  } finally {
    busy[cal.payCalendarId] = false
  }
}

onMounted(loadCalendars)
</script>
