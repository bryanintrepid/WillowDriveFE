<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Deductions</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Employees</li>
            <li class="breadcrumb-item active" aria-current="page">Deductions</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2">
          <div style="width: 250px;">
            <input type="text" class="form-control form-control-sm" v-model="searchText" placeholder="Search deductions..." />
          </div>
          <button class="btn btn-primary btn-sm" @click="showAdd = !showAdd">
            <i class="ri-add-line me-1"></i>New Deduction
          </button>
        </div>
      </div>
    </div>

    <!-- Add form -->
    <div v-if="showAdd" class="card">
      <div class="card-body">
        <div class="row g-2 align-items-end">
          <div class="col-2">
            <label class="form-label">Code</label>
            <input type="text" class="form-control form-control-sm" v-model="newDed.deductionCode" />
          </div>
          <div class="col-3">
            <label class="form-label">Description</label>
            <input type="text" class="form-control form-control-sm" v-model="newDed.description" />
          </div>
          <div class="col-2">
            <label class="form-label">Short Description</label>
            <input type="text" class="form-control form-control-sm" v-model="newDed.shortDescription" />
          </div>
          <div class="col-2">
            <label class="form-label">Method</label>
            <select class="form-select form-select-sm" v-model="newDed.method">
              <option :value="0">Fixed</option>
              <option :value="1">Percent</option>
              <option :value="2">Calculated</option>
            </select>
          </div>
          <div class="col-1">
            <label class="form-label">Rate</label>
            <input type="number" step="0.001" class="form-control form-control-sm" v-model="newDed.rate" />
          </div>
          <div class="col-2">
            <button class="btn btn-sm btn-primary" @click="createDeduction" :disabled="!newDed.deductionCode">Create</button>
            <button class="btn btn-sm btn-light ms-1" @click="showAdd = false">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && !deductions.length" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger mx-3">{{ error }}</div>

    <!-- Deduction List -->
    <div v-else class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-nowrap align-middle">
            <thead>
              <tr>
                <th style="width: 10%">Code</th>
                <th style="width: 25%">Description</th>
                <th style="width: 15%">Short Desc</th>
                <th style="width: 10%">Method</th>
                <th class="text-end" style="width: 10%">Rate</th>
                <th class="text-end" style="width: 10%">Match %</th>
                <th class="text-end" style="width: 10%">Max W/H</th>
                <th style="width: 5%; text-align: center;">401k</th>
                <th style="width: 5%; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ded in deductions" :key="ded.deductionCode">
                <td>
                  <a href="#" @click.prevent="selectDeduction(ded)">{{ ded.deductionCode }}</a>
                </td>
                <td>{{ ded.description }}</td>
                <td>{{ ded.shortDescription }}</td>
                <td>{{ methodLabel(ded.method) }}</td>
                <td class="text-end">{{ ded.rate }}</td>
                <td class="text-end">{{ ded.employerMatchPercent }}</td>
                <td class="text-end">{{ ded.maximumWithholding != null ? formatCurrency(ded.maximumWithholding) : '' }}</td>
                <td class="text-center">
                  <span v-if="ded.deductionType401K" class="badge bg-info-subtle text-info">Yes</span>
                </td>
                <td class="text-center">
                  <button class="btn btn-sm btn-outline-primary" @click="selectDeduction(ded)">
                    <i class="ri-pencil-line"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="!deductions.length && !loading" class="text-center my-4">
          <p class="text-muted fs-15">No deductions found</p>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="selectedDeduction" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Deduction: {{ selectedDeduction.deductionCode }}</h5>
            <button type="button" class="btn-close" @click="selectedDeduction = null"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-6">
                <label class="form-label">Description</label>
                <input type="text" class="form-control" v-model="selectedDeduction.description" />
              </div>
              <div class="col-6">
                <label class="form-label">Short Description</label>
                <input type="text" class="form-control" v-model="selectedDeduction.shortDescription" />
              </div>
              <div class="col-4">
                <label class="form-label">Method</label>
                <select class="form-select" v-model="selectedDeduction.method">
                  <option :value="0">Fixed</option>
                  <option :value="1">Percent</option>
                  <option :value="2">Calculated</option>
                </select>
              </div>
              <div class="col-4">
                <label class="form-label">Rate</label>
                <input type="number" step="0.001" class="form-control" v-model="selectedDeduction.rate" />
              </div>
              <div class="col-4">
                <label class="form-label">Max Withholding</label>
                <input type="number" step="0.01" class="form-control" v-model="selectedDeduction.maximumWithholding" />
              </div>
              <div class="col-4">
                <label class="form-label">Employer Match %</label>
                <input type="number" step="0.001" class="form-control" v-model="selectedDeduction.employerMatchPercent" />
              </div>
              <div class="col-4">
                <label class="form-label">Employer Max %</label>
                <input type="number" step="0.001" class="form-control" v-model="selectedDeduction.employerMaxPercent" />
              </div>
              <div class="col-4">
                <label class="form-label">GL Expense Account</label>
                <input type="text" class="form-control" v-model="selectedDeduction.glExpenseAccountNumber" />
              </div>
              <div class="col-4">
                <div class="form-check mt-4">
                  <input class="form-check-input" type="checkbox" v-model="selectedDeduction.deductionType401K" />
                  <label class="form-check-label">401k Type</label>
                </div>
              </div>
              <div class="col-4">
                <div class="form-check mt-4">
                  <input class="form-check-input" type="checkbox" v-model="selectedDeduction.federalWithholdingExempt" />
                  <label class="form-check-label">FDWH Exempt</label>
                </div>
              </div>
              <div class="col-4">
                <div class="form-check mt-4">
                  <input class="form-check-input" type="checkbox" v-model="selectedDeduction.ficaWithholdingExempt" />
                  <label class="form-check-label">FICA Exempt</label>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light" @click="selectedDeduction = null">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveDeduction">Save</button>
          </div>
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
const deductions = ref([])
const searchText = ref('')
const showAdd = ref(false)
const selectedDeduction = ref(null)
let searchTimeout = null

const newDed = reactive({
  companyId: 1,
  deductionCode: '',
  description: '',
  shortDescription: '',
  method: 0,
  rate: 0,
  isNew: true,
})

const methodLabel = (m) => ['Fixed', 'Percent', 'Calculated'][m] || 'Unknown'

const formatCurrency = (value) => {
  if (value == null) return ''
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const loadDeductions = async () => {
  loading.value = true
  error.value = null
  try {
    const params = { companyId: 1 }
    if (searchText.value) params.search = searchText.value
    const response = await api.get('deductions', { params })
    deductions.value = response.data.items || []
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to load deductions'
  } finally {
    loading.value = false
  }
}

const createDeduction = async () => {
  try {
    await api.post('deductions', newDed)
    showAdd.value = false
    newDed.deductionCode = ''
    newDed.description = ''
    newDed.shortDescription = ''
    newDed.rate = 0
    await loadDeductions()
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to create deduction'
  }
}

const selectDeduction = async (ded) => {
  try {
    const response = await api.get(`deductions/${ded.companyId}/${ded.deductionCode}`)
    selectedDeduction.value = response.data
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to load deduction detail'
  }
}

const saveDeduction = async () => {
  try {
    await api.post('deductions', { ...selectedDeduction.value, isNew: false })
    selectedDeduction.value = null
    await loadDeductions()
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to save deduction'
  }
}

watch(searchText, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(loadDeductions, 350)
})

onMounted(loadDeductions)
</script>

<style scoped>
</style>
