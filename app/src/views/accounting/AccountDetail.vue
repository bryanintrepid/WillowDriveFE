<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Account Detail</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item"><router-link to="/accounting/chart-of-accounts">Chart of Accounts</router-link></li>
            <li class="breadcrumb-item active" aria-current="page">{{ account?.accountNumber }}</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2">
          <router-link to="/accounting/chart-of-accounts" class="btn btn-secondary btn-sm">
            <i class="ri-arrow-left-line me-1"></i>Back
          </router-link>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger mx-3">{{ error }}</div>

    <!-- Account Info Card -->
    <div v-else-if="account" class="row">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-header">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <h5 class="card-title mb-0">{{ account.accountNumber }} — {{ account.description }}</h5>
                <span class="text-muted">{{ getAccountTypeName(account.accountType) }} · FY {{ $route.params.fiscalYear }}</span>
              </div>
              <div class="d-flex align-items-center gap-2" v-if="account.hasProductCodes || account.hasProductYears">
                <select v-if="account.hasProductCodes" class="form-select form-select-sm" style="width: 180px;" v-model="selectedProductId" @change="refreshBalances">
                  <option :value="null">All Products</option>
                  <option v-for="p in products" :key="p.acctProductId" :value="p.acctProductId">{{ p.code }} - {{ p.description }}</option>
                </select>
                <select v-if="account.hasProductYears" class="form-select form-select-sm" style="width: 180px;" v-model="selectedProductYearId" @change="refreshBalances">
                  <option :value="null">All Years</option>
                  <option v-for="y in productYears" :key="y.acctProductYearId" :value="y.acctProductYearId">{{ y.year }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Period Panels -->
        <div class="accordion" id="periodAccordion">
          <div class="accordion-item" v-for="(period, index) in periods" :key="period.key">
            <h2 class="accordion-header">
              <button class="accordion-button" :class="{ collapsed: !period.expanded }" type="button" @click="period.expanded = !period.expanded">
                <div class="d-flex align-items-center justify-content-between w-100 me-3">
                  <strong>{{ period.label }}</strong>
                  <div class="d-flex gap-4">
                    <span class="text-muted">Beg: <strong>{{ formatCurrency(period.beginningBalance) }}</strong></span>
                    <span class="text-success">Debits: <strong>{{ formatCurrency(period.debits) }}</strong></span>
                    <span class="text-danger">Credits: <strong>{{ formatCurrency(period.credits) }}</strong></span>
                    <span>End: <strong>{{ formatCurrency(period.endingBalance) }}</strong></span>
                  </div>
                </div>
              </button>
            </h2>
            <div class="accordion-collapse collapse" :class="{ show: period.expanded }">
              <div class="accordion-body p-0">
                <div class="table-responsive" v-if="period.details && period.details.length">
                  <table class="table table-sm table-nowrap align-middle mb-0">
                    <thead class="table-light">
                      <tr>
                        <th style="width: 12%">Date</th>
                        <th style="width: 48%">Description</th>
                        <th style="width: 15%; text-align: right;">Debit</th>
                        <th style="width: 15%; text-align: right;">Credit</th>
                        <th style="width: 10%; text-align: right;">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(detail, dIdx) in period.details" :key="dIdx">
                        <td>{{ formatDate(detail.transactionDate) }}</td>
                        <td>{{ detail.description }}</td>
                        <td class="text-end">{{ detail.debit ? formatCurrency(detail.debit) : '' }}</td>
                        <td class="text-end">{{ detail.credit ? formatCurrency(detail.credit) : '' }}</td>
                        <td class="text-end">{{ formatCurrency(runningBalance(period, dIdx)) }}</td>
                      </tr>
                    </tbody>
                    <tfoot class="table-light">
                      <tr>
                        <td colspan="2" class="text-end"><strong>Period Totals:</strong></td>
                        <td class="text-end"><strong>{{ formatCurrency(period.debits) }}</strong></td>
                        <td class="text-end"><strong>{{ formatCurrency(period.credits) }}</strong></td>
                        <td class="text-end"><strong>{{ formatCurrency(period.endingBalance) }}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div v-else class="p-3 text-muted text-center">No transactions in this period.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'

const route = useRoute()
const loading = ref(true)
const error = ref(null)
const account = ref(null)
const selectedProductId = ref(null)
const selectedProductYearId = ref(null)
const products = ref([])
const productYears = ref([])

// Period definitions: maps month names to the property suffixes on AccountDetail2
const periodDefs = [
  { key: 'Jul', label: 'July',      month: 7 },
  { key: 'Aug', label: 'August',    month: 8 },
  { key: 'Sep', label: 'September', month: 9 },
  { key: 'Oct', label: 'October',   month: 10 },
  { key: 'Nov', label: 'November',  month: 11 },
  { key: 'Dec', label: 'December',  month: 12 },
  { key: 'Jan', label: 'January',   month: 1 },
  { key: 'Feb', label: 'February',  month: 2 },
  { key: 'Mar', label: 'March',     month: 3 },
  { key: 'Apr', label: 'April',     month: 4 },
  { key: 'May', label: 'May',       month: 5 },
  { key: 'Jun', label: 'June',      month: 6 },
]

const periods = reactive(periodDefs.map(p => ({
  ...p,
  expanded: false,
  beginningBalance: 0,
  debits: 0,
  credits: 0,
  endingBalance: 0,
  details: [],
})))

const accountTypeNames = { 0: 'Asset', 1: 'Liability', 2: 'Equity', 3: 'Revenue', 4: 'Expense' }
const getAccountTypeName = (typeId) => accountTypeNames[typeId] || 'Unknown'

const formatCurrency = (value) => {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString()
}

const runningBalance = (period, detailIndex) => {
  let balance = period.beginningBalance || 0
  for (let i = 0; i <= detailIndex; i++) {
    balance += (period.details[i].debit || 0) - (period.details[i].credit || 0)
  }
  return balance
}

const mapAccountToperiods = (data) => {
  periods.forEach(p => {
    p.beginningBalance = data[`beginningBalance${p.key}`] || 0
    p.debits = data[`debits${p.key}`] || 0
    p.credits = data[`credits${p.key}`] || 0
    p.details = data[`details${p.key}`] || []
    // Ending balance = beginning + debits - credits
    p.endingBalance = p.beginningBalance + p.debits - p.credits
  })
}

const loadAccount = async () => {
  loading.value = true
  error.value = null
  try {
    const { fiscalYear, accountNumber } = route.params
    const response = await api.get(`account/${fiscalYear}/${accountNumber}`)
    account.value = response.data
    mapAccountToperiods(response.data)
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to load account'
  } finally {
    loading.value = false
  }
}

const refreshBalances = async () => {
  loading.value = true
  error.value = null
  try {
    const { fiscalYear, accountNumber } = route.params
    const response = await api.post('account/filteredbalances', {
      fiscalYear: parseInt(fiscalYear),
      accountNumber,
      productId: selectedProductId.value,
      productYearId: selectedProductYearId.value,
    })
    account.value = response.data
    mapAccountToperiods(response.data)
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to refresh balances'
  } finally {
    loading.value = false
  }
}

const loadProducts = async () => {
  try {
    const response = await api.get('getsetup')
    if (Array.isArray(response.data)) {
      // Products and product years may come from admin endpoints
    }
  } catch (err) {
    // Products are optional - don't block the page
  }
}

onMounted(() => {
  loadAccount()
  loadProducts()
})
</script>

<style scoped>
.accordion-button:not(.collapsed) {
  background-color: #f3f6f9;
  color: #495057;
}
.accordion-button::after {
  margin-left: 0;
}
</style>
