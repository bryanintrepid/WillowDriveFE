<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Pending Transactions</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item active" aria-current="page">Pending Transactions</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2">
          <div style="width: 220px;">
            <input type="text" class="form-control form-control-sm" v-model="searchText" placeholder="Search batches..." @input="debouncedLoad" />
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger mx-3">{{ error }}</div>

    <!-- Transaction List -->
    <div v-else class="card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-nowrap align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Batch</th>
                <th>Journal</th>
                <th>Date</th>
                <th class="text-end">Total Debit</th>
                <th class="text-end">Total Credit</th>
                <th class="text-end">Difference</th>
                <th>Description</th>
                <th>Created By</th>
                <th style="width: 140px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in transactions" :key="t.glTransactionId">
                <td>
                  <router-link :to="{ name: 'accounting-batch-detail', params: { companyName: 'WDN', fiscalYear: getFiscalYear(t.transactionDate), batchNumber: t.batch } }">
                    <strong>{{ t.batch }}</strong>
                  </router-link>
                </td>
                <td>{{ journalLabel(t.journal) }}</td>
                <td>{{ formatDate(t.transactionDate) }}</td>
                <td class="text-end">{{ formatCurrency(t.totalDebit) }}</td>
                <td class="text-end">{{ formatCurrency(t.totalCredit) }}</td>
                <td class="text-end" :class="t.difference !== 0 ? 'text-danger fw-bold' : ''">{{ formatCurrency(t.difference) }}</td>
                <td>{{ t.description }}</td>
                <td>{{ t.creator }}</td>
                <td>
                  <button class="btn btn-success btn-sm me-1" @click="postBatch(t)" :disabled="posting === t.batch" title="Post batch">
                    <i class="ri-check-line"></i>
                  </button>
                  <button class="btn btn-danger btn-sm" @click="deleteBatch(t)" :disabled="deleting === t.batch" title="Delete batch">
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="!transactions.length" class="text-center my-4">
          <p class="text-muted fs-15">No pending transactions found</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'

const loading = ref(true)
const error = ref(null)
const transactions = ref([])
const searchText = ref('')
const posting = ref(null)
const deleting = ref(null)

let debounceTimer = null
const debouncedLoad = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(loadTransactions, 300)
}

const journalNames = { 1: 'GJ', 2: 'SJ', 3: 'CR', 4: 'PJ', 5: 'CD', 6: 'PR' }
const journalLabel = (j) => journalNames[j] || j || ''

const getFiscalYear = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.getMonth() >= 6 ? d.getFullYear() + 1 : d.getFullYear()
}

const formatCurrency = (value) => {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString()
}

const loadTransactions = async () => {
  loading.value = true
  error.value = null
  try {
    const params = new URLSearchParams()
    if (searchText.value) params.append('searchText', searchText.value)
    const response = await api.get(`pending-transactions?${params.toString()}`)
    transactions.value = response.data || []
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to load pending transactions'
  } finally {
    loading.value = false
  }
}

const postBatch = async (t) => {
  if (!confirm(`Post batch ${t.batch}?`)) return
  posting.value = t.batch
  try {
    await api.post(`pending-transactions/${t.batch}/post`)
    await loadTransactions()
  } catch (err) {
    alert(err.response?.data || err.message || 'Failed to post batch')
  } finally {
    posting.value = null
  }
}

const deleteBatch = async (t) => {
  if (!confirm(`Delete pending batch ${t.batch}? This cannot be undone.`)) return
  deleting.value = t.batch
  try {
    await api.delete(`pending-transactions/${t.batch}`)
    await loadTransactions()
  } catch (err) {
    alert(err.response?.data || err.message || 'Failed to delete batch')
  } finally {
    deleting.value = null
  }
}

onMounted(loadTransactions)
</script>

<style scoped>
</style>
