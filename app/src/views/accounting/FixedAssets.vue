<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Fixed Assets</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item active">Fixed Assets</li>
          </ol>
        </div>
        <div class="d-flex gap-2">
          <router-link to="/accounting/fixed-assets/new" class="btn btn-primary btn-sm">
            <i class="ri-add-line me-1"></i>Add Asset
          </router-link>
          <router-link to="/accounting/fixed-assets/depreciation" class="btn btn-outline-primary btn-sm">
            <i class="ri-calendar-check-line me-1"></i>Run Depreciation
          </router-link>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row" v-if="summary">
      <div class="col-md-2">
        <div class="card">
          <div class="card-body text-center">
            <div class="fs-4 fw-bold text-primary">{{ summary.activeAssets }}</div>
            <div class="text-muted small">Active Assets</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card">
          <div class="card-body text-center">
            <div class="fs-4 fw-bold">{{ formatCurrency(summary.totalCost) }}</div>
            <div class="text-muted small">Total Cost</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card">
          <div class="card-body text-center">
            <div class="fs-4 fw-bold text-warning">{{ formatCurrency(summary.totalAccumulatedDepreciation) }}</div>
            <div class="text-muted small">Accum. Depreciation</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card">
          <div class="card-body text-center">
            <div class="fs-4 fw-bold text-success">{{ formatCurrency(summary.totalNetBookValue) }}</div>
            <div class="text-muted small">Net Book Value</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card">
          <div class="card-body text-center">
            <div class="fs-4 fw-bold">{{ formatCurrency(summary.monthlyDepreciationExpense) }}</div>
            <div class="text-muted small">Monthly Depr.</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card">
          <div class="card-body text-center">
            <div class="fs-4 fw-bold">{{ formatCurrency(summary.ytdDepreciationExpense) }}</div>
            <div class="text-muted small">YTD Depr.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-3">
      <div class="card-body py-2">
        <div class="row align-items-center">
          <div class="col-md-3">
            <select class="form-select form-select-sm" v-model="filters.status" @change="loadAssets">
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="FullyDepreciated">Fully Depreciated</option>
              <option value="Disposed">Disposed</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div class="col-md-3">
            <select class="form-select form-select-sm" v-model="filters.categoryId" @change="loadAssets">
              <option value="">All Categories</option>
              <option v-for="cat in categories" :key="cat.assetCategoryId" :value="cat.assetCategoryId">
                {{ cat.categoryName }}
              </option>
            </select>
          </div>
          <div class="col-md-4">
            <input type="text" class="form-control form-control-sm" v-model="filters.search"
                   placeholder="Search by asset number or description..." @input="debounceSearch" />
          </div>
          <div class="col-md-2 text-end">
            <span class="text-muted small">{{ assets.length }} assets</span>
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

    <!-- Asset List -->
    <div class="card" v-else>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-nowrap align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Asset #</th>
                <th>Description</th>
                <th>Category</th>
                <th>Acquired</th>
                <th class="text-end">Cost</th>
                <th class="text-end">Accum. Depr.</th>
                <th class="text-end">NBV</th>
                <th>Method</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="asset in assets" :key="asset.fixedAssetId">
                <td>
                  <router-link :to="`/accounting/fixed-assets/${asset.fixedAssetId}`" class="fw-medium">
                    {{ asset.assetNumber }}
                  </router-link>
                </td>
                <td>{{ asset.description }}</td>
                <td><span class="badge bg-light text-dark">{{ asset.categoryName }}</span></td>
                <td>{{ formatDate(asset.acquisitionDate) }}</td>
                <td class="text-end">{{ formatCurrency(asset.acquisitionCost) }}</td>
                <td class="text-end text-warning">{{ formatCurrency(asset.accumulatedDepreciation) }}</td>
                <td class="text-end fw-medium">{{ formatCurrency(asset.netBookValue) }}</td>
                <td><span class="badge bg-secondary">{{ asset.depreciationMethod }}</span></td>
                <td>
                  <span class="badge" :class="getStatusClass(asset.status)">{{ asset.status }}</span>
                </td>
                <td>
                  <router-link :to="`/accounting/fixed-assets/${asset.fixedAssetId}`" class="btn btn-soft-primary btn-sm">
                    <i class="ri-eye-line"></i>
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="assets.length === 0" class="text-center text-muted py-5">
          No assets found
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
const assets = ref([])
const categories = ref([])
const summary = ref(null)

const filters = reactive({
  status: '',
  categoryId: '',
  search: ''
})

let searchTimeout = null

const formatCurrency = (value) => {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getStatusClass = (status) => {
  switch (status) {
    case 'Active': return 'bg-success'
    case 'FullyDepreciated': return 'bg-warning'
    case 'Disposed': return 'bg-danger'
    case 'Inactive': return 'bg-secondary'
    default: return 'bg-light text-dark'
  }
}

const loadAssets = async () => {
  loading.value = true
  error.value = null
  try {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.categoryId) params.categoryId = filters.categoryId
    if (filters.search) params.search = filters.search

    const response = await api.get('fixed-assets', { params })
    assets.value = response.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load assets'
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

const loadSummary = async () => {
  try {
    const response = await api.get('fixed-assets/summary')
    summary.value = response.data
  } catch (err) {
    console.error('Failed to load summary:', err)
  }
}

const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadAssets(), 300)
}

onMounted(() => {
  loadCategories()
  loadSummary()
  loadAssets()
})
</script>

<style scoped>
</style>
