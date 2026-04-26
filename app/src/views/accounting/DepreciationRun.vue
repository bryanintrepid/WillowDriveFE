<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Run Depreciation</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item"><router-link to="/accounting/fixed-assets">Fixed Assets</router-link></li>
            <li class="breadcrumb-item active">Depreciation Run</li>
          </ol>
        </div>
        <div>
          <router-link to="/accounting/fixed-assets" class="btn btn-secondary btn-sm">
            <i class="ri-arrow-left-line me-1"></i>Back to Assets
          </router-link>
        </div>
      </div>
    </div>

    <div class="row">
      <!-- Left: Run Depreciation -->
      <div class="col-lg-5">
        <div class="card">
          <div class="card-header"><h5 class="card-title mb-0">Monthly Depreciation</h5></div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Fiscal Year</label>
                <select class="form-select" v-model.number="fiscalYear">
                  <option v-for="fy in fiscalYears" :key="fy" :value="fy">FY {{ fy }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Period</label>
                <select class="form-select" v-model.number="period">
                  <option v-for="p in 12" :key="p" :value="p">Period {{ p }} - {{ getPeriodName(p) }}</option>
                </select>
              </div>
            </div>

            <div class="d-flex gap-2">
              <button class="btn btn-outline-primary" @click="preview" :disabled="loading">
                <i class="ri-eye-line me-1"></i>Preview
              </button>
              <button class="btn btn-primary" @click="runDepreciation" :disabled="loading || !previewResult">
                <i class="ri-play-line me-1"></i>Post Depreciation
              </button>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="text-center my-4">
              <span class="spinner-border spinner-border-sm"></span> Loading...
            </div>

            <!-- Preview Result -->
            <div v-if="previewResult && !previewResult.wasPosted" class="mt-4">
              <div class="alert alert-info">
                <strong>Preview for {{ previewResult.periodLabel }}</strong><br>
                {{ previewResult.assetCount }} assets | Total: {{ formatCurrency(previewResult.totalDepreciation) }}
              </div>
            </div>

            <!-- Posted Result -->
            <div v-if="previewResult && previewResult.wasPosted" class="mt-4">
              <div class="alert alert-success">
                <strong>Depreciation Posted!</strong><br>
                {{ previewResult.assetCount }} assets | Total: {{ formatCurrency(previewResult.totalDepreciation) }}<br>
                Batch #{{ previewResult.batchNumber }}
              </div>
            </div>

            <!-- No Assets -->
            <div v-if="previewResult && previewResult.assetCount === 0" class="mt-4">
              <div class="alert alert-warning">
                {{ previewResult.message }}
              </div>
            </div>
          </div>
        </div>

        <!-- Depreciation Forecast -->
        <div class="card" v-if="forecast">
          <div class="card-header"><h5 class="card-title mb-0">FY {{ fiscalYear }} Forecast</h5></div>
          <div class="card-body p-0">
            <table class="table table-sm mb-0">
              <thead class="table-light">
                <tr>
                  <th>Period</th>
                  <th class="text-end">Amount</th>
                  <th class="text-end">YTD</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in forecast.periods" :key="p.period" :class="{ 'table-success': p.isPosted }">
                  <td>{{ p.periodLabel }}</td>
                  <td class="text-end">{{ formatCurrency(p.amount) }}</td>
                  <td class="text-end">{{ formatCurrency(p.cumulativeYtd) }}</td>
                  <td>
                    <span v-if="p.isPosted" class="badge bg-success">Posted</span>
                    <span v-else class="badge bg-light text-dark">Projected</span>
                  </td>
                </tr>
              </tbody>
              <tfoot class="table-light">
                <tr>
                  <td><strong>Total</strong></td>
                  <td class="text-end"><strong>{{ formatCurrency(forecast.totalForYear) }}</strong></td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Right: Preview Lines -->
      <div class="col-lg-7">
        <div class="card" v-if="previewResult?.lines?.length">
          <div class="card-header">
            <h5 class="card-title mb-0">
              Depreciation Detail
              <span class="badge bg-primary ms-2">{{ previewResult.lines.length }} assets</span>
            </h5>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive" style="max-height: 600px; overflow-y: auto;">
              <table class="table table-sm table-nowrap mb-0">
                <thead class="table-light sticky-top">
                  <tr>
                    <th>Asset</th>
                    <th>Category</th>
                    <th class="text-end">Cost</th>
                    <th class="text-end">Depr. Amt</th>
                    <th class="text-end">Accum. After</th>
                    <th class="text-end">NBV After</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="line in previewResult.lines" :key="line.fixedAssetId">
                    <td>
                      <router-link :to="`/accounting/fixed-assets/${line.fixedAssetId}`">
                        {{ line.assetNumber }}
                      </router-link>
                      <div class="text-muted small">{{ line.description }}</div>
                    </td>
                    <td><span class="badge bg-light text-dark">{{ line.categoryName }}</span></td>
                    <td class="text-end">{{ formatCurrency(line.acquisitionCost) }}</td>
                    <td class="text-end fw-medium">{{ formatCurrency(line.depreciationAmount) }}</td>
                    <td class="text-end text-warning">{{ formatCurrency(line.accumulatedDepreciationAfter) }}</td>
                    <td class="text-end">{{ formatCurrency(line.netBookValueAfter) }}</td>
                  </tr>
                </tbody>
                <tfoot class="table-light">
                  <tr>
                    <td colspan="3" class="text-end"><strong>Total:</strong></td>
                    <td class="text-end"><strong>{{ formatCurrency(previewResult.totalDepreciation) }}</strong></td>
                    <td colspan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- GL Entries Preview -->
        <div class="card" v-if="previewResult?.lines?.length">
          <div class="card-header"><h5 class="card-title mb-0">GL Entries</h5></div>
          <div class="card-body p-0">
            <table class="table table-sm mb-0">
              <thead class="table-light">
                <tr>
                  <th>Account</th>
                  <th>Description</th>
                  <th class="text-end">Debit</th>
                  <th class="text-end">Credit</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(entry, idx) in glEntries" :key="idx">
                  <td>{{ entry.account }}</td>
                  <td>{{ entry.description }}</td>
                  <td class="text-end">{{ entry.debit ? formatCurrency(entry.debit) : '' }}</td>
                  <td class="text-end">{{ entry.credit ? formatCurrency(entry.credit) : '' }}</td>
                </tr>
              </tbody>
              <tfoot class="table-light">
                <tr>
                  <td colspan="2" class="text-end"><strong>Total:</strong></td>
                  <td class="text-end"><strong>{{ formatCurrency(previewResult.totalDepreciation) }}</strong></td>
                  <td class="text-end"><strong>{{ formatCurrency(previewResult.totalDepreciation) }}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '../../services/api'

const loading = ref(false)
const previewResult = ref(null)
const forecast = ref(null)

// Default to current fiscal year and period
const currentDate = new Date()
const defaultFY = currentDate.getMonth() >= 6 ? currentDate.getFullYear() : currentDate.getFullYear() - 1
const defaultPeriod = currentDate.getMonth() >= 6 ? currentDate.getMonth() - 5 : currentDate.getMonth() + 7

const fiscalYear = ref(defaultFY)
const period = ref(defaultPeriod)

const fiscalYears = computed(() => {
  const years = []
  for (let y = defaultFY - 2; y <= defaultFY + 1; y++) years.push(y)
  return years
})

const periodNames = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const getPeriodName = (p) => periodNames[p - 1] || ''

const formatCurrency = (value) => {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

// Compute GL entries from preview lines
const glEntries = computed(() => {
  if (!previewResult.value?.lines) return []

  const entries = []

  // Group by expense account
  const byExpense = {}
  const byAccum = {}

  for (const line of previewResult.value.lines) {
    const expKey = line.depreciationExpenseAccountNumber
    const accKey = line.accumDepreciationAccountNumber

    byExpense[expKey] = (byExpense[expKey] || 0) + line.depreciationAmount
    byAccum[accKey] = (byAccum[accKey] || 0) + line.depreciationAmount
  }

  // Expense debits
  for (const [account, amount] of Object.entries(byExpense)) {
    entries.push({
      account,
      description: 'Depreciation Expense',
      debit: amount,
      credit: 0
    })
  }

  // Accum depreciation credits
  for (const [account, amount] of Object.entries(byAccum)) {
    entries.push({
      account,
      description: 'Accumulated Depreciation',
      debit: 0,
      credit: amount
    })
  }

  return entries
})

const preview = async () => {
  loading.value = true
  previewResult.value = null

  try {
    const response = await api.post('fixed-assets/depreciation-run', {
      fiscalYear: fiscalYear.value,
      period: period.value,
      preview: true
    })
    previewResult.value = response.data
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to preview depreciation')
  } finally {
    loading.value = false
  }
}

const runDepreciation = async () => {
  if (!confirm(`Post depreciation for ${previewResult.value.periodLabel}?\n\n${previewResult.value.assetCount} assets, ${formatCurrency(previewResult.value.totalDepreciation)} total`)) {
    return
  }

  loading.value = true

  try {
    const response = await api.post('fixed-assets/depreciation-run', {
      fiscalYear: fiscalYear.value,
      period: period.value,
      preview: false
    })
    previewResult.value = response.data
    loadForecast()  // Refresh forecast after posting
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to post depreciation')
  } finally {
    loading.value = false
  }
}

const loadForecast = async () => {
  try {
    const response = await api.get('fixed-assets/depreciation-forecast', {
      params: { fiscalYear: fiscalYear.value }
    })
    forecast.value = response.data
  } catch (err) {
    console.error('Failed to load forecast:', err)
  }
}

// Reload forecast when fiscal year changes
watch(fiscalYear, () => {
  loadForecast()
  previewResult.value = null
})

onMounted(() => {
  loadForecast()
})
</script>

<style scoped>
.sticky-top {
  position: sticky;
  top: 0;
  z-index: 1;
  background: white;
}
</style>
