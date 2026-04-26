<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Vacation Management</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item"><router-link :to="{ name: 'employee-list' }">Employees</router-link></li>
            <li class="breadcrumb-item active" aria-current="page">Vacation</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2">
          <div style="width: 200px;">
            <input type="text" class="form-control form-control-sm" v-model="searchText" placeholder="Search..." />
          </div>
          <button class="btn btn-primary btn-sm" @click="updateBalances" :disabled="processing">
            <i class="ri-add-circle-line me-1"></i>Accrue Monthly
          </button>
          <button class="btn btn-warning btn-sm" @click="resetYtd" :disabled="processing">
            <i class="ri-refresh-line me-1"></i>Reset YTD
          </button>
          <button class="btn btn-outline-secondary btn-sm" @click="showTransferModal = true">
            <i class="ri-arrow-left-right-line me-1"></i>Transfer
          </button>
        </div>
      </div>
    </div>

    <div v-if="message" class="alert alert-success mx-0 py-2">{{ message }}</div>
    <div v-if="error" class="alert alert-danger mx-0 py-2">{{ error }}</div>

    <!-- Table -->
    <div class="card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-sm table-hover mb-0">
            <thead>
              <tr>
                <th>Employee</th>
                <th class="text-end">Hrs/Year</th>
                <th class="text-end">Monthly</th>
                <th class="text-end">Start Year</th>
                <th class="text-end">Accrued</th>
                <th class="text-end">Used</th>
                <th class="text-end">Left</th>
                <th class="text-end">Hours Worked</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in employees" :key="emp.employeeId">
                <td>
                  <router-link :to="{ name: 'employee-detail', params: { employeeId: emp.employeeId } }">
                    {{ emp.name }}
                  </router-link>
                  <small class="text-muted ms-1">{{ emp.employeeNumber }}</small>
                </td>
                <td class="text-end">{{ formatNum(emp.vacationHoursPerYear) }}</td>
                <td class="text-end">{{ formatNum(emp.monthlyAccrual) }}</td>
                <td class="text-end">{{ formatNum(emp.vacationStartYear) }}</td>
                <td class="text-end">{{ formatNum(emp.vacationAccrued) }}</td>
                <td class="text-end">{{ formatNum(emp.vacationHoursUsed) }}</td>
                <td class="text-end fw-bold">{{ formatNum(emp.vacationHoursLeft) }}</td>
                <td class="text-end">{{ formatNum(emp.hoursWorked) }}</td>
              </tr>
              <tr v-if="!employees.length">
                <td colspan="8" class="text-center text-muted py-3">No salaried employees found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Transfer Modal -->
    <div v-if="showTransferModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Transfer Vacation Hours</h5>
            <button type="button" class="btn-close" @click="showTransferModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">From Employee</label>
                <select class="form-select" v-model="transfer.sourceEmployeeId">
                  <option :value="0">— Select —</option>
                  <option v-for="emp in employees" :key="emp.employeeId" :value="emp.employeeId">
                    {{ emp.name }} ({{ formatNum(emp.vacationHoursLeft) }} hrs left)
                  </option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label">To Employee</label>
                <select class="form-select" v-model="transfer.destinationEmployeeId">
                  <option :value="0">— Select —</option>
                  <option v-for="emp in employees" :key="emp.employeeId" :value="emp.employeeId">
                    {{ emp.name }} ({{ formatNum(emp.vacationHoursLeft) }} hrs left)
                  </option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label">Hours to Transfer</label>
                <input type="number" step="0.5" min="0" class="form-control" v-model.number="transfer.amountToTransfer" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light" @click="showTransferModal = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="transferVacation"
              :disabled="!transfer.sourceEmployeeId || !transfer.destinationEmployeeId || !transfer.amountToTransfer || transfer.sourceEmployeeId === transfer.destinationEmployeeId">
              Transfer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import api from '../../services/api'

const employees = ref([])
const searchText = ref('')
const processing = ref(false)
const message = ref('')
const error = ref(null)
const showTransferModal = ref(false)
const transfer = reactive({ sourceEmployeeId: 0, destinationEmployeeId: 0, amountToTransfer: 0 })
let searchTimeout = null

const formatNum = (val) => val != null ? Number(val).toFixed(2) : '—'

const loadEmployees = async () => {
  try {
    const params = new URLSearchParams()
    if (searchText.value) params.append('search', searchText.value)
    const response = await api.get(`employees/vacation?${params}`)
    employees.value = response.data
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to load vacation data'
  }
}

const updateBalances = async () => {
  if (!confirm('Accrue monthly vacation for all salaried employees?')) return
  processing.value = true
  error.value = null
  try {
    const response = await api.post('employees/vacation/update-balances', { companyId: 1 })
    message.value = `Updated ${response.data.updated} employees`
    await loadEmployees()
    setTimeout(() => { message.value = '' }, 3000)
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to update balances'
  } finally {
    processing.value = false
  }
}

const resetYtd = async () => {
  if (!confirm('Reset YTD vacation counters for all salaried employees? This will record a notation for each employee.')) return
  processing.value = true
  error.value = null
  try {
    const response = await api.post('employees/vacation/reset-ytd', { companyId: 1 })
    message.value = `Reset ${response.data.updated} employees`
    await loadEmployees()
    setTimeout(() => { message.value = '' }, 3000)
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to reset YTD'
  } finally {
    processing.value = false
  }
}

const transferVacation = async () => {
  error.value = null
  try {
    await api.post('employees/vacation/transfer', transfer)
    showTransferModal.value = false
    message.value = `Transferred ${transfer.amountToTransfer} hours successfully`
    transfer.sourceEmployeeId = 0
    transfer.destinationEmployeeId = 0
    transfer.amountToTransfer = 0
    await loadEmployees()
    setTimeout(() => { message.value = '' }, 3000)
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to transfer vacation'
  }
}

watch(searchText, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(loadEmployees, 350)
})

onMounted(loadEmployees)
</script>
