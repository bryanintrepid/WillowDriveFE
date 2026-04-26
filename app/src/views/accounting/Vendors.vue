<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Vendors</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item">Payables</li>
            <li class="breadcrumb-item active" aria-current="page">Vendors</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2">
          <div style="width: 250px;">
            <input type="text" class="form-control form-control-sm" v-model="searchText" placeholder="Search vendors..." />
          </div>
        </div>
      </div>
    </div>

    <!-- Loading (initial) -->
    <div v-if="loading && !vendors.length" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger mx-3">{{ error }}</div>

    <!-- Vendor List -->
    <div v-else class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-nowrap align-middle">
            <thead>
              <tr>
                <th style="width: 25%">Name</th>
                <th style="width: 15%">Phone</th>
                <th style="width: 20%">Email</th>
                <th style="width: 25%">Address</th>
                <th style="width: 10%">Account</th>
                <th style="width: 5%; text-align: center;">Active</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="vendor in vendors" :key="vendor.vendorId">
                <td>
                  <router-link :to="{ name: 'accounting-payables-vendors-detail', params: { vendorId: vendor.vendorId } }">
                    {{ vendor.name }}
                  </router-link>
                </td>
                <td>{{ vendor.phone }}</td>
                <td>{{ vendor.emailAddress }}</td>
                <td>{{ formatAddress(vendor) }}</td>
                <td>{{ vendor.accountNumber }}</td>
                <td class="text-center">
                  <span class="badge" :class="vendor.isActive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                    {{ vendor.isActive ? 'Yes' : 'No' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="!vendors.length && !loading" class="text-center my-4">
          <p class="text-muted fs-15">No vendors found</p>
        </div>
        <Paginate v-if="pagination.itemCount > 0" :paginator="pagination" @update:paginator="onPaginatorUpdate" class="px-2" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import Paginate from '@/components/Paginate.vue'
import api from '../../services/api'
import { useFilterStore } from '../../stores/filterStore'

const filterStore = useFilterStore()
const PAGE_KEY = 'vendors'

const loading = ref(true)
const error = ref(null)
const vendors = ref([])
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

const formatAddress = (v) => {
  const parts = [v.street, v.street2, v.city, v.state, v.zip].filter(Boolean)
  return parts.join(', ')
}

const loadVendors = async () => {
  loading.value = true
  error.value = null
  try {
    const params = { page: pagination.queryParams.pageNumber, pageSize: pagination.queryParams.pageSize }
    if (searchText.value) params.search = searchText.value
    const response = await api.get('vendors', { params })
    const data = response.data
    vendors.value = data.items || []
    pagination.itemCount = data.totalCount || 0
    saveFilters()
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to load vendors'
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
    loadVendors()
  }
}

watch(searchText, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.queryParams.pageNumber = 1
    loadVendors()
  }, 350)
})

onMounted(loadVendors)
onBeforeUnmount(saveFilters)
</script>

<style scoped>
</style>
