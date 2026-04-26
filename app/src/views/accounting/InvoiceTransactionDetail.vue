<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Invoice Transaction — {{ invoice?.reference }}</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item"><router-link to="/accounting/invoice-transactions">Invoice Transactions</router-link></li>
            <li class="breadcrumb-item active">{{ invoice?.reference }}</li>
          </ol>
        </div>
        <div class="d-flex gap-2" v-if="invoice && !invoice.posted">
          <button class="btn btn-primary btn-sm" @click="save" :disabled="saving">
            <i class="ri-save-line me-1"></i>Save
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger mx-3">{{ error }}</div>

    <template v-else-if="invoice">
      <!-- Invoice Header Cards -->
      <div class="row">
        <div class="col-md-4">
          <div class="card">
            <div class="card-header"><h5 class="card-title mb-0">Invoice Info</h5></div>
            <div class="card-body">
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Reference</label>
                <div class="fw-semibold">{{ invoice.reference }}</div>
              </div>
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Customer</label>
                <div>{{ invoice.customerName || invoice.customerNumber }}</div>
              </div>
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Invoice Type</label>
                <select class="form-select form-select-sm" v-model="invoice.invoiceType" :disabled="invoice.posted">
                  <option value="0">Standard Invoice</option>
                  <option value="1">Finance Charge</option>
                </select>
              </div>
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Transaction Type</label>
                <select class="form-select form-select-sm" v-model="invoice.transactionType" :disabled="invoice.posted">
                  <option value="0">Invoice</option>
                  <option value="1">Cash Receipt</option>
                  <option value="2">Credit Memo</option>
                </select>
                <small v-if="invoice.transactionType == 2" class="text-danger">Credit memo — amounts should be negative</small>
              </div>
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Fiscal Year</label>
                <div>{{ invoice.fiscalYear }}</div>
              </div>
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Order Number</label>
                <input type="text" class="form-control form-control-sm" v-model="invoice.orderNumber" :disabled="invoice.posted" />
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-header"><h5 class="card-title mb-0">Amounts</h5></div>
            <div class="card-body">
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Invoice Amount</label>
                <input type="number" step="0.01" class="form-control form-control-sm" v-model.number="invoice.invoiceAmount" :disabled="invoice.posted" />
              </div>
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Invoice Remainder</label>
                <input type="number" step="0.01" class="form-control form-control-sm" v-model.number="invoice.invoiceRemainder" :disabled="invoice.posted" />
              </div>
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Tax Amount</label>
                <input type="number" step="0.01" class="form-control form-control-sm" v-model.number="invoice.taxAmount" :disabled="invoice.posted" />
              </div>
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Freight Amount</label>
                <input type="number" step="0.01" class="form-control form-control-sm" v-model.number="invoice.freightAmount" :disabled="invoice.posted" />
              </div>
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Cost</label>
                <input type="number" step="0.01" class="form-control form-control-sm" v-model.number="invoice.cost" :disabled="invoice.posted" />
              </div>
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Distributed Amount</label>
                <div class="fw-semibold">{{ formatCurrency(computedDistributed) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-header"><h5 class="card-title mb-0">Details</h5></div>
            <div class="card-body">
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Description</label>
                <textarea class="form-control form-control-sm" rows="2" v-model="invoice.description" :disabled="invoice.posted"></textarea>
              </div>
              <div class="mb-2">
                <label class="form-label text-muted mb-0">AR Control Account</label>
                <input type="text" class="form-control form-control-sm" v-model="invoice.arControlAccountNumber" :disabled="invoice.posted" />
              </div>
              <div class="mb-2">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" v-model="invoice.excludesOrderDeposit" :disabled="invoice.posted" id="excludesDeposit" />
                  <label class="form-check-label" for="excludesDeposit">Excludes Order Deposit</label>
                </div>
              </div>
              <div class="mb-2">
                <span class="badge" :class="invoice.posted ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'">
                  {{ invoice.posted ? 'Posted' : 'Unposted' }}
                </span>
                <span v-if="invoice.postingBatch" class="ms-2 text-muted">Batch: {{ invoice.postingBatch }}</span>
              </div>
              <div class="mb-2 text-muted" style="font-size: 0.8rem;">
                <div v-if="invoice.creator">Created by: {{ invoice.creator }}</div>
                <div v-if="invoice.modifier">Modified by: {{ invoice.modifier }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- GL Distribution Lines -->
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">GL Distribution Lines</h5>
          <button v-if="!invoice.posted" class="btn btn-primary btn-sm" @click="addLine">
            <i class="ri-add-line me-1"></i>Add Line
          </button>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-nowrap align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>GL Account</th>
                  <th class="text-end" style="width: 150px;">Amount</th>
                  <th>Description</th>
                  <th v-if="!invoice.posted" style="width: 50px;"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(line, idx) in invoice.glLines" :key="idx">
                  <td><input type="text" class="form-control form-control-sm" v-model="line.glAccountNumber" :disabled="invoice.posted" /></td>
                  <td><input type="number" step="0.01" class="form-control form-control-sm text-end" v-model.number="line.glAmount" :disabled="invoice.posted" /></td>
                  <td><input type="text" class="form-control form-control-sm" v-model="line.description" :disabled="invoice.posted" /></td>
                  <td v-if="!invoice.posted">
                    <button class="btn btn-danger btn-sm" @click="removeLine(idx)"><i class="ri-delete-bin-line"></i></button>
                  </td>
                </tr>
              </tbody>
              <tfoot class="table-light" v-if="invoice.glLines.length">
                <tr>
                  <td class="text-end"><strong>Total:</strong></td>
                  <td class="text-end"><strong>{{ formatCurrency(computedDistributed) }}</strong></td>
                  <td :colspan="invoice.posted ? 1 : 2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div v-if="!invoice.glLines.length" class="text-center my-4">
            <p class="text-muted">No GL distribution lines</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'

const route = useRoute()
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const invoice = ref(null)

const computedDistributed = computed(() => {
  if (!invoice.value?.glLines) return 0
  return Math.round(invoice.value.glLines.reduce((s, l) => s + (parseFloat(l.glAmount) || 0), 0) * 100) / 100
})

const formatCurrency = (value) => {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const addLine = () => {
  invoice.value.glLines.push({ multiGlId: 0, glAmount: null, glAccountNumber: '', description: '' })
}

const removeLine = (idx) => {
  invoice.value.glLines.splice(idx, 1)
}

const loadInvoice = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await api.get(`invoice-transactions/${route.params.invoiceId}`)
    invoice.value = response.data
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to load invoice transaction'
  } finally {
    loading.value = false
  }
}

const save = async () => {
  saving.value = true
  try {
    const payload = {
      invoiceId: invoice.value.invoiceId,
      reference: invoice.value.reference,
      companyId: invoice.value.companyId,
      customerId: invoice.value.customerId,
      invoiceType: invoice.value.invoiceType,
      transactionType: invoice.value.transactionType,
      invoiceAmount: invoice.value.invoiceAmount,
      invoiceRemainder: invoice.value.invoiceRemainder,
      taxAmount: invoice.value.taxAmount,
      freightAmount: invoice.value.freightAmount,
      cost: invoice.value.cost,
      distributedAmount: computedDistributed.value,
      description: invoice.value.description,
      fiscalYear: invoice.value.fiscalYear,
      orderNumber: invoice.value.orderNumber,
      excludesOrderDeposit: invoice.value.excludesOrderDeposit,
      arControlAccountNumber: invoice.value.arControlAccountNumber,
      glLines: invoice.value.glLines
    }
    const response = await api.post('invoice-transactions/save', payload)
    invoice.value = response.data
  } catch (err) {
    alert(err.response?.data || err.message || 'Failed to save invoice transaction')
  } finally {
    saving.value = false
  }
}

onMounted(loadInvoice)
</script>

<style scoped>
</style>
