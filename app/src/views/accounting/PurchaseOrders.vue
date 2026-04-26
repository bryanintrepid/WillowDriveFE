<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Purchase Orders</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item active">Purchase Orders</li>
          </ol>
        </div>
        <div>
          <router-link to="/accounting/purchase-orders/new" class="btn btn-primary btn-sm">
            <i class="ri-add-line me-1"></i>New PO
          </router-link>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row" v-if="summary">
      <div class="col-md-2">
        <div class="card">
          <div class="card-body text-center">
            <div class="fs-4 fw-bold text-primary">{{ summary.openPoCount }}</div>
            <div class="text-muted small">Open POs</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="card">
          <div class="card-body text-center">
            <div class="fs-4 fw-bold">{{ formatCurrency(summary.openPoTotal) }}</div>
            <div class="text-muted small">Open Amount</div>
          </div>
        </div>
      </div>
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
            <div class="fs-4 fw-bold text-warning">{{ summary.pendingApprovalCount }}</div>
            <div class="text-muted small">Pending Approval</div>
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
            <div class="fs-4 fw-bold text-danger">{{ summary.overdueDeliveryCount }}</div>
            <div class="text-muted small">Overdue</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-3">
      <div class="card-body py-2">
        <div class="row align-items-center">
          <div class="col-md-3">
            <select class="form-select form-select-sm" v-model="filters.status" @change="loadPOs">
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="PendingApproval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="PartiallyReceived">Partially Received</option>
              <option value="Received">Received</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div class="col-md-3">
            <select class="form-select form-select-sm" v-model="filters.vendorId" @change="loadPOs">
              <option value="">All Vendors</option>
              <option v-for="v in vendors" :key="v.vendorId" :value="v.vendorId">
                {{ v.name }}
              </option>
            </select>
          </div>
          <div class="col-md-4">
            <input type="text" class="form-control form-control-sm" v-model="filters.search"
                   placeholder="Search PO# or vendor..." @input="debounceSearch" />
          </div>
          <div class="col-md-2 text-end">
            <span class="text-muted small">{{ purchaseOrders.length }} POs</span>
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

    <!-- PO List -->
    <div class="card" v-else>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-nowrap align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>PO #</th>
                <th>Vendor</th>
                <th>Order Date</th>
                <th>Expected</th>
                <th class="text-end">Total</th>
                <th class="text-end">Received</th>
                <th class="text-end">Open</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="po in purchaseOrders" :key="po.purchaseOrderId">
                <td>
                  <router-link :to="`/accounting/purchase-orders/${po.purchaseOrderId}`" class="fw-medium">
                    {{ po.poNumber }}
                  </router-link>
                </td>
                <td>{{ po.vendorName }}</td>
                <td>{{ formatDate(po.orderDate) }}</td>
                <td>
                  <span v-if="po.expectedDeliveryDate" :class="isOverdue(po) ? 'text-danger' : ''">
                    {{ formatDate(po.expectedDeliveryDate) }}
                    <i v-if="isOverdue(po)" class="ri-error-warning-line"></i>
                  </span>
                </td>
                <td class="text-end">{{ formatCurrency(po.totalAmount) }}</td>
                <td class="text-end">{{ formatCurrency(po.receivedAmount) }}</td>
                <td class="text-end fw-medium">{{ formatCurrency(po.openAmount) }}</td>
                <td>
                  <span class="badge" :class="getStatusClass(po.status)">{{ formatStatus(po.status) }}</span>
                </td>
                <td>
                  <router-link :to="`/accounting/purchase-orders/${po.purchaseOrderId}`" class="btn btn-soft-primary btn-sm">
                    <i class="ri-eye-line"></i>
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="purchaseOrders.length === 0" class="text-center text-muted py-5">
          No purchase orders found
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
const purchaseOrders = ref([])
const vendors = ref([])
const summary = ref(null)

const filters = reactive({
  status: '',
  vendorId: '',
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

const formatStatus = (status) => {
  const map = {
    'Draft': 'Draft',
    'PendingApproval': 'Pending',
    'Approved': 'Approved',
    'PartiallyReceived': 'Partial',
    'Received': 'Received',
    'Closed': 'Closed',
    'Cancelled': 'Cancelled'
  }
  return map[status] || status
}

const getStatusClass = (status) => {
  switch (status) {
    case 'Draft': return 'bg-secondary'
    case 'PendingApproval': return 'bg-warning'
    case 'Approved': return 'bg-success'
    case 'PartiallyReceived': return 'bg-info'
    case 'Received': return 'bg-primary'
    case 'Closed': return 'bg-dark'
    case 'Cancelled': return 'bg-danger'
    default: return 'bg-light text-dark'
  }
}

const isOverdue = (po) => {
  if (!po.expectedDeliveryDate) return false
  if (po.status === 'Closed' || po.status === 'Cancelled' || po.status === 'Received') return false
  return new Date(po.expectedDeliveryDate) < new Date()
}

const loadPOs = async () => {
  loading.value = true
  error.value = null
  try {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.vendorId) params.vendorId = filters.vendorId
    if (filters.search) params.search = filters.search

    const response = await api.get('purchase-orders', { params })
    purchaseOrders.value = response.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load purchase orders'
  } finally {
    loading.value = false
  }
}

const loadVendors = async () => {
  try {
    const response = await api.get('gl/vendors')
    vendors.value = response.data
  } catch (err) {
    console.error('Failed to load vendors:', err)
  }
}

const loadSummary = async () => {
  try {
    const response = await api.get('purchase-orders/summary')
    summary.value = response.data
  } catch (err) {
    console.error('Failed to load summary:', err)
  }
}

const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadPOs(), 300)
}

onMounted(() => {
  loadVendors()
  loadSummary()
  loadPOs()
})
</script>

<style scoped>
</style>
