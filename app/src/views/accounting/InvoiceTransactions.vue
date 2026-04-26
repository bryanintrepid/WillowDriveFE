<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Invoice Transactions</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item">Receivables</li>
            <li class="breadcrumb-item active" aria-current="page">Invoice Transactions</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="showPosted" v-model="showPosted">
            <label class="form-check-label" for="showPosted">Posted</label>
          </div>
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="showUnposted" v-model="showUnposted">
            <label class="form-check-label" for="showUnposted">Unposted</label>
          </div>
          <div style="width: 220px;">
            <input type="text" class="form-control form-control-sm" v-model="searchText" placeholder="Search invoices..." />
          </div>
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
                <th>Reference</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Date</th>
                <th class="text-end">Amount</th>
                <th class="text-end">Remainder</th>
                <th>Description</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in invoices" :key="inv.invoiceId">
                <td><router-link :to="{ name: 'accounting-invoice-transaction-detail', params: { invoiceId: inv.invoiceId } }"><strong>{{ inv.reference }}</strong></router-link></td>
                <td>{{ inv.customerName || inv.customerNumber }}</td>
                <td>
                  <span v-if="inv.transactionType == 2" class="badge bg-danger-subtle text-danger">Credit Memo</span>
                  <span v-else-if="inv.invoiceType == 1" class="badge bg-info-subtle text-info">Finance Chg</span>
                  <span v-else>Invoice</span>
                </td>
                <td>{{ formatDate(inv.transactionDate) }}</td>
                <td class="text-end" :class="{ 'text-danger': inv.invoiceAmount < 0 }">{{ formatCurrency(inv.invoiceAmount) }}</td>
                <td class="text-end" :class="inv.invoiceRemainder > 0 ? 'text-danger' : ''">{{ formatCurrency(inv.invoiceRemainder) }}</td>
                <td>{{ inv.description }}</td>
                <td class="text-center">
                  <span class="badge" :class="inv.posted ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'">
                    {{ inv.posted ? 'Posted' : 'Unposted' }}
                  </span>
                </td>
              </tr>
            </tbody>
            <tfoot class="table-light" v-if="invoices.length">
              <tr>
                <td colspan="4" class="text-end"><strong>Page total ({{ invoices.length }}):</strong></td>
                <td class="text-end"><strong>{{ formatCurrency(totalAmount) }}</strong></td>
                <td class="text-end"><strong>{{ formatCurrency(totalRemainder) }}</strong></td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div v-if="!invoices.length && !loading" class="text-center my-4">
          <p class="text-muted fs-15">No invoice transactions found</p>
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
const PAGE_KEY = 'invoiceTransactions'

const loading = ref(true)
const error = ref(null)
const invoices = ref([])
const searchText = ref('')
const showPosted = ref(true)
const showUnposted = ref(true)
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
  if (saved.showPosted != null) showPosted.value = saved.showPosted
  if (saved.showUnposted != null) showUnposted.value = saved.showUnposted
  if (saved.pageNumber) pagination.queryParams.pageNumber = saved.pageNumber
  if (saved.pageSize) pagination.queryParams.pageSize = saved.pageSize
}

const saveFilters = () => {
  filterStore.saveFilters(PAGE_KEY, {
    searchText: searchText.value,
    showPosted: showPosted.value,
    showUnposted: showUnposted.value,
    pageNumber: pagination.queryParams.pageNumber,
    pageSize: pagination.queryParams.pageSize,
  })
}

const totalAmount = computed(() => invoices.value.reduce((s, i) => s + (i.invoiceAmount || 0), 0))
const totalRemainder = computed(() => invoices.value.reduce((s, i) => s + (i.invoiceRemainder || 0), 0))

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
    const params = {
      page: pagination.queryParams.pageNumber,
      pageSize: pagination.queryParams.pageSize,
    }
    if (searchText.value) params.searchText = searchText.value
    if (showPosted.value) params.showPosted = true
    if (showUnposted.value) params.showUnposted = true
    const response = await api.get('invoice-transactions', { params })
    const data = response.data
    invoices.value = data.items || []
    pagination.itemCount = data.totalCount || 0
    saveFilters()
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to load invoice transactions'
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

watch([showPosted, showUnposted], () => {
  pagination.queryParams.pageNumber = 1
  loadInvoices()
})

onMounted(loadInvoices)
onBeforeUnmount(saveFilters)
</script>

<style scoped>
</style>
