<template>
  <div class="container-fluid" style="padding: 1.25rem; margin-top: 0.5rem;">
    <!-- Page header -->
    <div class="dashhead d-flex justify-content-between align-items-center mb-3">
      <div>
        <h4 class="mb-1">Manage Time Entries</h4>
        <ol class="breadcrumb m-0 align-items-center small">
          <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
          <li class="breadcrumb-item">Time</li>
          <li class="breadcrumb-item active" aria-current="page">Manage</li>
        </ol>
      </div>
      <div class="d-flex align-items-end gap-2">
        <button class="btn btn-primary" @click="openAddModal" :disabled="!employee?.id">Add Entry</button>
      </div>
    </div>

    <!-- Lookup row -->
    <div class="row g-3 align-items-end mb-3">
      <div class="col-lg-4">
        <label class="form-label">Employee Lookup</label>
        <input type="text" class="form-control" v-model="employeeQuery" @input="filterEmployees" placeholder="Type name or employee number" list="employeeOptions">
        <datalist id="employeeOptions">
          <option v-for="opt in filteredOptions" :key="opt.employeeNumber" :value="opt.name"></option>
        </datalist>
        <div class="form-text">Select from the autosuggest list to load entries.</div>
      </div>
      <div class="col-lg-2">
        <label class="form-label">Status</label>
        <div>
          <span v-if="message" class="badge bg-success">{{ message }}</span>
          <span v-else-if="error" class="badge bg-danger">{{ error }}</span>
          <span v-else class="text-muted">&nbsp;</span>
        </div>
      </div>
      <div class="col-lg-6 text-end">
        <button class="btn btn-info me-2" @click="registerCard" v-if="message && employee?.id && !employee?.tag">Register</button>
        <button class="btn btn-warning me-2" @click="reassignCard" v-if="employee?.tag && tagString">Unregister Card</button>
        <button class="btn btn-secondary" @click="clearData" v-if="message || tagString">Clear</button>
      </div>
    </div>

    <!-- Employee meta -->
    <div v-if="employee && employee.crewBossName" class="row mb-1">
      <div class="col-3 fw-semibold">Crew Boss:</div>
      <div class="col">{{ employee.crewBossName }}</div>
    </div>
    <div v-if="employee" class="row mb-1">
      <div class="col-3 fw-semibold">Vacation Balance</div>
      <div class="col">{{ employee.vacationHours }}</div>
    </div>
    <div v-if="employee" class="row mb-3">
      <div class="col-3 fw-semibold">Sick Leave Balance</div>
      <div class="col">{{ employee.sickHours }}</div>
    </div>

    <!-- Filters: Range, Start, End -->
    <div class="row g-3 align-items-end mb-3">
      <div class="col-lg-3">
        <label class="form-label">Pay Period</label>
        <select class="form-select" v-model="selectedRangeKey" @change="onRangeChange">
          <option v-for="r in ranges" :key="r.range" :value="r.range">{{ r.name }}</option>
        </select>
      </div>
      <div class="col-lg-3">
        <label class="form-label">Start Date</label>
        <input type="date" class="form-control" v-model="startISO" @change="syncStartFromISO">
      </div>
      <div class="col-lg-3">
        <label class="form-label">End Date</label>
        <input type="date" class="form-control" v-model="endISO" @change="syncEndFromISO">
      </div>
      <div class="col-lg-3 text-end">
        <button class="btn btn-primary" @click="refreshEntries" :disabled="!employee?.id">Load Entries</button>
      </div>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>Start</th>
                <th>End</th>
                <th>Total</th>
                <th>Adjusted</th>
                <th>Type</th>
                <th>Product</th>
                <th>Product Year</th>
                <th>Activity</th>
                <th style="width: 70px;">Edit</th>
                <th style="width: 70px;">Manual</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="entries.length">
                <template v-for="row in entries" :key="row.clockEntryId">
                  <tr @click="toggleNote(row)" :class="{ 'table-info': !!row.note }">
                    <td>{{ formatDateTime(row.timeIn) }}</td>
                    <td>{{ formatDateTime(row.timeOut) }}</td>
                    <td>{{ row.type !== 5 ? row.total : '' }}</td>
                    <td>{{ row.type !== 5 ? row.adjusted : '' }}</td>
                    <td>{{ row.typeName }}</td>
                    <td>{{ row.productName }}</td>
                    <td>{{ row.productYearName }}</td>
                    <td>{{ row.activityName }}</td>
                    <td>
                      <button class="btn btn-sm btn-soft-primary" @click.stop="openEdit(row)"><i class="ri-edit-line"></i></button>
                    </td>
                    <td>
                      <i v-if="row.note" class="ri-file-text-line text-muted"></i>
                    </td>
                  </tr>
                  <tr v-if="row.__showNote">
                    <td colspan="10" class="text-start"><small>{{ row.note }}</small></td>
                  </tr>
                </template>
              </template>
              <tr v-else>
                <td colspan="10" class="text-center text-muted">No entries</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showDialog" class="modal-backdrop fade show"></div>
    <div v-if="showDialog" class="modal d-block" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ entry.clockEntryId !== -1 ? 'Edit Entry' : 'Add Entry' }}</h5>
            <button type="button" class="btn-close" @click="closeDialog"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-danger py-2" v-if="dialogError">{{ dialogError }}</div>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Type</label>
                <select class="form-select" v-model.number="selectedTypeId" @change="typeChangeById">
                  <option v-for="t in typeOptions" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
              </div>
              <div class="col-md-6"></div>

              <div class="col-md-6">
                <label class="form-label">{{ vacationSickSelected ? 'Start Date' : noShowSelected ? 'Date' : 'Time In' }}</label>
                <input type="datetime-local" class="form-control" v-model="timeInISO" :step="60" />
              </div>
              <div class="col-md-6" v-if="!noShowSelected">
                <label class="form-label">{{ vacationSickSelected ? 'End Date' : 'Time Out' }}</label>
                <input type="datetime-local" class="form-control" v-model="timeOutISO" :step="60" />
              </div>

              <div class="col-md-4" v-if="!noShowSelected">
                <label class="form-label">Product</label>
                <select class="form-select" v-model="selectedProductId">
                  <option :value="null">--</option>
                  <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
              </div>
              <div class="col-md-4" v-if="!noShowSelected">
                <label class="form-label">Product Year</label>
                <select class="form-select" v-model="selectedProductYearId">
                  <option :value="null">--</option>
                  <option v-for="py in productYears" :key="py.id" :value="py.id">{{ py.name }}</option>
                </select>
              </div>
              <div class="col-md-4" v-if="!noShowSelected">
                <label class="form-label">Activity</label>
                <select class="form-select" v-model="selectedActivityId">
                  <option :value="null">--</option>
                  <option v-for="a in activities" :key="a.id" :value="a.id">{{ a.name }}</option>
                </select>
              </div>

              <div class="col-12">
                <label class="form-label">Note</label>
                <textarea class="form-control" rows="3" v-model="entry.note" placeholder="Enter note"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" @click="saveEntry">Save</button>
            <button type="button" class="btn btn-secondary" @click="closeDialog">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  </template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import api from '@/services/api'

