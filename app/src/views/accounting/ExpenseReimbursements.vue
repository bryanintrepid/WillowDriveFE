<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Expense Reimbursements</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item active">Expense Reimbursements</li>
          </ol>
        </div>
        <div>
          <router-link to="/accounting/expense-reports/new" class="btn btn-primary btn-sm">
            <i class="ri-add-line me-1"></i>New Expense Report
          </router-link>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row" v-if="summary">
      <div class="col-md-2">
        <div class="card">
          <div class="card-body text-center">
            <div class="fs-4 fw-bold text-secondary">{{ summary.draftCount }}</div>
            <div class="text-muted small">Draft</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card">
          <div class="card-body text-center">
            <div class="fs-4 fw-bold text-warning">{{ summary.submittedCount }}</div>
            <div class="text-muted small">Submitted</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card">
          <div class="card-body text-center">
            <div class="fs-4 fw-bold text-warning">{{ formatCurrency(summary.submittedTotal) }}</div>
            <div class="text-muted small">Pending Amount</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card">
          <div class="card-body text-center">
            <div class="fs-4 fw-bold text-success">{{ summary.approvedCount }}</div>
            <div class="text-muted small">Approved</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card">
          <div class="card-body text-center">
            <div class="fs-4 fw-bold text-primary">{{ formatCurrency(summary.paidTotal) }}</div>
            <div class="text-muted small">Paid Total</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card">
          <div class="card-body text-center">
            <div class="fs-4 fw-bold text-danger">{{ summary.rejectedCount }}</div>
            <div class="text-muted small">Rejected</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-3">
      <div class="card-body py-2">
        <div class="row align-items-center">
          <div class="col-md-3">
            <select class="form-select form-select-sm" v-model="filters.status" @change="loadReports">
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          <div class="col-md-3">
            <select class="form-select form-select-sm" v-model="filters.employeeId" @change="loadReports">
              <option value="">All Employees</option>
              <option v-for="emp in employees" :key="emp.employeeId" :value="emp.employeeId">
                {{ emp.name || emp.employeeNumber }}
              </option>
            </select>
          </div>
          <div class="col-md-4">
            <input type="text" class="form-control form-control-sm" v-model="filters.search"
                   placeholder="Search report# or employee..." @input="debounceSearch" />
          </div>
          <div class="col-md-2 text-end">
            <span class="text-muted small">{{ reports.length }} reports</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- Report List -->
    <div class="card" v-else>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-nowrap align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Report #</th>
                <th>Employee</th>
                <th>Period</th>
                <th class="text-end">Total</th>
                <th class="text-end">Approved</th>
                <th>Submitted</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in reports" :key="r.expenseReportId">
                <td>
                  <router-link :to="`/accounting/expense-reports/${r.expenseReportId}`" class="fw-medium">
                    {{ r.reportNumber }}
                  </router-link>
                </td>
                <td>{{ r.employeeName }}</td>
                <td>{{ formatDate(r.periodStart) }} - {{ formatDate(r.periodEnd) }}</td>
                <td class="text-end">{{ formatCurrency(r.totalAmount) }}</td>
                <td class="text-end">
                  <span v-if="r.approvedAmount != null">{{ formatCurrency(r.approvedAmount) }}</span>
                </td>
                <td>{{ r.submittedDate ? formatDate(r.submittedDate) : '' }}</td>
                <td>
                  <span class="badge" :class="getStatusClass(r.status)">{{ r.status }}</span>
                </td>
                <td>
                  <router-link :to="`/accounting/expense-reports/${r.expenseReportId}`" class="btn btn-soft-primary btn-sm">
                    <i class="ri-eye-line"></i>
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="reports.length === 0" class="text-center text-muted py-5">
          No expense reports found
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../services/api'

const loading = ref(true)
const error = ref(null)
const reports = ref([])
const employees = ref([])
const summary = ref(null)

const filters = reactive({
  status: '',
  employeeId: '',
  search: ''
})

let searchTimeout = null

const formatCurrency = (value) => {
  if (value == null) return '$0'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getStatusClass = (status) => {
  switch (status) {
    case 'Draft': return 'bg-secondary'
    case 'Submitted': return 'bg-warning'
    case 'Approved': return 'bg-success'
    case 'Rejected': return 'bg-danger'
    case 'Paid': return 'bg-primary'
    default: return 'bg-light text-dark'
  }
}

const loadReports = async () => {
  loading.value = true
  error.value = null
  try {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.employeeId) params.employeeId = filters.employeeId
    if (filters.search) params.search = filters.search

    const response = await api.get('expense-reports', { params })
    reports.value = response.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load expense reports'
  } finally {
    loading.value = false
  }
}

const loadEmployees = async () => {
  try {
    const response = await api.get('getEmployees')
    employees.value = response.data
  } catch (err) {
    console.error('Failed to load employees:', err)
  }
}

const loadSummary = async () => {
  try {
    const response = await api.get('expense-reports/summary')
    summary.value = response.data
  } catch (err) {
    console.error('Failed to load summary:', err)
  }
}

const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadReports(), 300)
}

onMounted(() => {
  loadEmployees()
  loadSummary()
  loadReports()
})
</script>

<style scoped>
</style>
