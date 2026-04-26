<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">{{ isNew ? 'New Fixed Asset' : asset?.assetNumber }}</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item"><router-link to="/accounting/fixed-assets">Fixed Assets</router-link></li>
            <li class="breadcrumb-item active">{{ isNew ? 'New' : asset?.assetNumber }}</li>
          </ol>
        </div>
        <div class="d-flex gap-2">
          <router-link to="/accounting/fixed-assets" class="btn btn-secondary btn-sm">
            <i class="ri-arrow-left-line me-1"></i>Back
          </router-link>
          <button v-if="!isNew && asset?.status === 'Active'" class="btn btn-outline-danger btn-sm" @click="showDisposeModal = true">
            <i class="ri-delete-bin-line me-1"></i>Dispose
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger mx-3">{{ error }}</div>

    <form v-else @submit.prevent="save">
      <div class="row">
        <!-- Left Column: Asset Info -->
        <div class="col-lg-6">
          <div class="card">
            <div class="card-header"><h5 class="card-title mb-0">Asset Information</h5></div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Asset Number *</label>
                  <input type="text" class="form-control" v-model="form.assetNumber" required :disabled="!isNew" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Category *</label>
                  <select class="form-select" v-model="form.assetCategoryId" required @change="applyCategoryDefaults">
                    <option value="">Select category...</option>
                    <option v-for="cat in categories" :key="cat.assetCategoryId" :value="cat.assetCategoryId">
                      {{ cat.categoryName }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Description *</label>
                <input type="text" class="form-control" v-model="form.description" required />
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Serial Number</label>
                  <input type="text" class="form-control" v-model="form.serialNumber" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Location</label>
                  <input type="text" class="form-control" v-model="form.location" />
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Department</label>
                  <input type="text" class="form-control" v-model="form.department" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Cost Center</label>
                  <input type="text" class="form-control" v-model="form.costCenter" />
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h5 class="card-title mb-0">Acquisition</h5></div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Acquisition Date *</label>
                  <input type="date" class="form-control" v-model="form.acquisitionDate" required />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Acquisition Cost *</label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input type="number" step="0.01" class="form-control" v-model.number="form.acquisitionCost" required />
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Purchase Reference (PO#, Invoice#)</label>
                <input type="text" class="form-control" v-model="form.purchaseReference" />
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Depreciation -->
        <div class="col-lg-6">
          <div class="card">
            <div class="card-header"><h5 class="card-title mb-0">Depreciation Settings</h5></div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Method</label>
                  <select class="form-select" v-model="form.depreciationMethod">
                    <option value="StraightLine">Straight Line</option>
                    <option value="MACRS">MACRS</option>
                    <option value="DoubleDeclining">Double Declining</option>
                    <option value="None">None (Land)</option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Useful Life (months)</label>
                  <input type="number" class="form-control" v-model.number="form.usefulLifeMonths" />
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Salvage Value</label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input type="number" step="0.01" class="form-control" v-model.number="form.salvageValue" />
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Depreciation Start Date</label>
                  <input type="date" class="form-control" v-model="form.depreciationStartDate" />
                </div>
              </div>

              <div class="row" v-if="form.depreciationMethod === 'MACRS'">
                <div class="col-md-6 mb-3">
                  <label class="form-label">MACRS Class</label>
                  <select class="form-select" v-model="form.macrsClass">
                    <option value="">Select...</option>
                    <option value="3-Year">3-Year</option>
                    <option value="5-Year">5-Year</option>
                    <option value="7-Year">7-Year</option>
                    <option value="15-Year">15-Year</option>
                    <option value="27.5-Year">27.5-Year (Residential)</option>
                    <option value="39-Year">39-Year (Commercial)</option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Convention</label>
                  <select class="form-select" v-model="form.macrsConvention">
                    <option value="HalfYear">Half-Year</option>
                    <option value="MidMonth">Mid-Month</option>
                    <option value="MidQuarter">Mid-Quarter</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h5 class="card-title mb-0">GL Accounts</h5></div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">Asset Account</label>
                <input type="text" class="form-control" v-model="form.assetAccountNumber" placeholder="From category default" />
              </div>
              <div class="mb-3">
                <label class="form-label">Accumulated Depreciation Account</label>
                <input type="text" class="form-control" v-model="form.accumDepreciationAccountNumber" placeholder="From category default" />
              </div>
              <div class="mb-3">
                <label class="form-label">Depreciation Expense Account</label>
                <input type="text" class="form-control" v-model="form.depreciationExpenseAccountNumber" placeholder="From category default" />
              </div>
            </div>
          </div>

          <!-- Status (existing assets only) -->
          <div class="card" v-if="!isNew && asset">
            <div class="card-header"><h5 class="card-title mb-0">Status</h5></div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-2"><strong>Status:</strong>
                    <span class="badge ms-2" :class="getStatusClass(asset.status)">{{ asset.status }}</span>
                  </div>
                  <div class="mb-2"><strong>Net Book Value:</strong> {{ formatCurrency(asset.netBookValue) }}</div>
                  <div class="mb-2"><strong>Accumulated Depreciation:</strong> {{ formatCurrency(asset.accumulatedDepreciation) }}</div>
                </div>
                <div class="col-md-6">
                  <div class="mb-2"><strong>Monthly Depreciation:</strong> {{ formatCurrency(asset.monthlyDepreciation) }}</div>
                  <div class="mb-2"><strong>Remaining Months:</strong> {{ asset.remainingMonths }}</div>
                  <div class="mb-2" v-if="asset.lastDepreciationDate">
                    <strong>Last Depreciation:</strong> {{ formatDate(asset.lastDepreciationDate) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="card">
        <div class="card-body d-flex gap-2">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            <span v-if="saving"><span class="spinner-border spinner-border-sm me-1"></span>Saving...</span>
            <span v-else><i class="ri-save-line me-1"></i>{{ isNew ? 'Create Asset' : 'Save Changes' }}</span>
          </button>
          <router-link to="/accounting/fixed-assets" class="btn btn-secondary">Cancel</router-link>
        </div>
      </div>
    </form>

    <!-- Depreciation Schedule (existing assets) -->
    <div class="card" v-if="!isNew && asset?.depreciationSchedule?.length">
      <div class="card-header">
        <h5 class="card-title mb-0">Depreciation Schedule</h5>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
          <table class="table table-sm table-nowrap mb-0">
            <thead class="table-light sticky-top">
              <tr>
                <th>Period</th>
                <th class="text-end">Depreciation</th>
                <th class="text-end">Accumulated</th>
                <th class="text-end">Net Book Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="line in asset.depreciationSchedule" :key="line.depreciationScheduleId"
                  :class="{ 'table-success': line.isPosted }">
                <td>FY{{ line.fiscalYear }} P{{ line.period }}</td>
                <td class="text-end">{{ formatCurrency(line.depreciationAmount) }}</td>
                <td class="text-end">{{ formatCurrency(line.accumulatedDepreciationAtEnd) }}</td>
                <td class="text-end">{{ formatCurrency(line.netBookValueAtEnd) }}</td>
                <td>
                  <span v-if="line.isPosted" class="badge bg-success">Posted</span>
                  <span v-else class="badge bg-light text-dark">Projected</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Disposal Modal -->
    <div v-if="showDisposeModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Dispose Asset</h5>
            <button type="button" class="btn-close" @click="showDisposeModal = false"></button>
          </div>
          <div class="modal-body">
            <p>Dispose of <strong>{{ asset?.assetNumber }}</strong>?</p>
            <p class="text-muted small">Net Book Value: {{ formatCurrency(asset?.netBookValue) }}</p>

            <div class="mb-3">
              <label class="form-label">Disposal Date *</label>
              <input type="date" class="form-control" v-model="disposeForm.disposalDate" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Disposal Amount (Proceeds)</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input type="number" step="0.01" class="form-control" v-model.number="disposeForm.disposalAmount" />
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Method</label>
              <select class="form-select" v-model="disposeForm.disposalMethod">
                <option value="Sale">Sale</option>
                <option value="TradeIn">Trade-In</option>
                <option value="Scrapped">Scrapped</option>
                <option value="Donated">Donated</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Reference</label>
              <input type="text" class="form-control" v-model="disposeForm.reference" />
            </div>

            <div v-if="disposeForm.disposalAmount !== null" class="alert alert-info">
              <strong>Gain/Loss:</strong> {{ formatCurrency(disposeForm.disposalAmount - (asset?.netBookValue || 0)) }}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDisposeModal = false">Cancel</button>
            <button type="button" class="btn btn-danger" @click="disposeAsset" :disabled="disposing">
              <span v-if="disposing"><span class="spinner-border spinner-border-sm me-1"></span>Processing...</span>
              <span v-else>Dispose Asset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../services/api'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const asset = ref(null)
const categories = ref([])
const showDisposeModal = ref(false)
const disposing = ref(false)

const isNew = computed(() => route.params.assetId === 'new')

const form = reactive({
  fixedAssetId: 0,
  assetNumber: '',
  description: '',
  assetCategoryId: '',
  serialNumber: '',
  location: '',
  department: '',
  costCenter: '',
  acquisitionDate: new Date().toISOString().split('T')[0],
  acquisitionCost: 0,
  purchaseReference: '',
  depreciationMethod: 'StraightLine',
  usefulLifeMonths: 60,
  salvageValue: 0,
  depreciationStartDate: '',
  macrsClass: '',
  macrsConvention: 'HalfYear',
  assetAccountNumber: '',
  accumDepreciationAccountNumber: '',
  depreciationExpenseAccountNumber: ''
})

const disposeForm = reactive({
  disposalDate: new Date().toISOString().split('T')[0],
  disposalAmount: 0,
  disposalMethod: 'Sale',
  reference: ''
})

const formatCurrency = (value) => {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString()
}

const getStatusClass = (status) => {
  switch (status) {
    case 'Active': return 'bg-success'
    case 'FullyDepreciated': return 'bg-warning'
    case 'Disposed': return 'bg-danger'
    default: return 'bg-secondary'
  }
}

const loadAsset = async () => {
  if (isNew.value) {
    loading.value = false
    return
  }

  try {
    const response = await api.get(`fixed-assets/${route.params.assetId}`)
    asset.value = response.data

    // Populate form
    Object.assign(form, {
      fixedAssetId: asset.value.fixedAssetId,
      assetNumber: asset.value.assetNumber,
      description: asset.value.description,
      assetCategoryId: asset.value.assetCategoryId,
      serialNumber: asset.value.serialNumber || '',
      location: asset.value.location || '',
      department: asset.value.department || '',
      costCenter: asset.value.costCenter || '',
      acquisitionDate: asset.value.acquisitionDate?.split('T')[0] || '',
      acquisitionCost: asset.value.acquisitionCost,
      purchaseReference: asset.value.purchaseReference || '',
      depreciationMethod: asset.value.depreciationMethod,
      usefulLifeMonths: asset.value.usefulLifeMonths,
      salvageValue: asset.value.salvageValue,
      depreciationStartDate: asset.value.depreciationStartDate?.split('T')[0] || '',
      macrsClass: asset.value.macrsClass || '',
      macrsConvention: asset.value.macrsConvention || 'HalfYear',
      assetAccountNumber: asset.value.assetAccountNumber,
      accumDepreciationAccountNumber: asset.value.accumDepreciationAccountNumber,
      depreciationExpenseAccountNumber: asset.value.depreciationExpenseAccountNumber
    })
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load asset'
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const response = await api.get('fixed-assets/categories')
    categories.value = response.data
  } catch (err) {
    console.error('Failed to load categories:', err)
  }
}

const applyCategoryDefaults = () => {
  const cat = categories.value.find(c => c.assetCategoryId === form.assetCategoryId)
  if (cat && isNew.value) {
    form.depreciationMethod = cat.defaultDepreciationMethod
    form.usefulLifeMonths = cat.defaultUsefulLifeMonths
    form.macrsClass = cat.macrsClass || ''
    // Don't override account numbers if already set
    if (!form.assetAccountNumber) form.assetAccountNumber = cat.defaultAssetAccountNumber || ''
    if (!form.accumDepreciationAccountNumber) form.accumDepreciationAccountNumber = cat.defaultAccumDepreciationAccountNumber || ''
    if (!form.depreciationExpenseAccountNumber) form.depreciationExpenseAccountNumber = cat.defaultDepreciationExpenseAccountNumber || ''
  }
}

const save = async () => {
  saving.value = true
  error.value = null

  try {
    const payload = { ...form }
    if (!payload.depreciationStartDate) {
      payload.depreciationStartDate = payload.acquisitionDate
    }

    const response = await api.post('fixed-assets', payload)
    asset.value = response.data

    if (isNew.value) {
      router.push(`/accounting/fixed-assets/${response.data.fixedAssetId}`)
    } else {
      // Reload to get updated schedule
      await loadAsset()
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to save asset'
  } finally {
    saving.value = false
  }
}

const disposeAsset = async () => {
  disposing.value = true
  try {
    await api.post(`fixed-assets/${asset.value.fixedAssetId}/dispose`, disposeForm)
    showDisposeModal.value = false
    await loadAsset()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to dispose asset')
  } finally {
    disposing.value = false
  }
}

onMounted(() => {
  loadCategories()
  loadAsset()
})
</script>

<style scoped>
.sticky-top {
  position: sticky;
  top: 0;
  z-index: 1;
}
</style>
