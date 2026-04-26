<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Cash Receipt #{{ receipt?.reference }}</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item"><router-link to="/accounting/cash-receipts">Cash Receipts</router-link></li>
            <li class="breadcrumb-item active">{{ receipt?.reference }}</li>
          </ol>
        </div>
        <div class="d-flex gap-2" v-if="receipt && !receipt.posted">
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

    <template v-else-if="receipt">
      <!-- Receipt Header Cards -->
      <div class="row">
        <div class="col-md-4">
          <div class="card">
            <div class="card-header"><h5 class="card-title mb-0">Receipt Info</h5></div>
            <div class="card-body">
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Reference</label>
                <div class="fw-semibold">{{ receipt.reference }}</div>
              </div>
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Customer</label>
                <div>{{ receipt.customerName || receipt.customerNumber || 'Miscellaneous' }}</div>
              </div>
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Date Received</label>
                <input type="date" class="form-control form-control-sm" v-model="dateReceivedStr" :disabled="receipt.posted" />
              </div>
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Fiscal Year</label>
                <div>{{ receipt.fiscalYear }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-header"><h5 class="card-title mb-0">Amounts</h5></div>
            <div class="card-body">
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Cash Received</label>
                <input type="number" step="0.01" class="form-control form-control-sm" v-model.number="receipt.cashReceived" :disabled="receipt.posted" />
                <small v-if="receipt.cashReceived < 0" class="text-danger fw-medium">
                  <i class="ri-refund-2-line me-1"></i>This is a refund (negative amount)
                </small>
              </div>
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Distributed</label>
                <div class="fw-semibold">{{ formatCurrency(computedDistributed) }}</div>
              </div>
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Remaining Balance</label>
                <div class="fw-semibold" :class="computedRemaining < 0 ? 'text-danger' : computedRemaining === 0 ? 'text-success' : ''">
                  {{ formatCurrency(computedRemaining) }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-header"><h5 class="card-title mb-0">GL Accounts</h5></div>
            <div class="card-body">
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Entry Person</label>
                <input type="text" class="form-control form-control-sm" v-model="receipt.entryPerson" :disabled="receipt.posted" />
              </div>
              <div class="mb-2">
                <label class="form-label text-muted mb-0">Bank Number</label>
                <input type="text" class="form-control form-control-sm" v-model="receipt.bankNumber" :disabled="receipt.posted" />
              </div>
              <div class="mb-2">
                <label class="form-label text-muted mb-0">AR Control Account</label>
                <input type="text" class="form-control form-control-sm" v-model="receipt.arControlAccountNumber" :disabled="receipt.posted" />
              </div>
              <div class="mb-2">
                <label class="form-label text-muted mb-0">GL Checking Account</label>
                <input type="text" class="form-control form-control-sm" v-model="receipt.glCheckingAccountNumber" :disabled="receipt.posted" />
              </div>
              <div class="mb-2">
                <span class="badge" :class="receipt.posted ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'">
                  {{ receipt.posted ? 'Posted' : 'Unposted' }}
                </span>
                <span v-if="receipt.postingBatch" class="ms-2 text-muted">Batch: {{ receipt.postingBatch }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Apply-To Lines -->
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">Apply-To Lines</h5>
          <button v-if="!receipt.posted" class="btn btn-primary btn-sm" @click="addLine">
            <i class="ri-add-line me-1"></i>Add Line
          </button>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-nowrap align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width: 140px;">Type</th>
                  <th class="text-end" style="width: 120px;">Amount</th>
                  <th class="text-end" style="width: 100px;">Discount</th>
                  <th>Invoice Ref</th>
                  <th>Order #</th>
                  <th>GL Credit Acct</th>
                  <th>Explanation</th>
                  <th v-if="!receipt.posted" style="width: 50px;"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(line, idx) in receipt.applyToLines" :key="idx">
                  <td>
                    <select class="form-select form-select-sm" v-model.number="line.kind" :disabled="receipt.posted">
                      <option :value="1">Invoice</option>
                      <option :value="2">Deposit</option>
                      <option :value="3">Miscellaneous</option>
                    </select>
                  </td>
                  <td><input type="number" step="0.01" class="form-control form-control-sm text-end" v-model.number="line.amount" :disabled="receipt.posted" /></td>
                  <td><input type="number" step="0.01" class="form-control form-control-sm text-end" v-model.number="line.discount" :disabled="receipt.posted" /></td>
                  <td><input type="text" class="form-control form-control-sm" v-model="line.invoiceReference" :disabled="receipt.posted || line.kind !== 1" /></td>
                  <td><input type="text" class="form-control form-control-sm" v-model="line.orderNumber" :disabled="receipt.posted || line.kind !== 2" /></td>
                  <td><input type="text" class="form-control form-control-sm" v-model="line.glCreditAccountNumber" :disabled="receipt.posted || line.kind !== 3" /></td>
                  <td><input type="text" class="form-control form-control-sm" v-model="line.explanation" :disabled="receipt.posted" /></td>
                  <td v-if="!receipt.posted">
                    <button class="btn btn-danger btn-sm" @click="removeLine(idx)"><i class="ri-delete-bin-line"></i></button>
                  </td>
                </tr>
              </tbody>
              <tfoot class="table-light" v-if="receipt.applyToLines.length">
                <tr>
                  <td class="text-end"><strong>Total:</strong></td>
                  <td class="text-end"><strong>{{ formatCurrency(computedDistributed) }}</strong></td>
                  <td colspan="6"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div v-if="!receipt.applyToLines.length" class="text-center my-4">
            <p class="text-muted">No apply-to lines</p>
          </div>
        </div>
      </div>

      <!-- Attachments -->
      <div class="card" v-if="receipt.cashReceiptId">
        <div class="card-header"><h5 class="card-title mb-0">Documents</h5></div>
        <div class="card-body">
          <AttachmentPanel
            entityType="CashReceipt"
            :entityId="receipt.cashReceiptId"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'
import AttachmentPanel from '../../components/AttachmentPanel.vue'

const route = useRoute()
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const receipt = ref(null)

const dateReceivedStr = computed({
  get: () => {
    if (!receipt.value?.dateReceived) return ''
    return new Date(receipt.value.dateReceived).toISOString().split('T')[0]
  },
  set: (val) => {
    if (receipt.value) receipt.value.dateReceived = val
  }
})

const computedDistributed = computed(() => {
  if (!receipt.value?.applyToLines) return 0
  return Math.round(receipt.value.applyToLines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0) * 100) / 100
})

const computedRemaining = computed(() => {
  return Math.round(((receipt.value?.cashReceived || 0) - computedDistributed.value) * 100) / 100
})

const formatCurrency = (value) => {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const addLine = () => {
  receipt.value.applyToLines.push({
    multiApplyToId: 0, kind: 1, amount: null, discount: null,
    invoiceReference: '', orderNumber: '', depositDescription: '',
    glCreditAccountNumber: '', explanation: ''
  })
}

const removeLine = (idx) => {
  receipt.value.applyToLines.splice(idx, 1)
}

const loadReceipt = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await api.get(`cash-receipts/${route.params.reference}`)
    receipt.value = response.data
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to load cash receipt'
  } finally {
    loading.value = false
  }
}

const save = async () => {
  saving.value = true
  try {
    const payload = {
      reference: receipt.value.reference,
      companyId: receipt.value.companyId,
      customerId: receipt.value.customerId,
      dateReceived: receipt.value.dateReceived,
      entryPerson: receipt.value.entryPerson,
      bankNumber: receipt.value.bankNumber,
      arControlAccountNumber: receipt.value.arControlAccountNumber,
      glCheckingAccountNumber: receipt.value.glCheckingAccountNumber,
      cashReceived: receipt.value.cashReceived,
      distributed: computedDistributed.value,
      remainingBalance: computedRemaining.value,
      applyToLines: receipt.value.applyToLines
    }
    const response = await api.post('cash-receipts/save', payload)
    receipt.value = response.data
  } catch (err) {
    alert(err.response?.data || err.message || 'Failed to save cash receipt')
  } finally {
    saving.value = false
  }
}

onMounted(loadReceipt)
</script>

<style scoped>
</style>
