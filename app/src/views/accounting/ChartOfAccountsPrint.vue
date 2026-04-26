<template>
  <div class="print-container">
    <div class="d-print-none mb-3 d-flex justify-content-between align-items-center" style="padding: 1rem;">
      <div>
        <h4 class="mb-1">Chart of Accounts — Print View</h4>
        <ol class="breadcrumb m-0 align-items-center">
          <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
          <li class="breadcrumb-item"><router-link to="/accounting/chartofaccounts">Chart of Accounts</router-link></li>
          <li class="breadcrumb-item active">Print</li>
        </ol>
      </div>
      <button class="btn btn-primary btn-sm" @click="window.print()"><i class="ri-printer-line me-1"></i>Print</button>
    </div>

    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>

    <div v-else-if="error" class="alert alert-danger mx-3">{{ error }}</div>

    <div v-else class="print-content">
      <h2 class="text-center mb-3">Chart of Accounts</h2>
      <p class="text-center text-muted mb-4">Fiscal Year {{ fiscalYear || 'All' }} &mdash; {{ accounts.length }} accounts</p>
      <table class="table table-sm table-bordered">
        <thead>
          <tr>
            <th style="width: 15%;">Account #</th>
            <th style="width: 45%;">Description</th>
            <th style="width: 10%;">Type</th>
            <th style="width: 10%;">Level</th>
            <th class="text-center" style="width: 10%;">Rollup</th>
            <th class="text-center" style="width: 10%;">Statement</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in accounts" :key="a.accountNumber" :class="{ 'fw-bold': a.isRollup }">
            <td :style="{ paddingLeft: (a.level || 0) * 16 + 8 + 'px' }">{{ a.accountNumber }}</td>
            <td>{{ a.description }}</td>
            <td>{{ accountTypeLabel(a.accountType) }}</td>
            <td>{{ a.level }}</td>
            <td class="text-center">{{ a.isRollup ? 'Y' : '' }}</td>
            <td class="text-center">{{ a.isStatement ? 'Y' : '' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'

const route = useRoute()
const loading = ref(true)
const error = ref(null)
const accounts = ref([])
const fiscalYear = ref(null)

const accountTypes = { 1: 'Asset', 2: 'Liability', 3: 'Equity', 4: 'Revenue', 5: 'Expense' }
const accountTypeLabel = (t) => accountTypes[t] || t || ''

const loadAccounts = async () => {
  loading.value = true
  error.value = null
  try {
    fiscalYear.value = route.query.fiscalYear || null
    const params = fiscalYear.value ? `?fiscalYear=${fiscalYear.value}` : ''
    const response = await api.get(`chartofaccounts${params}`)
    accounts.value = response.data || []
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to load accounts'
  } finally {
    loading.value = false
  }
}

onMounted(loadAccounts)
</script>

<style scoped>
.print-content {
  padding: 0 1rem;
}

@media print {
  .d-print-none {
    display: none !important;
  }
  .print-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  .print-content {
    padding: 0;
  }
  table {
    font-size: 10pt;
  }
}
</style>