// Employee lookup
const employees = ref([])
const employee = ref({})
const employeeQuery = ref('')
const filteredOptions = ref([])
const tagString = ref(null)
const message = ref(null)
const error = ref(null)

// Ranges and dates
const ranges = ref([])
const selectedRangeKey = ref('')
const start = ref('') // MM/DD/YYYY
const end = ref('')   // MM/DD/YYYY
const startISO = ref('') // yyyy-mm-dd
const endISO = ref('')

// Entries
const entries = ref([])

// Products/Years/Activities
const products = ref([])
const productYears = ref([])
const activities = ref([])

// Modal state
const showDialog = ref(false)
const dialogError = ref(null)
const entry = ref({
  clockEntryId: 0,
  employeeId: null,
  timeIn: null,
  timeOut: null,
  note: null,
  productId: null,
  productYear: null,
  activityId: null,
  type: 1,
})

const typeOptions = [
  { id: 1, name: 'Hours' },
  { id: 2, name: 'Holiday' },
  { id: 3, name: 'Vacation' },
  { id: 4, name: 'Sick' },
  { id: 5, name: 'No Show / Absent' },
]
const selectedTypeId = ref(1)
const vacationSickSelected = ref(false)
const noShowSelected = ref(false)

const selectedProductId = ref(null)
const selectedProductYearId = ref(null)
const selectedActivityId = ref(null)

const timeInISO = ref('')
const timeOutISO = ref('')

function filterEmployees() {
  const q = employeeQuery.value?.toLowerCase() || ''
  if (!q) {
    filteredOptions.value = employees.value.slice(0, 25)
    return
  }
  filteredOptions.value = employees.value
    .filter(e => (e.name?.toLowerCase().includes(q)) || (String(e.employeeNumber).includes(q)))
    .slice(0, 25)
}

// When the user picks a name that exactly matches, load employee
watch(employeeQuery, (val) => {
  const match = employees.value.find(e => e.name === val)
  if (match) {
    getEmployee(match.employeeNumber)
  }
})

