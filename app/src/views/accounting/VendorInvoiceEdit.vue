<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">{{ isCreditMemo ? 'Vendor Credit Memo' : 'Vendor Invoice' }}</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item">Payables</li>
            <li class="breadcrumb-item"><router-link to="/accounting/vendor-invoices">Invoices</router-link></li>
            <li class="breadcrumb-item active">{{ isNew ? 'New' : 'Edit' }}</li>
          </ol>
        </div>
        <div class="d-flex gap-2">
          <span v-if="isCreditMemo" class="badge bg-danger fs-6 align-self-center">Credit Memo</span>
          <router-link to="/accounting/vendor-invoices" class="btn btn-secondary btn-sm">
            <i class="ri-arrow-left-line me-1"></i>Back
          </router-link>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- Form -->
    <div v-else>
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">{{ isCreditMemo ? 'Credit Memo Details' : 'Invoice Details' }}</h5>
          <button class="btn btn-primary btn-sm" @click="save" :disabled="saving">
            <i class="ri-save-line me-1"></i>{{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
        <div class="card-body">
          <div class="row mb-3">
            <div class="col-md-4">
              <label class="form-label">Vendor *</label>
              <select class="form-select" v-model="form.vendorId" @change="onVendorChange">
                <option value="">Select vendor...</option>
                <option v-for="v in vendors" :key="v.vendorId" :value="v.vendorId">
                  {{ v.name }}
                </option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">{{ isCreditMemo ? 'Credit Memo #' : 'Invoice #' }} *</label>
              <input type="text" class="form-control" v-model="form.invoiceNumber" />
            </div>
            <div class="col-md-4">
              <label class="form-label">Fiscal Year</label>
              <input type="number" class="form-control" v-model.number="form.fiscalYear" />
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-4">
              <label class="form-label">Invoice Date *</label>
              <input type="date" class="form-control" v-model="form.invoiceDate" />
            </div>
            <div class="col-md-4">
              <label class="form-label">Due Date</label>
              <input type="date" class="form-control" v-model="form.dueDate" />
            </div>
            <div class="col-md-4">
              <label class="form-label">Purchaser</label>
              <input type="text" class="form-control" v-model="form.purchaser" />
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-8">
              <label class="form-label">Description</label>
              <input type="text" class="form-control" v-model="form.description" />
            </div>
            <div class="col-md-2">
              <label class="form-label">Tax</label>
              <input type="number" class="form-control" v-model.number="form.taxAmount" step="0.01" min="0" />
            </div>
            <div class="col-md-2">
              <label class="form-label">Freight</label>
              <input type="number" class="form-control" v-model.number="form.freightAmount" step="0.01" min="0" />
            </div>
          </div>
          <div class="form-check mb-3">
            <input class="form-check-input" type="checkbox" id="holdCheck" v-model="form.hold">
            <label class="form-check-label" for="holdCheck">Hold (prevent from being paid)</label>
          </div>
        </div>
      </div>

      <!-- GL Distribution Lines -->
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">GL Distribution</h5>
          <button class="btn btn-outline-primary btn-sm" @click="addLine">
            <i class="ri-add-line me-1"></i>Add Line
          </button>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-nowrap align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width: 5%">#</th>
                  <th style="width: 30%">GL Account</th>
                  <th style="width: 35%">Description</th>
                  <th style="width: 20%" class="text-end">Amount</th>
                  <th style="width: 10%"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(line, idx) in form.lines" :key="idx">
                  <td>{{ idx + 1 }}</td>
                  <td>
                    <select class="form-select form-select-sm" v-model="line.accountNumber">
                      <option value="">Select...</option>
                      <option v-for="a in glAccounts" :key="a.accountNumber" :value="a.accountNumber">
                        {{ a.accountNumber }} - {{ a.description }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <input type="text" class="form-control form-control-sm" v-model="line.description" placeholder="Description" />
                  </td>
                  <td>
                    <input type="number" class="form-control form-control-sm text-end" v-model.number="line.amount" step="0.01" min="0" />
                  </td>
                  <td class="text-center">
                    <button class="btn btn-soft-danger btn-sm" @click="removeLine(idx)" v-if="form.lines.length > 1">
                      <i class="ri-delete-bin-line"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot class="table-light">
                <tr>
                  <td colspan="3" class="text-end"><strong>Lines Subtotal:</strong></td>
                  <td class="text-end"><strong>{{ formatCurrency(linesTotal) }}</strong></td>
                  <td></td>
                </tr>
                <tr>
                  <td colspan="3" class="text-end"><strong>Total (with tax/freight):</strong></td>
                  <td class="text-end"><strong :class="{ 'text-danger': isCreditMemo }">{{ formatCurrency(grandTotal) }}</strong></td>
                  <td></td>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../services/api'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const vendors = ref([])
const glAccounts = ref([])

const isNew = computed(() => !route.params.invoiceId)
const isCreditMemo = computed(() => route.query.credit === '1' || form.isCreditMemo)

const currentFY = computed(() => {
  const now = new Date()
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
})

const form = reactive({
  vendorInvoiceId: 0,
  vendorId: '',
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  fiscalYear: 0,
  invoiceAmount: 0,
  taxAmount: 0,
  freightAmount: 0,
  isCreditMemo: false,
  hold: false,
  description: '',
  purchaser: '',
  lines: [{ accountNumber: '', amount: 0, description: '' }]
})

const linesTotal = computed(() => form.lines.reduce((sum, l) => sum + (l.amount || 0), 0))
const grandTotal = computed(() => {
  const total = linesTotal.value + (form.taxAmount || 0) + (form.freightAmount || 0)
  return isCreditMemo.value ? -Math.abs(total) : total
})

const formatCurrency = (value) => {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const addLine = () => {
  form.lines.push({ accountNumber: '', amount: 0, description: '' })
}

const removeLine = (idx) => {
  form.lines.splice(idx, 1)
}

const onVendorChange = () => {
  const vendor = vendors.value.find(v => v.vendorId === form.vendorId)
  if (vendor?.defaultExpenseAccount && form.lines.length === 1 && !form.lines[0].accountNumber) {
    form.lines[0].accountNumber = vendor.defaultExpenseAccount
  }
}

const flattenAccounts = (accounts, result = []) => {
  for (const a of accounts) {
    result.push(a)
    if (a.children) flattenAccounts(a.children, result)
  }
  return result
}

const loadLookups = async () => {
  try {
    const [vendorResp, accountResp] = await Promise.all([
      api.get('vendors', { params: { pageSize: 500 } }).catch(() => ({ data: [] })),
      api.get('accounts', { params: { fiscalYear: currentFY.value } }).catch(() => ({ data: [] }))
    ])
    const vendorData = vendorResp.data
    vendors.value = Array.isArray(vendorData) ? vendorData : vendorData?.items || []
    const flat = flattenAccounts(accountResp.data || [])
    glAccounts.value = flat.filter(a => !a.isRollup)
  } catch (err) {
    console.error('Failed to load lookups:', err)
  }
}

const loadInvoice = async (invoiceId) => {
  try {
    const response = await api.get(`vendor-invoices/${invoiceId}`)
    const inv = response.data
    form.vendorInvoiceId = inv.vendorInvoiceId
    form.vendorId = inv.vendorId
    form.invoiceNumber = inv.invoiceNumber
    form.invoiceDate = inv.invoiceDate?.split('T')[0] || ''
    form.dueDate = inv.dueDate?.split('T')[0] || ''
    form.fiscalYear = inv.fiscalYear
    form.invoiceAmount = Math.abs(inv.invoiceAmount || inv.totalAmount || 0)
    form.taxAmount = Math.abs(inv.taxAmount || 0)
    form.freightAmount = Math.abs(inv.freightAmount || 0)
    form.isCreditMemo = inv.isCreditMemo
    form.hold = inv.hold
    form.description = inv.description || ''
    form.purchaser = inv.purchaser || ''
    form.lines = (inv.lines || []).map(l => ({
      accountNumber: l.accountNumber || '',
      amount: Math.abs(l.amount || 0),
      description: l.description || ''
    }))
    if (!form.lines.length) form.lines = [{ accountNumber: '', amount: 0, description: '' }]
  } catch (err) {
    error.value = err.response?.data || 'Failed to load invoice'
  }
}

const save = async () => {
  if (!form.vendorId) { alert('Please select a vendor'); return }
  if (!form.invoiceNumber) { alert('Please enter an invoice number'); return }

  saving.value = true
  try {
    const payload = {
      vendorId: form.vendorId,
      invoiceNumber: form.invoiceNumber,
      invoiceDate: form.invoiceDate,
      dueDate: form.dueDate || null,
      fiscalYear: form.fiscalYear,
      invoiceAmount: linesTotal.value,
      taxAmount: form.taxAmount || 0,
      freightAmount: form.freightAmount || 0,
      isCreditMemo: isCreditMemo.value,
      hold: form.hold,
      description: form.description,
      purchaser: form.purchaser,
      lines: form.lines.filter(l => l.accountNumber && l.amount).map(l => ({
        accountNumber: l.accountNumber,
        amount: l.amount,
        description: l.description
      }))
    }

    let response
    if (form.vendorInvoiceId) {
      response = await api.put(`vendor-invoices/${form.vendorInvoiceId}`, payload)
    } else {
      response = await api.post('vendor-invoices', payload)
    }

    const saved = response.data
    router.push({ name: 'accounting-payables-invoices-detail', params: { vendorId: saved.vendorId, invoiceNumber: saved.invoiceNumber } })
  } catch (err) {
    alert(err.response?.data || 'Failed to save')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  form.fiscalYear = currentFY.value
  if (route.query.credit === '1') {
    form.isCreditMemo = true
  }
  await loadLookups()
  if (route.params.invoiceId) {
    await loadInvoice(route.params.invoiceId)
  }
  loading.value = false
})
</script>

<style scoped>
</style>
