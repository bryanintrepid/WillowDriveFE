<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Statement Runs</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item">End of Period</li>
            <li class="breadcrumb-item active" aria-current="page">Statements</li>
          </ol>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger mx-3">{{ error }}</div>

    <!-- Statement Runs List -->
    <div v-else class="card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-nowrap align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Run ID</th>
                <th>Statement Date</th>
                <th>Period Start</th>
                <th class="text-center">Statements</th>
                <th class="text-end">Total Amount</th>
                <th class="text-center">Status</th>
                <th>Created By</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="run in runs" :key="run.statementRunId">
                <td><strong>{{ run.statementRunId }}</strong></td>
                <td>{{ formatDate(run.statementDate) }}</td>
                <td>{{ formatDate(run.startOfPeriod) }}</td>
                <td class="text-center">{{ run.statementCount }}</td>
                <td class="text-end">{{ formatCurrency(run.totalAmount) }}</td>
                <td class="text-center">
                  <span class="badge" :class="run.isFinalized ? 'bg-success-subtle text-success' : 'bg-info-subtle text-info'">
                    {{ run.isFinalized ? 'Finalized' : 'Draft' }}
                  </span>
                </td>
                <td>{{ run.creator }}</td>
                <td>{{ formatDate(run.dateCreated) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="!runs.length" class="text-center my-4">
          <p class="text-muted fs-15">No statement runs found</p>
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
const runs = ref([])

const formatCurrency = (value) => {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString()
}

const loadRuns = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await api.get('statement-runs')
    runs.value = response.data || []
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to load statement runs'
  } finally {
    loading.value = false
  }
}

onMounted(loadRuns)
</script>

<style scoped>
</style>
