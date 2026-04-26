<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">{{ isNew ? 'New Expense Report' : report?.reportNumber || 'Expense Report' }}</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item"><router-link to="/accounting/expense-reports">Expense Reports</router-link></li>
            <li class="breadcrumb-item active">{{ isNew ? 'New' : report?.reportNumber }}</li>
          </ol>
        </div>
        <div class="d-flex gap-2" v-if="report">
          <span class="badge fs-6" :class="getStatusClass(report.status)">{{ report.status }}</span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- Report Form/View -->
    <div v-else class="row">
      <!-- Left: Main Form -->
      <div class="col-lg-8">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">Expense Details</h5>
            <div class="d-flex gap-2">
              <button v-if="canEdit" class="btn btn-primary btn-sm" @click="save" :disabled="saving">
                <i class="ri-save-line me-1"></i>{{ saving ? 'Saving...' : 'Save' }}
              </button>
              <button v-if="report?.canSubmit" class="btn btn-outline-warning btn-sm" @click="submitReport">
                <i class="ri-send-plane-line me-1"></i>Submit
              </button>
              <button v-if="report?.canApprove" class="btn btn-success btn-sm" @click="approve">
                <i class="ri-check-line me-1"></i>Approve
              </button>
              <button v-if="report?.canReject" class="btn btn-outline-danger btn-sm" @click="reject">
                <i class="ri-close-line me-1"></i>Reject
              </button>
              <button v-if="report?.canPay" class="btn btn-primary btn-sm" @click="showPayModal = true">
                <i class="ri-money-dollar-circle-line me-1"></i>Mark Paid
              </button>
            </div>
          </div>
          <div class="card-body">
            <!-- Rejection alert -->
            <div v-if="report?.status === 'Rejected' && report?.rejectionReason" class="alert alert-danger mb-3">
              <strong>Rejected:</strong> {{ report.rejectionReason }}
            </div>

            <div class="row mb-3">
              <div class="col-md-4">
                <label class="form-label">Employee <span class="text-danger">*</span></label>
                <select class="form-select" v-model="form.employeeId" :disabled="!canEdit" required>
                  <option value="">Select employee...</option>
                  <option v-for="emp in employees" :key="emp.employeeId" :value="emp.employeeId">
                    {{ emp.name || emp.employeeNumber }}
                  </option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Period Start <span class="text-danger">*</span></label>
                <input type="date" class="form-control" v-model="form.periodStart" :disabled="!canEdit" required />
              </div>
              <div class="col-md-4">
                <label class="form-label">Period End <span class="text-danger">*</span></label>
                <input type="date" class="form-control" v-model="form.periodEnd" :disabled="!canEdit" required />
              </div>
            </div>

            <!-- Line Items -->
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="form-label mb-0">Expense Line Items</label>
                <button v-if="canEdit" class="btn btn-outline-primary btn-sm" @click="addLine">
                  <i class="ri-add-line me-1"></i>Add Line
                </button>
              </div>
              <div class="table-responsive">
                <table class="table table-sm table-bordered mb-0">
                  <thead class="table-light">
                    <tr>
                      <th style="width: 40px">#</th>
                      <th style="width: 110px">Date</th>
                      <th style="width: 120px">Category</th>
                      <th>Description</th>
                      <th style="width: 150px">GL Account</th>
                      <th style="width: 110px" class="text-end">Amount</th>
                      <th style="width: 90px" class="text-center">Receipt</th>
                      <th v-if="canEdit" style="width: 50px"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(line, idx) in form.lines" :key="idx">
                      <td class="text-muted">{{ idx + 1 }}</td>
                      <td>
                        <input v-if="canEdit" type="date" class="form-control form-control-sm"
                               v-model="line.expenseDate" />
                        <span v-else>{{ formatDate(line.expenseDate) }}</span>
                      </td>
                      <td>
                        <select v-if="canEdit" class="form-select form-select-sm" v-model="line.category">
                          <option value="">Select...</option>
                          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                        </select>
                        <span v-else>{{ line.category }}</span>
                      </td>
                      <td>
                        <input v-if="canEdit" type="text" class="form-control form-control-sm"
                               v-model="line.description" placeholder="Description" />
                        <span v-else>{{ line.description }}</span>
                      </td>
                      <td>
                        <select v-if="canEdit" class="form-select form-select-sm" v-model="line.glAccountNumber">
                          <option value="">Select...</option>
                          <option v-for="a in expenseAccounts" :key="a.accountNumber" :value="a.accountNumber">
                            {{ a.accountNumber }} - {{ a.description }}
                          </option>
                        </select>
                        <span v-else>{{ line.glAccountNumber }}
                          <small v-if="line.glAccountDescription" class="text-muted d-block">{{ line.glAccountDescription }}</small>
                        </span>
                      </td>
                      <td>
                        <template v-if="line.category === 'Mileage' && canEdit">
                          <div class="input-group input-group-sm">
                            <input type="number" class="form-control text-end" v-model.number="line.miles" step="0.1" placeholder="Miles" style="width: 60px" />
                            <span class="input-group-text" style="font-size: 0.75rem">mi</span>
                          </div>
                          <small class="text-muted">{{ formatCurrency(line.miles * mileageRate) }}</small>
                        </template>
                        <template v-else>
                          <input v-if="canEdit" type="number" class="form-control form-control-sm text-end"
                                 v-model.number="line.amount" step="0.01" />
                          <span v-else class="text-end d-block">{{ formatCurrency(line.amount) }}</span>
                        </template>
                      </td>
                      <td class="text-center">
                        <template v-if="canEdit">
                          <input type="checkbox" class="form-check-input" v-model="line.hasReceipt" />
                        </template>
                        <template v-else>
                          <i v-if="line.hasReceipt" class="ri-checkbox-circle-fill text-success"></i>
                          <i v-else class="ri-close-circle-line text-muted"></i>
                        </template>
                        <small v-if="line.attachmentCount > 0" class="d-block text-muted">
                          {{ line.attachmentCount }} file{{ line.attachmentCount > 1 ? 's' : '' }}
                        </small>
                      </td>
                      <td v-if="canEdit">
                        <button class="btn btn-link btn-sm text-danger p-0" @click="removeLine(idx)">
                          <i class="ri-delete-bin-line"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot class="table-light">
                    <tr class="fw-bold">
                      <td :colspan="canEdit ? 5 : 5" class="text-end">Total:</td>
                      <td class="text-end">{{ formatCurrency(totalAmount) }}</td>
                      <td></td>
                      <td v-if="canEdit"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Receipt Upload (for saved reports) -->
            <div v-if="!isNew && report && selectedLineForUpload != null" class="card bg-light mb-3">
              <div class="card-body">
                <h6>Upload Receipt for Line {{ selectedLineForUpload + 1 }}</h6>
                <input type="file" class="form-control form-control-sm" @change="uploadReceipt" accept="image/*,.pdf" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Info Panel -->
      <div class="col-lg-4">
        <!-- Report Info -->
        <div class="card" v-if="report && !isNew">
          <div class="card-header"><h5 class="card-title mb-0">Info</h5></div>
          <div class="card-body">
            <div class="mb-2"><strong>Report #:</strong> {{ report.reportNumber }}</div>
            <div class="mb-2"><strong>Employee:</strong> {{ report.employeeName }}</div>
            <div class="mb-2"><strong>Created:</strong> {{ formatDateTime(report.dateCreated) }}</div>
            <div class="mb-2" v-if="report.creator"><strong>Created By:</strong> {{ report.creator }}</div>
            <div class="mb-2" v-if="report.submittedDate"><strong>Submitted:</strong> {{ formatDate(report.submittedDate) }}</div>
            <hr>
            <div class="mb-2"><strong>Total:</strong> {{ formatCurrency(report.totalAmount) }}</div>
            <div class="mb-2" v-if="report.approvedAmount != null">
              <strong>Approved:</strong> <span class="text-success fw-bold">{{ formatCurrency(report.approvedAmount) }}</span>
            </div>
            <div class="mb-2" v-if="report.approvedBy">
              <strong>Approved By:</strong> {{ report.approvedBy }}<br>
              <small class="text-muted">{{ formatDateTime(report.approvedAt) }}</small>
            </div>
            <div class="mb-2" v-if="report.glBatch">
              <strong>GL Batch:</strong> {{ report.glBatch }}
            </div>
            <hr v-if="report.paymentMethod">
            <div class="mb-2" v-if="report.paymentMethod">
              <strong>Payment:</strong> {{ report.paymentMethod }}
              <span v-if="report.paymentReference"> - {{ report.paymentReference }}</span>
            </div>
            <div v-if="report.paidAt">
              <strong>Paid:</strong> {{ formatDateTime(report.paidAt) }}
            </div>
          </div>
        </div>

        <!-- Receipt Attachments -->
        <div class="card" v-if="report && !isNew">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">Receipts</h5>
          </div>
          <div class="card-body">
            <div v-for="(line, idx) in report.lines" :key="line.expenseLineId" class="mb-2">
              <div class="d-flex justify-content-between align-items-center">
                <small class="fw-medium">Line {{ idx + 1 }}: {{ line.description }}</small>
                <button v-if="canEdit" class="btn btn-outline-secondary btn-sm py-0 px-1"
                        @click="selectedLineForUpload = (selectedLineForUpload === idx ? null : idx)">
                  <i class="ri-upload-2-line"></i>
                </button>
              </div>
              <div v-if="line.attachmentCount > 0" class="small text-success">
                <i class="ri-attachment-2"></i> {{ line.attachmentCount }} receipt{{ line.attachmentCount > 1 ? 's' : '' }}
              </div>
              <div v-else class="small text-muted">No receipt</div>
              <!-- Upload form inline -->
              <div v-if="selectedLineForUpload === idx && canEdit" class="mt-1">
                <input type="file" class="form-control form-control-sm" @change="(e) => uploadReceipt(e, line.expenseLineId)" accept="image/*,.pdf" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pay Modal -->
    <div class="modal fade" :class="{ show: showPayModal }" :style="{ display: showPayModal ? 'block' : 'none' }"
         tabindex="-1" v-if="showPayModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Mark as Paid - {{ report?.reportNumber }}</h5>
            <button type="button" class="btn-close" @click="showPayModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Payment Method</label>
              <select class="form-select" v-model="payForm.paymentMethod">
                <option value="Check">Check</option>
                <option value="DirectDeposit">Direct Deposit</option>
                <option value="Payroll">Payroll</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Reference (check #, etc.)</label>
              <input type="text" class="form-control" v-model="payForm.paymentReference"
                     placeholder="Optional reference number" />
            </div>
            <div class="mb-3">
              <strong>Amount:</strong> {{ formatCurrency(report?.approvedAmount || report?.totalAmount) }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showPayModal = false">Cancel</button>
            <button class="btn btn-primary" @click="submitPay">
              <i class="ri-money-dollar-circle-line me-1"></i>Mark Paid
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" v-if="showPayModal"></div>
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
const report = ref(null)
const employees = ref([])
const expenseAccounts = ref([])
const showPayModal = ref(false)
const selectedLineForUpload = ref(null)

const categories = ['Travel', 'Meals', 'Supplies', 'Mileage', 'Lodging', 'Fuel', 'Equipment', 'Other']
const mileageRate = 0.70  // 2025 IRS standard rate

const isNew = computed(() => !route.params.id || route.params.id === 'new')
const canEdit = computed(() => isNew.value || report.value?.canEdit)

const form = reactive({
  expenseReportId: null,
  employeeId: '',
  periodStart: new Date().toISOString().split('T')[0],
  periodEnd: new Date().toISOString().split('T')[0],
  lines: []
})

const payForm = reactive({
  paymentMethod: 'Check',
  paymentReference: ''
})

const totalAmount = computed(() => {
  return form.lines.reduce((sum, l) => {
    if (l.category === 'Mileage') {
      return sum + ((l.miles || 0) * mileageRate)
    }
    return sum + (l.amount || 0)
  }, 0)
})

const formatCurrency = (value) => {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const getStatusClass = (status) => {
  switch (status) {
    case 'Draft': return 'bg-secondary'
    case 'Submitted': return 'bg-warning'
    case 'Approved': return 'bg-success'
    case 'Rejected': return 'bg-danger'
    case 'Paid': return 'bg-primary'
    default: return 'bg-light text-dark'
  }
}

const addLine = () => {
  form.lines.push({
    expenseLineId: null,
    expenseDate: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: 0,
    glAccountNumber: '',
    productId: null,
    miles: null,
    mileageRate: null,
    hasReceipt: false,
    attachmentCount: 0
  })
}

const removeLine = (idx) => {
  form.lines.splice(idx, 1)
}

const loadReport = async () => {
  if (isNew.value) {
    loading.value = false
    addLine()
    return
  }

  try {
    const response = await api.get(`expense-reports/${route.params.id}`)
    report.value = response.data

    // Populate form
    form.expenseReportId = report.value.expenseReportId
    form.employeeId = report.value.employeeId
    form.periodStart = report.value.periodStart?.split('T')[0] || ''
    form.periodEnd = report.value.periodEnd?.split('T')[0] || ''
    form.lines = report.value.lines.map(l => ({
      expenseLineId: l.expenseLineId,
      expenseDate: l.expenseDate?.split('T')[0] || '',
      category: l.category,
      description: l.description,
      amount: l.amount,
      glAccountNumber: l.glAccountNumber,
      productId: l.productId,
      miles: l.miles,
      mileageRate: l.mileageRate,
      hasReceipt: l.hasReceipt,
      attachmentCount: l.attachmentCount || 0
    }))
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load expense report'
  } finally {
    loading.value = false
  }
}

const loadEmployees = async () => {
  try {
    const response = await api.get('getEmployees')
    employees.value = response.data
  } catch (err) {
    console.error('Failed to load employees:', err)
  }
}

const flattenAccounts = (accounts, result = []) => {
  for (const a of accounts) {
    result.push(a)
    if (a.children) flattenAccounts(a.children, result)
  }
  return result
}

const loadAccounts = async () => {
  try {
    const fy = new Date().getMonth() >= 6 ? new Date().getFullYear() : new Date().getFullYear() - 1
    const response = await api.get('accounts', { params: { fiscalYear: fy } })
    const flat = flattenAccounts(response.data)
    expenseAccounts.value = flat.filter(a => a.type === 4 && !a.isRollup)
  } catch (err) {
    console.error('Failed to load accounts:', err)
  }
}

const save = async () => {
  if (!form.employeeId) {
    alert('Please select an employee')
    return
  }
  if (form.lines.length === 0) {
    alert('Please add at least one line item')
    return
  }

  saving.value = true
  try {
    const payload = {
      ...form,
      lines: form.lines.map(l => {
        const line = {
          expenseLineId: l.expenseLineId,
          expenseDate: l.expenseDate,
          category: l.category,
          description: l.description,
          amount: l.category === 'Mileage' ? (l.miles || 0) * mileageRate : l.amount,
          glAccountNumber: l.glAccountNumber,
          productId: l.productId,
          miles: l.category === 'Mileage' ? l.miles : null,
          mileageRate: l.category === 'Mileage' ? mileageRate : null,
          hasReceipt: l.hasReceipt
        }
        return line
      })
    }

    const response = await api.post('expense-reports', payload)

    if (isNew.value) {
      router.replace(`/accounting/expense-reports/${response.data.expenseReportId}`)
    } else {
      report.value = response.data
      // Re-populate form from response
      form.lines = response.data.lines.map(l => ({
        expenseLineId: l.expenseLineId,
        expenseDate: l.expenseDate?.split('T')[0] || '',
        category: l.category,
        description: l.description,
        amount: l.amount,
        glAccountNumber: l.glAccountNumber,
        productId: l.productId,
        miles: l.miles,
        mileageRate: l.mileageRate,
        hasReceipt: l.hasReceipt,
        attachmentCount: l.attachmentCount || 0
      }))
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to save expense report')
  } finally {
    saving.value = false
  }
}

const submitReport = async () => {
  if (!confirm('Submit this expense report for approval?')) return
  try {
    await api.post(`expense-reports/${report.value.expenseReportId}/submit`)
    await loadReport()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to submit')
  }
}

const approve = async () => {
  if (!confirm('Approve this expense report?')) return
  try {
    await api.post(`expense-reports/${report.value.expenseReportId}/approve`, {})
    await loadReport()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to approve')
  }
}

const reject = async () => {
  const reason = prompt('Reason for rejection:')
  if (!reason) return
  try {
    await api.post(`expense-reports/${report.value.expenseReportId}/reject`, { reason })
    await loadReport()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to reject')
  }
}

const submitPay = async () => {
  try {
    await api.post(`expense-reports/${report.value.expenseReportId}/pay`, payForm)
    showPayModal.value = false
    await loadReport()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to mark as paid')
  }
}

const uploadReceipt = async (event, lineId) => {
  const file = event.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)
  formData.append('description', 'Expense receipt')

  try {
    await api.post(`attachments/ExpenseReportLine/${lineId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    selectedLineForUpload.value = null
    await loadReport()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to upload receipt')
  }
}

onMounted(() => {
  loadEmployees()
  loadAccounts()
  loadReport()
})
</script>

<style scoped>
.modal.show { display: block; }
</style>
