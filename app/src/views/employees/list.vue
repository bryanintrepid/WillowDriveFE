<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Employees</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item active" aria-current="page">Employees</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2">
          <select class="form-select form-select-sm" v-model="statusFilter" style="width: 140px;">
            <option value="active">Active</option>
            <option value="terminated">Terminated</option>
            <option value="">All</option>
          </select>
          <div style="width: 250px;">
            <input type="text" class="form-control form-control-sm" v-model="searchText" placeholder="Search employees..." />
          </div>
          <button class="btn btn-outline-secondary btn-sm" @click="exportCsv">
            <i class="ri-download-2-line me-1"></i>CSV
          </button>
          <button class="btn btn-primary btn-sm" @click="showCreateModal = true">
            <i class="ri-add-line me-1"></i>New Employee
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && !employees.length" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger mx-3">{{ error }}</div>

    <!-- Employee List -->
    <div v-else class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-nowrap align-middle">
            <thead>
              <tr>
                <th @click="sortBy('EmployeeNumber')" style="cursor: pointer; width: 10%">
                  Emp # <i v-if="orderByField === 'EmployeeNumber'" :class="orderDesc ? 'ri-arrow-down-s-line' : 'ri-arrow-up-s-line'"></i>
                </th>
                <th @click="sortBy('Name')" style="cursor: pointer; width: 20%">
                  Name <i v-if="orderByField === 'Name'" :class="orderDesc ? 'ri-arrow-down-s-line' : 'ri-arrow-up-s-line'"></i>
                </th>
                <th style="width: 12%">Phone</th>
                <th style="width: 18%">Email</th>
                <th style="width: 12%">Job Title</th>
                <th style="width: 10%">Crew Boss</th>
                <th @click="sortBy('PayRate')" style="cursor: pointer; width: 8%; text-align: right;">
                  Pay Rate <i v-if="orderByField === 'PayRate'" :class="orderDesc ? 'ri-arrow-down-s-line' : 'ri-arrow-up-s-line'"></i>
                </th>
                <th style="width: 5%; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in employees" :key="emp.employeeId">
                <td>
                  <router-link :to="{ name: 'employee-detail', params: { employeeId: emp.employeeId } }">
                    {{ emp.employeeNumber }}
                  </router-link>
                </td>
                <td>
                  <router-link :to="{ name: 'employee-detail', params: { employeeId: emp.employeeId } }">
                    {{ emp.name }}
                  </router-link>
                  <span v-if="emp.preferredName" class="text-muted ms-1">({{ emp.preferredName }})</span>
                </td>
                <td>{{ emp.phoneNumber }}</td>
                <td>{{ emp.emailAddress }}</td>
                <td>{{ emp.jobTitle }}</td>
                <td>{{ emp.crewBossName }}</td>
                <td class="text-end">{{ formatCurrency(emp.payRate) }}</td>
                <td class="text-center">
                  <span class="badge" :class="emp.isTerminated ? 'bg-danger-subtle text-danger' : emp.temporary ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'">
                    {{ emp.isTerminated ? 'Terminated' : emp.temporary ? 'Temp' : 'Active' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="!employees.length && !loading" class="text-center my-4">
          <p class="text-muted fs-15">No employees found</p>
        </div>
        <Paginate v-if="pagination.itemCount > 0" :paginator="pagination" @update:paginator="onPaginatorUpdate" class="px-2" />
      </div>
    </div>

    <!-- Create Employee Modal -->
    <div v-if="showCreateModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">New Employee</h5>
            <button type="button" class="btn-close" @click="showCreateModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-6">
                <label class="form-label">First Name</label>
                <input type="text" class="form-control" v-model="newEmployee.firstName" />
              </div>
              <div class="col-6">
                <label class="form-label">Last Name</label>
                <input type="text" class="form-control" v-model="newEmployee.lastName" />
              </div>
              <div class="col-12">
                <label class="form-label">Job Title</label>
                <input type="text" class="form-control" v-model="newEmployee.jobTitle" />
              </div>
              <div class="col-6">
                <label class="form-label">Phone</label>
                <input type="text" class="form-control" v-model="newEmployee.phoneNumber" />
              </div>
              <div class="col-6">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" v-model="newEmployee.emailAddress" />
              </div>
              <div class="col-6">
                <label class="form-label">Pay Type</label>
                <select class="form-select" v-model="newEmployee.payType">
                  <option :value="0">Hourly</option>
                  <option :value="1">Salaried</option>
                </select>
              </div>
              <div class="col-6">
                <label class="form-label">Base Rate</label>
                <input type="number" step="0.01" class="form-control" v-model="newEmployee.baseRate" />
              </div>
              <div class="col-6">
                <label class="form-label">Hire Date</label>
                <input type="date" class="form-control" v-model="newEmployee.lastHireDate" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light" @click="showCreateModal = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="createEmployee" :disabled="!newEmployee.firstName || !newEmployee.lastName">
              Create Employee
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import Paginate from '@/components/Paginate.vue'
import api from '../../services/api'
import { useFilterStore } from '../../stores/filterStore'

const router = useRouter()
const filterStore = useFilterStore()
const PAGE_KEY = 'employees'

const loading = ref(true)
const error = ref(null)
const employees = ref([])
const searchText = ref('')
const statusFilter = ref('active')
const orderByField = ref('Name')
const orderDesc = ref(false)
const showCreateModal = ref(false)
let searchTimeout = null

const newEmployee = reactive({
  firstName: '',
  lastName: '',
  jobTitle: '',
  phoneNumber: '',
  emailAddress: '',
  payType: 0,
  baseRate: null,
  lastHireDate: new Date().toISOString().split('T')[0]
})

const pagination = reactive({
  itemCount: 0,
  queryParams: {
    pageNumber: 1,
    pageSize: 50,
  },
})

// Restore saved filters
const saved = filterStore.getFilters(PAGE_KEY)
if (saved) {
  if (saved.searchText) searchText.value = saved.searchText
  if (saved.pageNumber) pagination.queryParams.pageNumber = saved.pageNumber
  if (saved.pageSize) pagination.queryParams.pageSize = saved.pageSize
  if (saved.statusFilter) statusFilter.value = saved.statusFilter
  if (saved.orderBy) orderByField.value = saved.orderBy
  if (saved.orderDesc !== undefined) orderDesc.value = saved.orderDesc
}

const saveFilters = () => {
  filterStore.saveFilters(PAGE_KEY, {
    searchText: searchText.value,
    pageNumber: pagination.queryParams.pageNumber,
    pageSize: pagination.queryParams.pageSize,
    statusFilter: statusFilter.value,
    orderBy: orderByField.value,
    orderDesc: orderDesc.value,
  })
}

const formatCurrency = (value) => {
  if (value == null) return ''
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const sortBy = (field) => {
  if (orderByField.value === field) {
    orderDesc.value = !orderDesc.value
  } else {
    orderByField.value = field
    orderDesc.value = false
  }
  loadEmployees()
}

const loadEmployees = async () => {
  loading.value = true
  error.value = null
  try {
    const params = {
      page: pagination.queryParams.pageNumber,
      pageSize: pagination.queryParams.pageSize,
      orderBy: orderByField.value,
      orderDesc: orderDesc.value,
    }
    if (searchText.value) params.search = searchText.value
    if (statusFilter.value) params.status = statusFilter.value

    const response = await api.get('employees', { params })
    const data = response.data
    employees.value = data.items || []
    pagination.itemCount = data.totalCount || 0
    saveFilters()
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to load employees'
  } finally {
    loading.value = false
  }
}

const createEmployee = async () => {
  try {
    const response = await api.post('employees', newEmployee)
    showCreateModal.value = false
    router.push({ name: 'employee-detail', params: { employeeId: response.data.employeeId } })
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to create employee'
  }
}

const onPaginatorUpdate = (updated) => {
  const oldPage = pagination.queryParams.pageNumber
  const oldSize = pagination.queryParams.pageSize
  Object.assign(pagination, updated)
  if (pagination.queryParams.pageNumber !== oldPage || pagination.queryParams.pageSize !== oldSize) {
    if (pagination.queryParams.pageSize !== oldSize) pagination.queryParams.pageNumber = 1
    loadEmployees()
  }
}

watch(searchText, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.queryParams.pageNumber = 1
    loadEmployees()
  }, 350)
})

watch(statusFilter, () => {
  pagination.queryParams.pageNumber = 1
  loadEmployees()
})

const exportCsv = () => {
  const params = new URLSearchParams({
    search: searchText.value || '',
    status: statusFilter.value || '',
    orderBy: orderByField.value || 'Name',
    orderDesc: orderDesc.value
  })
  api.get(`employees/csv?${params}`, { responseType: 'blob' })
    .then((response) => {
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'employees.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    })
    .catch((err) => console.error('CSV export error', err))
}

onMounted(loadEmployees)
onBeforeUnmount(saveFilters)
</script>

<style scoped>
</style>
