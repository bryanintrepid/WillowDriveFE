<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Vendor Invoices</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item">Payables</li>
            <li class="breadcrumb-item active" aria-current="page">Invoices</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2">
          <div style="width: 250px;">
            <input type="text" class="form-control form-control-sm" v-model="searchText" placeholder="Search invoices..." />
          </div>
          <router-link to="/accounting/vendor-invoices/new" class="btn btn-primary btn-sm">
            <i class="ri-add-line me-1"></i>New Invoice
          </router-link>
          <router-link to="/accounting/vendor-invoices/new?credit=1" class="btn btn-outline-danger btn-sm">
            <i class="ri-refund-2-line me-1"></i>Credit Memo
          </router-link>
        </div>
      </div>
    </div>

    <!-- Loading (initial) -->
    <div v-if="loading && !invoices.length" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger mx-3">{{ error }}</div>

    <!-- Invoice List -->
    <div v-else class="card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-nowrap align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Invoice #</th>
                <th>Vendor</th>
                <th>Date</th>
                <th>Due Date</th>
                <th class="text-end">Amount</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in invoices" :key="inv.vendorInvoiceId">
                <td>
                  <router-link :to="{ name: 'accounting-payables-invoices-detail', params: { vendorId: inv.vendorId, invoiceNumber: inv.invoiceNumber } }">
                    {{ inv.invoiceNumber }}
                  </router-link>
                </td>
                <td>
                  <router-link :to="{ name: 'accounting-payables-vendors-detail', params: { vendorId: inv.vendorId } }">
                    {{ inv.vendorName }}
                  </router-link>
                </td>
                <td>{{ formatDate(inv.invoiceDate) }}</td>
                <td>{{ formatDate(inv.dueDate) }}</td>
                <td class="text-end" :class="{ 'text-danger': inv.totalAmount < 0 }">{{ formatCurrency(inv.totalAmount) }}</td>
                <td class="text-center">
                  <span v-if="inv.totalAmount < 0" class="badge bg-danger-subtle text-danger me-1">Credit</span>
                  <span class="badge" :class="statusBadgeClass(inv)">
                    {{ statusLabel(inv) }}
                  </span>
                </td>
              </tr>
            </tbody>
            <tfoot class="table-light" v-if="invoices.length">
              <tr>
                <td colspan="4" class="text-end"><strong>Page total ({{ invoices.length }} invoices):</strong></td>
                <td class="text-end"><strong>{{ formatCurrency(pageTotal) }}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div v-if="!invoices.length && !loading" class="text-center my-4">
          <p class="text-muted fs-15">No invoices found</p>
        </div>
        <Paginate v-if="pagination.itemCount > 0" :paginator="pagination" @update:paginator="onPaginatorUpdate" class="px-3 pb-3" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Paginate from '@/components/Paginate.vue'
import api from '../../services/api'
import { useFilterStore } from '../../stores/filterStore'

const filterStore = useFilterStore()
const PAGE_KEY = 'vendorInvoices'

const loading = ref(true)
const error = ref(null)
const invoices = ref([])
const searchText = ref('')
let searchTimeout = null

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
}

const saveFilters = () => {
  filterStore.saveFilters(PAGE_KEY, {
    searchText: searchText.value,
    pageNumber: pagination.queryParams.pageNumber,
    pageSize: pagination.queryParams.pageSize,
  })
}

const pageTotal = computed(() => invoices.value.reduce((s, i) => s + (i.totalAmount || 0), 0))

const statusLabel = (inv) => inv.isPosted ? 'Posted' : 'Open'
const statusBadgeClass = (inv) => inv.isPosted ? 'bg-info-subtle text-info' : 'bg-warning-subtle text-warning'

const formatCurrency = (value) => {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString()
}

const loadInvoices = async () => {
  loading.value = true
  error.value = null
  try {
    const params = { page: pagination.queryParams.pageNumber, pageSize: pagination.queryParams.pageSize }
    if (searchText.value) params.search = searchText.value
    const response = await api.get('vendor-invoices', { params })
    const data = response.data
    invoices.value = data.items || []
    pagination.itemCount = data.totalCount || 0
    saveFilters()
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to load invoices'
  } finally {
    loading.value = false
  }
}

const onPaginatorUpdate = (updated) => {
  const oldPage = pagination.queryParams.pageNumber
  const oldSize = pagination.queryParams.pageSize
  Object.assign(pagination, updated)
  if (pagination.queryParams.pageNumber !== oldPage || pagination.queryParams.pageSize !== oldSize) {
    if (pagination.queryParams.pageSize !== oldSize) pagination.queryParams.pageNumber = 1
    loadInvoices()
  }
}

watch(searchText, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.queryParams.pageNumber = 1
    loadInvoices()
  }, 350)
})

onMounted(loadInvoices)
onBeforeUnmount(saveFilters)
</script>

<style scoped>
</style>
