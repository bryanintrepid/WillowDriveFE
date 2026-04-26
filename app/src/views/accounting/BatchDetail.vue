<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">{{ isNew ? 'New Batch' : `Batch ${batch.batch}` }}</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item"><router-link to="/accounting/general-ledger">General Ledger</router-link></li>
            <li class="breadcrumb-item active" aria-current="page">{{ isNew ? 'New' : batch.batch }}</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2">
          <router-link to="/accounting/general-ledger" class="btn btn-secondary btn-sm">
            <i class="ri-arrow-left-line me-1"></i>Back
          </router-link>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>

    <div v-else>
      <!-- Batch Header -->
      <div class="card">
        <div class="card-header">
          <h5 class="card-title mb-0">Batch Header</h5>
        </div>
        <div class="card-body">
          <div class="row gy-3">
            <div class="col-md-3">
              <label class="form-label">Journal</label>
              <select class="form-select" v-model.number="batch.journal" :disabled="batch.posted">
                <option :value="1">General Journal</option>
                <option :value="2">Sales Journal</option>
                <option :value="3">Cash Receipts</option>
                <option :value="4">Purchase Journal</option>
                <option :value="5">Cash Disbursements</option>
                <option :value="6">Payroll Journal</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Transaction Date</label>
              <input type="date" class="form-control" v-model="transactionDateStr" :disabled="batch.posted" />
            </div>
            <div class="col-md-4">
              <label class="form-label">Description</label>
              <input type="text" class="form-control" v-model="batch.description" :disabled="batch.posted" />
            </div>
            <div class="col-md-2">
              <label class="form-label">Status</label>
              <div>
                <span class="badge" :class="batch.posted ? 'bg-success' : 'bg-warning'">
                  {{ batch.posted ? 'Posted' : 'Draft' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Line Items -->
      <div class="card">
        <div class="card-header">
          <div class="d-flex align-items-center justify-content-between">
            <h5 class="card-title mb-0">Line Items</h5>
            <button class="btn btn-primary btn-sm" @click="addLine" v-if="!batch.posted">
              <i class="ri-add-line me-1"></i>Add Line
            </button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-nowrap align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width: 25%">Account</th>
                  <th style="width: 30%">Description</th>
                  <th style="width: 17%; text-align: right;">Debit</th>
                  <th style="width: 17%; text-align: right;">Credit</th>
                  <th style="width: 11%; text-align: center;" v-if="!batch.posted">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(line, idx) in lines" :key="idx">
                  <td>
                    <input type="text" class="form-control form-control-sm" v-model="line.accountNumber"
                           placeholder="Account #" :disabled="batch.posted" />
                  </td>
                  <td>
                    <input type="text" class="form-control form-control-sm" v-model="line.description"
                           placeholder="Description" :disabled="batch.posted" />
                  </td>
                  <td>
                    <input type="number" class="form-control form-control-sm text-end" v-model.number="line.debit"
                           step="0.01" min="0" :disabled="batch.posted" @focus="clearIfZero(line, 'debit')" />
                  </td>
                  <td>
                    <input type="number" class="form-control form-control-sm text-end" v-model.number="line.credit"
                           step="0.01" min="0" :disabled="batch.posted" @focus="clearIfZero(line, 'credit')" />
                  </td>
                  <td class="text-center" v-if="!batch.posted">
                    <button class="btn btn-sm btn-danger btn-icon" @click="removeLine(idx)" title="Remove">
                      <i class="ri-delete-bin-line"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot class="table-light">
                <tr>
                  <td colspan="2" class="text-end"><strong>Totals:</strong></td>
                  <td class="text-end"><strong>{{ formatCurrency(totalDebit) }}</strong></td>
                  <td class="text-end"><strong>{{ formatCurrency(totalCredit) }}</strong></td>
                  <td class="text-center" v-if="!batch.posted">
                    <span class="badge" :class="isBalanced ? 'bg-success' : 'bg-danger'">
                      {{ isBalanced ? 'Balanced' : `Off by ${formatCurrency(Math.abs(totalDebit - totalCredit))}` }}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="d-flex justify-content-end gap-2 mb-4" v-if="!batch.posted">
        <button class="btn btn-primary" @click="saveBatch" :disabled="!isBalanced || saving">
          <i class="ri-save-line me-1"></i>{{ saving ? 'Saving...' : 'Post Batch' }}
        </button>
      </div>

      <!-- Error -->
      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>
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
const successMsg = ref(null)

const props = defineProps({
  companyName: String,
  fiscalYear: String,
  batchNumber: String,
})

const isNew = computed(() => props.batchNumber === 'new')

const batch = reactive({
  glTransactionId: null,
  batch: null,
  companyId: 1,
  journal: 1,
  transactionDate: null,
  description: '',
  period13: false,
  reversible: true,
  posted: false,
})

const transactionDateStr = computed({
  get: () => {
    if (!batch.transactionDate) return ''
    const d = new Date(batch.transactionDate)
    return d.toISOString().split('T')[0]
  },
  set: (val) => {
    batch.transactionDate = val ? new Date(val) : null
  }
})

const lines = reactive([])

const totalDebit = computed(() => lines.reduce((sum, l) => sum + (l.debit || 0), 0))
const totalCredit = computed(() => lines.reduce((sum, l) => sum + (l.credit || 0), 0))
const isBalanced = computed(() => Math.abs(totalDebit.value - totalCredit.value) < 0.005 && lines.length > 0)

const formatCurrency = (value) => {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const addLine = () => {
  lines.push({ accountNumber: '', description: '', debit: 0, credit: 0, productId: null, productYearId: null })
}

const removeLine = (idx) => {
  lines.splice(idx, 1)
}

const clearIfZero = (line, field) => {
  if (line[field] === 0) line[field] = null
}

const loadBatch = async () => {
  loading.value = true
  try {
    if (isNew.value) {
      batch.transactionDate = new Date()
      batch.journal = 1
      addLine()
      addLine()
    } else {
      const fy = props.fiscalYear || new Date().getFullYear()
      const response = await api.get(`batch/${fy}/${props.batchNumber}`)
      const data = response.data
      Object.assign(batch, {
        glTransactionId: data.glTransactionId,
        batch: data.batch,
        companyId: data.companyId || 1,
        journal: data.journal || 1,
        transactionDate: data.transactionDate,
        description: data.description,
        period13: data.period13,
        reversible: data.reversible,
        posted: data.posted,
      })
      lines.length = 0
      if (data.lines && data.lines.length) {
        data.lines.forEach(l => lines.push({ ...l }))
      }
    }
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to load batch'
  } finally {
    loading.value = false
  }
}

const saveBatch = async () => {
  saving.value = true
  error.value = null
  successMsg.value = null
  try {
    const fy = parseInt(props.fiscalYear) || new Date().getFullYear()
    const response = await api.post('batch/save', {
      companyId: batch.companyId,
      fiscalYear: fy,
      batch: batch.batch,
      journal: batch.journal,
      transactionDate: batch.transactionDate,
      description: batch.description,
      period13: batch.period13,
      reversible: batch.reversible,
      lines: lines.map(l => ({
        accountNumber: l.accountNumber,
        debit: l.debit || 0,
        credit: l.credit || 0,
        description: l.description,
        productId: l.productId,
        productYearId: l.productYearId,
      })),
    })
    successMsg.value = `Batch ${response.data.batch} posted successfully.`
    batch.posted = true
    batch.batch = response.data.batch
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to save batch'
  } finally {
    saving.value = false
  }
}

onMounted(loadBatch)
</script>

<style scoped>
</style>