function onRangeChange() {
  if (!selectedRangeKey.value) return
  const [s, e] = selectedRangeKey.value.split('|')
  start.value = s
  end.value = e
  startISO.value = toISODate(s)
  endISO.value = toISODate(e)
  if (employee.value?.id) refreshEntries()
}

function syncStartFromISO() {
  start.value = fromISODate(startISO.value)
}
function syncEndFromISO() {
  end.value = fromISODate(endISO.value)
}

function toISODate(mmddyyyy) {
  if (!mmddyyyy) return ''
  const [mm, dd, yyyy] = mmddyyyy.split('/')
  return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`
}
function fromISODate(iso) {
  if (!iso) return ''
  const [yyyy, mm, dd] = iso.split('-')
  return `${mm}/${dd}/${yyyy}`
}

function formatDateTime(val) {
  if (!val) return ''
  try {
    const d = new Date(val)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const yyyy = d.getFullYear()
    let hr = d.getHours()
    const min = String(d.getMinutes()).padStart(2, '0')
    const ampm = hr >= 12 ? 'PM' : 'AM'
    hr = hr % 12
    hr = hr ? hr : 12
    return `${mm}-${dd}-${yyyy} ${hr}:${min} ${ampm}`
  } catch { return String(val) }
}

function toggleNote(row) {
  if (!row.note) return
  row.__showNote = !row.__showNote
}

function validateEntry() {
  dialogError.value = null
  // Hours/OT
  if (selectedTypeId.value < 2) {
    if (!timeInISO.value) {
      dialogError.value = 'Please add Time in'
      return false
    }
    if (timeOutISO.value) {
      const startD = new Date(timeInISO.value)
      const endD = new Date(timeOutISO.value)
      if (endD - startD < 0) {
        dialogError.value = 'Time Out must be after Time In'
        return false
      }
    }
    if (timeOutISO.value && (!selectedActivityId.value || !selectedProductId.value || !selectedProductYearId.value)) {
      dialogError.value = 'Please complete all product fields'
      return false
    }
  }
  // Vacation/Sick
  if (selectedTypeId.value >= 2 && selectedTypeId.value <= 4) {
    if (!timeInISO.value || !timeOutISO.value || !entry.value.note) {
      dialogError.value = 'Please add start and end dates and note'
      return false
    }
  }
  // No Show
  if (selectedTypeId.value === 5) {
    if (!timeInISO.value || !entry.value.note) {
      dialogError.value = 'Please add date and note'
      return false
    }
  }
  if (!entry.value.note) {
    dialogError.value = 'Please add note'
    return false
  }
  return true
}

function openAddModal() {
  if (!employee.value?.id) return
  showDialog.value = true
  entry.value = {
    clockEntryId: -1,
    employeeId: employee.value.id,
    timeIn: null,
    timeOut: null,
    note: null,
    productId: null,
    productYear: null,
    activityId: null,
    type: 1,
  }
  selectedTypeId.value = 1
  timeInISO.value = ''
  timeOutISO.value = ''
  selectedProductId.value = null
  selectedProductYearId.value = null
  selectedActivityId.value = null
  vacationSickSelected.value = false
  noShowSelected.value = false
  dialogError.value = null
}

function openEdit(row) {
  showDialog.value = true
  entry.value = { ...row }
  selectedTypeId.value = row.type
  // convert to ISO for inputs
  timeInISO.value = row.timeIn ? new Date(row.timeIn).toISOString().slice(0,16) : ''
  timeOutISO.value = row.timeOut ? new Date(row.timeOut).toISOString().slice(0,16) : ''
  selectedProductId.value = row.productId ?? null
  selectedProductYearId.value = row.productYear ?? null
  selectedActivityId.value = row.activityId ?? null
  typeChangeById()
  dialogError.value = null
}

function saveEntry() {
  if (!validateEntry()) return
  if (entry.value.clockEntryId !== -1) {
    updateEntry()
  } else {
    addEntry()
  }
}

function typeChangeById() {
  vacationSickSelected.value = selectedTypeId.value >= 2 && selectedTypeId.value <= 4
  noShowSelected.value = selectedTypeId.value === 5
  if (vacationSickSelected.value) {
    // set defaults similar to legacy
    const vacProduct = products.value.find(p => p.id == 9)
    const vacActivity = activities.value.find(a => a.id == 38)
    if (vacProduct) selectedProductId.value = vacProduct.id
    if (vacActivity) selectedActivityId.value = vacActivity.id
  }
}

function updateEntry() {
  const payload = {
    entryId: entry.value.clockEntryId,
    employeeId: entry.value.employeeId,
    timeIn: timeInISO.value ? new Date(timeInISO.value) : null,
    timeOut: timeOutISO.value ? new Date(timeOutISO.value) : null,
    type: selectedTypeId.value,
    productId: selectedProductId.value ? String(selectedProductId.value) : null,
    productYear: selectedProductYearId.value ? String(selectedProductYearId.value) : null,
    activityId: selectedActivityId.value ? String(selectedActivityId.value) : null,
    note: entry.value.note,
  }
  api.post('updateentry', payload)
    .then((response) => {
      if (response.data) {
        showDialog.value = false
        dialogError.value = null
        refreshEntries()
      } else {
        dialogError.value = response.error || 'Update failed'
      }
    })
}

function addEntry() {
  const payload = {
    employeeNumber: employee.value.employeeNumber,
    timeIn: timeInISO.value ? new Date(timeInISO.value) : null,
    timeOut: timeOutISO.value ? new Date(timeOutISO.value) : null,
    type: selectedTypeId.value,
    productId: selectedProductId.value ? String(selectedProductId.value) : null,
    productYear: selectedProductYearId.value ? String(selectedProductYearId.value) : null,
    activityId: selectedActivityId.value ? String(selectedActivityId.value) : null,
    note: entry.value.note,
  }
  api.post('addentry', payload)
    .then((response) => {
      if (response.data) {
        showDialog.value = false
        dialogError.value = null
        refreshEntries()
      } else {
        dialogError.value = response.error || 'Add failed'
      }
    })
}

function closeDialog() {
  showDialog.value = false
}

function refreshEntries() {
  if (!employee.value?.id || !start.value || !end.value) return
  api.get(`clockentries?id=${employee.value.id}&start=${start.value}&end=${end.value}`)
    .then((response) => {
      entries.value = (response.data || []).map(it => ({
        ...it,
        typeName: (typeOptions.find(t => t.id == it.type) || {}).name || it.type,
      }))
    })
}

function getEmployee(employeeNumber) {
  api.get(`getEmployee?empNumber=${employeeNumber}`)
    .then((response) => {
      if (response.data?.id) {
        employee.value = response.data
        message.value = null
        error.value = null
        // default range based on today within ranges
        ensureRangeForToday()
        refreshEntries()
      } else {
        error.value = 'No employee found'
        setTimeout(() => clearData(), 2000)
      }
    })
}

function registerCard() {
  if (!employee.value?.id || !tagString.value) return
  const payload = { id: employee.value.id, tag: tagString.value }
  api.post('registercard', payload)
    .then((response) => {
      if (response.data) {
        message.value = 'Registered'
        employee.value.tag = tagString.value
      } else {
        setTimeout(() => clearData(), 2000)
      }
    })
}

function reassignCard() {
  if (!employee.value?.id || !tagString.value) return
  const payload = { id: employee.value.id, tag: tagString.value }
  api.post('reassigncard', payload)
    .then((response) => {
      if (response.data) {
        employee.value = {}
        entries.value = []
        message.value = 'Card is available'
        error.value = null
      } else {
        setTimeout(() => clearData(), 2000)
      }
    })
}

function clearData() {
  employeeQuery.value = ''
  filteredOptions.value = []
  entries.value = []
  tagString.value = null
  message.value = null
  error.value = null
  dialogError.value = null
  employee.value = {}
}

function ensureRangeForToday() {
  if (!ranges.value?.length) return
  const today = new Date()
  const todayStr = `${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}/${today.getFullYear()}`
  const r = ranges.value.find(val => {
    const [s,e] = val.range.split('|')
    return s <= todayStr && e >= todayStr
  })
  if (r) {
    selectedRangeKey.value = r.range
    onRangeChange()
  }
}

function getData() {
  api.get('gettimesheetdata')
    .then((response) => {
      products.value = response.data.accountProducts || []
      productYears.value = response.data.accountProductYears || []
      activities.value = response.data.timesheetActivities || []
      ranges.value = response.data.dateRangeOptions || []
      ensureRangeForToday()
    })
}

function getEmployees() {
  api.get('getEmployees')
    .then((response) => {
      employees.value = response.data || []
      filterEmployees()
    })
}

function initDefaults() {
  // default end = today, start = 30 days ago
  const now = new Date()
  endISO.value = now.toISOString().slice(0,10)
  startISO.value = new Date(now.getTime() - 30*86400000).toISOString().slice(0,10)
  start.value = fromISODate(startISO.value)
  end.value = fromISODate(endISO.value)
}

onMounted(() => {
  initDefaults()
  getData()
  getEmployees()
})

// react to type changes
watch(selectedTypeId, () => typeChangeById())

</script>

<style scoped>
.dashhead .breadcrumb { margin-bottom: 0; }
.modal-backdrop { background-color: rgba(0,0,0,0.35); }
</style>
