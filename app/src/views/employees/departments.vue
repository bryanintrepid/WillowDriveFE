<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Departments</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Employees</li>
            <li class="breadcrumb-item active" aria-current="page">Departments</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2">
          <div style="width: 250px;">
            <input type="text" class="form-control form-control-sm" v-model="searchText" placeholder="Search departments..." />
          </div>
          <button class="btn btn-primary btn-sm" @click="showAdd = !showAdd">
            <i class="ri-add-line me-1"></i>New Department
          </button>
        </div>
      </div>
    </div>

    <!-- Add form -->
    <div v-if="showAdd" class="card">
      <div class="card-body">
        <div class="row g-2 align-items-end">
          <div class="col-2">
            <label class="form-label">Department #</label>
            <input type="text" class="form-control form-control-sm" v-model="newDept.departmentNumber" />
          </div>
          <div class="col-4">
            <label class="form-label">Description</label>
            <input type="text" class="form-control form-control-sm" v-model="newDept.description" />
          </div>
          <div class="col-3">
            <label class="form-label">GL Expense Account</label>
            <input type="text" class="form-control form-control-sm" v-model="newDept.glExpenseAccountNumber" />
          </div>
          <div class="col-2">
            <button class="btn btn-sm btn-primary" @click="createDepartment" :disabled="!newDept.departmentNumber">Create</button>
            <button class="btn btn-sm btn-light ms-1" @click="showAdd = false">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && !departments.length" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger mx-3">{{ error }}</div>

    <!-- Department List -->
    <div v-else class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-nowrap align-middle">
            <thead>
              <tr>
                <th style="width: 15%">Dept #</th>
                <th style="width: 40%">Description</th>
                <th style="width: 20%">GL Expense Account</th>
                <th style="width: 15%">Product Code</th>
                <th style="width: 10%; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="dept in departments" :key="dept.departmentNumber">
                <td>{{ dept.departmentNumber }}</td>
                <td>
                  <input v-if="editingDept === dept.departmentNumber" type="text" class="form-control form-control-sm" v-model="dept.description" />
                  <span v-else>{{ dept.description }}</span>
                </td>
                <td>
                  <input v-if="editingDept === dept.departmentNumber" type="text" class="form-control form-control-sm" v-model="dept.glExpenseAccountNumber" />
                  <span v-else>{{ dept.glExpenseAccountNumber }}</span>
                </td>
                <td>{{ dept.expenseProductCode }}</td>
                <td class="text-center">
                  <template v-if="editingDept === dept.departmentNumber">
                    <button class="btn btn-sm btn-primary me-1" @click="saveDepartment(dept)">
                      <i class="ri-save-line"></i>
                    </button>
                    <button class="btn btn-sm btn-light" @click="editingDept = null">
                      <i class="ri-close-line"></i>
                    </button>
                  </template>
                  <template v-else>
                    <button class="btn btn-sm btn-outline-primary me-1" @click="editingDept = dept.departmentNumber">
                      <i class="ri-pencil-line"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="deleteDepartment(dept)">
                      <i class="ri-delete-bin-line"></i>
                    </button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="!departments.length && !loading" class="text-center my-4">
          <p class="text-muted fs-15">No departments found</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import api from '../../services/api'

const loading = ref(true)
const error = ref(null)
const departments = ref([])
const searchText = ref('')
const showAdd = ref(false)
const editingDept = ref(null)
let searchTimeout = null

const newDept = reactive({
  companyId: 1,
  fiscalYear: new Date().getFullYear(),
  departmentNumber: '',
  description: '',
  glExpenseAccountNumber: '',
  isNew: true,
})

const loadDepartments = async () => {
  loading.value = true
  error.value = null
  try {
    const params = { companyId: 1, fiscalYear: new Date().getFullYear() }
    if (searchText.value) params.search = searchText.value
    const response = await api.get('departments', { params })
    departments.value = response.data.items || []
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to load departments'
  } finally {
    loading.value = false
  }
}

const createDepartment = async () => {
  try {
    await api.post('departments', newDept)
    showAdd.value = false
    newDept.departmentNumber = ''
    newDept.description = ''
    newDept.glExpenseAccountNumber = ''
    await loadDepartments()
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to create department'
  }
}

const saveDepartment = async (dept) => {
  try {
    await api.post('departments', {
      companyId: dept.companyId,
      fiscalYear: dept.fiscalYear,
      departmentNumber: dept.departmentNumber,
      description: dept.description,
      glExpenseAccountNumber: dept.glExpenseAccountNumber,
      isNew: false,
    })
    editingDept.value = null
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to save department'
  }
}

const deleteDepartment = async (dept) => {
  if (!confirm(`Delete department ${dept.departmentNumber}?`)) return
  try {
    await api.delete(`departments/${dept.companyId}/${dept.fiscalYear}/${dept.departmentNumber}`)
    await loadDepartments()
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to delete department'
  }
}

watch(searchText, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(loadDepartments, 350)
})

onMounted(loadDepartments)
</script>

<style scoped>
</style>
